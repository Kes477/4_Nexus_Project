import { MapPin, Phone, Mail, Clock, Drone } from 'lucide-react';
import { Button, IconButton } from '../ui'; 

const Footer = () => {
    return (
        <footer style={{ background: 'var(--bg-color)', borderTop: '1px solid var(--light-gray)', padding: '60px 20px 20px' }}>
            <div className="section-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '40px', marginBottom: '40px' }}>
                
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                        <div style={{ background: 'var(--color-primary)', padding: '8px', borderRadius: '8px', color: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Drone size={24} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--color-dark)', letterSpacing: '1px' }}>4 NEXUS</h3>
                        </div>
                    </div>
                    <p style={{ color: 'var(--text-light)', fontSize: '13px', lineHeight: '1.6', marginBottom: '20px' }}>
                        Ingeniería, soporte y soluciones para el mundo de los drones profesionales.
                    </p>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <IconButton 
                            icon="fa-instagram" 
                            iconType="fab" 
                            customColor="#E1306C"
                        />
                        <IconButton 
                            icon="fa-facebook-f" 
                            iconType="fab" 
                            customColor="#1877F2"
                        />
                        <IconButton 
                            icon="fa-linkedin-in" 
                            iconType="fab" 
                            customColor="#0A66C2"
                        />
                    </div>
                </div>

                <div>
                    <h4 style={{ color: 'var(--color-dark)', fontSize: '15px', marginBottom: '20px' }}>Explorar</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <li><a href="#nosotros" className="nav-link" style={{ fontSize: '13px' }}>Nosotros</a></li>
                        <li><a href="#suscripciones" className="nav-link" style={{ fontSize: '13px' }}>Suscripciones</a></li>
                        <li><a href="#equipos" className="nav-link" style={{ fontSize: '13px' }}>Equipos</a></li>
                        <li><a href="#proceso" className="nav-link" style={{ fontSize: '13px' }}>Proceso</a></li>
                    </ul>
                </div>

                <div>
                    <h4 style={{ color: 'var(--color-dark)', fontSize: '15px', marginBottom: '20px' }}>Contacto</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '15px', color: 'var(--text-light)', fontSize: '13px' }}>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Phone size={16} /> +504 9999-0000</li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Mail size={16} /> soporte@4nexus.com</li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><MapPin size={16} /> Tegucigalpa, Honduras</li>
                    </ul>
                </div>

                <div>
                    <h4 style={{ color: 'var(--color-dark)', fontSize: '15px', marginBottom: '20px' }}>Horario de atención</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '15px', color: 'var(--text-light)', fontSize: '13px' }}>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Clock size={16} /> Lunes a viernes</li>
                        <li>8:00 a.m. – 5:00 p.m.</li>
                        <li>
                            <Button variant="outline-dark" size="sm" style={{ marginTop: '10px' }}>
                                Enviar una consulta
                            </Button>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="section-container" style={{ borderTop: '1px solid var(--light-gray)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <span style={{ color: 'var(--text-light)', fontSize: '12px' }}>© 2026 4 Nexus Solutions. Todos los derechos reservados.</span>
                <span style={{ color: 'var(--text-light)', fontSize: '12px', letterSpacing: '1px' }}>TECNOLOGÍA CON PROPÓSITO.</span>
            </div>
        </footer>
    );
};

export default Footer;