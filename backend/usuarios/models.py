from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta


class UsuarioManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra):
        if not email:
            raise ValueError('El correo es Obligatorio')
        user = self.model(email=self.normalize_email(email), **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra):
        extra['is_staff'] = False
        extra['is_superuser'] = False
        return self._create_user(email, password, **extra)

    def create_superuser(self, email, password=None, **extra):
        extra['is_staff'] = True
        extra['is_superuser'] = True
        return self._create_user(email, password, **extra)


class Usuario(AbstractUser):

    class Meta:
        permissions = [
            (
                "gestionar_estado_usuario",
                "Puede gestionar estados de cuenta"
            ),
            (
                "configurar_permisos_rol",
                "Puede configurar permisos de roles"
            ),
            (
                "asignar_roles_usuario",
                "Puede asignar roles a usuarios"
            ),
        ]

    class EstadoCuenta(models.TextChoices):
        ACTIVA = 'A', 'Activa'
        INACTIVA = 'I', 'Inactiva'
        SUSPENDIDA = 'S', 'Suspendida'
        BLOQUEADA = 'B', 'Bloqueada'

    username = None
    email = models.EmailField('correo electrónico', max_length=255, unique=True)
    no_identificacion = models.CharField('número de identificación', max_length=20, unique=True)
    first_name = models.CharField('nombre', max_length=100)
    last_name = models.CharField('apellido', max_length=100)
    telefono = models.CharField(max_length=20, blank=True)
    fecha_nacimiento = models.DateField(null=True, blank=True)
    estado_cuenta = models.CharField(
        max_length=1, choices=EstadoCuenta.choices, default=EstadoCuenta.ACTIVA
    )
    
    foto_perfil = models.ImageField(upload_to='avatares/', null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['no_identificacion', 'first_name', 'last_name']

    objects = UsuarioManager()

    def clean(self):
        super().clean()
        if self.is_staff and self.pk is not None and hasattr(self, 'perfil_piloto'):
            raise ValidationError(
                {'is_staff': 'Un piloto no puede tener permisos de administrador.'}
            )

    def save(self, *args, **kwargs):
        if self.is_staff and self.pk is not None and hasattr(self, 'perfil_piloto'):
            raise ValidationError(
                {'is_staff': 'Un piloto no puede tener permisos de administrador.'}
            )
        self.is_active = self.estado_cuenta == self.EstadoCuenta.ACTIVA
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.first_name} {self.last_name}'

    @property
    def rol(self):
        if self.is_staff:
            return 'admin'
        if hasattr(self, 'perfil_piloto'):
            return 'piloto'
        if hasattr(self, 'perfil_tecnico'):
            return 'tecnico'
        if hasattr(self, 'perfil_vendedor'):
            return 'vendedor'
        return 'cliente'


class PerfilCliente(models.Model):
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='perfil_cliente',
        primary_key=True
    )
    nivel_fidelidad = models.CharField(max_length=20, blank=True)
    saldo_puntos = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"Cliente: {self.usuario.email}"


class PerfilEmpleado(models.Model):
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='perfil_empleado'
    )
    codigo_empleado = models.CharField(max_length=20, unique=True)
    cargo = models.CharField(max_length=100)
    fecha_ingreso = models.DateField()

    def __str__(self):
        return f"Empleado: {self.usuario.email}"


class Tecnico(models.Model):
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='perfil_tecnico',
        primary_key=True
    )
    especialidad_tecnica = models.CharField(max_length=100)
    certificacion_fabricante = models.CharField(max_length=100, blank=True)
    disponible = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=~models.Q(especialidad_tecnica=""),
                name="tecnico_especialidad_no_vacia"
            )
        ]

    def __str__(self):
        return f"Técnico: {self.usuario.email}"


class Piloto(models.Model):
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='perfil_piloto',
        primary_key=True
    )
    numero_licencia_aeronautica = models.CharField(max_length=50, unique=True)
    horas_vuelo_acumuladas = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    tipo_certificacion = models.CharField(max_length=100, blank=True)
    disponible = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=models.Q(horas_vuelo_acumuladas__gte=0),
                name='piloto_horas_vuelo_no_negativas'
            )
        ]

    def clean(self):
        super().clean()
        if self.usuario_id and Usuario.objects.filter(pk=self.usuario_id, is_staff=True).exists():
            raise ValidationError(
                {'usuario': 'Un piloto no puede tener permisos de administrador.'}
            )

    def save(self, *args, **kwargs):
        if self.usuario_id and Usuario.objects.filter(pk=self.usuario_id, is_staff=True).exists():
            raise ValidationError(
                {'usuario': 'Un piloto no puede tener permisos de administrador.'}
            )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Piloto: {self.usuario.email}"


class Vendedor(models.Model):
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='perfil_vendedor',
        primary_key=True
    )
    rtn_empresa = models.CharField(max_length=20, unique=True)
    nombre_comercial = models.CharField(max_length=100)
    sitio_web = models.URLField(max_length=255, blank=True)
    comision_pactada = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=models.Q(comision_pactada__gte=0, comision_pactada__lte=100),
                name='vendedor_comision_entre_0_y_100'
            )
        ]

    def __str__(self):
        return f"Vendedor: {self.usuario.email}"


class PasswordResetCode(models.Model):
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reset_codes'
    )
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['usuario', 'code']),
        ]

    def is_valid(self):
        return not self.is_used and timezone.now() < self.created_at + timedelta(minutes=3)

    def __str__(self):
        return f"Reset {self.code} for {self.usuario.email}"