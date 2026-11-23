from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario, PerfilCliente, Piloto, Tecnico, Vendedor

class PerfilClienteInline(admin.StackedInline):
    model = PerfilCliente
    extra = 0
    max_num = 1
    can_delete = False


class PilotoInline(admin.StackedInline):
    model = Piloto
    extra = 0
    max_num = 1


class TecnicoInline(admin.StackedInline):
    model = Tecnico
    extra = 0
    max_num = 1


class VendedorInline(admin.StackedInline):
    model = Vendedor
    extra = 0
    max_num = 1


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    ordering = ('email',)
    list_display = ('email', 'first_name', 'last_name', 'no_identificacion', 'estado_cuenta')
    list_filter = ('estado_cuenta', 'is_staff', 'groups')
    search_fields = ('email', 'first_name', 'last_name', 'no_identificacion')
    inlines = [PerfilClienteInline, PilotoInline, TecnicoInline, VendedorInline]

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Datos personales', {'fields': ('first_name', 'last_name', 'no_identificacion',
                                         'telefono', 'fecha_nacimiento', 'foto_perfil_url')}),
        ('Estado y permisos', {'fields': ('estado_cuenta', 'is_staff', 'is_superuser',
                                          'groups', 'user_permissions')}),
        ('Fechas', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'no_identificacion', 'first_name', 'last_name',
                       'password1', 'password2'),
        }),
    )