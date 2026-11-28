from django.conf import settings
from django.db import transaction
from django.core.mail import send_mail

from django.contrib.auth.tokens import (
    default_token_generator
)

from django.utils.encoding import force_bytes

from django.utils.http import (
    urlsafe_base64_encode,
    urlsafe_base64_decode
)

from urllib.parse import urlencode

from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from .models import Usuario

from .recuperacion_serializers import (
    SolicitarRecuperacionSerializer,
    RestablecerPasswordSerializer
)


class RecuperacionThrottle(AnonRateThrottle):

    scope = "recuperacion_password"

    rate = "5/minute"


class SolicitarRecuperacionView(generics.GenericAPIView):

    authentication_classes = []

    permission_classes = [AllowAny]

    throttle_classes = [RecuperacionThrottle]

    serializer_class = SolicitarRecuperacionSerializer

    def post(self, request, *args, **kwargs):

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        email = serializer.validated_data["email"]

        usuarios = Usuario.objects.filter(
            email__iexact=email,
            is_active=True,
            estado_cuenta="A",
            is_superuser=False,
            is_staff=False
        ).exclude(
            groups__name="Administrador"
        )

        for usuario in usuarios:

            if not usuario.has_usable_password():

                continue

            uid = urlsafe_base64_encode(
                force_bytes(usuario.pk)
            )

            token = default_token_generator.make_token(
                usuario
            )

            parametros = urlencode({
                "uid": uid,
                "token": token
            })

            enlace = (
                settings.FRONTEND_URL.rstrip("/")
                + "/restablecer-password?"
                + parametros
            )

            send_mail(
                subject="NEXUS - Recuperacion de contrasena",
                message=(
                    "Se solicito recuperar tu contrasena.\n\n"
                    "Utiliza el siguiente enlace:\n"
                    + enlace
                    + "\n\nSi no solicitaste este cambio, "
                    "ignora este mensaje."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[usuario.email],
                fail_silently=False
            )

        return Response({
            "detail": (
                "Si existe una cuenta habilitada con ese "
                "correo, recibiras las instrucciones."
            )
        })


class RestablecerPasswordView(generics.GenericAPIView):

    authentication_classes = []

    permission_classes = [AllowAny]

    throttle_classes = [RecuperacionThrottle]

    serializer_class = RestablecerPasswordSerializer

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
            "detail": "Token invalido o vencido."
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
            not usuario.is_active
            or usuario.estado_cuenta != "A"
            or usuario.is_superuser
            or usuario.is_staff
            or not usuario.has_usable_password()
            or usuario.groups.filter(
                name="Administrador"
            ).exists()
        ):

            return Response(
                error_token,
                status=status.HTTP_400_BAD_REQUEST
            )

        if not default_token_generator.check_token(
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

        usuario.save(
            update_fields=["password"]
        )

        return Response({
            "detail": (
                "Contrasena restablecida correctamente."
            )
        })
