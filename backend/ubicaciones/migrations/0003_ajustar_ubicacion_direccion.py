from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('ubicaciones', '0002_datos_honduras'),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name='ubicacion',
            name='ubicacion_unica_por_padre',
        ),
        migrations.AddConstraint(
            model_name='ubicacion',
            constraint=models.UniqueConstraint(
                condition=models.Q(padre__isnull=False),
                fields=('padre', 'nombre'),
                name='ubicacion_unica_por_padre',
            ),
        ),
        migrations.AddConstraint(
            model_name='ubicacion',
            constraint=models.UniqueConstraint(
                condition=models.Q(padre__isnull=True),
                fields=('nombre',),
                name='ubicacion_raiz_unica_por_nombre',
            ),
        ),
        migrations.AlterField(
            model_name='direccion',
            name='usuario',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='direcciones',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name='direccion',
            name='ubicacion',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='direcciones',
                to='ubicaciones.ubicacion',
            ),
        ),
    ]