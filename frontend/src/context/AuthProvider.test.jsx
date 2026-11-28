
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { useContext, useEffect } from "react";
import { AuthProvider } from "./AuthProvider";
import { AuthContext } from "./authContext";
import { getPerfil, getMisPermisos, loginUser, logout, registerUser, updatePerfil } from "../api/authService";

// Simular las funciones de la API
vi.mock("../api/authService", () => ({
  getPerfil: vi.fn(),
  getMisPermisos: vi.fn(),
  loginUser: vi.fn(),
  logout: vi.fn(),
  registerUser: vi.fn(),
  updatePerfil: vi.fn(),
  changePassword: vi.fn(),
}));

// Componente auxiliar para consultar el contexto
let contextoActual;

function ConsumidorPrueba() {
  const contexto = useContext(AuthContext);

  useEffect(()=>{
    contextoActual = contexto;
  });

  return (
    <div>
      <span data-testid="usuario">
        {contexto.usuario?.email ?? "Sin usuario"}
      </span>
      <span data-testid="rol">
        {contexto.rol ?? "Sin rol"}
      </span>
      <span data-testid="cargando">
        {String(contexto.cargando)}
      </span>
    </div>
  );
}

function renderizar(){
  render(
    <AuthProvider>
      <ConsumidorPrueba/>
    </AuthProvider>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    getMisPermisos.mockImplementation(async () => {
      const llamadasLogin = loginUser.mock.results;
      const llamadasPerfil = getPerfil.mock.results;

      const resultado =
        llamadasLogin[llamadasLogin.length - 1] ??
        llamadasPerfil[llamadasPerfil.length - 1];

      if (!resultado) {
        throw new Error("No existe identidad simulada");
      }

      const usuario = await resultado.value;

      const equivalencias = {
        cliente: "Cliente",
        admin: "Administrador",
        piloto: "Piloto",
        tecnico: "Tecnico",
        vendedor: "Vendedor"
      };

      return {
        id: usuario.id,
        is_active: true,
        estado_cuenta: "A",
        is_superuser: usuario.is_superuser === true,
        roles: [{
          id: 1,
          nombre: equivalencias[usuario.rol]
        }],
        permisos_efectivos: []
      };
    });
    localStorage.clear();
    contextoActual = null;
  });

  it("1. Inicializa sin usuario cuando no existe token", () => {
    renderizar();

    expect(screen.getByTestId("usuario")).toHaveTextContent("Sin usuario");
    expect(screen.getByTestId("rol")).toHaveTextContent("Sin rol");
    expect(screen.getByTestId("cargando")).toHaveTextContent("false");
    expect(getPerfil).not.toHaveBeenCalled();
  });

  it("2. Recupera el perfil cuando existe un token", async () => {
    localStorage.setItem("access_token", "token-simulado");

    getPerfil.mockResolvedValue({
      id: 1, email: "cliente@test.com",
      is_staff: false,
      rol: 'cliente',
    });

    renderizar();

    expect(screen.getByTestId("cargando")).toHaveTextContent("true");

    await waitFor(() => {
      expect(screen.getByTestId("usuario")).toHaveTextContent("cliente@test.com");
    });

    expect(screen.getByTestId("rol")).toHaveTextContent("cliente");
    expect(screen.getByTestId("cargando")).toHaveTextContent("false");
    expect(getPerfil).toHaveBeenCalledOnce();
  });

  it("3. Inicia sesión correctamente", async () => {
    const usuario = {
      id: 1, email: "cliente@test.com",
      is_staff: false,
      rol:'cliente',
    };

    loginUser.mockResolvedValue(usuario);

    renderizar();

    let resultado;

    await act(async () => {
      resultado = await contextoActual.iniciarSesion(
        "cliente@test.com",
        "password123"
      );
    });

    expect(loginUser).toHaveBeenCalledWith(
      "cliente@test.com",
      "password123"
    );

    expect(resultado).toEqual({
      ...usuario,
      roles: ["Cliente"],
      permisos_efectivos: [],
      is_active: true,
      estado_cuenta: "A",
      is_superuser: false
    });

    expect(getMisPermisos).toHaveBeenCalledOnce();
    expect(contextoActual.tieneRol("Cliente")).toBe(true);
    expect(contextoActual.tieneRol("Administrador")).toBe(false);
    expect(screen.getByTestId("usuario")).toHaveTextContent("cliente@test.com");
    expect(screen.getByTestId("rol")).toHaveTextContent("cliente");
  });

  it("4. Reconoce el rol administrador devuelto por el backend", async () => {
    loginUser.mockResolvedValue({
      id: 2, email: "admin@test.com",
      is_staff: true,
      rol:'admin',
    });

    renderizar();

    await act(async () => {
      await contextoActual.iniciarSesion("admin@test.com", "password123");
    });

    expect(screen.getByTestId("rol")).toHaveTextContent("admin");
  });

  it("5. Cierra sesión y elimina el usuario del contexto", async () => {
    loginUser.mockResolvedValue({
      id: 1, email: "cliente@test.com",
      is_staff: false,
      rol:'cliente',
    });

    renderizar();

    await act(async () => {
      await contextoActual.iniciarSesion("cliente@test.com", "password123");
    });

    act(() => {
      contextoActual.cerrarSesion();
    });

    expect(logout).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("usuario")).toHaveTextContent("Sin usuario");
    expect(screen.getByTestId("rol")).toHaveTextContent("Sin rol");
  });

  it("6. Ejecuta logout cuando falla la recuperación del perfil", async () => {
    localStorage.setItem("access_token", "token-invalido");

    getPerfil.mockRejectedValue(new Error("Token inválido"));

    renderizar();

    await waitFor(() => {
      expect(logout).toHaveBeenCalledOnce();
      expect(screen.getByTestId("cargando")).toHaveTextContent("false");
    });

    expect(screen.getByTestId("usuario")).toHaveTextContent("Sin usuario");
  });

  it("7 un piloto recibe un rol desde el backend", async () => {
    loginUser.mockResolvedValue({
      id: 3, email: "piloto@test.com",
      is_staff: false,
      rol:'piloto',
    });

    renderizar();

    await act(async() => {
      await contextoActual.iniciarSesion('piloto@test.com','password123');
    });

    expect(screen.getByTestId('rol')).toHaveTextContent('piloto');
  });

  it("8 Registrarse deja la sesion iniciada como cliente", async () =>{
    const datos = {email:'nuevo@test.com',password:'Drones-2026!'}
    registerUser.mockResolvedValue({email:'nuevo@test.com', rol:'cliente'});

    renderizar();

    await act(async () => {
      await contextoActual.registrarse(datos);
    });
    expect(registerUser).toHaveBeenCalledWith(datos);
    expect(screen.getByTestId('usuario')).toHaveTextContent('nuevo@test.com');
    expect(screen.getByTestId('rol')).toHaveTextContent('cliente');
  });

  it("9. Actualizar el perfil cambia el usuario del contexto", async () => {
    loginUser.mockResolvedValue({ id: 1, email: "cliente@test.com", rol: "cliente", first_name: "Ana" });
    updatePerfil.mockResolvedValue({ id: 1, email: "cliente@test.com", rol: "cliente", first_name: "Andrea" });

    renderizar();

    await act(async () => {
      await contextoActual.iniciarSesion("cliente@test.com", "password123");
    });
    await act(async () => {
      await contextoActual.actualizarPerfil({ first_name: "Andrea" });
    });

    expect(updatePerfil).toHaveBeenCalledWith({ first_name: "Andrea" });
    expect(contextoActual.usuario.first_name).toBe("Andrea");
  });

  it("10. Reconoce multiples roles y permisos", async () => {
    loginUser.mockResolvedValue({
      id: 10,
      email: "empleado@test.com",
      rol: "tecnico"
    });

    getMisPermisos.mockResolvedValue({
      id: 10,
      is_active: true,
      estado_cuenta: "A",
      is_superuser: false,
      roles: [
        { id: 1, nombre: "Tecnico" },
        { id: 2, nombre: "Piloto" }
      ],
      permisos_efectivos: [
        "reparaciones.view_ordenservicio"
      ]
    });

    renderizar();

    await act(async () => {
      await contextoActual.iniciarSesion(
        "empleado@test.com", "password123"
      );
    });

    expect(contextoActual.tieneRol("Tecnico")).toBe(true);
    expect(contextoActual.tieneRol("Piloto")).toBe(true);
    expect(contextoActual.tieneRol("Administrador")).toBe(false);

    expect(contextoActual.tienePermiso(
      "reparaciones.view_ordenservicio"
    )).toBe(true);

    expect(contextoActual.tienePermiso(
      "reparaciones.change_ordenservicio"
    )).toBe(false);
  });

  it("11. Rechaza una identidad incompatible", async () => {
    loginUser.mockResolvedValue({
      id: 10,
      email: "empleado@test.com"
    });

    getMisPermisos.mockResolvedValue({
      id: 99,
      is_active: true,
      roles: [],
      permisos_efectivos: []
    });

    renderizar();

    await act(async () => {
      await expect(
        contextoActual.iniciarSesion(
          "empleado@test.com", "password123"
        )
      ).rejects.toThrow("Identidad de usuario incompatible");
    });

    expect(contextoActual.usuario).toBeNull();
    expect(contextoActual.cargando).toBe(false);
  });

  it("12. Rechaza una cuenta inactiva", async () => {
    loginUser.mockResolvedValue({
      id: 10,
      email: "empleado@test.com"
    });

    getMisPermisos.mockResolvedValue({
      id: 10,
      is_active: false,
      roles: [],
      permisos_efectivos: []
    });

    renderizar();

    await act(async () => {
      await expect(
        contextoActual.iniciarSesion(
          "empleado@test.com", "password123"
        )
      ).rejects.toThrow();
    });

    expect(contextoActual.usuario).toBeNull();
    expect(contextoActual.cargando).toBe(false);
  });

});
