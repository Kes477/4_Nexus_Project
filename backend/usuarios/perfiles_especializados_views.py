from django.db import transaction, IntegrityError

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, NotFound
from rest_framework.response import Response

from .models import Usuario, Tecnico, Piloto

from .perfiles_especializados_serializers import (
    PerfilTecnicoSerializer,
    PerfilPilotoSerializer,
)


class PerfilEspecializadoView(generics.GenericAPIView):

    queryset = Usuario.objects.all()

    permission_classes = [IsAuthenticated]

    configuraciones = {
        "tecnico": (
            Tecnico,
            PerfilTecnicoSerializer,
        ),
        "piloto": (
            Piloto,
            PerfilPilotoSerializer,
        ),
    }

    def obtener_configuracion(self):

        tipo = self.kwargs["tipo"]

        if tipo not in self.configuraciones:

            raise NotFound(
                "Tipo de perfil no reconocido."
            )

        return self.configuraciones[tipo]

    def comprobar_actor(self, request):

        if not (
            request.user.is_active
            and request.user.is_superuser
        ):

            raise PermissionDenied(
                "No tiene permiso para gestionar este perfil."
            )

    def get(self, request, *args, **kwargs):

        self.comprobar_actor(request)

        usuario = self.get_object()

        modelo, serializador = (
            self.obtener_configuracion()
        )

        perfil = modelo.objects.filter(
            usuario=usuario
        ).first()

        if perfil is None:

            raise NotFound(
                "El usuario no tiene este perfil."
            )

        return Response(
            serializador(perfil).data
        )

    @transaction.atomic
    def put(self, request, *args, **kwargs):

        self.comprobar_actor(request)

        self.queryset = (
            Usuario.objects.select_for_update()
        )

        usuario = self.get_object()

        if usuario.is_superuser or usuario.is_staff:

            raise PermissionDenied(
                "La cuenta administrativa esta protegida."
            )

        if usuario.is_active:

            return Response(
                {
                    "detail": (
                        "La cuenta debe estar inactiva "
                        "para configurar el perfil."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not hasattr(usuario, "perfil_empleado"):

            return Response(
                {
                    "detail": (
                        "El usuario necesita un perfil "
                        "de empleado."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        modelo, serializador = (
            self.obtener_configuracion()
        )

        perfil = modelo.objects.filter(
            usuario=usuario
        ).first()

        es_nuevo = perfil is None

        serializer = serializador(
            instance=perfil,
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        try:

            with transaction.atomic():

                serializer.save(usuario=usuario)

        except IntegrityError:

            return Response(
                {
                    "detail": (
                        "Existe un dato duplicado "
                        "o incompatible."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            serializer.data,
            status=(
                status.HTTP_201_CREATED
                if es_nuevo
                else status.HTTP_200_OK
            )
        )
