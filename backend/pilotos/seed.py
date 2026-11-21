import os
import django
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from pilotos.models import Mision
from usuarios.models import Piloto

def poblar_misiones():
    # 1. Buscamos al primer piloto en la base de datos
    piloto = Piloto.objects.first()
    
    if not piloto:
        print("Error: No hay ningún piloto registrado en la base de datos. Registra uno primero.")
        return

    print(f"Asignando misiones de prueba al piloto: {piloto.usuario.first_name} {piloto.usuario.last_name}")

    # 2. Misiones de Uso Personal
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
            "estado": "PENDIENTE"
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
            "fecha_cierre": date.today() - timedelta(days=5)
        }
    ]

    # 3. Misiones de Servicios a Terceros
    terceros = [
        {
            "tipo_mision": "TERCEROS",
            "categoria": "fumigacion",
            "cliente_nombre": "Agropecuaria El Norte",
            "ubicacion": "San Manuel, Cortés",
            "area_size": "55 Hectáreas",
            "fecha_programada": date.today() + timedelta(days=1),
            "dron_asignado": "DJI Agras T40",
            "descripcion": "Aplicación de fertilizante foliar en lote sector sur. Mantener altura constante de 3.5m sobre dosel.",
            "estado": "PENDIENTE"
        },
        {
            "tipo_mision": "TERCEROS",
            "categoria": "inspeccion_industrial",
            "cliente_nombre": "Parque Eólico La Breña (EnergyCorp)",
            "ubicacion": "Tegucigalpa, FM",
            "area_size": "12 Turbinas",
            "fecha_programada": date.today() - timedelta(days=1),
            "dron_asignado": "Matrice 350 RTK",
            "descripcion": "Inspección termográfica de palas de turbina eólica en búsqueda de microfisuras.",
            "estado": "ACEPTADA"
        },
        {
            "tipo_mision": "TERCEROS",
            "categoria": "audiovisual_pro",
            "cliente_nombre": "Estadio Metropolitano (Fox Sports)",
            "ubicacion": "San Pedro Sula, Cortés",
            "area_size": "Evento Live",
            "fecha_programada": date.today() - timedelta(days=10),
            "dron_asignado": "Cinewhoop Custom Pro",
            "descripcion": "Transmisión en vivo HD con dron FPV de carreras para evento deportivo.",
            "estado": "COMPLETADA",
            "fecha_cierre": date.today() - timedelta(days=10)
        }
    ]

    # 4. Insertar en la base de datos
    for m in personales + terceros:
        Mision.objects.create(piloto=piloto, **m)

    print(f"¡Éxito! Se han creado {len(personales) + len(terceros)} misiones de prueba.")

if __name__ == '__main__':
    poblar_misiones()