from django.contrib import admin

from .models import RenovacionSuscripcion, SuscripcionActiva


class RenovacionInline(admin.TabularInline):
    model = RenovacionSuscripcion
    extra = 0
    can_delete = False
    readonly_fields = ('periodo_inicio', 'periodo_fin', 'monto', 'metodo_pago',
                       'estado_cobro', 'fecha_cobro', 'id_transaccion_externa')

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(SuscripcionActiva)
class SuscripcionActivaAdmin(admin.ModelAdmin):
    list_display = ('id', 'usuario', 'plan', 'estado', 'fecha_inicio', 'fecha_vencimiento')
    list_filter = ('estado',)
    search_fields = ('usuario__email',)
    list_select_related = ('usuario', 'plan__producto')
    readonly_fields = ('usuario', 'plan', 'detalle', 'fecha_inicio')
    inlines = [RenovacionInline]

    def has_add_permission(self, request):
        return False   # se crean al pagar el pedido, no a mano