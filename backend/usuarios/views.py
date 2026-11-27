import logging
import secrets

from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser
from .models import Usuario

from .models import Usuario, PasswordResetCode
from .serializers import (
    LoginSerializer,
    RegistroSerializer,
    UsuarioSerializer,
    ActualizarPilotoSerializer,
    PilotoSerializer,
    ActualizarTecnicoSerializer,
    TecnicoSerializer,
    CambiarPasswordSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
)

logger = logging.getLogger(__name__)


def _generar_codigo():
    return str(secrets.randbelow(900000) + 100000)


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer


class PerfilView(generics.RetrieveUpdateAPIView):
    serializer_class = UsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser] # Habilitado para recibir imágenes
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_object(self):
        return self.request.user


class PerfilPilotoView(generics.RetrieveUpdateAPIView):
    serializer_class = ActualizarPilotoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        usuario = self.request.user
        if not hasattr(usuario, 'perfil_piloto'):
            from rest_framework.exceptions import NotFound
            raise NotFound('El usuario no tiene perfil de piloto.')
        return usuario.perfil_piloto

    def get(self, request, *args, **kwargs):
        piloto = self.get_object()
        return Response(PilotoSerializer(piloto).data, status=status.HTTP_200_OK)

    def patch(self, request, *args, **kwargs):
        piloto = self.get_object()
        serializer = self.get_serializer(piloto, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(PilotoSerializer(piloto).data, status=status.HTTP_200_OK)


class PerfilTecnicoView(generics.RetrieveUpdateAPIView):
    serializer_class = ActualizarTecnicoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        usuario = self.request.user
        if not hasattr(usuario, 'perfil_tecnico'):
            from rest_framework.exceptions import NotFound
            raise NotFound('El usuario no tiene perfil de técnico.')
        return usuario.perfil_tecnico

    def get(self, request, *args, **kwargs):
        tecnico = self.get_object()
        return Response(TecnicoSerializer(tecnico).data, status=status.HTTP_200_OK)

    def patch(self, request, *args, **kwargs):
        tecnico = self.get_object()
        serializer = self.get_serializer(tecnico, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(TecnicoSerializer(tecnico).data, status=status.HTTP_200_OK)


class CambiarPasswordView(generics.GenericAPIView):
    serializer_class = CambiarPasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail': 'Contraseña actualizada correctamente.'}, status=status.HTTP_200_OK)


class RegistroView(generics.CreateAPIView):
    serializer_class = RegistroSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        usuario = serializer.save()
        refresh = RefreshToken.for_user(usuario)
        return Response(
            {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'usuario': UsuarioSerializer(usuario).data,
            },
            status=status.HTTP_201_CREATED,
        )


class PasswordResetRequestView(generics.GenericAPIView):
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        try:
            usuario = Usuario.objects.get(email=email)
        except Usuario.DoesNotExist:
            return Response(
                {'detail': 'Si el correo está registrado, recibirás un código.'},
                status=status.HTTP_200_OK,
            )

        codigo = _generar_codigo()

        with transaction.atomic():
            PasswordResetCode.objects.filter(usuario=usuario, is_used=False).update(is_used=True)
            PasswordResetCode.objects.create(usuario=usuario, code=codigo)

        asunto = "Recuperación de Contraseña - 4 Nexus"
        mensaje = (
            f"Hola {usuario.first_name},\n\n"
            f"Tu código de verificación es: {codigo}\n\n"
            f"Este código expirará en 3 minutos después de que se envía a tu correo.\n\n"
            f"Si no solicitaste este cambio, ignora este correo."
        )

        try:
            send_mail(
                asunto,
                mensaje,
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
        except Exception:
            logger.exception('Error enviando correo de recuperación a %s', email)
            return Response(
                {'detail': 'Error al enviar el correo. Intenta más tarde.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({'detail': 'Código enviado correctamente.'}, status=status.HTTP_200_OK)


class PasswordResetConfirmView(generics.GenericAPIView):
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail': 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.'}, status=status.HTTP_200_OK)

class ClientesActivosView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        total = Usuario.objects.filter(
            estado_cuenta=Usuario.EstadoCuenta.ACTIVA,
            is_staff=False,
            perfil_piloto__isnull=True,
            perfil_tecnico__isnull=True,
            perfil_vendedor__isnull=True
        ).count()

        return Response({'total': total})
        return Response(
            {'detail': 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.'},
            status=status.HTTP_200_OK,
        )
