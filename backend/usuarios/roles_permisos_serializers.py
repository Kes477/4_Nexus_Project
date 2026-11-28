from rest_framework import serializers


class ConfiguracionPermisosRolSerializer(serializers.Serializer):

    permisos = serializers.ListField(

        child=serializers.IntegerField(
            min_value=1
        ),

        allow_empty=True,

        max_length=500
    )

    def validate_permisos(self, value):

        if len(value) != len(set(value)):

            raise serializers.ValidationError(
                "No se permiten permisos duplicados."
            )

        return value
