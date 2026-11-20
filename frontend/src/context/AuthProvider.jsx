import { useEffect, useState } from "react";
import { getPerfil, loginUser, logout, registerUser } from '../api/authService'; 
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

    async function registrarse(datosRegistro){
        const datos = await registerUser(datosRegistro);
        setUsuario(datos);
        return datos;

    }

    function cerrarSesion(){
        logout();
        setUsuario(null);
    }

    const rol = usuario?.rol ?? null;
    return(
        <AuthContext.Provider value={{usuario, rol, cargando, iniciarSesion, registrarse, cerrarSesion}}>
            {children}
        </AuthContext.Provider>

    )
}