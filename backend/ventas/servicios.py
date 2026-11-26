from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Sum

from catalogo.models import Producto
from inventario.models import Inventario

from .models import Carrito, CarritoDetalle


def obtener_carrito(usuario):
    "Devuelve el carrito del usuario; lo crea la primera vez."
    carrito, _ = Carrito.objects.get_or_create(usuario=usuario)
    return carrito


def stock_disponible(variante):
    "Unidades disponibles de una variante sumando todos los almacenes activos."
    total = (Inventario.objects
             .filter(variante=variante, almacen__activo=True)
             .aggregate(total=Sum('cantidad_disponible'))['total'])
    return total or 0


def _validar_cantidad(variante, cantidad):
    producto = variante.producto

    if cantidad < 1:
        raise ValidationError('La cantidad debe ser al menos 1.')

    if not producto.activo:
        raise ValidationError('Este producto ya no está disponible.')

    # Regla de db.sql: servicios y suscripciones siempre con cantidad 1
    if producto.tipo_producto != Producto.Tipo.ARTICULO:
        if cantidad != 1:
            raise ValidationError('Los servicios y suscripciones solo se agregan una vez.')
        return

    disponible = stock_disponible(variante)
    if cantidad > disponible:
        raise ValidationError(f'Solo hay {disponible} unidades disponibles.')


def _tocar(carrito):
    "Actualiza la fecha del carrito (auto_now)."
    carrito.save(update_fields=['fecha_actualizacion'])


@transaction.atomic
def agregar_al_carrito(usuario, variante, cantidad=1):
    carrito = obtener_carrito(usuario)
    detalle = carrito.detalles.select_for_update().filter(variante=variante).first()

    nueva_cantidad = (detalle.cantidad if detalle else 0) + cantidad
    _validar_cantidad(variante, nueva_cantidad)

    if detalle:
        detalle.cantidad = nueva_cantidad
        detalle.save(update_fields=['cantidad'])
    else:
        detalle = CarritoDetalle.objects.create(
            carrito=carrito, variante=variante, cantidad=nueva_cantidad
        )

    _tocar(carrito)
    return detalle


@transaction.atomic
def cambiar_cantidad(detalle, cantidad):
    _validar_cantidad(detalle.variante, cantidad)
    detalle.cantidad = cantidad
    detalle.save(update_fields=['cantidad'])
    _tocar(detalle.carrito)
    return detalle


@transaction.atomic
def quitar_del_carrito(detalle):
    carrito = detalle.carrito
    detalle.delete()
    _tocar(carrito)


@transaction.atomic
def vaciar_carrito(usuario):
    carrito = obtener_carrito(usuario)
    carrito.detalles.all().delete()
    _tocar(carrito)