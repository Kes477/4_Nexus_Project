import { useEffect, useState, useRef } from "react";

import {
    changePassword,
    getPerfil,
    getMisPermisos,
    loginUser,
    logout,
    registerUser,
    updatePerfil,
} from "../api/authService";

import { AuthContext } from "./authContext";

export function AuthProvider({ children }) {

    const [usuario, setUsuario] = useState(null);
    const versionSesion = useRef(0);

    async function cargarIdentidad(datos) {
        const acceso = await getMisPermisos();

        if (acceso.is_active !== true) {
            throw new Error(
                "No se puede iniciar sesi\u00f3n. Contacta al administrador."
            );
        }

        if (acceso.id !== datos.id) {
            throw new Error("Identidad de usuario incompatible.");
        }

        return {
            ...datos,
            roles: acceso.roles.map(item => item.nombre),
            permisos_efectivos: acceso.permisos_efectivos,
            is_active: acceso.is_active,
            estado_cuenta: acceso.estado_cuenta,
            is_superuser: acceso.is_superuser
        };
    }
    const [cargando, setCargando] = useState(
        () => Boolean(localStorage.getItem("access_token"))
    );

    // Recuperar la sesión existente.
    useEffect(() => {

        if (!localStorage.getItem("access_token")) {
            return;
        }

        const version = ++versionSesion.current;

        getPerfil()
            .then(datos => {
                if (version !== versionSesion.current) {
                    return null;
                }
                return cargarIdentidad(datos);
            })
            .then(datos => {
                if (datos && version === versionSesion.current) {
                    setUsuario(datos);
                }
            })
            .catch(() => {
                if (version === versionSesion.current) {
                    logout();
                    setUsuario(null);
                }
            })
            .finally(() => {
                if (version === versionSesion.current) {
                    setCargando(false);
                }
            });

        return () => {
            versionSesion.current++;
        };

    }, []);


    // Iniciar sesión.
    async function iniciarSesion(email, password) {

        const version = ++versionSesion.current;

        logout();
        setUsuario(null);
        setCargando(true);

        try {
            const datos = await loginUser(email, password);
            const identidad = await cargarIdentidad(datos);

            if (version !== versionSesion.current) {
                throw new Error("Sesion reemplazada.");
            }

            setUsuario(identidad);
            return identidad;
        } catch (error) {
            if (version === versionSesion.current) {
                logout();
                setUsuario(null);
            }
            throw error;
        } finally {
            if (version === versionSesion.current) {
                setCargando(false);
            }
        }
    }


    // Registrar un nuevo cliente.
    async function registrarse(datosRegistro) {

        const datos = await registerUser(datosRegistro);
        setUsuario(datos);

        return datos;
    }


    // Editar los datos del perfil y actualizar el contexto.
    async function actualizarPerfil(cambios) {

        const datos = await updatePerfil(cambios);
        setUsuario(datos);

        return datos;
    }


    // Cambiar la contraseña pidiendo la actual.
    function cambiarPassword(actual, nueva) {
        return changePassword(actual, nueva);
    }


    // Cerrar sesión.
    function cerrarSesion() {
        versionSesion.current++;
        logout();
        setUsuario(null);
        setCargando(false);
    }


    // Obtener el rol proporcionado por el backend.
    const rol = usuario?.rol ?? null;

    const roles = Array.isArray(usuario?.roles)
        ? usuario.roles
        : [];

    const permisos = Array.isArray(
        usuario?.permisos_efectivos
    )
        ? usuario.permisos_efectivos
        : [];

    const cuentaActiva = Boolean(
        usuario && usuario.is_active === true
    );

    function tieneRol(nombreRol) {

        return cuentaActiva
            && roles.includes(nombreRol);
    }

    function tienePermiso(codigoPermiso) {

        return cuentaActiva
            && permisos.includes(codigoPermiso);
    }

    function tieneAlgunPermiso(codigos = []) {

        return Array.isArray(codigos)
            && codigos.some(tienePermiso);
    }

    function tieneTodosLosPermisos(codigos = []) {

        return Array.isArray(codigos)
            && codigos.length > 0
            && codigos.every(tienePermiso);
    }

    async function actualizarPermisos() {

        if (!usuario) {
            return null;
        }

        const usuarioId = usuario.id;

        try {

            const datos = await getMisPermisos();

            if (datos.id !== usuarioId) {
                throw new Error(
                    "Identidad de usuario incompatible."
                );
            }

            setUsuario(actual => {

                if (!actual || actual.id !== usuarioId) {
                    return actual;
                }

                return {
                    ...actual,
                    roles: datos.roles.map(
                        item => item.nombre
                    ),
                    permisos_efectivos:
                        datos.permisos_efectivos,
                    is_active: datos.is_active,
                    estado_cuenta: datos.estado_cuenta,
                    is_superuser: datos.is_superuser,
                };
            });

            return datos;

        } catch (error) {

            setUsuario(actual => {

                if (!actual || actual.id !== usuarioId) {
                    return actual;
                }

                return {
                    ...actual,
                    roles: [],
                    permisos_efectivos: [],
                };
            });

            throw error;
        }
    }




    return (

        <AuthContext.Provider
            value={{
                usuario,
                rol,
                roles,
                permisos,
                tieneRol,
                tienePermiso,
                tieneAlgunPermiso,
                tieneTodosLosPermisos,
                actualizarPermisos,
                cargando,
                iniciarSesion,
                registrarse,
                actualizarPerfil,
                cambiarPassword,
                cerrarSesion,
            }}
        >
            {children}
        </AuthContext.Provider>

    );
}