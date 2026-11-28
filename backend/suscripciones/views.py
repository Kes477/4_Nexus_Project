from rest_framework import mixins, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from ventas.views import ejecutar

from .models import SuscripcionActiva
from .serializers import SuscripcionActivaSerializer
from .servicios import articulos_comprados, cancelar_suscripcion, marcar_vencidas


class SuscripcionViewSet(mixins.ListModelMixin,
                         mixins.RetrieveModelMixin,
                         mixins.UpdateModelMixin,
                         viewsets.GenericViewSet):
    serializer_class = SuscripcionActivaSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'patch', 'post', 'head', 'options']   # sin PUT ni DELETE

    def get_queryset(self):
        propias = SuscripcionActiva.objects.filter(usuario=self.request.user)
        marcar_vencidas(propias)   # pone el estado al día antes de mostrarlas
        return propias.select_related('plan__producto', 'articulo_cubierto__producto', 'detalle')

    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        suscripcion = ejecutar(cancelar_suscripcion, self.get_object())
        return Response(self.get_serializer(suscripcion).data)

    @action(detail=False)
    def drones(self, request):
        "Drones que el cliente puede cubrir con un plan."
        return Response([
            {'id': articulo.pk, 'nombre': str(articulo)}
            for articulo in articulos_comprados(request.user)
        ])