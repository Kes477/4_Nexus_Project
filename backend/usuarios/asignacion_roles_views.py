from django.contrib.auth.models import Group
from django.db import transaction

from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from .models import Usuario

from .asignacion_roles_serializers import (
    AsignacionRolesSerializer
)

from .permisos import (
    PuedeConsultarUsuarios,
    PuedeAsignarRolesUsuario,
)

from .politicas_roles import (
    obtener_permisos_delegables
)

from .admin_serializers import (
    UsuarioAdminSerializer
)


class AsignacionRolesUsuarioView(generics.GenericAPIView):

    queryset = Usuario.objects.all()

    serializer_class = AsignacionRolesSerializer

    def get_permissions(self):

        if self.request.method == "GET":

            return [
                PuedeConsultarUsuarios()
            ]

        return [
            PuedeAsignarRolesUsuario()
        ]

    def get(self, request, *args, **kwargs):

        usuario = self.get_object()

        roles = usuario.groups.order_by("name")

        return Response({
            "id": usuario.pk,
            "roles": [
                {
                    "id": rol.pk,
                    "nombre": rol.name
                }
                for rol in roles
            ]
        })

    @transaction.atomic
    def put(self, request, *args, **kwargs):

        self.queryset = (
            Usuario.objects.select_for_update()
        )

        usuario = self.get_object()

        actor = request.user

        if usuario.pk == actor.pk:

            raise PermissionDenied(
                "No puede modificar sus propios roles."
            )

        if usuario.is_superuser:

            raise PermissionDenied(
                "No puede modificar roles de un superusuario."
            )

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        ids_solicitados = set(
            serializer.validated_data["roles"]
        )

        ids_actuales = set(
            usuario.groups.values_list(
                "pk",
                flat=True
            )
        )

        ids_relevantes = (
            ids_solicitados | ids_actuales
        )

        roles = {
            rol.pk: rol
            for rol in Group.objects.select_for_update()
            .filter(pk__in=ids_relevantes)
            .order_by("pk")
        }

        if not ids_solicitados.issubset(roles.keys()):

            return Response(
                {"detail": "Uno o mas roles no existen."},
                status=status.HTTP_400_BAD_REQUEST
            )

        ids_modificados = (
            ids_solicitados ^ ids_actuales
        )

        if not actor.is_superuser:

            if usuario.is_staff:

                raise PermissionDenied(
                    "Esta cuenta administrativa esta protegida."
                )

            if any(
                roles[pk].name == "Administrador"
                for pk in ids_relevantes
            ):

                raise PermissionDenied(
                    "No puede gestionar el rol Administrador."
                )

            ids_delegables = set(
                obtener_permisos_delegables(actor)
                .values_list("pk", flat=True)
            )

            permisos_objetivo = set(
                usuario.user_permissions.values_list(
                    "pk",
                    flat=True
                )
            )

            for pk in ids_actuales:

                permisos_objetivo.update(
                    roles[pk].permissions.values_list(
                        "pk",
                        flat=True
                    )
                )

            if not permisos_objetivo.issubset(ids_delegables):

                raise PermissionDenied(
                    "La cuenta posee permisos protegidos."
                )

            for pk in ids_modificados:

                permisos_rol = set(
                    roles[pk].permissions.values_list(
                        "pk",
                        flat=True
                    )
                )

                if not permisos_rol.issubset(ids_delegables):

                    raise PermissionDenied(
                        "El rol contiene permisos no delegables."
                    )

        if usuario.is_active and not ids_solicitados:

            return Response(
                {
                    "detail": (
                        "Un usuario activo debe conservar "
                        "al menos un rol."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        perfiles_requeridos = {
            "Cliente": "perfil_cliente",
            "Tecnico": "perfil_tecnico",
            "Piloto": "perfil_piloto",
            "Vendedor": "perfil_vendedor",
        }

        ids_agregados = (
            ids_solicitados - ids_actuales
        )

        for pk in ids_agregados:

            nombre = roles[pk].name

            perfil = perfiles_requeridos.get(nombre)

            if perfil and not hasattr(usuario, perfil):

                return Response(
                    {
                        "detail": (
                            f"El usuario necesita el perfil "
                            f"correspondiente al rol {nombre}."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        usuario.groups.set(
            ids_solicitados
        )

        return Response(
            UsuarioAdminSerializer(usuario).data,
            status=status.HTTP_200_OK
        )
