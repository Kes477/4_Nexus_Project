from django.urls import path

from .views import AgregarAlCarritoView, CarritoDetalleView, CarritoView

urlpatterns = [
    path('carrito/', CarritoView.as_view(), name='carrito'),
    path('carrito/agregar/', AgregarAlCarritoView.as_view(), name='carrito-agregar'),
    path('carrito/detalles/<int:pk>/', CarritoDetalleView.as_view(), name='carrito-detalle'),
]