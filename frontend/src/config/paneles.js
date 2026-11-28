import { PERMISOS } from './permisos';

export function obtenerPaneles(usuario) {
    if (!usuario || usuario.is_active !== true) {
        return [];
    }

    const roles = Array.isArray(usuario.roles)
        ? usuario.roles : [];

    const permisos = Array.isArray(usuario.permisos_efectivos)
        ? usuario.permisos_efectivos : [];

    const tieneRol = nombre => roles.includes(nombre);
    const tienePermiso = codigo => permisos.includes(codigo);

    const paneles = [];

    const esAdmin =
        tieneRol('Administrador') ||
        usuario.is_superuser === true;

    const destinosGestion = [
        [PERMISOS.CONSULTAR_USUARIOS, '/admin/usuarios'],
        [PERMISOS.CONSULTAR_ROLES, '/admin/roles'],
        [PERMISOS.CONSULTAR_REPARACIONES, '/admin/reparaciones']
    ];

    const gestion = destinosGestion.find(
        ([permiso]) => tienePermiso(permiso)
    );

    if (esAdmin || gestion) {
        paneles.push({
            id: 'admin',
            nombre: esAdmin ? 'Administración' : 'Gestión',
            base: '/admin',
            ruta: esAdmin ? '/admin' : gestion[1]
        });
    }

    const disponibles = [
        ['Tecnico', 'tecnico', 'Panel técnico'],
        ['Piloto', 'piloto', 'Panel piloto'],
        ['Cliente', 'cliente', 'Panel cliente']
    ];

    disponibles.forEach(([rol, id, nombre]) => {
        if (tieneRol(rol)) {
            paneles.push({
                id,
                nombre,
                base: '/' + id,
                ruta: '/' + id
            });
        }
    });

    return paneles;
}

export function obtenerDestinoInicial(usuario) {
    const paneles = obtenerPaneles(usuario);

    return paneles.length === 1
        ? paneles[0].ruta
        : '/seleccionar-panel';
}
