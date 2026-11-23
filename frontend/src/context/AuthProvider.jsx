import { useEffect, useState } from "react";

import {
    getPerfil,
    loginUser,
    logout,
    registerUser
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
                cerrarSesion
            }}
        >
            {children}
        </AuthContext.Provider>

    );
}