from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MisionViewSet
from .views import TotalPilotosView

router = DefaultRouter()
router.register(r'misiones', MisionViewSet, basename='mision-piloto')

urlpatterns = [
    path('', include(router.urls)),
    path('total/', TotalPilotosView.as_view(), name='total-pilotos')
]