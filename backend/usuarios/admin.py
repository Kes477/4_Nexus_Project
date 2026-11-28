from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import ReadOnlyPasswordHashField
from mensajeria.models import Message
from .models import Usuario, PerfilCliente, Piloto, Tecnico, Vendedor


class UsuarioCreationForm(forms.ModelForm):
    password1 = forms.CharField(label='Contraseña', widget=forms.PasswordInput)
    password2 = forms.CharField(label='Confirmar contraseña', widget=forms.PasswordInput)

    class Meta:
        model = Usuario
        fields = ('email', 'no_identificacion', 'first_name', 'last_name')

    def clean_password2(self):
        password1 = self.cleaned_data.get('password1')
        password2 = self.cleaned_data.get('password2')
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError('Las contraseñas no coinciden.')
        return password2

    def save(self, commit=True):
        usuario = super().save(commit=False)
        usuario.set_password(self.cleaned_data['password1'])
        if commit:
            usuario.save()
        return usuario


class UsuarioChangeForm(forms.ModelForm):
    password = ReadOnlyPasswordHashField(
        label='Contraseña',
        help_text='Las contraseñas no se almacenan en texto plano. Usa el formulario de cambio de contraseña para actualizarla.',
    )

    class Meta:
        model = Usuario
        fields = '__all__'

    def clean_password(self):
        return self.initial.get('password', '')


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


class MensajeEnviadoInline(admin.TabularInline):
    model = Message
    fk_name = 'sender'
    extra = 0
    readonly_fields = ('room', 'content', 'timestamp', 'is_read')
    can_delete = False


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    ordering = ('email',)
    form = UsuarioChangeForm
    add_form = UsuarioCreationForm
    list_display = (
        'email', 'first_name', 'last_name', 'no_identificacion',
        'estado_cuenta', 'rol_display',
    )
    list_filter = ('estado_cuenta', 'is_staff', 'groups')
    search_fields = ('email', 'first_name', 'last_name', 'no_identificacion')
    inlines = [
        PerfilClienteInline,
        PilotoInline,
        TecnicoInline,
        VendedorInline,
        MensajeEnviadoInline,
    ]

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Datos personales', {'fields': ('first_name', 'last_name', 'no_identificacion',
                                         'telefono', 'fecha_nacimiento')}),
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

    @admin.display(description='Rol')
    def rol_display(self, obj):
        return obj.rol