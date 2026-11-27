/*
 * Simula lo que hace el SDK de una pasarela de pago real (Stripe, BAC, PayPal...):
 * recibe el número en el navegador y devuelve un token. El número completo y el CVV
 * NUNCA se envían a nuestro backend.
 */

// Algoritmo de Luhn: detecta números de tarjeta mal escritos
export function pasaLuhn(numero) {
    let suma = 0;
    let duplicar = false;
    for (let i = numero.length - 1; i >= 0; i--) {
        let digito = Number(numero[i]);
        if (duplicar) {
            digito *= 2;
            if (digito > 9) digito -= 9;
        }
        suma += digito;
        duplicar = !duplicar;
    }
    return suma % 10 === 0;
}

export function detectarMarca(numero) {
    if (/^4/.test(numero)) return 'Visa';
    if (/^5[1-5]/.test(numero)) return 'Mastercard';
    if (/^3[47]/.test(numero)) return 'American Express';
    return 'Tarjeta';
}

export function tokenizarTarjetaSimulada({ numero, mes, anio, cvv }) {
    const limpio = numero.replace(/\s+/g, '');

    if (!/^\d{13,19}$/.test(limpio) || !pasaLuhn(limpio)) {
        throw new Error('El número de tarjeta no es válido.');
    }
    if (!/^\d{3,4}$/.test(cvv)) {
        throw new Error('El código de seguridad no es válido.');
    }

    const mesTexto = String(mes).padStart(2, '0');

    return {
        tipo_tarjeta: detectarMarca(limpio),
        ultimos_cuatro: limpio.slice(-4),
        fecha_expiracion: `${mesTexto}/${anio}`,
        token_pasarela: `tok_sim_${crypto.randomUUID()}`,
    };
}