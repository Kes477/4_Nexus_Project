import { useState } from 'react';

import {
    CheckCircle,
    XCircle,
    ClipboardCheck
} from 'lucide-react';

import {
    cambiarEstadoOrden
} from '../../api/reparacionesService';

// ======================================================
// TRANSICIONES ADMINISTRATIVAS
// ======================================================

const TRANSICIONES = {
    RECIBIDA: ['CANCELADA'],
    EN_DIAGNOSTICO: ['CANCELADA'],
    EN_REPARACION: ['CANCELADA'],
    FINALIZADA: ['ENTREGADA', 'CANCELADA'],
    ENTREGADA: [],
    CANCELADA: []
};

const NOMBRES = {
    ENTREGADA: 'Entregada',
    CANCELADA: 'Cancelada'
};

// ======================================================
// ESTILOS
// ======================================================

const estiloCampo = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid var(--light-gray)',
    background: 'var(--white)',
    color: 'inherit',
    boxSizing: 'border-box'
};

const estiloBoton = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 20px',
    borderRadius: '8px',
    border: 'none',
    color: '#ffffff',
    fontWeight: 600,
    cursor: 'pointer'
};

// ======================================================
// COMPONENTE PRINCIPAL
// ======================================================

export default function CerrarOrdenServicio({
    orden,
    onActualizada,
    onOcupado,
    bloqueado = false
}) {

    const [nuevoEstado, setNuevoEstado] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');

    const transicionesPermitidas =
        TRANSICIONES[orden.estado] || [];

    // ==================================================
    // ACTUALIZAR ESTADO ADMINISTRATIVO
    // ==================================================

    const cerrarOrden = async (evento) => {

        evento.preventDefault();

        if (guardando || bloqueado) return;

        setError('');

        if (!transicionesPermitidas.includes(nuevoEstado)) {

            setError(
                'Selecciona una operación administrativa válida.'
            );

            return;
        }

        const accion = nuevoEstado === 'ENTREGADA'
            ? 'entregar'
            : 'cancelar';

        const confirmado = window.confirm(
            `¿Confirmas que deseas ${accion} la orden #${orden.id}? `
            + 'Esta operación cerrará definitivamente la orden.'
        );

        if (!confirmado) return;

        setGuardando(true);
        onOcupado?.(true);

        try {

            const ordenActualizada = await cambiarEstadoOrden(
                orden.id,
                nuevoEstado,
                observaciones
            );

            setNuevoEstado('');
            setObservaciones('');

            onActualizada(ordenActualizada);

        } catch (err) {

            const datos = err.response?.data;

            const detalle =
                datos?.detail ||
                datos?.estado ||
                datos?.observaciones ||
                'No se pudo cerrar la orden de servicio.';

            setError(
                Array.isArray(detalle)
                    ? detalle.join(' ')
                    : typeof detalle === 'object'
                        ? JSON.stringify(detalle)
                        : String(detalle)
            );

        } finally {

            setGuardando(false);
            onOcupado?.(false);
        }
    };

    // ==================================================
    // ORDEN CERRADA
    // ==================================================

    if (transicionesPermitidas.length === 0) {

        return (
            <section
                style={{
                    padding: '20px',
                    marginTop: '24px',
                    borderRadius: '8px',
                    border: '1px solid var(--light-gray)'
                }}
            >
                <h3>Cierre administrativo</h3>

                <p style={{
                    color: orden.estado === 'CANCELADA'
                        ? '#ef4444'
                        : '#00c9a7'
                }}>
                    {orden.estado === 'ENTREGADA'
                        ? 'Esta orden fue entregada al cliente.'
                        : orden.estado === 'CANCELADA'
                            ? 'Esta orden fue cancelada.'
                            : 'No existen operaciones disponibles.'}
                </p>

                <p>
                    No se permiten nuevas transiciones
                    administrativas desde este estado.
                </p>

            </section>
        );
    }

    // ==================================================
    // FORMULARIO ADMINISTRATIVO
    // ==================================================

    return (

        <section
            style={{
                padding: '24px',
                marginTop: '24px',
                borderRadius: '12px',
                border: '1px solid var(--light-gray)'
            }}
        >

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '16px'
                }}
            >
                <ClipboardCheck
                    size={24}
                    color="#00c9a7"
                />

                <h3>Cierre administrativo</h3>

            </div>

            <p>
                Gestiona la entrega o cancelación de
                esta orden de servicio.
            </p>

            <form onSubmit={cerrarOrden}>

                {/* OPERACION ADMINISTRATIVA */}

                <div style={{ marginTop: '20px' }}>

                    <label htmlFor="estado-administrativo">
                        Operación administrativa
                    </label>

                    <select
                        id="estado-administrativo"
                        value={nuevoEstado}
                        disabled={guardando || bloqueado}
                        onChange={evento => {
                            setNuevoEstado(evento.target.value);
                            setError('');
                        }}
                        style={{
                            ...estiloCampo,
                            marginTop: '8px'
                        }}
                    >

                        <option value="">
                            Selecciona una operación
                        </option>

                        {transicionesPermitidas.map(estado => (

                            <option
                                key={estado}
                                value={estado}
                            >
                                {NOMBRES[estado]}
                            </option>

                        ))}

                    </select>

                </div>

                {/* OBSERVACIONES ADMINISTRATIVAS */}

                <div style={{ marginTop: '20px' }}>

                    <label htmlFor="observaciones-administrativas">
                        Observaciones administrativas (opcional)
                    </label>

                    <textarea
                        id="observaciones-administrativas"
                        value={observaciones}
                        disabled={guardando || bloqueado}
                        onChange={evento =>
                            setObservaciones(evento.target.value)
                        }
                        rows={4}
                        maxLength={5000}
                        placeholder="Registra información sobre la entrega o cancelación..."
                        style={{
                            ...estiloCampo,
                            marginTop: '8px',
                            resize: 'vertical'
                        }}
                    />

                    <small>
                        {observaciones.length}/5000 caracteres.
                        Estas observaciones serán visibles
                        para el cliente.
                    </small>

                </div>

                {/* MENSAJE DE ERROR */}

                {error && (

                    <p
                        role="alert"
                        style={{
                            color: '#ef4444',
                            marginTop: '12px'
                        }}
                    >
                        {error}
                    </p>

                )}

                {/* BOTON DE CONFIRMACION */}

                <button
                    type="submit"
                    disabled={
                        guardando ||
                        bloqueado ||
                        !nuevoEstado
                    }
                    style={{
                        ...estiloBoton,
                        marginTop: '20px',
                        background:
                            nuevoEstado === 'CANCELADA'
                                ? '#dc2626'
                                : '#00c9a7',
                        opacity:
                            guardando ||
                            bloqueado ||
                            !nuevoEstado
                                ? 0.5
                                : 1
                    }}
                >

                    {nuevoEstado === 'CANCELADA'
                        ? <XCircle size={18} />
                        : <CheckCircle size={18} />}

                    {guardando
                        ? 'Procesando...'
                        : nuevoEstado === 'ENTREGADA'
                            ? 'Confirmar entrega'
                            : nuevoEstado === 'CANCELADA'
                                ? 'Confirmar cancelación'
                                : 'Confirmar operación'}

                </button>

            </form>

        </section>
    );
}