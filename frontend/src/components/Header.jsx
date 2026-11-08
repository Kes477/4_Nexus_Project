import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Radio, Menu, X, LockKeyhole, ArrowUpRight, MapPin } from 'lucide-react';

const links = [
  ['/', 'Inicio'], ['/nosotros', 'Nosotros'], ['/servicios', 'Servicios'],
  ['/catalogo', 'Catálogo'], ['/preguntas', 'Preguntas'], ['/contacto', 'Contacto'],
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  return <>
    <div className="announcement"><span className="announcement-dot" />Ingeniería, tecnología y soporte para tus operaciones aéreas<span className="announcement-right">TEGUCIGALPA, HONDURAS <MapPin size={12} /></span></div>
    <header className="site-header">
      <Link className="brand" to="/" onClick={closeMenu} aria-label="AeroTech inicio">
        <span className="brand-mark"><Radio size={25} /></span><span className="brand-copy">AERO<span>TECH</span><small>DRONE SYSTEMS</small></span>
      </Link>
      <button className="mobile-menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menú">{menuOpen ? <X /> : <Menu />}</button>
      <nav className={`main-nav ${menuOpen ? 'main-nav-open' : ''}`}>
        {links.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'} onClick={closeMenu} className={({ isActive }) => isActive ? 'nav-active' : ''}>{label}</NavLink>)}
        <Link className="mobile-login" to="/acceso" onClick={closeMenu}><LockKeyhole size={16} /> Iniciar sesión</Link>
      </nav>
      <Link className="header-login" to="/acceso"><LockKeyhole size={15} /> Acceso clientes <ArrowUpRight size={15} /></Link>
    </header>
  </>;
}
