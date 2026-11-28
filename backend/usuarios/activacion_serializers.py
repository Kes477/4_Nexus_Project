from django.contrib.auth.password_validation import (
    validate_password
)

from django.core.exceptions import (
    ValidationError as DjangoValidationError
)

from rest_framework import serializers

class ActivacionCuentaSerializer(serializers.Serializer):

    uid = serializers.CharField(
        max_length=100
    )

    token = serializers.CharField(
        max_length=200,
        write_only=True
    )

    password = serializers.CharField(
        min_length=8,
        max_length=128,
        write_only=True,
        trim_whitespace=False
    )

    confirmar_password = serializers.CharField(
        max_length=128,
        write_only=True,
        trim_whitespace=False
    )

    def validate(self, attrs):

        if attrs["password"] != attrs["confirmar_password"]:

            raise serializers.ValidationError({
                "confirmar_password": (
                    "Las contrasenas no coinciden."
                )
            })

        return attrs

    def validar_password_usuario(self, usuario):

        password = self.validated_data["password"]

        try:

            validate_password(
                password,
                user=usuario
            )

        except DjangoValidationError as error:

            raise serializers.ValidationError({
                "password": list(error.messages)
            })
