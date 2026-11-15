import { Check, Plane, Battery, Clock, ShoppingBag, Wrench, Zap, Navigation, Star, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import Badge from '../ui/Badge';
import Stars from '../ui/Stars';

/* =========================================================
   TARJETA DE SERVICIO / SUSCRIPCIÓN (ItemServiceCard) - COMPACTA
   ========================================================= */
export const ItemServiceCard = ({ item, onAction }) => {
    const Icon = item.icon || Star;
    const navigate = useNavigate();

    const handleAction = () => {
        if (onAction) {
            onAction(item);
        } else {
            navigate('/login');
        }
    };

    return (
        <article
            style={{
                background: "var(--white)",
                padding: "20px", // Reducido de 24px
                borderRadius: "12px", // Reducido de 16px
                border: item.destacado ? "2px solid var(--color-primary)" : "1px solid var(--light-gray)",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                position: "relative",
                boxShadow: item.destacado ? "0 8px 25px rgba(4, 201, 166, 0.15)" : "0 4px 15px rgba(0,0,0,0.04)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,0.08)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = item.destacado ? "0 8px 25px rgba(4, 201, 166, 0.15)" : "0 4px 15px rgba(0,0,0,0.04)";
            }}
        >
            {item.destacado && (
                <span style={{
                    position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)",
                    background: "var(--color-primary)", color: "var(--white)",
                    padding: "3px 12px", borderRadius: "20px", fontSize: "10px", fontWeight: "bold",
                    textTransform: "uppercase", letterSpacing: "1px", boxShadow: "0 2px 8px rgba(4, 201, 166, 0.4)"
                }}>
                    Recomendado
                </span>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div style={{
                    background: "rgba(4, 201, 166, 0.1)", color: "var(--color-primary)",
                    padding: "10px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                    <Icon size={20} strokeWidth={2} />
                </div>
                <span style={{ color: "var(--light-gray)", fontSize: "22px", fontWeight: "900", fontFamily: "monospace" }}>
                    {item.number || '01'}
                </span>
            </div>

            <h3 style={{ color: "var(--color-dark)", fontSize: "18px", margin: "0 0 6px 0", fontWeight: "800" }}>
                {item.title || item.name}
            </h3>
            
            <p style={{ 
                color: "var(--text-light)", 
                fontSize: "13px", 
                lineHeight: "1.5", 
                margin: "0 0 16px 0",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                minHeight: "58px"
            }}>
                {item.description || item.descripcion_corta}
            </p>

            <div style={{ marginBottom: "16px", borderBottom: "1px solid var(--light-gray)", paddingBottom: "16px" }}>
                <span style={{ fontSize: "26px", fontWeight: "900", color: "var(--color-dark)" }}>
                    {item.price?.toString().startsWith('L') ? item.price : `L ${item.price}`}
                </span>
                <span style={{ fontSize: "13px", color: "var(--text-light)", marginLeft: "4px", fontWeight: "500" }}>
                    {item.period}
                </span>
            </div>

            {item.tags && item.tags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
                    {item.tags.map((tag, i) => (
                        <span key={i} style={{
                            backgroundColor: "rgba(4, 201, 166, 0.1)", color: "var(--color-primary)",
                            padding: "2px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: "bold",
                            display: "flex", alignItems: "center", gap: "4px"
                        }}>
                            <Sparkles size={10} /> {tag}
                        </span>
                    ))}
                </div>
            )}

            {item.features && item.features.length > 0 && (
                <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", marginBottom: "16px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "bold", color: "var(--text-light)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px", display: "block" }}>
                        Beneficios:
                    </span>
                    
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                        {item.features.map((feature, i) => (
                            <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13px", color: "var(--color-dark)" }}>
                                <div style={{ background: "rgba(4, 201, 166, 0.15)", padding: "3px", borderRadius: "50%", display: "flex", marginTop: "2px" }}>
                                    <Check size={12} color="var(--color-primary)" strokeWidth={3} />
                                </div>
                                <span style={{ lineHeight: "1.4" }}>{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div style={{ marginTop: "auto" }}>
                <Button 
                    variant={item.destacado ? "primary" : "outline-dark"} 
                    style={{ width: "100%", padding: "10px", fontSize: "14px", fontWeight: "bold" }}
                    onClick={handleAction}
                >
                    Seleccionar Plan
                </Button>
            </div>
        </article>
    );
};


/* =========================================================
   TARJETA DE PRODUCTO / DRON (ItemProductCard) - COMPACTA
   ========================================================= */
export const ItemProductCard = ({ item, mode = 'catalog', onAction }) => {
    const navigate = useNavigate();
    const isOwned = mode === 'owned';

    const handleAction = () => {
        if (onAction) {
            onAction(item);
        } else {
            navigate('/formulario-contacto');
        }
    };

    const cardStyle = {
        background: "var(--white)",
        borderRadius: "12px",
        border: item.destacado ? "2px solid var(--color-primary)" : "1px solid var(--light-gray)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%", 
        position: "relative",
        boxShadow: item.destacado ? "0 8px 25px rgba(4, 201, 166, 0.15)" : "0 4px 15px rgba(0,0,0,0.04)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
    };

    const hoverEffect = {
        onMouseEnter: (e) => {
            e.currentTarget.style.transform = "translateY(-5px)";
            e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,0.08)";
        },
        onMouseLeave: (e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = item.destacado ? "0 8px 25px rgba(4, 201, 166, 0.15)" : "0 4px 15px rgba(0,0,0,0.04)";
        }
    };

    const specBoxStyle = {
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '10px', 
        background: 'var(--bg-color)', 
        padding: '12px', 
        borderRadius: '8px', 
        marginBottom: '16px' 
    };

    const title = item.title || item.name || item.nombre;
    const description = item.description || item.descripcion_corta || item.desc;
    const image = item.image || item.imagen;
    const price = item.price || item.precio;
    const category = item.category || item.categoria;

    return (
        <article style={cardStyle} {...hoverEffect}>
            
            {isOwned ? (
                <div style={{ padding: "20px 20px 0 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ background: "rgba(4, 201, 166, 0.1)", color: "var(--color-primary)", padding: "10px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Plane size={24} strokeWidth={2} />
                    </div>
                    <Badge text={item.estado || 'Operativo'} color={item.estado === 'Operativo' ? 'success' : 'warning'} />
                </div>
            ) : (
                <div style={{ position: "relative", height: "160px", background: "var(--bg-color)", overflow: "hidden" }}>
                    <img
                        src={image || 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=600&auto=format&fit=crop'}
                        alt={title}
                        loading="lazy"
                        style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.08)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                    />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 40%)" }} />
                    
                    <span style={{ position: "absolute", top: "12px", left: "12px", background: "rgba(255, 255, 255, 0.95)", color: "var(--color-primary)", padding: "4px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", backdropFilter: "blur(4px)" }}>
                        {category}
                    </span>

                    {(item.isNew || item.es_nuevo) && (
                        <div style={{ position: "absolute", top: "12px", right: "12px" }}>
                            <Badge text="Nuevo" color="warning" />
                        </div>
                    )}
                </div>
            )}

            <div style={{ padding: "16px 20px 20px 20px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                
                <h3 style={{ color: "var(--color-dark)", fontSize: "18px", margin: "0 0 6px 0", fontWeight: "800", textAlign: isOwned ? 'center' : 'left' }}>
                    {title}
                </h3>

                <p style={{ 
                    color: "var(--text-light)", 
                    fontSize: "13px", 
                    lineHeight: "1.5", 
                    margin: "0 0 12px 0", 
                    textAlign: isOwned ? 'center' : 'left',
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    minHeight: "58px"
                }}>
                    {isOwned ? `Modelo: ${item.modelo || description}` : description}
                </p>

                {isOwned ? (
                    <div style={specBoxStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Battery size={16} color="var(--color-primary)" />
                            <div>
                                <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-light)', fontWeight: 'bold' }}>Batería</span>
                                <strong style={{ fontSize: '12px', color: 'var(--color-dark)' }}>{item.bateria}%</strong>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={16} color="var(--color-primary)" />
                            <div>
                                <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-light)', fontWeight: 'bold' }}>Horas vuelo</span>
                                <strong style={{ fontSize: '12px', color: 'var(--color-dark)' }}>{item.horas} hrs</strong>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Stars rating={item.rating || 5} />
                            <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 'bold' }}>({item.reviews || 12})</span>
                        </div>
                        
                        <div style={specBoxStyle}>
                            <div>
                                <span style={{ display: 'block', fontSize: '9px', color: 'var(--text-light)', fontWeight: 'bold', textTransform: 'uppercase' }}>Categoría</span>
                                <strong style={{ fontSize: '11px', color: 'var(--color-dark)' }}>{category || 'General'}</strong>
                            </div>
                            <div>
                                <span style={{ display: 'block', fontSize: '9px', color: 'var(--text-light)', fontWeight: 'bold', textTransform: 'uppercase' }}>Autonomía</span>
                                <strong style={{ fontSize: '11px', color: 'var(--color-dark)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                    <Battery size={12} color="var(--color-primary)" /> {item.battery || '45 min'}
                                </strong>
                            </div>
                            <div>
                                <span style={{ display: 'block', fontSize: '9px', color: 'var(--text-light)', fontWeight: 'bold', textTransform: 'uppercase' }}>Velocidad</span>
                                <strong style={{ fontSize: '11px', color: 'var(--color-dark)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                    <Zap size={12} color="var(--color-primary)" /> {item.speed || '15 m/s'}
                                </strong>
                            </div>
                            <div>
                                <span style={{ display: 'block', fontSize: '9px', color: 'var(--text-light)', fontWeight: 'bold', textTransform: 'uppercase' }}>Alcance</span>
                                <strong style={{ fontSize: '11px', color: 'var(--color-dark)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                    <Navigation size={12} color="var(--color-primary)" /> {item.range || '10 km'}
                                </strong>
                            </div>
                        </div>
                    </>
                )}

                <div style={{ marginTop: 'auto', borderTop: '1px solid var(--light-gray)', paddingTop: '16px' }}>
                    
                    {!isOwned && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
                            <div>
                                <span style={{ fontSize: "10px", color: "var(--text-light)", fontWeight: "bold", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>
                                    Precio
                                </span>
                                <span style={{ fontSize: "22px", fontWeight: "900", color: "var(--color-dark)" }}>
                                    {price?.toString().startsWith('L') ? price : `L ${price}`}
                                </span>
                            </div>
                            {item.stock && (
                                <span style={{ fontSize: '10px', color: 'var(--color-success)', fontWeight: 'bold', backgroundColor: 'rgba(4, 201, 166, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                                    {item.stock} disp.
                                </span>
                            )}
                        </div>
                    )}

                    <Button 
                        variant={item.destacado ? "primary" : (isOwned ? "outline-primary" : "outline-dark")} 
                        style={{ width: "100%", padding: "10px", fontSize: "14px", fontWeight: "bold", display: "flex", justifyContent: "center", gap: "6px" }}
                        onClick={handleAction}
                    >
                        {isOwned ? (
                            <><Wrench size={16} /> Ayuda Técnica</>
                        ) : (
                            <><ShoppingBag size={16} /> Cotizar Equipo</>
                        )}
                    </Button>
                </div>

            </div>
        </article>
    );
};