from django.db import transaction
from rest_framework import serializers

from .models import Usuario, PerfilEmpleado

class RegistroEmpleadoSerializer(serializers.ModelSerializer):

    codigo_empleado = serializers.CharField(max_length=20)
    cargo = serializers.CharField(max_length=100)
    fecha_ingreso = serializers.DateField()

    class Meta:
        model = Usuario

        fields = (
            "id",
            "email",
            "no_identificacion",
            "first_name",
            "last_name",
            "telefono",
            "fecha_nacimiento",
            "codigo_empleado",
            "cargo",
            "fecha_ingreso",
        )

        read_only_fields = ("id",)

    def validate_codigo_empleado(self, value):

        if PerfilEmpleado.objects.filter(
            codigo_empleado=value
        ).exists():

            raise serializers.ValidationError(
                "El codigo de empleado ya existe."
            )

        return value

    @transaction.atomic
    def create(self, validated_data):

        datos_empleado = {
            "codigo_empleado": validated_data.pop(
                "codigo_empleado"
            ),
            "cargo": validated_data.pop("cargo"),
            "fecha_ingreso": validated_data.pop(
                "fecha_ingreso"
            ),
        }

        usuario = Usuario.objects.create_user(
            password=None,
            estado_cuenta=Usuario.EstadoCuenta.INACTIVA,
            **validated_data
        )

        PerfilEmpleado.objects.create(
            usuario=usuario,
            **datos_empleado
        )

        return usuario
