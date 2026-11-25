from django.contrib import admin

from .models import Direccion, TipoUbicacion, Ubicacion


@admin.register(TipoUbicacion)
class TipoUbicacionAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'descripcion')
    search_fields = ('nombre',)


@admin.register(Ubicacion)
class UbicacionAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'tipo', 'padre')
    list_filter = ('tipo',)
    search_fields = ('nombre',)
    autocomplete_fields = ('padre',)
    list_select_related = ('tipo', 'padre__padre')


@admin.register(Direccion)
class DireccionAdmin(admin.ModelAdmin):
    list_display = ('linea_direccion1', 'ubicacion', 'usuario', 'tipo_direccion', 'es_principal')
    list_filter = ('tipo_direccion', 'es_principal')
    search_fields = ('linea_direccion1', 'usuario__email', 'ubicacion__nombre')
    autocomplete_fields = ('usuario', 'ubicacion')
    list_select_related = ('usuario', 'ubicacion__padre')