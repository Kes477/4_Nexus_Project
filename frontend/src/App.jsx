import { Routes, Route } from 'react-router-dom';

// --- PÁGINAS PÚBLICAS ---
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Catalog from './pages/Catalog';
import NotFound from './pages/NotFound';

// --- LAYOUTS ---
import { ClienteLayout } from './layouts/ClienteLayout';

// --- PÁGINAS DEL CLIENTE ---
import { ClienteDashboard } from './pages/cliente/ClienteDashboard';
import { ClienteSuscripciones } from './pages/cliente/ClienteSuscripciones';
import { ClienteDrones } from './pages/cliente/ClienteDrones';

function App() {
  return (
    <Routes>
      {/* 1. RUTAS PÚBLICAS */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/catalog" element={<Catalog />} />

      {/* 2. RUTAS PRIVADAS DEL CLIENTE (Envuelven las páginas con el Navbar) */}
      <Route path="/cliente" element={<ClienteLayout />}>
        {/* Al entrar a /cliente, se carga el Dashboard por defecto */}
        <Route index element={<ClienteDashboard />} />
        
        {/* Sub-rutas */}
        <Route path="suscripciones" element={<ClienteSuscripciones />} />
        <Route path="drones" element={<ClienteDrones />} />
      </Route>

      {/* 3. RUTA COMODÍN PARA ERRORES 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;