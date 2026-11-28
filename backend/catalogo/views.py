from django.db.models import Min, Exists, OuterRef, Count,Q
from rest_framework import permissions, viewsets, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from inventario.models import Inventario
from .models import Categoria, Producto, Resenia
from .serializers import (
    CategoriaSerializer, ProductoDetalleSerializer,
    ProductoListaSerializer, ReseniaSerializer
)

LANDING_DEFAULT_LIMIT = 10

class CategoriaViewSet(viewsets.ReadOnlyModelViewSet):
    
    queryset = (
        Categoria.objects
        .annotate(
            total_productos=Count('productos'),
            productos_activos=Count('productos', filter=Q(productos__activo=True)),
        )
        .exclude(total_productos__gt=0, productos_activos=0)
    )
    serializer_class = CategoriaSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

class ProductoViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    filterset_fields = ['categoria', 'tipo_producto']
    search_fields = ['nombre', 'descripcion', 'articulo__marca', 'articulo__modelo']
    ordering_fields = ['precio_desde', 'fecha_publicacion', 'nombre']

    def get_queryset(self):
        hay_stock = Inventario.objects.filter(
            variante__producto=OuterRef('pk'),
            cantidad_disponible__gt=0,
        )
        qs = (
            Producto.objects.filter(activo=True)
            .select_related('categoria', 'articulo', 'suscripcion')
            .prefetch_related('articulo__imagenes', 'variantes__atributos', 'variantes__inventarios', 'especificaciones')
            .annotate(precio_desde=Min('variantes__precio'), disponible=Exists(hay_stock))
        )
        if self.action == 'landing':
            qs = qs.filter(mostrar_en_landing=True).order_by('orden_landing', '-fecha_publicacion')
        return qs

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProductoDetalleSerializer
        return ProductoListaSerializer

    @action(detail=False, methods=['get'])
    def landing(self, request):
        try:
            limit = int(request.query_params.get('limit', LANDING_DEFAULT_LIMIT))
        except (TypeError, ValueError):
            limit = LANDING_DEFAULT_LIMIT

        qs = self.get_queryset()
        articulos = list(qs.filter(tipo_producto=Producto.Tipo.ARTICULO)[:limit])
        suscripciones = list(qs.filter(tipo_producto=Producto.Tipo.SUSCRIPCION)[:limit])

        data = self.get_serializer(articulos + suscripciones, many=True).data
        return Response(data)

class ReseniaViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = Resenia.objects.all()
    serializer_class = ReseniaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(cliente=self.request.user)