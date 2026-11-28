from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group
from django.contrib.auth import get_user_model
from django.db import transaction


class Command(BaseCommand):

    help = "Inicializa los roles comerciales de 4 NEXUS"

    @transaction.atomic
    def handle(self, *args, **options):

        Usuario = get_user_model()

        nombres_roles = (
            "Administrador",
            "Cliente",
            "Vendedor",
            "Tecnico",
            "Piloto",
        )

        roles = {}

        for nombre in nombres_roles:

            grupo, creado = Group.objects.get_or_create(
                name=nombre
            )

            roles[nombre] = grupo

            if creado:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Rol creado: {nombre}"
                    )
                )
            else:
                self.stdout.write(
                    f"Rol existente: {nombre}"
                )

        for usuario in Usuario.objects.all():

            asignaciones = []

            if usuario.groups.exists():
                self.stdout.write(
                    f"Usuario {usuario.pk}: conserva sus roles"
                )
                continue

            if usuario.is_staff or usuario.is_superuser:
                asignaciones.append("Administrador")

            if hasattr(usuario, "perfil_cliente"):
                asignaciones.append("Cliente")

            if hasattr(usuario, "perfil_vendedor"):
                asignaciones.append("Vendedor")

            if hasattr(usuario, "perfil_tecnico"):
                asignaciones.append("Tecnico")

            if hasattr(usuario, "perfil_piloto"):
                asignaciones.append("Piloto")

            if not asignaciones:
                self.stdout.write(
                    self.style.WARNING(
                        f"Usuario {usuario.pk} sin rol identificado"
                    )
                )
                continue

            usuario.groups.add(
                *[roles[nombre] for nombre in asignaciones]
            )

            self.stdout.write(
                f"Usuario {usuario.pk}: "
                + ", ".join(asignaciones)
            )

        self.stdout.write(
            self.style.SUCCESS(
                "Inicializacion de roles completada."
            )
        )
