
"""
MÓDULO: REPARACIONES
ARCHIVO: models.py

OBJETIVO:
    Representar los equipos de los clientes y las órdenes
    de servicio técnico mediante modelos Django.

PATRÓN DE DISEÑO:
    State (Estado).

PRINCIPIOS SOLID APLICADOS:

1. SRP - SINGLE RESPONSIBILITY PRINCIPLE
   Responsabilidad única.

   El modelo OrdenServicio representa y valida la integridad
   de una orden, pero delega las reglas particulares de
   transición a las clases del módulo estados.py.

2. OCP - OPEN/CLOSED PRINCIPLE
   Abierto/Cerrado.

   Las reglas de transición se organizan en clases separadas.
   Es posible extenderlas sin modificar el método
   OrdenServicio.puede_cambiar_a().

   Agregar un estado nuevo requiere también registrarlo
   en la fábrica y en las opciones del modelo.

3. LSP - LISKOV SUBSTITUTION PRINCIPLE
   Sustitución de Liskov.

   El modelo utiliza las implementaciones de EstadoOrden
   mediante un comportamiento común: puede_cambiar_a().

   Cada implementación debe respetar el contrato definido
   por la clase abstracta EstadoOrden.

IMPORTANTE:
    Las validaciones de integridad permanecen en los modelos.
    Los permisos HTTP se gestionan en las vistas.
"""

from django.db import models
from django.core.exceptions import ValidationError

from .estados import FabricaEstados

class EquipoCliente(models.Model):
    """
    Representa un equipo registrado por un cliente.

    PRINCIPIO SOLID: SRP

    Responsabilidad:
        Almacenar y validar los datos del equipo.

    Esta clase no gestiona órdenes de reparación,
    permisos HTTP ni transiciones de estado.
    """

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
        """
        Normaliza el número de serie del equipo.

        REGLA DE NEGOCIO:
            - Elimina espacios al inicio y al final.
            - Convierte cadenas vacías en None.

        PRINCIPIO SRP:
            Esta validación pertenece al modelo porque
            protege la integridad de sus propios datos.
        """
        super().clean()

        if self.numero_serie is not None:
            self.numero_serie = self.numero_serie.strip()

            if not self.numero_serie:
                self.numero_serie = None

    def save(self, *args, **kwargs):
        """
        Valida los datos antes de guardarlos.

        full_clean() ejecuta las validaciones del modelo
        antes de realizar la operación de persistencia.
        """
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        """Representación legible del equipo."""
        return f"{self.marca} {self.modelo}"

class OrdenServicio(models.Model):
    """
    Representa una orden de reparación de un equipo.

    PRINCIPIO SOLID: SRP

    Responsabilidades:
        - Representar los datos de la orden.
        - Proteger las reglas de integridad.
        - Delegar las transiciones al patrón State.

    La clase no contiene directamente el listado
    de transiciones permitidas de cada estado.

    PATRÓN STATE:
        Utiliza FabricaEstados para obtener el objeto
        que representa su estado actual.
    """

    class Estado(models.TextChoices):
        """
        Define los estados almacenados en la base de datos.

        Estos valores deben coincidir con los identificadores
        utilizados por las clases de estados.py.
        """

        RECIBIDA = 'RECIBIDA', 'Recibida'

        EN_DIAGNOSTICO = (
            'EN_DIAGNOSTICO',
            'En diagnóstico'
        )

        EN_REPARACION = (
            'EN_REPARACION',
            'En reparación'
        )

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
        """
        Determina si una transición de estado está permitida.

        PATRÓN DE DISEÑO: STATE
        ----------------------
        El modelo delega la validación al objeto que
        representa su estado actual.

        PRINCIPIO SRP:
            OrdenServicio no define las reglas particulares
            de cada estado.

        PRINCIPIO OCP:
            Este método no necesita modificarse cuando
            se incorporan nuevas implementaciones de estado
            compatibles con la fábrica.

        PRINCIPIO LSP:
            Las clases de estado utilizan un contrato común
            y ofrecen el método puede_cambiar_a().

        Parámetros:
            nuevo_estado (str):
                Estado al que se desea realizar la transición.

        Retorna:
            bool:
                True si la transición está permitida.
                False en caso contrario.
        """

        # La fábrica selecciona la implementación concreta.
        estado_actual = FabricaEstados.obtener(self.estado)

        # La validación se delega al patrón State.
        return estado_actual.puede_cambiar_a(nuevo_estado)

    def clean(self):
        """
        Valida la integridad de una orden de servicio.

        REGLAS DE NEGOCIO:

        1. Una orden existente solamente puede cambiar
           a un estado permitido.

        2. Una orden ENTREGADA o CANCELADA debe
           tener fecha de cierre.

        3. Una orden abierta no puede tener fecha de cierre.

        PRINCIPIO SOLID: SRP
        -------------------
        Este método protege la integridad del modelo.

        Las reglas de transición no están duplicadas aquí:
        se consultan mediante puede_cambiar_a(),
        que delega al patrón State.

        IMPORTANTE:
            Se mantiene la validación del estado anterior
            almacenado en la base de datos para evitar
            cambios inválidos al guardar una orden.
        """

        super().clean()

        # ==================================================
        # VALIDACIÓN 1: TRANSICIONES DE ESTADO
        # ==================================================

        if self.pk is not None:

            # Consultar el estado que tiene la orden
            # actualmente en la base de datos.
            estado_anterior = (
                type(self).objects
                .filter(pk=self.pk)
                .values_list('estado', flat=True)
                .first()
            )

            # Solo validar si el estado ha cambiado.
            if (
                estado_anterior is not None
                and estado_anterior != self.estado
            ):

                # Representar el estado anterior para
                # consultar sus transiciones permitidas.
                orden_anterior = type(self)(
                    estado=estado_anterior
                )

                # La validación utiliza el patrón State.
                if not orden_anterior.puede_cambiar_a(self.estado):
                    raise ValidationError({
                        'estado':
                        'La transición de estado no está permitida.'
                    })

        # ==================================================
        # VALIDACIÓN 2: FECHA DE CIERRE
        # ==================================================

        estados_cerrados = [
            self.Estado.ENTREGADA,
            self.Estado.CANCELADA
        ]

        if self.estado in estados_cerrados:

            # Las órdenes cerradas deben tener fecha de cierre.
            if self.fecha_cierre is None:
                raise ValidationError({
                    'fecha_cierre':
                    'Una orden cerrada debe tener fecha de cierre.'
                })

        else:

            # Las órdenes abiertas no deben tener fecha de cierre.
            if self.fecha_cierre is not None:
                raise ValidationError({
                    'fecha_cierre':
                    'Una orden abierta no puede tener fecha de cierre.'
                })

    def save(self, *args, **kwargs):
        """
        Guarda una orden después de validar su integridad.

        PRINCIPIO SRP:
            El modelo es responsable de garantizar
            la consistencia de sus propios datos.

        full_clean() ejecuta las validaciones definidas
        en clean() antes de guardar la orden.
        """

        self.full_clean()

        super().save(*args, **kwargs)

    def __str__(self):
        """
        Devuelve una representación legible de la orden.
        """
        return f"Orden #{self.pk} - {self.equipo}"