from rest_framework.routers import DefaultRouter
from .views import CategoriaViewSet, ProductoViewSet, ReseniaViewSet

router = DefaultRouter()
router.register('categorias', CategoriaViewSet, basename='categoria')
router.register('productos', ProductoViewSet, basename='producto')
router.register('resenias', ReseniaViewSet, basename='resenia')

urlpatterns = router.urls