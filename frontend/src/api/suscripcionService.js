import axiosClient from './axiosClient';

// Suscripciones que compró el cliente (las vencidas ya vienen marcadas)
export const obtenerSuscripciones = async () => {
    const { data } = await axiosClient.get('/suscripciones/');
    return data;
};

// Drones que el cliente compró y puede cubrir con un plan: [{ id, nombre }]
export const obtenerDronesCubribles = async () => {
    const { data } = await axiosClient.get('/suscripciones/drones/');
    return data;
};

// articuloId = null para quitar el dron cubierto
export const asignarDron = async (suscripcionId, articuloId) => {
    const { data } = await axiosClient.patch(`/suscripciones/${suscripcionId}/`, {
        articulo_cubierto: articuloId,
    });
    return data;
};

export const cancelarSuscripcion = async (suscripcionId) => {
    const { data } = await axiosClient.post(`/suscripciones/${suscripcionId}/cancelar/`);
    return data;
};
