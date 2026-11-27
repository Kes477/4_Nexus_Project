import { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, User, MessageSquare, AlertCircle, Smile, Meh, Frown } from 'lucide-react';
import { SectionHeading, Loader, Alert, Select, Badge, Stars, CircularProgress } from '../../components/ui';

export default function PilotoHistorial() {
    const [historial, setHistorial] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    const [filtroTipo, setFiltroTipo] = useState('TODOS');

    useEffect(() => {
        const fetchHistorial = async () => {
            setCargando(true);
            setErrorMsg(null);
            try {
                const token = localStorage.getItem('access_token');
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
                
                const response = await fetch(`${API_URL}/pilotos/misiones/historial/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Error al cargar el historial. Verifica tu conexión.');
                }

                const data = await response.json();
                const lista = Array.isArray(data) ? data : data.results || [];
                setHistorial(lista);
            } catch (err) {
                setErrorMsg(err.message);
            } finally {
                setCargando(false);
            }
        };

        fetchHistorial();
    }, []);

    const promedioGeneral = useMemo(() => {
        const calificados = historial.filter(item => {
            const val = item.calificacion;
            return val !== null && val !== undefined && !isNaN(val) && Number(val) > 0;
        });
        if (calificados.length === 0) return 0;
        const suma = calificados.reduce((acc, item) => acc + Number(item.calificacion), 0);
        return (suma / calificados.length).toFixed(1);
    }, [historial]);

    const colorPromedio = useMemo(() => {
        const val = parseFloat(promedioGeneral);
        if (val >= 4.1) return '#28a745'; 
        if (val >= 3.1) return '#ffc107';
        if (val >= 2.1) return '#fd7e14';
        if (val >= 1.1) return '#e67e22';
        return '#dc3545';
    }, [promedioGeneral]);

    const faceIcon = useMemo(() => {
        const val = parseFloat(promedioGeneral);
        const props = { 
            size: 60, 
            color: colorPromedio, 
            stroke: colorPromedio, 
            strokeWidth: 2.2 
        };

        if (val >= 4.1) return <Smile {...props} />;
        if (val >= 3.1) return <Meh {...props} />;
        return <Frown {...props} />;
    }, [promedioGeneral, colorPromedio]);

    const opcionesFiltro = useMemo(() => {
        const tipos = ['TODOS', ...new Set(historial.map(item => item.tipo_servicio))];
        return tipos.map(tipo => ({
            value: tipo,
            label: tipo === 'TODOS' ? 'Todos los servicios' : tipo.replace(/_/g, ' ').toUpperCase()
        }));
    }, [historial]);

    const historialFiltrado = useMemo(() => {
        if (filtroTipo === 'TODOS') return historial;
        return historial.filter(item => item.tipo_servicio === filtroTipo);
    }, [historial, filtroTipo]);

    return (
        <div style={{ padding: '40px 20px', backgroundColor: 'var(--bg-color)', minHeight: '100vh', fontFamily: "'Roboto', sans-serif" }}>
            <div className="section-container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
                
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-end', 
                    marginBottom: '30px', 
                    flexWrap: 'wrap', 
                    gap: '20px',
                    paddingBottom: '20px'
                }}>
                    <SectionHeading 
                        title="Registro de calificaciones"
                        description="Revisa los comentarios y puntuaciones que los clientes han dejado sobre tus servicios."
                    />
                    
                    <div style={{ 
                        background: 'var(--white)', 
                        padding: '15px 25px', 
                        borderRadius: '12px', 
                        boxShadow: '0 10px 25px rgba(0,0,0,0.05)', 
                        border: '1px solid var(--light-gray)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px'
                    }}>
                        <CircularProgress 
                            percent={(parseFloat(promedioGeneral) / 5) * 100} 
                            color={colorPromedio}
                        >
                            {faceIcon}
                        </CircularProgress>

                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: 'var(--text-light)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Promedio General
                            </span>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                                <span style={{ fontSize: '32px', fontWeight: '900', color: 'var(--color-dark)', lineHeight: '1' }}>
                                    {promedioGeneral}
                                </span>
                                <span style={{ fontSize: '14px', color: 'var(--text-light)', fontWeight: '500' }}>
                                    / 5.0
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ 
                    marginBottom: '20px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    gap: '15px', 
                    background: 'var(--white)', 
                    padding: '12px 18px', 
                    borderRadius: '10px', 
                    border: '1px solid var(--light-gray)',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: '600', color: 'var(--color-dark)', fontSize: '13px' }}>
                            Filtrar por categoría de vuelo:
                        </span>
                    </div>
                    <Select
                        options={opcionesFiltro}
                        value={filtroTipo}
                        onChange={(e) => setFiltroTipo(e.target.value)}
                        style={{ maxWidth: '250px' }}
                    />
                </div>

                {errorMsg && (
                    <div style={{ marginBottom: '20px' }}>
                        <Alert 
                            type="danger" 
                            title="Ha ocurrido un error" 
                            message={errorMsg} 
                            onClose={() => setErrorMsg(null)} 
                        />
                    </div>
                )}

                {cargando ? (
                    <Loader text="Analizando bitácora de vuelos..." />
                ) : historialFiltrado.length === 0 ? (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '60px 20px', 
                        color: 'var(--text-light)', 
                        background: 'var(--white)', 
                        borderRadius: '12px', 
                        border: '1px dashed var(--light-gray)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <AlertCircle size={48} color="var(--light-gray)" style={{ marginBottom: '15px' }} />
                        <h3 style={{ color: 'var(--color-dark)', fontSize: '20px', marginBottom: '8px' }}>
                            No hay registros disponibles
                        </h3>
                        <p style={{ fontSize: '15px', maxWidth: '400px', margin: 0 }}>
                            No se encontraron servicios completados con el filtro actual.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {historialFiltrado.map((servicio) => {
                            const tieneCalificacionValida = 
                                servicio.calificacion !== null && 
                                servicio.calificacion !== undefined && 
                                !isNaN(servicio.calificacion) && 
                                Number(servicio.calificacion) > 0;

                            return (
                                <div key={servicio.id} style={{
                                    background: 'var(--white)',
                                    borderRadius: '10px',
                                    border: '1px solid var(--light-gray)',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                                    overflow: 'hidden',
                                    transition: 'transform 0.2s ease',
                                }}>
                                    
                                    <div style={{ 
                                        padding: '12px 18px', 
                                        borderBottom: '1px solid var(--light-gray)',
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center', 
                                        flexWrap: 'wrap', 
                                        gap: '10px',
                                        backgroundColor: 'rgba(248, 250, 252, 0.5)'
                                    }}>
                                        <div>
                                            <h3 style={{ margin: '0 0 3px 0', color: 'var(--color-dark)', fontSize: '14px', fontWeight: '800', letterSpacing: '0.2px' }}>
                                                {servicio.tipo_servicio?.replace(/_/g, ' ').toUpperCase() || 'SERVICIO'}
                                            </h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-light)', fontSize: '12px' }}>
                                                <User size={13} /> 
                                                <span>Cliente: <strong style={{ color: 'var(--color-dark)' }}>{servicio.cliente || 'Uso Personal'}</strong></span>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            {tieneCalificacionValida ? (
                                                <div style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '8px',
                                                    background: 'rgba(255, 193, 7, 0.1)',
                                                    padding: '5px 12px',
                                                    borderRadius: '30px'
                                                }}>
                                                    <Stars rating={Math.round(Number(servicio.calificacion))} />
                                                    <span style={{ fontWeight: '900', color: 'var(--color-warning)', fontSize: '13px' }}>
                                                        {Number(servicio.calificacion).toFixed(1)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <Badge text="Sin calificar" color="warning" />
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ padding: '12px 18px' }}>
                                        <div style={{ display: 'flex', gap: '20px', marginBottom: servicio.comentario ? '12px' : '0', color: 'var(--text-light)', fontSize: '12.5px', flexWrap: 'wrap' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <Calendar size={13} /> 
                                                <strong style={{ color: 'var(--color-dark)' }}>Fecha:</strong> {new Date(`${servicio.fecha_programada}T00:00:00`).toLocaleDateString('es-HN', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <Clock size={13} /> 
                                                <strong style={{ color: 'var(--color-dark)' }}>Duración:</strong> {servicio.duracion ? `${servicio.duracion} horas` : 'No registrada'}
                                            </span>
                                        </div>

                                        {servicio.comentario && (
                                            <div style={{ 
                                                background: '#f8fafc', 
                                                padding: '10px 12px', 
                                                borderRadius: '8px',
                                                border: '1px solid var(--light-gray)',
                                                display: 'flex',
                                                gap: '10px',
                                                alignItems: 'flex-start'
                                            }}>
                                                <div style={{
                                                    width: '26px',
                                                    height: '26px',
                                                    borderRadius: '50%',
                                                    background: 'var(--white)',
                                                    border: '1px solid var(--light-gray)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0
                                                }}>
                                                    <MessageSquare size={12} color="var(--text-light)" />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <span style={{ 
                                                        display: 'block', 
                                                        fontSize: '9.5px', 
                                                        fontWeight: '800', 
                                                        textTransform: 'uppercase', 
                                                        letterSpacing: '0.4px', 
                                                        color: 'var(--text-light)', 
                                                        marginBottom: '3px' 
                                                    }}>
                                                        Comentario del cliente
                                                    </span>
                                                    <p style={{ 
                                                        margin: 0, 
                                                        color: 'var(--color-dark)', 
                                                        fontSize: '12.5px', 
                                                        lineHeight: '1.5' 
                                                    }}>
                                                        {servicio.comentario}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}