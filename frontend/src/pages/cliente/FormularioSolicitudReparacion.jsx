import { useState } from 'react';
import { solicitarReparacion } from '../../api/reparacionesService';

export default function FormularioSolicitudReparacion({
    equipo,
    onCancelar,
    onSolicitudCreada
}) {
    const [descripcion, setDescripcion] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');

    const guardarSolicitud = async (event) => {
        event.preventDefault();

        if (guardando) return;

        setError('');

        if (!descripcion.trim()) {
            setError('La descripción del problema es obligatoria.');
            return;
        }

        setGuardando(true);

        try {
            const orden = await solicitarReparacion({
                equipo: equipo.id,
                descripcion_problema: descripcion.trim()
            });

            onSolicitudCreada(orden);

        } catch (err) {
            const datos = err.response?.data;

            const detalle =
                datos?.descripcion_problema ||
                datos?.equipo ||
                datos?.detail ||
                'No se pudo registrar la solicitud.';

            setError(
                Array.isArray(detalle)
                    ? detalle.join(' ')
                    : String(detalle)
            );

        } finally {
            setGuardando(false);
        }
    };

    const estiloBoton = {
        padding: '12px 20px',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        fontWeight: '600'
    };

    return (
        <section
            style={{
                border: '1px solid #94a3b8',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '28px'
            }}
        >
            <h2>Solicitar reparación</h2>

            <p>
                Describe el problema que presenta tu equipo.
            </p>

            <div
                style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: 'rgba(148, 163, 184, 0.1)',
                    margin: '20px 0'
                }}
            >
                <p>
                    <strong>Marca:</strong> {equipo.marca}
                </p>

                <p>
                    <strong>Modelo:</strong> {equipo.modelo}
                </p>

                <p>
                    <strong>Número de serie:</strong>{' '}
                    {equipo.numero_serie || 'No registrado'}
                </p>
            </div>

            <form onSubmit={guardarSolicitud} noValidate>

                <label htmlFor="descripcion-reparacion">
                    Descripción del problema *
                </label>

                <textarea
                    id="descripcion-reparacion"
                    value={descripcion}
                    onChange={(event) => {
                        setDescripcion(event.target.value);
                        setError('');
                    }}
                    disabled={guardando}
                    aria-invalid={Boolean(error)}
                    aria-describedby={
                        error ? 'error-reparacion' : undefined
                    }
                    rows={5}
                    placeholder="Describe la falla que presenta el equipo..."
                    style={{
                        width: '100%',
                        padding: '12px',
                        marginTop: '8px',
                        border: '1px solid #94a3b8',
                        borderRadius: '8px',
                        background: 'transparent',
                        color: 'inherit',
                        boxSizing: 'border-box',
                        resize: 'vertical'
                    }}
                />

                {error && (
                    <p
                        id="error-reparacion"
                        role="alert"
                        style={{
                            color: '#ef4444',
                            marginTop: '8px'
                        }}
                    >
                        {error}
                    </p>
                )}

                <div
                    style={{
                        display: 'flex',
                        gap: '12px',
                        marginTop: '20px',
                        flexWrap: 'wrap'
                    }}
                >
                    <button
                        type="submit"
                        disabled={guardando}
                        style={{
                            ...estiloBoton,
                            background: '#00c9a7',
                            color: '#ffffff',
                            opacity: guardando ? 0.6 : 1
                        }}
                    >
                        {guardando
                            ? 'Enviando solicitud...'
                            : 'Enviar solicitud'}
                    </button>

                    <button
                        type="button"
                        onClick={onCancelar}
                        disabled={guardando}
                        style={{
                            ...estiloBoton,
                            background: 'transparent',
                            color: 'inherit',
                            border: '1px solid #94a3b8'
                        }}
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </section>
    );
}