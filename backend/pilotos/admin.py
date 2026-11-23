from django.contrib import admin
from .models import Mision

@admin.register(Mision)
class MisionAdmin(admin.ModelAdmin):
    list_display = ('id', 'piloto', 'tipo_mision', 'categoria', 'estado', 'fecha_programada')
    list_filter = ('tipo_mision', 'estado', 'categoria')
    search_fields = ('ubicacion', 'cliente_nombre', 'descripcion')