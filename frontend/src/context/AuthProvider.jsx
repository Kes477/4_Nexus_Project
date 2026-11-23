import { useEffect, useState } from "react";
import { getPerfil, loginUser, logout } from "../api/authService";
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

    // Cerrar sesión.
    function cerrarSesion() {

        logout();

        setUsuario(null);
    }

    // Determinar el rol del usuario autenticado.
    let rol = null;

    if (usuario) {

        if (usuario.is_staff) {

            rol = "admin";

        } else {

            const rolUsuario = usuario.role || usuario.rol;

            if (
                typeof rolUsuario === "string" &&
                rolUsuario.trim() !== ""
            ) {

                rol = rolUsuario.trim().toLowerCase();

            } else {

                rol = "cliente";

            }
        }
    }

    return (

        <AuthContext.Provider
            value={{
                usuario,
                rol,
                cargando,
                iniciarSesion,
                cerrarSesion
            }}
        >
            {children}
        </AuthContext.Provider>

    );
}