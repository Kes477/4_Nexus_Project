from rest_framework import serializers

from .models import EquipoCliente, OrdenServicio


# ======================================================
# SERIALIZER DE EQUIPOS
# ======================================================

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


# ======================================================
# SERIALIZER DE ORDENES DE SERVICIO
# HU-012 Y HU-013
# ======================================================

class OrdenServicioSerializer(serializers.ModelSerializer):

    equipo_detalle = EquipoClienteSerializer(
        source='equipo',
        read_only=True
    )

    cliente_nombre = serializers.CharField(
        source='equipo.cliente.usuario.get_full_name',
        read_only=True
    )

    tecnico_nombre = serializers.CharField(
        source='tecnico.usuario.get_full_name',
        read_only=True,
        allow_null=True
    )

    estado_nombre = serializers.CharField(
        source='get_estado_display',
        read_only=True
    )

    class Meta:
        model = OrdenServicio

        fields = [
            'id',
            'equipo',
            'equipo_detalle',
            'cliente_nombre',
            'tecnico',
            'tecnico_nombre',
            'descripcion_problema',
            'estado',
            'estado_nombre',
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

    def validate_equipo(self, equipo):

        request = self.context.get('request')

        if request is None:
            return equipo

        usuario = request.user

        # Mantener los permisos administrativos.

        if usuario.has_perm(
            'reparaciones.add_ordenservicio'
        ):
            return equipo

        # El cliente solamente puede seleccionar
        # equipos asociados a su perfil.

        if hasattr(usuario, 'perfil_cliente'):

            if equipo.cliente_id == usuario.perfil_cliente.pk:
                return equipo

        raise serializers.ValidationError(
            'No tiene permiso para solicitar una reparación '
            'sobre este equipo.'
        )


# ======================================================
# HU-012: SOLICITUD DE REPARACION
# ======================================================

class SolicitudReparacionSerializer(OrdenServicioSerializer):

    class Meta(OrdenServicioSerializer.Meta):

        read_only_fields = [
            'id',
            'tecnico',
            'estado',
            'fecha_recepcion',
            'fecha_cierre',
            'observaciones'
        ]


# ======================================================
# ASIGNACION DE TECNICOS
# ======================================================

class AsignarTecnicoSerializer(serializers.Serializer):

    tecnico = serializers.PrimaryKeyRelatedField(
        queryset=OrdenServicio._meta.get_field(
            'tecnico'
        ).remote_field.model.objects.all()
    )


# ======================================================
# CAMBIO DE ESTADO
# ======================================================

class CambiarEstadoSerializer(serializers.Serializer):

    estado = serializers.ChoiceField(
        choices=OrdenServicio.Estado.choices
    )