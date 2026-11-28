from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from catalogo.models import Producto, Articulo

from .models import SuscripcionActiva


@transaction.atomic
def activar_suscripciones(pedido):
    """
    Crea una SuscripcionActiva por cada plan del pedido que aún no tenga una.
    si se llama dos veces, la segunda no crea nada.
    """
    hoy = timezone.localdate()
    lineas = (pedido.detalles
              .filter(tipo_producto=Producto.Tipo.SUSCRIPCION, suscripcion_activa__isnull=True)
              .select_related('variante__producto__suscripcion'))

    creadas = []
    for detalle in lineas:
        plan = detalle.variante.producto.suscripcion
        suscripcion = SuscripcionActiva(
            usuario_id=pedido.usuario_id,
            plan=plan,
            detalle=detalle,
            fecha_inicio=hoy,
            fecha_vencimiento=SuscripcionActiva.calcular_vencimiento(hoy, plan),
        )
        suscripcion.full_clean()   # campos, CHECK y clean() (las reglas del trigger)
        suscripcion.save()
        creadas.append(suscripcion)
    return creadas

# Mismos estados que usa db.sql para "compra verificada"
ESTADOS_COMPRADO = ['PAGADO', 'EN_PROCESO', 'ENVIADO', 'ENTREGADO']
VIGENTES = [SuscripcionActiva.Estado.ACTIVA, SuscripcionActiva.Estado.PAUSADA]


def articulos_comprados(usuario):
    "Drones (artículos) que el usuario compró y pagó: los únicos que puede cubrir con un plan."
    return Articulo.objects.filter(
        producto__variantes__detalles_pedido__pedido__usuario=usuario,
        producto__variantes__detalles_pedido__pedido__estado_pedido__in=ESTADOS_COMPRADO,
    ).distinct()


def marcar_vencidas(suscripciones):
    "Pasa a VENCIDA las activas cuya fecha ya pasó. Devuelve cuántas cambió."
    return (suscripciones
            .filter(estado=SuscripcionActiva.Estado.ACTIVA, fecha_vencimiento__lt=timezone.localdate())
            .update(estado=SuscripcionActiva.Estado.VENCIDA))


@transaction.atomic
def cancelar_suscripcion(suscripcion):
    suscripcion = SuscripcionActiva.objects.select_for_update().get(pk=suscripcion.pk)
    if suscripcion.estado not in VIGENTES:
        raise ValidationError('Solo se pueden cancelar suscripciones activas o pausadas.')
    suscripcion.estado = SuscripcionActiva.Estado.CANCELADA
    suscripcion.save(update_fields=['estado'])
    return suscripcion