from datetime import timedelta

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import F, Q
from django.utils import timezone


class SuscripcionActiva(models.Model):
    "TBL_SUSCRIPCIONES_ACTIVAS: el plan que compró un cliente y su vigencia."

    class Estado(models.TextChoices):
        ACTIVA = 'ACTIVA', 'Activa'
        PAUSADA = 'PAUSADA', 'Pausada'
        CANCELADA = 'CANCELADA', 'Cancelada'
        VENCIDA = 'VENCIDA', 'Vencida'

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='suscripciones'
    )
    plan = models.ForeignKey(
        'catalogo.Suscripcion', on_delete=models.PROTECT, related_name='activas'
    )
    # UQ_SUSC_ACT_DETALLE: cada línea del pedido genera como máximo una suscripción
    detalle = models.OneToOneField(
        'ventas.DetallePedido', on_delete=models.PROTECT, related_name='suscripcion_activa'
    )
    articulo_cubierto = models.ForeignKey(
        'catalogo.Articulo', on_delete=models.PROTECT,
        null=True, blank=True, related_name='suscripciones_que_lo_cubren',
    )
    fecha_inicio = models.DateField()
    fecha_vencimiento = models.DateField()
    estado = models.CharField(max_length=20, choices=Estado.choices, default=Estado.ACTIVA)

    class Meta:
        verbose_name = 'Suscripción activa'
        verbose_name_plural = 'Suscripciones activas'
        ordering = ['-fecha_inicio']
        constraints = [
            models.CheckConstraint(
                condition=Q(fecha_vencimiento__gt=F('fecha_inicio')),
                name='suscripcion_fechas_validas',
            ),
            models.CheckConstraint(
                condition=Q(estado__in=['ACTIVA', 'PAUSADA', 'CANCELADA', 'VENCIDA']),
                name='suscripcion_estado_valido',
            ),
        ]

    def clean(self):
        "Las reglas de TRG_VALIDAR_SUSCRIPCION_ACTIVA."
        if not self.detalle_id:
            return
        if self.usuario_id != self.detalle.pedido.usuario_id:
            raise ValidationError('El cliente de la suscripción debe ser el mismo que compró el plan.')
        if self.plan_id != self.detalle.variante.producto_id:
            raise ValidationError('El plan debe coincidir con el producto comprado en esa línea del pedido.')

    @staticmethod
    def calcular_vencimiento(inicio, plan):
        return inicio + timedelta(days=plan.periodo_facturacion_dias)

    @property
    def dias_restantes(self):
        return max(0, (self.fecha_vencimiento - timezone.localdate()).days)

    def __str__(self):
        return f'{self.plan} de {self.usuario} ({self.get_estado_display()})'


class RenovacionSuscripcion(models.Model):
    "TBL_RENOVACIONES_SUSCRIPCION: cada cobro de un nuevo periodo."

    class Estado(models.TextChoices):
        EXITOSO = 'EXITOSO', 'Exitoso'
        FALLIDO = 'FALLIDO', 'Fallido'
        PENDIENTE = 'PENDIENTE', 'Pendiente'

    suscripcion = models.ForeignKey(
        SuscripcionActiva, on_delete=models.PROTECT, related_name='renovaciones'
    )
    metodo_pago = models.ForeignKey(
        'ventas.MetodoPago', on_delete=models.PROTECT, related_name='renovaciones'
    )
    monto = models.DecimalField(max_digits=12, decimal_places=2)
    fecha_cobro = models.DateTimeField(auto_now_add=True)
    periodo_inicio = models.DateField()
    periodo_fin = models.DateField()
    estado_cobro = models.CharField(max_length=20, choices=Estado.choices)
    id_transaccion_externa = models.CharField(max_length=255, blank=True)

    class Meta:
        verbose_name = 'Renovación de suscripción'
        verbose_name_plural = 'Renovaciones de suscripción'
        ordering = ['-fecha_cobro']
        constraints = [
            models.CheckConstraint(condition=Q(monto__gt=0), name='renovacion_monto_positivo'),
            models.CheckConstraint(
                condition=Q(periodo_fin__gt=F('periodo_inicio')),
                name='renovacion_periodo_valido',
            ),
            models.CheckConstraint(
                condition=Q(estado_cobro__in=['EXITOSO', 'FALLIDO', 'PENDIENTE']),
                name='renovacion_estado_valido',
            ),
        ]

    def clean(self):
        "La regla de TRG_VALIDAR_RENOVACION_CLIENTE."
        if self.suscripcion_id and self.metodo_pago_id:
            if self.metodo_pago.usuario_id != self.suscripcion.usuario_id:
                raise ValidationError('La tarjeta de la renovación debe ser del titular de la suscripción.')

    def __str__(self):
        return f'Renovación {self.periodo_inicio} → {self.periodo_fin} ({self.get_estado_cobro_display()})'