from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction

from .models import Usuario, PerfilCliente, Piloto


class PilotoSerializer(serializers.ModelSerializer):

    class Meta:
        model = Piloto
        fields = [
            'numero_licencia_aeronautica',
            'tipo_certificacion',
            'horas_vuelo_acumuladas',
            'disponible',
        ]
        read_only_fields = [
            'numero_licencia_aeronautica',
            'tipo_certificacion',
            'horas_vuelo_acumuladas',
            'disponible',
        ]


class ActualizarPilotoSerializer(serializers.ModelSerializer):

    numero_licencia_aeronautica = serializers.CharField(
        required=False,
        allow_blank=False,
        max_length=50,
        error_messages={
            'blank': 'El número de licencia aeronáutica no puede estar vacío.',
            'required': 'El número de licencia aeronáutica es obligatorio.',
        },
    )

    tipo_certificacion = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=100,
    )

    disponible = serializers.BooleanField(required=False)

    class Meta:
        model = Piloto
        fields = [
            'numero_licencia_aeronautica',
            'tipo_certificacion',
            'disponible',
        ]

    def validate_numero_licencia_aeronautica(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError(
                'El número de licencia aeronáutica no puede estar vacío.'
            )

        qs = Piloto.objects.filter(numero_licencia_aeronautica=value)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                'Ya existe un piloto con este número de licencia.'
            )
        return value

    def validate_tipo_certificacion(self, value):
        return (value or '').strip()


class UsuarioSerializer(serializers.ModelSerializer):

    rol = serializers.CharField(read_only=True)
    perfil_piloto = serializers.SerializerMethodField()
    fecha_nacimiento = serializers.DateField(
        required=False,
        allow_null=True,
        input_formats=['%Y-%m-%d'],
    )

    class Meta:
        model = Usuario
        fields = [
            'id', 'email', 'first_name', 'last_name',
            'no_identificacion', 'telefono', 'fecha_nacimiento',
            'foto_perfil_url', 'estado_cuenta', 'is_active',
            'is_staff', 'date_joined', 'rol', 'perfil_piloto',
        ]
        read_only_fields = [
            'id', 'email', 'no_identificacion',
            'foto_perfil_url', 'estado_cuenta', 'is_active', 'is_staff',
            'date_joined', 'rol',
        ]

    def get_perfil_piloto(self, obj):
        try:
            perfil = obj.perfil_piloto
        except Piloto.DoesNotExist:
            return None
        return PilotoSerializer(perfil).data


class CambiarPasswordSerializer(serializers.Serializer):

    password_actual = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        error_messages={'required': 'Debes indicar tu contraseña actual.'},
    )
    password_nueva = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        error_messages={'required': 'Debes indicar la nueva contraseña.'},
    )

    def validate_password_actual(self, value):
        usuario = self.context['request'].user
        if not usuario.check_password(value):
            raise serializers.ValidationError('La contraseña actual es incorrecta.')
        return value

    def validate(self, attrs):
        nueva = attrs.get('password_nueva')
        actual = attrs.get('password_actual')

        if nueva == actual:
            raise serializers.ValidationError({
                'password_nueva': 'La nueva contraseña debe ser diferente a la actual.'
            })

        usuario = self.context['request'].user
        try:
            validate_password(nueva, user=usuario)
        except DjangoValidationError as error:
            raise serializers.ValidationError({'password_nueva': list(error.messages)})

        return attrs

    def save(self):
        usuario = self.context['request'].user
        usuario.set_password(self.validated_data['password_nueva'])
        usuario.save(update_fields=['password'])
        return usuario


class LoginSerializer(TokenObtainPairSerializer):

    def validate(self, attrs):

        data = super().validate(attrs)

        data['usuario'] = UsuarioSerializer(self.user).data

        return data


class RegistroSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = Usuario

        fields = [
            'email',
            'password',
            'first_name',
            'last_name',
            'no_identificacion',
            'telefono'
        ]

    def validate(self, attrs):

        usuario_temporal = Usuario(
            **{
                k: v
                for k, v in attrs.items()
                if k != 'password'
            }
        )

        try:

            validate_password(
                attrs['password'],
                usuario_temporal
            )

        except DjangoValidationError as error:

            raise serializers.ValidationError({
                'password': list(error.messages)
            })

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        usuario = Usuario.objects.create_user(
            **validated_data
        )

        PerfilCliente.objects.create(
            usuario=usuario
        )

        return usuario