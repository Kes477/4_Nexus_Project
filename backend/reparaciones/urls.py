from django.urls import path

from .views import (
    EquipoClienteViewSet,
    OrdenServicioViewSet,
)


# ======================================================
# EQUIPOS DE CLIENTES
# ======================================================

equipo_lista = EquipoClienteViewSet.as_view({
    'get': 'list',
    'post': 'create'
})

equipo_detalle = EquipoClienteViewSet.as_view({
    'get': 'retrieve'
})


# ======================================================
# ORDENES DE SERVICIO
# ======================================================

orden_lista = OrdenServicioViewSet.as_view({
    'get': 'list',
    'post': 'create'
})

orden_detalle = OrdenServicioViewSet.as_view({
    'get': 'retrieve'
})


# ======================================================
# HU-014: ASIGNACION DE TECNICOS
# ======================================================

tecnicos_disponibles = OrdenServicioViewSet.as_view({
    'get': 'tecnicos_disponibles'
})

orden_asignar_tecnico = OrdenServicioViewSet.as_view({
    'patch': 'asignar_tecnico'
})


# ======================================================
# CAMBIO DE ESTADO
# ======================================================

orden_cambiar_estado = OrdenServicioViewSet.as_view({
    'patch': 'cambiar_estado'
})


# ======================================================
# RUTAS DEL MODULO
# ======================================================

urlpatterns = [

    path(
        'equipos/',
        equipo_lista,
        name='equipo-lista'
    ),

    path(
        'equipos/<int:pk>/',
        equipo_detalle,
        name='equipo-detalle'
    ),

    path(
        'ordenes/',
        orden_lista,
        name='orden-lista'
    ),

    path(
        'ordenes/<int:pk>/',
        orden_detalle,
        name='orden-detalle'
    ),

    path(
        'tecnicos/disponibles/',
        tecnicos_disponibles,
        name='tecnicos-disponibles'
    ),

    path(
        'ordenes/<int:pk>/asignar-tecnico/',
        orden_asignar_tecnico,
        name='orden-asignar-tecnico'
    ),

    path(
        'ordenes/<int:pk>/cambiar-estado/',
        orden_cambiar_estado,
        name='orden-cambiar-estado'
    ),

]