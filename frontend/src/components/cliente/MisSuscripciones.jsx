import { useEffect, useState } from 'react';
import { CalendarClock, Plane, ShieldCheck, Wrench } from 'lucide-react';

import { Alert, Badge, Button, Loader } from '../ui';
import {
    asignarDron,
    cancelarSuscripcion,
    obtenerDronesCubribles,
    obtenerSuscripciones,
} from '../../api/suscripcionService';
import { primerError } from '../../utils/errores';

const formatoLempiras = (valor) =>
    `L ${Number(valor).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatoFecha = (fecha) =>
    new Date(`${fecha}T00:00:00`).toLocaleDateString('es-HN', { day: 'numeric', month: 'short', year: 'numeric' });

const COLOR_ESTADO = {
    ACTIVA: 'success',
    PAUSADA: 'warning',
    CANCELADA: 'danger',
    VENCIDA: 'dark',
};

const tarjetaStyle = {
    background: 'var(--white)', border: '1px solid var(--light-gray)', borderRadius: '12px',
    padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px',
};
const datoStyle = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-light)' };
const selectStyle = {
    width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px',
    border: '1px solid var(--light-gray)', background: 'var(--bg-color)', color: 'var(--color-dark)',
};

/* =========================================================
   MIS SUSCRIPCIONES
   SOLID - SRP: solo muestra y gestiona las suscripciones del cliente.
   Comprar un plan es responsabilidad de CheckoutComprarAhora.
   ========================================================= */
export default function MisSuscripciones({ onVerPlanes }) {
    const [suscripciones, setSuscripciones] = useState([]);
    const [drones, setDrones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [ocupado, setOcupado] = useState(null);

    useEffect(() => {
        let activo = true;

        Promise.all([obtenerSuscripciones(), obtenerDronesCubribles()])
            .then(([lista, misDrones]) => {
                if (!activo) return;
                setSuscripciones(lista);
                setDrones(misDrones);
            })
            .catch((err) => activo && setError(primerError(err)))
            .finally(() => activo && setCargando(false));

        return () => { activo = false; };
    }, []);

    const reemplazar = (actualizada) => {
        setSuscripciones((lista) => lista.map((s) => (s.id === actualizada.id ? actualizada : s)));
    };

    // Envuelve cada acción: limpia el error, marca la tarjeta como ocupada y reemplaza el resultado
    const ejecutar = async (suscripcion, accion) => {
        setError(null);
        setOcupado(suscripcion.id);
        try {
            reemplazar(await accion());
        } catch (err) {
            setError(primerError(err));
        } finally {
            setOcupado(null);
        }
    };

    const cubrir = (suscripcion, valor) =>
        ejecutar(suscripcion, () => asignarDron(suscripcion.id, valor ? Number(valor) : null));

    const cancelar = (suscripcion) => {
        if (!window.confirm(`¿Cancelar tu ${suscripcion.plan_nombre}? Perderás la cobertura y los mantenimientos.`)) return;
        ejecutar(suscripcion, () => cancelarSuscripcion(suscripcion.id));
    };

    if (cargando) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <Loader text="Cargando tus suscripciones..." />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && <Alert type="danger" title="Atención" message={error} onClose={() => setError(null)} />}

            {suscripciones.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>
                    <ShieldCheck size={48} color="var(--light-gray)" />
                    <p style={{ margin: '16px 0' }}>Todavía no tienes suscripciones.</p>
                    <Button variant="primary" onClick={onVerPlanes}>Ver planes</Button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                    {suscripciones.map((s) => (
                        <div key={s.id} style={{ ...tarjetaStyle, opacity: s.puede_cancelar ? 1 : 0.75 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '17px', color: 'var(--color-dark)' }}>{s.plan_nombre}</h3>
                                    <small style={{ color: 'var(--text-light)' }}>
                                        {formatoLempiras(s.precio)} cada {s.periodo_dias} días · Pedido #{s.pedido}
                                    </small>
                                </div>
                                <Badge text={s.estado_texto} color={COLOR_ESTADO[s.estado] ?? 'dark'} />
                            </div>

                            <div style={datoStyle}>
                                <CalendarClock size={16} color="var(--color-primary)" />
                                <span>
                                    Vence el <strong>{formatoFecha(s.fecha_vencimiento)}</strong>
                                    {s.estado === 'ACTIVA' && ` (${s.dias_restantes} días)`}
                                </span>
                            </div>
                            <div style={datoStyle}>
                                <Wrench size={16} color="var(--color-primary)" />
                                <span>{s.mantenimientos_incluidos} mantenimiento(s) incluido(s)</span>
                            </div>
                            {s.nivel_cobertura && (
                                <div style={datoStyle}>
                                    <ShieldCheck size={16} color="var(--color-primary)" />
                                    <span>Cobertura: {s.nivel_cobertura}</span>
                                </div>
                            )}

                            {/* Dron cubierto: solo se puede elegir uno que el cliente compró */}
                            <div>
                                <label style={{ ...datoStyle, fontWeight: 'bold', color: 'var(--color-dark)', marginBottom: '6px' }}>
                                    <Plane size={16} color="var(--color-primary)" /> Dron cubierto
                                </label>
                                {s.puede_cancelar ? (
                                    drones.length > 0 ? (
                                        <select
                                            style={selectStyle}
                                            value={s.articulo_cubierto ?? ''}
                                            disabled={ocupado === s.id}
                                            onChange={(e) => cubrir(s, e.target.value)}
                                        >
                                            <option value="">Sin asignar</option>
                                            {drones.map((d) => (
                                                <option key={d.id} value={d.id}>{d.nombre}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <small style={{ color: 'var(--text-light)' }}>
                                            Cuando compres un dron podrás asignarlo a este plan.
                                        </small>
                                    )
                                ) : (
                                    <small style={{ color: 'var(--text-light)' }}>{s.articulo_texto ?? 'Ninguno'}</small>
                                )}
                            </div>

                            {s.puede_cancelar && (
                                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--light-gray)', paddingTop: '12px' }}>
                                    <Button variant="outline-dark" size="sm" disabled={ocupado === s.id} onClick={() => cancelar(s)}>
                                        Cancelar suscripción
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
