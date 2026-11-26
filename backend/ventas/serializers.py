from rest_framework import serializers

from catalogo.models import Variante

from .models import Carrito, CarritoDetalle


class CarritoDetalleSerializer(serializers.ModelSerializer):
    producto = serializers.CharField(source='variante.producto.nombre', read_only=True)
    tipo_producto = serializers.CharField(source='variante.producto.tipo_producto', read_only=True)
    sku = serializers.CharField(source='variante.sku', read_only=True)
    precio_unitario = serializers.DecimalField(
        source='variante.precio', max_digits=12, decimal_places=2, read_only=True
    )
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = CarritoDetalle
        fields = [
            'id', 'variante', 'producto', 'tipo_producto', 'sku',
            'precio_unitario', 'cantidad', 'subtotal',
        ]


class CarritoSerializer(serializers.ModelSerializer):
    detalles = CarritoDetalleSerializer(many=True, read_only=True)
    cantidad_articulos = serializers.SerializerMethodField()
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Carrito
        fields = ['id', 'detalles', 'cantidad_articulos', 'subtotal', 'fecha_actualizacion']

    def get_cantidad_articulos(self, obj):
        return sum(detalle.cantidad for detalle in obj.detalles.all())


class AgregarAlCarritoSerializer(serializers.Serializer):
    variante = serializers.PrimaryKeyRelatedField(
        queryset=Variante.objects.select_related('producto')
    )
    cantidad = serializers.IntegerField(min_value=1, default=1)


class CambiarCantidadSerializer(serializers.Serializer):
    cantidad = serializers.IntegerField(min_value=1)