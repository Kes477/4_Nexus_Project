from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0007_alter_usuario_options'),
        (
            'usuarios',
            '0007_remove_usuario_foto_perfil_url_usuario_foto_perfil'
        ),
    ]

    operations = []
