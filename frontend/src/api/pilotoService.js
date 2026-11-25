import axiosClient from './axiosClient';

export const getMisiones = async (tipoMision) => {
    const url = tipoMision 
        ? `/pilotos/misiones/?tipo_mision=${tipoMision}`
        : `/pilotos/misiones/`;
        
    const response = await axiosClient.get(url);
    return response.data; 
};

export const cambiarEstadoMision = async (misionId, nuevoEstado) => {
    const url = `/pilotos/misiones/${misionId}/cambiar_estado/`;
    
    try {
        const response = await axiosClient.patch(url, { estado: nuevoEstado });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.detail || 'Error al cambiar el estado de la misión');
    }
};