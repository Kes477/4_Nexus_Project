from django.contrib import admin, messages
from django.core.exceptions import ValidationError


from .models import Carrito, CarritoDetalle, Cupon, DetallePedido, MetodoPago, Pedido, TransaccionPago
from .servicios import cancelar_pedido, confirmar_pago


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

class TransaccionPagoInline(admin.TabularInline):
    model = TransaccionPago
    extra = 0
    can_delete = False
    readonly_fields = ('forma_pago', 'metodo_pago', 'monto', 'estado_pago', 'fecha_pago', 'id_transaccion_externa')

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
    inlines = [DetallePedidoInline, TransaccionPagoInline]
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

@admin.register(MetodoPago)
class MetodoPagoAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'tipo_tarjeta', 'ultimos_cuatro', 'fecha_expiracion')
    search_fields = ('usuario__email', 'ultimos_cuatro')
    exclude = ('token_pasarela',)


@admin.register(TransaccionPago)
class TransaccionPagoAdmin(admin.ModelAdmin):
    list_display = ('id', 'pedido', 'forma_pago', 'monto', 'estado_pago', 'fecha_pago')
    list_filter = ('estado_pago', 'forma_pago')
    search_fields = ('pedido__id', 'pedido__usuario__email', 'id_transaccion_externa')
    list_select_related = ('pedido__usuario',)
    readonly_fields = (
        'pedido', 'metodo_pago', 'forma_pago', 'monto', 'estado_pago',
        'fecha_pago', 'id_transaccion_externa',
    )
    actions = ['confirmar_seleccionados']

    def has_add_permission(self, request):
        return False

    @admin.action(description='Confirmar pagos pendientes (transferencia o contra entrega)')
    def confirmar_seleccionados(self, request, queryset):
        confirmados = 0
        for transaccion in queryset:
            try:
                confirmar_pago(transaccion)
                confirmados += 1
            except ValidationError as error:
                self.message_user(request, f'Pago #{transaccion.pk}: {error.messages[0]}', messages.WARNING)
        if confirmados:
            self.message_user(request, f'{confirmados} pago(s) confirmado(s).', messages.SUCCESS)