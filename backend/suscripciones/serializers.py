from rest_framework import serializers

from catalogo.models import Articulo

from .models import SuscripcionActiva
from .servicios import VIGENTES, articulos_comprados


class SuscripcionActivaSerializer(serializers.ModelSerializer):
    plan_nombre = serializers.CharField(source='plan.producto.nombre', read_only=True)
    periodo_dias = serializers.IntegerField(source='plan.periodo_facturacion_dias', read_only=True)
    mantenimientos_incluidos = serializers.IntegerField(
        source='plan.cantidad_mantenimientos_incluidos', read_only=True
    )
    nivel_cobertura = serializers.CharField(source='plan.nivel_cobertura', read_only=True)
    precio = serializers.DecimalField(
        source='detalle.precio_unitario', max_digits=12, decimal_places=2, read_only=True
    )
    pedido = serializers.IntegerField(source='detalle.pedido_id', read_only=True)
    estado_texto = serializers.CharField(source='get_estado_display', read_only=True)
    dias_restantes = serializers.IntegerField(read_only=True)
    articulo_texto = serializers.StringRelatedField(source='articulo_cubierto', read_only=True)
    puede_cancelar = serializers.SerializerMethodField()

    # El queryset real se pone en __init__: solo los drones que ESTE usuario compró
    articulo_cubierto = serializers.PrimaryKeyRelatedField(
        queryset=Articulo.objects.none(), allow_null=True, required=False
    )

    class Meta:
        model = SuscripcionActiva
        fields = [
            'id', 'plan_nombre', 'periodo_dias', 'mantenimientos_incluidos', 'nivel_cobertura',
            'precio', 'pedido', 'fecha_inicio', 'fecha_vencimiento', 'dias_restantes',
            'estado', 'estado_texto', 'articulo_cubierto', 'articulo_texto', 'puede_cancelar',
        ]
        read_only_fields = ['fecha_inicio', 'fecha_vencimiento', 'estado']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request is not None:
            self.fields['articulo_cubierto'].queryset = articulos_comprados(request.user)

    def get_puede_cancelar(self, obj):
        return obj.estado in VIGENTES

    def validate(self, attrs):
        if self.instance is not None and self.instance.estado not in VIGENTES:
            raise serializers.ValidationError('Solo se puede cambiar el dron de una suscripción vigente.')
        return attrs