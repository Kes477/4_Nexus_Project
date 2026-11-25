// Toma el primer mensaje de error que devuelve Django REST Framework
export function primerError(error) {
    const errores = error.response?.data;
    if (!errores) return 'No se pudo conectar con el servidor. Intenta de nuevo.';
    const primerCampo = Object.keys(errores)[0];
    return [].concat(errores[primerCampo])[0];
}