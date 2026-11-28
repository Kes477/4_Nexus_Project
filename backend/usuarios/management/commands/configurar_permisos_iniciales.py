from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import Group, Permission
from django.db import transaction


PERMISOS_INICIALES = {

    "Administrador": [

        "usuarios.view_usuario",
        "usuarios.add_usuario",
        "usuarios.change_usuario",
        "usuarios.gestionar_estado_usuario",
        "usuarios.configurar_permisos_rol",
        "usuarios.asignar_roles_usuario",

        "auth.view_group",
        "auth.add_group",
        "auth.change_group",
        "auth.delete_group",
        "auth.view_permission",

        "reparaciones.view_ordenservicio",
        "reparaciones.add_ordenservicio",
        "reparaciones.change_ordenservicio",

    ],

    "Cliente": [],

    "Tecnico": [],

    "Piloto": [],

    "Vendedor": [],

}


class Command(BaseCommand):

    help = "Configura los permisos iniciales de los roles."

    def add_arguments(self, parser):

        parser.add_argument(
            "--aplicar",
            action="store_true",
            help="Aplica los permisos a la base de datos."
        )

    @transaction.atomic
    def handle(self, *args, **options):

        aplicar = options["aplicar"]

        configuracion = {}

        for nombre, codigos in PERMISOS_INICIALES.items():

            permisos = []

            for codigo in codigos:

                modulo, codename = codigo.split(".", 1)

                try:

                    permiso = Permission.objects.get(
                        content_type__app_label=modulo,
                        codename=codename
                    )

                except Permission.DoesNotExist:

                    raise CommandError(
                        f"Permiso inexistente: {codigo}"
                    )

                permisos.append(permiso)

            configuracion[nombre] = permisos

        for nombre, permisos in configuracion.items():

            rol = Group.objects.filter(
                name=nombre
            ).first()

            actuales = set()

            if rol:

                actuales = set(
                    rol.permissions.values_list(
                        "pk",
                        flat=True
                    )
                )

            nuevos = [
                permiso
                for permiso in permisos
                if permiso.pk not in actuales
            ]

            self.stdout.write(
                f"\nRol: {nombre}"
            )

            self.stdout.write(
                f"Permisos actuales: {len(actuales)}"
            )

            self.stdout.write(
                f"Permisos por agregar: {len(nuevos)}"
            )

            for permiso in nuevos:

                self.stdout.write(
                    f"  + {permiso.content_type.app_label}"
                    f".{permiso.codename}"
                )

            if aplicar:

                rol, _ = Group.objects.get_or_create(
                    name=nombre
                )

                rol.permissions.add(*nuevos)

        if aplicar:

            self.stdout.write(
                self.style.SUCCESS(
                    "\nConfiguracion aplicada correctamente."
                )
            )

        else:

            self.stdout.write(
                self.style.WARNING(
                    "\nSimulacion: no se modifico la base de datos."
                )
            )
