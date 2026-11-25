import { useContext } from "react";
import { AuthContext } from "../context/authContext";

export function useSesion(){
    return useContext(AuthContext);
}
