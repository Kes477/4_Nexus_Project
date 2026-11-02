from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager

class UsuarioManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self,email, password, **extra):
        if not email:
            raise ValueError('El correo es Obligatorio')
        user = self.model(email=self.normalize_email(email), **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra):
        extra.setdefault('is_staff', False)
        extra.setdefault('is_superuser', False)
        return self._create_user(email, password, **extra)

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault('is_staff', True)
        extra.setdefault('is_superuser', True)
        return self._create_user(email, password, **extra)


class Usuario(AbstractUser):
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
    foto_perfil_url = models.URLField(max_length=500, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['no_identificacion', 'first_name', 'last_name']

    objects = UsuarioManager()

    def save(self, *args, **kwargs):
        self.is_active = self.estado_cuenta == self.EstadoCuenta.ACTIVA
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.first_name} {self.last_name}'

