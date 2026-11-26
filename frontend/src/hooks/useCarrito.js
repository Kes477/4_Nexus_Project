import { useContext } from "react";
import { CarritoContext } from "../context/carritoContext";

export function useCarrito (){
    return useContext(CarritoContext);
}