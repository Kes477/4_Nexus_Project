import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import {
  Drone,
  ChevronDown,
  User,
  LogOut,
  LayoutDashboard,
  FileText,
  CreditCard,
  Plane,
  MessageSquare,
  Shield,
  Navigation,
  Sun,
  Moon,
  Package,
  Wrench,
} from 'lucide-react';

import { Button } from '../ui';
import { useSesion } from '../../hooks/useSesion';
import { useTheme } from '../../context/useTheme';

// ======================================================
// CONFIGURACION DE NAVEGACION PUBLICA
// ======================================================

const publicNavItems = [
  { id: 'inicio', label: 'Inicio', dedicatedPath: null },
  { id: 'nosotros', label: 'Nosotros', dedicatedPath: null },
  {
    id: 'suscripciones',
    label: 'Suscripciones',
    dedicatedPath: '/suscription',
  },
  {
    id: 'equipos',
    label: 'Equipos',
    dedicatedPath: '/catalog',
  },
  { id: 'proceso', label: 'Proceso', dedicatedPath: null },
  { id: 'contacto', label: 'Contacto', dedicatedPath: null },
];

// ======================================================
// CONFIGURACION DE MENUS POR ROL
// ======================================================

const menusPorRol = {

  // CLIENTE

  cliente: {
    titulo: 'Servicios',
    rutaBase: '/cliente',

    opciones: [
      {
        ruta: 'suscripciones',
        nombre: 'Suscripciones',
        icono: CreditCard,
      },
      {
        ruta: 'drones',
        nombre: 'Drones',
        icono: Plane,
      },

      // HU-010, HU-011 Y HU-012

      {
        ruta: 'equipos',
        nombre: 'Mis equipos',
        icono: Package,
      },
      {
        ruta: 'servicios',
        nombre: 'Mis Servicios',
        icono: FileText,
      },
      {
        ruta: 'historial',
        nombre: 'Historial',
        icono: FileText,
      },
    ],
  },

  // ADMINISTRADOR

  admin: {
    titulo: 'Gestión',
    rutaBase: '/admin',

    opciones: [
      {
        ruta: 'usuarios',
        nombre: 'Usuarios',
        icono: Shield,
      },
      {
        ruta: 'operaciones',
        nombre: 'Operaciones Globales',
        icono: Navigation,
      },

      // HU-013: GESTION DE ORDENES DE SERVICIO

      {
        ruta: 'reparaciones',
        nombre: 'Reparaciones',
        icono: Wrench,
      },
      {
        ruta: 'precios',
        nombre: 'Precios',
        icono: CreditCard,
      },
      {
        ruta: 'historial',
        nombre: 'Historial',
        icono: FileText,
      },
    ],
  },

  // PILOTO

  piloto: {
    titulo: 'Vuelos',
    rutaBase: '/piloto',

    opciones: [
      {
        ruta: 'misiones',
        nombre: 'Mis Misiones',
        icono: Navigation,
      },
      {
        ruta: 'bitacora',
        nombre: 'Bitácora',
        icono: FileText,
      },
      {
        ruta: 'facturacion',
        nombre: 'Facturación',
        icono: CreditCard,
      },
      {
        ruta: 'historial',
        nombre: 'Calificaciones',
        icono: Shield,
      },
    ],
  },

  // TECNICO

  tecnico: {
    titulo: 'Mantenimiento',
    rutaBase: '/tecnico',

    opciones: [
      {
        ruta: 'ordenes',
        nombre: 'Órdenes asignadas',
        icono: Wrench,
      },
    ],
  },
};

// ======================================================
// COMPONENTE PRINCIPAL NAVBAR
// ======================================================

const Navbar = () => {

  const location = useLocation();
  const navigate = useNavigate();

  // ====================================================
  // ESTADOS DE LA INTERFAZ
  // ====================================================

  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [hoveredPath, setHoveredPath] = useState(null);
  const [isThemeHovered, setIsThemeHovered] = useState(false);

  // ====================================================
  // CONTEXTOS
  // ====================================================

  const { theme, toggleTheme } = useTheme();

  const {
    usuario,
    rol,
    cerrarSesion,
  } = useSesion();

  // ====================================================
  // DETERMINAR ROL Y RUTA BASE
  // ====================================================

  const userRole = rol || 'cliente';

  const configuracionMenu =
    menusPorRol[userRole] || menusPorRol.cliente;

  const basePath = configuracionMenu.rutaBase;

  const isDashboard =
    location.pathname.startsWith('/cliente') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/piloto') ||
    location.pathname.startsWith('/tecnico') ||
    location.pathname.startsWith('/dashboard');

  const isLanding = location.pathname === '/';

  const isLight = theme === 'light';

  // ====================================================
  // ESTILOS DE NAVEGACION
  // ====================================================

  const linkStyle = (path) => ({

    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '600',
    padding: '10px 16px',
    borderRadius: '8px',

    color:
      location.pathname === path || hoveredPath === path
        ? 'var(--color-primary)'
        : 'var(--text-light)',

    background:
      location.pathname === path
        ? 'rgba(4, 201, 166, 0.1)'
        : hoveredPath === path
          ? 'rgba(4, 201, 166, 0.05)'
          : 'transparent',

    transition: 'all 0.2s ease',
    border: 'none',
    cursor: 'pointer',

  });

  // ====================================================
  // ESTILOS DE MENUS DESPLEGABLES
  // ====================================================

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
    zIndex: 1001,

  };

  // ====================================================
  // CONTROL DE MENUS
  // ====================================================

  const toggleServicesMenu = () => {

    setIsServicesOpen(anterior => !anterior);
    setIsUserOpen(false);

  };

  const toggleUserMenu = () => {

    setIsUserOpen(anterior => !anterior);
    setIsServicesOpen(false);

  };

  const cerrarMenus = () => {

    setIsServicesOpen(false);
    setIsUserOpen(false);
    setHoveredPath(null);

  };

  // ====================================================
  // CERRAR SESION
  // ====================================================

  const handleLogout = () => {

    cerrarMenus();
    cerrarSesion();
    navigate('/login');

  };

  // ====================================================
  // GENERAR ENLACES PUBLICOS
  // ====================================================

  const renderPublicLink = (item) => {

    if (isLanding) {

      return (
        <a
          key={item.id}
          href={`#${item.id}`}
          className="nav-link"
        >
          {item.label}
        </a>
      );

    }

    if (item.dedicatedPath) {

      return (
        <Link
          key={item.id}
          to={item.dedicatedPath}
          className="nav-link"
        >
          {item.label}
        </Link>
      );

    }

    return (
      <Link
        key={item.id}
        to={`/#${item.id}`}
        className="nav-link"
      >
        {item.label}
      </Link>
    );

  };

  // ====================================================
  // GENERAR ENLACES SEGUN EL ROL
  // ====================================================

  const renderRoleLink = (opcion) => {

    const Icono = opcion.icono;

    const rutaCompleta =
      `${basePath}/${opcion.ruta}`;

    return (

      <Link
        key={opcion.ruta}
        to={rutaCompleta}
        style={linkStyle(rutaCompleta)}
        onClick={cerrarMenus}
        onMouseEnter={() =>
          setHoveredPath(rutaCompleta)
        }
        onMouseLeave={() =>
          setHoveredPath(null)
        }
      >

        <Icono size={16} />

        {opcion.nombre}

      </Link>

    );

  };

  // ====================================================
  // INTERFAZ PRINCIPAL
  // ====================================================

  return (

    <nav className="navbar">

      {/* ============================================== */}
      {/* LOGOTIPO                                      */}
      {/* ============================================== */}

      <Link
        to={isDashboard ? basePath : '/'}
        onClick={cerrarMenus}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          textDecoration: 'none',
        }}
      >

        <div
          style={{
            background: 'var(--color-primary)',
            padding: '8px',
            borderRadius: '8px',
            color: 'var(--white)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >

          <Drone size={24} />

        </div>

        <div>

          <h1
            style={{
              margin: 0,
              fontSize: '22px',
              fontWeight: '800',
              letterSpacing: '1px',
              color: 'var(--color-dark)',
            }}
          >
            4 NEXUS
          </h1>

        </div>

      </Link>

      {/* ============================================== */}
      {/* NAVEGACION CENTRAL                             */}
      {/* ============================================== */}

      <div
        className="nav-links"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '30px',
        }}
      >

        {!isDashboard ? (

          <>

            {publicNavItems.map(renderPublicLink)}

          </>

        ) : (

          <>

            {/* DASHBOARD */}

            <Link
              to={basePath}
              style={linkStyle(basePath)}
              onClick={cerrarMenus}
              onMouseEnter={() =>
                setHoveredPath(basePath)
              }
              onMouseLeave={() =>
                setHoveredPath(null)
              }
            >

              <LayoutDashboard size={18} />

              Dashboard

            </Link>

            {/* MENU DESPLEGABLE SEGUN EL ROL */}

            <div style={{ position: 'relative' }}>

              <button
                type="button"
                onClick={toggleServicesMenu}
                onMouseEnter={() =>
                  setHoveredPath('services')
                }
                onMouseLeave={() =>
                  setHoveredPath(null)
                }
                style={linkStyle('services')}
                aria-expanded={isServicesOpen}
              >

                {configuracionMenu.titulo}

                <ChevronDown
                  size={16}
                  style={{
                    transform: isServicesOpen
                      ? 'rotate(180deg)'
                      : 'none',

                    transition: 'all 0.3s',
                  }}
                />

              </button>

              {isServicesOpen && (

                <div style={dropdownStyle}>

                  {configuracionMenu.opciones.map(
                    renderRoleLink
                  )}

                </div>

              )}

            </div>

            {/* SOPORTE */}

            <Link
              to={`${basePath}/soporte`}
              style={linkStyle(`${basePath}/soporte`)}
              onClick={cerrarMenus}
              onMouseEnter={() =>
                setHoveredPath(`${basePath}/soporte`)
              }
              onMouseLeave={() =>
                setHoveredPath(null)
              }
            >

              <MessageSquare size={18} />

              Soporte

            </Link>

          </>

        )}

      </div>

      {/* ============================================== */}
      {/* CONTROLES DEL LADO DERECHO                     */}
      {/* ============================================== */}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
        }}
      >

        {/* CAMBIO DE TEMA */}

        <button
          type="button"
          onClick={toggleTheme}
          onMouseEnter={() =>
            setIsThemeHovered(true)
          }
          onMouseLeave={() =>
            setIsThemeHovered(false)
          }
          style={{

            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',

            background: isThemeHovered
              ? 'rgba(4, 201, 166, 0.05)'
              : 'var(--bg-color)',

            border: isThemeHovered
              ? '1px solid var(--color-primary)'
              : '1px solid var(--light-gray)',

            color: isThemeHovered
              ? 'var(--color-primary)'
              : 'var(--color-dark)',

            padding: 0,

          }}
          title={
            isLight
              ? 'Cambiar a modo oscuro'
              : 'Cambiar a modo claro'
          }
          aria-label={
            isLight
              ? 'Cambiar a modo oscuro'
              : 'Cambiar a modo claro'
          }
        >

          {isLight
            ? <Moon size={18} />
            : <Sun size={18} />
          }

        </button>

        {/* ============================================ */}
        {/* ACCESO PUBLICO O MENU DE USUARIO              */}
        {/* ============================================ */}

        {!isDashboard ? (

          <Link to={usuario ? basePath : '/login'}>

            <Button
              variant="outline-dark"
              size="sm"
            >

              {usuario
                ? 'Ir a mi panel'
                : 'Acceso clientes'
              }

            </Button>

          </Link>

        ) : (

          <div style={{ position: 'relative' }}>

            {/* BOTON DEL USUARIO */}

            <button
              type="button"
              onClick={toggleUserMenu}
              onMouseEnter={() =>
                setHoveredPath('user')
              }
              onMouseLeave={() =>
                setHoveredPath(null)
              }
              aria-expanded={isUserOpen}
              style={{

                display: 'flex',
                alignItems: 'center',
                gap: '10px',

                background:
                  hoveredPath === 'user'
                    ? 'rgba(4, 201, 166, 0.05)'
                    : 'var(--bg-color)',

                border:
                  hoveredPath === 'user'
                    ? '1px solid var(--color-primary)'
                    : '1px solid var(--light-gray)',

                padding: '6px 12px',
                borderRadius: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',

              }}
            >

              {/* AVATAR */}

              <div
                style={{
                  background: 'var(--color-primary)',
                  color: 'white',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  textTransform: 'uppercase',
                }}
              >

                {(usuario?.first_name || userRole).charAt(0)}

              </div>

              {/* NOMBRE DEL USUARIO */}

              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 'bold',

                  color:
                    hoveredPath === 'user'
                      ? 'var(--color-primary)'
                      : 'var(--color-dark)',

                  textTransform: 'capitalize',
                }}
              >

                {usuario?.first_name || userRole}

              </span>

              <ChevronDown
                size={16}
                color={
                  hoveredPath === 'user'
                    ? 'var(--color-primary)'
                    : 'var(--text-light)'
                }
                style={{
                  transform: isUserOpen
                    ? 'rotate(180deg)'
                    : 'none',

                  transition: 'all 0.3s',
                }}
              />

            </button>

            {/* MENU DESPLEGABLE DEL USUARIO */}

            {isUserOpen && (

              <div
                style={{
                  ...dropdownStyle,
                  left: 'auto',
                  right: 0,
                }}
              >

                {/* PERFIL */}

                <Link
                  to={`${basePath}/perfil`}
                  style={linkStyle(`${basePath}/perfil`)}
                  onClick={cerrarMenus}
                  onMouseEnter={() =>
                    setHoveredPath(`${basePath}/perfil`)
                  }
                  onMouseLeave={() =>
                    setHoveredPath(null)
                  }
                >

                  <User size={16} />

                  Mi Perfil

                </Link>

                <hr
                  style={{
                    border: 'none',
                    borderTop:
                      '1px solid var(--light-gray)',

                    margin: '5px 0',
                  }}
                />

                {/* CERRAR SESION */}

                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'none',
                    border: 'none',
                    padding: '10px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--color-danger)',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(evento) => {
                    evento.currentTarget.style.background =
                      'rgba(240, 37, 88, 0.05)';
                  }}
                  onMouseLeave={(evento) => {
                    evento.currentTarget.style.background =
                      'none';
                  }}
                >

                  <LogOut size={16} />

                  Cerrar Sesión

                </button>

              </div>

            )}

          </div>

        )}

      </div>

    </nav>

  );

};

export default Navbar;