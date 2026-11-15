// src/api/droneService.js
import axiosClient from './axiosClient';

// Traer todos los drones (Productos)
export const getProductos = async () => {
    // Axios unirá la URL base (http://localhost:8000/api) + esta ruta
    const response = await axiosClient.get('/catalogo/productos/'); 
    return response.data;
};

// Traer las categorías de los drones
export const getCategorias = async () => {
    const response = await axiosClient.get('/catalogo/categorias/');
    return response.data;
};