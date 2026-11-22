from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Usuario


class UsuarioSerializer(serializers.ModelSerializer):
    rol = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'no_identificacion',
            'telefono',
            'is_staff',
            'rol'
        ]
        read_only_fields = ['is_staff', 'rol']

    def get_rol(self, obj):
        if obj.is_superuser or obj.is_staff:
            return 'admin'

        if hasattr(obj, 'perfil_tecnico'):
            return 'tecnico'

        if hasattr(obj, 'perfil_piloto'):
            return 'piloto'

        if hasattr(obj, 'perfil_vendedor'):
            return 'vendedor'

        if hasattr(obj, 'perfil_cliente'):
            return 'cliente'

        return None


class LoginSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['usuario'] = UsuarioSerializer(self.user).data
        return data
    
from .models import Usuario, PerfilCliente, Piloto, Tecnico

class RegistroSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    role = serializers.CharField(write_only=True, required=False, default='cliente')

    class Meta:
        model = Usuario
        fields = ['email', 'password', 'first_name', 'last_name', 'no_identificacion', 'telefono', 'role']

    def create(self, validated_data):
        role = validated_data.pop('role', 'cliente')
        password = validated_data.pop('password')
        
        # Crear el usuario
        user = Usuario(**validated_data)
        user.set_password(password)
        user.save()

        # Crear perfil según el rol seleccionado
        if role == 'cliente':
            PerfilCliente.objects.create(usuario=user)
        elif role == 'piloto':
            # Usamos la identificación como número de licencia
            Piloto.objects.create(usuario=user, numero_licencia_aeronautica=user.no_identificacion, horas_vuelo_acumuladas=0)
        elif role == 'tecnico':
            Tecnico.objects.create(usuario=user, especialidad_tecnica='General')
        elif role == 'admin':
            user.is_staff = True
            user.is_superuser = True
            user.save()

        return user