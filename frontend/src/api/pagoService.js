import axiosClient from './axiosClient';

// Formas de pago disponibles (salen del registro de estrategias del backend)
export const obtenerFormasPago = async () => {
    const { data } = await axiosClient.get('/ventas/formas-pago/');
    return data;
};

// Tarjetas guardadas del cliente
export const obtenerTarjetas = async () => {
    const { data } = await axiosClient.get('/ventas/metodos-pago/');
    return data;
};

// Solo recibe datos ya tokenizados: nunca el número completo ni el CVV
export const guardarTarjeta = async (tarjeta) => {
    const { data } = await axiosClient.post('/ventas/metodos-pago/', tarjeta);
    return data;
};

export const eliminarTarjeta = async (id) => {
    await axiosClient.delete(`/ventas/metodos-pago/${id}/`);
};

// Paga un pedido: { forma_pago, metodo_pago? } → { pago, pedido }
export const pagarPedido = async (pedidoId, datos) => {
    const { data } = await axiosClient.post(`/ventas/pedidos/${pedidoId}/pagar/`, datos);
    return data;
};