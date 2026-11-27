// src/api/droneService.js
import axiosClient from './axiosClient';

// Traer todos los drones (Productos)
export const getProductos = async () => {
    // Axios unirá la URL base (http://localhost:8000/api)
    const response = await axiosClient.get('/catalogo/productos/'); 
    return response.data;
};

// Traer las categorías de los drones
export const getCategorias = async () => {
    const response = await axiosClient.get('/catalogo/categorias/');
    return response.data;
};

// Detalle de un producto, con sus variantes (SKU, precio, disponibilidad)
export const getProducto = async (id) => {
    const response = await axiosClient.get(`/catalogo/productos/${id}/`);
    return response.data;
};

// Productos marcados para la landing (mostrar_en_landing=True)
export const getProductosLanding = async (limit = 10) => {
    const response = await axiosClient.get('/catalogo/productos/landing/', {
        params: { limit },
    });
    return response.data;
};