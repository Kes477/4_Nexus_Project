import { Badge } from '../ui/Badge';
import { Stars } from '../ui/Stars';

const DroneCard = ({ drone, onViewDetails }) => {
    return (
        <div style={{
            background: 'var(--white)', 
            padding: '30px 20px', 
            borderRadius: '8px',
            border: '1px solid var(--light-gray)', 
            textAlign: 'center', 
            width: '100%', 
            maxWidth: '250px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative'
        }}>
            {drone.es_nuevo && (
                <div style={{ position: 'absolute', top: '15px', right: '15px' }}>
                    <Badge text="Nuevo" color="primary" />
                </div>
            )}
            
            <div style={{ width: '100%', height: '120px', backgroundColor: 'var(--bg-color)', borderRadius: '6px', marginBottom: '15px', overflow: 'hidden' }}>
                <img 
                    src={drone.imagen || 'https://via.placeholder.com/250x120?text=Dron'} 
                    alt={drone.nombre} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            </div>

            <h4 style={{ color: 'var(--color-dark)', marginBottom: '10px', fontSize: '18px', fontWeight: '700' }}>
                {drone.nombre}
            </h4>
            
            <div style={{ marginBottom: '15px' }}>
                <Stars rating={drone.rating || 4} />
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '15px', lineHeight: '1.5', flexGrow: 1 }}>
                {drone.descripcion_corta}
            </p>
            
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                    ${drone.precio}
                </span>
                {/* Botón estilo btn-sm del HTML */}
                <button 
                    onClick={() => onViewDetails(drone)}
                    style={{
                        padding: '8px 16px', fontSize: '12px', borderRadius: '20px',
                        background: 'transparent', border: '2px solid var(--color-primary)', 
                        color: 'var(--color-primary)', fontWeight: '500', cursor: 'pointer',
                        transition: 'all 0.3s'
                    }}
                    onMouseOver={(e) => { e.target.style.background = 'var(--color-primary)'; e.target.style.color = 'var(--white)'; }}
                    onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--color-primary)'; }}
                >
                    Ver Detalles
                </button>
            </div>
        </div>
    );
};

export default DroneCard;