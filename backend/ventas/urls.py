from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import AgregarAlCarritoView, CarritoDetalleView, CarritoView, FormasPagoView, MetodoPagoViewSet, PedidoViewSet

router = SimpleRouter()
router.register('pedidos', PedidoViewSet, basename='pedido')
router.register('metodos-pago', MetodoPagoViewSet, basename = 'metodo-pago')

urlpatterns = [
    path('carrito/', CarritoView.as_view(), name='carrito'),
    path('carrito/agregar/', AgregarAlCarritoView.as_view(), name='carrito-agregar'),
    path('carrito/detalles/<int:pk>/', CarritoDetalleView.as_view(), name='carrito-detalle'),
    path('formas-pago/', FormasPagoView.as_view(), name='formas-pago'),
] + router.urls