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
        fields = ['id','email', 'first_name', 'last_name','no_identificacion', 'telefono', 'is_staff', 'rol']
        read_only_fields = ['is_staff']


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