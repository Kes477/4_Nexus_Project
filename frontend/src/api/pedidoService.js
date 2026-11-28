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

// Descarga el PDF de la factura (solo pedidos pagados)
export const descargarFactura = async (id) => {
    const respuesta = await axiosClient.get(`/ventas/pedidos/${id}/factura/`, {
        responseType: 'blob',   
    });

    const url = URL.createObjectURL(respuesta.data);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `FAC-${String(id).padStart(6, '0')}.pdf`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
};