import axiosClient from './axiosClient';

// Consultar las órdenes visibles para el usuario autenticado
export const obtenerOrdenes = async () => {
    const { data } = await axiosClient.get('/reparaciones/ordenes/');
    return data;
};

// Consultar el detalle de una orden
export const obtenerOrdenPorId = async (id) => {
    const { data } = await axiosClient.get(`/reparaciones/ordenes/${id}/`);
    return data;
};

// Consultar los equipos registrados
export const obtenerEquipos = async () => {
    const { data } = await axiosClient.get('/reparaciones/equipos/');
    return data;
};
export const registrarEquipo = async (equipo) => {
  const { data } = await axiosClient.post('/reparaciones/equipos/',equipo);
    return data;
};