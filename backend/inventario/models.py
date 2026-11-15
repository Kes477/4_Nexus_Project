from django.db import models
from django.db.models import Q
from django.conf import settings
from django.core.exceptions import ValidationError

from catalogo.models import Producto, Variante

class Almacen(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    direccion = models.CharField(max_length=255)
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'almacén'
        verbose_name_plural = 'almacenes'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class Inventario(models.Model):
    almacen = models.ForeignKey(
        Almacen, on_delete=models.PROTECT, related_name='inventarios'
    )
    variante = models.ForeignKey(
        Variante, on_delete=models.PROTECT, related_name = 'inventarios'
    )
    cantidad_disponible = models.PositiveIntegerField(default=0)
    cantidad_reservada = models.PositiveIntegerField(default=0)
    ubicacion_pasillo = models.CharField(max_length=50, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['almacen','variante'],
                name = 'inventario_unico_por_almacen_variante',
            ),
        ]

    def clean(self):
        if self.variante_id and self.variante.producto.tipo_producto != Producto.Tipo.ARTICULO:
            raise ValidationError('Solo los artículos físicos pueden tener inventario')

    @property
    def cantidad_total(self):
        return self.cantidad_disponible + self.cantidad_reservada

    def __str__(self):
        return f'{self.variante.sku} en {self.almacen}'

class MovimientoInventario(models.Model):
    class Tipo(models.TextChoices):
        ENTRADA = 'ENTRADA', 'Entrada'
        SALIDA = 'SALIDA', 'Salida'
        AJUSTE = 'AJUSTE', 'Ajuste'
        RESERVA = 'RESERVA','Reserva'
        LIBERACION =  'LIBERACION','Liberacion de reserva'

    inventario = models.ForeignKey(
        Inventario, on_delete=models.PROTECT, related_name='movimientos'
    )
    tipo = models.CharField(max_length=20, choices=Tipo.choices)
    cantidad = models.IntegerField()
    motivo = models.CharField(max_length=255, blank=True)
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='movimientos_inventario'
    )
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'movimiento de inventario'
        verbose_name_plural ='movimientos de inventario'
        ordering = ['-fecha']
        constraints = [
            models.CheckConstraint(
                condition=~Q(cantidad = 0),
                name = 'movimiento_cantidad_distinta_de_cero',
            ),
        ]

    def __str__(self):
        return f'{self.get_tipo_display()} de {self.cantidad}-{self.inventario}'

