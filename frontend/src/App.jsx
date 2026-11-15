import { Routes, Route } from 'react-router-dom';

// --- PÁGINAS PÚBLICAS ---
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Catalog from './pages/Catalog';
import NotFound from './pages/NotFound';

// --- LAYOUTS ---
import { ClienteLayout } from './layouts/ClienteLayout';
import AdminLayout from './layouts/AdminLayout';

// --- PÁGINAS DEL CLIENTE ---
import { ClienteDashboard } from './pages/cliente/ClienteDashboard';
import { ClienteSuscripciones } from './pages/cliente/ClienteSuscripciones';
import { ClienteDrones } from './pages/cliente/ClienteDrones';
import ClientePerfil from './pages/cliente/ClientePerfil';
import ClienteServicios from './pages/cliente/ClienteServicios'; // <-- NUEVO
import ClienteHistorial from './pages/cliente/ClienteHistorial'; // <-- NUEVO
import ClienteSoporte from './pages/cliente/ClienteSoporte';     // <-- NUEVO

// --- PÁGINAS DEL ADMINISTRADOR ---
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsuarios from './pages/admin/AdminUsuarios';
import AdminPrecios from './pages/admin/AdminPrecios';
import AdminOperaciones from './pages/admin/AdminOperaciones';
import AdminHistorial from './pages/admin/AdminHistorial';
import AdminSoporte from './pages/admin/AdminSoporte';
import AdminPerfil from './pages/admin/AdminPerfil';
import AdminConfigCarga from './pages/admin/AdminConfigCarga';
import AdminCheckout from './pages/admin/AdminCheckout';
import AdminTracking from './pages/admin/AdminTracking';

function App() {
  return (
    <Routes>
      {/* 1. RUTAS PÚBLICAS */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/catalog" element={<Catalog />} />

      {/* 2. RUTAS PRIVADAS DEL CLIENTE */}
      <Route path="/cliente" element={<ClienteLayout />}>
        <Route index element={<ClienteDashboard />} />
        <Route path="suscripciones" element={<ClienteSuscripciones />} />
        <Route path="drones" element={<ClienteDrones />} />
        
        {/* Rutas Activas del Cliente */}
        <Route path="servicios" element={<ClienteServicios />} />
        <Route path="historial" element={<ClienteHistorial />} />
        <Route path="soporte" element={<ClienteSoporte />} />

        <Route 
          path="perfil" 
          element={
            <ClientePerfil 
              onLogout={() => { 
                localStorage.removeItem('user_role'); 
                window.location.href='/login'; 
              }} 
            />
          } 
        />
      </Route>

      {/* 3. RUTAS PRIVADAS DEL ADMINISTRADOR */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        
        <Route path="usuarios" element={<AdminUsuarios />} />
        <Route path="precios" element={<AdminPrecios />} />
        <Route path="historial" element={<AdminHistorial />} />
        <Route path="soporte" element={<AdminSoporte />} />
        
        <Route 
          path="perfil" 
          element={
            <AdminPerfil 
              onLogout={() => { 
                localStorage.removeItem('user_role'); 
                window.location.href='/login'; 
              }} 
            />
          } 
        />

        {/* Sub-rutas de Operaciones */}
        <Route path="operaciones" element={<AdminOperaciones />} />
        <Route path="operaciones/config-carga" element={<AdminConfigCarga />} />
        <Route path="operaciones/checkout" element={<AdminCheckout />} />
        <Route path="operaciones/tracking" element={<AdminTracking />} />
      </Route>

      {/* 4. RUTA COMODÍN PARA ERRORES 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;