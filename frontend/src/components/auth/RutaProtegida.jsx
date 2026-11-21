import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSesion } from '../../hooks/useSesion';
import { Loader } from '../ui';

export default function RutaProtegida({ rol }) {
    const { usuario, rol: rolActual, cargando } = useSesion();
    const location = useLocation();

    // 1. Recuperamos el rol guardado en localStorage
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

    // 2. Determinamos el rol efectivo (priorizando el de localStorage si existe)
    const rolEfectivo = rolLocalStorage || rolActual;

    // 3. Validamos si el usuario tiene permiso para entrar a esta ruta
    if (rol && rolEfectivo !== rol) {
        // 4. Redirigimos a su panel correspondiente según su rol efectivo
        let destino = '/cliente';
        
        if (rolEfectivo === 'admin') destino = '/admin';
        else if (rolEfectivo === 'piloto') destino = '/piloto';
        else if (rolEfectivo === 'tecnico') destino = '/tecnico';

        return <Navigate to={destino} replace />;
    }

    return <Outlet />;
}