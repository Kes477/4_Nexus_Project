from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario

@admin.register(Usuario)

class UsuarioAdmin(UserAdmin):
    ordering = ('email',)
    list_display = ('email', 'first_name', 'last_name', 'no_identificacion', 'estado_cuenta')
    list_filter = ('estado_cuenta', 'is_staff', 'groups')
    search_fields = ('email', 'first_name', 'last_name', 'no_identificacion')

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