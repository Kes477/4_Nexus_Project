import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSesion } from '../../hooks/useSesion';
import { Loader } from '../ui';

export default function RutaProtegida({ rol }) {
    const { usuario, rol: rolActual, cargando } = useSesion();
    const location = useLocation();

    // Leemos el rol que forzamos en el Login
    const rolLocalStorage = localStorage.getItem('user_role');

    if (cargando) {
        return <Loader text="Verificando sesión..." />;
    }

    if (!usuario) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location.pathname, message: 'Inicia sesión para continuar.' }}
            />
        );
    }

    // Evaluamos el rol: si hay uno en localStorage, ese manda (para nuestra prueba)
    const rolEfectivo = rolLocalStorage || rolActual;

    if (rol && rolEfectivo !== rol) {
        // Si el rol no coincide, lo mandamos a su panel correspondiente
        let destino = '/cliente';
        if (rolEfectivo === 'admin') destino = '/admin';
        else if (rolEfectivo === 'piloto') destino = '/piloto';
        else if (rolEfectivo === 'tecnico') destino = '/tecnico';

        return <Navigate to={destino} replace />;
    }

    return <Outlet />;
}