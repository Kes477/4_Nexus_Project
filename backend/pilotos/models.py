from django.db import models
from django.core.exceptions import ValidationError
from .estados import FabricaEstados

class Mision(models.Model):
    class TipoMision(models.TextChoices):
        PERSONAL = 'PERSONAL', 'Uso Personal'
        TERCEROS = 'TERCEROS', 'Servicios a Terceros'

    class Estado(models.TextChoices):
        PENDIENTE = 'PENDIENTE', 'Pendiente'
        ACEPTADA = 'ACEPTADA', 'Aceptada'
        EN_CURSO = 'EN_CURSO', 'En Curso'
        COMPLETADA = 'COMPLETADA', 'Completada'
        RECHAZADA = 'RECHAZADA', 'Rechazada'
        CANCELADA = 'CANCELADA', 'Cancelada'

    piloto = models.ForeignKey(
        'usuarios.Piloto', 
        on_delete=models.PROTECT, 
        related_name='misiones',
        null=True,
        blank=True
    )
    
    producto = models.ForeignKey(
        'catalogo.Producto', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='misiones'
    )
    
    tipo_mision = models.CharField(
        max_length=20, 
        choices=TipoMision.choices, 
        default=TipoMision.TERCEROS
    )
    
    categoria = models.CharField(max_length=50, help_text="Ej: fotografia, fumigacion, monitoreo, etc.")
    cliente_nombre = models.CharField(max_length=200, blank=True, null=True)
    ubicacion = models.CharField(max_length=255)
    area_size = models.CharField(max_length=50, blank=True, null=True)
    fecha_programada = models.DateField()
    dron_asignado = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)

    capturas_generadas = models.PositiveIntegerField(default=0)
    distancia_km = models.DecimalField(max_digits=8, decimal_places=2, default=0)

    estado = models.CharField(max_length=20, choices=Estado.choices, default=Estado.PENDIENTE)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_cierre = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-fecha_programada']
        verbose_name = 'Misión'
        verbose_name_plural = 'Misiones'

    def puede_cambiar_a(self, nuevo_estado):
        estado_actual = FabricaEstados.obtener(self.estado)
        return estado_actual.puede_cambiar_a(nuevo_estado)

    def clean(self):
        super().clean()
        if self.pk is not None:
            estado_anterior = type(self).objects.filter(pk=self.pk).values_list('estado', flat=True).first()
            if estado_anterior and estado_anterior != self.estado:
                mision_anterior = type(self)(estado=estado_anterior)
                if not mision_anterior.puede_cambiar_a(self.estado):
                    raise ValidationError({'estado': 'La transición de estado no está permitida.'})

        estados_cerrados = [self.Estado.COMPLETADA, self.Estado.RECHAZADA, self.Estado.CANCELADA]
        if self.estado in estados_cerrados:
            if self.fecha_cierre is None:
                raise ValidationError({'fecha_cierre': 'Una misión cerrada debe tener fecha de cierre.'})
        else:
            if self.fecha_cierre is not None:
                raise ValidationError({'fecha_cierre': 'Una misión abierta no puede tener fecha de cierre.'})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Misión #{self.pk} - {self.categoria} - {self.piloto or 'Sin asignar'}"