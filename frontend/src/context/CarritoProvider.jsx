import { useEffect, useState } from "react";

import { agregarAlCarrito, cambiarCantidad, obtenerCarrito, quitarDelCarrito, vaciarCarrito,} from "../api/carritoService";
import { useSesion } from "../hooks/useSesion";
import { CarritoContext } from "./carritoContext";

export function CarritoProvider({ children }) {

    const { usuario, rol } = useSesion();
    const esCliente = rol === "cliente";
    const usuarioId = usuario?.id ?? null;

    // Se guarda de quién es el carrito, para no mostrar el de otra sesión
    const [estado, setEstado] = useState({ usuarioId: null, carrito: null });

    // Cargar el carrito cuando inicia sesión un cliente
    useEffect(() => {

        if (!esCliente) return;

        let activo = true;

        obtenerCarrito()
            .then((carrito) => activo && setEstado({ usuarioId, carrito }))
            .catch(() => {
                // Si falla, el contador simplemente queda en 0
            });

        return () => { activo = false; };

    }, [esCliente, usuarioId]);

    // Solo se muestra si es del usuario que tiene la sesión ahora
    const carrito = esCliente && estado.usuarioId === usuarioId ? estado.carrito : null;

    // Todas las operaciones devuelven el carrito actualizado
    async function guardar(peticion) {
        const actualizado = await peticion;
        setEstado({ usuarioId, carrito: actualizado });
        return actualizado;
    }

    const value = {
        carrito,
        cantidadArticulos: carrito?.cantidad_articulos ?? 0,
        agregar: (varianteId, cantidad = 1) => guardar(agregarAlCarrito(varianteId, cantidad)),
        cambiarCantidad: (detalleId, cantidad) => guardar(cambiarCantidad(detalleId, cantidad)),
        quitar: (detalleId) => guardar(quitarDelCarrito(detalleId)),
        vaciar: () => guardar(vaciarCarrito()),
        recargar: () => guardar(obtenerCarrito()),
    };

    return (
        <CarritoContext.Provider value={value}>
            {children}
        </CarritoContext.Provider>
    );
}