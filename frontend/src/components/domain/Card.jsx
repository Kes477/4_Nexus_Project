import { useState, useEffect } from "react";
import { Check, Info, X } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { Button } from "../ui/Button";
import { getProducto } from "../../api/droneService";

const formatearPrecio = (precio) => {
    const num = Number(precio);
    if (isNaN(num)) return precio;
    return `L ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const FilaDetalle = ({ label, valor }) => {
    if (valor === null || valor === undefined || valor === '') return null;
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: '10px',
                fontSize: '13px',
                padding: '3px 0',
            }}
        >
            <span style={{ color: 'var(--text-light)' }}>{label}</span>
            <span style={{ color: 'var(--color-dark)', fontWeight: '600', textAlign: 'right' }}>
                {valor}
            </span>
        </div>
    );
};

const SectionTitle = ({ children }) => (
    <h4
        style={{
            color: 'var(--color-dark)',
            fontSize: '11px',
            margin: '0 0 6px 0',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontWeight: '700',
        }}
    >
        {children}
    </h4>
);

const GridDos = ({ children }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2px 25px' }}>
        {children}
    </div>
);

const DetalleContenido = ({ detalle }) => {
    const especificaciones = detalle.especificaciones || [];
    const articulo = detalle.articulo;
    const variantes = detalle.variantes || [];
    const suscripcion = detalle.suscripcion;

    const esSuscripcion = !!suscripcion;
    const mostrarDisponibilidad = !esSuscripcion;

    const tieneFichaTecnica = articulo && (
        articulo.marca || articulo.modelo || articulo.peso_kg ||
        articulo.dimensiones || articulo.tiempo_vuelo_max_min || articulo.alcance_max_km
    );

    return (
        <div>
            <div style={{ paddingRight: '40px', marginBottom: '10px' }}>
                <h2 style={{ color: 'var(--color-dark)', fontSize: '20px', margin: '0 0 3px 0' }}>
                    {detalle.nombre}
                </h2>
                {detalle.categoria && (
                    <span style={{ color: 'var(--text-light)', fontSize: '12px' }}>
                        {detalle.categoria}
                    </span>
                )}
            </div>

            {detalle.descripcion && (
                <p
                    style={{
                        color: 'var(--text-light)',
                        fontSize: '13px',
                        lineHeight: '1.5',
                        margin: '0 0 14px 0',
                    }}
                >
                    {detalle.descripcion}
                </p>
            )}

            {tieneFichaTecnica && (
                <section style={{ marginBottom: '14px' }}>
                    <SectionTitle>Ficha técnica</SectionTitle>
                    <GridDos>
                        <FilaDetalle label="Marca" valor={articulo.marca} />
                        <FilaDetalle label="Modelo" valor={articulo.modelo} />
                        <FilaDetalle label="Peso" valor={articulo.peso_kg ? `${articulo.peso_kg} kg` : null} />
                        <FilaDetalle label="Dimensiones" valor={articulo.dimensiones} />
                        <FilaDetalle label="Tiempo vuelo máx." valor={articulo.tiempo_vuelo_max_min ? `${articulo.tiempo_vuelo_max_min} min` : null} />
                        <FilaDetalle label="Alcance máx." valor={articulo.alcance_max_km ? `${articulo.alcance_max_km} km` : null} />
                    </GridDos>
                </section>
            )}

            {suscripcion && (
                <section style={{ marginBottom: '14px' }}>
                    <SectionTitle>Detalles de suscripción</SectionTitle>
                    <GridDos>
                        <FilaDetalle label="Periodo" valor={`${suscripcion.periodo_facturacion_dias} días`} />
                        <FilaDetalle label="Mantenimientos" valor={suscripcion.cantidad_mantenimientos_incluidos} />
                        <FilaDetalle label="Cobertura" valor={suscripcion.nivel_cobertura} />
                        <FilaDetalle label="Renovación" valor={suscripcion.renovacion_automatica ? 'Sí' : 'No'} />
                    </GridDos>
                </section>
            )}

            {especificaciones.length > 0 && (
                <section style={{ marginBottom: '14px' }}>
                    <SectionTitle>Especificaciones</SectionTitle>
                    <GridDos>
                        {especificaciones.map((esp, i) => (
                            <FilaDetalle key={i} label={esp.clave_espec} valor={esp.valor_espec} />
                        ))}
                    </GridDos>
                </section>
            )}

            {variantes.length > 0 && (
                <section style={{ marginBottom: '14px' }}>
                    <SectionTitle>{esSuscripcion ? 'Planes disponibles' : 'Variantes'}</SectionTitle>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {variantes.map((v) => (
                            <div
                                key={v.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    fontSize: '12px',
                                    padding: '5px 10px',
                                    background: 'var(--bg-color)',
                                    borderRadius: '6px',
                                }}
                            >
                                <span style={{ color: 'var(--color-dark)', fontWeight: '600', minWidth: '90px' }}>
                                    {v.sku}
                                </span>
                                <span style={{ color: 'var(--text-light)', flex: 1 }}>
                                    {v.atributos && v.atributos.length > 0
                                        ? v.atributos.map((a) => `${a.nombre_atributo}: ${a.valor_atributo}`).join(' · ')
                                        : ''}
                                </span>
                                <span style={{ color: 'var(--color-primary)', fontWeight: '700' }}>
                                    {formatearPrecio(v.precio)}
                                </span>
                                {mostrarDisponibilidad && (
                                    <span
                                        style={{
                                            fontSize: '10px',
                                            color: v.disponible ? '#27ae60' : '#c0392b',
                                            fontWeight: '700',
                                            minWidth: '62px',
                                            textAlign: 'right',
                                        }}
                                    >
                                        {v.disponible ? 'Disponible' : 'Sin stock'}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

const InfoModal = ({ productId, onClose }) => {
    const [detalle, setDetalle] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let activo = true;
        const fetchDetalle = async () => {
            try {
                const data = await getProducto(productId);
                if (activo) setDetalle(data);
            } catch {
                if (activo) setError('No se pudieron cargar los detalles del producto.');
            } finally {
                if (activo) setCargando(false);
            }
        };
        fetchDetalle();
        return () => { activo = false; };
    }, [productId]);

    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, []);

    useEffect(() => {
        const onEsc = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onEsc);
        return () => window.removeEventListener('keydown', onEsc);
    }, [onClose]);

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.55)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px',
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'var(--white)',
                    borderRadius: '12px',
                    padding: '22px 26px',
                    width: '100%',
                    maxWidth: '720px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    position: 'relative',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                }}
            >
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '14px',
                        right: '14px',
                        background: 'var(--bg-color)',
                        border: '1px solid var(--light-gray)',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'var(--color-dark)',
                        zIndex: 1,
                    }}
                    aria-label="Cerrar"
                >
                    <X size={16} />
                </button>

                {cargando && (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-light)' }}>
                        Cargando información...
                    </div>
                )}

                {error && (
                    <div style={{ textAlign: 'center', padding: '30px 20px', color: '#c0392b' }}>
                        {error}
                    </div>
                )}

                {detalle && <DetalleContenido detalle={detalle} />}
            </div>
        </div>
    );
};

const InfoButton = ({ onClick }) => (
    <button
        onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onClick();
        }}
        style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(255,255,255,0.95)',
            border: '1px solid var(--light-gray)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 20,
            color: 'var(--color-dark)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-primary)';
            e.currentTarget.style.color = 'var(--white)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.95)';
            e.currentTarget.style.color = 'var(--color-dark)';
        }}
        aria-label="Ver información detallada"
        title="Ver información detallada"
    >
        <Info size={16} />
    </button>
);

export const ServiceCard = ({ service, onSuscribir }) => {
    const Icon = service.icon;
    const navigate = useNavigate();
    const [modalAbierto, setModalAbierto] = useState(false);

    return (
        <>
            <article
                style={{
                    background: "var(--white)",
                    padding: "20px",
                    borderRadius: "10px",
                    border: service.destacado ? "2px solid var(--color-primary)" : "1px solid var(--light-gray)",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    position: "relative",
                    boxShadow: service.destacado ? "0 10px 30px rgba(4, 201, 166, 0.15)" : "0 4px 15px rgba(0,0,0,0.03)",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow = "0 15px 35px rgba(0,0,0,0.08)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = service.destacado ? "0 10px 30px rgba(4, 201, 166, 0.15)" : "0 4px 15px rgba(0,0,0,0.03)";
                }}
            >
                {service.id && <InfoButton onClick={() => setModalAbierto(true)} />}

                {service.destacado && (
                    <span style={{
                        position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)",
                        background: "var(--color-primary)", color: "var(--white)",
                        padding: "2px 12px", borderRadius: "20px", fontSize: "10px", fontWeight: "bold",
                        textTransform: "uppercase", letterSpacing: "1px", zIndex: 10
                    }}>
                        Recomendado
                    </span>
                )}

                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "15px",
                    paddingRight: "35px",
                }}>
                    <div style={{
                        background: "rgba(4, 201, 166, 0.1)", color: "var(--color-primary)",
                        padding: "10px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                        <Icon size={20} strokeWidth={2} />
                    </div>
                    <span style={{ color: "var(--light-gray)", fontSize: "24px", fontWeight: "900", fontFamily: "monospace" }}>
                        {service.number}
                    </span>
                </div>

                <h3 style={{ color: "var(--color-dark)", fontSize: "18px", margin: "0 0 8px 0", fontWeight: "800" }}>
                    {service.title}
                </h3>
                <p style={{ color: "var(--text-light)", fontSize: "13px", lineHeight: "1.5", margin: "0 0 15px 0" }}>
                    {service.description}
                </p>

                <div style={{ marginBottom: "15px", borderBottom: "1px solid var(--light-gray)", paddingBottom: "15px" }}>
                    <span style={{ fontSize: "28px", fontWeight: "900", color: "var(--color-dark)" }}>
                        {service.price}
                    </span>
                    <span style={{ fontSize: "13px", color: "var(--text-light)", marginLeft: "5px" }}>
                        {service.period}
                    </span>
                </div>

                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px 0", display: "flex", flexDirection: "column", gap: "8px", flexGrow: 1 }}>
                    {service.features.map((feature, i) => (
                        <li key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--color-dark)" }}>
                            <div style={{ background: "rgba(4, 201, 166, 0.15)", padding: "3px", borderRadius: "50%", display: "flex" }}>
                                <Check size={12} color="var(--color-primary)" strokeWidth={3} />
                            </div>
                            {feature}
                        </li>
                    ))}
                </ul>

                <Button
                    variant={service.destacado ? "primary" : "outline-dark"}
                    style={{ width: "100%", padding: "10px" }}
                    onClick={() => (onSuscribir ? onSuscribir() : navigate('/login'))}
                >
                    Seleccionar
                </Button>
            </article>

            {modalAbierto && (
                <InfoModal productId={service.id} onClose={() => setModalAbierto(false)} />
            )}
        </>
    );
};

export const ProductCard = ({ product, onCotizar }) => {
    const navigate = useNavigate();
    const [modalAbierto, setModalAbierto] = useState(false);

    return (
        <>
            <article
                style={{
                    background: "var(--white)",
                    borderRadius: "10px",
                    border: product.destacado ? "2px solid var(--color-primary)" : "1px solid var(--light-gray)",
                    overflow: "visible",
                    display: "flex",
                    flexDirection: "column",
                    height: "95%",
                    position: "relative",
                    boxShadow: product.destacado ? "0 10px 30px rgba(4, 201, 166, 0.15)" : "0 4px 15px rgba(0,0,0,0.03)",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow = "0 15px 35px rgba(0,0,0,0.08)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = product.destacado ? "0 10px 30px rgba(4, 201, 166, 0.15)" : "0 4px 15px rgba(0,0,0,0.03)";
                }}
            >
                {product.id && <InfoButton onClick={() => setModalAbierto(true)} />}

                {product.destacado && (
                    <span style={{
                        position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)",
                        background: "var(--color-primary)", color: "var(--white)",
                        padding: "2px 12px", borderRadius: "20px", fontSize: "10px", fontWeight: "bold",
                        textTransform: "uppercase", letterSpacing: "1px", zIndex: 10
                    }}>
                        Recomendado
                    </span>
                )}

                <div style={{
                    position: "relative",
                    height: "170px",
                    background: "var(--bg-color)",
                    overflow: "hidden",
                    borderTopLeftRadius: product.destacado ? "8px" : "9px",
                    borderTopRightRadius: product.destacado ? "8px" : "9px"
                }}>
                    <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                    />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 40%)" }} />
                </div>

                <div style={{ padding: "20px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                    <span style={{ color: "var(--text-light)", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "5px" }}>
                        {product.category}
                    </span>
                    <h3 style={{ color: "var(--color-dark)", fontSize: "18px", margin: "0 0 8px 0", fontWeight: "800" }}>
                        {product.name}
                    </h3>
                    <p
                        style={{
                            color: "var(--text-light)",
                            fontSize: "13px",
                            lineHeight: "1.5",
                            margin: "0 0 15px 0",
                            flexGrow: 1,
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                        }}
                        title={product.description}
                    >
                        {product.description}
                    </p>

                    <div style={{ marginBottom: "15px", borderBottom: "1px solid var(--light-gray)", paddingBottom: "15px" }}>
                        <span style={{ fontSize: "10px", color: "var(--text-light)", fontWeight: "bold", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                            Precio
                        </span>

                        <span style={{ fontSize: "18px", fontWeight: "800", color: "var(--color-dark)" }}>
                            {product.price}
                        </span>
                    </div>

                    <Button
                        variant={product.destacado ? "primary" : "outline-dark"}
                        style={{ width: "100%", padding: "10px" }}
                        onClick={() => (onCotizar ? onCotizar() : navigate('/formulario-contacto'))}
                    >
                        Cotizar Equipo
                    </Button>
                </div>
            </article>

            {modalAbierto && (
                <InfoModal productId={product.id} onClose={() => setModalAbierto(false)} />
            )}
        </>
    );
};