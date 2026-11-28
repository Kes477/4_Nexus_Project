import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const API_URL = (
    import.meta.env.VITE_API_URL
    || 'http://localhost:8000/api'
).replace(/\/+$/, '');

const estiloInput = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    marginTop: '8px'
};

function obtenerError(datos) {

    if (datos?.detail) return String(datos.detail);

    if (datos && typeof datos === 'object') {

        return Object.values(datos)
            .flat()
            .join(' ');
    }

    return 'No se pudo activar la cuenta.';
}

export default function ActivarCuenta() {

    const [credenciales] = useState(() => {

        const parametros = new URLSearchParams(
            window.location.hash.slice(1)
        );

        return {
            uid: parametros.get('uid'),
            token: parametros.get('token')
        };
    });

    const [password, setPassword] = useState('');
    const [confirmacion, setConfirmacion] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [activada, setActivada] = useState(false);
    const [error, setError] = useState('');

    const enlaceValido =
        Boolean(credenciales.uid && credenciales.token);

    useEffect(() => {

        if (enlaceValido) {

            window.history.replaceState(
                window.history.state,
                '',
                window.location.pathname
            );

        }

    }, [enlaceValido]);

    async function activar(evento) {

        evento.preventDefault();

        if (guardando || !enlaceValido || activada) return;

        setError('');

        if (password.length < 8) {

            setError(
                'La contrase\u00f1a debe tener al menos 8 caracteres.'
            );

            return;
        }

        if (password !== confirmacion) {

            setError(
                'Las contrase\u00f1as no coinciden.'
            );

            return;
        }

        setGuardando(true);

        try {

            const respuesta = await fetch(
                API_URL + '/auth/activar/',
                {
                    method: 'POST',
                    credentials: 'omit',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        uid: credenciales.uid,
                        token: credenciales.token,
                        password,
                        confirmar_password: confirmacion
                    })
                }
            );

            const tipoContenido =
                respuesta.headers.get('content-type') || '';

            if (!tipoContenido.includes('application/json')) {
                throw new Error(
                    'Respuesta inesperada del servidor. HTTP '
                    + respuesta.status
                );
            }

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(obtenerError(datos));
            }

            setPassword('');
            setConfirmacion('');
            setActivada(true);

        } catch (error) {

            setError(
                error.message || 'Error de conexi\u00f3n.'
            );

        } finally {

            setGuardando(false);

        }
    }

    return (

        <main style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f4f7fa',
            padding: '20px',
            boxSizing: 'border-box'
        }}>

            <section style={{
                width: '100%',
                maxWidth: '450px',
                padding: '32px',
                borderRadius: '12px',
                backgroundColor: '#ffffff',
                color: '#29365e',
                boxSizing: 'border-box',
                boxShadow: '0 8px 30px rgba(0,0,0,0.08)'
            }}>

                <h2 style={{ marginBottom: '20px' }}>
                    4 NEXUS
                </h2>

                {activada ? (

                    <>

                        <h3>Cuenta activada correctamente</h3>

                        <p style={{ marginTop: '16px' }}>
                            Ya puede iniciar sesión
                            con su nueva contraseña.
                        </p>

                        <Link
                            to="/login"
                            style={{
                                display: 'block',
                                marginTop: '24px',
                                color: '#008f7a'
                            }}
                        >
                            {'Iniciar sesi\u00f3n'}
                        </Link>

                    </>

                ) : !enlaceValido ? (

                    <>

                        <h3>Enlace no disponible</h3>

                        <p style={{ marginTop: '16px' }}>
                            Abra nuevamente el enlace original
                            o solicite uno nuevo al administrador.
                        </p>

                    </>

                ) : (

                    <form onSubmit={activar}>

                        <h3>Activar cuenta</h3>

                        <p style={{ margin: '16px 0' }}>
                            {'Establezca la contrase\u00f1a de su cuenta.'}
                        </p>

                        {error && (

                            <p role="alert" style={{
                                color: '#dc2626',
                                marginBottom: '16px'
                            }}>
                                {error}
                            </p>

                        )}

                        <label>

                            {'Nueva contrase\u00f1a'}

                            <input
                                type="password"
                                autoComplete="new-password"
                                minLength={8}
                                maxLength={128}
                                required
                                disabled={guardando}
                                value={password}
                                onChange={e =>
                                    setPassword(e.target.value)
                                }
                                style={estiloInput}
                            />

                        </label>

                        <label style={{
                            display: 'block',
                            marginTop: '20px'
                        }}>

                            {'Confirmar contrase\u00f1a'}

                            <input
                                type="password"
                                autoComplete="new-password"
                                required
                                maxLength={128}
                                disabled={guardando}
                                value={confirmacion}
                                onChange={e =>
                                    setConfirmacion(e.target.value)
                                }
                                style={estiloInput}
                            />

                        </label>

                        <button
                            type="submit"
                            disabled={guardando}
                            style={{
                                width: '100%',
                                padding: '14px',
                                marginTop: '24px',
                                border: 'none',
                                borderRadius: '6px',
                                backgroundColor: '#00bfa6',
                                color: '#ffffff',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >

                            {guardando
                                ? 'Activando...'
                                : 'Activar cuenta'}

                        </button>

                    </form>

                )}

            </section>

        </main>

    );
}
