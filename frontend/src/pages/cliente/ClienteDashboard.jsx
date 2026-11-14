import { useState } from 'react';
import { Droplets, Clock, Radio, CheckCircle2, BarChart3 } from 'lucide-react';
import { Tabs, Badge, Button, IconButton } from '../../components/ui'; 

export const ClienteDashboard = () => {
    const [activeTab, setActiveTab] = useState(0); 
    const [chartPeriod, setChartPeriod] = useState('mes');
    const [showNotifications, setShowNotifications] = useState(false);

    const tabLabels = ['Riego', 'Búsqueda', 'Fumigación', 'Transporte', 'Otros'];
    const currentTabName = tabLabels[activeTab];

    const metricas = [
        { label: 'Ahorro insumos', value: '35%', sub: 'Reducción de recursos', icon: <Droplets size={20} />, color: 'var(--color-primary)' },
        { label: 'Horas ahorradas', value: '148 hrs', sub: 'Tiempo optimizado', icon: <Clock size={20} />, color: '#3b82f6' },
        { label: 'Área atendida', value: '320 Ha', sub: 'Cobertura escaneada', icon: <Radio size={20} />, color: '#a855f7' },
        { label: 'Casos resueltos', value: '12 casos', sub: 'Alertas solucionadas', icon: <CheckCircle2 size={20} />, color: '#f59e0b' }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Cabecera */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--light-gray)', paddingBottom: '15px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '24px', color: 'var(--color-dark)', fontWeight: '800' }}>Dashboard de Servicios</h1>
                    <p style={{ margin: '5px 0 0 0', color: 'var(--text-light)', fontSize: '14px' }}>Monitoreo operacional y análisis de rendimiento</p>
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <Badge text="Suscripción VIP" color="success" />
                    
                    <div style={{ position: 'relative' }}>
                        <IconButton 
                            icon="fa-bell" 
                            iconType="fas" 
                            variant="outline" 
                            onClick={() => setShowNotifications(!showNotifications)} 
                        />
                        <div style={{ position: 'absolute', top: '-5px', right: '-5px', pointerEvents: 'none' }}>
                            <Badge text="2" color="danger" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tarjetas de Métricas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
                {metricas.map((m, i) => (
                    <div key={i} className="card" style={{ textAlign: 'left', padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-light)', textTransform: 'uppercase' }}>{m.label}</span>
                            <div style={{ color: m.color, background: 'var(--bg-color)', padding: '6px', borderRadius: '6px' }}>{m.icon}</div>
                        </div>
                        <h2 style={{ margin: '0 0 5px 0', fontSize: '24px', color: 'var(--color-dark)' }}>{m.value}</h2>
                        <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>{m.sub}</span>
                    </div>
                ))}
            </div>

            {/* Gráfico y Tabs */}
            <div className="card" style={{ padding: 0, textAlign: 'left', overflow: 'hidden' }}>
                
                {/* Contenedor de las pestañas (los estilos vienen de App.css) */}
                <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--light-gray)', background: 'var(--bg-color)', display: 'flex' }}>
                    <Tabs 
                        tabs={tabLabels} 
                        activeTab={activeTab} 
                        onChange={setActiveTab} 
                    />
                </div>
                
                <div style={{ padding: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, color: 'var(--color-dark)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <BarChart3 size={20} color="var(--color-primary)"/> Rendimiento ({currentTabName})
                        </h3>
                        
                        {/* Selector de tiempo */}
                        <div style={{ display: 'flex', background: 'var(--bg-color)', borderRadius: '6px', padding: '4px', gap: '4px' }}>
                            {['semana', 'mes', 'año'].map(p => (
                                <Button 
                                    key={p} 
                                    size="sm" 
                                    variant={chartPeriod === p ? 'primary' : 'outline-dark'}
                                    onClick={() => setChartPeriod(p)}
                                    style={{ textTransform: 'capitalize', padding: '4px 12px', fontSize: '11px' }}
                                >
                                    {p}
                                </Button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Simulación de Gráfico */}
                    <div style={{ height: '250px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', borderBottom: '2px solid var(--light-gray)', paddingBottom: '10px' }}>
                        {[40, 70, 45, 90, 60, 100, 80].map((height, i) => (
                            <div key={i} style={{ width: '40px', height: `${height}%`, background: 'rgba(4, 201, 166, 0.3)', borderRadius: '4px 4px 0 0', position: 'relative' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', background: 'var(--color-primary)', borderRadius: '4px 4px 0 0', opacity: 0.8 }}></div>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '10px', color: 'var(--text-light)', fontSize: '12px' }}>
                        <span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span><span>Dom</span>
                    </div>
                </div>
            </div>
        </div>
    );
};