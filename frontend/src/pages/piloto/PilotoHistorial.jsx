import { useState, useEffect, useMemo } from 'react';
import { 
    SectionHeading, 
    Loader, 
    Alert, 
    Select, 
    Badge, 
    Stars, 
    CircularProgress 
} from '../../components/ui';

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
                    throw new Error('Error al cargar el historial');
                }

                const data = await response.json();
                setHistorial(data);
            } catch (err) {
                setErrorMsg(err.message);
            } finally {
                setCargando(false);
            }
        };

        fetchHistorial();
    }, []);

    const promedioGeneral = useMemo(() => {
        const calificados = historial.filter(item => item.calificacion !== null && item.calificacion !== undefined);
        if (calificados.length === 0) return 0;
        const suma = calificados.reduce((acc, item) => acc + item.calificacion, 0);
        return (suma / calificados.length).toFixed(1);
    }, [historial]);

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
        <div style={{ padding: '40px 20px', backgroundColor: 'var(--bg-color)', minHeight: '100vh' }}>
            <div className="section-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
                    <SectionHeading 
                        eyebrow="Reputación"
                        title="Mi Historial de Servicios"
                        description="Consulta tus vuelos completados y la retroalimentación de los clientes."
                    />
                    
                    <div style={{ 
                        background: 'var(--white)', 
                        padding: '20px 30px', 
                        borderRadius: '12px', 
                        boxShadow: '0 4px 15px rgba(0,0,0,0.03)', 
                        border: '1px solid var(--light-gray)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <span style={{ color: 'var(--text-light)', fontSize: '12px', fontWeight: '700', letterSpacing: '1px' }}>
                            PROMEDIO GENERAL
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <CircularProgress percent={(parseFloat(promedioGeneral) / 5) * 100} />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '28px', fontWeight: '900', color: 'var(--color-dark)', lineHeight: '1' }}>
                                    {promedioGeneral}
                                </span>
                                <span style={{ fontSize: '14px', color: 'var(--text-light)', fontWeight: '500' }}>
                                    de 5.0
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ 
                    marginBottom: '30px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '15px', 
                    background: 'var(--white)', 
                    padding: '15px 20px', 
                    borderRadius: '8px', 
                    border: '1px solid var(--light-gray)' 
                }}>
                    <span style={{ fontWeight: '600', color: 'var(--color-dark)', fontSize: '14px' }}>
                        Filtrar por tipo de servicio:
                    </span>
                    <Select
                        options={opcionesFiltro}
                        value={filtroTipo}
                        onChange={(e) => setFiltroTipo(e.target.value)}
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
                    <Loader text="Cargando historial..." />
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
                        <h3 style={{ color: 'var(--color-dark)', fontSize: '20px', marginBottom: '8px' }}>
                            No hay servicios completados
                        </h3>
                        <p style={{ fontSize: '15px', maxWidth: '400px' }}>
                            No se encontraron servicios que coincidan con el filtro seleccionado.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '20px' }}>
                        {historialFiltrado.map((servicio) => (
                            <div key={servicio.id} style={{
                                background: 'var(--white)',
                                padding: '20px',
                                borderRadius: '10px',
                                border: '1px solid var(--light-gray)',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 5px 0', color: 'var(--color-dark)', fontSize: '18px', fontWeight: '800' }}>
                                            {servicio.tipo_servicio.replace(/_/g, ' ').toUpperCase()}
                                        </h3>
                                        <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '14px' }}>
                                            Cliente: <strong style={{ color: 'var(--color-dark)' }}>{servicio.cliente || 'Uso Personal'}</strong>
                                        </p>
                                    </div>
                                    <div>
                                        {servicio.calificacion ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <Stars rating={Math.round(servicio.calificacion)} />
                                                <span style={{ fontWeight: 'bold', color: 'var(--color-dark)', fontSize: '16px' }}>
                                                    ({servicio.calificacion})
                                                </span>
                                            </div>
                                        ) : (
                                            <Badge text="Sin calificar" color="warning" />
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '30px', marginBottom: '15px', color: 'var(--text-light)', fontSize: '14px', flexWrap: 'wrap' }}>
                                    <span>
                                        <strong style={{ color: 'var(--color-dark)' }}>Fecha:</strong> {new Date(servicio.fecha_programada).toLocaleDateString()}
                                    </span>
                                    <span>
                                        <strong style={{ color: 'var(--color-dark)' }}>Duración:</strong> {servicio.duracion ? `${servicio.duracion} horas` : 'No registrada'}
                                    </span>
                                </div>

                                {servicio.comentario && (
                                    <div style={{ background: 'var(--bg-color)', padding: '15px', borderRadius: '8px', borderLeft: '4px solid var(--color-primary)' }}>
                                        <p style={{ margin: 0, color: 'var(--color-dark)', fontStyle: 'italic', fontSize: '14px' }}>
                                            "{servicio.comentario}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}