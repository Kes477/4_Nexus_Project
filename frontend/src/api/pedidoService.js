import axiosClient from './axiosClient';

// Totales del carrito sin crear el pedido
export const resumenPedido = async (datos = {}) => {
    const { data } = await axiosClient.post('/ventas/pedidos/resumen/', datos);
    return data;
};

// Confirma la compra: { direccion, cupon }
export const confirmarPedido = async (datos) => {
    const { data } = await axiosClient.post('/ventas/pedidos/', datos);
    return data;
};

export const obtenerPedidos = async () => {
    const { data } = await axiosClient.get('/ventas/pedidos/');
    return data;
};

export const cancelarPedido = async (id) => {
    const { data } = await axiosClient.post(`/ventas/pedidos/${id}/cancelar/`);
    return data;
};