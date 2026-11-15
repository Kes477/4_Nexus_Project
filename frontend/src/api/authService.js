import axiosClient from './axiosClient';

// Llama a LoginView en Django
export const loginUser = async (email, password) => {
    const response = await axiosClient.post('/usuarios/login/', { email, password });
    
    // Guardamos los tokens en el navegador
    if (response.data.access) {
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
    }
    return response.data;
};

// Llama a PerfilView en Django
export const getPerfil = async () => {
    const response = await axiosClient.get('/usuarios/perfil/');
    return response.data;
};

// Cerrar sesión
export const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
};