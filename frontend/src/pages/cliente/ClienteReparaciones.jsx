import { useCallback, useEffect, useState } from 'react';

import {
    Wrench,
    RefreshCw,
    Eye,
    Search
} from 'lucide-react';

import {
    obtenerOrdenes,
    obtenerOrdenPorId
} from '../../api/reparacionesService';

import DetalleReparacion, {
    formatearFecha,
    nombreEquipo
} from './DetalleReparacion';

// ======================================================
// CONFIGURACIÓN
// ======================================================

const ESTADOS_CERRADOS = [
    'ENTREGADA',
    'CANCELADA'
];

const ESTADOS = {
    RECIBIDA: 'Recibida',
    EN_DIAGNOSTICO: 'En diagnóstico',
    EN_REPARACION: 'En reparación',
    FINALIZADA: 'Finalizada',
    ENTREGADA: 'Entregada',
    CANCELADA: 'Cancelada'
};

const COLORES = {
    RECIBIDA: '#38bdf8',
    EN_DIAGNOSTICO: '#a78bfa',
    EN_REPARACION: '#f59e0b',
    FINALIZADA: '#10b981',
    ENTREGADA: '#00c9a7',
    CANCELADA: '#ef4444'
};

// ======================================================
// ESTILOS
// ======================================================

const estiloBoton = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    background: '#00c9a7',
    color: '#ffffff',
    fontWeight: 600,
    cursor: 'pointer'
};

const estiloCampo = {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid var(--light-gray)',
    background: 'var(--white)',
    color: 'var(--color-dark)'
};

const estiloCelda = {
    padding: '14px',
    textAlign: 'left',
    borderBottom: '1px solid var(--light-gray)'
};

// ======================================================
// COMPONENTE PRINCIPAL
// ======================================================

export default function ClienteReparaciones({
    historial = false
}) {

    const [ordenes, setOrdenes] = useState([]);
    const [detalle, setDetalle] = useState(null);

    const [cargando, setCargando] = useState(true);
    const [cargandoDetalle, setCargandoDetalle] = useState(false);

    const [error, setError] = useState('');
    const [errorDetalle, setErrorDetalle] = useState('');

    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('TODOS');

    // ==================================================
    // CONSULTAR REPARACIONES
    // ==================================================

    const cargarOrdenes = useCallback(async () => {

        setCargando(true);
        setError('');
        setErrorDetalle('');
        setDetalle(null);

        try {
            const respuesta = await obtenerOrdenes();

            const lista = Array.isArray(respuesta)
                ? respuesta
                : respuesta?.results;

            if (!Array.isArray(lista)) {
                throw new Error('Respuesta de API inválida.');
            }

            setOrdenes(lista);

        } catch (err) {

            setOrdenes([]);

            setError(
                err.response?.data?.detail
                || 'No se pudieron consultar las reparaciones.'
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

    const consultarDetalle = async (id) => {

        if (cargandoDetalle || cargando) return;

        setCargandoDetalle(true);
        setErrorDetalle('');
        setDetalle(null);

        try {
            const respuesta = await obtenerOrdenPorId(id);

            setDetalle(respuesta);

            setOrdenes(anterior =>
                anterior.map(orden =>
                    orden.id === respuesta.id
                        ? respuesta
                        : orden
                )
            );

        } catch (err) {

            setErrorDetalle(
                err.response?.data?.detail
                || 'No se pudo consultar el detalle.'
            );

        } finally {
            setCargandoDetalle(false);
        }
    };

    // ==================================================
    // SEPARAR ÓRDENES ACTIVAS E HISTÓRICAS
    // ==================================================

    const ordenesPorTipo = ordenes.filter(orden => {

        const cerrada = ESTADOS_CERRADOS.includes(
            orden.estado
        );

        return historial ? cerrada : !cerrada;
    });

    // ==================================================
    // BÚSQUEDA Y FILTRADO
    // ==================================================

    const textoBusqueda = busqueda.trim().toLowerCase();

    const ordenesFiltradas = ordenesPorTipo
        .filter(orden => {

            const coincideEstado =
                filtroEstado === 'TODOS'
                || orden.estado === filtroEstado;

            const contenido = [
                orden.id,
                nombreEquipo(orden),
                orden.equipo_detalle?.numero_serie,
                orden.tecnico_nombre,
                orden.descripcion_problema
            ]
                .filter(valor => valor != null)
                .join(' ')
                .toLowerCase();

            return coincideEstado
                && contenido.includes(textoBusqueda);
        })
        .sort((a, b) => {

            const fechaA = historial
                ? a.fecha_cierre || a.fecha_recepcion
                : a.fecha_recepcion;

            const fechaB = historial
                ? b.fecha_cierre || b.fecha_recepcion
                : b.fecha_recepcion;

            return new Date(fechaB) - new Date(fechaA);
        });

    const estadosDisponibles = Object.entries(ESTADOS)
        .filter(([codigo]) =>
            historial
                ? ESTADOS_CERRADOS.includes(codigo)
                : !ESTADOS_CERRADOS.includes(codigo)
        );

    // ==================================================
    // INTERFAZ
    // ==================================================

    return (
        <main
            style={{
                padding: '32px',
                width: '100%',
                maxWidth: '1200px',
                margin: '0 auto',
                boxSizing: 'border-box',
                flex: 1
            }}
        >
            <header
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px',
                    marginBottom: '24px'
                }}
            >
                <div>
                    <h1>
                        {historial
                            ? 'Historial de reparaciones'
                            : 'Mis reparaciones'}
                    </h1>

                    <p>
                        {historial
                            ? 'Consulta tus reparaciones anteriores.'
                            : 'Consulta el progreso de tus reparaciones.'}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={cargarOrdenes}
                    disabled={cargando || cargandoDetalle}
                    style={estiloBoton}
                >
                    <RefreshCw size={18} />

                    {cargando
                        ? 'Actualizando...'
                        : 'Actualizar'}
                </button>
            </header>

            {/* INDICADOR */}

            <section
                style={{
                    padding: '20px',
                    border: '1px solid var(--light-gray)',
                    borderRadius: '12px',
                    background: 'var(--white)',
                    marginBottom: '24px'
                }}
            >
                <Wrench size={24} color="#00c9a7" />

                <h2>{ordenesPorTipo.length}</h2>

                <p>
                    {historial
                        ? 'Reparaciones cerradas'
                        : 'Reparaciones activas'}
                </p>
            </section>

            {/* BÚSQUEDA Y FILTROS */}

            <section
                style={{
                    display: 'flex',
                    gap: '12px',
                    flexWrap: 'wrap',
                    marginBottom: '24px'
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flex: 1
                    }}
                >
                    <Search size={20} />

                    <input
                        type="search"
                        aria-label="Buscar reparaciones"
                        placeholder="Buscar orden, equipo o técnico..."
                        value={busqueda}
                        onChange={evento =>
                            setBusqueda(evento.target.value)
                        }
                        style={{
                            ...estiloCampo,
                            flex: 1,
                            minWidth: 0
                        }}
                    />
                </div>

                <select
                    aria-label="Filtrar por estado"
                    value={filtroEstado}
                    onChange={evento =>
                        setFiltroEstado(evento.target.value)
                    }
                    style={estiloCampo}
                >
                    <option value="TODOS">
                        Todos los estados
                    </option>

                    {estadosDisponibles.map(([codigo, nombre]) => (
                        <option key={codigo} value={codigo}>
                            {nombre}
                        </option>
                    ))}
                </select>
            </section>

            {/* ESTADOS DE CONSULTA */}

            {cargando && (
                <p role="status">Cargando reparaciones...</p>
            )}

            {error && (
                <p role="alert" style={{ color: '#ef4444' }}>
                    {error}
                </p>
            )}

            {!cargando && !error
                && ordenesFiltradas.length === 0 && (

                <section
                    style={{
                        padding: '40px',
                        textAlign: 'center',
                        border: '1px solid var(--light-gray)',
                        borderRadius: '12px'
                    }}
                >
                    <h2>No hay reparaciones para mostrar</h2>

                    <p>
                        {ordenesPorTipo.length > 0
                            ? 'No hay resultados para los filtros seleccionados.'
                            : historial
                                ? 'Todavía no tienes reparaciones cerradas.'
                                : 'Actualmente no tienes reparaciones activas.'}
                    </p>
                </section>
            )}

            {/* TABLA DE REPARACIONES */}

            {!cargando && !error
                && ordenesFiltradas.length > 0 && (

                <section style={{ overflowX: 'auto' }}>

                    <table
                        style={{
                            width: '100%',
                            borderCollapse: 'collapse'
                        }}
                    >
                        <thead>
                            <tr>
                                <th style={estiloCelda}>Orden</th>
                                <th style={estiloCelda}>Equipo</th>
                                <th style={estiloCelda}>Técnico</th>
                                <th style={estiloCelda}>Estado</th>
                                <th style={estiloCelda}>Recepción</th>

                                {historial && (
                                    <th style={estiloCelda}>
                                        Cierre
                                    </th>
                                )}

                                <th style={estiloCelda}>Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            {ordenesFiltradas.map(orden => (

                                <tr key={orden.id}>

                                    <td style={estiloCelda}>
                                        #{orden.id}
                                    </td>

                                    <td style={estiloCelda}>
                                        {nombreEquipo(orden)}
                                    </td>

                                    <td style={estiloCelda}>
                                        {orden.tecnico_nombre
                                            || 'Sin asignar'}
                                    </td>

                                    <td style={estiloCelda}>
                                        <span
                                            style={{
                                                color:
                                                    COLORES[orden.estado]
                                                    || 'inherit',
                                                fontWeight: 600
                                            }}
                                        >
                                            {orden.estado_nombre
                                                || ESTADOS[orden.estado]
                                                || orden.estado}
                                        </span>
                                    </td>

                                    <td style={estiloCelda}>
                                        {formatearFecha(
                                            orden.fecha_recepcion
                                        )}
                                    </td>

                                    {historial && (
                                        <td style={estiloCelda}>
                                            {formatearFecha(
                                                orden.fecha_cierre
                                            )}
                                        </td>
                                    )}

                                    <td style={estiloCelda}>
                                        <button
                                            type="button"
                                            disabled={cargandoDetalle}
                                            onClick={() =>
                                                consultarDetalle(orden.id)
                                            }
                                            style={estiloBoton}
                                        >
                                            <Eye size={16} />
                                            Ver detalle
                                        </button>
                                    </td>

                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}

            {/* DETALLE */}

            {cargandoDetalle && (
                <p role="status">Cargando detalle...</p>
            )}

            {errorDetalle && (
                <p role="alert" style={{ color: '#ef4444' }}>
                    {errorDetalle}
                </p>
            )}

            {detalle && (
                <DetalleReparacion
                    orden={detalle}
                    onCerrar={() => setDetalle(null)}
                />
            )}

        </main>
    );
}