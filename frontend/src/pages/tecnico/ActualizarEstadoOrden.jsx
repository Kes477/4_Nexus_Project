import { useState } from 'react';

import {
    Save,
    Wrench,
    CheckCircle
} from 'lucide-react';

import {
    cambiarEstadoOrden
} from '../../api/reparacionesService';


// ======================================================
// TRANSICIONES TECNICAS
// ======================================================

const transiciones = {

    RECIBIDA: [
        {
            valor: 'EN_DIAGNOSTICO',
            nombre: 'En diagnóstico'
        }
    ],

    EN_DIAGNOSTICO: [
        {
            valor: 'EN_REPARACION',
            nombre: 'En reparación'
        }
    ],

    EN_REPARACION: [
        {
            valor: 'FINALIZADA',
            nombre: 'Finalizada'
        }
    ]

};


// ======================================================
// ESTILOS
// ======================================================

const estilos = {

    contenedor: {
        marginTop: '24px',
        padding: '24px',
        border: '1px solid var(--light-gray, #ddd)',
        borderRadius: '12px'
    },

    campo: {
        width: '100%',
        padding: '12px',
        marginTop: '8px',
        marginBottom: '18px',
        borderRadius: '8px',
        border: '1px solid var(--light-gray, #ddd)',
        background: 'var(--white)',
        color: 'var(--color-dark)',
        boxSizing: 'border-box'
    },

    boton: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 20px',
        border: 'none',
        borderRadius: '8px',
        background: '#00c9a7',
        color: '#fff',
        cursor: 'pointer',
        fontWeight: 600
    }

};


// ======================================================
// MANEJO DE ERRORES
// ======================================================

function obtenerError(error) {

    const datos = error.response?.data;

    if (typeof datos?.detail === 'string') {
        return datos.detail;
    }

    if (Array.isArray(datos?.detail)) {
        return datos.detail.join(' ');
    }

    if (datos?.detail && typeof datos.detail === 'object') {

        return Object.values(
            datos.detail
        ).flat().join(' ');

    }

    if (Array.isArray(datos?.estado)) {
        return datos.estado.join(' ');
    }

    if (Array.isArray(datos?.observaciones)) {
        return datos.observaciones.join(' ');
    }

    return 'No fue posible actualizar la reparación.';
}


// ======================================================
// COMPONENTE PRINCIPAL
// ======================================================

export default function ActualizarEstadoOrden({
    orden,
    onActualizada,
    onOcupado
}) {

    const [nuevoEstado, setNuevoEstado] = useState('');

    const [observaciones, setObservaciones] = useState('');

    const [guardando, setGuardando] = useState(false);

    const [error, setError] = useState('');


    const opciones = transiciones[orden.estado] || [];


    // ==================================================
    // GUARDAR ACTUALIZACION
    // ==================================================

    const guardar = async (evento) => {

        evento.preventDefault();

        if (guardando) {
            return;
        }

        const estadoValido = opciones.some(
            opcion => opcion.valor === nuevoEstado
        );

        if (!estadoValido) {

            setError(
                'Selecciona un estado permitido.'
            );

            return;
        }

        setGuardando(true);

        onOcupado?.(true);

        setError('');

        try {

            const ordenActualizada =
                await cambiarEstadoOrden(
                    orden.id,
                    nuevoEstado,
                    observaciones
                );

            setNuevoEstado('');
            setObservaciones('');

            onActualizada?.(ordenActualizada);

        } catch (err) {

            setError(obtenerError(err));

        } finally {

            setGuardando(false);

            onOcupado?.(false);

        }

    };


    // ==================================================
    // SIN TRANSICIONES TECNICAS DISPONIBLES
    // ==================================================

    if (opciones.length === 0) {

        return (

            <section style={estilos.contenedor}>

                <h3
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}
                >

                    <CheckCircle size={22} />

                    Estado de la reparación

                </h3>

                <p>

                    {orden.estado === 'FINALIZADA'
                        ? 'La reparación ha finalizado y está pendiente de gestión administrativa.'
                        : 'Esta orden no admite más actualizaciones técnicas.'}

                </p>

            </section>

        );

    }


    // ==================================================
    // FORMULARIO
    // ==================================================

    return (

        <section style={estilos.contenedor}>

            <h3
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginTop: 0
                }}
            >

                <Wrench size={22} />

                Actualizar estado de reparación

            </h3>


            <p>

                Estado actual:{' '}

                <strong>
                    {orden.estado_nombre || orden.estado}
                </strong>

            </p>


            {error && (

                <p
                    role="alert"
                    style={{ color: '#ef4444' }}
                >

                    {error}

                </p>

            )}


            <form onSubmit={guardar}>

                <label htmlFor="nuevo-estado">

                    <strong>
                        Nuevo estado
                    </strong>

                </label>


                <select
                    id="nuevo-estado"
                    value={nuevoEstado}
                    onChange={evento => {

                        setNuevoEstado(
                            evento.target.value
                        );

                        setError('');

                    }}
                    style={estilos.campo}
                    disabled={guardando}
                    required
                >

                    <option value="">
                        Seleccionar nuevo estado
                    </option>

                    {opciones.map(opcion => (

                        <option
                            key={opcion.valor}
                            value={opcion.valor}
                        >

                            {opcion.nombre}

                        </option>

                    ))}

                </select>


                <label htmlFor="observaciones-tecnicas">

                    <strong>
                        Observaciones técnicas
                    </strong>

                </label>


                <textarea
                    id="observaciones-tecnicas"
                    value={observaciones}
                    onChange={evento =>

                        setObservaciones(
                            evento.target.value
                        )

                    }
                    rows={5}
                    maxLength={5000}
                    placeholder="Describe el diagnóstico, trabajo realizado o resultado de la reparación."
                    disabled={guardando}
                    style={{
                        ...estilos.campo,
                        resize: 'vertical'
                    }}
                />


                <p
                    style={{
                        fontSize: '13px',
                        opacity: 0.7,
                        marginTop: '-12px'
                    }}
                >

                    {observaciones.length}/5000 caracteres

                </p>


                <button
                    type="submit"
                    disabled={guardando || !nuevoEstado}
                    style={{
                        ...estilos.boton,
                        opacity:
                            guardando || !nuevoEstado
                                ? 0.5
                                : 1
                    }}
                >

                    <Save size={18} />

                    {guardando
                        ? 'Guardando...'
                        : 'Guardar actualización'}

                </button>

            </form>

        </section>

    );

}