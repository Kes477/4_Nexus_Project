import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Wrench, Cpu, Plane, User, Shield, Zap, Drone,
    ChevronLeft, ChevronRight, ArrowRight,
} from 'lucide-react';
import { Navbar, Footer } from '../components/layout';
import { Button } from '../components/ui';
import { ServiceCard, ProductCard } from '../components/domain/Card';
import { getProductos } from '../api/droneService'; 

// ============================================================================
// ==== PATRÓN ADAPTER ====
// Traduce los DTOs del backend (ARTICULO / SUSCRIPCION) al view-model
// que consumen ProductCard y ServiceCard. Desacopla la vista del contrato API.
// ============================================================================

const DEFAULT_DRONE_IMG =
    'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=600&auto=format&fit=crop';

const formatPrice = (precioDesde) =>
    precioDesde
        ? `L ${Number(precioDesde).toLocaleString('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
          })}`
        : 'Consultar';

const adaptEquipoToProduct = (dron) => ({
    id: dron.id,
    name: dron.nombre,
    label: 'Equipo',
    category: dron.marca || dron.categoria || 'Dron',
    icon: Drone,
    image: dron.imagen_principal || DEFAULT_DRONE_IMG,
    price: formatPrice(dron.precio_desde),
    description: dron.descripcion || 'Sin descripción disponible.',
});

const adaptSuscripcionToService = (sub, idx) => ({
    number: String(idx + 1).padStart(2, '0'),
    icon: idx % 2 === 0 ? Shield : Zap,
    title: sub.nombre,
    description: sub.descripcion || 'Plan de servicios aéreos.',
    price: formatPrice(sub.precio_desde),
    period: '/mes',
    destacado: idx === 1,
    features: ['Soporte técnico', 'Acceso a plataforma', 'Reportes mensuales'],
});

// URLs para la galería automática del Hero
const HERO_IMAGES = [
    "https://storage.googleapis.com/cursopractica-imagenes-2026/img_drones/Autel_EVO_II_Pro_V3_4_3.png",
    "https://storage.googleapis.com/cursopractica-imagenes-2026/img_drones/Autel_EVO_Nano%2B_4_3.png",
    "https://storage.googleapis.com/cursopractica-imagenes-2026/img_drones/DJI_Air_3_4_3.png",
    "https://storage.googleapis.com/cursopractica-imagenes-2026/img_drones/DJI_Inspire_3_4_3.png",
    "https://storage.googleapis.com/cursopractica-imagenes-2026/img_drones/DJI_Mavic_Air_2S_4_3.png"
];

const scrollAnchorStyle = { scrollMarginTop: '80px' };
const paddingLarge = { padding: '120px 20px', width: '100%' };
const paddingCatalog = { padding: '20px 20px', width: '100%' };
const paddingNormal = { padding: '30px 20px', width: '100%' };
const containerStyle = { maxWidth: '1400px', margin: '0 auto', padding: '0 20px' };
const titleStyle = { fontSize: '36px', color: 'var(--color-dark)', lineHeight: '1.2', marginBottom: '20px' };
const subtitleStyle = { color: 'var(--text-light)', fontSize: '18px', marginBottom: '30px' };

const HeroSection = ({ onSolicitar, onExplorarEquipos }) => {
    const [currentImage, setCurrentImage] = useState(0);

    useEffect(() => {
        // Cambiar de imagen cada 3.5 segundos
        const interval = setInterval(() => {
            setCurrentImage((prev) => (prev + 1) % HERO_IMAGES.length);
        }, 3500);
        return () => clearInterval(interval);
    }, []);

    return (
        <section id="inicio" style={{ ...paddingLarge, background: 'var(--white)', ...scrollAnchorStyle }}>
            <div style={{ ...containerStyle, display: 'flex', flexWrap: 'wrap', gap: '50px', alignItems: 'center' }}>
                <div style={{ flex: '1 1 500px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                        <span style={{ color: 'var(--text-light)', fontSize: '13px', letterSpacing: '1.5px', fontWeight: 'bold' }}>
                            CENTRO DE INGENIERÍA Y SOPORTE AÉREO
                        </span>
                    </div>
                    <h1 style={titleStyle}>
                        La tecnología vuela. <br />
                        <span style={{ color: 'var(--color-primary)' }}>Nosotros la mantenemos.</span>
                    </h1>
                    <p style={{ ...subtitleStyle, maxWidth: '550px' }}>
                        Soluciones técnicas para drones profesionales. Diagnóstico, mantenimiento especializado y equipos para llevar cada operación más lejos.
                    </p>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '40px' }}>
                        <Button variant="primary" onClick={onSolicitar}>Enviar una consulta</Button>
                        <Button variant="outline-dark" onClick={onExplorarEquipos}>Explorar equipos</Button>
                    </div>
                </div>

                <div style={{ flex: '1 1 500px', position: 'relative' }}>
                    
                    {/* GALERÍA AUTOMÁTICA */}
                    <div style={{ 
                        width: '100%', 
                        height: '450px', 
                        borderRadius: '16px', 
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)', 
                        position: 'relative', 
                        overflow: 'hidden',
                        backgroundColor: 'var(--bg-color)' // Fondo por si las imágenes tienen transparencias
                    }}>
                        {HERO_IMAGES.map((img, index) => (
                            <img
                                key={index}
                                src={img}
                                alt={`Dron ${index + 1}`}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    opacity: currentImage === index ? 1 : 0,
                                    transition: 'opacity 1s ease-in-out',
                                    zIndex: currentImage === index ? 1 : 0,
                                }}
                            />
                        ))}
                    </div>

                    {/* Tarjetas Flotantes (Z-index para que estén por encima de las imágenes) */}
                    <div className="floating-card" style={{ top: '30px', left: '-20px', zIndex: 10 }}>
                        <div style={{ background: 'var(--bg-color)', padding: '10px', borderRadius: '8px' }}>
                            <Wrench size={20} color="var(--color-primary)" />
                        </div>
                        <div>
                            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-light)', fontWeight: 'bold' }}>ENFOQUE</span>
                            <span style={{ display: 'block', color: 'var(--color-dark)', fontWeight: 'bold', fontSize: '14px' }}>Precisión técnica</span>
                        </div>
                    </div>
                    <div className="floating-card" style={{ bottom: '30px', right: '-20px', zIndex: 10 }}>
                        <div style={{ background: 'var(--bg-color)', padding: '10px', borderRadius: '8px' }}>
                            <Cpu size={20} color="var(--color-primary)" />
                        </div>
                        <div>
                            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-light)', fontWeight: 'bold' }}>ESPECIALIDAD</span>
                            <span style={{ display: 'block', color: 'var(--color-dark)', fontWeight: 'bold', fontSize: '14px' }}>Sistemas aéreos</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const AboutSection = () => (
    <section id="nosotros" style={{ ...paddingLarge, background: 'var(--bg-color)', borderTop: '1px solid var(--light-gray)', ...scrollAnchorStyle }}>
        <div style={containerStyle}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                <h2 style={titleStyle}>Expertos en ingeniería aérea</h2>
                <p style={{ ...subtitleStyle, maxWidth: '600px', margin: '0 auto' }}>
                    Combinamos hardware de vanguardia con soporte técnico especializado.
                </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
                {[
                    { icon: <Wrench size={24} />, title: 'Servicio técnico', desc: 'Diagnóstico y mantenimiento preventivo para extender la vida útil de tu equipo.' },
                    { icon: <Cpu size={24} />, title: 'Ingeniería aplicada', desc: 'Reparación especializada de componentes electrónicos y calibración.' },
                    { icon: <Plane size={24} />, title: 'Equipos profesionales', desc: 'Soluciones de hardware adaptadas a las exigencias de cada operación.' },
                    { icon: <User size={24} />, title: 'Atención personalizada', desc: 'Orientación experta y acompañamiento según los objetivos de tu proyecto.' },
                ].map((item, idx) => (
                    <div
                        key={idx}
                        style={{
                            background: 'var(--white)',
                            padding: '40px 30px',
                            borderRadius: '12px',
                            border: '1px solid var(--light-gray)',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '15px',
                        }}
                    >
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(4, 201, 166, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                            {item.icon}
                        </div>
                        <h4 style={{ color: 'var(--color-dark)', margin: 0, fontSize: '20px' }}>{item.title}</h4>
                        <p style={{ color: 'var(--text-light)', margin: 0, fontSize: '15px', lineHeight: '1.6' }}>{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

const CatalogoSection = ({
    pestana,
    onPestanaChange,
    cargando,
    suscripciones,
    equipos,
    onCotizar,
    onSuscribir,
    onVerTodosSuscripciones,
    onVerTodosEquipos,
}) => {
    const suscripcionesRef = useRef(null);
    const equiposRef = useRef(null);

    const handleScroll = (ref, direction) => {
        if (ref.current) {
            const scrollAmount = ref.current.offsetWidth * 0.35;
            ref.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    const carruselContainerStyle = {
        display: 'flex',
        flexWrap: 'nowrap',
        overflowX: 'auto',
        gap: '20px',
        padding: '20px 0',
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch',
        scrollBehavior: 'smooth',
    };

    const carruselItemStyle = {
        flex: '0 0 calc(25% - 15px)',
        minWidth: '260px',
        scrollSnapAlign: 'start',
    };

    const navButtonStyle = {
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 10,
        width: '45px',
        height: '45px',
        borderRadius: '50%',
        background: 'var(--white)',
        border: '1px solid var(--light-gray)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'var(--color-dark)',
        transition: 'all 0.2s ease',
    };

    const verMasButtonStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        padding: '8px 16px',
        borderRadius: '20px',
        border: '1px solid var(--color-primary)',
        background: 'var(--white)',
        color: 'var(--color-primary)',
        fontSize: '13px',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
    };

    const verTodosLabel = pestana === 'subs' ? 'Ver todos los planes' : 'Ver todos los equipos';
    const verTodosHandler = pestana === 'subs' ? onVerTodosSuscripciones : onVerTodosEquipos;
    const hayDatos = pestana === 'subs' ? suscripciones.length > 0 : equipos.length > 0;

    return (
        <section id="catalogo" style={{ ...paddingCatalog, background: 'var(--white)', ...scrollAnchorStyle }}>
            <div style={containerStyle}>
                
                <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative' }}>
                    
                    <div style={{ marginBottom: '30px' }}>
                        <h2 style={{ ...titleStyle, textAlign: 'center' }}>Nuestros Planes y Equipos</h2>
                        
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: '15px',
                                width: '100%',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    background: 'var(--bg-color)',
                                    padding: '6px',
                                    borderRadius: '10px',
                                    border: '1px solid var(--light-gray)',
                                }}
                            >
                                <button
                                    className={`tab-btn ${pestana === 'subs' ? 'active' : ''}`}
                                    onClick={() => onPestanaChange('subs')}
                                    style={{ padding: '12px 30px', fontSize: '15px' }}
                                >
                                    Suscripciones
                                </button>
                                <button
                                    className={`tab-btn ${pestana === 'equipos' ? 'active' : ''}`}
                                    onClick={() => onPestanaChange('equipos')}
                                    style={{ padding: '12px 30px', fontSize: '15px' }}
                                >
                                    Equipos
                                </button>
                            </div>

                            <div>
                                {!cargando && hayDatos && (
                                    <button
                                        style={verMasButtonStyle}
                                        onClick={verTodosHandler}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'var(--color-primary)';
                                            e.currentTarget.style.color = 'var(--white)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'var(--white)';
                                            e.currentTarget.style.color = 'var(--color-primary)';
                                        }}
                                    >
                                        {verTodosLabel} <ArrowRight size={13} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        {cargando ? (
                            <div style={{ textAlign: 'center', padding: '50px' }}>
                                <p style={{ color: 'var(--text-light)' }}>Cargando catálogo...</p>
                            </div>
                        ) : (
                            <>
                                {pestana === 'subs' && suscripciones.length > 4 && (
                                    <>
                                        <button className="nav-btn" style={{ ...navButtonStyle, left: '-20px' }} onClick={() => handleScroll(suscripcionesRef, 'left')}>
                                            <ChevronLeft size={24} />
                                        </button>
                                        <button className="nav-btn" style={{ ...navButtonStyle, right: '-20px' }} onClick={() => handleScroll(suscripcionesRef, 'right')}>
                                            <ChevronRight size={24} />
                                        </button>
                                    </>
                                )}

                                {pestana === 'equipos' && equipos.length > 4 && (
                                    <>
                                        <button className="nav-btn" style={{ ...navButtonStyle, left: '-20px' }} onClick={() => handleScroll(equiposRef, 'left')}>
                                            <ChevronLeft size={24} />
                                        </button>
                                        <button className="nav-btn" style={{ ...navButtonStyle, right: '-20px' }} onClick={() => handleScroll(equiposRef, 'right')}>
                                            <ChevronRight size={24} />
                                        </button>
                                    </>
                                )}

                                {pestana === 'subs' ? (
                                    suscripciones.length > 0 ? (
                                        <div ref={suscripcionesRef} className="carrusel-scroll" style={carruselContainerStyle}>
                                            {suscripciones.map((s) => (
                                                <div key={s.title} style={carruselItemStyle}>
                                                    <ServiceCard service={s} onSuscribir={onSuscribir} />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '50px' }}>
                                            <p style={{ color: 'var(--text-light)' }}>No hay suscripciones disponibles por el momento.</p>
                                        </div>
                                    )
                                ) : (
                                    equipos.length > 0 ? (
                                        <div ref={equiposRef} className="carrusel-scroll" style={carruselContainerStyle}>
                                            {equipos.map((e) => (
                                                <div key={e.id} style={carruselItemStyle}>
                                                    <ProductCard product={e} onCotizar={onCotizar} />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '50px' }}>
                                            <p style={{ color: 'var(--text-light)' }}>No hay equipos disponibles en el catálogo por el momento.</p>
                                        </div>
                                    )
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

const ProcesoSection = () => (
    <section id="proceso" style={{ ...paddingLarge, background: 'var(--bg-color)', borderTop: '1px solid var(--light-gray)', ...scrollAnchorStyle }}>
        <div style={containerStyle}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                <span style={{ color: 'var(--color-primary)', fontSize: '13px', letterSpacing: '1.5px', fontWeight: 'bold', display: 'block', marginBottom: '15px' }}>
                    ASÍ TRABAJAMOS
                </span>
                <h2 style={titleStyle}>
                    Un proceso claro.<br />
                    <span style={{ color: 'var(--color-primary)' }}>De principio a solución.</span>
                </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px' }}>
                {[
                    { num: '01', title: 'Nos contactas', desc: 'Cuéntanos qué equipo tienes y qué necesitas resolver en tu operación.' },
                    { num: '02', title: 'Evaluamos', desc: 'Revisamos la información técnica y definimos el alcance del diagnóstico.' },
                    { num: '03', title: 'Proponemos', desc: 'Te presentamos los hallazgos detallados y las alternativas disponibles.' },
                    { num: '04', title: 'Damos seguimiento', desc: 'Te mantenemos informado paso a paso sobre los siguientes avances.' },
                ].map((step, idx) => (
                    <div key={idx} style={{ position: 'relative', paddingTop: '25px' }}>
                        <div style={{ width: '100%', height: '2px', background: 'var(--light-gray)', position: 'absolute', top: 0, left: 0 }} />
                        <div style={{ width: '50px', height: '50px', borderRadius: '50%', border: '2px solid var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', background: 'var(--white)', zIndex: 2, position: 'relative' }}>
                            {step.num}
                        </div>
                        <h4 style={{ color: 'var(--color-dark)', fontSize: '20px', marginBottom: '10px' }}>{step.title}</h4>
                        <p style={{ color: 'var(--text-light)', fontSize: '15px', lineHeight: '1.6' }}>{step.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

const ContactoSection = ({ onContactar }) => (
    <section id="contacto" style={{ ...paddingNormal, background: 'var(--white)', ...scrollAnchorStyle }}>
        <div style={{ ...containerStyle, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '30px' }}>
            <div style={{ flex: '1 1 500px' }}>
                <span style={{ color: 'var(--color-primary)', fontSize: '13px', letterSpacing: '1.5px', fontWeight: 'bold', display: 'block', marginBottom: '15px' }}>
                    HABLEMOS DE TU PROYECTO
                </span>
                <h2 style={titleStyle}>
                    Tu próximo vuelo<br />
                    empieza con una <span style={{ color: 'var(--color-primary)', fontSize: 'inherit' }}>buena decisión.</span>
                </h2>
                <p style={{ ...subtitleStyle, maxWidth: '500px' }}>
                    Cuéntanos qué necesitas. Estamos listos para orientarte y llevar tu operación al siguiente nivel.
                </p>
                <Button variant="primary" onClick={onContactar}>Contactar con 4 Nexus</Button>
            </div>
            <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '200px', height: '200px', borderRadius: '50%', border: '2px solid var(--light-gray)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '120px', height: '120px', borderRadius: '50%', border: '2px solid var(--light-gray)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Drone size={50} color="var(--color-primary)" style={{ opacity: 0.8 }} />
                    </div>
                </div>
            </div>
        </div>
    </section>
);

const LandingPage = () => {
    const navigate = useNavigate();
    const [pestanaCatalogo, setPestanaCatalogo] = useState('subs');
    const [drones, setDrones] = useState([]);
    const [suscripciones, setSuscripciones] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const handleHashChange = () => {
            if (window.location.hash === '#suscripciones' || window.location.hash === '#equipos') {
                setPestanaCatalogo(window.location.hash === '#suscripciones' ? 'subs' : 'equipos');
                const catalogoSection = document.getElementById('catalogo');
                if (catalogoSection) catalogoSection.scrollIntoView({ behavior: 'smooth' });
            }
        };
        handleHashChange();
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    useEffect(() => {
        const fetchProductos = async () => {
            try {
                const data = await getProductos();
                setDrones(data.filter((item) => item.tipo_producto === 'ARTICULO'));
                setSuscripciones(data.filter((item) => item.tipo_producto === 'SUSCRIPCION'));
            } catch (error) {
                console.error('Error al traer los productos:', error);
            } finally {
                setCargando(false);
            }
        };
        fetchProductos();
    }, []);

    const goToContacto = () => navigate('/formulario-contacto');
    const goToLogin = () => navigate('/login');
    const goToCatalog = () => navigate('/catalog');
    const goToSuscription = () => navigate('/suscription');

    const equiposFormateados = drones.map(adaptEquipoToProduct);
    const suscripcionesFormateadas = suscripciones.map(adaptSuscripcionToService);

    return (
        <div style={{ background: 'var(--bg-color)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <style>
                {`
                    .carrusel-scroll::-webkit-scrollbar { display: none; }
                    .carrusel-scroll { -ms-overflow-style: none; scrollbar-width: none; }
                    .nav-btn:hover { background: var(--bg-color) !important; transform: translateY(-50%) scale(1.05) !important; }
                `}
            </style>

            <Navbar />

            <HeroSection
                onSolicitar={goToContacto}
                onExplorarEquipos={() => { window.location.hash = '#equipos'; }}
            />

            <AboutSection />

            <CatalogoSection
                pestana={pestanaCatalogo}
                onPestanaChange={setPestanaCatalogo}
                cargando={cargando}
                suscripciones={suscripcionesFormateadas}
                equipos={equiposFormateados}
                onCotizar={goToContacto}
                onSuscribir={goToLogin}
                onVerTodosSuscripciones={goToSuscription}
                onVerTodosEquipos={goToCatalog}
            />

            <ProcesoSection />

            <ContactoSection onContactar={goToContacto} />

            <Footer />
        </div>
    );
};

export default LandingPage;