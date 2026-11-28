import { Routes, Route } from 'react-router-dom';
import RutaProtegida from './components/auth/RutaProtegida';
import { useSesion } from './hooks/useSesion';

// PÁGINAS PÚBLICAS
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Catalog from './pages/Catalog';
import Suscription from './pages/Suscription';
import FormularioContacto from './pages/FormularioContacto';
import NotFound from './pages/NotFound';

// LAYOUTS
import { ClienteLayout } from './layouts/ClienteLayout';
import AdminLayout from './layouts/AdminLayout';
import { PilotoLayout } from './layouts/PilotoLayout';
import TecnicoLayout from './layouts/TecnicoLayout';

// PÁGINAS DEL CLIENTE
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

// PÁGINAS DEL ADMINISTRADOR
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsuarios from './pages/admin/AdminUsuarios';
import AdminPrecios from './pages/admin/AdminPrecios';
import AdminOperaciones from './pages/admin/AdminOperaciones';
import AdminReparaciones from './pages/admin/AdminReparaciones';
import AdminHistorial from './pages/admin/AdminHistorial';
import AdminSoporte from './pages/admin/AdminSoporte';
import AdminPerfil from './pages/admin/AdminPerfil';
import AdminConfigCarga from './pages/admin/AdminConfigCarga';
import AdminCheckout from './pages/admin/AdminCheckout';
import AdminTracking from './pages/admin/AdminTracking';

// PÁGINAS DEL PILOTO
import PilotoDashboard from './pages/piloto/PilotoDashboard';
import PilotoMisiones from './pages/piloto/PilotoMisiones';
import PilotoBitacora from './pages/piloto/PilotoBitacora';
import PilotoFacturacion from './pages/piloto/PilotoFacturacion';
import PilotoHistorial from './pages/piloto/PilotoHistorial';
import PilotoSoporte from './pages/piloto/PilotoSoporte';
import PilotoPerfil from './pages/piloto/PilotoPerfil';

// PÁGINAS DEL TÉCNICO
import TecnicoOrdenes from './pages/tecnico/TecnicoOrdenes';
import TecnicoPerfil from './pages/tecnico/TecnicoPerfil';
import TecnicoSoporte from './pages/tecnico/TecnicoSoporte'; 

// COMPONENTE PRINCIPAL
function App() {
  const { cerrarSesion } = useSesion();

  return (
    <Routes>
      {/* 1. RUTAS PÚBLICAS */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/catalog" element={<Catalog />} />
      <Route path="/suscription" element={<Suscription />} />
      <Route path="/formulario-contacto" element={<FormularioContacto />} />

      {/* 2. RUTAS PRIVADAS DEL CLIENTE */}
      <Route element={<RutaProtegida rol="cliente" />}>
        <Route path="/cliente" element={<ClienteLayout />}>
          <Route index element={<ClienteDashboard />} />
          <Route path="suscripciones" element={<ClienteSuscripciones />} />
          <Route path="drones" element={<ClienteDrones />} />
          <Route path="servicios" element={<ClienteServicios />} />
          <Route path="historial" element={<ClienteHistorial />} />
          <Route path="soporte" element={<ClienteSoporte />} />
          <Route path="perfil" element={<ClientePerfil onLogout={cerrarSesion} />} />
          <Route path="equipos" element={<ClienteEquipos />} />
          <Route path="reparaciones" element={<ClienteReparaciones />} />
          <Route path="historial-reparaciones" element={<HistorialReparaciones />} />
          <Route path="carrito" element={<ClienteCarrito />} />
          <Route path="checkout" element={<ClienteCheckout />} />
          <Route path="pedidos" element={<ClientePedidos />} />
        </Route>
      </Route>

      {/* 3. RUTAS PRIVADAS DEL ADMINISTRADOR */}
      <Route element={<RutaProtegida rol="admin" />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="usuarios" element={<AdminUsuarios />} />
          <Route path="precios" element={<AdminPrecios />} />
          <Route path="historial" element={<AdminHistorial />} />
          <Route path="soporte" element={<AdminSoporte />} />
          <Route path="perfil" element={<AdminPerfil onLogout={cerrarSesion} />} />
          <Route path="operaciones" element={<AdminOperaciones />} />
          <Route path="operaciones/config-carga" element={<AdminConfigCarga />} />
          <Route path="operaciones/checkout" element={<AdminCheckout />} />
          <Route path="operaciones/tracking" element={<AdminTracking />} />
          <Route path="reparaciones" element={<AdminReparaciones />} />
        </Route>
      </Route>

      {/* 4. RUTAS PRIVADAS DEL PILOTO */}
      <Route element={<RutaProtegida rol="piloto" />}>
        <Route path="/piloto" element={<PilotoLayout />}>
          <Route index element={<PilotoDashboard />} />
          <Route path="misiones" element={<PilotoMisiones />} />
          <Route path="bitacora" element={<PilotoBitacora />} />
          <Route path="facturacion" element={<PilotoFacturacion />} />
          <Route path="historial" element={<PilotoHistorial />} />
          <Route path="soporte" element={<PilotoSoporte />} />
          <Route path="perfil" element={<PilotoPerfil onLogout={cerrarSesion} />} />
        </Route>
      </Route>

      {/* 5. RUTAS PRIVADAS DEL TÉCNICO */}
      <Route element={<RutaProtegida rol="tecnico" />}>
        <Route path="/tecnico" element={<TecnicoLayout />}>
          <Route index element={<TecnicoOrdenes />} />
          <Route path="ordenes" element={<TecnicoOrdenes />} />
          <Route path="soporte" element={<TecnicoSoporte />} />
          <Route path="perfil" element={<TecnicoPerfil onLogout={cerrarSesion} />} />
        </Route>
      </Route>

      {/* 6. RUTA PARA ERRORES 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;