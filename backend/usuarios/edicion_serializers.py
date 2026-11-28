from django.db import transaction
from rest_framework import serializers

from .models import Usuario, PerfilEmpleado


class PerfilEmpleadoEdicionSerializer(serializers.ModelSerializer):

    codigo_empleado = serializers.CharField(max_length=20)

    class Meta:
        model = PerfilEmpleado

        fields = (
            "codigo_empleado",
            "cargo",
            "fecha_ingreso",
        )


class EdicionUsuarioSerializer(serializers.ModelSerializer):

    perfil_empleado = PerfilEmpleadoEdicionSerializer(
        required=False
    )

    class Meta:
        model = Usuario

        fields = (
            "first_name",
            "last_name",
            "telefono",
            "fecha_nacimiento",
            "perfil_empleado",
        )

    def validate_perfil_empleado(self, datos):

        perfil = getattr(
            self.instance,
            "perfil_empleado",
            None
        )

        if perfil is None:
            raise serializers.ValidationError(
                "El usuario no tiene perfil de empleado."
            )

        codigo = datos.get("codigo_empleado")

        if codigo and PerfilEmpleado.objects.filter(
            codigo_empleado=codigo
        ).exclude(pk=perfil.pk).exists():

            raise serializers.ValidationError(
                "El codigo de empleado ya existe."
            )

        return datos

    @transaction.atomic
    def update(self, instance, validated_data):

        datos_empleado = validated_data.pop(
            "perfil_empleado",
            None
        )

        for campo, valor in validated_data.items():
            setattr(instance, campo, valor)

        instance.save()

        if datos_empleado is not None:

            perfil = instance.perfil_empleado

            for campo, valor in datos_empleado.items():
                setattr(perfil, campo, valor)

            perfil.save()

        return instance
