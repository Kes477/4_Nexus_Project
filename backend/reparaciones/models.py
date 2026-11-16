
from django.db import models
from django.core.exceptions import ValidationError


class EquipoCliente(models.Model):

    cliente = models.ForeignKey(
        'usuarios.PerfilCliente',
        on_delete=models.PROTECT,
        related_name='equipos'
    )

    articulo = models.ForeignKey(
        'catalogo.Articulo',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='equipos_clientes'
    )

    marca = models.CharField(max_length=100)

    modelo = models.CharField(max_length=100)

    numero_serie = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        unique=True
    )

    fecha_registro = models.DateTimeField(
        auto_now_add=True
    )

    def clean(self):
        super().clean()

        if self.numero_serie is not None:
            self.numero_serie = self.numero_serie.strip()

            if not self.numero_serie:
                self.numero_serie = None

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.marca} {self.modelo}"


class OrdenServicio(models.Model):

    class Estado(models.TextChoices):
        RECIBIDA = 'RECIBIDA', 'Recibida'
        EN_DIAGNOSTICO = 'EN_DIAGNOSTICO', 'En diagnóstico'
        EN_REPARACION = 'EN_REPARACION', 'En reparación'
        FINALIZADA = 'FINALIZADA', 'Finalizada'
        ENTREGADA = 'ENTREGADA', 'Entregada'
        CANCELADA = 'CANCELADA', 'Cancelada'

    equipo = models.ForeignKey(
        EquipoCliente,
        on_delete=models.PROTECT,
        related_name='ordenes_servicio'
    )

    tecnico = models.ForeignKey(
        'usuarios.Tecnico',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='ordenes_asignadas'
    )

    descripcion_problema = models.TextField()

    estado = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.RECIBIDA
    )

    fecha_recepcion = models.DateTimeField(
        auto_now_add=True
    )

    fecha_cierre = models.DateTimeField(
        null=True,
        blank=True
    )

    observaciones = models.TextField(
        blank=True
    )

    class Meta:
        ordering = ['-fecha_recepcion']

    def puede_cambiar_a(self, nuevo_estado):

        transiciones_permitidas = {
            self.Estado.RECIBIDA: [
                self.Estado.EN_DIAGNOSTICO,
                self.Estado.CANCELADA
            ],

            self.Estado.EN_DIAGNOSTICO: [
                self.Estado.EN_REPARACION,
                self.Estado.CANCELADA
            ],

            self.Estado.EN_REPARACION: [
                self.Estado.FINALIZADA,
                self.Estado.CANCELADA
            ],

            self.Estado.FINALIZADA: [
                self.Estado.ENTREGADA,
                self.Estado.CANCELADA
            ],

            self.Estado.ENTREGADA: [],
            self.Estado.CANCELADA: []
        }

        return nuevo_estado in transiciones_permitidas.get(
            self.estado,
            []
        )

    def clean(self):
        super().clean()

        # Validar transiciones en órdenes existentes
        if self.pk is not None:

            estado_anterior = (
                type(self).objects
                .filter(pk=self.pk)
                .values_list('estado', flat=True)
                .first()
            )

            if (
                estado_anterior is not None
                and estado_anterior != self.estado
            ):

                orden_anterior = type(self)(
                    estado=estado_anterior
                )

                if not orden_anterior.puede_cambiar_a(self.estado):
                    raise ValidationError({
                        'estado':
                        'La transición de estado no está permitida.'
                    })

        # Validar la fecha de cierre
        estados_cerrados = [
            self.Estado.ENTREGADA,
            self.Estado.CANCELADA
        ]

        if self.estado in estados_cerrados:

            if self.fecha_cierre is None:
                raise ValidationError({
                    'fecha_cierre':
                    'Una orden cerrada debe tener fecha de cierre.'
                })

        else:

            if self.fecha_cierre is not None:
                raise ValidationError({
                    'fecha_cierre':
                    'Una orden abierta no puede tener fecha de cierre.'
                })

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Orden #{self.pk} - {self.equipo}"
