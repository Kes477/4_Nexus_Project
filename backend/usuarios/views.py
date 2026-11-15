from rest_framework import generics, permissions
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import LoginSerializer, UsuarioSerializer


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer


class PerfilView(generics.RetrieveAPIView):
    serializer_class = UsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user
    
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .serializers import RegistroSerializer

class RegistroView(generics.CreateAPIView):
    serializer_class = RegistroSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({"message": "Usuario registrado exitosamente"}, status=status.HTTP_201_CREATED)
