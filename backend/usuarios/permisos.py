from rest_framework.permissions import BasePermission


class PuedeConsultarUsuarios(BasePermission):

    message = "No tiene permiso para consultar usuarios."

    def has_permission(self, request, view):

        usuario = request.user

        return (
            usuario.is_authenticated
            and usuario.is_active
            and usuario.has_perm("usuarios.view_usuario")
        )

class PuedeRegistrarUsuarios(BasePermission):

    message = "No tiene permiso para registrar usuarios."

    def has_permission(self, request, view):

        usuario = request.user

        return (
            usuario.is_authenticated
            and usuario.is_active
            and usuario.has_perm("usuarios.add_usuario")
        )


class PuedeModificarUsuarios(BasePermission):

    message = "No tiene permiso para modificar usuarios."

    def has_permission(self, request, view):

        usuario = request.user

        return (
            usuario.is_authenticated
            and usuario.is_active
            and usuario.has_perm("usuarios.change_usuario")
        )


class PuedeGestionarEstadoUsuario(BasePermission):

    message = "No tiene permiso para gestionar estados de cuenta."

    def has_permission(self, request, view):

        usuario = request.user

        return (
            usuario.is_authenticated
            and usuario.is_active
            and usuario.has_perm(
                "usuarios.gestionar_estado_usuario"
            )
        )


class PuedeConsultarRoles(BasePermission):

    message = "No tiene permiso para consultar roles."

    def has_permission(self, request, view):

        usuario = request.user

        return (
            usuario.is_authenticated
            and usuario.is_active
            and usuario.has_perm("auth.view_group")
        )


class PuedeConsultarPermisos(BasePermission):

    message = "No tiene permiso para consultar permisos."

    def has_permission(self, request, view):

        usuario = request.user

        return (
            usuario.is_authenticated
            and usuario.is_active
            and usuario.has_perm("auth.view_permission")
        )


class PuedeAdministrarRoles(BasePermission):

    message = "No tiene permiso para realizar esta operacion."

    permisos_por_accion = {
        "list": "auth.view_group",
        "retrieve": "auth.view_group",
        "create": "auth.add_group",
        "update": "auth.change_group",
        "partial_update": "auth.change_group",
        "destroy": "auth.delete_group",
    }

    def has_permission(self, request, view):

        usuario = request.user

        permiso = self.permisos_por_accion.get(
            getattr(view, "action", None)
        )

        return bool(
            permiso
            and usuario.is_authenticated
            and usuario.is_active
            and usuario.has_perm(permiso)
        )


class PuedeConfigurarPermisosRol(BasePermission):

    message = "No tiene permiso para configurar permisos de roles."

    def has_permission(self, request, view):

        usuario = request.user

        return (
            usuario.is_authenticated
            and usuario.is_active
            and usuario.has_perm(
                "usuarios.configurar_permisos_rol"
            )
        )


class PuedeAsignarRolesUsuario(BasePermission):

    message = "No tiene permiso para asignar roles."

    def has_permission(self, request, view):

        usuario = request.user

        return bool(
            usuario.is_authenticated
            and usuario.is_active
            and usuario.has_perm(
                "usuarios.asignar_roles_usuario"
            )
        )
