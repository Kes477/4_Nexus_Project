"""
Formas de pago con el patrón  de Diseño Strategy.

Cada forma de pago es una estrategia con la misma interfaz (validar y procesar).
Para agregar una nueva: crear la clase y registrarla en ESTRATEGIAS.
"""
import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass

from django.core.exceptions import ValidationError

from .models import TransaccionPago


@dataclass
class ResultadoPago:
    """Lo que devuelve cada estrategia, siempre con la misma forma."""
    estado: str
    referencia: str = ''
    mensaje: str = ''


class EstrategiaPago(ABC):
    "Interfaz común de todas las formas de pago."

    clave = ''
    nombre = ''

    def validar(self, pedido, datos):
        """Lanza ValidationError si esta forma de pago no aplica al pedido."""

    @abstractmethod
    def procesar(self, pedido, datos):
        """Intenta cobrar y devuelve un ResultadoPago."""


class PagoConTarjeta(EstrategiaPago):
    clave = TransaccionPago.Forma.TARJETA
    nombre = 'Tarjeta de crédito o débito'

    def validar(self, pedido, datos):
        tarjeta = datos.get('metodo_pago')
        if tarjeta is None:
            raise ValidationError('Elige una tarjeta para pagar.')
        if tarjeta.usuario_id != pedido.usuario_id:
            raise ValidationError('La tarjeta elegida no es válida.')
        if tarjeta.esta_vencida():
            raise ValidationError('La tarjeta está vencida.')

    def procesar(self, pedido, datos):
        tarjeta = datos['metodo_pago']
        # Pasarela simulada: las tarjetas que terminan en 0000 se rechazan (para probar)
        if tarjeta.ultimos_cuatro == '0000':
            return ResultadoPago(
                TransaccionPago.Estado.RECHAZADO,
                mensaje='El banco rechazó la tarjeta.',
            )
        return ResultadoPago(
            TransaccionPago.Estado.APROBADO,
            referencia=f'SIM-{uuid.uuid4().hex[:12].upper()}',
            mensaje='Pago aprobado.',
        )


class PagoPorTransferencia(EstrategiaPago):
    clave = TransaccionPago.Forma.TRANSFERENCIA
    nombre = 'Transferencia bancaria'

    def procesar(self, pedido, datos):
        referencia = f'NEXUS-{pedido.pk:06d}'
        return ResultadoPago(
            TransaccionPago.Estado.PENDIENTE,
            referencia=referencia,
            mensaje=f'Transfiere el total usando la referencia {referencia}. '
                    'Confirmaremos tu pago al recibirlo.',
        )


class PagoContraEntrega(EstrategiaPago):
    clave = TransaccionPago.Forma.CONTRA_ENTREGA
    nombre = 'Pago contra entrega'

    def validar(self, pedido, datos):
        if pedido.direccion_id is None:
            raise ValidationError('El pago contra entrega solo aplica a pedidos con envío.')

    def procesar(self, pedido, datos):
        return ResultadoPago(
            TransaccionPago.Estado.PENDIENTE,
            mensaje='Pagarás en efectivo al recibir tu pedido.',
        )


# Registro de estrategias disponibles: la clave es lo que envía el frontend
ESTRATEGIAS = {
    estrategia.clave: estrategia
    for estrategia in (PagoConTarjeta(), PagoPorTransferencia(), PagoContraEntrega())
}


def obtener_estrategia(clave):
    try:
        return ESTRATEGIAS[clave]
    except KeyError:
        raise ValidationError('Forma de pago no disponible.')