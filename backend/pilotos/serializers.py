from rest_framework import serializers
from .models import Mision


class MisionSerializer(serializers.ModelSerializer):
    piloto_nombre = serializers.SerializerMethodField()
    esta_calificada = serializers.SerializerMethodField()

    class Meta:
        model = Mision
        fields = '__all__'
        read_only_fields = ['id', 'piloto', 'estado', 'fecha_creacion', 'fecha_cierre']

    def get_piloto_nombre(self, obj):
        if obj.piloto and obj.piloto.usuario:
            nombre = f"{obj.piloto.usuario.first_name} {obj.piloto.usuario.last_name}".strip()
            return nombre if nombre else obj.piloto.usuario.email
        return None

    def get_esta_calificada(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.resenias.filter(cliente=request.user).exists()
        return False


class CambiarEstadoSerializer(serializers.Serializer):
    estado = serializers.ChoiceField(choices=Mision.Estado.choices)


class HistorialMisionSerializer(serializers.ModelSerializer):
    calificacion = serializers.SerializerMethodField()
    comentario = serializers.SerializerMethodField()
    cliente = serializers.CharField(source='cliente_nombre', read_only=True)
    tipo_servicio = serializers.CharField(source='categoria', read_only=True)
    duracion = serializers.SerializerMethodField()

    class Meta:
        model = Mision
        fields = [
            'id',
            'fecha_programada',
            'cliente',
            'tipo_servicio',
            'duracion',
            'calificacion',
            'comentario'
        ]

    def _get_resenia_correspondiente(self, obj):
        if hasattr(obj, '_resenia_cache'):
            return obj._resenia_cache
        resenias = list(obj.resenias.all())
        resultado = max(resenias, key=lambda r: r.fecha_resenia) if resenias else None
        obj._resenia_cache = resultado
        return resultado

    def get_calificacion(self, obj):
        resenia = self._get_resenia_correspondiente(obj)
        if resenia is None:
            return None
        try:
            valor = float(resenia.calificacion)
        except (TypeError, ValueError):
            return None
        return valor if valor > 0 else None

    def get_comentario(self, obj):
        resenia = self._get_resenia_correspondiente(obj)
        return resenia.comentario if resenia else None

    def get_duracion(self, obj):
        if obj.fecha_cierre and obj.fecha_creacion:
            diferencia = obj.fecha_cierre - obj.fecha_creacion
            return round(diferencia.total_seconds() / 3600, 1)
        return None