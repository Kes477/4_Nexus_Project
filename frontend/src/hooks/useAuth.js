import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, logout } from '../api/authService';

export const useAuth = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const data = await loginUser(email, password);
            // Si el login es exitoso, redirigimos al catálogo o dashboard
            navigate('/'); 
            return data;
        } catch (err) {
            // Capturamos el error que manda Django
            if (err.response && err.response.status === 401) {
                setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
            } else {
                setError("Error de conexión con el servidor.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return { handleLogin, handleLogout, loading, error, setError };
};