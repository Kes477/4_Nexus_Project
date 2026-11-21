import { useState, useEffect } from 'react';
import { getMisiones } from '../../api/pilotoService';
import { SectionHeading, Badge } from '../../components/ui';

export default function PilotoDashboard() {
    const [mainMode, setMainMode] = useState("PERSONAL");
    const [misiones, setMisiones] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            setCargando(true);
            try {
                const data = await getMisiones(mainMode);
                if (isMounted) setMisiones(data);
            } catch (error) {
                console.error(error);
            } finally {
                if (isMounted) setCargando(false);
            }
        };

        fetchData();
        return () => { isMounted = false; };
    }, [mainMode]);

    const completadas = misiones.filter(m => m.estado === 'COMPLETADA').length;
    const pendientes = misiones.filter(m => m.estado === 'PENDIENTE' || m.estado === 'ACEPTADA' || m.estado === 'EN_CURSO').length;
    const ingresoPorVuelo = mainMode === 'TERCEROS' ? 500 : 0; 
    const gananciasEstimadas = completadas * ingresoPorVuelo;

    return (
        <div style={{ padding: '20px' }}>
            <SectionHeading 
                eyebrow="Resumen de Actividad"
                title={mainMode === "PERSONAL" ? "Mi Historial de Vuelo" : "Mis Ganancias y Servicios"} 
            />
            
            <div style={{ display: 'flex', background: 'var(--bg-color)', padding: '6px', borderRadius: '10px', border: '1px solid var(--light-gray)', width: 'fit-content', marginBottom: '30px' }}>
                <button
                    onClick={() => setMainMode("PERSONAL")}
                    style={{
                        padding: '10px 20px', fontSize: '14px', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer',
                        background: mainMode === "PERSONAL" ? 'var(--color-dark)' : 'transparent',
                        color: mainMode === "PERSONAL" ? 'var(--white)' : 'var(--text-light)',
                        transition: 'all 0.3s'
                    }}
                >
                    Uso Personal
                </button>
                <button
                    onClick={() => setMainMode("TERCEROS")}
                    style={{
                        padding: '10px 20px', fontSize: '14px', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer',
                        background: mainMode === "TERCEROS" ? 'var(--color-primary)' : 'transparent',
                        color: mainMode === "TERCEROS" ? 'var(--white)' : 'var(--text-light)',
                        transition: 'all 0.3s'
                    }}
                >
                    Servicios a Terceros
                </button>
            </div>

            {cargando ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>Cargando métricas...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                    
                    {mainMode === "TERCEROS" && (
                        <div style={{ padding: '25px', border: '1px solid var(--light-gray)', borderRadius: '8px', backgroundColor: 'var(--white)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                            <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-light)', fontSize: '14px', textTransform: 'uppercase' }}>Ganancias Estimadas</h3>
                            <p style={{ fontSize: '32px', fontWeight: '900', margin: 0, color: 'var(--color-success)' }}>
                                L. {gananciasEstimadas.toLocaleString()}
                            </p>
                            <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>Basado en {completadas} vuelos</span>
                        </div>
                    )}

                    <div style={{ padding: '25px', border: '1px solid var(--light-gray)', borderRadius: '8px', backgroundColor: 'var(--white)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                        <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-light)', fontSize: '14px', textTransform: 'uppercase' }}>Vuelos Realizados</h3>
                        <p style={{ fontSize: '32px', fontWeight: '900', margin: 0, color: 'var(--color-dark)' }}>
                            {completadas}
                        </p>
                        <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>De {misiones.length} totales</span>
                    </div>

                    <div style={{ padding: '25px', border: '1px solid var(--light-gray)', borderRadius: '8px', backgroundColor: 'var(--white)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                        <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-light)', fontSize: '14px', textTransform: 'uppercase' }}>Misiones Activas</h3>
                        <p style={{ fontSize: '32px', fontWeight: '900', margin: 0, color: 'var(--color-warning)' }}>
                            {pendientes}
                        </p>
                        <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>Pendientes o en curso</span>
                    </div>

                </div>
            )}
        </div>
    );
}