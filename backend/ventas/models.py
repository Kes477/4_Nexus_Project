from django.conf import settings
from django.db import models
from django.db.models import Q


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