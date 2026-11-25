from rest_framework.routers import SimpleRouter
from .views import DireccionViewSet, UbicacionViewSet

router = SimpleRouter()
router.register('direcciones', DireccionViewSet, basename='direccion')
router.register('', UbicacionViewSet, basename='ubicacion')

urlpatterns = router.urls