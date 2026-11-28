from rest_framework import serializers

from .models import Tecnico, Piloto


class PerfilTecnicoSerializer(serializers.ModelSerializer):

    class Meta:

        model = Tecnico

        fields = (
            "especialidad_tecnica",
            "certificacion_fabricante",
            "disponible",
        )

    def validate_especialidad_tecnica(self, value):

        value = value.strip()

        if not value:

            raise serializers.ValidationError(
                "La especialidad tecnica es obligatoria."
            )

        return value


class PerfilPilotoSerializer(serializers.ModelSerializer):

    class Meta:

        model = Piloto

        fields = (
            "numero_licencia_aeronautica",
            "horas_vuelo_acumuladas",
            "tipo_certificacion",
            "disponible",
        )

    def validate_horas_vuelo_acumuladas(self, value):

        if value < 0:

            raise serializers.ValidationError(
                "Las horas de vuelo no pueden ser negativas."
            )

        return value
