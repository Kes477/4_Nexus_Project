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

    useEffect(() => {

        if (!localStorage.getItem("access_token")) {
            return;
        }

        getPerfil()
            .then((datos) => setUsuario(datos))
            .catch(() => logout())
            .finally(() => setCargando(false));

    }, []);


    async function iniciarSesion(email, password) {

        const datos = await loginUser(email, password);
        setUsuario(datos);

        return datos;
    }


    async function registrarse(datosRegistro) {

        const datos = await registerUser(datosRegistro);
        setUsuario(datos);

        return datos;
    }


    async function actualizarPerfil(cambios) {

        const datos = await updatePerfil(cambios);
        setUsuario(datos);

        return datos;
    }


    function actualizarUsuario(cambios) {

        setUsuario((prev) => {

            if (!prev) return prev;

            const actualizado = { ...prev, ...cambios };

            try {
                localStorage.setItem("usuario", JSON.stringify(actualizado));
            } catch (error) {
                console.error(error);
            }

            return actualizado;
        });
    }


    function cambiarPassword(actual, nueva) {
        return changePassword(actual, nueva);
    }


    function cerrarSesion() {
        logout();
        setUsuario(null);
    }


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
                actualizarUsuario,
                cambiarPassword,
                cerrarSesion,
            }}
        >
            {children}
        </AuthContext.Provider>

    );
}