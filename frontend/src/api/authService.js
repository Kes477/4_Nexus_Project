import axiosClient from './axiosClient';

// Llama a LoginView en Django
export const loginUser = async (email, password) => {
    const {data} = await axiosClient.post('/auth/login/', { email, password });
      
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    return data.usuario;
};

// Llama a PerfilView en Django
export const getPerfil = async () => {
    const {data} = await axiosClient.get('/auth/perfil/');
    return data;
};

// Cerrar sesión
export const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
};

//LLama a Registro View en Django: crea el cliente y devuelve tokens
export const registerUser = async (datos) => {
    const {data} = await axiosClient.post('/auth/registro/',datos);

    localStorage.setItem('access_token',data.access);
    localStorage.setItem('refresh_token', data.refresh);
    return data.usuario;
}