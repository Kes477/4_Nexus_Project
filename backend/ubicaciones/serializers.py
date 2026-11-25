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
        return obj.hijos.exists()


class DireccionSerializer(serializers.ModelSerializer):
    ubicacion_texto = serializers.StringRelatedField(source='ubicacion', read_only=True)

    class Meta:
        model = Direccion
        fields = [
            'id', 'ubicacion', 'ubicacion_texto',
            'linea_direccion1', 'linea_direccion2', 'codigo_postal',
            'tipo_direccion', 'es_principal',
        ]

    def validate_ubicacion(self, ubicacion):
        if ubicacion.hijos.exists():
            raise serializers.ValidationError(
                'Elige un municipio, no un país o departamento.'
            )
        return ubicacion

    def create(self, validated_data):
        return guardar_direccion(self.context['request'].user, validated_data)

    def update(self, instance, validated_data):
        return guardar_direccion(instance.usuario, validated_data, direccion=instance)