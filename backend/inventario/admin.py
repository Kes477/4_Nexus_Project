from django.contrib import admin
from django import forms

from . import servicios
from .models import Almacen, Inventario, MovimientoInventario, EstadoDron



@admin.register(Almacen)
class AlmacenAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'direccion','activo')
    list_filter = ('activo',)
    search_fields = ('nombre', 'direccion')

class InventarioForm(forms.ModelForm):
    entrada = forms.IntegerField(
        label='Registrar Entrada',
        required=False,
        min_value=1,
        help_text = 'Unidades que llegan al Almacén',
    )

    conteo_real = forms.IntegerField(
        label='Ajustar a conteo fisico',
        required=False,
        min_value=0,
        help_text= 'Cantidad disponible real despues de contar'

    )

    motivo = forms.CharField(required=False, max_length=255)

    class Meta:
        model = Inventario
        fields = ['almacen','variante','ubicacion_pasillo']

    def clean(self):
        datos = super().clean()
        entrada = datos.get('entrada')
        conteo_real = datos.get('conteo_real')

        if entrada and conteo_real is not None:
            raise forms.ValidationError('Registra una entrada o ajuste, no ambos a la vez')

        if conteo_real is not None:
            if not (datos.get('motivo') or '').strip():
                self.add_error('motivo','Un ajuste necesita un motivo')
            if conteo_real == self.instance.cantidad_disponible:
                self.add_error('conteo_real', 'El conteo coincide con el sistema; no hay nada') 
        return datos

class MovimientosInline(admin.TabularInline):
    model = MovimientoInventario  
    extra = 0
    can_delete = False
    fields = ('fecha', 'tipo', 'cantidad', 'motivo', 'usuario')
    readonly_fields = fields
    ordering=('-fecha',) 

    def has_add_permission(self, request, obj=None):
        return False    

@admin.register(Inventario)
class InventarioAdmin(admin.ModelAdmin):
    form = InventarioForm
    list_display = ('variante','almacen','cantidad_disponible', 'cantidad_reservada','cantidad_total','ubicacion_pasillo')
    list_filter = ('almacen',)
    search_fields = ('variante__sku','variante__producto__nombre')
    list_select_related = ('variante__producto','almacen')
    inlines = [MovimientosInline]

    def get_readonly_fields(self, request, obj=None):
        if obj:
            return ('almacen','variante','cantidad_disponible', 'cantidad_reservada')
        return('cantidad_disponible','cantidad_reservada')

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        datos = form.cleaned_data

        if datos.get('entrada'):
            servicios.registrar_entrada(
                obj, datos['entrada'], request.user,
                datos.get('motivo') or 'Entrada registrada desde el admin'  
            )
        elif datos.get('conteo_real') is not None:
            servicios.ajustar_inventario(
                obj, datos['conteo_real'], request.user, datos['motivo'],
            )

    def has_delete_permission(self, request, obj=None):
        return False

@admin.register(MovimientoInventario)
class MovimientoInventarioAdmin(admin.ModelAdmin):
    list_display = ('fecha', 'tipo', 'cantidad', 'inventario', 'usuario', 'motivo')
    list_filter = ('tipo', 'inventario__almacen')
    search_fields = ('inventario__variante__sku', 'motivo')
    date_hierarchy = 'fecha'
    list_select_related = ('inventario__variante', 'inventario__almacen', 'usuario')

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

@admin.register(EstadoDron)
class EstadoDronAdmin(admin.ModelAdmin):

    list_display = ('id', 'modelo', 'inventario', 'estado')

    list_filter = ('estado',)

    search_fields = (
        'inventario__variante__producto__nombre',
        'inventario__variante__sku',
    )

    list_editable = ('estado',)

    list_select_related = (
        'inventario__variante__producto__articulo',
    )

    @admin.display(description='Modelo')
    def modelo(self, obj):
        return obj.inventario.variante.producto.articulo.modelo

