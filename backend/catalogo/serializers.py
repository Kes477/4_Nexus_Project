from rest_framework import serializers
from .models import (
    Articulo, AtributoVariante, Categoria, ImagenArticulo,
    Producto, Variante, Resenia, Suscripcion, EspecificacionProducto
)

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'descripcion', 'categoria_padre']

class ImagenArticuloSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImagenArticulo
        fields = ['id', 'url_imagen', 'imagen_principal', 'orden']

class AtributoVarianteSerializer(serializers.ModelSerializer):
    class Meta:
        model = AtributoVariante
        fields = ['nombre_atributo', 'valor_atributo']

class VarianteSerializer(serializers.ModelSerializer):
    atributos = AtributoVarianteSerializer(many=True, read_only=True)
    disponible = serializers.SerializerMethodField()

    class Meta:
        model = Variante
        fields = ['id', 'sku', 'precio', 'disponible', 'atributos']

    def get_disponible(self, obj):
        return any(inv.cantidad_disponible > 0 for inv in obj.inventarios.all())

class ArticulosSerializer(serializers.ModelSerializer):
    imagenes = ImagenArticuloSerializer(many=True, read_only=True)

    class Meta:
        model = Articulo
        fields = ['marca', 'modelo', 'peso_kg', 'dimensiones', 'tiempo_vuelo_max_min', 'alcance_max_km', 'imagenes']

class SuscripcionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Suscripcion
        fields = ['periodo_facturacion_dias', 'cantidad_mantenimientos_incluidos', 'nivel_cobertura', 'renovacion_automatica']

class EspecificacionProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EspecificacionProducto
        fields = ['clave_espec', 'valor_espec']

class ProductoListaSerializer(serializers.ModelSerializer):
    categoria = serializers.StringRelatedField()
    marca = serializers.CharField(source='articulo.marca', read_only=True, default=None)
    precio_desde = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    disponible = serializers.BooleanField(read_only=True)
    imagen_principal = serializers.SerializerMethodField()
    suscripcion = SuscripcionSerializer(read_only=True, allow_null=True)
    especificaciones = EspecificacionProductoSerializer(many=True, read_only=True)

    class Meta:
        model = Producto
        fields = [
            'id', 'nombre', 'descripcion', 'categoria', 'tipo_producto',
            'marca', 'precio_desde', 'disponible', 'imagen_principal',
            'suscripcion', 'especificaciones', 'es_destacado'
        ]

    def get_imagen_principal(self, obj):
        articulo = getattr(obj, 'articulo', None)
        if articulo is None:
            return None
        for imagen in articulo.imagenes.all():
            if imagen.imagen_principal:
                return imagen.url_imagen
        return None

class ProductoDetalleSerializer(ProductoListaSerializer):
    articulo = ArticulosSerializer(read_only=True, allow_null=True)
    variantes = VarianteSerializer(many=True, read_only=True)

    class Meta(ProductoListaSerializer.Meta):
        fields = ProductoListaSerializer.Meta.fields + ['fecha_publicacion', 'articulo', 'variantes']

class ReseniaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resenia
        fields = ['id', 'producto', 'cliente', 'calificacion', 'titulo', 'comentario', 'fecha_resenia', 'compra_verificada']
        read_only_fields = ['id', 'cliente', 'fecha_resenia', 'compra_verificada']

    def validate(self, attrs):
        request = self.context.get('request')
        if request and request.user:
            producto = attrs.get('producto')
            if Resenia.objects.filter(cliente=request.user, producto=producto).exists():
                raise serializers.ValidationError({'producto': 'Ya has calificado este servicio anteriormente.'})
        return attrs