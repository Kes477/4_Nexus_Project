from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction

from .models import Usuario, PerfilCliente

class UsuarioSerializer(serializers.ModelSerializer):
    rol = serializers.CharField(read_only = True)

    class Meta:
        model = Usuario
        fields = ['id','email', 'first_name', 'last_name','no_identificacion', 'telefono', 'fecha_nacimiento','date_joined','is_staff', 'rol']
        read_only_fields = ['email', 'no_identificacion', 'date_joined','is_staff']


class LoginSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['usuario'] = UsuarioSerializer(self.user).data
        return data
    
    
class RegistroSerializer(serializers.ModelSerializer):
    """Registro público: solo crea CLIENTES.
    Administradores, pilotos y técnicos los crea un administrador."""

    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    class Meta:
        model = Usuario
        fields = ['email', 'password', 'first_name', 'last_name',
                  'no_identificacion', 'telefono']

    def validate(self, attrs):
        usuario_temporal = Usuario(**{k: v for k, v in attrs.items() if k != 'password'})
        try:
            validate_password(attrs['password'], user=usuario_temporal)
        except DjangoValidationError as error:
            raise serializers.ValidationError({'password': list(error.messages)})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        usuario = Usuario.objects.create_user(**validated_data)
        PerfilCliente.objects.create(usuario=usuario)
        return usuario

class CambiarPasswordSerializer(serializers.Serializer):
    password_actual = serializers.CharField(write_only=True, style={'input_type':'password'})
    password_nueva = serializers.CharField(write_only=True, style={'input_type':'password'})

    def validate_password_actual(self, valor):
        usuario = self.context['request'].user
        if not usuario.check_password(valor):
            raise serializers.ValidationError('La contraseña actual no es correcta.')
        return valor

    def validate(self, attrs):
        usuario = self.context['request'].user
        try:
            validate_password(attrs['password_nueva'], user=usuario)
        except DjangoValidationError as error:
            raise serializers.ValidationError({'password_nueva': list(error.messages)})
        return attrs

    def save(self):
        usuario = self.context['request'].user
        usuario.set_password(self.validated_data['password_nueva'])
        usuario.save(update_fields=['password'])
        return usuario
        