from django.urls import path
from rest_framework.routers import SimpleRouter

from .admin_views import UsuarioAdminViewSet
from .empleado_views import RegistroEmpleadoView
from .edicion_views import EdicionUsuarioView
from .estado_views import EstadoUsuarioView
from .roles_views import PermisoViewSet
from .roles_admin_views import RolAdminViewSet

from .roles_permisos_views import (
    PermisosDelegablesView,
    PermisosRolView,
)


from .asignacion_roles_views import AsignacionRolesUsuarioView

from .permisos_efectivos_views import (
    PermisosEfectivosUsuarioView,
    MisPermisosView,
)


from .perfiles_especializados_views import PerfilEspecializadoView

router = SimpleRouter()

router.register(
    "usuarios",
    UsuarioAdminViewSet,
    basename="gestion-usuarios"
)

router.register(
    "roles",
    RolAdminViewSet,
    basename="gestion-roles"
)

router.register(
    "permisos",
    PermisoViewSet,
    basename="gestion-permisos"
)

from .activacion_views import GenerarActivacionView

urlpatterns = [
    path(
        "usuarios/<int:pk>/activar/",
        GenerarActivacionView.as_view(),
        name="generar-activacion"
    ),

    path(
        "usuarios/<int:pk>/perfiles/<str:tipo>/",
        PerfilEspecializadoView.as_view(),
        name="perfil-especializado"
    ),

    path(
        "mis-permisos/",
        MisPermisosView.as_view(),
        name="mis-permisos"
    ),

    path(
        "usuarios/<int:pk>/permisos/",
        PermisosEfectivosUsuarioView.as_view(),
        name="permisos-efectivos-usuario"
    ),

    path(
        "usuarios/<int:pk>/roles/",
        AsignacionRolesUsuarioView.as_view(),
        name="asignacion-roles-usuario"
    ),


    path(
        "empleados/registrar/",
        RegistroEmpleadoView.as_view(),
        name="registrar-empleado"
    ),

    path(
        "usuarios/<int:pk>/editar/",
        EdicionUsuarioView.as_view(),
        name="editar-usuario"
    ),

    path(
        "usuarios/<int:pk>/estado/",
        EstadoUsuarioView.as_view(),
        name="estado-usuario"
    ),

    path(
        "permisos/delegables/",
        PermisosDelegablesView.as_view(),
        name="permisos-delegables"
    ),

    path(
        "roles/<int:pk>/permisos/",
        PermisosRolView.as_view(),
        name="permisos-rol"
    ),

] + router.urls
