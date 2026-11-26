import { useState, useEffect, useRef } from 'react';
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
  Bell,
  Check,
  Trash2,
  X,
  AlertTriangle,
  ShieldCheck,
  ThumbsUp,
  ShoppingCart,
} from 'lucide-react';

import { Button } from '../ui';
import { useSesion } from '../../hooks/useSesion';
import { useCarrito } from '../../hooks/useCarrito';
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

      {
        ruta:'pedidos',
        nombre:'Mis Pedidos',
        icono: ShoppingCart,
      },
      // HU-010, HU-011 Y HU-012

      {
        ruta: 'equipos',
        nombre: 'Mis equipos',
        icono: Package,
      },
      {
        ruta: 'reparaciones',
        nombre: 'Mis reparaciones',
        icono: Wrench,
      },
      {
        ruta: 'historial-reparaciones',
        nombre: 'Historial de reparaciones',
        icono: FileText,
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

    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [notificaciones, setNotificaciones] = useState([]);
    const [leidasIds, setLeidasIds] = useState([]);
    const [eliminadasIds, setEliminadasIds] = useState([]);
    const [filtroNotif, setFiltroNotif] = useState('todas');

    const prevMisionesRef = useRef([]);
    const hasLoadedMocks = useRef(false);
    const mocksRef = useRef([]);

  // ====================================================
  // CONTEXTOS
  // ====================================================

   const { theme, toggleTheme } = useTheme();

  const {
    usuario,
    rol,
    cerrarSesion,
  } = useSesion();

  const { cantidadArticulos } = useCarrito();

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

    useEffect(() => {
        if (userRole === 'piloto' && usuario?.id) {
            const storedLeidas = localStorage.getItem(`nexus_notif_leidas_${usuario.id}`);
            if (storedLeidas) {
                setLeidasIds(JSON.parse(storedLeidas));
            }
            const storedEliminadas = localStorage.getItem(`nexus_notif_eliminadas_${usuario.id}`);
            if (storedEliminadas) {
                setEliminadasIds(JSON.parse(storedEliminadas));
            }
        }
    }, [userRole, usuario]);

    useEffect(() => {
        if (userRole !== 'piloto' || !usuario?.id) return;

        const fetchNotificaciones = async (isInitial = false) => {
            try {
                const token = localStorage.getItem('access_token');
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
                const response = await fetch(`${API_URL}/pilotos/misiones/?estado=PENDIENTE`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                let notifs = [];

                if (response.ok) {
                    const data = await response.json();
                    const misionesPendientes = Array.isArray(data) ? data : (data.results || []);

                    notifs = misionesPendientes
                        .filter(m => !eliminadasIds.includes(`mision-${m.id}`))
                        .map(m => ({
                            id: `mision-${m.id}`,
                            type: 'aprobacion',
                            title: 'Nueva misión asignada',
                            detail: `${m.categoria} en ${m.ubicacion}`,
                            time: m.fecha_creacion || new Date().toISOString(),
                            link: `${basePath}/misiones?id=${m.id}`
                        }));
                }

                if (!hasLoadedMocks.current) {
                    mocksRef.current = [
                        {
                            id: `alerta-1`,
                            type: 'alerta',
                            title: 'Alerta técnica detectada',
                            detail: 'Batería del dron DJI Agras T40 reporta temperatura alta.',
                            time: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
                            link: `${basePath}/bitacora`
                        },
                        {
                            id: `mantenimiento-1`,
                            type: 'mantenimiento',
                            title: 'Mantenimiento programado',
                            detail: 'Revisión de hélices y motores en el dron Matrice 350 RTK.',
                            time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
                            link: `${basePath}/historial`
                        },
                        {
                            id: `licencia-1`,
                            type: 'licencia',
                            title: 'Licencia aprobada',
                            detail: 'Tu licencia aeronáutica ha sido verificada y aprobada.',
                            time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
                            link: `${basePath}/perfil`
                        }
                    ].filter(n => !eliminadasIds.includes(n.id));
                    hasLoadedMocks.current = true;
                }

                const mocksValidos = mocksRef.current.filter(n => !eliminadasIds.includes(n.id));
                notifs = [...notifs, ...mocksValidos];

                if (!isInitial) {
                    const prevIds = prevMisionesRef.current;
                    const nuevasMisiones = notifs.filter(n => n.type === 'aprobacion' && !prevIds.includes(n.id));

                    if (nuevasMisiones.length > 0) {
                        const audio = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_bb630cc098.mp3?filename=bell-notification-9585.mp3');
                        audio.volume = 1.0;
                        audio.play().catch(e => console.log('Autoplay bloqueado.'));
                    }
                }

                prevMisionesRef.current = notifs.filter(n => n.type === 'aprobacion').map(n => n.id);
                setNotificaciones(notifs);
            } catch (error) {
                console.error("Error al cargar notificaciones", error);
            }
        };

        fetchNotificaciones(true);

        const intervalId = setInterval(() => {
            fetchNotificaciones(false);
        }, 5000);

        return () => clearInterval(intervalId);
    }, [userRole, usuario, basePath, eliminadasIds]);

    const actualizarLeidas = (nuevasLeidas) => {
        setLeidasIds(nuevasLeidas);
        if (usuario?.id) {
            localStorage.setItem(`nexus_notif_leidas_${usuario.id}`, JSON.stringify(nuevasLeidas));
        }
    };

    const actualizarEliminadas = (nuevasEliminadas) => {
        setEliminadasIds(nuevasEliminadas);
        if (usuario?.id) {
            localStorage.setItem(`nexus_notif_eliminadas_${usuario.id}`, JSON.stringify(nuevasEliminadas));
        }
    };

    const marcarTodasComoLeidas = (e) => {
        if (e) e.stopPropagation();
        const allIds = [...new Set([...leidasIds, ...notificaciones.map(n => n.id)])];
        actualizarLeidas(allIds);
    };

    const marcarIndividualComoLeida = (id, e) => {
        if (e) {
            e.stopPropagation();
        }
        if (!leidasIds.includes(id)) {
            const nuevasLeidas = [...leidasIds, id];
            actualizarLeidas(nuevasLeidas);
        }
    };

    const eliminarNotificacion = (id, e) => {
        e.stopPropagation();
        setNotificaciones(prev => prev.filter(notif => notif.id !== id));

        const nuevasEliminadas = [...new Set([...eliminadasIds, id])];
        actualizarEliminadas(nuevasEliminadas);

        if (!leidasIds.includes(id)) {
            const nuevasLeidas = [...leidasIds, id];
            actualizarLeidas(nuevasLeidas);
        }
    };

    const limpiarTodasNotificaciones = (e) => {
        if (e) e.stopPropagation();
        const idsAEliminar = notificaciones.map(n => n.id);
        const nuevasEliminadas = [...new Set([...eliminadasIds, ...idsAEliminar])];
        actualizarEliminadas(nuevasEliminadas);

        setNotificaciones([]);

        const allIds = [...new Set([...leidasIds, ...idsAEliminar])];
        actualizarLeidas(allIds);
    };

    const handleLinkClick = (link, notifId, e) => {
        e.preventDefault();
        marcarIndividualComoLeida(notifId, e);
        window.location.href = link;
    };

    const getTiempoRelativo = (fechaString) => {
        const fecha = new Date(fechaString);
        if (isNaN(fecha.getTime())) return 'Reciente';

        const diff = Math.floor((new Date() - fecha) / 1000);

        if (diff < 60) return `hace ${diff} seg`;
        if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
        if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
        return `hace ${Math.floor(diff / 86400)} d`;
    };

    const getNotifStyle = (type) => {
        switch(type) {
            case 'aprobacion': return { Icon: ThumbsUp, color: 'var(--color-success)', bg: 'rgba(4, 201, 166, 0.1)' };
            case 'alerta': return { Icon: AlertTriangle, color: 'var(--color-danger)', bg: 'rgba(240, 37, 88, 0.1)' };
            case 'mantenimiento': return { Icon: Wrench, color: 'var(--color-warning)', bg: 'rgba(241, 190, 38, 0.1)' };
            case 'licencia': return { Icon: ShieldCheck, color: 'var(--color-info)', bg: 'rgba(45, 210, 246, 0.1)' };
            default: return { Icon: Bell, color: 'var(--text-light)', bg: 'rgba(0,0,0,0.05)' };
        }
    };

    const notificacionesOrdenadas = [...notificaciones].sort((a, b) => new Date(b.time) - new Date(a.time));

    const notificacionesFiltradas = notificacionesOrdenadas.filter(notif => {
        const isLeida = leidasIds.includes(notif.id);
        if (filtroNotif === 'leidas') return isLeida;
        if (filtroNotif === 'no_leidas') return !isLeida;
        return true;
    });

    const notificacionesNoLeidas = notificaciones.filter(n => !leidasIds.includes(n.id));



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
    setIsNotifOpen(false);
    setIsUserOpen(false);

  };

  const toggleUserMenu = () => {

    setIsUserOpen(anterior => !anterior);
    setIsNotifOpen(false);
    setIsServicesOpen(false);

  };

  const cerrarMenus = () => {
    setIsNotifOpen(false);

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

    const filterBtnStyle = (isActive) => ({
        background: isActive ? 'rgba(4, 201, 166, 0.1)' : 'none',
        border: 'none',
        color: isActive ? 'var(--color-primary)' : 'var(--text-light)',
        fontSize: '11px',
        fontWeight: 'bold',
        padding: '4px 8px',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'all 0.2s'
    });

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

    <>
            <style>{`
                .custom-scroll::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scroll::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scroll::-webkit-scrollbar-thumb {
                    background: rgba(4, 201, 166, 0.3);
                    border-radius: 10px;
                }
                .custom-scroll::-webkit-scrollbar-thumb:hover {
                    background: rgba(4, 201, 166, 0.6);
                }
                .custom-scroll {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(4, 201, 166, 0.3) transparent;
                }
            `}</style>
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

                    {!isDashboard && (
                        <button
                            onClick={toggleTheme}
                            onMouseEnter={() => setIsThemeHovered(true)}
                            onMouseLeave={() => setIsThemeHovered(false)}
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                background: isThemeHovered ? 'rgba(4, 201, 166, 0.05)' : 'var(--bg-color)',
                                border: isThemeHovered ? '1px solid var(--color-primary)' : '1px solid var(--light-gray)',
                                color: isThemeHovered ? 'var(--color-primary)' : 'var(--color-dark)',
                                padding: 0
                            }}
                            title={isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
                        >
                            {isLight ? <Moon size={18} /> : <Sun size={18} />}
                        </button>
                    )}

                    {isDashboard && userRole === 'piloto' && (
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => {
                                    setIsNotifOpen(anterior => !anterior);
                                    setIsServicesOpen(false);
                                    setIsUserOpen(false);
                                }}
                                style={{
                                    width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', transition: 'all 0.2s ease', padding: 0,
                                    background: isNotifOpen ? 'rgba(4, 201, 166, 0.1)' : 'var(--bg-color)',
                                    border: isNotifOpen ? '1px solid var(--color-primary)' : '1px solid var(--light-gray)',
                                    color: isNotifOpen ? 'var(--color-primary)' : 'var(--color-dark)',
                                    position: 'relative'
                                }}
                            >
                                <Bell size={18} />
                                {notificacionesNoLeidas.length > 0 && (
                                    <span style={{
                                        position: 'absolute', top: '2px', right: '2px', background: 'var(--color-danger)',
                                        color: 'white', fontSize: '10px', fontWeight: 'bold', width: '16px', height: '16px',
                                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {notificacionesNoLeidas.length}
                                    </span>
                                )}
                            </button>

                            {isNotifOpen && (
                                <div style={{ ...dropdownStyle, left: 'auto', right: 0, width: '380px', padding: '0' }}>
                                    <div style={{ padding: '16px', borderBottom: '1px solid var(--light-gray)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--color-dark)' }}>Notificaciones</h3>
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                {notificacionesNoLeidas.length > 0 && (
                                                    <button onClick={marcarTodasComoLeidas} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                                                        Marcar leídas
                                                    </button>
                                                )}
                                                {notificaciones.length > 0 && (
                                                    <button onClick={limpiarTodasNotificaciones} style={{ background: 'none', border: 'none', color: 'gray', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                                                        Limpiar
                                                    </button>
                                                )}
                                                <button onClick={() => setIsNotifOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', display: 'flex', padding: '2px' }}>
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px', borderBottom: '1px', paddingBottom: '8px' }}>
                                            <button onClick={() => setFiltroNotif('todas')} style={filterBtnStyle(filtroNotif === 'todas')}>Todas</button>
                                            <button onClick={() => setFiltroNotif('no_leidas')} style={filterBtnStyle(filtroNotif === 'no_leidas')}>No leídas</button>
                                            <button onClick={() => setFiltroNotif('leidas')} style={filterBtnStyle(filtroNotif === 'leidas')}>Leídas</button>
                                        </div>
                                    </div>
                                    <div className="custom-scroll" style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                                        {notificacionesFiltradas.length === 0 ? (
                                            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-light)', fontSize: '13px' }}>
                                                No hay notificaciones para mostrar.
                                            </div>
                                        ) : (
                                            notificacionesFiltradas.map(notif => {
                                                const isLeida = leidasIds.includes(notif.id);
                                                const { Icon: NotifIcon, color: iconColor, bg: iconBg } = getNotifStyle(notif.type);
                                                return (
                                                    <div key={notif.id} style={{ padding: '16px', borderBottom: '1px solid var(--light-gray)', backgroundColor: isLeida ? 'var(--white)' : 'rgba(4, 201, 166, 0.02)', opacity: isLeida ? 0.7 : 1, display: 'flex', gap: '12px' }}>
                                                        <div style={{ background: iconBg, color: iconColor, width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                            <NotifIcon size={18} />
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                                                <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: isLeida ? 'var(--text-light)' : 'var(--color-dark)' }}>
                                                                    {notif.title}
                                                                </p>
                                                                <span style={{ fontSize: '11px', color: 'var(--text-light)', flexShrink: 0, marginLeft: '8px' }}>
                                                                    {getTiempoRelativo(notif.time)}
                                                                </span>
                                                            </div>
                                                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-light)', marginBottom: '8px' }}>
                                                                {notif.detail}
                                                            </p>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <button
                                                                    onClick={(e) => handleLinkClick(notif.link, notif.id, e)}
                                                                    style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 'bold', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                                                                >
                                                                    Ver detalle
                                                                </button>
                                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                                    {!isLeida && (
                                                                        <button
                                                                            onClick={(e) => marcarIndividualComoLeida(notif.id, e)}
                                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-success)', padding: '4px' }}
                                                                            title="Marcar como leída"
                                                                        >
                                                                            <Check size={16} />
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={(e) => eliminarNotificacion(notif.id, e)}
                                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'gray', padding: '4px' }}
                                                                        title="Eliminar notificación"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                                        {usuario && rol === 'cliente' && (
                        <Link
                            to="/cliente/carrito"
                            title="Mi carrito"
                            style={{
                                width: '40px', height: '40px', borderRadius: '50%', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', position: 'relative',
                                background: 'var(--bg-color)', border: '1px solid var(--light-gray)',
                                color: 'var(--color-dark)', textDecoration: 'none',
                            }}
                        >
                            <ShoppingCart size={18} />
                            {cantidadArticulos > 0 && (
                                <span style={{
                                    position: 'absolute', top: '-4px', right: '-4px', background: 'var(--color-primary)',
                                    color: 'white', fontSize: '10px', fontWeight: 'bold', minWidth: '18px', height: '18px',
                                    padding: '0 4px', borderRadius: '9px', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    {cantidadArticulos}
                                </span>
                            )}
                        </Link>
                    )}

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

                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleTheme(); }}
                                            onMouseEnter={() => setHoveredPath('theme-toggle')}
                                            onMouseLeave={() => setHoveredPath(null)}
                                            style={linkStyle('theme-toggle')}
                                        >
                                            {isLight ? <Moon size={16} /> : <Sun size={16} />}
                                            {isLight ? 'Modo Oscuro' : 'Modo Claro'}
                                        </button>

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
    </>

  );

};

export default Navbar;
