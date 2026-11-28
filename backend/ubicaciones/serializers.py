from rest_framework import serializers

from .models import Direccion, Ubicacion
from .servicios import guardar_direccion


class UbicacionSerializer(serializers.ModelSerializer):
    tipo = serializers.CharField(source='tipo.nombre', read_only=True)
    tiene_hijos = serializers.SerializerMethodField()

    class Meta:
        model = Ubicacion
        fields = ['id', 'nombre', 'tipo', 'padre', 'tiene_hijos']

    def get_tiene_hijos(self, obj):
        return bool(obj.hijos.all())


class DireccionSerializer(serializers.ModelSerializer):
    ubicacion_texto = serializers.SerializerMethodField()

    class Meta:
        model = Direccion
        fields = [
            'id', 'ubicacion', 'ubicacion_texto',
            'linea_direccion1', 'linea_direccion2', 'codigo_postal',
            'tipo_direccion', 'es_principal',
        ]
        extra_kwargs = {
            'ubicacion': {'required': False, 'allow_null': True},
        }

    def get_ubicacion_texto(self, obj):
        return str(obj.ubicacion) if obj.ubicacion_id else None

    def validate_ubicacion(self, ubicacion):
        if ubicacion is not None and ubicacion.hijos.exists():
            raise serializers.ValidationError(
                'Elige un municipio, no un país o departamento.'
            )
        return ubicacion

    def validate_es_principal(self, value):
        if self.instance and self.instance.es_principal and not value:
            otras = self.instance.usuario.direcciones.exclude(pk=self.instance.pk).count()
            if otras == 0:
                raise serializers.ValidationError(
                    'Debe existir al menos una dirección principal.'
                )
        return value

    def create(self, validated_data):
        return guardar_direccion(self.context['request'].user, validated_data)

    def update(self, instance, validated_data):
        return guardar_direccion(
            self.context['request'].user, validated_data, direccion=instance
        )