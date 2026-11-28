import os
import django
from datetime import date, timedelta, datetime, time
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone

from pilotos.models import Mision
from usuarios.models import Piloto


def _aware(d, h=8):
    return timezone.make_aware(datetime.combine(d, time(hour=h)))


def poblar_misiones():
    piloto = Piloto.objects.first()

    if not piloto:
        print("Error: No hay ningún piloto registrado en la base de datos. Registra uno primero.")
        return

    print(f"Asignando misiones de prueba al piloto: {piloto.usuario.first_name} {piloto.usuario.last_name}")

    personales = [
        {
            "tipo_mision": "PERSONAL",
            "categoria": "fotografia",
            "cliente_nombre": "",
            "ubicacion": "Lago de Yojoa - Sector Norte",
            "area_size": "4.2 km dist.",
            "fecha_programada": date.today() + timedelta(days=2),
            "dron_asignado": "DJI Mavic 3 Pro",
            "descripcion": "Captura de atardecer en RAW de alta resolución (48MP) para proyecto personal.",
            "estado": "PENDIENTE",
            "capturas_generadas": 0,
            "distancia_km": Decimal("0.00"),
        },
        {
            "tipo_mision": "PERSONAL",
            "categoria": "carreras_fpv",
            "cliente_nombre": "",
            "ubicacion": "Pista Abandonada - Circuit Park",
            "area_size": "12 Baterías",
            "fecha_programada": date.today() - timedelta(days=5),
            "dron_asignado": "Custom 5'' FPV Quad",
            "descripcion": "Práctica de Freestyle y trucos de precisión (Rubik Cube, Power Loop).",
            "estado": "COMPLETADA",
            "capturas_generadas": 320,
            "distancia_km": Decimal("8.40"),
        },
        {
            "tipo_mision": "PERSONAL",
            "categoria": "fotografia",
            "cliente_nombre": "",
            "ubicacion": "Parque Nacional Celaque",
            "area_size": "3.1 km dist.",
            "fecha_programada": date.today() - timedelta(days=12),
            "dron_asignado": "DJI Mavic 3 Pro",
            "descripcion": "Sesión de fotografía aérea del bosque nublado para portafolio.",
            "estado": "COMPLETADA",
            "capturas_generadas": 480,
            "distancia_km": Decimal("5.60"),
        },
        {
            "tipo_mision": "PERSONAL",
            "categoria": "exploracion",
            "cliente_nombre": "",
            "ubicacion": "Ruinas de Copán",
            "area_size": "2.0 km dist.",
            "fecha_programada": date.today() - timedelta(days=18),
            "dron_asignado": "DJI Mini 5 Pro",
            "descripcion": "Exploración aérea del sitio arqueológico.",
            "estado": "COMPLETADA",
            "capturas_generadas": 210,
            "distancia_km": Decimal("3.20"),
        },
    ]

    terceros = [
        {
            "tipo_mision": "TERCEROS",
            "categoria": "agronomia",
            "cliente_nombre": "Agropecuaria El Norte",
            "ubicacion": "San Manuel, Cortés",
            "area_size": "55 Hectáreas",
            "fecha_programada": date.today() + timedelta(days=1),
            "dron_asignado": "DJI Agras T40",
            "descripcion": "Aplicación de fertilizante foliar en lote sector sur.",
            "estado": "PENDIENTE",
            "capturas_generadas": 0,
            "distancia_km": Decimal("0.00"),
        },
        {
            "tipo_mision": "TERCEROS",
            "categoria": "inspeccion_industrial",
            "cliente_nombre": "Parque Eólico La Breña (EnergyCorp)",
            "ubicacion": "Tegucigalpa, FM",
            "area_size": "12 Turbinas",
            "fecha_programada": date.today() - timedelta(days=1),
            "dron_asignado": "Matrice 350 RTK",
            "descripcion": "Inspección termográfica de palas de turbina eólica.",
            "estado": "ACEPTADA",
            "capturas_generadas": 0,
            "distancia_km": Decimal("0.00"),
        },
        {
            "tipo_mision": "TERCEROS",
            "categoria": "audiovisual_pro",
            "cliente_nombre": "Estadio Metropolitano (Fox Sports)",
            "ubicacion": "San Pedro Sula, Cortés",
            "area_size": "Evento Live",
            "fecha_programada": date.today() - timedelta(days=10),
            "dron_asignado": "Cinewhoop Custom Pro",
            "descripcion": "Transmisión en vivo HD con dron FPV.",
            "estado": "COMPLETADA",
            "capturas_generadas": 150,
            "distancia_km": Decimal("6.20"),
        },
        {
            "tipo_mision": "TERCEROS",
            "categoria": "agronomia",
            "cliente_nombre": "Finca Santa Rosa",
            "ubicacion": "Comayagua",
            "area_size": "30 Hectáreas",
            "fecha_programada": date.today() - timedelta(days=20),
            "dron_asignado": "DJI Agras T40",
            "descripcion": "Monitoreo multiespectral de cultivos de café.",
            "estado": "COMPLETADA",
            "capturas_generadas": 260,
            "distancia_km": Decimal("4.10"),
        },
    ]

    for m in personales + terceros:
        fecha_creacion = _aware(m["fecha_programada"], 8)
        fecha_cierre = _aware(m["fecha_programada"], 12) if m["estado"] == "COMPLETADA" else None

        mision = Mision(piloto=piloto, fecha_cierre=fecha_cierre, **m)
        mision.save()

        if fecha_cierre:
            Mision.objects.filter(pk=mision.pk).update(fecha_creacion=fecha_creacion)

    print(f"¡Éxito! Se han creado {len(personales) + len(terceros)} misiones de prueba.")


if __name__ == '__main__':
    poblar_misiones()