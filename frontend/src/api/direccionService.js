import axiosClient from './axiosClient'

//ubicaciones públicas:departamentos, municipios
export const obtenerUbicaciones = async (filtros) => {
    const {data} = await axiosClient.get('/ubicaciones/', {params:filtros});
    return data;
};

export const obtenerUbicacion = async (id) => {
    const {data} = await axiosClient.get(`/ubicaciones/${id}/`);
    return data;
};

//Direcciones del cliente con sesión
export const obtenerDirecciones = async ()=>{
    const {data} = await axiosClient.get('/ubicaciones/direcciones/');
    return data;
};

export const crearDireccion = async (datos) => {
    const {data} = await axiosClient.post('/ubicaciones/direcciones/',datos);
    return data;
};

export const actualizarDireccion = async (id, cambios) => {
    const {data} = await axiosClient.patch(`/ubicaciones/direcciones/${id}/`,cambios);
    return data;
};

export const eliminarDireccion = async (id) => {
    await axiosClient.delete(`/ubicaciones/direcciones/${id}/`);
};