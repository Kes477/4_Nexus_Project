import unicodedata

from django.contrib.auth.models import Group
from rest_framework import serializers


def normalizar_nombre(nombre):

    nombre = unicodedata.normalize("NFKD", nombre)

    nombre = "".join(
        caracter
        for caracter in nombre
        if not unicodedata.combining(caracter)
    )

    return " ".join(nombre.split()).casefold()


class RolEdicionSerializer(serializers.ModelSerializer):

    nombre = serializers.CharField(
        source="name",
        min_length=3,
        max_length=50,
        trim_whitespace=True
    )

    class Meta:

        model = Group

        fields = (
            "id",
            "nombre",
        )

        read_only_fields = ("id",)

    def validate_nombre(self, value):

        value = " ".join(value.split())

        nombre_normalizado = normalizar_nombre(value)

        roles = Group.objects.all()

        if self.instance is not None:
            roles = roles.exclude(pk=self.instance.pk)

        for nombre in roles.values_list("name", flat=True):

            if normalizar_nombre(nombre) == nombre_normalizado:

                raise serializers.ValidationError(
                    "Ya existe un rol con ese nombre."
                )

        return value
