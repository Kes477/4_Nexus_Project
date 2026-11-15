
from rest_framework import mixins, permissions, viewsets
from rest_framework.exceptions import PermissionDenied

from django.db.models import Q

from .models import EquipoCliente, OrdenServicio


from .serializers import (
    EquipoClienteSerializer,
    OrdenServicioSerializer,
    AsignarTecnicoSerializer,
    CambiarEstadoSerializer
)



class EquipoClienteViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet
):
    serializer_class = EquipoClienteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        usuario = self.request.user

        return EquipoCliente.objects.filter(
            cliente__usuario=usuario
        ).select_related(
            'cliente',
            'articulo'
        )

    def create(self, request, *args, **kwargs):
        from rest_framework.response import Response
        from rest_framework import status

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not hasattr(request.user, 'perfil_cliente'):
            raise PermissionDenied(
                'El usuario no tiene un perfil de cliente.'
            )

        serializer.save(
            cliente=request.user.perfil_cliente
        )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )


class OrdenServicioViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet
):
    serializer_class = OrdenServicioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action == 'create':
            return [
                permissions.IsAuthenticated(),
                permissions.DjangoModelPermissions()
            ]

        return [
            permissions.IsAuthenticated()
        ]

    def get_queryset(self):
        usuario = self.request.user

        # Personal autorizado para consultar todas las órdenes
        if usuario.has_perm('reparaciones.view_ordenservicio'):
            return (
                OrdenServicio.objects
                .select_related(
                    'equipo',
                    'equipo__cliente',
                    'tecnico'
                )
                .all()
            )

        # Acceso restringido para clientes y técnicos
        filtros = Q(pk__in=[])

        if hasattr(usuario, 'perfil_cliente'):
            filtros |= Q(
                equipo__cliente__usuario=usuario
            )

        if hasattr(usuario, 'perfil_tecnico'):
            filtros |= Q(
                tecnico__usuario=usuario
            )

        return (
            OrdenServicio.objects
            .filter(filtros)
            .select_related(
                'equipo',
                'equipo__cliente',
                'tecnico'
            )
            .distinct()
        )

    def asignar_tecnico(self, request, pk=None):
        from django.core.exceptions import ValidationError
        from django.db import transaction
        from django.shortcuts import get_object_or_404
        from rest_framework import status
        from rest_framework.response import Response

        if not request.user.has_perm(
            'reparaciones.change_ordenservicio'
        ):
            raise PermissionDenied(
                'No tiene permiso para asignar técnicos.'
            )

        serializer = AsignarTecnicoSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)

        tecnico = serializer.validated_data['tecnico']

        with transaction.atomic():
            orden = get_object_or_404(
                OrdenServicio.objects.select_for_update(),
                pk=pk
            )

            if orden.estado in [
                OrdenServicio.Estado.ENTREGADA,
                OrdenServicio.Estado.CANCELADA
            ]:
                return Response(
                    {
                        'detail': (
                            'No se puede asignar un técnico '
                            'a una orden cerrada.'
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not tecnico.disponible:
                return Response(
                    {
                        'detail': 'El técnico no está disponible.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            orden.tecnico = tecnico

            try:
                orden.save(update_fields=['tecnico'])
            except ValidationError as error:
                return Response(
                    {'detail': error.message_dict},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return Response(
            OrdenServicioSerializer(orden).data,
            status=status.HTTP_200_OK
        )

    def cambiar_estado(self, request, pk=None):
        from django.db import transaction
        from django.shortcuts import get_object_or_404
        from django.utils import timezone
        from rest_framework import status
        from rest_framework.response import Response

        serializer = CambiarEstadoSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)

        nuevo_estado = serializer.validated_data['estado']

        estados_tecnicos = [
            OrdenServicio.Estado.EN_DIAGNOSTICO,
            OrdenServicio.Estado.EN_REPARACION,
            OrdenServicio.Estado.FINALIZADA
        ]

        estados_administrativos = [
            OrdenServicio.Estado.ENTREGADA,
            OrdenServicio.Estado.CANCELADA
        ]

        with transaction.atomic():
            orden = get_object_or_404(
                OrdenServicio.objects.select_for_update(),
                pk=pk
            )

            if nuevo_estado in estados_tecnicos:
                if (
                    orden.tecnico_id is None
                    or not hasattr(request.user, 'perfil_tecnico')
                    or orden.tecnico_id != request.user.perfil_tecnico.pk
                ):
                    raise PermissionDenied(
                        'Solo el técnico asignado puede avanzar esta orden.'
                    )

            elif nuevo_estado in estados_administrativos:
                if not request.user.has_perm(
                    'reparaciones.change_ordenservicio'
                ):
                    raise PermissionDenied(
                        'No tiene permiso para cerrar órdenes.'
                    )

            if not orden.puede_cambiar_a(nuevo_estado):
                return Response(
                    {
                        'detail': (
                            'La transición solicitada no está '
                            'permitida desde el estado actual.'
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if nuevo_estado in estados_tecnicos:
                if orden.tecnico is None:
                    return Response(
                        {'detail': 'La orden no tiene técnico asignado.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            orden.estado = nuevo_estado

            if nuevo_estado in estados_administrativos:
                orden.fecha_cierre = timezone.now()

            orden.save(
                update_fields=['estado', 'fecha_cierre']
            )

        return Response(
            OrdenServicioSerializer(orden).data,
            status=status.HTTP_200_OK
        )
