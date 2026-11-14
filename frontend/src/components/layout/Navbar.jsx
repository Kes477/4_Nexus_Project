import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Drone, ChevronDown, User, LogOut, LayoutDashboard, FileText, CreditCard, Plane, MessageSquare } from 'lucide-react';
import { Button } from '../ui/Button';

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isServicesOpen, setIsServicesOpen] = useState(false);
    const [isUserOpen, setIsUserOpen] = useState(false);
    
    const [hoveredPath, setHoveredPath] = useState(null);

    const [userRole, setUserRole] = useState(localStorage.getItem('user_role') || 'cliente'); 

    const isDashboard = location.pathname.startsWith('/cliente') || location.pathname.startsWith('/dashboard');

    const linkStyle = (path) => ({ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        textDecoration: 'none', 
        fontSize: '14px', 
        fontWeight: '600', 
        padding: '10px 16px',
        borderRadius: '8px',
        color: (location.pathname === path || hoveredPath === path) ? 'var(--color-primary)' : 'var(--text-light)', 
        background: (location.pathname === path) 
            ? 'rgba(4, 201, 166, 0.1)' 
            : (hoveredPath === path ? 'rgba(4, 201, 166, 0.05)' : 'transparent'),
        transition: 'all 0.2s ease',
        border: 'none',
        cursor: 'pointer'
    });

    const dropdownStyle = { 
        position: 'absolute', 
        top: '100%', 
        left: 0, 
        background: 'var(--white)', 
        border: '1px solid var(--light-gray)', 
        borderRadius: '8px', 
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)', 
        padding: '10px', 
        minWidth: '220px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '6px',
        zIndex: 1001 
    };

    const cambiarRol = (nuevoRol) => {
        localStorage.setItem('user_role', nuevoRol);
        setUserRole(nuevoRol);
        window.location.reload(); 
    };

    return (
        <nav className="navbar">
            <Link to={isDashboard ? "/cliente" : "/"} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                <div style={{ background: 'var(--color-primary)', padding: '8px', borderRadius: '8px', color: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Drone size={24} />
                </div>
                <div>
                    <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', letterSpacing: '1px', color: 'var(--color-dark)' }}>4 NEXUS</h1>
                </div>
            </Link>

            <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                
                {!isDashboard ? (
                    <>
                        <a href="#inicio" className="nav-link">Inicio</a>
                        <a href="#nosotros" className="nav-link">Nosotros</a>
                        <a href="#suscripciones" className="nav-link">Suscripciones</a>
                        <a href="#equipos" className="nav-link">Equipos</a>
                        <a href="#proceso" className="nav-link">Proceso</a>
                        <a href="#contacto" className="nav-link">Contacto</a>
                    </>
                ) : (
                    <>
                        <Link 
                            to="/cliente" 
                            style={linkStyle('/cliente')}
                            onMouseEnter={() => setHoveredPath('/cliente')}
                            onMouseLeave={() => setHoveredPath(null)}
                        >
                            <LayoutDashboard size={18} /> Dashboard
                        </Link>

                        <div style={{ position: 'relative' }}>
                            <button 
                                onClick={() => setIsServicesOpen(!isServicesOpen)}
                                onMouseEnter={() => setHoveredPath('services')}
                                onMouseLeave={() => setHoveredPath(null)}
                                style={linkStyle('services')}
                            >
                                {userRole === 'admin' ? 'Gestión' : userRole === 'piloto' ? 'Vuelos' : userRole === 'tecnico' ? 'Mantenimiento' : 'Servicios'} 
                                <ChevronDown size={16} style={{ transform: isServicesOpen ? 'rotate(180deg)' : 'none', transition: 'all 0.3s' }} />
                            </button>
                            
                            {isServicesOpen && (
                                <div style={dropdownStyle}>
                                    {userRole === 'cliente' && (
                                        <>
                                            <Link 
                                                to="/cliente/suscripciones" 
                                                style={linkStyle('/cliente/suscripciones')} 
                                                onClick={() => setIsServicesOpen(false)}
                                                onMouseEnter={() => setHoveredPath('/cliente/suscripciones')} 
                                                onMouseLeave={() => setHoveredPath(null)}
                                            >
                                                <CreditCard size={16} /> Suscripciones
                                            </Link>
                                            <Link 
                                                to="/cliente/drones" 
                                                style={linkStyle('/cliente/drones')} 
                                                onClick={() => setIsServicesOpen(false)}
                                                onMouseEnter={() => setHoveredPath('/cliente/drones')} 
                                                onMouseLeave={() => setHoveredPath(null)}
                                            >
                                                <Plane size={16} /> Drones
                                            </Link>
                                            <Link 
                                                to="/cliente/servicios" 
                                                style={linkStyle('/cliente/servicios')} 
                                                onClick={() => setIsServicesOpen(false)}
                                                onMouseEnter={() => setHoveredPath('/cliente/servicios')} 
                                                onMouseLeave={() => setHoveredPath(null)}
                                            >
                                                <FileText size={16} /> Mis Servicios
                                            </Link>
                                            <Link 
                                                to="/cliente/historial" 
                                                style={linkStyle('/cliente/historial')} 
                                                onClick={() => setIsServicesOpen(false)}
                                                onMouseEnter={() => setHoveredPath('/cliente/historial')} 
                                                onMouseLeave={() => setHoveredPath(null)}
                                            >
                                                <FileText size={16} /> Historial
                                            </Link>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <Link 
                            to="/cliente/soporte" 
                            style={linkStyle('/cliente/soporte')}
                            onMouseEnter={() => setHoveredPath('/cliente/soporte')} 
                            onMouseLeave={() => setHoveredPath(null)}
                        >
                            <MessageSquare size={18} /> Soporte
                        </Link>
                    </>
                )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {!isDashboard ? (
                    <Link to="/login">
                        <Button variant="outline-dark" size="sm">Acceso clientes</Button>
                    </Link>
                ) : (
                    <>
                        <select 
                            value={userRole} 
                            onChange={(e) => cambiarRol(e.target.value)}
                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--light-gray)', fontSize: '12px', background: 'var(--white)', cursor: 'pointer', color: 'var(--text-light)' }}
                        >
                            <option value="cliente">Rol: Cliente</option>
                            <option value="admin">Rol: Admin</option>
                            <option value="piloto">Rol: Piloto</option>
                            <option value="tecnico">Rol: Técnico</option>
                        </select>

                        <div style={{ position: 'relative' }}>
                            <button 
                                onClick={() => setIsUserOpen(!isUserOpen)}
                                onMouseEnter={() => setHoveredPath('user')}
                                onMouseLeave={() => setHoveredPath(null)}
                                style={{ 
                                    display: 'flex', alignItems: 'center', gap: '10px', 
                                    background: hoveredPath === 'user' ? 'rgba(4, 201, 166, 0.05)' : 'var(--bg-color)', 
                                    border: hoveredPath === 'user' ? '1px solid var(--color-primary)' : '1px solid var(--light-gray)', 
                                    padding: '6px 12px', borderRadius: '20px', cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <div style={{ background: 'var(--color-primary)', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase' }}>
                                    {userRole.charAt(0)}
                                </div>
                                <span style={{ fontSize: '14px', fontWeight: 'bold', color: hoveredPath === 'user' ? 'var(--color-primary)' : 'var(--color-dark)', textTransform: 'capitalize' }}>{userRole}</span>
                                <ChevronDown size={16} color={hoveredPath === 'user' ? 'var(--color-primary)' : 'var(--text-light)'} />
                            </button>

                            {isUserOpen && (
                                <div style={{ ...dropdownStyle, left: 'auto', right: 0 }}>
                                    <Link to="/cliente/perfil" style={linkStyle('/cliente/perfil')} onClick={() => setIsUserOpen(false)}
                                        onMouseEnter={() => setHoveredPath('/cliente/perfil')} onMouseLeave={() => setHoveredPath(null)}>
                                        <User size={16} /> Mi Perfil
                                    </Link>
                                    <hr style={{ border: 'none', borderTop: '1px solid var(--light-gray)', margin: '5px 0' }} />
                                    <button 
                                        onClick={() => { localStorage.removeItem('user_role'); navigate('/login'); }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', padding: '10px 16px', fontSize: '14px', fontWeight: '600', color: 'var(--color-danger)', cursor: 'pointer', borderRadius: '8px', textAlign: 'left', width: '100%', transition: 'all 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(240, 37, 88, 0.05)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                    >
                                        <LogOut size={16} /> Cerrar Sesión
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;