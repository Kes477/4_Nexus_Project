from rest_framework.routers import DefaultRouter
from .views import AlmacenViewSet, InventarioViewSet, MovimientoInventarioViewSet, EstadoDronViewSet

router=DefaultRouter()
router.register('almacenes', AlmacenViewSet, basename='almacen')
router.register('inventarios', InventarioViewSet,  basename='inventario')
router.register('movimientos', MovimientoInventarioViewSet, basename = 'movimiento')
router.register('drones', EstadoDronViewSet, basename='estado-dron')

urlpatterns = router.urls
