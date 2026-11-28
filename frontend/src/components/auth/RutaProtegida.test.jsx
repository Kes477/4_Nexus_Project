import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
  Loader: ({ text }) => <div>{text}</div>,
  Button: ({ children, onClick }) => (
    <button onClick={onClick}>{children}</button>
  )
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

function renderRutaProtegida(rolRequerido = 'admin', opciones = {}) {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/login" element={<PaginaActual />} />
        <Route path="/cliente" element={<PaginaActual />} />
        <Route path="/admin" element={
          <RutaProtegida rol={rolRequerido} {...opciones} />
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

  function simularSesion(usuario, rol) {
    const roles = usuario.roles ?? [];
    const permisos = usuario.permisos_efectivos ?? [];

    const tieneRol = nombre =>
      usuario.is_active === true && roles.includes(nombre);

    const tienePermiso = codigo =>
      usuario.is_active === true && permisos.includes(codigo);

    const sesion = {
      usuario,
      rol,
      cargando: false,
      tieneRol,
      tienePermiso,
      tieneAlgunPermiso: codigos => codigos.some(tienePermiso),
      tieneTodosLosPermisos: codigos => codigos.every(tienePermiso),
      cerrarSesion: vi.fn()
    };

    useSesion.mockReturnValue(sesion);
    return sesion;
  }

  test('Restringe el acceso de un cliente a administracion', () => {
    simularSesion({
      id: 1,
      is_active: true,
      roles: ['Cliente'],
      permisos_efectivos: []
    }, 'cliente');

    renderRutaProtegida();

    expect(screen.getByText('Acceso restringido')).toBeTruthy();
    expect(screen.queryByText('Panel autorizado')).toBeNull();

    fireEvent.click(
      screen.getByRole('button', { name: 'Volver a mis paneles' })
    );

    expect(screen.getByText('Ruta: /cliente')).toBeTruthy();
  });

  test('Permite acceder al administrador autorizado', () => {
    simularSesion({
      id: 2,
      is_active: true,
      roles: ['Administrador'],
      permisos_efectivos: []
    }, 'admin');

    renderRutaProtegida();

    expect(screen.getByText('Panel autorizado')).toBeTruthy();
  });

  test('Permite acceso mediante permiso delegado', () => {
    simularSesion({
      id: 3,
      is_active: true,
      roles: ['Tecnico'],
      permisos_efectivos: [
        'reparaciones.view_ordenservicio'
      ]
    }, 'tecnico');

    renderRutaProtegida('admin', {
      permiso: 'reparaciones.view_ordenservicio',
      rolOPermisos: true
    });

    expect(screen.getByText('Panel autorizado')).toBeTruthy();
  });

  test('Rechaza acceso cuando falta el permiso requerido', () => {
    simularSesion({
      id: 3,
      is_active: true,
      roles: ['Tecnico'],
      permisos_efectivos: [
        'reparaciones.view_ordenservicio'
      ]
    }, 'tecnico');

    renderRutaProtegida('admin', {
      permiso: 'reparaciones.change_ordenservicio',
      rolOPermisos: true
    });

    expect(screen.getByText('Acceso restringido')).toBeTruthy();
    expect(screen.queryByText('Panel autorizado')).toBeNull();
  });

  test('Una cuenta inactiva no puede acceder aunque tenga rol admin', () => {
    const sesion = simularSesion({
      id: 4,
      is_active: false,
      roles: ['Administrador'],
      permisos_efectivos: []
    }, 'admin');

    renderRutaProtegida();

    expect(screen.getByText('Acceso restringido')).toBeTruthy();
    expect(screen.queryByText('Panel autorizado')).toBeNull();

    fireEvent.click(screen.getByRole('button'));

    expect(sesion.cerrarSesion).toHaveBeenCalledOnce();
    expect(screen.getByText('Ruta: /login')).toBeTruthy();
  });
});
