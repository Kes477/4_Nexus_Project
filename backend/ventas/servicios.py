from decimal import ROUND_HALF_UP, Decimal
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Sum

from catalogo.models import Producto
from inventario.models import Inventario
from inventario.servicios import liberar_reserva, reservar_stock

from .models import Carrito, CarritoDetalle, Cupon, DetallePedido, Pedido, ReservaPedido


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


#######################################       PEDIDOS      #######################################################


CENTAVOS = Decimal('0.01')


def _redondear(valor):
    return valor.quantize(CENTAVOS, rounding=ROUND_HALF_UP)


def _es_articulo(variante):
    return variante.producto.tipo_producto == Producto.Tipo.ARTICULO

def requiere_direccion(lineas):
    "True si alguna linea es un articulo fisico (necesita envío)"
    return any(_es_articulo(variante) for variante, _ in lineas)

def buscar_cupon(codigo):
    "Devuelve el cupón vigente con ese código, o None si no se envió ninguno."
    if not codigo or not codigo.strip():
        return None
    cupon = Cupon.objects.filter(codigo__iexact=codigo.strip()).first()
    if cupon is None or not cupon.esta_vigente():
        raise ValidationError('El cupón no existe o ya no está vigente.')
    return cupon


def calcular_totales(lineas, cupon=None):
    """
    lineas: lista de (variante, cantidad).
    Devuelve los montos con los mismos nombres de las columnas de Pedido.
    """
    subtotal = sum((variante.precio * cantidad for variante, cantidad in lineas), Decimal('0'))
    descuento = cupon.calcular_descuento(subtotal) if cupon else Decimal('0')
    lleva_articulos = any(_es_articulo(variante) for variante, _ in lineas)
    envio = settings.VENTAS_COSTO_ENVIO if lleva_articulos else Decimal('0')
    impuestos = _redondear((subtotal - descuento) * settings.VENTAS_TASA_ISV)

    return {
        'subtotal': _redondear(subtotal),
        'total_descuento': descuento,
        'costo_envio': _redondear(envio),
        'total_impuestos': impuestos,
        'total_final': _redondear(subtotal - descuento + envio + impuestos),
    }


def _reservar_en_almacenes(detalle, usuario):
    """Aparta las unidades de la línea, empezando por el almacén con más stock."""
    pendiente = detalle.cantidad
    inventarios = (Inventario.objects
                   .select_for_update()
                   .filter(variante=detalle.variante, almacen__activo=True, cantidad_disponible__gt=0)
                   .order_by('-cantidad_disponible'))

    for inventario in inventarios:
        if pendiente == 0:
            break
        tomar = min(pendiente, inventario.cantidad_disponible)
        reservar_stock(inventario, tomar, usuario=usuario, motivo=f'Pedido #{detalle.pedido_id}')
        ReservaPedido.objects.create(detalle=detalle, inventario=inventario, cantidad=tomar)
        pendiente -= tomar

    if pendiente > 0:
        raise ValidationError(f'Ya no hay suficiente stock de {detalle.variante}.')


@transaction.atomic
def confirmar_pedido(usuario, direccion=None, codigo_cupon=''):
    """Convierte el carrito en un pedido PENDIENTE, reserva el stock y vacía el carrito."""
    carrito = obtener_carrito(usuario)
    lineas = list(
        carrito.detalles
        .select_related('variante__producto')
        .select_for_update(of=('self',))
    )

    if not lineas:
        raise ValidationError('El carrito está vacío.')

    # Se vuelve a validar: el stock o el producto pudieron cambiar desde que se agregó
    for linea in lineas:
        _validar_cantidad(linea.variante, linea.cantidad)

    lleva_articulos = any(_es_articulo(linea.variante) for linea in lineas)

    # Regla de db.sql (FN_VALIDAR_DIRECCION_PEDIDO)
    if lleva_articulos and direccion is None:
        raise ValidationError('Elige una dirección de envío.')
    if direccion is not None and direccion.usuario_id != usuario.id:
        raise ValidationError('La dirección elegida no es válida.')

    cupon = buscar_cupon(codigo_cupon)
    totales = calcular_totales([(linea.variante, linea.cantidad) for linea in lineas], cupon)

    pedido = Pedido.objects.create(usuario=usuario, direccion=direccion, cupon=cupon, **totales)

    for linea in lineas:
        precio = linea.variante.precio
        detalle = DetallePedido.objects.create(
            pedido=pedido,
            variante=linea.variante,
            tipo_producto=linea.variante.producto.tipo_producto,
            cantidad=linea.cantidad,
            precio_unitario=precio,
            subtotal_linea=precio * linea.cantidad,
        )
        if _es_articulo(linea.variante):
            _reservar_en_almacenes(detalle, usuario)

    carrito.detalles.all().delete()
    _tocar(carrito)
    return pedido


@transaction.atomic
def cancelar_pedido(pedido, usuario=None):
    "Cancela un pedido pendiente y devuelve el stock apartado a cada almacén."
    pedido = Pedido.objects.select_for_update().get(pk=pedido.pk)

    if pedido.estado_pedido != Pedido.Estado.PENDIENTE:
        raise ValidationError('Solo se pueden cancelar pedidos pendientes de pago.')

    reservas = ReservaPedido.objects.filter(detalle__pedido=pedido).select_related('inventario')
    for reserva in reservas:
        liberar_reserva(
            reserva.inventario, reserva.cantidad,
            usuario=usuario, motivo=f'Cancelación del pedido #{pedido.pk}',
        )

    pedido.estado_pedido = Pedido.Estado.CANCELADO
    pedido.save(update_fields=['estado_pedido'])
    return pedido