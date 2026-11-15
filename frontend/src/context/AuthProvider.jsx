import { useEffect, useState } from "react";
import { getPerfil, loginUser, logout } from "../api/authService";
import { AuthContext} from "./authContext";


export function AuthProvider({children}){
    const [usuario, setUsuario] = useState(null);
    const [cargando, setCargando] =  useState(()=> Boolean(localStorage.getItem('access_token')));

    useEffect(()=> {
        if (!localStorage.getItem('access_token')) return;

        getPerfil()
            .then((datos)=> setUsuario(datos))
            .catch(()=>logout())
            .finally(()=>setCargando(false));
    }, []);

    async function iniciarSesion(email, password) {
        const datos = await loginUser(email, password);
        setUsuario(datos);
        return datos;        
    }

    function cerrarSesion(){
        logout();
        setUsuario(null);
    }

    const rol = usuario ? (usuario.is_staff ? 'admin':'cliente'): null;

    return(
        <AuthContext.Provider value={{usuario, rol, cargando, iniciarSesion, cerrarSesion}}>
            {children}
        </AuthContext.Provider>

    )
}
