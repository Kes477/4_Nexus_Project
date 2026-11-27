from django.db import models
from django.core.exceptions import ValidationError
from django.db.models import Q

class Categoria(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.CharField(max_length=255, blank=True)
    categoria_padre = models.ForeignKey(
        'self',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='subcategorias',
    )

    class Meta:
        verbose_name = 'categoría'
        verbose_name_plural = 'categorías'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre

class Producto(models.Model):
    class Tipo(models.TextChoices):
        ARTICULO = 'ARTICULO', 'Artículo'
        SERVICIO = 'SERVICIO', 'Servicio'
        SUSCRIPCION = 'SUSCRIPCION', 'Suscripción'

    categoria = models.ForeignKey(Categoria, on_delete=models.PROTECT, related_name='productos')
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    tipo_producto = models.CharField(max_length=20, choices=Tipo.choices, default=Tipo.ARTICULO)
    activo = models.BooleanField(default=True)
    es_destacado = models.BooleanField(default=False)
    fecha_publicacion = models.DateTimeField(auto_now_add=True)
    mostrar_en_landing = models.BooleanField(default=False)
    orden_landing = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-fecha_publicacion']

    def __str__(self):
        return self.nombre

class Articulo(models.Model):
    producto = models.OneToOneField(
        Producto,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='articulo'
    )

    marca = models.CharField(max_length=100, blank=True)
    modelo = models.CharField(max_length=100, blank=True)
    peso_kg = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    dimensiones = models.CharField(max_length=100, blank=True)
    tiempo_vuelo_max_min = models.PositiveIntegerField(null=True, blank=True)
    alcance_max_km = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)

    def clean(self):
        if self.producto_id and self.producto.tipo_producto != Producto.Tipo.ARTICULO:
            raise ValidationError('Solo un producto de tipo Artículo puede tener datos de artículo')

    def __str__(self):
        return f'{self.marca} {self.modelo}'.strip() or str(self.producto)

class Suscripcion(models.Model):
    producto = models.OneToOneField(
        Producto,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='suscripcion'
    )

    periodo_facturacion_dias = models.IntegerField()
    cantidad_mantenimientos_incluidos = models.IntegerField(default=0)
    nivel_cobertura = models.CharField(max_length=100, blank=True)
    renovacion_automatica = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'suscripción'
        verbose_name_plural = 'suscripciones'
        constraints = [
            models.CheckConstraint(
                condition=Q(periodo_facturacion_dias__in=[30, 90, 365]),
                name='suscripcion_periodo_valido'
            ),
            models.CheckConstraint(
                condition=Q(cantidad_mantenimientos_incluidos__gte=0),
                name='suscripcion_mantenimientos_positivos'
            )
        ]

    def clean(self):
        if self.producto_id and self.producto.tipo_producto != Producto.Tipo.SUSCRIPCION:
            raise ValidationError('Solo un producto de tipo Suscripción puede tener datos de suscripción')

    def __str__(self):
        return str(self.producto)

class EspecificacionProducto(models.Model):
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='especificaciones')
    clave_espec = models.CharField(max_length=100)
    valor_espec = models.CharField(max_length=255)

    class Meta:
        verbose_name = 'especificación de producto'
        verbose_name_plural = 'especificaciones de productos'
        constraints = [
            models.UniqueConstraint(
                fields=['producto', 'clave_espec'],
                name='especificacion_unica_por_producto'
            )
        ]

    def __str__(self):
        return f'{self.clave_espec}: {self.valor_espec}'

class Variante(models.Model):
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='variantes')
    sku = models.CharField('SKU', max_length=50, unique=True)
    precio = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        ordering = ['precio']
        constraints = [
            models.CheckConstraint(
                condition=Q(precio__gt=0),
                name='variante_precio_positivo',
            )
        ]

    def __str__(self):
        return f'{self.producto} ({self.sku})'

class AtributoVariante(models.Model):
    variante = models.ForeignKey(Variante, on_delete=models.CASCADE, related_name='atributos')
    nombre_atributo = models.CharField(max_length=50)
    valor_atributo = models.CharField(max_length=50)

    class Meta:
        verbose_name = 'atributo de variante'
        verbose_name_plural = 'atributos de variante'
        constraints = [
            models.UniqueConstraint(
                fields=['variante', 'nombre_atributo'],
                name='atributo_unico_por_variante',
            )
        ]

    def __str__(self):
        return f'{self.nombre_atributo}: {self.valor_atributo}'

class ImagenArticulo(models.Model):
    articulo = models.ForeignKey(Articulo, on_delete=models.CASCADE, related_name='imagenes')
    url_imagen = models.URLField(max_length=500)
    imagen_principal = models.BooleanField(default=False)
    orden = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'imagen de artículo'
        verbose_name_plural = 'imágenes de artículo'
        ordering = ['orden']
        constraints = [
            models.UniqueConstraint(
                fields=['articulo'],
                condition=Q(imagen_principal=True),
                name='una_imagen_principal_por_articulo',
            ),
        ]

    def __str__(self):
        return f'Imagen {self.orden} de {self.articulo}'

class Resenia(models.Model):
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='resenias')
    cliente = models.ForeignKey('usuarios.Usuario', on_delete=models.CASCADE, related_name='resenias_escritas')
    mision = models.ForeignKey('pilotos.Mision', on_delete=models.CASCADE, null=True, blank=True, related_name='resenias')
    calificacion = models.DecimalField(max_digits=2, decimal_places=1)
    titulo = models.CharField(max_length=100, blank=True, null=True)
    comentario = models.TextField(blank=True, null=True)
    fecha_resenia = models.DateTimeField(auto_now_add=True)
    compra_verificada = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'reseña'
        verbose_name_plural = 'reseñas'
        constraints = [
            models.UniqueConstraint(
                fields=['cliente', 'mision'],
                name='resenia_unica_por_cliente_mision'
            ),
            models.CheckConstraint(
                condition=Q(calificacion__gte=1, calificacion__lte=5),
                name='resenia_calificacion_entre_1_y_5'
            )
        ]

    def __str__(self):
        return f'{self.producto.nombre} - {self.calificacion}'