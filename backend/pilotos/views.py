from rest_framework import viewsets, mixins, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q

from .models import Mision
from .serializers import MisionSerializer, CambiarEstadoSerializer
from .servicios import ServicioMisionPiloto
from .politicas import SelectorPoliticas

class MisionViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    serializer_class = MisionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        usuario = self.request.user
        if usuario.is_staff:
            queryset = Mision.objects.all()
        elif hasattr(usuario, 'perfil_piloto'):
            queryset = Mision.objects.filter(piloto=usuario.perfil_piloto)
        else:
            queryset = Mision.objects.none()

        tipo_mision = self.request.query_params.get('tipo_mision', None)
        if tipo_mision:
            queryset = queryset.filter(tipo_mision=tipo_mision)

        return queryset.order_by('-fecha_programada')

    @action(detail=True, methods=['patch'])
    def cambiar_estado(self, request, pk=None):
        mision = self.get_object()
        
        serializer = CambiarEstadoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        nuevo_estado = serializer.validated_data['estado']

        politica = SelectorPoliticas.obtener(request.user, nuevo_estado)
        politica.autorizar(request.user, mision)

        try:
            mision_actualizada = ServicioMisionPiloto.cambiar_estado(mision, nuevo_estado)
            return Response(MisionSerializer(mision_actualizada).data, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)