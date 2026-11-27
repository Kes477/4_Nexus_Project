import { useState, useEffect, useMemo } from 'react';
import { SectionHeading } from '../../components/ui';
import { Camera, Home, Zap, Video, Compass, Sprout, Factory, Film, Mountain, Eye, Clock, Map, Rocket, DollarSign, FileCheck, Timer, Star, Drone, BarChart3, PieChart as PieIcon, TrendingUp, } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, } from 'recharts';
import ActividadBarChart from '../../components/piloto/ActividadBarChart';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const getToken = () => localStorage.getItem('access_token');

const authFetch = async (path) => {
    const res = await fetch(`${API_URL}${path}`, {
        headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
        },
    });
    if (!res.ok) return null;
    return res.json();
};

const ICONOS_CATEGORIA = {
    fotografia: Camera,
    inspeccion_hogar: Home,
    carreras_fpv: Zap,
    videografia: Video,
    exploracion: Compass,
    agronomia: Sprout,
    inspeccion_industrial: Factory,
    audiovisual_pro: Film,
    topografia: Mountain,
    vigilancia: Eye,
    fumigacion: Sprout,
    agricultura: Sprout,
    seguridad: Eye,
};

const iconoDe = (id) => ICONOS_CATEGORIA[id] || Drone;

const formatearCategoria = (id) => {
    if (!id) return '';
    return id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const COLORES = ['#04c9a6', '#2dd2f6', '#f1be26', '#f02558', '#2c365e'];

const getHoras = (m) => {
    if (!m.fecha_cierre || !m.fecha_creacion) return 0;
    const diff = (new Date(m.fecha_cierre) - new Date(m.fecha_creacion)) / 3600000;
    return diff > 0 ? diff : 0;
};

const MESES_ABREV = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const generarUltimosMeses = (cantidad = 6) => {
    const hoy = new Date();
    const meses = [];
    for (let i = cantidad - 1; i >= 0; i--) {
        const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
        meses.push({
            key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
            label: MESES_ABREV[d.getMonth()],
        });
    }
    return meses;
};

const TooltipPersonalizado = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;
    return (
        <div style={{
            background: 'var(--white)',
            border: '1px solid var(--light-gray)',
            borderRadius: '8px',
            padding: '10px 14px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
            fontSize: '12px',
        }}>
            {label && (
                <p style={{ margin: '0 0 6px 0', fontWeight: 'bold', color: 'var(--color-dark)' }}>
                    {label}
                </p>
            )}
            {payload.map((item, idx) => (
                <p key={idx} style={{ margin: 0, color: item.color || item.fill, fontWeight: '600' }}>
                    {item.name}: {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                </p>
            ))}
        </div>
    );
};

const ChartCard = ({ icono: Icono, titulo, subtitulo, children, color = '#04c9a6' }) => (
    <div style={{
        background: 'var(--white)',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid var(--light-gray)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{
                background: `${color}1a`,
                color,
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <Icono size={18} />
            </div>
            <div>
                <h3 style={{ margin: 0, color: 'var(--color-dark)', fontSize: '14px', fontWeight: '700' }}>
                    {titulo}
                </h3>
                {subtitulo && (
                    <span style={{ color: 'var(--text-light)', fontSize: '11px' }}>{subtitulo}</span>
                )}
            </div>
        </div>
        {children}
    </div>
);

export default function PilotoDashboard() {
    const [mainMode, setMainMode] = useState('PERSONAL');
    const [categoriaActiva, setCategoriaActiva] = useState(null);
    const [resumen, setResumen] = useState({ modo: 'PERSONAL', categorias: [] });
    const [misiones, setMisiones] = useState([]);
    const [facturacion, setFacturacion] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const cargar = async () => {
            setCargando(true);
            const data = await authFetch(`/pilotos/misiones/resumen/?modo=${mainMode}`);
            if (!isMounted) return;
            if (data) {
                setResumen(data);
                setCategoriaActiva(data.categorias?.[0]?.id || null);
            } else {
                setResumen({ modo: mainMode, categorias: [] });
                setCategoriaActiva(null);
            }
            setCargando(false);
        };
        cargar();
        return () => { isMounted = false; };
    }, [mainMode]);

    useEffect(() => {
        let isMounted = true;
        const cargar = async () => {
            const data = await authFetch(`/pilotos/misiones/?tipo_mision=${mainMode}`);
            if (!isMounted) return;
            setMisiones(Array.isArray(data) ? data : (data?.results || []));
        };
        cargar();
        return () => { isMounted = false; };
    }, [mainMode]);

    useEffect(() => {
        if (mainMode !== 'TERCEROS') {
            setFacturacion([]);
            return;
        }
        let isMounted = true;
        const cargar = async () => {
            const data = await authFetch('/pilotos/misiones/facturacion/');
            if (!isMounted) return;
            setFacturacion(Array.isArray(data) ? data : []);
        };
        cargar();
        return () => { isMounted = false; };
    }, [mainMode]);

    const categoriaActual = resumen.categorias.find((c) => c.id === categoriaActiva);
    const metricas = categoriaActual?.metricas;

    const completadas = useMemo(
        () => misiones.filter((m) => m.estado === 'COMPLETADA'),
        [misiones]
    );

    const actividadMensual = useMemo(() => {
        const meses = generarUltimosMeses(6);
        const mapa = Object.fromEntries(meses.map((m) => [m.key, {
            ...m,
            horas: 0,
            capturas: 0,
            distancia: 0,
            misiones: 0,
            facturacion: 0,
        }]));

        for (const m of completadas) {
            if (!m.fecha_cierre) continue;
            const fecha = new Date(m.fecha_cierre);
            const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
            if (mapa[key]) {
                mapa[key].horas += getHoras(m);
                mapa[key].capturas += Number(m.capturas_generadas || 0);
                mapa[key].distancia += Number(m.distancia_km || 0);
                mapa[key].misiones += 1;
            }
        }

        for (const f of facturacion) {
            if (!f.fecha) continue;
            const fecha = new Date(`${f.fecha}T00:00:00`);
            const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
            if (mapa[key]) {
                mapa[key].facturacion += Number(f.monto || 0);
            }
        }

        return meses.map((m) => {
            const row = mapa[m.key];
            return {
                label: row.label,
                horas: Number(row.horas.toFixed(1)),
                capturas: Math.round(row.capturas),
                distancia: Number(row.distancia.toFixed(1)),
                misiones: row.misiones,
                facturacion: Math.round(row.facturacion),
            };
        });
    }, [completadas, facturacion]);

    const distribucionCategoria = useMemo(() => {
        const mapa = {};
        for (const m of completadas) {
            const cat = m.categoria || 'otros';
            if (!mapa[cat]) {
                mapa[cat] = {
                    id: cat,
                    nombre: formatearCategoria(cat),
                    misiones: 0,
                    horas: 0,
                    capturas: 0,
                    distancia: 0,
                    facturacion: 0,
                };
            }
            mapa[cat].misiones += 1;
            mapa[cat].horas += getHoras(m);
            mapa[cat].capturas += Number(m.capturas_generadas || 0);
            mapa[cat].distancia += Number(m.distancia_km || 0);
        }
        for (const f of facturacion) {
            const cat = f.categoria || 'otros';
            if (mapa[cat]) {
                mapa[cat].facturacion += Number(f.monto || 0);
            }
        }
        return Object.values(mapa).map((row) => ({
            ...row,
            horas: Number(row.horas.toFixed(1)),
            capturas: Math.round(row.capturas),
            distancia: Number(row.distancia.toFixed(1)),
            facturacion: Math.round(row.facturacion),
        }));
    }, [completadas, facturacion]);

    const topItems = useMemo(() => {
        if (mainMode === 'PERSONAL') {
            const mapa = {};
            for (const m of completadas) {
                const key = m.dron_asignado || 'Sin asignar';
                mapa[key] = (mapa[key] || 0) + 1;
            }
            return Object.entries(mapa)
                .map(([nombre, misiones]) => ({ nombre, misiones }))
                .sort((a, b) => b.misiones - a.misiones)
                .slice(0, 5);
        }

        const mapa = {};
        for (const f of facturacion) {
            const key = f.referencia || formatearCategoria(f.categoria) || 'Sin cliente';
            mapa[key] = (mapa[key] || 0) + Number(f.monto || 0);
        }
        return Object.entries(mapa)
            .map(([nombre, monto]) => ({ nombre, monto: Math.round(monto) }))
            .sort((a, b) => b.monto - a.monto)
            .slice(0, 5);
    }, [completadas, facturacion, mainMode]);

    const radarCategorias = useMemo(() => {
        if (distribucionCategoria.length < 2) return [];
        const maxHoras = Math.max(...distribucionCategoria.map((c) => c.horas), 1);
        const maxCapturas = Math.max(...distribucionCategoria.map((c) => c.capturas), 1);
        const maxDistancia = Math.max(...distribucionCategoria.map((c) => c.distancia), 1);
        const maxMisiones = Math.max(...distribucionCategoria.map((c) => c.misiones), 1);

        return distribucionCategoria.map((c) => ({
            categoria: c.nombre,
            Horas: Math.round((c.horas / maxHoras) * 100),
            Capturas: Math.round((c.capturas / maxCapturas) * 100),
            Distancia: Math.round((c.distancia / maxDistancia) * 100),
            Misiones: Math.round((c.misiones / maxMisiones) * 100),
        }));
    }, [distribucionCategoria]);

    const totalHoras = actividadMensual.reduce((s, m) => s + m.horas, 0);
    const totalMisiones = actividadMensual.reduce((s, m) => s + m.misiones, 0);
    const totalFacturacion = actividadMensual.reduce((s, m) => s + m.facturacion, 0);
    const totalCapturas = actividadMensual.reduce((s, m) => s + m.capturas, 0);
    const totalDistancia = actividadMensual.reduce((s, m) => s + m.distancia, 0);

    const tarjetasPersonal = metricas ? [
        {
            titulo: 'Horas de Vuelo',
            valor: `${Number(metricas.horas_vuelo || 0).toFixed(1)} h`,
            subtitulo: 'Tiempo total en el aire',
            icono: Clock,
            color: '#04c9a6',
        },
        {
            titulo: 'Capturas',
            valor: Number(metricas.capturas || 0).toLocaleString(),
            subtitulo: 'Fotografías y clips generados',
            icono: Camera,
            color: '#2dd2f6',
        },
        {
            titulo: 'Distancia Explorada',
            valor: `${Number(metricas.distancia_km || 0).toFixed(1)} km`,
            subtitulo: 'Recorrido acumulado',
            icono: Map,
            color: '#f1be26',
        },
        {
            titulo: 'Drones en Hangar',
            valor: metricas.drones_hangar || 0,
            subtitulo: 'Equipos registrados',
            icono: Rocket,
            color: '#2c365e',
        },
    ] : [];

    const tarjetasServicios = metricas ? [
        {
            titulo: 'Facturación',
            valor: `L. ${Number(metricas.facturacion || 0).toLocaleString()}`,
            subtitulo: 'Ingresos acumulados',
            icono: DollarSign,
            color: '#04c9a6',
        },
        {
            titulo: 'Contratos Activos',
            valor: metricas.contratos_activos || 0,
            subtitulo: 'Servicios en curso',
            icono: FileCheck,
            color: '#2dd2f6',
        },
        {
            titulo: 'Horas Comerciales',
            valor: `${Number(metricas.horas_comerciales || 0).toFixed(1)} h`,
            subtitulo: 'Tiempo facturable',
            icono: Timer,
            color: '#2c365e',
        },
        {
            titulo: 'Reputación',
            valor: metricas.reputacion !== null && metricas.reputacion !== undefined
                ? Number(metricas.reputacion).toFixed(1)
                : '—',
            subtitulo: 'Calificación promedio',
            icono: Star,
            color: '#f1be26',
        },
    ] : [];

    const tarjetas = mainMode === 'PERSONAL' ? tarjetasPersonal : tarjetasServicios;
    const categorias = resumen.categorias || [];

    return (
        <div style={{ padding: '20px' }}>
            <SectionHeading
                title={mainMode === 'PERSONAL' ? 'Mi Historial de Vuelo' : 'Mis Ganancias y Servicios'}
            />

            <div style={{
                display: 'flex',
                borderRadius: '6px',
                overflow: 'hidden',
                border: '1px solid var(--color-dark)',
                width: 'fit-content',
                marginBottom: '20px',
            }}>
                <button
                    onClick={() => setMainMode('PERSONAL')}
                    style={{
                        padding: '10px 20px',
                        background: mainMode === 'PERSONAL' ? 'var(--color-primary)' : 'var(--color-dark)',
                        color: 'var(--white)',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        borderRight: '1px solid rgba(255,255,255,0.2)',
                        transition: 'all 0.2s',
                    }}
                >
                    Uso Personal
                </button>
                <button
                    onClick={() => setMainMode('TERCEROS')}
                    style={{
                        padding: '10px 20px',
                        background: mainMode === 'TERCEROS' ? 'var(--color-primary)' : 'var(--color-dark)',
                        color: 'var(--white)',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.2s',
                    }}
                >
                    Servicios a Terceros
                </button>
            </div>

            {categorias.length > 0 && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '30px' }}>
                    {categorias.map((cat) => {
                        const Icono = iconoDe(cat.id);
                        const activa = categoriaActiva === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setCategoriaActiva(cat.id)}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 16px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    borderRadius: '20px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    background: activa ? 'var(--color-primary)' : 'transparent',
                                    border: activa ? '2px solid var(--color-primary)' : '2px solid var(--color-dark)',
                                    color: activa ? 'var(--white)' : 'var(--color-dark)',
                                }}
                            >
                                <Icono size={14} />
                                {formatearCategoria(cat.id)}
                            </button>
                        );
                    })}
                </div>
            )}

            {cargando ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>
                    Cargando métricas...
                </div>
            ) : categorias.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: 'var(--text-light)',
                    background: 'var(--white)',
                    borderRadius: '8px',
                    border: '1px dashed var(--light-gray)',
                }}>
                    <Drone size={48} color="var(--light-gray)" style={{ marginBottom: '15px' }} />
                    <h3 style={{ color: 'var(--color-dark)', fontSize: '20px', marginBottom: '8px' }}>
                        Aún no tienes actividad en este modo
                    </h3>
                    <p style={{ fontSize: '15px', maxWidth: '400px', margin: '0 auto' }}>
                        Cuando registres tu primera misión en modo {mainMode === 'PERSONAL' ? 'personal' : 'servicios a terceros'}, verás aquí tus métricas.
                    </p>
                </div>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                        {tarjetas.map((t) => {
                            const Icono = t.icono;
                            return (
                                <div
                                    key={t.titulo}
                                    style={{
                                        padding: '25px',
                                        border: '1px solid var(--light-gray)',
                                        borderRadius: '8px',
                                        backgroundColor: 'var(--white)',
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                        <h3 style={{ margin: 0, color: 'var(--text-light)', fontSize: '14px', textTransform: 'uppercase' }}>
                                            {t.titulo}
                                        </h3>
                                        <div
                                            style={{
                                                background: `${t.color}1a`,
                                                padding: '8px',
                                                borderRadius: '8px',
                                                color: t.color,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Icono size={20} />
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '32px', fontWeight: '900', margin: 0, color: t.color }}>
                                        {t.valor}
                                    </p>
                                    <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>
                                        {t.subtitulo}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ marginTop: '40px', marginBottom: '20px' }}>
                        <SectionHeading
                            title={mainMode === 'PERSONAL' ? 'Estadísticas de vuelo' : 'Análisis comercial'}
                        />
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
                        gap: '20px',
                    }}>
                        
                        <ActividadBarChart
                            completadas={completadas}
                            mainMode={mainMode}
                            categoriaActiva={categoriaActiva}
                        />

                        <ChartCard
                            icono={BarChart3}
                            titulo={mainMode === 'PERSONAL' ? 'Capturas por mes' : 'Misiones completadas por mes'}
                            subtitulo={`Total: ${mainMode === 'PERSONAL' ? `${totalCapturas.toLocaleString()} capturas` : `${totalMisiones} misiones`}`}
                            color="#2dd2f6"
                        >
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={actividadMensual} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                                    <Tooltip content={<TooltipPersonalizado />} />
                                    <Bar
                                        dataKey={mainMode === 'PERSONAL' ? 'capturas' : 'misiones'}
                                        name={mainMode === 'PERSONAL' ? 'Capturas' : 'Misiones'}
                                        fill="#2dd2f6"
                                        radius={[6, 6, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        <ChartCard
                            icono={PieIcon}
                            titulo="Distribución por categoría"
                            subtitulo={`${distribucionCategoria.length} categorías activas`}
                            color="#f1be26"
                        >
                            <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                    <Pie
                                        data={distribucionCategoria}
                                        dataKey="misiones"
                                        nameKey="nombre"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        innerRadius={50}
                                        paddingAngle={3}
                                    >
                                        {distribucionCategoria.map((_, idx) => (
                                            <Cell key={idx} fill={COLORES[idx % COLORES.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<TooltipPersonalizado />} />
                                    <Legend wrapperStyle={{ fontSize: '11px' }} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        <ChartCard
                            icono={TrendingUp}
                            titulo={mainMode === 'PERSONAL' ? 'Distancia explorada por mes' : 'Horas comerciales por mes'}
                            subtitulo={mainMode === 'PERSONAL'
                                ? `Total: ${totalDistancia.toFixed(1)} km`
                                : `Total: ${totalHoras.toFixed(1)} h`}
                            color="#04c9a6"
                        >
                            <ResponsiveContainer width="100%" height={260}>
                                <AreaChart data={actividadMensual} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#04c9a6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#04c9a6" stopOpacity={0.05} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                                    <Tooltip content={<TooltipPersonalizado />} />
                                    <Area
                                        type="monotone"
                                        dataKey={mainMode === 'PERSONAL' ? 'distancia' : 'horas'}
                                        name={mainMode === 'PERSONAL' ? 'Distancia (km)' : 'Horas'}
                                        stroke="#04c9a6"
                                        fill="url(#colorArea)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        <ChartCard
                            icono={mainMode === 'PERSONAL' ? Rocket : Star}
                            titulo={mainMode === 'PERSONAL' ? 'Top 5 drones más usados' : 'Top 5 clientes por facturación'}
                            subtitulo="Registros completados"
                            color="#2c365e"
                        >
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart
                                    data={topItems}
                                    layout="vertical"
                                    margin={{ top: 5, right: 20, left: 20, bottom: 0 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                                    <YAxis
                                        dataKey="nombre"
                                        type="category"
                                        tick={{ fontSize: 10, fill: '#64748b' }}
                                        width={120}
                                    />
                                    <Tooltip content={<TooltipPersonalizado />} />
                                    <Bar
                                        dataKey={mainMode === 'PERSONAL' ? 'misiones' : 'monto'}
                                        name={mainMode === 'PERSONAL' ? 'Misiones' : 'Monto (L.)'}
                                        fill="#2c365e"
                                        radius={[0, 6, 6, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        {radarCategorias.length > 1 && (
                            <ChartCard
                                icono={Star}
                                titulo="Comparativa de categorías"
                                subtitulo="Métricas normalizadas (0-100)"
                                color="#f02558"
                            >
                                <ResponsiveContainer width="100%" height={260}>
                                    <RadarChart data={radarCategorias} outerRadius={85}>
                                        <PolarGrid stroke="#e2e8f0" />
                                        <PolarAngleAxis dataKey="categoria" tick={{ fontSize: 10, fill: '#64748b' }} />
                                        <PolarRadiusAxis tick={{ fontSize: 9, fill: '#94a3b8' }} />
                                        <Radar name="Horas" dataKey="Horas" stroke="#04c9a6" fill="#04c9a6" fillOpacity={0.15} />
                                        <Radar name="Misiones" dataKey="Misiones" stroke="#2dd2f6" fill="#2dd2f6" fillOpacity={0.15} />
                                        <Radar name="Capturas" dataKey="Capturas" stroke="#f1be26" fill="#f1be26" fillOpacity={0.15} />
                                        <Radar name="Distancia" dataKey="Distancia" stroke="#f02558" fill="#f02558" fillOpacity={0.15} />
                                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                                        <Tooltip content={<TooltipPersonalizado />} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </ChartCard>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}