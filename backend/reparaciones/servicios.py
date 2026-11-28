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
from django.core.exceptions import ValidationError
from django.db import transaction

from catalogo.models import Variante
from ventas.models import Pedido, TransaccionPago
from ventas.servicios import crear_pedido_de_servicio, cancelar_pedido

SKU_REPARACION = 'SERV-REPARACION'


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
        # 1b. REGLAS DE COBRO (se valida ANTES de escribir)
        # ==================================================

        pedido_vigente = ServicioOrdenReparacion._validar_cobro(
            orden,
            nuevo_estado
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

        # ==================================================
        # 6. SI SE CANCELA, SE CANCELA TAMBIÉN EL COBRO
        # ==================================================

        if (
            nuevo_estado == OrdenServicio.Estado.CANCELADA
            and pedido_vigente is not None
        ):
            cancelar_pedido(pedido_vigente)

        return orden


    @staticmethod
    def _validar_cobro(orden, nuevo_estado):
        """
        Reglas de cobro de la reparación. Solo valida, no escribe nada.
        Devuelve el pedido vigente (o None si no hay cotización vigente).
        """
        pedido = orden.pedido if orden.pedido_id else None

        # Sin cotización (garantía, revisión gratuita) o el cliente la rechazó
        if pedido is None or pedido.estado_pedido == Pedido.Estado.CANCELADO:
            return None

        pagado = pedido.estado_pedido == Pedido.Estado.PAGADO

        if nuevo_estado == OrdenServicio.Estado.ENTREGADA and not pagado:
            raise ValidationError(
                'El cliente debe pagar la reparación antes de entregarla.'
            )

        if nuevo_estado == OrdenServicio.Estado.CANCELADA:
            if pagado:
                raise ValidationError(
                    'La reparación ya está pagada: registra el reembolso antes de cancelarla.'
                )
            if pedido.transacciones.filter(
                estado_pago=TransaccionPago.Estado.PENDIENTE
            ).exists():
                raise ValidationError(
                    'Hay un pago en revisión; confírmalo o recházalo antes de cancelar.'
                )

        return pedido
    

    @staticmethod
    @transaction.atomic
    def cotizar(orden, costo):
        """
        El técnico fija el precio tras el diagnóstico.
        Se crea un Pedido PENDIENTE que el cliente paga en "Mis pedidos".
        """
        orden = OrdenServicio.objects.select_for_update().get(pk=orden.pk)

        if orden.estado != OrdenServicio.Estado.EN_DIAGNOSTICO:
            raise ValidationError('Solo se cotiza una orden en diagnóstico.')

        if orden.pedido_id and orden.pedido.estado_pedido != Pedido.Estado.CANCELADO:
            raise ValidationError('Esta orden ya tiene una cotización vigente.')

        cliente = orden.equipo.cliente.usuario
        variante = Variante.objects.get(sku=SKU_REPARACION)
        pedido = crear_pedido_de_servicio(cliente, variante, costo)

        orden.costo = pedido.subtotal
        orden.pedido = pedido
        orden.save(update_fields=['costo', 'pedido'])
        return orden