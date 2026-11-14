import { Plane, Battery, Clock, ShoppingBag, Wrench } from 'lucide-react';
import Badge from '../ui/Badge'; 
import Stars from '../ui/Stars';
import { Button } from '../ui/Button'; 

const DroneCard = ({ drone, mode = 'catalog', onAction }) => {
    const isCatalog = mode === 'catalog';

    return (
        <div style={{
            background: 'var(--white)', 
            padding: isCatalog ? '0' : '20px', 
            borderRadius: '12px',
            border: '1px solid var(--light-gray)', 
            width: '100%', 
            maxWidth: '320px', 
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.08)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.03)';
        }}
        >
            {/* --- MODO CATÁLOGO (Imagen Grande) --- */}
            {isCatalog && (
                <div style={{ position: 'relative', height: '170px', backgroundColor: 'var(--bg-color)', overflow: 'hidden' }}>
                    <img 
                        src={drone.imagen || 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=600&auto=format&fit=crop'} 
                        alt={drone.nombre} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)' }} />
                    
                    {(drone.es_nuevo || drone.destacado) && (
                        <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                            <Badge text="Nuevo" color="primary" />
                        </div>
                    )}
                </div>
            )}

            {/* Contenido de la tarjeta */}
            <div style={{ padding: isCatalog ? '20px' : '0', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                
                {/* --- MODO DUEÑO (Icono e info de estado) --- */}
                {!isCatalog && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                        <div style={{ 
                            background: 'rgba(4, 201, 166, 0.1)', color: 'var(--color-primary)', 
                            padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                        }}>
                            <Plane size={22} strokeWidth={2} />
                        </div>
                        <Badge text={drone.estado || 'Operativo'} color={drone.estado === 'Operativo' ? 'success' : 'warning'} />
                    </div>
                )}

                {/* Título */}
                <h4 style={{ color: 'var(--color-dark)', marginBottom: '8px', fontSize: '18px', fontWeight: '800', textAlign: isCatalog ? 'left' : 'center' }}>
                    {drone.nombre}
                </h4>
                
                {/* Estrellas */}
                <div style={{ marginBottom: '12px', display: 'flex', justifyContent: isCatalog ? 'flex-start' : 'center' }}>
                    <Stars rating={drone.rating || 4} />
                </div>

                {/* Descripción */}
                <p style={{ fontSize: '13px', color: 'var(--text-light)', marginBottom: '15px', lineHeight: '1.5', flexGrow: 1, textAlign: isCatalog ? 'left' : 'center' }}>
                    {isCatalog ? drone.desc : `Modelo: ${drone.modelo}`}
                </p>
                
                {/* --- MÉTRICAS TÉCNICAS --- */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: isCatalog ? '1fr 1fr' : '1fr 1fr', 
                    gap: '10px', 
                    background: 'var(--bg-color)', 
                    padding: '12px', 
                    borderRadius: '8px', 
                    marginBottom: '20px' 
                }}>
                    {isCatalog ? (
                        <>
                            <div>
                                <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-light)', fontWeight: 'bold', textTransform: 'uppercase' }}>Categoría</span>
                                <strong style={{ fontSize: '13px', color: 'var(--color-dark)' }}>{drone.categoria || 'General'}</strong>
                            </div>
                            <div>
                                <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-light)', fontWeight: 'bold', textTransform: 'uppercase' }}>Precio</span>
                                <strong style={{ fontSize: '15px', color: 'var(--color-primary)' }}>L {drone.precio}</strong>
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Battery size={16} color="var(--color-primary)" />
                                <div>
                                    <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-light)' }}>Batería</span>
                                    <strong style={{ fontSize: '13px', color: 'var(--color-dark)' }}>{drone.bateria}%</strong>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Clock size={16} color="var(--color-primary)" />
                                <div>
                                    <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-light)' }}>Horas vuelo</span>
                                    <strong style={{ fontSize: '13px', color: 'var(--color-dark)' }}>{drone.horas} hrs</strong>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* --- BOTÓN DE ACCIÓN --- */}
                <div style={{ marginTop: 'auto' }}>
                    <Button 
                        variant={isCatalog ? "primary" : "outline-primary"} 
                        style={{ width: '100%', padding: '10px' }}
                        onClick={() => onAction(drone)}
                    >
                        {isCatalog ? (
                            <><ShoppingBag size={16} style={{ marginRight: '6px' }}/> Comprar Ahora</>
                        ) : (
                            <><Wrench size={16} style={{ marginRight: '6px' }}/> Ayuda Técnica</>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default DroneCard;