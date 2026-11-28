from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import ( LoginView, PerfilView, PerfilPilotoView, CambiarPasswordView, RegistroView, )

from .activacion_views import ConfirmarActivacionView

from .recuperacion_views import (
    SolicitarRecuperacionView,
    RestablecerPasswordView,
)

urlpatterns = [
    path(
        "restablecer-password/",
        RestablecerPasswordView.as_view(),
        name="restablecer-password"
    ),

    path(
        "recuperar-password/",
        SolicitarRecuperacionView.as_view(),
        name="recuperar-password"
    ),

    path(
        "activar/",
        ConfirmarActivacionView.as_view(),
        name="confirmar-activacion"
    ),

    path('login/', LoginView.as_view(), name='login'),
    path('registro/', RegistroView.as_view(), name='registro'),
    path('token/refrescar/', TokenRefreshView.as_view(), name='token_refrescar'),
    path('perfil/', PerfilView.as_view(), name='perfil'),
    path('perfil/piloto/', PerfilPilotoView.as_view(), name='perfil-piloto'),
    path('perfil/cambiar-password/', CambiarPasswordView.as_view(), name='cambiar-password'),
]