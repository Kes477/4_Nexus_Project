from django.contrib.auth.models import Group
from django.db import transaction

from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from .roles_serializers import PermisoSerializer

from .roles_permisos_serializers import (
    ConfiguracionPermisosRolSerializer
)

from .politicas_roles import (
    obtener_permisos_delegables
)

from .permisos import (
    PuedeConsultarRoles,
    PuedeConfigurarPermisosRol,
)


class PermisosDelegablesView(generics.ListAPIView):

    serializer_class = PermisoSerializer

    permission_classes = [
        PuedeConfigurarPermisosRol
    ]

    def get_queryset(self):

        return obtener_permisos_delegables(
            self.request.user
        ).order_by(
            "content_type__app_label",
            "codename"
        )


class PermisosRolView(generics.GenericAPIView):

    queryset = Group.objects.all()

    serializer_class = (
        ConfiguracionPermisosRolSerializer
    )

    def get_permissions(self):

        if self.request.method == "GET":

            return [
                PuedeConsultarRoles()
            ]

        return [
            PuedeConfigurarPermisosRol()
        ]

    def get(self, request, *args, **kwargs):

        rol = self.get_object()

        permisos = rol.permissions.select_related(
            "content_type"
        )

        return Response({
            "id": rol.pk,
            "nombre": rol.name,
            "permisos": PermisoSerializer(
                permisos,
                many=True
            ).data
        })

    @transaction.atomic
    def put(self, request, *args, **kwargs):

        self.queryset = (
            Group.objects.select_for_update()
        )

        rol = self.get_object()

        if rol.name == "Administrador":

            raise PermissionDenied(
                "No puede modificar los permisos del Administrador."
            )

        if request.user.groups.filter(pk=rol.pk).exists():

            raise PermissionDenied(
                "No puede modificar los permisos de su propio rol."
            )

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        ids_solicitados = set(
            serializer.validated_data["permisos"]
        )

        ids_delegables = set(
            obtener_permisos_delegables(
                request.user
            ).values_list("pk", flat=True)
        )

        ids_actuales = set(
            rol.permissions.values_list(
                "pk",
                flat=True
            )
        )

        ids_agregados = (
            ids_solicitados - ids_actuales
        )

        ids_retirados = (
            ids_actuales - ids_solicitados
        )

        ids_modificados = (
            ids_agregados | ids_retirados
        )

        if not ids_modificados.issubset(ids_delegables):

            raise PermissionDenied(
                "La solicitud modifica permisos no delegables."
            )

        rol.permissions.set(
            ids_solicitados
        )

        permisos = rol.permissions.select_related(
            "content_type"
        )

        return Response(
            {
                "id": rol.pk,
                "nombre": rol.name,
                "permisos": PermisoSerializer(
                    permisos,
                    many=True
                ).data
            },
            status=status.HTTP_200_OK
        )
