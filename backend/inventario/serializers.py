from rest_framework import serializers
from .models import Almacen, Inventario, MovimientoInventario
from .models import EstadoDron

class AlmacenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Almacen
        fields = ['id', 'nombre','direccion','activo']

class InventarioSerializer(serializers.ModelSerializer):
    almacen_nombre = serializers.CharField(source='almacen.nombre', read_only =True)
    sku = serializers.CharField(source='variante.sku', read_only = True)
    producto = serializers.CharField(source = 'variante.producto.nombre', read_only = True)
    cantidad_total = serializers.IntegerField(read_only = True)

    class Meta:
        model = Inventario
        fields = ['id', 'almacen', 'almacen_nombre', 'variante', 'sku', 'producto',
                  'cantidad_disponible', 'cantidad_reservada', 'cantidad_total',
                  'ubicacion_pasillo']
        read_only_fields = ['cantidad_disponible', 'cantidad_reservada']

class MovimientoInventarioSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source = 'get_tipo_display', read_only = True)
    usuario = serializers.StringRelatedField()

    class Meta:
        model = MovimientoInventario
        fields = ['id', 'inventario', 'tipo', 'tipo_display', 'cantidad',
                  'motivo', 'usuario', 'fecha']

class EntradaSerializer(serializers.Serializer):
    cantidad = serializers.IntegerField(min_value = 1)
    motivo = serializers.CharField(max_length = 255, required = False, allow_blank=True, default='')


class AjusteSerializer(serializers.Serializer):
    conteo_real = serializers.IntegerField(min_value =0)
    motivo = serializers.CharField(max_length= 255)

class EstadoDronSerializer(serializers.ModelSerializer):

    modelo = serializers.CharField(
        source='inventario.variante.producto.articulo.modelo',
        read_only=True
    )

    tipo_producto = serializers.CharField(
        source='inventario.variante.producto.get_tipo_producto_display',
        read_only=True
    )

    class Meta:
        model = EstadoDron
        fields = ['id', 'modelo', 'tipo_producto', 'estado']
        read_only_fields = ['id', 'modelo', 'tipo_producto']