from django.contrib.auth.models import Permission


PERMISOS_DELEGABLES = frozenset({

    "reparaciones.view_ordenservicio",
    "reparaciones.add_ordenservicio",
    "reparaciones.change_ordenservicio",

})


def codigo_permiso(permiso):

    return (
        f"{permiso.content_type.app_label}."
        f"{permiso.codename}"
    )


def obtener_permisos_delegables(usuario):

    if not usuario.is_authenticated or not usuario.is_active:
        return Permission.objects.none()

    permisos_usuario = usuario.get_all_permissions()

    permisos = Permission.objects.select_related(
        "content_type"
    )

    ids = [
        permiso.pk
        for permiso in permisos
        if codigo_permiso(permiso) in PERMISOS_DELEGABLES
        and codigo_permiso(permiso) in permisos_usuario
    ]

    return permisos.filter(pk__in=ids)
