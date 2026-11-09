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
        related_name = 'subcategorias',
    )

    class Meta:
        verbose_name = 'categoría'
        verbose_name_plural ='categorías'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre

class Producto(models.Model):
    class Tipo(models.TextChoices):
        ARTICULO = 'ARTICULO', 'Artículo'
        SERVICIO = 'SERVICIO', 'Servicio'
        SUSCRIPCION = 'SUSCRIPCION','Suscripción'

    categoria = models.ForeignKey(Categoria, on_delete=models.PROTECT, related_name='productos')
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    tipo_producto = models.CharField(max_length=20, choices=Tipo.choices, default= Tipo.ARTICULO)
    activo = models.BooleanField(default=True)
    fecha_publicacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha_publicacion']

    def __str__(self):
        return self.nombre


class Articulo(models.Model):
    producto = models.OneToOneField(
        Producto,
        on_delete =models.CASCADE,
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
            raise ValidationError('Solo un produto de tipo Artículo puede tener datos de artículo')

    def __str__(self):
        return f'{self.marca} {self.modelo}'.strip() or str(self.producto)



class Variante(models.Model):
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='variantes')
    sku = models.CharField('SKU', max_length=50, unique=True)
    precio = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        ordering = ['precio']
        constraints = [
            models.CheckConstraint(
                condition=Q(precio__gt = 0),
                name= 'variante_precio_positivo',    
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
                name = 'atributo_unico_por_variante',
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
                name = 'una_imagen_principal_por_articulo',
            ),
        ]

    def __str__(self):
        return f'Imagen {self.orden} de {self.articulo}'
