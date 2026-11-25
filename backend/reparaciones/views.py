
"""
MÓDULO: REPARACIONES
ARCHIVO: views.py

OBJETIVO:
    Gestionar las solicitudes HTTP relacionadas con
    los equipos de clientes y las órdenes de servicio.

PRINCIPIOS SOLID
================

SRP - RESPONSABILIDAD ÚNICA:
    Las vistas se encargan de gestionar las solicitudes,
    validar datos, comprobar permisos generales y devolver
    respuestas HTTP.

    La lógica de actualización de estados se delega
    a ServicioOrdenReparacion.

OCP - ABIERTO/CERRADO:
    Las reglas de autorización pueden extenderse mediante
    nuevas estrategias sin modificar las estrategias
    existentes.

LSP - SUSTITUCIÓN DE LISKOV:
    Las diferentes políticas de autorización implementan
    un contrato común y pueden utilizarse mediante él.

ISP - SEGREGACIÓN DE INTERFACES:
    Las políticas utilizan una interfaz específica que
    únicamente requiere el método autorizar().

DIP - INVERSIÓN DE DEPENDENCIAS:
    La vista obtiene una política que cumple una abstracción
    y ejecuta su contrato, en lugar de implementar
    directamente cada regla de autorización.

PATRONES DE DISEÑO
==================

1. STATE:
    Las reglas de transición entre estados se encuentran
    encapsuladas en estados.py.

2. STRATEGY:
    Las políticas de autorización se implementan mediante
    clases intercambiables en politicas.py.

3. FACTORY METHOD:
    La creación de las políticas se delega a creadores
    especializados definidos en politicas.py.

PATRÓN ARQUITECTÓNICO ADICIONAL:
    SERVICE LAYER:
    ServicioOrdenReparacion centraliza la operación
    de cambio de estado.

NOTA:
    Los principios SOLID se aplican en colaboración
    con los demás archivos del módulo.
"""

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404

from rest_framework import (
    mixins,
    permissions,
    status,
    viewsets,
)

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

# PATRONES STRATEGY Y FACTORY METHOD
from .politicas import SelectorPoliticas

# ==========================================================
# VISTA PARA EQUIPOS DE CLIENTES
# ==========================================================

class EquipoClienteViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet
):
    """
    Gestiona los equipos registrados por los clientes.

    PRINCIPIO SOLID: SRP
    --------------------
    Esta clase gestiona las solicitudes HTTP relacionadas
    con el registro y consulta de equipos.

    No implementa reglas de transición de estados
    ni operaciones de reparación.
    """

    serializer_class = EquipoClienteSerializer

    permission_classes = [
        permissions.IsAuthenticated
    ]

    def get_queryset(self):
        """
        Obtiene los equipos del cliente autenticado.

        SEGURIDAD:
            El usuario únicamente puede consultar
            los equipos asociados a su perfil.
        """

        usuario = self.request.user

        return EquipoCliente.objects.filter(
            cliente__usuario=usuario
        ).select_related(
            "cliente",
            "articulo"
        )

    def create(self, request, *args, **kwargs):
        """
        Registra un nuevo equipo del cliente.

        PRINCIPIO SRP:
            La vista valida la solicitud y delega
            el guardado al serializer y al modelo.
        """

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        if not hasattr(
            request.user,
            "perfil_cliente"
        ):
            raise PermissionDenied(
                "El usuario no tiene un perfil de cliente."
            )

        serializer.save(
            cliente=request.user.perfil_cliente
        )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )

# ==========================================================
# VISTA PARA ÓRDENES DE SERVICIO
# ==========================================================

class OrdenServicioViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet
):
    """
    Gestiona las solicitudes HTTP de órdenes de reparación.

    PRINCIPIO SOLID: SRP
    --------------------
    Responsabilidades:
        - Gestionar solicitudes HTTP.
        - Controlar acceso a las órdenes.
        - Validar datos mediante serializers.
        - Coordinar transacciones.
        - Devolver respuestas HTTP.

    Las reglas especializadas de autorización se delegan
    a las estrategias de politicas.py.

    La actualización del estado se delega al servicio.
    """

    serializer_class = OrdenServicioSerializer

    permission_classes = [
        permissions.IsAuthenticated
    ]

    # ======================================================
    # PERMISOS
    # ======================================================

    def get_permissions(self):
        """
        Determina los permisos requeridos por cada acción.

        REGLAS:
            - Crear órdenes requiere permisos del modelo.
            - Las demás acciones requieren autenticación.
            - Las operaciones especiales verifican
              sus propios permisos adicionales.
        """

        if self.action == "create":
            return [
                permissions.IsAuthenticated(),
                permissions.DjangoModelPermissions()
            ]

        return [
            permissions.IsAuthenticated()
        ]

    # ======================================================
    # CONSULTA DE ÓRDENES
    # ======================================================

    def get_queryset(self):
        """
        Devuelve las órdenes visibles para el usuario.

        REGLAS:
            - Usuarios con permiso de consulta:
              pueden consultar todas las órdenes.

            - Clientes:
              pueden consultar órdenes de sus equipos.

            - Técnicos:
              pueden consultar las órdenes asignadas.

        PRINCIPIO SRP:
            Este método se concentra en determinar
            el conjunto de órdenes accesibles.
        """

        usuario = self.request.user

        if usuario.has_perm(
            "reparaciones.view_ordenservicio"
        ):
            return (
                OrdenServicio.objects
                .select_related(
                    "equipo",
                    "equipo__cliente",
                    "tecnico"
                )
                .all()
            )

        filtros = Q(pk__in=[])

        if hasattr(
            usuario,
            "perfil_cliente"
        ):
            filtros |= Q(
                equipo__cliente__usuario=usuario
            )

        if hasattr(
            usuario,
            "perfil_tecnico"
        ):
            filtros |= Q(
                tecnico__usuario=usuario
            )

        return (
            OrdenServicio.objects
            .filter(filtros)
            .select_related(
                "equipo",
                "equipo__cliente",
                "tecnico"
            )
            .distinct()
        )

    # ======================================================
    # ASIGNACIÓN DE TÉCNICOS
    # ======================================================

    def asignar_tecnico(self, request, pk=None):
        """
        Asigna un técnico disponible a una orden.

        REGLAS DE NEGOCIO:
            1. El usuario necesita permiso de modificación.
            2. La orden no puede estar cerrada.
            3. El técnico debe estar disponible.

        SEGURIDAD:
            Se utiliza transaction.atomic() para
            garantizar la atomicidad de la operación.

            select_for_update() bloquea la orden
            mientras se realiza la actualización.

        Se conserva el comportamiento original
        de la asignación de técnicos.
        """

        # --------------------------------------------------
        # COMPROBAR PERMISOS
        # --------------------------------------------------

        if not request.user.has_perm(
            "reparaciones.change_ordenservicio"
        ):
            raise PermissionDenied(
                "No tiene permiso para asignar técnicos."
            )

        # --------------------------------------------------
        # VALIDAR DATOS
        # --------------------------------------------------

        serializer = AsignarTecnicoSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        tecnico = serializer.validated_data[
            "tecnico"
        ]

        # --------------------------------------------------
        # TRANSACCIÓN
        # --------------------------------------------------

        with transaction.atomic():

            orden = get_object_or_404(
                OrdenServicio.objects.select_for_update(),
                pk=pk
            )

            # No permitir asignaciones a órdenes cerradas.
            if orden.estado in [
                OrdenServicio.Estado.ENTREGADA,
                OrdenServicio.Estado.CANCELADA
            ]:
                return Response(
                    {
                        "detail": (
                            "No se puede asignar un técnico "
                            "a una orden cerrada."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Comprobar disponibilidad del técnico.
            if not tecnico.disponible:
                return Response(
                    {
                        "detail": (
                            "El técnico no está disponible."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Asignar técnico.
            orden.tecnico = tecnico

            try:
                orden.save(
                    update_fields=["tecnico"]
                )

            except ValidationError as error:
                return Response(
                    {
                        "detail": error.message_dict
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        return Response(
            OrdenServicioSerializer(orden).data,
            status=status.HTTP_200_OK
        )

    # ======================================================
    # CAMBIO DE ESTADO
    # ======================================================

    def cambiar_estado(self, request, pk=None):
        """
        Cambia el estado de una orden de reparación.

        PRINCIPIOS SOLID
        ----------------

        SRP:
            La vista coordina la solicitud HTTP,
            mientras que el servicio ejecuta
            la operación de negocio.

        OCP:
            Las políticas de autorización pueden
            extenderse con nuevas implementaciones.

        LSP:
            Las estrategias comparten un contrato común.

        ISP:
            La interfaz de autorización contiene
            únicamente el método necesario.

        DIP:
            La vista trabaja con el contrato de
            autorización proporcionado por la fábrica.

        PATRONES DE DISEÑO
        ------------------

        STATE:
            Valida las transiciones entre estados.

        STRATEGY:
            Selecciona el comportamiento de autorización
            según el estado solicitado.

        FACTORY METHOD:
            Delega la creación de las estrategias
            a creadores especializados.

        SERVICE LAYER:
            Ejecuta el cambio mediante
            ServicioOrdenReparacion.

        SEGURIDAD:
            Conserva transaction.atomic()
            y select_for_update().
        """

        # --------------------------------------------------
        # 1. VALIDAR DATOS RECIBIDOS
        # --------------------------------------------------

        serializer = CambiarEstadoSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        nuevo_estado = serializer.validated_data[
            "estado"
        ]

        # --------------------------------------------------
        # 2. STRATEGY + FACTORY METHOD
        # --------------------------------------------------

        # SelectorPoliticas utiliza creadores especializados
        # para obtener la estrategia correspondiente.
        #
        # Todas las estrategias implementan el contrato
        # AutorizarCambioEstado.

        politica = SelectorPoliticas.obtener(
            nuevo_estado
        )

        # --------------------------------------------------
        # 3. TRANSACCIÓN Y BLOQUEO
        # --------------------------------------------------

        with transaction.atomic():

            orden = get_object_or_404(
                OrdenServicio.objects.select_for_update(),
                pk=pk
            )

            # ----------------------------------------------
            # 4. STRATEGY: COMPROBAR AUTORIZACIÓN
            # ----------------------------------------------

            # La vista no necesita conocer directamente
            # las reglas de técnicos y administradores.
            #
            # La estrategia seleccionada aplica
            # las reglas correspondientes.

            politica.autorizar(
                request.user,
                orden
            )

            # ----------------------------------------------
            # 5. STATE: VALIDAR TRANSICIÓN
            # ----------------------------------------------

            # OrdenServicio utiliza el patrón State
            # para comprobar las transiciones permitidas.

            if not orden.puede_cambiar_a(
                nuevo_estado
            ):
                return Response(
                    {
                        "detail": (
                            "La transición solicitada no está "
                            "permitida desde el estado actual."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # ----------------------------------------------
            # 6. COMPROBAR TÉCNICO ASIGNADO
            # ----------------------------------------------

            # Conservamos esta comprobación de la
            # implementación original.

            if SelectorPoliticas.es_estado_tecnico(
                nuevo_estado
            ):
                if orden.tecnico is None:
                    return Response(
                        {
                            "detail": (
                                "La orden no tiene técnico asignado."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # ----------------------------------------------
            # 7. SERVICE LAYER: ACTUALIZAR ESTADO
            # ----------------------------------------------

            # PRINCIPIO SRP:
            # La vista no modifica directamente el estado
            # ni guarda los cambios en la base de datos.
            #
            # El servicio centraliza esta operación.

            ServicioOrdenReparacion.cambiar_estado(
                orden,
                nuevo_estado
            )

        # --------------------------------------------------
        # 8. RESPUESTA HTTP
        # --------------------------------------------------

        return Response(
            OrdenServicioSerializer(orden).data,
            status=status.HTTP_200_OK
        )