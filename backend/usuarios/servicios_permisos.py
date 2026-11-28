def obtener_permisos_usuario(usuario):

    roles = usuario.groups.order_by("name")

    permisos_directos = set()

    for permiso in usuario.user_permissions.select_related(
        "content_type"
    ):

        permisos_directos.add(
            f"{permiso.content_type.app_label}.{permiso.codename}"
        )

    permisos_heredados = set()

    detalle_roles = []

    for rol in roles.prefetch_related(
        "permissions__content_type"
    ):

        permisos_rol = {
            f"{permiso.content_type.app_label}.{permiso.codename}"
            for permiso in rol.permissions.all()
        }

        permisos_heredados.update(
            permisos_rol
        )

        detalle_roles.append({
            "id": rol.pk,
            "nombre": rol.name,
            "permisos": sorted(permisos_rol)
        })

    permisos_efectivos = set()

    if usuario.is_active:

        permisos_efectivos = usuario.get_all_permissions()

    return {
        "id": usuario.pk,
        "estado_cuenta": usuario.estado_cuenta,
        "is_active": usuario.is_active,
        "is_superuser": usuario.is_superuser,
        "roles": detalle_roles,
        "permisos_directos": sorted(permisos_directos),
        "permisos_heredados": sorted(permisos_heredados),
        "permisos_efectivos": sorted(permisos_efectivos),
        "cantidad_roles": len(detalle_roles),
        "cantidad_permisos_efectivos": len(permisos_efectivos)
    }
