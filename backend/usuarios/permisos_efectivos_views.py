from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Usuario

from .permisos import (
    PuedeConsultarUsuarios
)

from .servicios_permisos import (
    obtener_permisos_usuario
)


class PermisosEfectivosUsuarioView(generics.GenericAPIView):

    queryset = Usuario.objects.all()

    permission_classes = [
        PuedeConsultarUsuarios
    ]

    def get(self, request, *args, **kwargs):

        usuario = self.get_object()

        return Response(
            obtener_permisos_usuario(usuario)
        )


class MisPermisosView(generics.GenericAPIView):

    permission_classes = [
        IsAuthenticated
    ]

    def get(self, request, *args, **kwargs):

        usuario = Usuario.objects.get(
            pk=request.user.pk
        )

        return Response(
            obtener_permisos_usuario(usuario)
        )
