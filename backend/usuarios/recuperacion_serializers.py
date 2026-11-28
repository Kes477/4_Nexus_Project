from rest_framework import serializers

from .activacion_serializers import (
    ActivacionCuentaSerializer
)


class SolicitarRecuperacionSerializer(serializers.Serializer):

    email = serializers.EmailField(
        max_length=255
    )


class RestablecerPasswordSerializer(
    ActivacionCuentaSerializer
):

    pass
