from django.contrib.auth.models import Group
from django.db import transaction, IntegrityError

from rest_framework import mixins, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from .roles_views import RolViewSet
from .roles_serializers import ROLES_PROTEGIDOS
from .roles_edicion_serializers import RolEdicionSerializer
from .permisos import PuedeAdministrarRoles


class RolAdminViewSet(
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    RolViewSet
):

    permission_classes = [
        PuedeAdministrarRoles
    ]

    def get_serializer_class(self):

        if self.action in (
            "create",
            "update",
            "partial_update"
        ):
            return RolEdicionSerializer

        return super().get_serializer_class()

    def create(self, request, *args, **kwargs):

        try:

            with transaction.atomic():

                return super().create(
                    request,
                    *args,
                    **kwargs
                )

        except IntegrityError:

            return Response(
                {"detail": "El nombre del rol ya existe."},
                status=status.HTTP_400_BAD_REQUEST
            )

    def update(self, request, *args, **kwargs):

        try:

            with transaction.atomic():

                rol = self.get_object()

                rol = Group.objects.select_for_update().get(
                    pk=rol.pk
                )

                if rol.name in ROLES_PROTEGIDOS:

                    raise PermissionDenied(
                        "No puede modificar un rol protegido."
                    )

                serializer = self.get_serializer(
                    rol,
                    data=request.data,
                    partial=kwargs.get("partial", False)
                )

                serializer.is_valid(
                    raise_exception=True
                )

                serializer.save()

                return Response(serializer.data)

        except IntegrityError:

            return Response(
                {"detail": "El nombre del rol ya existe."},
                status=status.HTTP_400_BAD_REQUEST
            )

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):

        rol = self.get_object()

        rol = Group.objects.select_for_update().get(
            pk=rol.pk
        )

        if rol.name in ROLES_PROTEGIDOS:

            raise PermissionDenied(
                "No puede eliminar un rol protegido."
            )

        if rol.user_set.exists():

            return Response(
                {
                    "detail": (
                        "No puede eliminar un rol "
                        "con usuarios asignados."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        rol.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )
