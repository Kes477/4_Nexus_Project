from django.db.models import Min
from rest_framework import permissions, viewsets
from .models import Categoria, Producto
from .serializers import (CategoriaSerializer, ProductoDetalleSerializer, ProductoListaSerializer,)

class CategoriaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []




class ProductoViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    filterset_fields = ['categoria', 'tipo_producto']
    search_fields = ['nombre', 'descripcion','articulo__marca','articulo__modelo']
    ordering_fields = ['precio_desde','fecha_publicacion','nombre']

    def get_queryset(self):
        return (
            Producto.objects.filter(activo=True)
            .select_related('categoria','articulo')
            .prefetch_related('articulo__imagenes', 'variantes__atributos')
            .annotate(precio_desde=Min('variantes__precio'))
        )
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProductoDetalleSerializer
        return ProductoListaSerializer