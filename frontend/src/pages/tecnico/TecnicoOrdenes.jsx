import { useCallback, useEffect, useState } from 'react';

import {
    ClipboardList,
    Search,
    RefreshCw,
    Eye,
    X,
    Wrench,
    CheckCircle,
    Clock
} from 'lucide-react';

import {
    obtenerOrdenes,
    obtenerOrdenPorId
} from '../../api/reparacionesService';

import ActualizarEstadoOrden from './ActualizarEstadoOrden';
import CotizacionReparacion from '../../components/cliente/CotizacionReparacion';


// ======================================================
// ESTADOS
// ======================================================

const estados = {

    RECIBIDA: {
        nombre: 'Recibida',
        color: '#38bdf8'
    },

    EN_DIAGNOSTICO: {
        nombre: 'En diagnóstico',
        color: '#a78bfa'
    },

    EN_REPARACION: {
        nombre: 'En reparación',
        color: '#f59e0b'
    },

    FINALIZADA: {
        nombre: 'Finalizada',
        color: '#10b981'
    },

    ENTREGADA: {
        nombre: 'Entregada',
        color: '#059669'
    },

    CANCELADA: {
        nombre: 'Cancelada',
        color: '#ef4444'
    }

};


// ======================================================
// ESTILOS
// ======================================================

const estilos = {

    pagina: {
        padding: '32px',
        width: '100%',
        maxWidth: '1300px',
        margin: '0 auto',
        boxSizing: 'border-box',
        flex: 1
    },

    encabezado: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap',
        marginBottom: '28px'
    },

    tarjetas: {
        display: 'grid',
        gridTemplateColumns:
            'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
    },

    tarjeta: {
        background: 'var(--white)',
        border: '1px solid var(--light-gray, #ddd)',
        borderRadius: '12px',
        padding: '22px'
    },

    boton: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '11px 18px',
        background: '#00c9a7',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 600
    },

    seccion: {
        background: 'var(--white)',
        border: '1px solid var(--light-gray, #ddd)',
        borderRadius: '12px',
        padding: '24px'
    },

    campo: {
        padding: '12px',
        border: '1px solid var(--light-gray, #ddd)',
        borderRadius: '8px',
        background: 'var(--bg-color)',
        color: 'var(--color-dark)',
        boxSizing: 'border-box'
    },

    celda: {
        padding: '14px 12px',
        borderBottom: '1px solid var(--light-gray, #ddd)',
        verticalAlign: 'top'
    },

    grillaDetalle: {
        display: 'grid',
        gridTemplateColumns:
            'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginTop: '24px',
        marginBottom: '24px'
    }

};


// ======================================================
// FUNCIONES AUXILIARES
// ======================================================

function nombreEquipo(orden) {

    const equipo = orden.equipo_detalle;

    if (!equipo) {
        return `Equipo #${orden.equipo}`;
    }

    return `${equipo.marca || ''} ${equipo.modelo || ''}`
        .trim() || `Equipo #${orden.equipo}`;

}


function formatearFecha(fecha) {

    if (!fecha) {
        return 'Sin registrar';
    }

    const valor = new Date(fecha);

    if (Number.isNaN(valor.getTime())) {
        return 'Fecha no disponible';
    }

    return valor.toLocaleString(
        'es-HN',
        {
            timeZone: 'America/Tegucigalpa',
            dateStyle: 'short',
            timeStyle: 'short'
        }
    );

}


function obtenerError(error, mensaje) {

    const detalle = error.response?.data?.detail;

    if (typeof detalle === 'string') {
        return detalle;
    }

    if (Array.isArray(detalle)) {
        return detalle.join(' ');
    }

    if (detalle && typeof detalle === 'object') {

        return Object.values(detalle)
            .flat()
            .join(' ');

    }

    return mensaje;
}


// ======================================================
// COMPONENTE DE ESTADO
// ======================================================

function EstadoOrden({ estado }) {

    const informacion = estados[estado] || {
        nombre: estado,
        color: '#64748b'
    };

    return (

        <span
            style={{
                display: 'inline-block',
                padding: '6px 12px',
                borderRadius: '20px',
                color: informacion.color,
                background: `${informacion.color}18`,
                fontWeight: 600,
                fontSize: '13px',
                whiteSpace: 'nowrap'
            }}
        >

            {informacion.nombre}

        </span>

    );

}


// ======================================================
// COMPONENTE DE INDICADORES
// ======================================================

function Indicador({
    titulo,
    valor,
    icono: Icono,
    color
}) {

    return (

        <div style={estilos.tarjeta}>

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px'
                }}
            >

                <span style={{ opacity: 0.75 }}>

                    {titulo}

                </span>

                <Icono
                    size={24}
                    color={color}
                />

            </div>


            <h2
                style={{
                    fontSize: '32px',
                    marginBottom: 0
                }}
            >

                {valor}

            </h2>

        </div>

    );

}


// ======================================================
// COMPONENTE PRINCIPAL
// ======================================================

export default function TecnicoOrdenes() {

    const [ordenes, setOrdenes] = useState([]);

    const [detalle, setDetalle] = useState(null);

    const [cargando, setCargando] = useState(true);

    const [cargandoDetalle, setCargandoDetalle] =
        useState(false);

    const [guardando, setGuardando] = useState(false);

    const [error, setError] = useState('');

    const [mensaje, setMensaje] = useState('');

    const [busqueda, setBusqueda] = useState('');

    const [filtroEstado, setFiltroEstado] = useState('');

    const ocupado =
        cargando || cargandoDetalle || guardando;


    // ==================================================
    // CONSULTAR ORDENES
    // ==================================================

    const cargarOrdenes = useCallback(async () => {

        setCargando(true);
        setError('');
        setMensaje('');
        setDetalle(null);

        try {

            const respuesta = await obtenerOrdenes();

            const lista = Array.isArray(respuesta)

                ? respuesta

                : Array.isArray(respuesta?.results)

                    ? respuesta.results

                    : [];

            setOrdenes(lista);

        } catch (err) {

            setError(
                obtenerError(
                    err,
                    'No fue posible consultar las órdenes.'
                )
            );

        } finally {

            setCargando(false);

        }

    }, []);


    useEffect(() => {

        cargarOrdenes();

    }, [cargarOrdenes]);


    // ==================================================
    // CONSULTAR DETALLE
    // ==================================================

    const verDetalle = async (id) => {

        if (ocupado) {
            return;
        }

        setCargandoDetalle(true);
        setDetalle(null);
        setError('');
        setMensaje('');

        try {

            const respuesta =
                await obtenerOrdenPorId(id);

            setDetalle(respuesta);

        } catch (err) {

            setError(
                obtenerError(
                    err,
                    'No fue posible consultar la orden.'
                )
            );

        } finally {

            setCargandoDetalle(false);

        }

    };


    // ==================================================
    // ACTUALIZAR INTERFAZ
    // ==================================================

    const actualizarOrden = (ordenActualizada) => {

        setDetalle(ordenActualizada);

        setOrdenes(ordenesActuales =>

            ordenesActuales.map(orden =>

                orden.id === ordenActualizada.id

                    ? ordenActualizada

                    : orden

            )

        );

        setMensaje(
            `Orden #${ordenActualizada.id} actualizada correctamente.`
        );

    };


    // ==================================================
    // FILTRADO DE ORDENES
    // ==================================================

    const ordenesFiltradas = ordenes.filter(orden => {

        const texto = [

            orden.id,

            `#${orden.id}`,

            nombreEquipo(orden),

            orden.cliente_nombre,

            orden.equipo_detalle?.numero_serie,

            orden.descripcion_problema

        ].join(' ').toLowerCase();


        const coincideBusqueda = texto.includes(
            busqueda.trim().toLowerCase()
        );


        const coincideEstado =
            !filtroEstado ||
            orden.estado === filtroEstado;


        return coincideBusqueda && coincideEstado;

    });


    // ==================================================
    // INDICADORES
    // ==================================================

    const contarEstado = estado =>

        ordenes.filter(
            orden => orden.estado === estado
        ).length;


    const indicadores = [

        {
            titulo: 'Órdenes asignadas',
            valor: ordenes.length,
            icono: ClipboardList,
            color: '#38bdf8'
        },

        {
            titulo: 'En diagnóstico',
            valor: contarEstado('EN_DIAGNOSTICO'),
            icono: Clock,
            color: '#a78bfa'
        },

        {
            titulo: 'En reparación',
            valor: contarEstado('EN_REPARACION'),
            icono: Wrench,
            color: '#f59e0b'
        },

        {
            titulo: 'Finalizadas',
            valor: contarEstado('FINALIZADA'),
            icono: CheckCircle,
            color: '#10b981'
        }

    ];


    // ==================================================
    // INTERFAZ
    // ==================================================

    return (

        <div style={estilos.pagina}>

            <header style={estilos.encabezado}>

                <div>

                    <h1 style={{ marginBottom: '8px' }}>

                        Panel de reparaciones

                    </h1>

                    <p style={{ opacity: 0.75 }}>

                        Gestiona las órdenes de servicio
                        técnico asignadas.

                    </p>

                </div>


                <button
                    type="button"
                    style={estilos.boton}
                    onClick={cargarOrdenes}
                    disabled={ocupado}
                >

                    <RefreshCw size={18} />

                    {cargando
                        ? 'Actualizando...'
                        : 'Actualizar órdenes'}

                </button>

            </header>


            {/* INDICADORES */}

            <div style={estilos.tarjetas}>

                {indicadores.map(indicador => (

                    <Indicador
                        key={indicador.titulo}
                        {...indicador}
                    />

                ))}

            </div>


            {/* MENSAJES */}

            {error && (

                <p
                    role="alert"
                    style={{
                        padding: '14px',
                        color: '#ef4444',
                        background: '#ef444418',
                        borderRadius: '8px'
                    }}
                >

                    {error}

                </p>

            )}


            {mensaje && (

                <p
                    role="status"
                    style={{
                        padding: '14px',
                        color: '#10b981',
                        background: '#10b98118',
                        borderRadius: '8px'
                    }}
                >

                    {mensaje}

                </p>

            )}


            {/* LISTADO DE ORDENES */}

            <section style={estilos.seccion}>

                <h2 style={{ marginTop: 0 }}>

                    Mis órdenes de servicio

                </h2>


                {/* BUSQUEDA Y FILTROS */}

                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '16px',
                        marginBottom: '24px'
                    }}
                >

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            flex: '1 1 260px'
                        }}
                    >

                        <Search size={20} />

                        <input
                            type="search"
                            aria-label="Buscar órdenes"
                            placeholder="Buscar orden, cliente o equipo..."
                            value={busqueda}
                            onChange={evento =>
                                setBusqueda(
                                    evento.target.value
                                )
                            }
                            style={{
                                ...estilos.campo,
                                width: '100%'
                            }}
                        />

                    </div>


                    <select
                        aria-label="Filtrar por estado"
                        value={filtroEstado}
                        onChange={evento =>
                            setFiltroEstado(
                                evento.target.value
                            )
                        }
                        style={estilos.campo}
                    >

                        <option value="">

                            Todos los estados

                        </option>


                        {Object.entries(estados).map(
                            ([valor, informacion]) => (

                                <option
                                    key={valor}
                                    value={valor}
                                >

                                    {informacion.nombre}

                                </option>

                            )
                        )}

                    </select>

                </div>


                {cargando && (

                    <p>Cargando órdenes...</p>

                )}


                {!cargando &&
                    !error &&
                    ordenes.length === 0 && (

                    <div
                        style={{
                            textAlign: 'center',
                            padding: '48px 16px'
                        }}
                    >

                        <ClipboardList size={42} />

                        <h3>

                            No tienes órdenes asignadas

                        </h3>

                        <p style={{ opacity: 0.75 }}>

                            Las reparaciones asignadas
                            aparecerán aquí.

                        </p>

                    </div>

                )}


                {!cargando &&
                    ordenes.length > 0 &&
                    ordenesFiltradas.length === 0 && (

                    <p>

                        No se encontraron órdenes
                        con los filtros seleccionados.

                    </p>

                )}


                {!cargando &&
                    ordenesFiltradas.length > 0 && (

                    <div style={{ overflowX: 'auto' }}>

                        <table
                            style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                textAlign: 'left'
                            }}
                        >

                            <thead>

                                <tr>

                                    {[
                                        'Orden',
                                        'Cliente',
                                        'Equipo',
                                        'Recepción',
                                        'Estado',
                                        'Acción'
                                    ].map(titulo => (

                                        <th
                                            key={titulo}
                                            style={estilos.celda}
                                        >

                                            {titulo}

                                        </th>

                                    ))}

                                </tr>

                            </thead>


                            <tbody>

                                {ordenesFiltradas.map(orden => (

                                    <tr key={orden.id}>

                                        <td style={estilos.celda}>

                                            #{orden.id}

                                        </td>


                                        <td style={estilos.celda}>

                                            {orden.cliente_nombre ||
                                                'Sin nombre'}

                                        </td>


                                        <td style={estilos.celda}>

                                            <strong>

                                                {nombreEquipo(orden)}

                                            </strong>

                                            <p
                                                style={{
                                                    fontSize: '13px',
                                                    opacity: 0.7
                                                }}
                                            >

                                                {orden.equipo_detalle
                                                    ?.numero_serie ||
                                                    'Sin número de serie'}

                                            </p>

                                        </td>


                                        <td style={estilos.celda}>

                                            {formatearFecha(
                                                orden.fecha_recepcion
                                            )}

                                        </td>


                                        <td style={estilos.celda}>

                                            <EstadoOrden
                                                estado={orden.estado}
                                            />

                                        </td>


                                        <td style={estilos.celda}>

                                            <button
                                                type="button"
                                                style={estilos.boton}
                                                disabled={ocupado}
                                                onClick={() =>
                                                    verDetalle(orden.id)
                                                }
                                            >

                                                <Eye size={17} />

                                                Ver detalle

                                            </button>

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                )}

            </section>


            {/* CARGA DEL DETALLE */}

            {cargandoDetalle && (

                <p style={{ marginTop: '24px' }}>

                    Consultando detalle de la orden...

                </p>

            )}


            {/* DETALLE DE LA ORDEN */}

            {detalle && (

                <section
                    style={{
                        ...estilos.seccion,
                        marginTop: '24px'
                    }}
                >

                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '14px'
                        }}
                    >

                        <h2>

                            Detalle de la orden #{detalle.id}

                        </h2>


                        <button
                            type="button"
                            disabled={guardando}
                            style={{
                                ...estilos.boton,
                                background: '#64748b'
                            }}
                            onClick={() => {

                                setDetalle(null);

                                setMensaje('');

                            }}
                        >

                            <X size={18} />

                            Cerrar detalle

                        </button>

                    </div>


                    <div style={estilos.grillaDetalle}>

                        <div>

                            <p style={{ opacity: 0.7 }}>

                                Cliente

                            </p>

                            <strong>

                                {detalle.cliente_nombre ||
                                    'Sin nombre'}

                            </strong>

                        </div>


                        <div>

                            <p style={{ opacity: 0.7 }}>

                                Equipo

                            </p>

                            <strong>

                                {nombreEquipo(detalle)}

                            </strong>

                        </div>


                        <div>

                            <p style={{ opacity: 0.7 }}>

                                Número de serie

                            </p>

                            <strong>

                                {detalle.equipo_detalle
                                    ?.numero_serie ||
                                    'Sin registrar'}

                            </strong>

                        </div>


                        <div>

                            <p style={{ opacity: 0.7 }}>

                                Fecha de recepción

                            </p>

                            <strong>

                                {formatearFecha(
                                    detalle.fecha_recepcion
                                )}

                            </strong>

                        </div>


                        <div>

                            <p style={{ opacity: 0.7 }}>

                                Técnico asignado

                            </p>

                            <strong>

                                {detalle.tecnico_nombre ||
                                    'Sin asignar'}

                            </strong>

                        </div>


                        <div>

                            <p style={{ opacity: 0.7 }}>

                                Estado actual

                            </p>

                            <EstadoOrden
                                estado={detalle.estado}
                            />

                        </div>

                    </div>


                    {/* PROBLEMA REPORTADO */}

                    <h3>

                        Descripción del problema

                    </h3>


                    <div
                        style={{
                            padding: '18px',
                            background: 'var(--bg-color)',
                            borderRadius: '8px',
                            whiteSpace: 'pre-wrap'
                        }}
                    >

                        {detalle.descripcion_problema}

                    </div>


                    {/* OBSERVACIONES ACUMULADAS */}

                    <h3 style={{ marginTop: '24px' }}>

                        Observaciones técnicas

                    </h3>


                    <div
                        style={{
                            padding: '18px',
                            background: 'var(--bg-color)',
                            borderRadius: '8px',
                            whiteSpace: 'pre-wrap',
                            overflowWrap: 'anywhere'
                        }}
                    >

                        {detalle.observaciones ||
                            'No hay observaciones registradas.'}

                    </div>

                    {/* COTIZACIÓN: genera el pedido que paga el cliente */}

                    <CotizacionReparacion
                        orden={detalle}
                        modo="tecnico"
                        onActualizada={actualizarOrden}
                    />

                    {/* HU-015: ACTUALIZAR ESTADO */}

                    <ActualizarEstadoOrden
                        key={`${detalle.id}-${detalle.estado}`}
                        orden={detalle}
                        onActualizada={actualizarOrden}
                        onOcupado={setGuardando}
                    />

                </section>

            )}

        </div>

    );

}