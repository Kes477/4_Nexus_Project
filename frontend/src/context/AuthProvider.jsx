import { useEffect, useState } from "react";

import {
    changePassword,
    getPerfil,
    loginUser,
    logout,
    registerUser,
    updatePerfil,
} from "../api/authService";

import { AuthContext } from "./authContext";

export function AuthProvider({ children }) {

    const [usuario, setUsuario] = useState(null);
    const [cargando, setCargando] = useState(
        () => Boolean(localStorage.getItem("access_token"))
    );

    // Recuperar la sesión existente.
    useEffect(() => {

        if (!localStorage.getItem("access_token")) {
            return;
        }

        getPerfil()
            .then((datos) => setUsuario(datos))
            .catch(() => logout())
            .finally(() => setCargando(false));

    }, []);


    // Iniciar sesión.
    async function iniciarSesion(email, password) {

        const datos = await loginUser(email, password);
        setUsuario(datos);

        return datos;
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
        logout();
        setUsuario(null);
    }


    // Obtener el rol proporcionado por el backend.
    const rol = usuario?.rol ?? null;


    return (

        <AuthContext.Provider
            value={{
                usuario,
                rol,
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