"""
MODULO: REPARACIONES
ARCHIVO: servicios.py

PATRON ARQUITECTONICO: SERVICE LAYER

PRINCIPIOS SOLID:

SRP:
    Centraliza las operaciones de negocio relacionadas
    con la actualizacion de ordenes de servicio.

OCP:
    Delega las reglas de transicion al patron State.

HU-015:
    Permite actualizar el estado y registrar
    observaciones tecnicas en una misma operacion.
"""

from django.utils import timezone

from .models import OrdenServicio


class ServicioOrdenReparacion:

    """
    Servicio de aplicacion para ordenes de reparacion.

    No gestiona solicitudes HTTP, autenticacion
    ni permisos de usuario.
    """

    @staticmethod
    def cambiar_estado(
        orden,
        nuevo_estado,
        observaciones=None
    ):

        """
        Ejecuta una transicion de estado y permite
        agregar observaciones tecnicas.

        La vista debe comprobar los permisos y
        controlar la transaccion.
        """

        # ==================================================
        # 1. VALIDAR TRANSICION MEDIANTE STATE
        # ==================================================

        if not orden.puede_cambiar_a(nuevo_estado):

            raise ValueError(
                "La transición solicitada no está permitida "
                "desde el estado actual."
            )

        # ==================================================
        # 2. ACTUALIZAR ESTADO
        # ==================================================

        orden.estado = nuevo_estado

        campos_actualizados = [
            "estado",
            "fecha_cierre"
        ]

        # ==================================================
        # 3. REGISTRAR OBSERVACIONES TECNICAS
        # ==================================================

        if observaciones is not None:

            observaciones = observaciones.strip()

            if observaciones:

                fecha = timezone.localtime(
                    timezone.now()
                ).strftime("%d/%m/%Y %H:%M")

                nombre_estado = orden.get_estado_display()

                registro = (
                    f"[{fecha} - {nombre_estado}]\n"
                    f"{observaciones}"
                )

                if orden.observaciones.strip():

                    orden.observaciones = (
                        orden.observaciones.rstrip()
                        + "\n\n"
                        + registro
                    )

                else:

                    orden.observaciones = registro

                campos_actualizados.append(
                    "observaciones"
                )

        # ==================================================
        # 4. REGISTRAR FECHA DE CIERRE
        # ==================================================

        if nuevo_estado in (
            OrdenServicio.Estado.ENTREGADA,
            OrdenServicio.Estado.CANCELADA,
        ):

            orden.fecha_cierre = timezone.now()

        # ==================================================
        # 5. PERSISTENCIA
        # ==================================================

        orden.save(
            update_fields=campos_actualizados
        )

        return orden