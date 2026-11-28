import { useNavigate } from 'react-router-dom';
import { Shield, Wrench, Plane, User } from 'lucide-react';
import { useSesion } from '../hooks/useSesion';
import { obtenerPaneles } from '../config/paneles';

const iconos = {
    admin: Shield,
    tecnico: Wrench,
    piloto: Plane,
    cliente: User
};

export default function SeleccionarPanel() {
    const navigate = useNavigate();
    const { usuario, cerrarSesion } = useSesion();
    const paneles = obtenerPaneles(usuario);

    return (
        <main style={{
            minHeight: '100vh',
            background: 'var(--bg-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
        }}>
            <section style={{
                background: 'var(--white)',
                borderRadius: '16px',
                padding: '32px',
                width: '100%',
                maxWidth: '760px',
                color: 'var(--color-dark)'
            }}>
                <h2>4 NEXUS</h2>
                <h1>Seleccionar panel de trabajo</h1>
                <p>
                    Bienvenido, {usuario?.first_name}.
                    Selecciona el área en la que deseas trabajar.
                </p>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns:
                        'repeat(auto-fit, minmax(210px, 1fr))',
                    gap: '16px',
                    margin: '24px 0'
                }}>
                    {paneles.map(panel => {
                        const Icono = iconos[panel.id];

                        return (
                            <button
                                key={panel.id}
                                type="button"
                                onClick={() => navigate(panel.ruta)}
                                style={{
                                    background: 'var(--bg-color)',
                                    color: 'var(--color-dark)',
                                    border: '1px solid var(--light-gray)',
                                    borderRadius: '12px',
                                    padding: '28px 16px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '12px',
                                    fontWeight: 'bold'
                                }}
                            >
                                <Icono size={32} />
                                {panel.nombre}
                            </button>
                        );
                    })}
                </div>

                {paneles.length === 0 && (
                    <p>
                        No tienes paneles disponibles.
                        Contacta con el administrador.
                    </p>
                )}

                <button
                    type="button"
                    onClick={() => {
                        cerrarSesion();
                        navigate('/login', { replace: true });
                    }}
                    style={{
                        background: 'transparent',
                        color: 'var(--color-danger)',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    Cerrar sesión
                </button>
            </section>
        </main>
    );
}
