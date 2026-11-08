import { Link } from 'react-router-dom';
import { Radio, Phone, Mail, MapPin, Clock3, ArrowUpRight } from 'lucide-react';
export default function Footer() {
  return <footer className="site-footer">
    <div className="footer-main">
      <div className="footer-brand"><Link className="brand" to="/"><span className="brand-mark"><Radio size={25} /></span><span className="brand-copy">AERO<span>TECH</span><small>DRONE SYSTEMS</small></span></Link><p>Ingeniería, soporte y soluciones para el mundo de los drones profesionales.</p><div className="social-links"><a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><span>IG</span></a><a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook"><span>f</span></a><a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn"><span>in</span></a></div></div>
      <div className="footer-column"><h4>Explorar</h4><Link to="/nosotros">Nosotros</Link><Link to="/servicios">Servicios</Link><Link to="/catalogo">Catálogo</Link><Link to="/preguntas">Preguntas frecuentes</Link></div>
      <div className="footer-column"><h4>Contacto</h4><span><Phone size={15} /> +504 9999-0000</span><span><Mail size={15} /> soporte@aerotech.com</span><span><MapPin size={15} /> Tegucigalpa, Honduras</span></div>
      <div className="footer-column"><h4>Horario de atención</h4><span><Clock3 size={15} /> Lunes a viernes</span><p>8:00 a. m. – 5:00 p. m.</p><Link className="footer-contact" to="/contacto">Enviar una consulta <ArrowUpRight size={15} /></Link></div>
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} AeroTech Solutions. Todos los derechos reservados.</span><span>TECNOLOGÍA CON PROPÓSITO.</span></div>
  </footer>;
}
