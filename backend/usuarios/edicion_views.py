from django.db import IntegrityError, transaction

from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from .models import Usuario
from .edicion_serializers import EdicionUsuarioSerializer
from .admin_serializers import UsuarioAdminSerializer
from .permisos import PuedeModificarUsuarios


class EdicionUsuarioView(generics.UpdateAPIView):

    queryset = Usuario.objects.all()

    serializer_class = EdicionUsuarioSerializer

    permission_classes = [PuedeModificarUsuarios]

    http_method_names = ["patch", "options"]

    @transaction.atomic
    def update(self, request, *args, **kwargs):

        usuario = self.get_object()

        if usuario.is_superuser and not request.user.is_superuser:
            raise PermissionDenied(
                "No puede modificar una cuenta de superusuario."
            )

        if usuario.is_staff and not request.user.is_superuser:
            raise PermissionDenied(
                "No puede modificar esta cuenta administrativa."
            )

        serializer = self.get_serializer(
            usuario,
            data=request.data,
            partial=True
        )

        serializer.is_valid(raise_exception=True)

        try:
            usuario = serializer.save()

        except IntegrityError:
            return Response(
                {"detail": "Existe un dato duplicado."},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            UsuarioAdminSerializer(usuario).data,
            status=status.HTTP_200_OK
        )
