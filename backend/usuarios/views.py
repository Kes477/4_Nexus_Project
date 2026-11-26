from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    LoginSerializer,
    RegistroSerializer,
    UsuarioSerializer,
    ActualizarPilotoSerializer,
    PilotoSerializer,
    CambiarPasswordSerializer,
)

class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer


class PerfilView(generics.RetrieveUpdateAPIView):
    serializer_class = UsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get','patch','head','options']

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


class CambiarPasswordView(generics.GenericAPIView):

    serializer_class = CambiarPasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {'detail': 'Contraseña actualizada correctamente.'},
            status=status.HTTP_200_OK,
        )


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

