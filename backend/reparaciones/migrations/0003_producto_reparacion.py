from decimal import Decimal
from django.db import migrations

SKU = 'SERV-REPARACION'


def crear_producto(apps, schema_editor):
    Categoria = apps.get_model('catalogo', 'Categoria')
    Producto = apps.get_model('catalogo', 'Producto')
    Variante = apps.get_model('catalogo', 'Variante')

    categoria, _ = Categoria.objects.get_or_create(nombre='Servicios técnicos')
    producto, _ = Producto.objects.get_or_create(
        nombre='Servicio de reparación',
        tipo_producto='SERVICIO',
        defaults={
            'categoria': categoria,
            'descripcion': 'Reparación en taller. El precio lo cotiza el técnico.',
            'activo': False,   # no aparece en el catálogo
        },
    )
    Variante.objects.get_or_create(
        sku=SKU, defaults={'producto': producto, 'precio': Decimal('1.00')}
    )


def borrar_producto(apps, schema_editor):
    Variante = apps.get_model('catalogo', 'Variante')
    Variante.objects.filter(sku=SKU, detalles_pedido__isnull=True).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('reparaciones', '0002_ordenservicio_costo_ordenservicio_pedido_and_more'),
        ('catalogo', '0007_remove_resenia_resenia_unica_por_cliente_producto_and_more'),
    ]

    operations = [
        migrations.RunPython(crear_producto, borrar_producto),
    ]