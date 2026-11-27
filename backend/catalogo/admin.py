from django.contrib import admin
from .models import (Articulo, AtributoVariante, Categoria, ImagenArticulo, Producto, Variante, Resenia, Suscripcion, EspecificacionProducto)

@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ('nombre','categoria_padre')
    search_fields = ('nombre',)

class ArticuloInline(admin.StackedInline):
    model = Articulo
    can_delete = False

class SuscripcionInline(admin.StackedInline):
    model = Suscripcion
    can_delete = False

class VarianteInline(admin.TabularInline):
    model = Variante
    extra = 1

class ReseniaInline(admin.TabularInline):
    model = Resenia
    extra = 0
    readonly_fields = ('fecha_resenia',)

class EspecificacionProductoInline(admin.TabularInline):
    model = EspecificacionProducto
    extra = 1

@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ('nombre','categoria','tipo_producto','activo','es_destacado','mostrar_en_landing','orden_landing','fecha_publicacion')
    list_filter = ('tipo_producto','activo','es_destacado','mostrar_en_landing','categoria')
    list_editable = ('activo', 'es_destacado', 'mostrar_en_landing', 'orden_landing')
    search_fields = ('nombre', 'descripcion')
    inlines = [ArticuloInline, SuscripcionInline, EspecificacionProductoInline, VarianteInline, ReseniaInline]

class ImagenArticuloInline(admin.TabularInline):
    model = ImagenArticulo
    extra = 1

@admin.register(Articulo)
class ArticuloAdmin(admin.ModelAdmin):
    list_display = ('__str__','producto','tiempo_vuelo_max_min','alcance_max_km')
    search_fields = ('marca', 'modelo', 'producto__nombre')
    inlines = [ImagenArticuloInline]

@admin.register(Suscripcion)
class SuscripcionAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'producto', 'periodo_facturacion_dias', 'nivel_cobertura')
    search_fields = ('producto__nombre', 'nivel_cobertura')

class AtributoVarianteInline(admin.TabularInline):
    model = AtributoVariante
    extra = 1

@admin.register(Variante)
class VarianteAdmin(admin.ModelAdmin):
    list_display = ('sku', 'producto', 'precio')
    search_fields = ('sku', 'producto__nombre')
    inlines = [AtributoVarianteInline]

@admin.register(Resenia)
class ReseniaAdmin(admin.ModelAdmin):
    list_display = ('producto', 'cliente', 'calificacion', 'fecha_resenia')
    list_filter = ('calificacion', 'fecha_resenia')
    search_fields = ('producto__nombre', 'cliente__email', 'comentario')