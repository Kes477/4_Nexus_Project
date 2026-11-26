from django.contrib import admin, messages
from django.core.exceptions import ValidationError


from .models import Carrito, CarritoDetalle, Cupon, DetallePedido, Pedido
from .servicios import cancelar_pedido


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

@admin.register(Cupon)
class CuponAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'tipo_descuento', 'valor_descuento', 'fecha_inicio', 'fecha_expiracion', 'activo')
    list_filter = ('tipo_descuento', 'activo')
    search_fields = ('codigo',)


class DetallePedidoInline(admin.TabularInline):
    model = DetallePedido
    extra = 0
    can_delete = False
    readonly_fields = ('variante', 'tipo_producto', 'cantidad', 'precio_unitario', 'subtotal_linea')

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ('id', 'usuario', 'fecha_pedido', 'estado_pedido', 'total_final')
    list_filter = ('estado_pedido', 'fecha_pedido')
    search_fields = ('id', 'usuario__email')
    date_hierarchy = 'fecha_pedido'
    list_select_related = ('usuario',)
    readonly_fields = (
        'usuario', 'fecha_pedido', 'estado_pedido', 'direccion', 'cupon',
        'subtotal', 'total_descuento', 'costo_envio', 'total_impuestos', 'total_final',
    )
    inlines = [DetallePedidoInline]
    actions = ['cancelar_seleccionados']

    def has_add_permission(self, request):
        return False

    @admin.action(description='Cancelar pedidos pendientes (libera el stock)')
    def cancelar_seleccionados(self, request, queryset):
        cancelados = 0
        for pedido in queryset:
            try:
                cancelar_pedido(pedido, usuario=request.user)
                cancelados += 1
            except ValidationError as error:
                self.message_user(request, f'Pedido #{pedido.pk}: {error.messages[0]}', messages.WARNING)
        if cancelados:
            self.message_user(request, f'{cancelados} pedido(s) cancelado(s).', messages.SUCCESS)