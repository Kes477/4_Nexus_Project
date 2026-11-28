import { CheckCircle, X } from 'lucide-react';
import CotizacionReparacion from '../../components/cliente/CotizacionReparacion';
// ======================================================
// ESTADOS DEL PROCESO DE REPARACIÓN
// ======================================================

const ETAPAS = [
    { codigo: 'RECIBIDA', nombre: 'Recibida' },
    { codigo: 'EN_DIAGNOSTICO', nombre: 'En diagnóstico' },
    { codigo: 'EN_REPARACION', nombre: 'En reparación' },
    { codigo: 'FINALIZADA', nombre: 'Finalizada' },
    { codigo: 'ENTREGADA', nombre: 'Entregada' }
];

// ======================================================
// FUNCIONES AUXILIARES
// ======================================================

export function formatearFecha(fecha) {
    if (!fecha) return 'No registrada';

    const valor = new Date(fecha);

    if (Number.isNaN(valor.getTime())) {
        return 'Fecha no disponible';
    }

    return valor.toLocaleString('es-HN', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'America/Tegucigalpa'
    });
}

export function nombreEquipo(orden) {
    const equipo = orden.equipo_detalle;

    return equipo
        ? `${equipo.marca} ${equipo.modelo}`
        : `Equipo #${orden.equipo}`;
}

// ======================================================
// COMPONENTE DE PROGRESO
// ======================================================

function ProgresoReparacion({ estado }) {

    if (estado === 'CANCELADA') {
        return (
            <p style={{ color: '#ef4444' }}>
                Esta orden de reparación fue cancelada.
            </p>
        );
    }

    const posicionActual = ETAPAS.findIndex(
        etapa => etapa.codigo === estado
    );

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns:
                    'repeat(auto-fit, minmax(110px, 1fr))',
                gap: '16px',
                margin: '24px 0'
            }}
        >
            {ETAPAS.map((etapa, indice) => {

                const completada = indice < posicionActual;
                const actual = indice === posicionActual;

                return (
                    <div
                        key={etapa.codigo}
                        style={{
                            textAlign: 'center'
                        }}
                    >
                        <div
                            style={{
                                width: '36px',
                                height: '36px',
                                margin: '0 auto 10px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background:
                                    completada || actual
                                        ? '#00c9a7'
                                        : '#64748b',
                                color: '#ffffff'
                            }}
                        >
                            {completada
                                ? <CheckCircle size={20} />
                                : indice + 1}
                        </div>

                        <span
                            style={{
                                fontSize: '13px',
                                fontWeight: actual ? 700 : 400
                            }}
                        >
                            {etapa.nombre}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

// ======================================================
// DETALLE DE REPARACIÓN
// ======================================================

export default function DetalleReparacion({
    orden,
    onCerrar
}) {

    if (!orden) return null;

    const estiloSeccion = {
        border: '1px solid var(--light-gray)',
        borderRadius: '8px',
        padding: '16px',
        marginTop: '16px'
    };

    return (
        <section
            style={{
                background: 'var(--white)',
                border: '1px solid var(--light-gray)',
                borderRadius: '12px',
                padding: '24px',
                marginTop: '24px'
            }}
        >
            <header
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px'
                }}
            >
                <h2>Orden de servicio #{orden.id}</h2>

                <button
                    type="button"
                    onClick={onCerrar}
                    aria-label="Cerrar detalle"
                    style={{
                        background: 'transparent',
                        color: 'inherit',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    <X size={24} />
                </button>
            </header>

            <ProgresoReparacion estado={orden.estado} />
            <CotizacionReparacion orden={orden} modo="cliente" />


            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns:
                        'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '16px'
                }}
            >
                <div style={estiloSeccion}>
                    <strong>Equipo</strong>
                    <p>{nombreEquipo(orden)}</p>
                </div>

                <div style={estiloSeccion}>
                    <strong>Número de serie</strong>
                    <p>
                        {orden.equipo_detalle?.numero_serie
                            || 'No registrado'}
                    </p>
                </div>

                <div style={estiloSeccion}>
                    <strong>Estado actual</strong>
                    <p>
                        {orden.estado_nombre || orden.estado}
                    </p>
                </div>

                <div style={estiloSeccion}>
                    <strong>Técnico asignado</strong>
                    <p>
                        {orden.tecnico_nombre
                            || 'Pendiente de asignación'}
                    </p>
                </div>

                <div style={estiloSeccion}>
                    <strong>Fecha de recepción</strong>
                    <p>
                        {formatearFecha(orden.fecha_recepcion)}
                    </p>
                </div>

                <div style={estiloSeccion}>
                    <strong>Fecha de cierre</strong>
                    <p>
                        {formatearFecha(orden.fecha_cierre)}
                    </p>
                </div>
            </div>

            <div style={estiloSeccion}>
                <h3>Descripción del problema</h3>

                <p style={{
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere'
                }}>
                    {orden.descripcion_problema}
                </p>
            </div>

            <div style={estiloSeccion}>
                <h3>Observaciones del servicio</h3>

                <p style={{
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere'
                }}>
                    {orden.observaciones
                        || 'Todavía no existen observaciones.'}
                </p>
            </div>
        </section>
    );
}