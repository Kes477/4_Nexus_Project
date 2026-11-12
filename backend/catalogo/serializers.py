from rest_framework import serializers
from .models import (Articulo, AtributoVariante,Categoria, ImagenArticulo, Producto, Variante,)


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'descripcion', 'categoria_padre']


class ImagenArticuloSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImagenArticulo
        fields = ['id','url_imagen','imagen_principal', 'orden']

class AtributoVarianteSerializer(serializers.ModelSerializer):
    class Meta:
        model = AtributoVariante
        fields = ['nombre_atributo','valor_atributo']

class VarianteSerializer(serializers.ModelSerializer):
    atributos = AtributoVarianteSerializer(many=True, read_only=True)
    
    class Meta:
        model = Variante
        fields = ['id', 'sku', 'precio', 'atributos']

class ArticulosSerializer(serializers.ModelSerializer):
    imagenes = ImagenArticuloSerializer(many=True, read_only=True)
    class Meta:
        model = Articulo
        fields = ['marca','modelo','peso_kg','dimensiones','tiempo_vuelo_max_min','alcance_max_km','imagenes']

class ProductoListaSerializer(serializers.ModelSerializer):
    categoria = serializers.StringRelatedField()
    marca = serializers.CharField(source='articulo.marca', read_only=True, default=None)
    precio_desde = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    imagen_principal = serializers.SerializerMethodField() 


    class Meta:
        model = Producto
        fields = ['id', 'nombre', 'descripcion','categoria', 'tipo_producto','marca', 'precio_desde', 'imagen_principal']
    
    def get_imagen_principal(self, obj):
        articulo = getattr(obj,'articulo', None)
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

    


