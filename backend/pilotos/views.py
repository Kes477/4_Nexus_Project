from datetime import timedelta

from rest_framework import viewsets, mixins, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.db.models import Q
from django.http import HttpResponse
from django.utils import timezone

from .models import Mision
from .serializers import MisionSerializer, CambiarEstadoSerializer, HistorialMisionSerializer
from .servicios import ServicioMisionPiloto
from .politicas import SelectorPoliticas
from .exportadores import generar_pdf_bitacora, generar_pdf_facturacion

TARIFA_RESPALDO = {
    'fumigacion': 120, 'agronomia': 120, 'agricultura': 120,
    'inspeccion_industrial': 150, 'audiovisual_pro': 100,
    'fotografia': 100, 'carreras_fpv': 100, 'topografia': 130,
    'vigilancia': 90, 'seguridad': 90,
}


def _rango_periodo(key):
    hoy = timezone.localdate()
    if key == 'semanal':
        return hoy - timedelta(days=6), hoy
    if key == 'mensual':
        desde = hoy.replace(day=1)
        siguiente = (desde + timedelta(days=32)).replace(day=1)
        hasta = siguiente - timedelta(days=1)
        return desde, hasta
    if key == 'anual':
        return hoy.replace(month=1, day=1), hoy.replace(month=12, day=31)
    return None, None

from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser
from usuarios.models import Piloto

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

        categoria = self.request.query_params.get('categoria', None)
        if categoria:
            queryset = queryset.filter(categoria=categoria)

        return queryset.order_by('-fecha_programada')

    def perform_create(self, serializer):
        usuario = self.request.user
        tipo_mision = serializer.validated_data.get('tipo_mision', Mision.TipoMision.TERCEROS)

        if tipo_mision == Mision.TipoMision.PERSONAL:
            if not hasattr(usuario, 'perfil_piloto'):
                raise ValidationError({'detail': 'Solo los pilotos pueden crear misiones personales.'})

            serializer.save(
                piloto=usuario.perfil_piloto,
                tipo_mision=Mision.TipoMision.PERSONAL,
                estado=Mision.Estado.PENDIENTE
            )
        else:
            nombre_completo = f"{usuario.first_name} {usuario.last_name}".strip()
            if not nombre_completo:
                nombre_completo = usuario.email
            serializer.save(
                cliente_nombre=nombre_completo,
                tipo_mision=Mision.TipoMision.TERCEROS,
                estado=Mision.Estado.PENDIENTE
            )

    @action(detail=True, methods=['patch'])
    def cambiar_estado(self, request, pk=None):
        mision = self.get_object()

        serializer = CambiarEstadoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        nuevo_estado = serializer.validated_data['estado']

        if mision.piloto_id is None and nuevo_estado == Mision.Estado.ACEPTADA and hasattr(request.user, 'perfil_piloto'):
            asignadas = Mision.objects.filter(
                pk=mision.pk, piloto__isnull=True
            ).update(piloto=request.user.perfil_piloto)
            if asignadas == 0:
                return Response(
                    {'detail': 'La misión ya fue asignada a otro piloto.'},
                    status=status.HTTP_409_CONFLICT,
                )
            mision.refresh_from_db()

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
        ).prefetch_related('resenias').order_by('-fecha_programada')

        filtro_categoria = request.query_params.get('categoria')
        if filtro_categoria:
            misiones_completadas = misiones_completadas.filter(categoria=filtro_categoria)

        serializer = HistorialMisionSerializer(misiones_completadas, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)

    def _calcular_metricas_para(self, piloto, modo, categoria):
        qs = Mision.objects.filter(
            piloto=piloto, tipo_mision=modo, categoria=categoria
        ).prefetch_related('resenias')
        completadas = qs.filter(estado=Mision.Estado.COMPLETADA)
        activas = qs.filter(estado__in=[Mision.Estado.ACEPTADA, Mision.Estado.EN_CURSO])

        horas = 0.0
        for m in completadas:
            if m.fecha_cierre and m.fecha_creacion:
                diff = (m.fecha_cierre - m.fecha_creacion).total_seconds() / 3600
                if diff > 0:
                    horas += diff

        capturas = sum(int(m.capturas_generadas or 0) for m in completadas)
        distancia = float(sum(float(m.distancia_km or 0) for m in completadas))
        drones = qs.exclude(dron_asignado='').values_list('dron_asignado', flat=True).distinct().count()

        facturacion_total = 0.0
        horas_comerciales = 0.0
        if modo == Mision.TipoMision.TERCEROS:
            for registro in self._calcular_facturacion(piloto, categoria=categoria):
                facturacion_total += float(registro['monto'] or 0)
                horas_comerciales += float(registro['horas'] or 0)

        calificaciones = []
        for m in completadas:
            for resenia in m.resenias.all():
                try:
                    valor = float(resenia.calificacion)
                except (TypeError, ValueError):
                    continue
                if valor > 0:
                    calificaciones.append(valor)

        reputacion = None
        if calificaciones:
            reputacion = round(sum(calificaciones) / len(calificaciones), 2)

        return {
            'horas_vuelo': round(horas, 2),
            'capturas': capturas,
            'distancia_km': round(distancia, 2),
            'drones_hangar': drones,
            'facturacion': round(facturacion_total, 2),
            'contratos_activos': activas.count(),
            'horas_comerciales': round(horas_comerciales, 2),
            'reputacion': reputacion,
            'misiones_completadas': completadas.count(),
            'misiones_totales': qs.count(),
        }

    @action(detail=False, methods=['get'], url_path='resumen')
    def resumen(self, request):
        usuario = request.user

        if not hasattr(usuario, 'perfil_piloto'):
            return Response(
                {'detail': 'Solo un piloto puede consultar sus métricas.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        piloto = usuario.perfil_piloto
        modo = (request.query_params.get('modo') or 'PERSONAL').upper()

        categorias = (
            Mision.objects
            .filter(piloto=piloto, tipo_mision=modo)
            .exclude(categoria='')
            .values_list('categoria', flat=True)
            .distinct()
            .order_by('categoria')
        )

        resultado = []
        for cat in categorias:
            resultado.append({
                'id': cat,
                'metricas': self._calcular_metricas_para(piloto, modo, cat),
            })

        return Response({'modo': modo, 'categorias': resultado}, status=status.HTTP_200_OK)

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

    def _calcular_facturacion(self, piloto, categoria=None):
        qs = Mision.objects.filter(
            piloto=piloto,
            estado=Mision.Estado.COMPLETADA,
            tipo_mision=Mision.TipoMision.TERCEROS,
        ).select_related('producto').prefetch_related('producto__variantes').order_by('-fecha_programada')

        if categoria:
            qs = qs.filter(categoria=categoria)

        data = []
        for m in qs:
            horas = None
            if m.fecha_cierre and m.fecha_creacion:
                horas = round((m.fecha_cierre - m.fecha_creacion).total_seconds() / 3600, 1)

            monto = 0

            if m.producto:
                variantes = list(m.producto.variantes.all())
                if variantes:
                    monto = float(variantes[0].precio)

            if monto == 0:
                tarifa_respaldo = TARIFA_RESPALDO.get(m.categoria, 0)
                monto = round((horas or 0) * tarifa_respaldo, 2)

            data.append({
                'id': m.id,
                'fecha': m.fecha_programada,
                'categoria': m.categoria,
                'referencia': m.descripcion or m.ubicacion or f'MIS-{m.id}',
                'horas': horas or 0,
                'monto': monto,
                'estado': m.estado,
            })

        return data

    @action(detail=False, methods=['get'], url_path='facturacion')
    def facturacion(self, request):
        usuario = request.user

        if not hasattr(usuario, 'perfil_piloto'):
            return Response(
                {'detail': 'Solo un piloto puede consultar su facturación.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        categoria = request.query_params.get('categoria') or None
        return Response(
            self._calcular_facturacion(usuario.perfil_piloto, categoria=categoria),
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'], url_path='facturacion/exportar-pdf')
    def exportar_pdf_facturacion(self, request):
        usuario = request.user

        if not hasattr(usuario, 'perfil_piloto'):
            return Response(
                {'detail': 'Solo un piloto puede exportar su facturación.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        piloto = usuario.perfil_piloto
        periodo = (request.query_params.get('periodo') or 'mensual').strip()
        categoria = (request.query_params.get('categoria') or 'TODAS').strip()

        registros = self._calcular_facturacion(piloto)

        if categoria and categoria != 'TODAS':
            registros = [r for r in registros if r['categoria'] == categoria]

        desde, hasta = _rango_periodo(periodo)
        if desde and hasta:
            registros = [r for r in registros if desde <= r['fecha'] <= hasta]

        total_periodo = sum(float(r['monto'] or 0) for r in registros)

        pdf_bytes = generar_pdf_facturacion(
            piloto,
            registros,
            periodo=periodo,
            categoria=categoria,
            total_periodo=total_periodo,
        )

        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="facturacion.pdf"'
        return response

  # Vista para ver el total de pilotos

class TotalPilotosView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        total = Piloto.objects.count()

        return Response({'total': total})