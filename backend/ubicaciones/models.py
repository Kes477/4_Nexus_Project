from django.db import models
from django.conf import settings
from django.db.models import Q


class TipoUbicacion(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Tipo de Ubicación'
        verbose_name_plural = 'Tipos de Ubicaciones'
        ordering = ['id']

    def __str__(self):
        return self.nombre


class Ubicacion(models.Model):
    tipo = models.ForeignKey(TipoUbicacion, on_delete=models.PROTECT, related_name='ubicaciones')
    nombre = models.CharField(max_length=255)
    padre = models.ForeignKey(
        'self', on_delete=models.PROTECT, null=True, blank=True, related_name='hijos'
    )

    class Meta:
        verbose_name = 'Ubicación'
        verbose_name_plural = 'Ubicaciones'
        ordering = ['nombre']
        constraints = [
            models.UniqueConstraint(
                fields=['padre', 'nombre'],
                condition=Q(padre__isnull=False),
                name='ubicacion_unica_por_padre',
            ),
            models.UniqueConstraint(
                fields=['nombre'],
                condition=Q(padre__isnull=True),
                name='ubicacion_raiz_unica_por_nombre',
            ),
        ]

    def __str__(self):
        return f'{self.nombre}, {self.padre}' if self.padre_id else self.nombre


class Direccion(models.Model):
    class Tipo(models.TextChoices):
        CASA = 'casa', 'Casa'
        TRABAJO = 'trabajo', 'Trabajo'
        FINCA = 'finca', 'Finca / Terreno'
        OTRO = 'otro', 'Otro'

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='direcciones',
    )

    ubicacion = models.ForeignKey(
        Ubicacion,
        on_delete=models.PROTECT,
        related_name='direcciones',
        null=True,
        blank=True,
    )
    linea_direccion1 = models.CharField('dirección', max_length=255)
    linea_direccion2 = models.CharField('referencia', max_length=255, blank=True)
    codigo_postal = models.CharField(max_length=20, blank=True)
    es_principal = models.BooleanField(default=False)
    tipo_direccion = models.CharField(max_length=50, choices=Tipo.choices, default=Tipo.CASA)

    class Meta:
        verbose_name = 'Dirección'
        verbose_name_plural = 'Direcciones'
        ordering = ['-es_principal', 'id']
        constraints = [
            models.UniqueConstraint(
                fields=['usuario'],
                condition=Q(es_principal=True),
                name='una_direccion_principal_por_usuario',
            ),
        ]

    def __str__(self):
        if self.ubicacion_id:
            return f'{self.linea_direccion1}, {self.ubicacion}'
        return self.linea_direccion1