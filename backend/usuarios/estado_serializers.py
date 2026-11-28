from rest_framework import serializers

from .models import Usuario


class EstadoUsuarioSerializer(serializers.Serializer):

    estado_cuenta = serializers.ChoiceField(
        choices=Usuario._meta.get_field(
            "estado_cuenta"
        ).choices
    )

    motivo = serializers.CharField(
        min_length=5,
        max_length=500,
        trim_whitespace=True
    )
