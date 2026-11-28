import axios from 'axios';

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para agregar el token a cada petición
axiosClient.interceptors.request.use((config) => {
    const ruta = (config.url || '').split('?')[0];

    const esPublica = [
        '/auth/login/',
        '/auth/registro/'
    ].includes(ruta);

    if (esPublica) {
        delete config.headers.Authorization;
        return config;
    }

    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default axiosClient;