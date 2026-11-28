import axiosClient from './axiosClient';

const BASE = '/gestion';

export const listarUsuarios = async (filtros = {}, signal) => {
    const { data } = await axiosClient.get(
        `${BASE}/usuarios/`,
        { params: filtros, signal }
    );
    return data;
};

export const consultarUsuario = async (id) => {
    const { data } = await axiosClient.get(
        `${BASE}/usuarios/${id}/`
    );
    return data;
};

export const registrarEmpleado = async (datos) => {
    const { data } = await axiosClient.post(
        `${BASE}/empleados/registrar/`,
        datos
    );
    return data;
};

export const editarUsuario = async (id, cambios) => {
    const { data } = await axiosClient.patch(
        `${BASE}/usuarios/${id}/editar/`,
        cambios
    );
    return data;
};

export const cambiarEstadoUsuario = async (id, estado, motivo) => {
    const { data } = await axiosClient.patch(
        `${BASE}/usuarios/${id}/estado/`,
        {
            estado_cuenta: estado,
            motivo
        }
    );
    return data;
};

export const consultarRolesUsuario = async (id) => {
    const { data } = await axiosClient.get(
        `${BASE}/usuarios/${id}/roles/`
    );
    return data;
};

export const asignarRolesUsuario = async (id, roles) => {
    const { data } = await axiosClient.put(
        `${BASE}/usuarios/${id}/roles/`,
        { roles }
    );
    return data;
};

export const consultarPermisosUsuario = async (id) => {
    const { data } = await axiosClient.get(
        `${BASE}/usuarios/${id}/permisos/`
    );
    return data;
};

export const generarActivacion = async (id) => {
    const { data } = await axiosClient.post(
        `${BASE}/usuarios/${id}/activar/`
    );
    return data;
};

export const consultarPerfilEspecializado = async (id, tipo) => {
    const { data } = await axiosClient.get(
        `${BASE}/usuarios/${id}/perfiles/${tipo}/`
    );
    return data;
};

export const guardarPerfilEspecializado = async (id, tipo, datos) => {
    const { data } = await axiosClient.put(
        `${BASE}/usuarios/${id}/perfiles/${tipo}/`,
        datos
    );
    return data;
};
