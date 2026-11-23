from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView


from .views import (LoginView, PerfilView, PerfilPilotoView, CambiarPasswordView, RegistroView,)


urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('registro/', RegistroView.as_view(), name='registro'),
    path('token/refrescar/', TokenRefreshView.as_view(), name='token_refrescar'),
    path('perfil/', PerfilView.as_view(), name='perfil'),
    path('perfil/piloto/', PerfilPilotoView.as_view(), name='perfil-piloto'),
    path('perfil/cambiar-password/', CambiarPasswordView.as_view(), name='cambiar-password'),

]