from django.db import transaction

from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from .models import Usuario
from .estado_serializers import EstadoUsuarioSerializer
from .admin_serializers import UsuarioAdminSerializer
from .permisos import PuedeGestionarEstadoUsuario


class EstadoUsuarioView(generics.GenericAPIView):

    serializer_class = EstadoUsuarioSerializer

    permission_classes = [
        PuedeGestionarEstadoUsuario
    ]

    queryset = Usuario.objects.all()

    @transaction.atomic
    def patch(self, request, *args, **kwargs):

        self.queryset = (
            Usuario.objects.select_for_update()
        )

        usuario = self.get_object()

        if usuario.pk == request.user.pk:

            raise PermissionDenied(
                "No puede cambiar el estado de su propia cuenta."
            )

        if usuario.is_superuser:

            raise PermissionDenied(
                "No puede cambiar el estado de un superusuario."
            )

        if not request.user.is_superuser:

            es_administrador = usuario.groups.filter(
                name="Administrador"
            ).exists()

            if usuario.is_staff or es_administrador:

                raise PermissionDenied(
                    "Esta cuenta administrativa esta protegida."
                )

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        nuevo_estado = serializer.validated_data[
            "estado_cuenta"
        ]

        if nuevo_estado == usuario.estado_cuenta:

            return Response(
                {"detail": "El usuario ya tiene ese estado."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if nuevo_estado == "A":

            if not usuario.has_usable_password():

                return Response(
                    {
                        "detail": (
                            "El usuario debe configurar "
                            "su password antes de activarse."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not usuario.groups.exists():

                return Response(
                    {
                        "detail": (
                            "El usuario debe tener "
                            "al menos un rol asignado."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        usuario.estado_cuenta = nuevo_estado
        usuario.is_active = nuevo_estado == "A"

        usuario.save(
            update_fields=[
                "estado_cuenta",
                "is_active"
            ]
        )

        return Response(
            UsuarioAdminSerializer(usuario).data,
            status=status.HTTP_200_OK
        )
