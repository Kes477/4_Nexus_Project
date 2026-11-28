import ActivarCuenta from './pages/ActivarCuenta';
import { Routes, Route } from 'react-router-dom';
import RutaProtegida from './components/auth/RutaProtegida';
import { useSesion } from './hooks/useSesion';

import {
    PERMISOS,
    PERMISOS_PANEL_GESTION
} from './config/permisos';


// ======================================================
// PÁGINAS PÚBLICAS
// ======================================================

import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import SeleccionarPanel from './pages/SeleccionarPanel';
import Catalog from './pages/Catalog';
import Suscription from './pages/Suscription';
import FormularioContacto from './pages/FormularioContacto';
import NotFound from './pages/NotFound';

// ======================================================
// LAYOUTS
// ======================================================

import { ClienteLayout } from './layouts/ClienteLayout';
import AdminLayout from './layouts/AdminLayout';
import { PilotoLayout } from './layouts/PilotoLayout';
import TecnicoLayout from './layouts/TecnicoLayout';

// Pendiente: Layout de vendedores.

// ======================================================
// PÁGINAS DEL CLIENTE
// ======================================================

import { ClienteDashboard } from './pages/cliente/ClienteDashboard';
import { ClienteSuscripciones } from './pages/cliente/ClienteSuscripciones';
import { ClienteDrones } from './pages/cliente/ClienteDrones';
import ClientePerfil from './pages/cliente/ClientePerfil';
import ClienteServicios from './pages/cliente/ClienteServicios';
import ClienteHistorial from './pages/cliente/ClienteHistorial';
import ClienteSoporte from './pages/cliente/ClienteSoporte';
import ClienteEquipos from './pages/cliente/ClienteEquipos';
import ClienteCarrito from './pages/cliente/ClienteCarrito';
import ClienteCheckout from './pages/cliente/ClienteCheckout';
import ClientePedidos from './pages/cliente/ClientePedidos';
import ClienteReparaciones from './pages/cliente/ClienteReparaciones';
import HistorialReparaciones from './pages/cliente/HistorialReparaciones';

// ======================================================
// PÁGINAS DEL ADMINISTRADOR
// ======================================================


import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsuarios from './pages/admin/AdminUsuarios';
import AdminRoles from './pages/admin/AdminRoles';
import AdminPrecios from './pages/admin/AdminPrecios';
import AdminOperaciones from './pages/admin/AdminOperaciones';
import AdminReparaciones from './pages/admin/AdminReparaciones';
import AdminHistorial from './pages/admin/AdminHistorial';
import AdminSoporte from './pages/admin/AdminSoporte';
import AdminPerfil from './pages/admin/AdminPerfil';
import AdminConfigCarga from './pages/admin/AdminConfigCarga';
import AdminCheckout from './pages/admin/AdminCheckout';
import AdminTracking from './pages/admin/AdminTracking';

// ======================================================
// PÁGINAS DEL PILOTO
// ======================================================

import PilotoDashboard from './pages/piloto/PilotoDashboard';
import PilotoMisiones from './pages/piloto/PilotoMisiones';
import PilotoBitacora from './pages/piloto/PilotoBitacora';
import PilotoFacturacion from './pages/piloto/PilotoFacturacion';
import PilotoHistorial from './pages/piloto/PilotoHistorial';
import PilotoSoporte from './pages/piloto/PilotoSoporte';
import PilotoPerfil from './pages/piloto/PilotoPerfil';

// ======================================================
// PÁGINAS DEL TÉCNICO
// ======================================================

import TecnicoOrdenes from './pages/tecnico/TecnicoOrdenes';
import TecnicoPerfil from './pages/tecnico/TecnicoPerfil';

// ======================================================
// PÁGINAS DEL VENDEDOR
// ======================================================

// Pendiente de implementación.

// ======================================================
// COMPONENTE PRINCIPAL
// ======================================================

function App() {

  const { cerrarSesion } = useSesion();

  return (

    <Routes>
            <Route path="/activar-cuenta" element={<ActivarCuenta />} />

      {/* ================================================= */}
      {/* 1. RUTAS PÚBLICAS                                 */}
      {/* ================================================= */}

      <Route path="/" element={<LandingPage />} />

      <Route path="/login" element={<Login />} />

      <Route
        path="/seleccionar-panel"
        element={
          <RutaProtegida>
            <SeleccionarPanel />
          </RutaProtegida>
        }
      />

      <Route path="/catalog" element={<Catalog />} />

      <Route path="/suscription" element={<Suscription />} />

      <Route
        path="/formulario-contacto"
        element={<FormularioContacto />}
      />

      {/* ================================================= */}
      {/* 2. RUTAS PRIVADAS DEL CLIENTE                     */}
      {/* ================================================= */}

      <Route element={<RutaProtegida rol="cliente" />}>

        <Route path="/cliente" element={<ClienteLayout />}>

          <Route index element={<ClienteDashboard />} />
          <Route path="suscripciones" element={<ClienteSuscripciones />} />
          <Route path="drones" element={<ClienteDrones />} />
          <Route path="servicios" element={<ClienteServicios />} />
          <Route path="historial" element={<ClienteHistorial />} />
          <Route path="soporte" element={<ClienteSoporte />} />
          <Route path="perfil" element={<ClientePerfil onLogout={cerrarSesion} />} />

          {/* HU-010, HU-011 y HU-012 */}
          <Route path="equipos" element={<ClienteEquipos />} />

          {/* HU-016: SEGUIMIENTO DE REPARACIONES */}
          <Route path="reparaciones" element={<ClienteReparaciones />} />

          {/* HU-017: HISTORIAL DE REPARACIONES */}
          <Route path="historial-reparaciones" element={<HistorialReparaciones />} />

          {/* COMPRAS */}
          <Route path="carrito" element={<ClienteCarrito />} />

          <Route path="checkout" element={<ClienteCheckout />} />
          
          <Route path="pedidos" element={<ClientePedidos />} />
        </Route>

      </Route>

      {/* ================================================= */}
      {/* 3. RUTAS PRIVADAS DEL ADMINISTRADOR               */}
      {/* ================================================= */}

      <Route element={
        <RutaProtegida
          rol="admin"
          permisos={PERMISOS_PANEL_GESTION}
          rolOPermisos={true}
        />
      }>

        <Route path="/admin" element={<AdminLayout />}>

          <Route
            path="roles"
            element={
              <RutaProtegida permiso={PERMISOS.CONSULTAR_ROLES}>
                <AdminRoles />
              </RutaProtegida>
            }
          />


          <Route index element={
              <RutaProtegida rol="admin">
                <AdminDashboard />
              </RutaProtegida>
            } />

          <Route
            path="usuarios"
            element={
              <RutaProtegida permiso={PERMISOS.CONSULTAR_USUARIOS}>
                <AdminUsuarios />
              </RutaProtegida>
            }
          />

          <Route
            path="precios"
            element={
              <RutaProtegida rol="admin">
                <AdminPrecios />
              </RutaProtegida>
            }
          />

          <Route
            path="historial"
            element={
              <RutaProtegida rol="admin">
                <AdminHistorial />
              </RutaProtegida>
            }
          />

          <Route
            path="soporte"
            element={
              <RutaProtegida rol="admin">
                <AdminSoporte />
              </RutaProtegida>
            }
          />

          <Route
            path="perfil"
            element={
              <AdminPerfil onLogout={cerrarSesion} />
            }
          />

          {/* OPERACIONES GLOBALES */}

          <Route
            path="operaciones"
            element={
              <RutaProtegida rol="admin">
                <AdminOperaciones />
              </RutaProtegida>
            }
          />

          <Route
            path="operaciones/config-carga"
            element={
              <RutaProtegida rol="admin">
                <AdminConfigCarga />
              </RutaProtegida>
            }
          />

          <Route
            path="operaciones/checkout"
            element={
              <RutaProtegida rol="admin">
                <AdminCheckout />
              </RutaProtegida>
            }
          />

          <Route
            path="operaciones/tracking"
            element={
              <RutaProtegida rol="admin">
                <AdminTracking />
              </RutaProtegida>
            }
          />

          {/* HU-013: GESTIÓN DE ÓRDENES DE SERVICIO */}

          <Route
            path="reparaciones"
            element={
              <RutaProtegida permiso={PERMISOS.CONSULTAR_REPARACIONES}>
                <AdminReparaciones />
              </RutaProtegida>
            }
          />

        </Route>

      </Route>

      {/* ================================================= */}
      {/* 4. RUTAS PRIVADAS DEL PILOTO                      */}
      {/* ================================================= */}

      <Route element={<RutaProtegida rol="piloto" />}>

        <Route path="/piloto" element={<PilotoLayout />}>

          <Route index element={<PilotoDashboard />} />

          <Route
            path="misiones"
            element={<PilotoMisiones />}
          />

          <Route
            path="bitacora"
            element={<PilotoBitacora />}
          />

          <Route
            path="facturacion"
            element={<PilotoFacturacion />}
          />

          <Route
            path="historial"
            element={<PilotoHistorial />}
          />

          <Route
            path="soporte"
            element={<PilotoSoporte />}
          />

          <Route
            path="perfil"
            element={
              <PilotoPerfil onLogout={cerrarSesion} />
            }
          />

        </Route>

      </Route>

      {/* ================================================= */}
      {/* 5. RUTAS PRIVADAS DEL TÉCNICO                     */}
      {/* ================================================= */}

      <Route element={<RutaProtegida rol="tecnico" />}>

        <Route path="/tecnico" element={<TecnicoLayout />}>

          <Route index element={<TecnicoOrdenes />} />

          <Route
            path="ordenes"
            element={<TecnicoOrdenes />}
          />

          <Route
            path="perfil"
            element={
              <TecnicoPerfil onLogout={cerrarSesion} />
            }
          />

        </Route>

      </Route>

      {/* ================================================= */}
      {/* 6. RUTAS PRIVADAS DEL VENDEDOR                    */}
      {/* ================================================= */}

      {/* Pendiente de implementación. */}

      {/* 7. RUTA PARA ERRORES 404                          */}
      <Route path="*" element={<NotFound />} />

    </Routes>

  );

}

export default App;