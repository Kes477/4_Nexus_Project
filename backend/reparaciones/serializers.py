
from rest_framework import serializers
from .models import EquipoCliente, OrdenServicio


class EquipoClienteSerializer(serializers.ModelSerializer):

    class Meta:
        model = EquipoCliente

        fields = [
            'id',
            'cliente',
            'articulo',
            'marca',
            'modelo',
            'numero_serie',
            'fecha_registro'
        ]

        read_only_fields = [
            'id',
            'cliente',
            'fecha_registro'
        ]

    def validate_numero_serie(self, value):
        if value is None:
            return None

        value = value.strip()

        if not value:
            return None

        return value

class OrdenServicioSerializer(serializers.ModelSerializer):

    class Meta:
        model = OrdenServicio

        fields = [
            'id',
            'equipo',
            'tecnico',
            'descripcion_problema',
            'estado',
            'fecha_recepcion',
            'fecha_cierre',
            'observaciones'
        ]

        read_only_fields = [
            'id',
            'tecnico',
            'estado',
            'fecha_recepcion',
            'fecha_cierre'
        ]

class AsignarTecnicoSerializer(serializers.Serializer):

    tecnico = serializers.PrimaryKeyRelatedField(
        queryset=OrdenServicio._meta.get_field(
            'tecnico'
        ).remote_field.model.objects.all()
    )

class CambiarEstadoSerializer(serializers.Serializer):

    estado = serializers.ChoiceField(
        choices=OrdenServicio.Estado.choices
    )
