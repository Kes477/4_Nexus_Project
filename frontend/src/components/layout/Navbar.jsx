import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';

const Navbar = () => {
    return (
        <nav style={{ 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '15px 40px', background: 'var(--color-dark)', color: 'var(--white)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
            <div style={{ fontSize: '24px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fas fa-drone" style={{ color: 'var(--color-primary)' }}></i>
                <Link to="/" style={{ color: 'var(--white)', textDecoration: 'none' }}>Nexus</Link>
            </div>
            
            <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
                <Link to="/catalog" style={{ color: 'var(--white)', textDecoration: 'none', fontWeight: '500' }}>Catálogo</Link>
                <Link to="/login" style={{ color: 'var(--white)', textDecoration: 'none', fontWeight: '500' }}>Iniciar Sesión</Link>
                <Link to="/register">
                    {/* Usamos el componente Button que ya tienes en tu kit */}
                    <button style={{
                        padding: '8px 16px', fontSize: '12px', borderRadius: '20px',
                        background: 'var(--color-primary)', color: 'var(--white)', border: 'none', cursor: 'pointer', fontWeight: '500'
                    }}>Registrarse</button>
                </Link>
            </div>
        </nav>
    );
};

export default Navbar;