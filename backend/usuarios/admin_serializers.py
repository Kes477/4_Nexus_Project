from rest_framework import serializers
from .models import Usuario
from .edicion_serializers import PerfilEmpleadoEdicionSerializer


class UsuarioAdminSerializer(serializers.ModelSerializer):

    foto_perfil_url = serializers.ImageField(
        source='foto_perfil',
        read_only=True,
        use_url=True
    )

    nombre_completo = serializers.CharField(
        source="get_full_name",
        read_only=True
    )

    roles = serializers.SlugRelatedField(
        source="groups",
        slug_field="name",
        many=True,
        read_only=True
    )

    estado_nombre = serializers.CharField(
        source="get_estado_cuenta_display",
        read_only=True
    )

    perfiles = serializers.SerializerMethodField()

    perfil_empleado = PerfilEmpleadoEdicionSerializer(
        read_only=True,
        allow_null=True
    )

    class Meta:

        model = Usuario

        fields = (
            "id",
            "email",
            "no_identificacion",
            "first_name",
            "last_name",
            "nombre_completo",
            "telefono",
            "fecha_nacimiento",
            "estado_cuenta",
            "estado_nombre",
            "foto_perfil_url",
            "date_joined",
            "last_login",
            "roles",
            "perfiles",
            "perfil_empleado",
        )

        read_only_fields = fields

    def get_perfiles(self, obj):

        relaciones = {
            "empleado": "perfil_empleado",
            "cliente": "perfil_cliente",
            "tecnico": "perfil_tecnico",
            "piloto": "perfil_piloto",
            "vendedor": "perfil_vendedor",
        }

        return [
            nombre
            for nombre, relacion in relaciones.items()
            if hasattr(obj, relacion)
        ]
