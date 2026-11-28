from django.db.models import Q
from rest_framework import viewsets
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Usuario
from .admin_serializers import UsuarioAdminSerializer
from .permisos import PuedeConsultarUsuarios


class UsuarioAdminViewSet(viewsets.ReadOnlyModelViewSet):

    serializer_class = UsuarioAdminSerializer

    permission_classes = [PuedeConsultarUsuarios]

    filter_backends = [
        SearchFilter,
        OrderingFilter,
    ]

    search_fields = [
        "first_name",
        "last_name",
        "email",
        "no_identificacion",
    ]

    ordering_fields = [
        "id",
        "first_name",
        "last_name",
        "date_joined",
        "estado_cuenta",
    ]

    ordering = ["id"]

    def get_queryset(self):

        queryset = Usuario.objects.select_related(
            "perfil_empleado",
            "perfil_cliente",
            "perfil_tecnico",
            "perfil_piloto",
            "perfil_vendedor",
        ).prefetch_related("groups")

        estado = self.request.query_params.get("estado")
        rol = self.request.query_params.get("rol")
        tipo = self.request.query_params.get("tipo")

        if estado:
            queryset = queryset.filter(
                estado_cuenta=estado
            )

        if rol:
            queryset = queryset.filter(
                groups__name__iexact=rol
            )

        if tipo == "interno":

            queryset = queryset.filter(
                Q(perfil_empleado__isnull=False)
                | Q(groups__isnull=False)
                & ~Q(groups__name="Cliente")
            )

        elif tipo == "cliente":

            queryset = queryset.filter(
                groups__name="Cliente"
            )

        return queryset.distinct()
