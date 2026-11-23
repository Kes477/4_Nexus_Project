
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { useContext } from "react";
import { AuthProvider } from "./AuthProvider";
import { AuthContext } from "./authContext";
import { getPerfil, loginUser, logout } from "../api/authService";

// Simular las funciones de la API
vi.mock("../api/authService", () => ({
  getPerfil: vi.fn(),
  loginUser: vi.fn(),
  logout: vi.fn(),
}));

// Componente auxiliar para consultar el contexto
let contextoActual;

function ConsumidorPrueba() {
  contextoActual = useContext(AuthContext);

  return (
    <div>
      <span data-testid="usuario">
        {contextoActual.usuario?.email ?? "Sin usuario"}
      </span>
      <span data-testid="rol">
        {contextoActual.rol ?? "Sin rol"}
      </span>
      <span data-testid="cargando">
        {String(contextoActual.cargando)}
      </span>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    contextoActual = null;
  });

  it("1. Inicializa sin usuario cuando no existe token", () => {
    render(
      <AuthProvider>
        <ConsumidorPrueba />
      </AuthProvider>
    );

    expect(screen.getByTestId("usuario")).toHaveTextContent("Sin usuario");
    expect(screen.getByTestId("rol")).toHaveTextContent("Sin rol");
    expect(screen.getByTestId("cargando")).toHaveTextContent("false");
    expect(getPerfil).not.toHaveBeenCalled();
  });

  it("2. Recupera el perfil cuando existe un token", async () => {
    localStorage.setItem("access_token", "token-simulado");

    getPerfil.mockResolvedValue({
      email: "cliente@test.com",
      is_staff: false,
    });

    render(
      <AuthProvider>
        <ConsumidorPrueba />
      </AuthProvider>
    );

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
      email: "cliente@test.com",
      is_staff: false,
    };

    loginUser.mockResolvedValue(usuario);

    render(
      <AuthProvider>
        <ConsumidorPrueba />
      </AuthProvider>
    );

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
    expect(resultado).toEqual(usuario);
    expect(screen.getByTestId("usuario")).toHaveTextContent("cliente@test.com");
    expect(screen.getByTestId("rol")).toHaveTextContent("cliente");
  });

  it("4. Asigna el rol administrador a usuarios staff", async () => {
    loginUser.mockResolvedValue({
      email: "admin@test.com",
      is_staff: true,
    });

    render(
      <AuthProvider>
        <ConsumidorPrueba />
      </AuthProvider>
    );

    await act(async () => {
      await contextoActual.iniciarSesion("admin@test.com", "password123");
    });

    expect(screen.getByTestId("rol")).toHaveTextContent("admin");
  });

  it("5. Cierra sesión y elimina el usuario del contexto", async () => {
    loginUser.mockResolvedValue({
      email: "cliente@test.com",
      is_staff: false,
    });

    render(
      <AuthProvider>
        <ConsumidorPrueba />
      </AuthProvider>
    );

    await act(async () => {
      await contextoActual.iniciarSesion("cliente@test.com", "password123");
    });

    act(() => {
      contextoActual.cerrarSesion();
    });

    expect(logout).toHaveBeenCalledOnce();
    expect(screen.getByTestId("usuario")).toHaveTextContent("Sin usuario");
    expect(screen.getByTestId("rol")).toHaveTextContent("Sin rol");
  });

  it("6. Ejecuta logout cuando falla la recuperación del perfil", async () => {
    localStorage.setItem("access_token", "token-invalido");

    getPerfil.mockRejectedValue(new Error("Token inválido"));

    render(
      <AuthProvider>
        <ConsumidorPrueba />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(logout).toHaveBeenCalledOnce();
      expect(screen.getByTestId("cargando")).toHaveTextContent("false");
    });

    expect(screen.getByTestId("usuario")).toHaveTextContent("Sin usuario");
  });
});
