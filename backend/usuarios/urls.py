from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import ClientesActivosView

from .views import (
    LoginView,
    PerfilView,
    PerfilPilotoView,
    PerfilTecnicoView,
    CambiarPasswordView,
    RegistroView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('registro/', RegistroView.as_view(), name='registro'),
    path('token/refrescar/', TokenRefreshView.as_view(), name='token_refrescar'),
    path('perfil/', PerfilView.as_view(), name='perfil'),
    path('perfil/piloto/', PerfilPilotoView.as_view(), name='perfil-piloto'),
    path('perfil/tecnico/', PerfilTecnicoView.as_view(), name='perfil-tecnico'),
    path('perfil/cambiar-password/', CambiarPasswordView.as_view(), name='cambiar-password'),
    path('password-reset/request/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('clientes/activos/', ClientesActivosView.as_view(), name='clientes-activos')
]