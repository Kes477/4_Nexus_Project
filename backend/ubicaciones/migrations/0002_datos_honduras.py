from django.db import migrations

# Departamento: cabecera municipal
DEPARTAMENTOS = {
    'Atlántida': 'La Ceiba',
    'Choluteca': 'Choluteca',
    'Colón': 'Trujillo',
    'Comayagua': 'Comayagua',
    'Copán': 'Santa Rosa de Copán',
    'Cortés': 'San Pedro Sula',
    'El Paraíso': 'Yuscarán',
    'Francisco Morazán': 'Distrito Central',
    'Gracias a Dios': 'Puerto Lempira',
    'Intibucá': 'La Esperanza',
    'Islas de la Bahía': 'Roatán',
    'La Paz': 'La Paz',
    'Lempira': 'Gracias',
    'Ocotepeque': 'Ocotepeque',
    'Olancho': 'Juticalpa',
    'Santa Bárbara': 'Santa Bárbara',
    'Valle': 'Nacaome',
    'Yoro': 'Yoro',
}


def cargar_honduras(apps, schema_editor):
    TipoUbicacion = apps.get_model('ubicaciones', 'TipoUbicacion')
    Ubicacion = apps.get_model('ubicaciones', 'Ubicacion')

    pais, _ = TipoUbicacion.objects.get_or_create(nombre='País')
    departamento, _ = TipoUbicacion.objects.get_or_create(nombre='Departamento')
    municipio, _ = TipoUbicacion.objects.get_or_create(nombre='Municipio')

    honduras, _ = Ubicacion.objects.get_or_create(
        nombre='Honduras', padre=None, defaults={'tipo': pais}
    )

    for nombre_departamento, cabecera in DEPARTAMENTOS.items():
        depto, _ = Ubicacion.objects.get_or_create(
            nombre=nombre_departamento, padre=honduras, defaults={'tipo': departamento}
        )
        Ubicacion.objects.get_or_create(
            nombre=cabecera, padre=depto, defaults={'tipo': municipio}
        )


def borrar_honduras(apps, schema_editor):
    Ubicacion = apps.get_model('ubicaciones', 'Ubicacion')
    TipoUbicacion = apps.get_model('ubicaciones', 'TipoUbicacion')

    # De abajo hacia arriba, porque "padre" usa PROTECT
    Ubicacion.objects.filter(tipo__nombre='Municipio').delete()
    Ubicacion.objects.filter(tipo__nombre='Departamento').delete()
    Ubicacion.objects.filter(tipo__nombre='País').delete()
    TipoUbicacion.objects.filter(nombre__in=['País', 'Departamento', 'Municipio']).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('ubicaciones', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(cargar_honduras, borrar_honduras),
    ]