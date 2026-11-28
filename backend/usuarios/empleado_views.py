from django.db import IntegrityError

from rest_framework import generics, status
from rest_framework.response import Response

from .empleado_serializers import RegistroEmpleadoSerializer
from .admin_serializers import UsuarioAdminSerializer
from .permisos import PuedeRegistrarUsuarios

class RegistroEmpleadoView(generics.CreateAPIView):

    serializer_class = RegistroEmpleadoSerializer

    permission_classes = [PuedeRegistrarUsuarios]

    def create(self, request, *args, **kwargs):

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        try:
            usuario = serializer.save()

        except IntegrityError:
            return Response(
                {"detail": "Existe un registro duplicado."},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            UsuarioAdminSerializer(usuario).data,
            status=status.HTTP_201_CREATED
        )
