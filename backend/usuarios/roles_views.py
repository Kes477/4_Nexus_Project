from django.contrib.auth.models import Group, Permission
from django.db.models import Count, Prefetch

from rest_framework import viewsets
from rest_framework.filters import SearchFilter, OrderingFilter

from .roles_serializers import (
    RolSerializer,
    PermisoSerializer,
)

from .permisos import (
    PuedeConsultarRoles,
    PuedeConsultarPermisos,
)


class RolViewSet(viewsets.ReadOnlyModelViewSet):

    serializer_class = RolSerializer

    permission_classes = [
        PuedeConsultarRoles
    ]

    filter_backends = [
        SearchFilter,
        OrderingFilter
    ]

    search_fields = ["name"]

    ordering_fields = [
        "id",
        "name",
        "cantidad_usuarios",
        "cantidad_permisos",
    ]

    ordering = ["name"]

    def get_queryset(self):

        return Group.objects.annotate(
            cantidad_usuarios=Count(
                "user",
                distinct=True
            ),
            cantidad_permisos=Count(
                "permissions",
                distinct=True
            )
        ).prefetch_related(
            Prefetch(
                "permissions",
                queryset=Permission.objects.select_related(
                    "content_type"
                ).order_by(
                    "content_type__app_label",
                    "codename"
                )
            )
        )


class PermisoViewSet(viewsets.ReadOnlyModelViewSet):

    serializer_class = PermisoSerializer

    permission_classes = [
        PuedeConsultarPermisos
    ]

    filter_backends = [
        SearchFilter,
        OrderingFilter
    ]

    search_fields = [
        "name",
        "codename",
        "content_type__app_label",
        "content_type__model",
    ]

    ordering_fields = [
        "id",
        "codename",
        "name",
    ]

    def get_queryset(self):

        queryset = Permission.objects.select_related(
            "content_type"
        )

        modulo = self.request.query_params.get("modulo")

        if modulo:

            queryset = queryset.filter(
                content_type__app_label=modulo
            )

        return queryset.order_by(
            "content_type__app_label",
            "codename"
        )
