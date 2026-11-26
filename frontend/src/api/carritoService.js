import axiosClient from './axiosClient';

// Cada operación devuelve el carrito completo actualizado
export const obtenerCarrito = async () => {
    const { data } = await axiosClient.get('/ventas/carrito/');
    return data;
};

export const agregarAlCarrito = async (varianteId, cantidad = 1) => {
    const { data } = await axiosClient.post('/ventas/carrito/agregar/', {
        variante: varianteId,
        cantidad,
    });
    return data;
};

export const cambiarCantidad = async (detalleId, cantidad) => {
    const { data } = await axiosClient.patch(`/ventas/carrito/detalles/${detalleId}/`, { cantidad });
    return data;
};

export const quitarDelCarrito = async (detalleId) => {
    const { data } = await axiosClient.delete(`/ventas/carrito/detalles/${detalleId}/`);
    return data;
};

export const vaciarCarrito = async () => {
    const { data } = await axiosClient.delete('/ventas/carrito/');
    return data;
};