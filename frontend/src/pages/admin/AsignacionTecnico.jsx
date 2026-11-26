import { useCallback, useEffect, useState } from 'react';

import {
    UserPlus,
    RefreshCw
} from 'lucide-react';

import {
    obtenerTecnicosDisponibles,
    asignarTecnico
} from '../../api/reparacionesService';


// ======================================================
// ESTILOS
// ======================================================

const estilos = {

    contenedor: {
        marginTop: '24px',
        padding: '20px',
        border: '1px solid var(--light-gray)',
        borderRadius: '12px',
        background: 'var(--bg-color)'
    },

    selector: {
        width: '100%',
        padding: '12px',
        marginTop: '10px',
        borderRadius: '8px',
        border: '1px solid var(--light-gray)',
        background: 'var(--white)',
        color: 'var(--color-dark)',
        boxSizing: 'border-box'
    },

    acciones: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        marginTop: '16px'
    },

    boton: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '12px 18px',
        border: 'none',
        borderRadius: '8px',
        background: '#00c9a7',
        color: '#fff',
        fontWeight: 600,
        cursor: 'pointer'
    }

};


// ======================================================
// FUNCION AUXILIAR PARA ERRORES
// ======================================================

function obtenerMensajeError(error) {

    const datos = error.response?.data;

    if (typeof datos?.detail === 'string') {
        return datos.detail;
    }

    if (Array.isArray(datos?.tecnico)) {
        return datos.tecnico.join(' ');
    }

    if (datos?.detail && typeof datos.detail === 'object') {
        return Object.values(datos.detail).flat().join(' ');
    }

    return 'No fue posible completar la operación.';
}


// ======================================================
// COMPONENTE PRINCIPAL
// ======================================================

export default function AsignacionTecnico({
    orden,
    onAsignado,
    onOcupado
}) {

    const [tecnicos, setTecnicos] = useState([]);

    const [tecnicoSeleccionado, setTecnicoSeleccionado] =
        useState(
            orden.tecnico ? String(orden.tecnico) : ''
        );

    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);

    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');


    const ordenCerrada = [
        'ENTREGADA',
        'CANCELADA'
    ].includes(orden.estado);


    // ==================================================
    // CONSULTAR TECNICOS
    // ==================================================

    const cargarTecnicos = useCallback(async () => {

        setCargando(true);
        setError('');

        try {

            const respuesta =
                await obtenerTecnicosDisponibles();

            const lista = Array.isArray(respuesta)
                ? respuesta
                : respuesta?.results || [];

            setTecnicos(lista);

        } catch (err) {

            setError(obtenerMensajeError(err));

        } finally {

            setCargando(false);

        }

    }, []);


    useEffect(() => {

        if (!ordenCerrada) {
            cargarTecnicos();
        }

    }, [cargarTecnicos, ordenCerrada]);


    // ==================================================
    // ASIGNAR TECNICO
    // ==================================================

    const guardarAsignacion = async (evento) => {

        evento.preventDefault();

        if (
            !tecnicoSeleccionado ||
            guardando ||
            ordenCerrada
        ) {
            return;
        }

        setGuardando(true);
        onOcupado?.(true);

        setError('');
        setMensaje('');

        try {

            const ordenActualizada = await asignarTecnico(
                orden.id,
                tecnicoSeleccionado
            );

            onAsignado?.(ordenActualizada);

            setMensaje(
                'Técnico asignado correctamente.'
            );

        } catch (err) {

            setError(obtenerMensajeError(err));

        } finally {

            setGuardando(false);
            onOcupado?.(false);

        }

    };


    // ==================================================
    // ORDEN CERRADA
    // ==================================================

    if (ordenCerrada) {

        return (

            <section style={estilos.contenedor}>

                <h3>Asignación de técnico</h3>

                <p style={{ color: 'var(--text-light)' }}>
                    No se puede modificar el técnico
                    de una orden cerrada.
                </p>

            </section>

        );

    }


    const tecnicoDisponible = tecnicos.some(
        tecnico =>
            String(tecnico.id) === tecnicoSeleccionado
    );


    const tecnicoActualEnLista = tecnicos.some(
        tecnico =>
            String(tecnico.id) === String(orden.tecnico)
    );


    const mismoTecnico =
        String(orden.tecnico || '') === tecnicoSeleccionado;


    const botonDeshabilitado =
        cargando ||
        guardando ||
        !tecnicoSeleccionado ||
        !tecnicoDisponible ||
        mismoTecnico;


    // ==================================================
    // INTERFAZ
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

                <UserPlus size={22} />

                Asignación de técnico

            </h3>


            <p style={{ color: 'var(--text-light)' }}>

                Selecciona un técnico disponible para
                atender esta orden de servicio.

            </p>


            {error && (

                <p
                    role="alert"
                    style={{ color: '#ef4444' }}
                >
                    {error}
                </p>

            )}


            {mensaje && (

                <p
                    role="status"
                    style={{ color: '#10b981' }}
                >
                    {mensaje}
                </p>

            )}


            {cargando && (
                <p>Consultando técnicos disponibles...</p>
            )}


            {!cargando && tecnicos.length === 0 && (

                <p style={{ color: '#f59e0b' }}>
                    No hay técnicos disponibles.
                </p>

            )}


            <form onSubmit={guardarAsignacion}>

                <label
                    htmlFor="tecnico-asignado"
                    style={{ fontWeight: 600 }}
                >
                    Técnico disponible
                </label>


                <select
                    id="tecnico-asignado"
                    value={tecnicoSeleccionado}
                    onChange={evento => {
                        setTecnicoSeleccionado(
                            evento.target.value
                        );
                        setMensaje('');
                    }}
                    disabled={cargando || guardando}
                    style={estilos.selector}
                >

                    <option value="">
                        Seleccionar técnico
                    </option>


                    {orden.tecnico && !tecnicoActualEnLista && (

                        <option
                            value={String(orden.tecnico)}
                            disabled
                        >
                            {orden.tecnico_nombre ||
                                'Técnico actual'}
                            {' — No disponible'}
                        </option>

                    )}


                    {tecnicos.map(tecnico => (

                        <option
                            key={tecnico.id}
                            value={String(tecnico.id)}
                        >

                            {tecnico.nombre}

                            {' — '}

                            {tecnico.especialidad_tecnica}

                        </option>

                    ))}

                </select>


                <div style={estilos.acciones}>

                    <button
                        type="submit"
                        disabled={botonDeshabilitado}
                        style={{
                            ...estilos.boton,
                            opacity: botonDeshabilitado
                                ? 0.5
                                : 1
                        }}
                    >

                        <UserPlus size={18} />

                        {guardando
                            ? 'Guardando...'
                            : orden.tecnico
                                ? 'Reasignar técnico'
                                : 'Asignar técnico'
                        }

                    </button>


                    <button
                        type="button"
                        onClick={cargarTecnicos}
                        disabled={cargando || guardando}
                        style={{
                            ...estilos.boton,
                            background: '#64748b',
                            opacity: cargando || guardando
                                ? 0.5
                                : 1
                        }}
                    >

                        <RefreshCw size={18} />

                        Actualizar técnicos

                    </button>

                </div>

            </form>

        </section>

    );

}