from rest_framework import serializers


class AsignacionRolesSerializer(serializers.Serializer):

    roles = serializers.ListField(
        child=serializers.IntegerField(
            min_value=1
        ),
        allow_empty=True,
        max_length=100
    )

    def validate_roles(self, value):

        if len(value) != len(set(value)):

            raise serializers.ValidationError(
                "No se permiten roles duplicados."
            )

        return value
