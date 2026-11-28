from rest_framework.routers import SimpleRouter

from .views import SuscripcionViewSet

router = SimpleRouter()
router.register('', SuscripcionViewSet, basename='suscripcion')

urlpatterns = router.urls