from django.contrib import admin

from .models import Carrito, CarritoDetalle


class CarritoDetalleInline(admin.TabularInline):
    model = CarritoDetalle
    extra = 0
    autocomplete_fields = ('variante',)
    readonly_fields = ('fecha_agregado',)


@admin.register(Carrito)
class CarritoAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'fecha_actualizacion')
    search_fields = ('usuario__email',)
    readonly_fields = ('fecha_actualizacion',)
    inlines = [CarritoDetalleInline]