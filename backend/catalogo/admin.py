from django.contrib import admin
from .models import (Articulo,AtributoVariante, Categoria, ImagenArticulo, Producto, Variante,)


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ('nombre','categoria_padre')
    search_fields = ('nombre',)

class ArticuloInline(admin.StackedInline):
    model = Articulo
    can_delete = False

class VarianteInline(admin.TabularInline):
    model = Variante
    extra = 1


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ('nombre','categoria','tipo_producto','activo','fecha_publicacion')
    list_filter = ('tipo_producto','activo','categoria')
    list_editable = ('activo',)
    search_fields = ('nombre', 'descripcion')
    inlines = [ArticuloInline, VarianteInline]

class ImagenArticuloInline(admin.TabularInline):
    model = ImagenArticulo
    extra = 1

@admin.register(Articulo)
class ArticuloAdmin(admin.ModelAdmin):
    list_display = ('__str__','producto','tiempo_vuelo_max_min','alcance_max_km')
    search_fields = ('marca', 'modelo', 'producto__nombre')
    inlines = [ImagenArticuloInline]

class AtributoVarianteInline(admin.TabularInline):
    model = AtributoVariante
    extra = 1

@admin.register(Variante)
class VarianteAdmin(admin.ModelAdmin):
    list_display = ('sku', 'producto', 'precio')
    search_fields = ('sku', 'producto__nombre')
    inlines = [AtributoVarianteInline]    