from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.utils import timezone

from .models import Usuario, PerfilCliente, Piloto, Tecnico, PasswordResetCode


class PilotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Piloto
        fields = ['numero_licencia_aeronautica', 'tipo_certificacion', 'horas_vuelo_acumuladas', 'disponible']
        read_only_fields = ['numero_licencia_aeronautica', 'tipo_certificacion', 'horas_vuelo_acumuladas', 'disponible']


class ActualizarPilotoSerializer(serializers.ModelSerializer):
    numero_licencia_aeronautica = serializers.CharField(
        required=False, allow_blank=False, max_length=50,
        error_messages={'blank': 'El número de licencia aeronáutica no puede estar vacío.',
                        'required': 'El número de licencia aeronáutica es obligatorio.'},
    )
    tipo_certificacion = serializers.CharField(required=False, allow_blank=True, max_length=100)
    disponible = serializers.BooleanField(required=False)

    class Meta:
        model = Piloto
        fields = ['numero_licencia_aeronautica', 'tipo_certificacion', 'disponible']

    def validate_numero_licencia_aeronautica(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('El número de licencia aeronáutica no puede estar vacío.')
        qs = Piloto.objects.filter(numero_licencia_aeronautica=value)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('Ya existe un piloto con este número de licencia.')
        return value

    def validate_tipo_certificacion(self, value):
        return (value or '').strip()


class TecnicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tecnico
        fields = ['especialidad_tecnica', 'certificacion_fabricante', 'disponible']
        read_only_fields = ['especialidad_tecnica', 'certificacion_fabricante', 'disponible']


class ActualizarTecnicoSerializer(serializers.ModelSerializer):
    disponible = serializers.BooleanField(required=False)

    class Meta:
        model = Tecnico
        fields = ['disponible']


class UsuarioSerializer(serializers.ModelSerializer):
    rol = serializers.CharField(read_only=True)
    perfil_piloto = serializers.SerializerMethodField()
    perfil_tecnico = serializers.SerializerMethodField()
    fecha_nacimiento = serializers.DateField(
        required=False, allow_null=True, input_formats=['%d-%m-%Y', '%Y-%m-%d']
    )
    foto_perfil_url = serializers.SerializerMethodField() # <-- NUEVO CAMPO


    roles = serializers.SerializerMethodField()

    permisos_efectivos = serializers.SerializerMethodField()

    is_superuser = serializers.BooleanField(read_only=True)

    class Meta:
        model = Usuario
        fields = (
            'id', 'email', 'first_name', 'last_name',
            'no_identificacion', 'telefono',
            'fecha_nacimiento', 'foto_perfil',
            'foto_perfil_url', 'estado_cuenta',
            'is_active', 'is_staff', 'date_joined',
            'rol', 'perfil_piloto', 'perfil_tecnico',
            'roles', 'permisos_efectivos', 'is_superuser',
        )
        read_only_fields = (
            'id', 'email', 'no_identificacion',
            'foto_perfil_url', 'estado_cuenta',
            'is_active', 'is_staff', 'date_joined',
            'rol', 'roles', 'permisos_efectivos',
            'is_superuser',
        )

    def get_foto_perfil_url(self, obj):
        if obj.foto_perfil:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.foto_perfil.url)
            return obj.foto_perfil.url
        return None

    def get_perfil_piloto(self, obj):
        try:
            perfil = obj.perfil_piloto
        except Piloto.DoesNotExist:
            return None
        return PilotoSerializer(perfil).data

    def get_perfil_tecnico(self, obj):
        try:
            perfil = obj.perfil_tecnico
        except Tecnico.DoesNotExist:
            return None
        return TecnicoSerializer(perfil).data


    def get_roles(self, obj):

        return list(
            obj.groups.order_by("name")
            .values_list("name", flat=True)
        )

    def get_permisos_efectivos(self, obj):

        if not obj.is_active:
            return []

        return sorted(
            obj.get_all_permissions()
        )



class CambiarPasswordSerializer(serializers.Serializer):
    password_actual = serializers.CharField(
        write_only=True, style={'input_type': 'password'},
        error_messages={'required': 'Debes indicar tu contraseña actual.'},
    )
    password_nueva = serializers.CharField(
        write_only=True, style={'input_type': 'password'},
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
            raise serializers.ValidationError(
                {'password_nueva': 'La nueva contraseña debe ser diferente a la actual.'}
            )
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

        from rest_framework.exceptions import PermissionDenied

        identificador = attrs.get(self.username_field)
        password = attrs.get("password")

        try:
            usuario = Usuario._default_manager.get_by_natural_key(
                identificador
            )
        except Usuario.DoesNotExist:
            usuario = None

        if usuario is not None and (
            not usuario.is_active
            or usuario.estado_cuenta != "A"
        ):
            if password and usuario.check_password(password):

                if usuario.estado_cuenta == "B":
                    raise PermissionDenied({
                        "code": "cuenta_bloqueada",
                        "detail": (
                            "Tu cuenta ha sido bloqueada por el "
                            "administrador. Contacta con soporte."
                        )
                    })

                raise PermissionDenied({
                    "code": "cuenta_inactiva",
                    "detail": (
                        "Tu cuenta se encuentra inactiva. "
                        "Contacta con el administrador."
                    )
                })

        data = super().validate(attrs)

        data["usuario"] = UsuarioSerializer(self.user, context=self.context).data

        return data


class RegistroSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    class Meta:
        model = Usuario
        fields = ['email', 'password', 'first_name', 'last_name', 'no_identificacion', 'telefono']

    def validate(self, attrs):
        usuario_temporal = Usuario(**{k: v for k, v in attrs.items() if k != 'password'})
        try:
            validate_password(attrs['password'], usuario_temporal)
        except DjangoValidationError as error:
            raise serializers.ValidationError({'password': list(error.messages)})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        usuario = Usuario.objects.create_user(**validated_data)
        PerfilCliente.objects.create(usuario=usuario)
        return usuario


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)
    new_password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate(self, attrs):
        email = attrs.get('email')
        code = attrs.get('code')
        new_password = attrs.get('new_password')

        try:
            usuario = Usuario.objects.get(email=email)
        except Usuario.DoesNotExist:
            raise serializers.ValidationError({'email': 'El usuario no existe.'})

        reset_code = PasswordResetCode.objects.filter(usuario=usuario, code=code).first()
        if not reset_code or not reset_code.is_valid():
            raise serializers.ValidationError({'code': 'El código es inválido o ha expirado.'})

        try:
            validate_password(new_password, user=usuario)
        except DjangoValidationError as error:
            raise serializers.ValidationError({'new_password': list(error.messages)})

        attrs['usuario'] = usuario
        attrs['reset_code'] = reset_code
        return attrs

    @transaction.atomic
    def save(self):
        usuario = self.validated_data['usuario']
        nueva_password = self.validated_data['new_password']

        usuario.set_password(nueva_password)
        usuario.save()

        PasswordResetCode.objects.filter(usuario=usuario, is_used=False).update(is_used=True)
        return usuario
