from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import AgregarAlCarritoView, CarritoDetalleView, CarritoView, PedidoViewSet

router = SimpleRouter()
router.register('pedidos', PedidoViewSet, basename='pedido')

urlpatterns = [
    path('carrito/', CarritoView.as_view(), name='carrito'),
    path('carrito/agregar/', AgregarAlCarritoView.as_view(), name='carrito-agregar'),
    path('carrito/detalles/<int:pk>/', CarritoDetalleView.as_view(), name='carrito-detalle'),
] + router.urls