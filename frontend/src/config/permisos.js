export const PERMISOS = Object.freeze({

    CONSULTAR_USUARIOS: "usuarios.view_usuario",
    REGISTRAR_USUARIOS: "usuarios.add_usuario",
    EDITAR_USUARIOS: "usuarios.change_usuario",
    GESTIONAR_ESTADOS: "usuarios.gestionar_estado_usuario",

    CONSULTAR_ROLES: "auth.view_group",
    CREAR_ROLES: "auth.add_group",
    EDITAR_ROLES: "auth.change_group",
    ELIMINAR_ROLES: "auth.delete_group",

    CONSULTAR_PERMISOS: "auth.view_permission",
    CONFIGURAR_PERMISOS: "usuarios.configurar_permisos_rol",
    ASIGNAR_ROLES: "usuarios.asignar_roles_usuario",

    CONSULTAR_REPARACIONES: "reparaciones.view_ordenservicio",
    CREAR_REPARACIONES: "reparaciones.add_ordenservicio",
    EDITAR_REPARACIONES: "reparaciones.change_ordenservicio",

});

export const PERMISOS_PANEL_GESTION = Object.freeze([
    PERMISOS.CONSULTAR_USUARIOS,
    PERMISOS.CONSULTAR_ROLES,
    PERMISOS.CONSULTAR_REPARACIONES,
]);

export const PERMISOS_MENU_ADMIN = Object.freeze({

    usuarios: PERMISOS.CONSULTAR_USUARIOS,

    roles: PERMISOS.CONSULTAR_ROLES,

    reparaciones: PERMISOS.CONSULTAR_REPARACIONES,

});


// Etiquetas visibles de los permisos

export const ETIQUETAS_PERMISOS = Object.freeze({

    [PERMISOS.CONSULTAR_USUARIOS]:
        "Consultar usuarios",

    [PERMISOS.REGISTRAR_USUARIOS]:
        "Registrar usuarios",

    [PERMISOS.EDITAR_USUARIOS]:
        "Editar usuarios",

    [PERMISOS.GESTIONAR_ESTADOS]:
        "Gestionar estados de usuarios",

    [PERMISOS.CONSULTAR_ROLES]:
        "Consultar roles",

    [PERMISOS.CREAR_ROLES]:
        "Crear roles",

    [PERMISOS.EDITAR_ROLES]:
        "Editar roles",

    [PERMISOS.ELIMINAR_ROLES]:
        "Eliminar roles",

    [PERMISOS.CONSULTAR_PERMISOS]:
        "Consultar permisos",

    [PERMISOS.CONFIGURAR_PERMISOS]:
        "Configurar permisos de roles",

    [PERMISOS.ASIGNAR_ROLES]:
        "Asignar roles a usuarios",

    [PERMISOS.CONSULTAR_REPARACIONES]:
        "Consultar reparaciones",

    [PERMISOS.CREAR_REPARACIONES]:
        "Crear reparaciones",

    [PERMISOS.EDITAR_REPARACIONES]:
        "Editar reparaciones"

});

export function obtenerEtiquetaPermiso(permiso) {

    const codigo = typeof permiso === 'string'
        ? permiso
        : permiso?.codigo_completo;

    return ETIQUETAS_PERMISOS[codigo]
        || 'Permiso sin traducci\u00f3n';

}
