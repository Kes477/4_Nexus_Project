from rest_framework import permissions, viewsets

from .models import Ubicacion
from .serializers import DireccionSerializer, UbicacionSerializer
from .servicios import eliminar_direccion


class UbicacionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Ubicacion.objects.select_related('tipo').prefetch_related('hijos')
    serializer_class = UbicacionSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    filterset_fields = {
        'padre': ['exact', 'isnull'],
        'tipo__nombre': ['exact'],
    }
    search_fields = ['nombre']


class DireccionViewSet(viewsets.ModelViewSet):
    serializer_class = DireccionSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        return self.request.user.direcciones.select_related('ubicacion__padre__padre')

    def perform_destroy(self, instance):
        eliminar_direccion(instance)