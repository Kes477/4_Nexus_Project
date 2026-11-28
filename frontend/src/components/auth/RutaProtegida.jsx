import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSesion } from '../../hooks/useSesion';
import { Loader, Button } from '../ui';
import { obtenerPaneles } from '../../config/paneles';

export default function RutaProtegida({
    rol,
    permiso,
    permisos = [],
    requiereTodos = false,
    rolOPermisos = false,
    children
}) {

    const {
        usuario,
        rol: rolActual,
        cargando,
        tieneRol,
        tienePermiso,
        tieneAlgunPermiso,
        tieneTodosLosPermisos
    } = useSesion();

    const location = useLocation();
    const navigate = useNavigate();
    const { cerrarSesion } = useSesion();

    if (cargando) {
        return <Loader text="Verificando sesión..." />;
    }

    if (!usuario) {

        return (
            <Navigate
                to="/login"
                replace
                state={{
                    from: location.pathname,
                    message: 'Inicia sesión para continuar.'
                }}
            />
        );
    }

    const rolesEquivalentes = {
        admin: 'Administrador',
        cliente: 'Cliente',
        tecnico: 'Tecnico',
        piloto: 'Piloto',
        vendedor: 'Vendedor'
    };

    const cuentaActiva = usuario.is_active === true;

    const nombreRol = rolesEquivalentes[rol] || rol;

    const cumpleRol = !rol || (
        tieneRol(nombreRol)
        || (
            usuario.is_superuser === true
            && rol === 'admin'
        )
    );

    const cumplePermiso =
        !permiso || tienePermiso(permiso);

    const cumpleLista =
        permisos.length === 0
        || (
            requiereTodos
                ? tieneTodosLosPermisos(permisos)
                : tieneAlgunPermiso(permisos)
        );

    const exigePermisos =
        Boolean(permiso) || permisos.length > 0;

    const cumplePermisos =
        cumplePermiso && cumpleLista;

    const autorizado = cuentaActiva && (
        rolOPermisos && rol && exigePermisos
            ? cumpleRol || cumplePermisos
            : cumpleRol && cumplePermisos
    );

    if (!autorizado) {

        const paneles = obtenerPaneles(usuario);

        function regresar() {
            if (!cuentaActiva || paneles.length === 0) {
                cerrarSesion();
                navigate('/login', {
                    replace: true,
                    state: {
                        message: 'No tienes acceso habilitado. Contacta al administrador.'
                    }
                });
                return;
            }

            navigate(
                paneles.length === 1
                    ? paneles[0].ruta
                    : '/seleccionar-panel',
                { replace: true }
            );
        }

        return (
            <main style={{
                minHeight: '45vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '30px'
            }}>
                <section role="alert" style={{
                    width: '100%',
                    maxWidth: '480px',
                    padding: '32px',
                    textAlign: 'center',
                    border: '1px solid var(--light-gray)',
                    borderRadius: '12px'
                }}>
                    <h2 style={{ marginBottom: '16px' }}>
                        Acceso restringido
                    </h2>

                    <p style={{ marginBottom: '24px' }}>
                        {cuentaActiva
                            ? 'No tienes permisos para acceder a esta funcionalidad.'
                            : 'Tu cuenta no se encuentra activa.'}
                    </p>

                    <Button
                        variant="primary"
                        onClick={regresar}
                    >
                        {cuentaActiva && paneles.length > 0
                            ? 'Volver a mis paneles'
                            : 'Volver al inicio de sesi\u00f3n'}
                    </Button>
                </section>
            </main>
        );
    }

    return children ?? <Outlet />;
}
