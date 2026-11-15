import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSesion } from '../../hooks/useSesion';
import { Loader } from '../ui';

export default function RutaProtegida({ rol }) {
    const { usuario, rol: rolActual, cargando } = useSesion();
    const location = useLocation();

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

    if (rol && rolActual !== rol) {
        return <Navigate to={rolActual === 'admin' ? '/admin' : '/cliente'} replace />;
    }

    return <Outlet />;
}