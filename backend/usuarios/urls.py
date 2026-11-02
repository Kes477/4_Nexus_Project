from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import LoginView, PerfilView


urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('token/refrescar/', TokenRefreshView.as_view(), name='token_refrescar'),
    path('perfil/', PerfilView.as_view(), name='perfil'),
]