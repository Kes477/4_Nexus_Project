from django.contrib.auth.models import Group, Permission
from rest_framework import serializers


ROLES_PROTEGIDOS = frozenset({
    "Administrador",
    "Cliente",
    "Vendedor",
    "Tecnico",
    "Piloto",
})


class PermisoSerializer(serializers.ModelSerializer):

    modulo = serializers.CharField(
        source="content_type.app_label",
        read_only=True
    )

    modelo = serializers.CharField(
        source="content_type.model",
        read_only=True
    )

    codigo_completo = serializers.SerializerMethodField()

    class Meta:
        model = Permission

        fields = (
            "id",
            "name",
            "codename",
            "modulo",
            "modelo",
            "codigo_completo",
        )

        read_only_fields = fields

    def get_codigo_completo(self, obj):

        return (
            f"{obj.content_type.app_label}.{obj.codename}"
        )


class RolSerializer(serializers.ModelSerializer):

    nombre = serializers.CharField(
        source="name",
        read_only=True
    )

    cantidad_usuarios = serializers.IntegerField(
        read_only=True
    )

    cantidad_permisos = serializers.IntegerField(
        read_only=True
    )

    protegido = serializers.SerializerMethodField()

    permisos = PermisoSerializer(
        source="permissions",
        many=True,
        read_only=True
    )

    class Meta:
        model = Group

        fields = (
            "id",
            "nombre",
            "cantidad_usuarios",
            "cantidad_permisos",
            "protegido",
            "permisos",
        )

        read_only_fields = fields

    def get_protegido(self, obj):

        return obj.name in ROLES_PROTEGIDOS
