
"""
MÓDULO: REPARACIONES
ARCHIVO: views.py

RESPONSABILIDAD:
    Gestionar las solicitudes HTTP relacionadas con los equipos
    de clientes y las órdenes de servicio.

PRINCIPIO SOLID: SRP (Single Responsibility Principle)

Aplicación:
    Las vistas gestionan las solicitudes, los permisos y las
    respuestas HTTP.

    La operación de actualización de estado se delega a
    ServicioOrdenReparacion, evitando que la vista implemente
    directamente toda la lógica de negocio.

PATRÓN ARQUITECTÓNICO:
    Service Layer (Capa de servicios).

NOTA:
    Esta separación representa una aplicación parcial de SRP.
    Algunas reglas de negocio todavía permanecen en las vistas.
"""

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404

from rest_framework import mixins, permissions, status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from .models import EquipoCliente, OrdenServicio
from .serializers import (
    EquipoClienteSerializer,
    OrdenServicioSerializer,
    AsignarTecnicoSerializer,
    CambiarEstadoSerializer,
)
from .servicios import ServicioOrdenReparacion

class EquipoClienteViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet
):
    """
    Gestiona la consulta y el registro de equipos de clientes.

    PRINCIPIO SRP:
        Este ViewSet se concentra en las operaciones HTTP
        relacionadas con los equipos registrados.
    """

    serializer_class = EquipoClienteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Devuelve únicamente los equipos del cliente autenticado.

        La consulta limita el acceso a los registros
        pertenecientes al usuario actual.
        """
        usuario = self.request.user

        return EquipoCliente.objects.filter(
            cliente__usuario=usuario
        ).select_related(
            'cliente',
            'articulo'
        )

    def create(self, request, *args, **kwargs):
        """
        Registra un equipo asociado al cliente autenticado.

        Valida los datos y comprueba que el usuario
        tenga un perfil de cliente.
        """
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
    """
    Gestiona las solicitudes HTTP de las órdenes de reparación.

    PRINCIPIO SOLID: SRP

    Responsabilidades:
        - Controlar el acceso a las órdenes.
        - Validar los datos recibidos.
        - Comprobar permisos.
        - Devolver respuestas HTTP.

    La actualización del estado se delega a una clase
    de servicio especializada.
    """

    serializer_class = OrdenServicioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        """
        Exige permisos adicionales para crear órdenes.

        Las demás acciones requieren autenticación y aplican
        las comprobaciones correspondientes.
        """
        if self.action == 'create':
            return [
                permissions.IsAuthenticated(),
                permissions.DjangoModelPermissions()
            ]

        return [
            permissions.IsAuthenticated()
        ]

    def get_queryset(self):
        """
        Determina las órdenes visibles para el usuario.

        - Personal con permiso de consulta: todas las órdenes.
        - Clientes: órdenes de sus propios equipos.
        - Técnicos: órdenes que tienen asignadas.
        """
        usuario = self.request.user

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
        """
        Asigna un técnico disponible a una orden abierta.

        Reglas:
            - El usuario necesita permiso de modificación.
            - La orden no puede estar cerrada.
            - El técnico debe estar disponible.

        La operación se realiza dentro de una transacción
        y bloquea la orden durante la actualización.
        """
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
        """
        Procesa una solicitud de cambio de estado.

        PRINCIPIO SOLID: SRP
        -------------------
        Esta vista:
            1. Valida la solicitud HTTP.
            2. Comprueba los permisos del usuario.
            3. Controla la transacción.
            4. Devuelve la respuesta correspondiente.

        ServicioOrdenReparacion:
            1. Comprueba la transición.
            2. Actualiza el estado.
            3. Registra la fecha de cierre cuando corresponde.
            4. Guarda los cambios.

        PATRÓN STATE:
            La validación de transiciones se realiza mediante
            OrdenServicio.puede_cambiar_a(), que puede delegar
            las reglas a las clases de estados.py.
        """

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

            # Verificar si el cambio corresponde al técnico.
            if nuevo_estado in estados_tecnicos:
                if (
                    orden.tecnico_id is None
                    or not hasattr(request.user, 'perfil_tecnico')
                    or orden.tecnico_id != request.user.perfil_tecnico.pk
                ):
                    raise PermissionDenied(
                        'Solo el técnico asignado puede avanzar esta orden.'
                    )

            # Verificar permisos para cerrar órdenes.
            elif nuevo_estado in estados_administrativos:
                if not request.user.has_perm(
                    'reparaciones.change_ordenservicio'
                ):
                    raise PermissionDenied(
                        'No tiene permiso para cerrar órdenes.'
                    )

            # Validar la transición antes de ejecutar el servicio.
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
                        {
                            'detail': 'La orden no tiene técnico asignado.'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # ==================================================
            # PRINCIPIO SOLID: SRP - RESPONSABILIDAD ÚNICA
            #
            # La vista delega la operación de negocio al servicio.
            # El servicio actualiza el estado y la fecha de cierre.
            #
            # Se conserva el bloqueo de la base de datos para
            # proteger la operación ante solicitudes concurrentes.
            # ==================================================

            ServicioOrdenReparacion.cambiar_estado(
                orden,
                nuevo_estado
            )

        return Response(
            OrdenServicioSerializer(orden).data,
            status=status.HTTP_200_OK
        )