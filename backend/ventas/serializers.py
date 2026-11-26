from rest_framework import serializers

from catalogo.models import Variante
from ubicaciones.models import Direccion
from .models import Carrito, CarritoDetalle, DetallePedido, Pedido


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


class DetallePedidoSerializer(serializers.ModelSerializer):
    producto = serializers.CharField(source='variante.producto.nombre', read_only=True)
    sku = serializers.CharField(source='variante.sku', read_only=True)

    class Meta:
        model = DetallePedido
        fields = [
            'id', 'variante', 'producto', 'sku', 'tipo_producto',
            'cantidad', 'precio_unitario', 'subtotal_linea',
        ]


class PedidoSerializer(serializers.ModelSerializer):
    detalles = DetallePedidoSerializer(many=True, read_only=True)
    estado_texto = serializers.CharField(source='get_estado_pedido_display', read_only=True)
    direccion_texto = serializers.StringRelatedField(source='direccion', read_only=True)
    cupon = serializers.SlugRelatedField(slug_field='codigo', read_only=True)
    puede_cancelar = serializers.SerializerMethodField()

    class Meta:
        model = Pedido
        fields = [
            'id', 'fecha_pedido', 'estado_pedido', 'estado_texto',
            'direccion', 'direccion_texto', 'cupon',
            'subtotal', 'total_descuento', 'costo_envio', 'total_impuestos', 'total_final',
            'puede_cancelar', 'detalles',
        ]

    def get_puede_cancelar(self, obj):
        return obj.estado_pedido == Pedido.Estado.PENDIENTE


class ConfirmarPedidoSerializer(serializers.Serializer):
    direccion = serializers.PrimaryKeyRelatedField(
        queryset=Direccion.objects.none(), required=False, allow_null=True, default=None
    )
    cupon = serializers.CharField(required=False, allow_blank=True, default='')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Solo se pueden elegir direcciones del usuario que hace el pedido
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            self.fields['direccion'].queryset = Direccion.objects.filter(usuario=request.user)