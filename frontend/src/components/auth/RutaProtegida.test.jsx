
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  MemoryRouter,
  Routes,
  Route,
  useLocation
} from 'react-router-dom';
import RutaProtegida from './RutaProtegida';
import { useSesion } from '../../hooks/useSesion';

// Simulación del hook de sesión
vi.mock('../../hooks/useSesion', () => ({
  useSesion: vi.fn()
}));

// Simulación del Loader
vi.mock('../ui', () => ({
  Loader: ({ text }) => <div>{text}</div>
}));

function PaginaActual() {
  const location = useLocation();

  return (
    <div>
      <span>Ruta: {location.pathname}</span>
      <span>Origen: {location.state?.from ?? 'ninguno'}</span>
    </div>
  );
}

function renderRutaProtegida(rolRequerido = 'admin') {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/login" element={<PaginaActual />} />
        <Route path="/cliente" element={<PaginaActual />} />
        <Route path="/admin" element={
          <RutaProtegida rol={rolRequerido} />
        }>
          <Route index element={<div>Panel autorizado</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('RutaProtegida', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('Muestra Loader mientras carga la sesión', () => {
    useSesion.mockReturnValue({
      usuario: null,
      rol: null,
      cargando: true
    });

    renderRutaProtegida();

    expect(
      screen.getByText('Verificando sesión...')
    ).toBeTruthy();
  });

  test('Redirige a login si no hay usuario', () => {
    useSesion.mockReturnValue({
      usuario: null,
      rol: null,
      cargando: false
    });

    renderRutaProtegida();

    expect(screen.getByText('Ruta: /login')).toBeTruthy();
    expect(screen.getByText('Origen: /admin')).toBeTruthy();
  });

  test('Redirige al cliente si intenta entrar a admin', () => {
    useSesion.mockReturnValue({
      usuario: { id: 1 },
      rol: 'cliente',
      cargando: false
    });

    renderRutaProtegida();

    expect(screen.getByText('Ruta: /cliente')).toBeTruthy();
  });

  test('Permite acceder al administrador autorizado', () => {
    useSesion.mockReturnValue({
      usuario: { id: 1 },
      rol: 'admin',
      cargando: false
    });

    renderRutaProtegida();

    expect(screen.getByText('Panel autorizado')).toBeTruthy();
  });
});
