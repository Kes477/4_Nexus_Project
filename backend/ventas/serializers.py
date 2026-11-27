from rest_framework import serializers

from catalogo.models import Variante
from ubicaciones.models import Direccion
from .models import Carrito, CarritoDetalle, DetallePedido, Pedido, MetodoPago, TransaccionPago


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

class TransaccionPagoSerializer(serializers.ModelSerializer):
    forma_texto = serializers.CharField(source='get_forma_pago_display', read_only=True)
    estado_texto = serializers.CharField(source='get_estado_pago_display', read_only=True)
    tarjeta = serializers.StringRelatedField(source='metodo_pago', read_only=True)

    class Meta:
        model = TransaccionPago
        fields = [
            'id', 'forma_pago', 'forma_texto', 'estado_pago', 'estado_texto',
            'monto', 'fecha_pago', 'id_transaccion_externa', 'tarjeta',
        ]


class MetodoPagoSerializer(serializers.ModelSerializer):
    vencida = serializers.SerializerMethodField()

    class Meta:
        model = MetodoPago
        fields = ['id', 'tipo_tarjeta', 'ultimos_cuatro', 'fecha_expiracion', 'token_pasarela', 'vencida']
        extra_kwargs = {'token_pasarela': {'write_only': True}}

    def get_vencida(self, obj):
        return obj.esta_vencida()

    def validate_ultimos_cuatro(self, valor):
        if not (len(valor) == 4 and valor.isdigit()):
            raise serializers.ValidationError('Deben ser 4 dígitos.')
        return valor

    def validate_fecha_expiracion(self, valor):
        if not MetodoPago.FORMATO_EXPIRACION.match(valor):
            raise serializers.ValidationError('Usa el formato MM/AAAA.')
        if MetodoPago(fecha_expiracion=valor).esta_vencida():
            raise serializers.ValidationError('La tarjeta está vencida.')
        return valor

    def create(self, validated_data):
        return MetodoPago.objects.create(usuario=self.context['request'].user, **validated_data)


class PagarPedidoSerializer(serializers.Serializer):
    forma_pago = serializers.ChoiceField(choices=TransaccionPago.Forma.choices)
    metodo_pago = serializers.PrimaryKeyRelatedField(
        queryset=MetodoPago.objects.none(), required=False, allow_null=True, default=None
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            self.fields['metodo_pago'].queryset = MetodoPago.objects.filter(usuario=request.user)

class PedidoSerializer(serializers.ModelSerializer):
    detalles = DetallePedidoSerializer(many=True, read_only=True)
    estado_texto = serializers.CharField(source='get_estado_pedido_display', read_only=True)
    direccion_texto = serializers.StringRelatedField(source='direccion', read_only=True)
    cupon = serializers.SlugRelatedField(slug_field='codigo', read_only=True)
    transacciones = TransaccionPagoSerializer(many=True, read_only=True)
    puede_cancelar = serializers.SerializerMethodField()
    puede_pagar = serializers.SerializerMethodField()

    class Meta:
        model = Pedido
        fields = [
            'id', 'fecha_pedido', 'estado_pedido', 'estado_texto',
            'direccion', 'direccion_texto', 'cupon',
            'subtotal', 'total_descuento', 'costo_envio', 'total_impuestos', 'total_final',
            'puede_cancelar', 'puede_pagar', 'detalles', 'transacciones',
        ]

    def get_puede_cancelar(self, obj):
        return obj.estado_pedido == Pedido.Estado.PENDIENTE

    def get_puede_pagar(self, obj):
        if obj.estado_pedido != Pedido.Estado.PENDIENTE:
            return False
        return not any(t.estado_pago in ('APROBADO', 'PENDIENTE') for t in obj.transacciones.all())
    


class ConfirmarPedidoSerializer(serializers.Serializer):
    direccion = serializers.PrimaryKeyRelatedField(
        queryset=Direccion.objects.none(), required=False, allow_null=True, default=None
    )
    cupon = serializers.CharField(required=False, allow_blank=True, default='')
    variante = serializers.PrimaryKeyRelatedField(
        queryset=Variante.objects.select_related('producto'),
        required=False, allow_null=True, default=None,
    )
    cantidad = serializers.IntegerField(min_value=1, default=1)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Solo se pueden elegir direcciones del usuario que hace el pedido
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            self.fields['direccion'].queryset = Direccion.objects.filter(usuario=request.user)