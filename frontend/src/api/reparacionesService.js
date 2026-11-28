import axiosClient from './axiosClient';

// ======================================================
// CONSULTA DE ORDENES
// ======================================================

export const obtenerOrdenes = async () => {

    const { data } = await axiosClient.get(
        '/reparaciones/ordenes/'
    );

    return data;
};


export const obtenerOrdenPorId = async (id) => {

    const { data } = await axiosClient.get(
        `/reparaciones/ordenes/${id}/`
    );

    return data;
};


// ======================================================
// GESTION DE EQUIPOS
// ======================================================

export const obtenerEquipos = async () => {

    const { data } = await axiosClient.get(
        '/reparaciones/equipos/'
    );

    return data;
};


export const registrarEquipo = async (equipo) => {

    const { data } = await axiosClient.post(
        '/reparaciones/equipos/',
        equipo
    );

    return data;
};


// ======================================================
// HU-012: SOLICITAR REPARACION
// ======================================================

export const solicitarReparacion = async (solicitud) => {

    const { data } = await axiosClient.post(
        '/reparaciones/ordenes/',
        {
            equipo: solicitud.equipo,
            descripcion_problema:
                solicitud.descripcion_problema.trim()
        }
    );

    return data;
};


// ======================================================
// HU-014: CONSULTAR TECNICOS DISPONIBLES
// ======================================================

export const obtenerTecnicosDisponibles = async () => {

    const { data } = await axiosClient.get(
        '/reparaciones/tecnicos/disponibles/'
    );

    return data;
};


// ======================================================
// HU-014: ASIGNAR TECNICO
// ======================================================

export const asignarTecnico = async (
    ordenId,
    tecnicoId
) => {

    const { data } = await axiosClient.patch(
        `/reparaciones/ordenes/${ordenId}/asignar-tecnico/`,
        {
            tecnico: Number(tecnicoId)
        }
    );

    return data;
};


// ======================================================
// HU-015: ACTUALIZAR ESTADO
// ======================================================

export const cambiarEstadoOrden = async (
    ordenId,
    nuevoEstado,
    observaciones = ''
) => {

    const { data } = await axiosClient.patch(
        `/reparaciones/ordenes/${ordenId}/cambiar-estado/`,
        {
            estado: nuevoEstado,
            observaciones: observaciones.trim()
        }
    );

    return data;
};

// ======================================================
// COTIZACION (genera el pedido que paga el cliente)
// ======================================================

export const cotizarOrden = async (ordenId, costo) => {

    const { data } = await axiosClient.post(
        `/reparaciones/ordenes/${ordenId}/cotizar/`,
        { costo }
    );

    return data;
};