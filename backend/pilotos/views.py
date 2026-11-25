from rest_framework import viewsets, mixins, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.http import HttpResponse

from .models import Mision
from .serializers import MisionSerializer, CambiarEstadoSerializer, HistorialMisionSerializer
from .servicios import ServicioMisionPiloto
from .politicas import SelectorPoliticas
from .exportadores import generar_pdf_bitacora

class MisionViewSet(
    mixins.ListModelMixin, 
    mixins.RetrieveModelMixin, 
    mixins.UpdateModelMixin, 
    mixins.CreateModelMixin, 
    viewsets.GenericViewSet
):
    serializer_class = MisionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        usuario = self.request.user
        
        if usuario.is_staff:
            queryset = Mision.objects.all()
        elif hasattr(usuario, 'perfil_piloto'):
            queryset = Mision.objects.filter(
                Q(piloto=usuario.perfil_piloto) |
                Q(piloto__isnull=True, tipo_mision=Mision.TipoMision.TERCEROS, estado=Mision.Estado.PENDIENTE)
            )
        else:
            nombre_completo = f"{usuario.first_name} {usuario.last_name}".strip()
            if not nombre_completo:
                nombre_completo = usuario.email
            queryset = Mision.objects.filter(
                cliente_nombre=nombre_completo,
                tipo_mision=Mision.TipoMision.TERCEROS
            )

        tipo_mision = self.request.query_params.get('tipo_mision', None)
        if tipo_mision:
            queryset = queryset.filter(tipo_mision=tipo_mision)

        estado = self.request.query_params.get('estado', None)
        if estado:
            queryset = queryset.filter(estado=estado)

        return queryset.order_by('-fecha_programada')

    def perform_create(self, serializer):
        usuario = self.request.user
        nombre_completo = f"{usuario.first_name} {usuario.last_name}".strip()
        if not nombre_completo:
            nombre_completo = usuario.email

        serializer.save(
            cliente_nombre=nombre_completo,
            tipo_mision=Mision.TipoMision.TERCEROS
        )

    @action(detail=True, methods=['patch'])
    def cambiar_estado(self, request, pk=None):
        mision = self.get_object()
        
        serializer = CambiarEstadoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        nuevo_estado = serializer.validated_data['estado']

        if mision.piloto_id is None and nuevo_estado == Mision.Estado.ACEPTADA and hasattr(request.user, 'perfil_piloto'):
            mision.piloto = request.user.perfil_piloto
            mision.save()

        politica = SelectorPoliticas.obtener(request.user, nuevo_estado)
        politica.autorizar(request.user, mision)

        try:
            mision_actualizada = ServicioMisionPiloto.cambiar_estado(mision, nuevo_estado)
            return Response(MisionSerializer(mision_actualizada).data, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='historial')
    def historial(self, request):
        usuario = request.user
        
        if not hasattr(usuario, 'perfil_piloto'):
            return Response(
                {'detail': 'Solo un piloto puede consultar su historial.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        piloto = usuario.perfil_piloto
        
        misiones_completadas = Mision.objects.filter(
            piloto=piloto, 
            estado=Mision.Estado.COMPLETADA,
            tipo_mision=Mision.TipoMision.TERCEROS
        ).order_by('-fecha_programada')

        filtro_categoria = request.query_params.get('categoria')
        if filtro_categoria:
            misiones_completadas = misiones_completadas.filter(categoria=filtro_categoria)

        serializer = HistorialMisionSerializer(misiones_completadas, many=True)
        
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='exportar-pdf')
    def exportar_pdf(self, request):
        usuario = request.user

        if not hasattr(usuario, 'perfil_piloto'):
            return Response(
                {'detail': 'Solo un piloto puede exportar su bitácora.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        piloto = usuario.perfil_piloto
        misiones = self.get_queryset()

        busqueda = (request.query_params.get('busqueda') or '').strip()
        filtro = (request.query_params.get('filtro') or 'todos').strip()

        if busqueda:
            misiones = misiones.filter(
                Q(ubicacion__icontains=busqueda)
                | Q(descripcion__icontains=busqueda)
                | Q(dron_asignado__icontains=busqueda)
                | Q(categoria__icontains=busqueda)
                | Q(cliente_nombre__icontains=busqueda)
            )

        estados_por_filtro = {
            'todos': None,
            'completados': ['COMPLETADA'],
            'en_proceso': ['ACEPTADA', 'EN_CURSO'],
            'alertas': ['RECHAZADA', 'CANCELADA'],
            'pendientes': ['PENDIENTE'],
        }
        estados = estados_por_filtro.get(filtro)
        if estados:
            misiones = misiones.filter(estado__in=estados)

        misiones = misiones.order_by('-fecha_programada')

        pdf_bytes = generar_pdf_bitacora(
            piloto,
            list(misiones),
            filtro=filtro,
            busqueda=busqueda,
        )

        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="bitacora_vuelos.pdf"'
        return response