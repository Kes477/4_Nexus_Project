import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Drone, ChevronDown, User, LogOut, LayoutDashboard, FileText, CreditCard, Plane, MessageSquare, Shield, Navigation } from 'lucide-react';
import { Button } from '../ui';
import { useSesion } from '../../hooks/useSesion';

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isServicesOpen, setIsServicesOpen] = useState(false);
    const [isUserOpen, setIsUserOpen] = useState(false);
    const [hoveredPath, setHoveredPath] = useState(null);

     // El usuario y su rol vienen de la sesión real (Django)
    const { usuario, rol, cerrarSesion } = useSesion();
    const userRole = rol || 'cliente';

    // 1. DETECTAMOS LA RUTA BASE SEGÚN EL ROL
    const basePath = userRole === 'admin' ? '/admin' : '/cliente';

    // 2. EL NAVBAR SE MUESTRA EN DASHBOARD SI ESTAMOS EN /cliente O /admin
    const isDashboard = location.pathname.startsWith('/cliente') || location.pathname.startsWith('/admin') || location.pathname.startsWith('/dashboard');

    // 3. CONTEXTO: ¿estamos en el landing o en otra página pública?
    const isLanding = location.pathname === '/';

    // 4. ITEMS DEL NAV PÚBLICO
    //    - `dedicatedPath`: si existe y NO estamos en el landing, navega a esa ruta
    //    - si estamos en el landing, siempre usa el ancla nativa
    //    - si no hay `dedicatedPath` y NO estamos en el landing, navega al landing + ancla
    const publicNavItems = [
        { id: 'inicio', label: 'Inicio', dedicatedPath: null },
        { id: 'nosotros', label: 'Nosotros', dedicatedPath: null },
        { id: 'suscripciones', label: 'Suscripciones', dedicatedPath: '/suscription' },
        { id: 'equipos', label: 'Equipos', dedicatedPath: '/catalog' },
        { id: 'proceso', label: 'Proceso', dedicatedPath: null },
        { id: 'contacto', label: 'Contacto', dedicatedPath: null },
    ];

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

    // Renderiza un link público según el contexto
    const renderPublicLink = (item) => {
        // En el landing → ancla nativa (scroll dentro de la misma página)
        if (isLanding) {
            return (
                <a key={item.id} href={`#${item.id}`} className="nav-link">
                    {item.label}
                </a>
            );
        }

        // Fuera del landing con página dedicada → navega a esa ruta
        if (item.dedicatedPath) {
            return (
                <Link key={item.id} to={item.dedicatedPath} className="nav-link">
                    {item.label}
                </Link>
            );
        }

        // Fuera del landing sin página dedicada → vuelve al landing con ancla
        return (
            <Link key={item.id} to={`/#${item.id}`} className="nav-link">
                {item.label}
            </Link>
        );
    };

    return (
        <nav className="navbar">
            {/* El logo lleva a la base correspondiente */}
            <Link to={isDashboard ? basePath : "/"} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
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
                        {publicNavItems.map(renderPublicLink)}
                    </>
                ) : (
                    <>
                        {/* Dashboard Dinámico */}
                        <Link
                            to={basePath}
                            style={linkStyle(basePath)}
                            onMouseEnter={() => setHoveredPath(basePath)}
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
                                    {/* MENÚ CLIENTE */}
                                    {userRole === 'cliente' && (
                                        <>
                                            <Link to={`${basePath}/suscripciones`} style={linkStyle(`${basePath}/suscripciones`)} onClick={() => setIsServicesOpen(false)} onMouseEnter={() => setHoveredPath(`${basePath}/suscripciones`)} onMouseLeave={() => setHoveredPath(null)}>
                                                <CreditCard size={16} /> Suscripciones
                                            </Link>
                                            <Link to={`${basePath}/drones`} style={linkStyle(`${basePath}/drones`)} onClick={() => setIsServicesOpen(false)} onMouseEnter={() => setHoveredPath(`${basePath}/drones`)} onMouseLeave={() => setHoveredPath(null)}>
                                                <Plane size={16} /> Drones
                                            </Link>
                                            <Link to={`${basePath}/servicios`} style={linkStyle(`${basePath}/servicios`)} onClick={() => setIsServicesOpen(false)} onMouseEnter={() => setHoveredPath(`${basePath}/servicios`)} onMouseLeave={() => setHoveredPath(null)}>
                                                <FileText size={16} /> Mis Servicios
                                            </Link>
                                            <Link to={`${basePath}/historial`} style={linkStyle(`${basePath}/historial`)} onClick={() => setIsServicesOpen(false)} onMouseEnter={() => setHoveredPath(`${basePath}/historial`)} onMouseLeave={() => setHoveredPath(null)}>
                                                <FileText size={16} /> Historial
                                            </Link>
                                        </>
                                    )}

                                    {/* MENÚ ADMINISTRADOR */}
                                    {userRole === 'admin' && (
                                        <>
                                            <Link to={`${basePath}/usuarios`} style={linkStyle(`${basePath}/usuarios`)} onClick={() => setIsServicesOpen(false)} onMouseEnter={() => setHoveredPath(`${basePath}/usuarios`)} onMouseLeave={() => setHoveredPath(null)}>
                                                <Shield size={16} /> Usuarios
                                            </Link>
                                            <Link to={`${basePath}/operaciones`} style={linkStyle(`${basePath}/operaciones`)} onClick={() => setIsServicesOpen(false)} onMouseEnter={() => setHoveredPath(`${basePath}/operaciones`)} onMouseLeave={() => setHoveredPath(null)}>
                                                <Navigation size={16} /> Operaciones Globales
                                            </Link>
                                            <Link to={`${basePath}/precios`} style={linkStyle(`${basePath}/precios`)} onClick={() => setIsServicesOpen(false)} onMouseEnter={() => setHoveredPath(`${basePath}/precios`)} onMouseLeave={() => setHoveredPath(null)}>
                                                <CreditCard size={16} /> Precios
                                            </Link>
                                            <Link to={`${basePath}/historial`} style={linkStyle(`${basePath}/historial`)} onClick={() => setIsServicesOpen(false)} onMouseEnter={() => setHoveredPath(`${basePath}/historial`)} onMouseLeave={() => setHoveredPath(null)}>
                                                <FileText size={16} /> Historial
                                            </Link>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Soporte Dinámico */}
                        <Link
                            to={`${basePath}/soporte`}
                            style={linkStyle(`${basePath}/soporte`)}
                            onMouseEnter={() => setHoveredPath(`${basePath}/soporte`)}
                            onMouseLeave={() => setHoveredPath(null)}
                        >
                            <MessageSquare size={18} /> Soporte
                        </Link>
                    </>
                )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {!isDashboard ? (
                    <Link to={usuario ? basePath: '/login'}>
                        <Button variant="outline-dark" size="sm">{usuario ? 'Ir a mi panel': 'Acceso clientes'}</Button>
                    </Link>
                ) : (
                    <>
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
                                    {(usuario?.first_name || userRole).charAt(0)}
                                </div>
                                <span style={{ fontSize: '14px', fontWeight: 'bold', color: hoveredPath === 'user' ? 'var(--color-primary)' : 'var(--color-dark)', textTransform: 'capitalize' }}>{usuario?.first_name || userRole}</span>
                                <ChevronDown size={16} color={hoveredPath === 'user' ? 'var(--color-primary)' : 'var(--text-light)'} />
                            </button>

                            {isUserOpen && (
                                <div style={{ ...dropdownStyle, left: 'auto', right: 0 }}>
                                    {/* Perfil Dinámico */}
                                    <Link to={`${basePath}/perfil`} style={linkStyle(`${basePath}/perfil`)} onClick={() => setIsUserOpen(false)}
                                        onMouseEnter={() => setHoveredPath(`${basePath}/perfil`)} onMouseLeave={() => setHoveredPath(null)}>
                                        <User size={16} /> Mi Perfil
                                    </Link>
                                    <hr style={{ border: 'none', borderTop: '1px solid var(--light-gray)', margin: '5px 0' }} />
                                    <button
                                         onClick={() => { setIsUserOpen(false); cerrarSesion(); navigate('/login'); }}
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