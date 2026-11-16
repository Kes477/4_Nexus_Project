
"""
MÓDULO: REPARACIONES
ARCHIVO: servicios.py

OBJETIVO:
    Centralizar la operación de cambio de estado de las
    órdenes de reparación.

PRINCIPIO SOLID: SRP (SINGLE RESPONSIBILITY PRINCIPLE)
=====================================================

Responsabilidad Única:

    Esta clase se encarga de ejecutar la operación de negocio
    relacionada con el cambio de estado de una orden.

SEPARACIÓN DE RESPONSABILIDADES:

    views.py:
        - Recibe solicitudes HTTP.
        - Comprueba la identidad y permisos del usuario.
        - Controla las transacciones y bloqueos.
        - Devuelve las respuestas HTTP.

    models.py:
        - Representa los datos de la orden.
        - Protege la integridad de los datos.
        - Delega las reglas de transición al patrón State.

    estados.py:
        - Define las transiciones permitidas.
        - Implementa las clases del patrón State.

    servicios.py:
        - Coordina la operación de cambio de estado.
        - Actualiza la fecha de cierre cuando corresponde.
        - Guarda la orden.

PATRÓN ARQUITECTÓNICO:
    Service Layer (Capa de Servicios).

    Se utiliza como una técnica de separación de
    responsabilidades, no como uno de los 23 patrones
    de diseño GoF.

OTROS PRINCIPIOS SOLID:

    OCP:
        El servicio utiliza el método puede_cambiar_a()
        y no necesita conocer las clases concretas de estado.

    DIP:
        No se implementa completamente en este archivo,
        porque todavía depende del modelo concreto
        OrdenServicio y de su mecanismo de persistencia.

    ISP:
        No se demuestra directamente en esta clase.
"""

from django.utils import timezone

from .models import OrdenServicio

class ServicioOrdenReparacion:
    """
    Servicio de aplicación para órdenes de reparación.

    PRINCIPIO SOLID: SRP
    --------------------
    Esta clase concentra la operación de cambio de estado.

    No gestiona solicitudes HTTP, autenticación ni permisos.
    """

    @staticmethod
    def cambiar_estado(orden, nuevo_estado):
        """
        Ejecuta el cambio de estado de una orden.

        RESPONSABILIDADES:
            1. Validar la transición solicitada.
            2. Actualizar el estado de la orden.
            3. Registrar la fecha de cierre cuando corresponda.
            4. Guardar los cambios en la base de datos.

        PRINCIPIO SRP:
            La operación de negocio está separada de la vista.

        RELACIÓN CON EL PATRÓN STATE:
            La validación se delega a
            orden.puede_cambiar_a(nuevo_estado).

            Este método utiliza las clases de estados.py
            mediante el modelo OrdenServicio.

        Parámetros:
            orden (OrdenServicio):
                Orden que se desea actualizar.

            nuevo_estado (str):
                Estado al que se desea cambiar.

        Retorna:
            OrdenServicio:
                Orden actualizada.

        Excepciones:
            ValueError:
                Si la transición no está permitida.

            ValidationError:
                Puede producirse si el modelo detecta
                datos que incumplen sus validaciones.

        IMPORTANTE:
            La vista debe comprobar los permisos y utilizar
            transaction.atomic() y select_for_update()
            cuando la operación requiera protección
            frente a actualizaciones concurrentes.
        """

        # ==================================================
        # VALIDACIÓN DE TRANSICIÓN - PATRÓN STATE
        # ==================================================

        # Se delega la comprobación al modelo, que utiliza
        # las implementaciones de estado correspondientes.
        if not orden.puede_cambiar_a(nuevo_estado):
            raise ValueError(
                "La transición solicitada no está permitida "
                "desde el estado actual."
            )

        # ==================================================
        # ACTUALIZACIÓN DEL ESTADO
        # ==================================================

        orden.estado = nuevo_estado

        # ==================================================
        # REGLA DE NEGOCIO: FECHA DE CIERRE
        # ==================================================

        # Las órdenes entregadas o canceladas deben
        # registrar la fecha en que se cierran.
        if nuevo_estado in (
            OrdenServicio.Estado.ENTREGADA,
            OrdenServicio.Estado.CANCELADA,
        ):
            orden.fecha_cierre = timezone.now()

        # ==================================================
        # PERSISTENCIA
        # ==================================================

        # save() ejecuta full_clean() en el modelo,
        # comprobando las reglas de integridad antes
        # de guardar los cambios.
        orden.save(
            update_fields=["estado", "fecha_cierre"]
        )

        return orden