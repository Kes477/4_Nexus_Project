import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';

const Navbar = () => {
    return (
        <nav className="navbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'var(--color-primary)', padding: '8px', borderRadius: '8px', color: 'var(--white)' }}>
                    <i className="fas fa-broadcast-tower" style={{ fontSize: '20px' }}></i>
                </div>
                <div>
                    <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', letterSpacing: '1px' }}>4 NEXUS</h1>
                </div>
            </div>

            <div className="nav-links">
                <a href="#inicio" className="nav-link">Inicio</a>
                <a href="#nosotros" className="nav-link">Nosotros</a>
                <a href="#suscripciones" className="nav-link">Suscripciones</a>
                <a href="#equipos" className="nav-link">Equipos</a>
                <a href="#proceso" className="nav-link">Proceso</a>
                <a href="#contacto" className="nav-link">Contacto</a>
            </div>

            <Link to="/login">
                <Button variant="outline-dark" size="sm">
                    Acceso clientes
                </Button>
            </Link>
        </nav>
    );
};

export default Navbar;