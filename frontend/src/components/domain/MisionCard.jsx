import { MapPin, Calendar, Clock, Check, X, Play, CheckCircle, User, Camera, Shield, Package, Droplets, Target, Eye } from 'lucide-react';
import { Button, Badge } from '../ui';

export const MisionCard = ({ mision, onStatusChange, isPersonal }) => {
    const getMissionStyle = (categoria) => {
        const cat = categoria?.toLowerCase() || '';
        
        if (cat.includes('fumig') || cat.includes('agri')) 
            return { Icon: Droplets, color: 'var(--color-info)', bg: 'rgba(45, 210, 246, 0.1)' };
        
        if (cat.includes('monitoreo') || cat.includes('vigil')) 
            return { Icon: Eye, color: 'var(--color-primary)', bg: 'rgba(4, 201, 166, 0.1)' };
        
        // Ampliado para aceptar "foto", "fotografía", "fotogrametría" o "mapeo"
        if (cat.includes('foto') || cat.includes('cam') || cat.includes('mapeo')) 
            return { Icon: Camera, color: 'var(--color-warning)', bg: 'rgba(241, 190, 38, 0.1)' };
        
        if (cat.includes('segur')) 
            return { Icon: Shield, color: 'var(--color-danger)', bg: 'rgba(240, 37, 88, 0.1)' };
        
        if (cat.includes('entrega') || cat.includes('paquete')) 
            return { Icon: Package, color: 'var(--color-dark)', bg: 'rgba(44, 54, 94, 0.1)' };
        
        return { Icon: Target, color: 'var(--color-primary)', bg: 'rgba(4, 201, 166, 0.1)' };
    };

    const { Icon: MissionIcon, color: iconColor, bg: iconBg } = getMissionStyle(mision.categoria);

    const getBadgeColor = (estado) => {
        switch (estado) {
            case 'PENDIENTE': return 'warning';
            case 'ACEPTADA': return 'info';
            case 'EN_CURSO': return 'primary';
            case 'COMPLETADA': return 'success';
            case 'RECHAZADA':
            case 'CANCELADA': return 'danger';
            default: return 'dark';
        }
    };

    const cardStyle = {
        background: "var(--white)",
        borderRadius: "12px",
        border: mision.estado === 'EN_CURSO' ? "2px solid var(--color-primary)" : "1px solid var(--light-gray)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        position: "relative",
        boxShadow: mision.estado === 'EN_CURSO' ? "0 8px 25px rgba(4, 201, 166, 0.15)" : "0 4px 15px rgba(0,0,0,0.04)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
    };

    const hoverEffect = {
        onMouseEnter: (e) => {
            e.currentTarget.style.transform = "translateY(-5px)";
            e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,0.08)";
        },
        onMouseLeave: (e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = mision.estado === 'EN_CURSO' ? "0 8px 25px rgba(4, 201, 166, 0.15)" : "0 4px 15px rgba(0,0,0,0.04)";
        }
    };

    const specBoxStyle = {
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '10px', 
        background: 'var(--bg-color)', 
        padding: '12px', 
        borderRadius: '8px', 
        marginBottom: '16px',
    };

    return (
        <article style={cardStyle} {...hoverEffect}>
            
            <div style={{ padding: "20px 20px 0 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: iconBg, color: iconColor, padding: "10px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <MissionIcon size={24} strokeWidth={2} />
                    </div>
                    <div>
                        <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: 'bold', display: 'block' }}>ID: {mision.identificador || mision.id || 'N/A'}</span>
                        <h3 style={{ color: "var(--color-dark)", fontSize: "18px", margin: 0, fontWeight: "800", textTransform: "capitalize" }}>
                            {mision.categoria}
                        </h3>
                    </div>
                </div>
                <Badge text={mision.estado} color={getBadgeColor(mision.estado)} />
            </div>

            <div style={{ padding: "16px 20px 20px 20px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                {/* Texto completo sin truncar */}
                <p style={{ 
                    color: "var(--text-light)", 
                    fontSize: "13px", 
                    lineHeight: "1.5", 
                    margin: "0 0 16px 0", 
                    wordBreak: "break-word"
                }}>
                    {mision.descripcion || "Sin descripción adicional."}
                </p>

                <div style={specBoxStyle}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                        <MapPin size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ minWidth: 0 }}>
                            <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-light)', fontWeight: 'bold' }}>Ubicación</span>
                            <strong style={{ fontSize: '12px', color: 'var(--color-dark)', wordBreak: 'break-word', display: 'block' }} title={mision.ubicacion}>
                                {mision.ubicacion}
                            </strong>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                        <Calendar size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ minWidth: 0 }}>
                            <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-light)', fontWeight: 'bold' }}>Fecha</span>
                            <strong style={{ fontSize: '12px', color: 'var(--color-dark)', wordBreak: 'break-word' }}>{mision.fecha_programada}</strong>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', gridColumn: (!isPersonal && mision.cliente_nombre) ? 'span 1' : 'span 2' }}>
                        <Clock size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ minWidth: 0 }}>
                            <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-light)', fontWeight: 'bold' }}>Dron Asignado</span>
                            <strong style={{ fontSize: '12px', color: 'var(--color-dark)', wordBreak: 'break-word', display: 'block' }}>{mision.dron_asignado || 'N/A'}</strong>
                        </div>
                    </div>
                    
                    {/* Cliente solo si no es personal */}
                    {!isPersonal && mision.cliente_nombre && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                            <User size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div style={{ minWidth: 0 }}>
                                <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-light)', fontWeight: 'bold' }}>Cliente</span>
                                <strong style={{ fontSize: '12px', color: 'var(--color-dark)', wordBreak: 'break-word', display: 'block' }} title={mision.cliente_nombre}>
                                    {mision.cliente_nombre}
                                </strong>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: 'auto', borderTop: '1px solid var(--light-gray)', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {mision.estado === 'PENDIENTE' && (
                            <>
                                <Button variant="primary" size="sm" style={{ flex: 1, display: 'flex', gap: '6px' }} onClick={() => onStatusChange(mision.id, 'ACEPTADA')}>
                                    <Check size={16} /> Aceptar
                                </Button>
                                <Button variant="outline-danger" size="sm" style={{ flex: 1, display: 'flex', gap: '6px' }} onClick={() => onStatusChange(mision.id, 'RECHAZADA')}>
                                    <X size={16} /> Rechazar
                                </Button>
                            </>
                        )}
                        {mision.estado === 'ACEPTADA' && (
                            <Button variant="dark" size="sm" style={{ width: '100%', display: 'flex', gap: '6px' }} onClick={() => onStatusChange(mision.id, 'EN_CURSO')}>
                                <Play size={16} /> Iniciar Vuelo
                            </Button>
                        )}
                        {mision.estado === 'EN_CURSO' && (
                            <Button variant="success" size="sm" style={{ width: '100%', display: 'flex', gap: '6px' }} onClick={() => onStatusChange(mision.id, 'COMPLETADA')}>
                                <CheckCircle size={16} /> Completar Misión
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
};