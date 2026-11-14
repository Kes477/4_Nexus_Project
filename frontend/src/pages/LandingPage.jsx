import { useState, useEffect } from 'react';
import { Wrench, Cpu, Plane, User, Shield, Zap, Crown, Package, Battery, Camera, Drone } from 'lucide-react';
import { Navbar, Footer } from '../components/layout';
import { Button } from '../components/ui';
import { ServiceCard, ProductCard } from '../components/domain/Card'; 

const LandingPage = () => {
    const [pestanaCatalogo, setPestanaCatalogo] = useState('subs');

    useEffect(() => {
        const handleHashChange = () => {
            if (window.location.hash === '#suscripciones' || window.location.hash === '#equipos') {
                setPestanaCatalogo(window.location.hash === '#suscripciones' ? 'subs' : 'equipos');
                
                const catalogoSection = document.getElementById('catalogo');
                if (catalogoSection) {
                    catalogoSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        };
        
        handleHashChange();
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const datosSuscripciones = [
        { number: '01', icon: Shield, title: 'Plan Básico', description: 'Ideal para pequeños productores que inician en la agricultura de precisión.', price: 'L 1,200', period: '/mes', destacado: false, features: ['2 vuelos de monitoreo', 'Reportes analíticos PDF', 'Cobertura hasta 10 mz'] },
        { number: '02', icon: Zap, title: 'Plan Profesional', description: 'Diseñado para fincas comerciales que requieren seguimiento constante.', price: 'L 2,800', period: '/mes', destacado: true, features: ['10 vuelos mensuales', 'Analítica NDVI / SAVI', 'Cobertura hasta 50 mz', 'Soporte prioritario'] },
        { number: '03', icon: Crown, title: 'Plan Premium', description: 'Infraestructura total para grandes agroindustrias con despliegues diarios.', price: 'L 5,500', period: '/mes', destacado: false, features: ['Vuelos ilimitados', 'Procesamiento con IA', 'Soporte 24/7', 'Cobertura total'] },
        { number: '04', icon: Shield, title: 'Plan Corporativo', description: 'Para empresas que necesitan gestionar múltiples flotas y equipos.', price: 'L 4,000', period: '/mes', destacado: false, features: ['5 flotas gestionadas', 'Reportes personalizados', 'Soporte prioritario'] },
    ];

    const datosEquipos = [
        { id: "1", name: "DJI FlyCart 30", label: "Nuevo", category: "DJI", icon: Package, image: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=600&auto=format&fit=crop", price: "450,000", description: "Capacidad de carga útil de 30 kg con rango operativo extendido." },
        { id: "2", name: "Ehang 184", label: "Pasajeros", category: "Ehang", icon: User, image: "https://images.unsplash.com/photo-1579829366248-204fe8413f31?q=80&w=600&auto=format&fit=crop", price: "2,400,000", description: "Vehículo aéreo autónomo eléctrico para transporte de un pasajero." },
        { id: "3", name: "GRIFF Aviation 300", label: "Industrial", category: "GRIFF", icon: Battery, image: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?q=80&w=600&auto=format&fit=crop", price: "1,850,000", description: "Megadron octocóptero diseñado para la elevación de insumos pesados." },
        { id: "4", name: "Freefly Alta X", label: "Cinematografía", category: "Freefly", icon: Camera, image: "https://images.unsplash.com/photo-1524143986875-3b098d78b363?q=80&w=600&auto=format&fit=crop", price: "620,000", description: "Dron de cinematografía con capacidad de carga útil de 15 kg." },
    ];

    const scrollAnchorStyle = { scrollMarginTop: '80px' };
    
    const paddingLarge = { padding: '120px 20px', width: '100%' }; 
    const paddingCatalog = { padding: '20px 20px', width: '100%' }; 
    const paddingNormal = { padding: '30px 20px', width: '100%' }; 
    
    const containerStyle = { maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }; 
    const titleStyle = { fontSize: '36px', color: 'var(--color-dark)', lineHeight: '1.2', marginBottom: '20px' };
    const subtitleStyle = { color: 'var(--text-light)', fontSize: '18px', marginBottom: '30px' };

    return (
        <div style={{ background: 'var(--bg-color)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />

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
                            <Button variant="primary" onClick={() => scrollToSection('contacto')}>
                                Solicitar servicio
                            </Button>
                            <Button variant="outline-dark" onClick={() => { window.location.hash = '#equipos'; }}>
                                Explorar equipos
                            </Button>
                        </div>
                    </div>
                    
                    <div style={{ flex: '1 1 500px', position: 'relative' }}>
                        <img src="https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=800&auto=format&fit=crop" alt="Dron" style={{ width: '100%', height: '450px', objectFit: 'cover', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} />
                        <div className="floating-card" style={{ top: '30px', left: '-20px' }}>
                            <div style={{ background: 'var(--bg-color)', padding: '10px', borderRadius: '8px' }}><Wrench size={20} color="var(--color-primary)" /></div>
                            <div>
                                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-light)', fontWeight: 'bold' }}>ENFOQUE</span>
                                <span style={{ display: 'block', color: 'var(--color-dark)', fontWeight: 'bold', fontSize: '14px' }}>Precisión técnica</span>
                            </div>
                        </div>
                        <div className="floating-card" style={{ bottom: '30px', right: '-20px' }}>
                            <div style={{ background: 'var(--bg-color)', padding: '10px', borderRadius: '8px' }}><Cpu size={20} color="var(--color-primary)" /></div>
                            <div>
                                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-light)', fontWeight: 'bold' }}>ESPECIALIDAD</span>
                                <span style={{ display: 'block', color: 'var(--color-dark)', fontWeight: 'bold', fontSize: '14px' }}>Sistemas aéreos</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="nosotros" style={{ ...paddingLarge, background: 'var(--bg-color)', borderTop: '1px solid var(--light-gray)', ...scrollAnchorStyle }}>
                <div style={containerStyle}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <h2 style={titleStyle}>Expertos en ingeniería aérea</h2>
                        <p style={{ ...subtitleStyle, maxWidth: '600px', margin: '0 auto' }}>Combinamos hardware de vanguardia con soporte técnico especializado.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
                        {[
                            { icon: <Wrench size={24} />, title: 'Servicio técnico', desc: 'Diagnóstico y mantenimiento preventivo para extender la vida útil de tu equipo.' },
                            { icon: <Cpu size={24} />, title: 'Ingeniería aplicada', desc: 'Reparación especializada de componentes electrónicos y calibración.' },
                            { icon: <Plane size={24} />, title: 'Equipos profesionales', desc: 'Soluciones de hardware adaptadas a las exigencias de cada operación.' },
                            { icon: <User size={24} />, title: 'Atención personalizada', desc: 'Orientación experta y acompañamiento según los objetivos de tu proyecto.' },
                        ].map((item, idx) => (
                            <div key={idx} style={{ background: 'var(--white)', padding: '40px 30px', borderRadius: '12px', border: '1px solid var(--light-gray)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
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

            <section id="catalogo" style={{ ...paddingCatalog, background: 'var(--white)', ...scrollAnchorStyle }}>
                <div style={containerStyle}>
                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <h2 style={titleStyle}>Nuestros Planes y Equipos</h2>
                        
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                            <div style={{ display: 'flex', background: 'var(--bg-color)', padding: '6px', borderRadius: '10px', border: '1px solid var(--light-gray)' }}>
                                <button className={`tab-btn ${pestanaCatalogo === 'subs' ? 'active' : ''}`} onClick={() => setPestanaCatalogo("subs")} style={{ padding: '12px 30px', fontSize: '15px' }}>Suscripciones</button>
                                <button className={`tab-btn ${pestanaCatalogo === 'equipos' ? 'active' : ''}`} onClick={() => setPestanaCatalogo("equipos")} style={{ padding: '12px 30px', fontSize: '15px' }}>Equipos</button>
                            </div>
                        </div>
                    </div>

                    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                        {pestanaCatalogo === 'subs' ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '25px' }}>
                                {datosSuscripciones.map((suscripcion, idx) => (
                                    <ServiceCard key={idx} service={suscripcion} />
                                ))}
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '25px' }}>
                                {datosEquipos.map((equipo) => (
                                    <ProductCard key={equipo.id} product={equipo} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section id="proceso" style={{ ...paddingLarge, background: 'var(--bg-color)', borderTop: '1px solid var(--light-gray)', ...scrollAnchorStyle }}>
                <div style={containerStyle}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <span style={{ color: 'var(--color-primary)', fontSize: '13px', letterSpacing: '1.5px', fontWeight: 'bold', display: 'block', marginBottom: '15px' }}>ASÍ TRABAJAMOS</span>
                        <h2 style={titleStyle}>
                            Un proceso claro.<br /><span style={{ color: 'var(--color-primary)' }}>De principio a solución.</span>
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

            <section id="contacto" style={{ ...paddingNormal, background: 'var(--white)', ...scrollAnchorStyle }}>
                <div style={{ ...containerStyle, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '30px' }}>
                    <div style={{ flex: '1 1 500px' }}>
                        <span style={{ color: 'var(--color-primary)', fontSize: '13px', letterSpacing: '1.5px', fontWeight: 'bold', display: 'block', marginBottom: '15px' }}>HABLEMOS DE TU PROYECTO</span>
                        
                        <h2 style={titleStyle}>
                            Tu próximo vuelo<br />empieza con una <span style={{ color: 'var(--color-primary)', fontSize: 'inherit' }}>buena decisión.</span>
                        </h2>
                        
                        <p style={{ ...subtitleStyle, maxWidth: '500px' }}>
                            Cuéntanos qué necesitas. Estamos listos para orientarte y llevar tu operación al siguiente nivel.
                        </p>
                        <Button variant="primary" onClick={() => window.location.href = "mailto:soporte@4nexus.com"}>
                            Contactar con 4 Nexus
                        </Button>
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

            <Footer />
        </div>
    );
};

export default LandingPage;