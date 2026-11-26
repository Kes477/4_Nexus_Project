from decimal import Decimal

from django.conf import settings
from django.db import models
from django.db.models import F, Q
from django.utils import timezone


class Carrito(models.Model):
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='carrito'
    )
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Carrito'
        verbose_name_plural = 'Carritos'

    def __str__(self):
        return f'Carrito de {self.usuario}'

    @property
    def subtotal(self):
        return sum((detalle.subtotal for detalle in self.detalles.all()), 0)


class CarritoDetalle(models.Model):
    carrito = models.ForeignKey(Carrito, on_delete=models.CASCADE, related_name='detalles')
    variante = models.ForeignKey(
        'catalogo.Variante', on_delete=models.CASCADE, related_name='en_carritos'
    )
    cantidad = models.PositiveIntegerField(default=1)
    fecha_agregado = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Detalle de carrito'
        verbose_name_plural = 'Detalles de carrito'
        ordering = ['fecha_agregado']
        constraints = [
            models.UniqueConstraint(
                fields=['carrito', 'variante'], name='variante_unica_por_carrito'
            ),
            models.CheckConstraint(
                condition=Q(cantidad__gte=1), name='carrito_cantidad_minima'
            ),
        ]

    def __str__(self):
        return f'{self.cantidad} x {self.variante}'

    @property
    def subtotal(self):
        return self.cantidad * self.variante.precio

class Cupon(models.Model):

    class Tipo(models.TextChoices):
        PORCENTAJE = 'P', 'Porcentaje'
        MONTO = 'M', 'Monto fijo'

    codigo = models.CharField(max_length=50, unique=True)
    tipo_descuento = models.CharField(max_length=1, choices=Tipo.choices)
    valor_descuento = models.DecimalField(max_digits=12, decimal_places=2)
    fecha_inicio = models.DateField()
    fecha_expiracion = models.DateField()
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Cupón'
        verbose_name_plural = 'Cupones'
        ordering = ['-fecha_inicio']
        constraints = [
            models.CheckConstraint(
                condition=Q(valor_descuento__gt=0)
                & (Q(tipo_descuento='M') | Q(valor_descuento__lte=100)),
                name='cupon_valor_valido',
            ),
            models.CheckConstraint(
                condition=Q(fecha_expiracion__gte=F('fecha_inicio')),
                name='cupon_fechas_validas',
            ),
        ]

    def __str__(self):
        return self.codigo

    def esta_vigente(self, fecha=None):
        fecha = fecha or timezone.localdate()
        return self.activo and self.fecha_inicio <= fecha <= self.fecha_expiracion

    def calcular_descuento(self, subtotal):
        if self.tipo_descuento == self.Tipo.PORCENTAJE:
            descuento = subtotal * self.valor_descuento / 100
        else:
            descuento = self.valor_descuento
        # Nunca más que el subtotal, y siempre con 2 decimales
        return min(descuento, subtotal).quantize(Decimal('0.01'))


class Pedido(models.Model):

    class Estado(models.TextChoices):
        PENDIENTE = 'PENDIENTE', 'Pendiente de pago'
        PAGADO = 'PAGADO', 'Pagado'
        EN_PROCESO = 'EN_PROCESO', 'En proceso'
        ENVIADO = 'ENVIADO', 'Enviado'
        ENTREGADO = 'ENTREGADO', 'Entregado'
        CANCELADO = 'CANCELADO', 'Cancelado'

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='pedidos'
    )
    fecha_pedido = models.DateTimeField(auto_now_add=True)
    estado_pedido = models.CharField(
        max_length=50, choices=Estado.choices, default=Estado.PENDIENTE
    )
    direccion = models.ForeignKey(
        'ubicaciones.Direccion',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='pedidos',
    )
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    total_descuento = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    costo_envio = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_impuestos = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_final = models.DecimalField(max_digits=12, decimal_places=2)
    cupon = models.ForeignKey(
        Cupon, on_delete=models.PROTECT, null=True, blank=True, related_name='pedidos'
    )

    class Meta:
        verbose_name = 'Pedido'
        verbose_name_plural = 'Pedidos'
        ordering = ['-fecha_pedido']
        constraints = [
            models.CheckConstraint(
                condition=Q(subtotal__gte=0)
                & Q(total_descuento__gte=0)
                & Q(total_descuento__lte=F('subtotal'))
                & Q(costo_envio__gte=0)
                & Q(total_impuestos__gte=0)
                & Q(total_final__gte=0),
                name='pedido_montos_validos',
            ),
            models.CheckConstraint(
                condition=Q(cupon__isnull=False) | Q(total_descuento=0),
                name='pedido_descuento_requiere_cupon',
            ),
            models.CheckConstraint(
                condition=Q(
                    total_final=F('subtotal') - F('total_descuento')
                    + F('costo_envio') + F('total_impuestos')
                ),
                name='pedido_total_cuadra',
            ),
        ]

    def __str__(self):
        return f'Pedido #{self.pk} de {self.usuario}'


class DetallePedido(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='detalles')
    variante = models.ForeignKey(
        'catalogo.Variante', on_delete=models.PROTECT, related_name='detalles_pedido'
    )
    tipo_producto = models.CharField(max_length=20)
    cantidad = models.PositiveIntegerField()
    precio_unitario = models.DecimalField(max_digits=12, decimal_places=2)
    subtotal_linea = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        verbose_name = 'Detalle de pedido'
        verbose_name_plural = 'Detalles de pedido'
        constraints = [
            models.UniqueConstraint(fields=['pedido', 'variante'], name='variante_unica_por_pedido'),
            models.CheckConstraint(condition=Q(precio_unitario__gt=0), name='detalle_precio_positivo'),
            models.CheckConstraint(
                condition=Q(subtotal_linea=F('cantidad') * F('precio_unitario')),
                name='detalle_subtotal_cuadra',
            ),
            models.CheckConstraint(
                condition=(Q(tipo_producto='ARTICULO') & Q(cantidad__gte=1))
                | (Q(tipo_producto__in=['SERVICIO', 'SUSCRIPCION']) & Q(cantidad=1)),
                name='detalle_cantidad_segun_tipo',
            ),
        ]

    def __str__(self):
        return f'{self.cantidad} x {self.variante}'


class ReservaPedido(models.Model):
    "De qué almacén se apartaron las unidades de cada línea (no está en db.sql)."

    detalle = models.ForeignKey(DetallePedido, on_delete=models.CASCADE, related_name='reservas')
    inventario = models.ForeignKey(
        'inventario.Inventario', on_delete=models.PROTECT, related_name='reservas_pedido'
    )
    cantidad = models.PositiveIntegerField()

    class Meta:
        verbose_name = 'Reserva de pedido'
        verbose_name_plural = 'Reservas de pedido'
        constraints = [
            models.UniqueConstraint(fields=['detalle', 'inventario'], name='reserva_unica_por_almacen'),
            models.CheckConstraint(condition=Q(cantidad__gte=1), name='reserva_cantidad_minima'),
        ]

    def __str__(self):
        return f'{self.cantidad} de {self.inventario}'