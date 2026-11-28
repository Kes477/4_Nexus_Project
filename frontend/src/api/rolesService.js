import axiosClient from './axiosClient';

const BASE = '/gestion';

export const listarRoles = async (filtros = {}, signal) => {
    const { data } = await axiosClient.get(
        `${BASE}/roles/`,
        { params: filtros, signal }
    );
    return data;
};

export const consultarRol = async (id) => {
    const { data } = await axiosClient.get(
        `${BASE}/roles/${id}/`
    );
    return data;
};

export const crearRol = async (nombre) => {
    const { data } = await axiosClient.post(
        `${BASE}/roles/`,
        { nombre }
    );
    return data;
};

export const editarRol = async (id, nombre) => {
    const { data } = await axiosClient.patch(
        `${BASE}/roles/${id}/`,
        { nombre }
    );
    return data;
};

export const eliminarRol = async (id) => {
    await axiosClient.delete(
        `${BASE}/roles/${id}/`
    );
};

export const listarPermisos = async (filtros = {}) => {
    const { data } = await axiosClient.get(
        `${BASE}/permisos/`,
        { params: filtros }
    );
    return data;
};

export const listarPermisosDelegables = async () => {
    const { data } = await axiosClient.get(
        `${BASE}/permisos/delegables/`
    );
    return data;
};

export const consultarPermisosRol = async (id) => {
    const { data } = await axiosClient.get(
        `${BASE}/roles/${id}/permisos/`
    );
    return data;
};

export const configurarPermisosRol = async (id, permisos) => {
    const { data } = await axiosClient.put(
        `${BASE}/roles/${id}/permisos/`,
        { permisos }
    );
    return data;
};
