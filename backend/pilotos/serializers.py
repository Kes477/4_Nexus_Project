from rest_framework import serializers
from .models import Mision

class MisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mision
        fields = '__all__'
        read_only_fields = ['id', 'piloto', 'estado', 'fecha_creacion', 'fecha_cierre']
        
class CambiarEstadoSerializer(serializers.Serializer):
    estado = serializers.ChoiceField(choices=Mision.Estado.choices)