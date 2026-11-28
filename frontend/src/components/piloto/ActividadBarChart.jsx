import { useState, useMemo } from 'react';
import { Activity, BarChart3 } from 'lucide-react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts';

/* ===== Helpers de tiempo ===== */
const PERIODOS = [
    { key: 'semana', label: 'Semana' },
    { key: 'mes', label: 'Mes' },
    { key: 'año', label: 'Año' },
];

const DIAS_ABREV = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DIAS_COMPLETO = {
    Dom: 'Domingo', Lun: 'Lunes', Mar: 'Martes', Mié: 'Miércoles',
    Jue: 'Jueves', Vie: 'Viernes', Sáb: 'Sábado',
};
const MESES_ABREV = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MESES_COMPLETO = {
    Ene: 'Enero', Feb: 'Febrero', Mar: 'Marzo', Abr: 'Abril',
    May: 'Mayo', Jun: 'Junio', Jul: 'Julio', Ago: 'Agosto',
    Sep: 'Septiembre', Oct: 'Octubre', Nov: 'Noviembre', Dic: 'Diciembre',
};

const getHoras = (m) => {
    if (!m.fecha_cierre || !m.fecha_creacion) return 0;
    const diff = (new Date(m.fecha_cierre) - new Date(m.fecha_creacion)) / 3600000;
    return diff > 0 ? diff : 0;
};

/* ===== Helpers del eje Y ===== */
const niceStep = (raw) => {
    if (!Number.isFinite(raw) || raw <= 0) return 1;
    const exp = Math.floor(Math.log10(raw));
    const base = Math.pow(10, exp);
    const norm = raw / base;
    let nice;
    if (norm <= 1) nice = 1;
    else if (norm <= 2) nice = 2;
    else if (norm <= 2.5) nice = 2.5;
    else if (norm <= 5) nice = 5;
    else nice = 10;
    return nice * base;
};

const calcularYTicks = (maxVal, isInteger = false) => {
    if (!Number.isFinite(maxVal) || maxVal <= 0) return [0, 1, 2, 3, 4];

    let step = niceStep(maxVal / 4);
    if (isInteger) step = Math.max(1, Math.ceil(step));

    let ticks;
    let attempts = 0;
    while (attempts < 6) {
        ticks = [0];
        let v = step;
        while (v < maxVal - 1e-9) {
            ticks.push(Number(v.toFixed(4)));
            v += step;
        }
        ticks.push(Number(v.toFixed(4)));
        if (ticks.length >= 5) break;

        if (isInteger) {
            if (step <= 1) break;
            step = Math.max(1, step - 1);
        } else {
            const next = niceStep(step / 2);
            if (next === step || next === 0) break;
            step = next;
        }
        attempts++;
    }

    if (isInteger && ticks.length < 5) {
        const newStep = Math.max(1, Math.ceil(maxVal / 4));
        ticks = [0, newStep, newStep * 2, newStep * 3, newStep * 4];
        while (ticks[ticks.length - 1] < maxVal) {
            ticks.push(ticks[ticks.length - 1] + newStep);
        }
    }

    return ticks;
};

/* ===== Descripción contextual para el tooltip ===== */
const getDescripcion = (periodo, bucket) => {
    const hoy = new Date();
    const esActual = hoy >= bucket.start && hoy <= bucket.end;
    if (periodo === 'semana') {
        const dia = DIAS_COMPLETO[bucket.label] || bucket.label;
        return esActual ? `${dia} (hoy)` : dia;
    }
    if (periodo === 'mes') {
        if (esActual) return 'Semana actual';
        const n = String(bucket.label).match(/\d+/)?.[0] || '';
        return `Hace ${n} semana${n !== '1' ? 's' : ''}`;
    }
    return `Mes de ${MESES_COMPLETO[bucket.label] || bucket.label}`;
};

/* ===== Construcción de buckets ===== */
const construirActividadBuckets = ({ periodo, mainMode, completadas, categoriaActiva }) => {
    const hoy = new Date();
    const buckets = [];

    if (periodo === 'semana') {
        for (let i = 6; i >= 0; i--) {
            const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - i);
            buckets.push({
                key: d.toISOString().slice(0, 10),
                label: DIAS_ABREV[d.getDay()],
                start: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0),
                end: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999),
                valor: 0,
            });
        }
    } else if (periodo === 'mes') {
        for (let i = 3; i >= 0; i--) {
            const end = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - i * 7, 23, 59, 59, 999);
            const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 6, 0, 0, 0, 0);
            buckets.push({
                key: `w-${i}`,
                label: i === 0 ? 'Actual' : `Sem -${i}`,
                start,
                end,
                valor: 0,
            });
        }
    } else {
        for (let i = 11; i >= 0; i--) {
            const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
            buckets.push({
                key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
                label: MESES_ABREV[d.getMonth()],
                start: new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0),
                end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),
                valor: 0,
            });
        }
    }

    const enBucket = (fecha) => {
        for (const b of buckets) {
            if (fecha >= b.start && fecha <= b.end) return b;
        }
        return null;
    };

    const coincideCat = (item) =>
        !categoriaActiva || !item.categoria || item.categoria === categoriaActiva;

    for (const m of completadas) {
        if (!m.fecha_cierre) continue;
        if (!coincideCat(m)) continue;
        const b = enBucket(new Date(m.fecha_cierre));
        if (!b) continue;
        b.valor += mainMode === 'PERSONAL' ? getHoras(m) : 1;
    }

    return buckets.map((b) => ({
        label: b.label,
        valor: mainMode === 'PERSONAL' ? Number(b.valor.toFixed(2)) : Math.round(b.valor),
        descripcion: getDescripcion(periodo, b),
    }));
};

const fmtTotal = (valor, mainMode) =>
    mainMode === 'PERSONAL'
        ? `${Number(valor).toFixed(1)} h`
        : `${Math.round(valor)} servicio${Math.round(valor) !== 1 ? 's' : ''}`;

/* ===== Tooltip ===== */
const TooltipActividad = ({ active, payload, unidad }) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0].payload;
    const valor = payload[0].value;
    return (
        <div style={{
            background: 'var(--white)',
            border: '1px solid var(--light-gray)',
            borderRadius: '8px',
            padding: '10px 14px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
            fontSize: '12px',
        }}>
            <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: 'var(--color-dark)' }}>
                {item.descripcion}
            </p>
            <p style={{ margin: 0, color: '#04c9a6', fontWeight: '600' }}>
                {unidad}: {typeof valor === 'number' ? valor.toLocaleString() : valor}
            </p>
        </div>
    );
};

/* ===== Componente principal ===== */
export default function ActividadBarChart({ completadas, mainMode, categoriaActiva }) {
    const [periodo, setPeriodo] = useState('mes');
    const unidad = mainMode === 'PERSONAL' ? 'Horas' : 'Servicios';

    const data = useMemo(
        () => construirActividadBuckets({ periodo, mainMode, completadas, categoriaActiva }),
        [periodo, mainMode, completadas, categoriaActiva]
    );

    const ticks = useMemo(() => {
        const maxVal = Math.max(...data.map((d) => d.valor), 0);
        return calcularYTicks(maxVal, mainMode !== 'PERSONAL');
    }, [data, mainMode]);

    const totalPeriodo = useMemo(() => data.reduce((s, d) => s + d.valor, 0), [data]);
    const sinDatos = data.every((d) => d.valor === 0);

    return (
        <div style={{
            background: 'var(--white)',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid var(--light-gray)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '12px',
                marginBottom: '16px',
                flexWrap: 'wrap',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        background: '#04c9a61a',
                        color: '#04c9a6',
                        padding: '8px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Activity size={18} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, color: 'var(--color-dark)', fontSize: '14px', fontWeight: '700' }}>
                            Actividad de vuelo · {unidad}
                        </h3>
                        <span style={{ color: 'var(--text-light)', fontSize: '11px' }}>
                            Eje Y: {unidad} · Total: {fmtTotal(totalPeriodo, mainMode)}
                        </span>
                    </div>
                </div>
                <div style={{
                    display: 'flex',
                    border: '1px solid var(--light-gray)',
                    borderRadius: '6px',
                    overflow: 'hidden',
                }}>
                    {PERIODOS.map((p) => (
                        <button
                            key={p.key}
                            onClick={() => setPeriodo(p.key)}
                            style={{
                                padding: '6px 14px',
                                fontSize: '12px',
                                fontWeight: '600',
                                border: 'none',
                                cursor: 'pointer',
                                background: periodo === p.key ? 'var(--color-primary)' : 'transparent',
                                color: periodo === p.key ? 'var(--white)' : 'var(--color-dark)',
                                borderRight: p.key !== 'año' ? '1px solid var(--light-gray)' : 'none',
                                transition: 'all 0.2s',
                            }}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {sinDatos ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-light)' }}>
                    <BarChart3 size={40} color="var(--light-gray)" style={{ marginBottom: '10px' }} />
                    <p style={{ fontSize: '14px', margin: 0 }}>
                        Sin registros para el periodo "{PERIODOS.find((p) => p.key === periodo)?.label}"
                    </p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                        <YAxis
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            domain={[0, ticks[ticks.length - 1]]}
                            ticks={ticks}
                        />
                        <Tooltip content={<TooltipActividad unidad={unidad} />} />
                        <Bar dataKey="valor" name={unidad} fill="#04c9a6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}