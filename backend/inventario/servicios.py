from django.core.exceptions import ValidationError
from django.db import transaction

from .models import Inventario, MovimientoInventario

Tipo = MovimientoInventario.Tipo

def _bloquear(inventario): #Vuelve a leer inventario y bloquea su fila hasta que termine la transaccion
    return Inventario.objects.select_for_update().get(pk=inventario.pk)

def _validar_cantidad(cantidad):
    if cantidad <=0:
        raise ValidationError('La cantidad debe ser mayor que cero')

def _registrar_movimiento(inventario, tipo, cantidad, usuario, motivo):
    MovimientoInventario.objects.create(
        inventario=inventario,
        tipo=tipo,
        cantidad =cantidad,
        usuario=usuario,
        motivo=motivo,

    )

@transaction.atomic
def registrar_entrada(inventario, cantidad, usuario=None, motivo =''): #Llegan unidades nuevas a almacen
    _validar_cantidad(cantidad)
    inventario = _bloquear(inventario)

    inventario.cantidad_disponible += cantidad
    inventario.save(update_fields=['cantidad_disponible'])

    _registrar_movimiento(inventario, Tipo.ENTRADA, cantidad, usuario, motivo)
    return inventario

@transaction.atomic
def reservar_stock(inventario, cantidad, usuario=None, motivo =''):#aparta unidades para un pedido que aun no se paga
    _validar_cantidad(cantidad)
    inventario = _bloquear(inventario)

    if inventario.cantidad_disponible < cantidad:
        raise ValidationError(
            f'Stock insuficiente: solo hay {inventario.cantidad_disponible} disponibles'
        )
    inventario.cantidad_disponible -= cantidad
    inventario.cantidad_reservada += cantidad
    inventario.save(update_fields=['cantidad_disponible','cantidad_reservada'])

    _registrar_movimiento(inventario, Tipo.RESERVA, cantidad, usuario, motivo)
    return inventario

@transaction.atomic
def liberar_reserva(inventario, cantidad, usuario=None, motivo=''): #devuelve a disponible unidades reservadas
    _validar_cantidad(cantidad)
    inventario = _bloquear(inventario)
    if inventario.cantidad_reservada < cantidad:
        raise ValidationError(
            f'no se pueden liberar {cantidad}: solo hay {inventario.cantidad_reservada} reservada'
        )
    inventario.cantidad_reservada -= cantidad
    inventario.cantidad_disponible += cantidad
    inventario.save(update_fields=['cantidad_disponible','cantidad_reservada'])

    _registrar_movimiento(inventario, Tipo.LIBERACION, cantidad, usuario, motivo)
    return inventario

@transaction.atomic
def confirmar_salida(inventario, cantidad, usuario=None, motivo=''): #las unidades reservadas salen del almacen
    _validar_cantidad(cantidad)
    inventario = _bloquear(inventario)

    if inventario.cantidad_reservada < cantidad:
        raise ValidationError(
            f'No se puede entregar {cantidad}: solo hay {inventario.cantidad_reservada} reservadas.'
        )

    inventario.cantidad_reservada -= cantidad
    inventario.save(update_fields=['cantidad_reservada'])

    _registrar_movimiento(inventario, Tipo.SALIDA, cantidad, usuario,motivo)
    return inventario


@transaction.atomic
def ajustar_inventario(inventario, cantidad_real, usuario=None, motivo=''):
    if not motivo.strip():
        raise ValidationError('Un ajuste necesita motivo')
    if cantidad_real<0:
        raise ValidationError('La cantidad real no puede ser negativa')

    inventario = _bloquear(inventario)
    diferencia = cantidad_real - inventario.cantidad_disponible

    if diferencia == 0:
        raise ValidationError('El conteo coincide con el sistema')

    inventario.cantidad_disponible = cantidad_real
    inventario.save(update_fields=['cantidad_disponible'])

    _registrar_movimiento(inventario, Tipo.AJUSTE, diferencia, usuario, motivo)
    return inventario