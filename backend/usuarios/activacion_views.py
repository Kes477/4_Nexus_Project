from django.db import transaction
from django.utils.encoding import force_bytes
from django.utils.http import (
    urlsafe_base64_encode,
    urlsafe_base64_decode
)

from rest_framework import generics, status
from rest_framework.permissions import (
    IsAuthenticated,
    AllowAny
)
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from .models import Usuario

from .tokens import token_activacion

from .activacion_serializers import (
    ActivacionCuentaSerializer
)

class GenerarActivacionView(generics.GenericAPIView):

    queryset = Usuario.objects.all()

    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):

        actor = request.user

        if not actor.is_active or not actor.is_superuser:

            raise PermissionDenied(
                "No tiene permiso para generar activaciones."
            )

        self.queryset = (
            Usuario.objects.select_for_update()
        )

        usuario = self.get_object()

        if usuario.is_superuser or usuario.is_staff:

            raise PermissionDenied(
                "La cuenta administrativa esta protegida."
            )

        if usuario.estado_cuenta != "I" or usuario.is_active:

            return Response(
                {"detail": "La cuenta debe estar inactiva."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if usuario.has_usable_password():

            return Response(
                {
                    "detail": (
                        "La cuenta ya tiene una contrasena."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not usuario.groups.exists():

            return Response(
                {"detail": "Debe asignar al menos un rol."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if usuario.groups.filter(name="Administrador").exists():

            raise PermissionDenied(
                "La activacion de cuentas administrativas esta protegida."
            )

        # Invalida cualquier token de activacion anterior.
        usuario.set_unusable_password()

        usuario.save(
            update_fields=["password"]
        )

        uid = urlsafe_base64_encode(
            force_bytes(usuario.pk)
        )

        token = token_activacion.make_token(
            usuario
        )

        respuesta = Response({
            "id": usuario.pk,
            "uid": uid,
            "token": token,
            "vigencia_maxima_segundos": 86400
        })

        respuesta["Cache-Control"] = "no-store"

        return respuesta

class ConfirmarActivacionView(generics.GenericAPIView):

    permission_classes = [AllowAny]

    serializer_class = ActivacionCuentaSerializer

    @transaction.atomic
    def post(self, request, *args, **kwargs):

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        datos = serializer.validated_data

        error_token = {
            "detail": "Token de activacion invalido o vencido."
        }

        try:

            usuario_id = int(
                urlsafe_base64_decode(
                    datos["uid"]
                ).decode()
            )

            usuario = (
                Usuario.objects.select_for_update()
                .get(pk=usuario_id)
            )

        except (
            ValueError,
            TypeError,
            OverflowError,
            Usuario.DoesNotExist
        ):

            return Response(
                error_token,
                status=status.HTTP_400_BAD_REQUEST
            )

        if (
            usuario.estado_cuenta != "I"
            or usuario.is_active
            or usuario.is_superuser
            or usuario.is_staff
            or usuario.has_usable_password()
            or usuario.groups.filter(
                name="Administrador"
            ).exists()
            or not usuario.groups.exists()
        ):

            return Response(
                error_token,
                status=status.HTTP_400_BAD_REQUEST
            )

        if not token_activacion.check_token(
            usuario,
            datos["token"]
        ):

            return Response(
                error_token,
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer.validar_password_usuario(
            usuario
        )

        usuario.set_password(
            datos["password"]
        )

        usuario.estado_cuenta = "A"
        usuario.is_active = True

        usuario.save(
            update_fields=[
                "password",
                "estado_cuenta",
                "is_active"
            ]
        )

        return Response({
            "detail": "Cuenta activada correctamente."
        })
