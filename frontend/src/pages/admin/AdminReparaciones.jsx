import { useCallback, useEffect, useState } from 'react';
import AsignacionTecnico from './AsignacionTecnico';
import { useSesion } from '../../hooks/useSesion';
import { PERMISOS } from '../../config/permisos';
import CerrarOrdenServicio from './CerrarOrdenServicio';

import {
  ClipboardList,
  Clock,
  Wrench,
  CheckCircle,
  Search,
  RefreshCw,
  Eye,
  X,
} from 'lucide-react';

import {
  obtenerOrdenes,
  obtenerOrdenPorId,
} from '../../api/reparacionesService';

// ======================================================
// CONFIGURACION DE ESTADOS
// ======================================================

const ESTADOS = {
  RECIBIDA: {
    nombre: 'Recibida',
    color: '#38bdf8',
  },
  EN_DIAGNOSTICO: {
    nombre: 'En diagnóstico',
    color: '#a78bfa',
  },
  EN_REPARACION: {
    nombre: 'En reparación',
    color: '#f59e0b',
  },
  FINALIZADA: {
    nombre: 'Finalizada',
    color: '#10b981',
  },
  ENTREGADA: {
    nombre: 'Entregada',
    color: '#00c9a7',
  },
  CANCELADA: {
    nombre: 'Cancelada',
    color: '#ef4444',
  },
};

// ======================================================
// ESTILOS COMPARTIDOS
// ======================================================

const estiloTarjeta = {
  background: 'var(--white)',
  border: '1px solid var(--light-gray)',
  borderRadius: '12px',
  padding: '20px',
};

const estiloBoton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '10px 16px',
  borderRadius: '8px',
  border: 'none',
  background: '#00c9a7',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
};

const estiloCampo = {
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid var(--light-gray)',
  background: 'var(--white)',
  color: 'var(--color-dark)',
};

const estiloCelda = {
  padding: '14px',
  textAlign: 'left',
  borderBottom: '1px solid var(--light-gray)',
};

// ======================================================
// FUNCIONES AUXILIARES
// ======================================================

function formatearFecha(fecha) {

  if (!fecha) return 'No registrada';

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return 'Fecha no disponible';
  }

  return valor.toLocaleString('es-HN', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Tegucigalpa',
  });
}

function nombreEquipo(orden) {

  const equipo = orden.equipo_detalle;

  if (!equipo) {
    return `Equipo #${orden.equipo}`;
  }

  return `${equipo.marca} ${equipo.modelo}`;
}

// ======================================================
// COMPONENTE DE ESTADO
// ======================================================

function EstadoOrden({ estado }) {

  const configuracion = ESTADOS[estado] || {
    nombre: estado,
    color: '#94a3b8',
  };

  return (
    <span
      style={{
        color: configuracion.color,
        background: `${configuracion.color}18`,
        borderRadius: '20px',
        padding: '6px 10px',
        fontSize: '12px',
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {configuracion.nombre}
    </span>
  );
}

// ======================================================
// COMPONENTE DE INDICADORES
// ======================================================

function Indicador({ titulo, cantidad, icono: Icono, color }) {

  return (
    <article style={estiloTarjeta}>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
        }}
      >

        <span style={{ color: 'var(--text-light)' }}>
          {titulo}
        </span>

        <Icono size={24} color={color} />

      </div>

      <h2
        style={{
          margin: '14px 0 0',
          fontSize: '32px',
          color,
        }}
      >
        {cantidad}
      </h2>

    </article>
  );
}

// ======================================================
// COMPONENTE PRINCIPAL
// HU-013: GESTION ADMINISTRATIVA DE ORDENES
// ======================================================

export default function AdminReparaciones() {

  const { tienePermiso } = useSesion();

  const puedeEditarOrden =
    tienePermiso(PERMISOS.EDITAR_REPARACIONES);

  const [ordenes, setOrdenes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');

  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState('');
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [ocupadoAsignacion, setAsignandoTecnico] = useState(false);
  const [cerrandoOrden, setCerrandoOrden] = useState(false);

  const asignandoTecnico =
    ocupadoAsignacion || cerrandoOrden;

  // ====================================================
  // CONSULTAR ORDENES
  // ====================================================

  const cargarOrdenes = useCallback(async () => {

    setCargando(true);
    setError('');

    try {

      const respuesta = await obtenerOrdenes();

      const lista = Array.isArray(respuesta)
        ? respuesta
        : respuesta?.results || [];

      setOrdenes(lista);

    } catch (err) {

      setError(
        err.response?.data?.detail ||
        'No se pudieron consultar las órdenes de servicio.'
      );

    } finally {

      setCargando(false);

    }

  }, []);

  useEffect(() => {

    cargarOrdenes();

  }, [cargarOrdenes]);

  // ====================================================
  // CONSULTAR DETALLE
  // ====================================================

  const consultarDetalle = async (id) => {

    setMostrarDetalle(true);
    setCargandoDetalle(true);
    setOrdenSeleccionada(null);
    setErrorDetalle('');

    try {

      const orden = await obtenerOrdenPorId(id);

      setOrdenSeleccionada(orden);

    } catch (err) {

      setErrorDetalle(
        err.response?.data?.detail ||
        'No se pudo consultar el detalle de la orden.'
      );

    } finally {

      setCargandoDetalle(false);

    }
  };

  const actualizarOrdenAsignada = (ordenActualizada) => {

    setOrdenSeleccionada(ordenActualizada);

    setOrdenes(ordenesActuales =>
      ordenesActuales.map(orden =>
        orden.id === ordenActualizada.id
          ? ordenActualizada
          : orden
      )
    );

  };

  const cerrarDetalle = () => {

    if (cargandoDetalle || asignandoTecnico) return;

    setMostrarDetalle(false);
    setOrdenSeleccionada(null);
    setErrorDetalle('');

  };

  // ====================================================
  // INDICADORES
  // ====================================================

  const totalOrdenes = ordenes.length;

  const recibidas = ordenes.filter(
    orden => orden.estado === 'RECIBIDA'
  ).length;

  const enProceso = ordenes.filter(
    orden => [
      'EN_DIAGNOSTICO',
      'EN_REPARACION',
    ].includes(orden.estado)
  ).length;

  const finalizadas = ordenes.filter(
    orden => [
      'FINALIZADA',
      'ENTREGADA',
    ].includes(orden.estado)
  ).length;

  // ====================================================
  // BUSQUEDA Y FILTROS
  // ====================================================

  const textoBusqueda = busqueda
    .trim()
    .toLowerCase();

  const ordenesFiltradas = ordenes.filter(orden => {

    const coincideEstado =
      filtroEstado === 'TODOS' ||
      orden.estado === filtroEstado;

    const textoOrden = [
      orden.id,
      `#${orden.id}`,
      orden.cliente_nombre,
      nombreEquipo(orden),
      orden.equipo_detalle?.numero_serie,
      orden.tecnico_nombre,
      orden.descripcion_problema,
    ].join(' ').toLowerCase();

    const coincideBusqueda =
      textoOrden.includes(textoBusqueda);

    return coincideEstado && coincideBusqueda;

  });

  // ====================================================
  // INTERFAZ
  // ====================================================

  return (

    <section
      style={{
        padding: '32px',
        width: '100%',
        maxWidth: '1400px',
        margin: '0 auto',
        boxSizing: 'border-box',
        color: 'var(--color-dark)',
      }}
    >

      {/* ENCABEZADO */}

      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
        }}
      >

        <div>

          <h1>Órdenes de servicio</h1>

          <p style={{ color: 'var(--text-light)' }}>
            Gestiona las solicitudes de reparación de los clientes.
          </p>

        </div>

        <button
          type="button"
          onClick={cargarOrdenes}
          disabled={cargando || cargandoDetalle || asignandoTecnico}
          style={{
            ...estiloBoton,
            opacity: cargando ? 0.5 : 1,
          }}
        >

          <RefreshCw size={16} />

          {cargando ? 'Actualizando...' : 'Actualizar órdenes'}

        </button>

      </header>

      {/* INDICADORES */}

      {!error && !cargando && (

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '16px',
            marginBottom: '28px',
          }}
        >

          <Indicador
            titulo="Total de órdenes"
            cantidad={totalOrdenes}
            icono={ClipboardList}
            color="#94a3b8"
          />

          <Indicador
            titulo="Recibidas"
            cantidad={recibidas}
            icono={Clock}
            color="#38bdf8"
          />

          <Indicador
            titulo="En proceso"
            cantidad={enProceso}
            icono={Wrench}
            color="#f59e0b"
          />

          <Indicador
            titulo="Finalizadas y entregadas"
            cantidad={finalizadas}
            icono={CheckCircle}
            color="#10b981"
          />

        </div>

      )}

      {/* DETALLE DE LA ORDEN */}

      {mostrarDetalle && (

        <article
          style={{
            ...estiloTarjeta,
            marginBottom: '24px',
          }}
        >

          <header
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >

            <h2>
              {ordenSeleccionada
                ? `Detalle de la orden #${ordenSeleccionada.id}`
                : 'Detalle de la orden'}
            </h2>

            <button
              type="button"
              onClick={cerrarDetalle}
              disabled={cargandoDetalle || asignandoTecnico}
              style={{
                ...estiloBoton,
                background: '#64748b',
              }}
            >
              <X size={16} />
              Cerrar
            </button>

          </header>

          {cargandoDetalle && (
            <p>Consultando detalle...</p>
          )}

          {errorDetalle && (
            <p role="alert" style={{ color: '#ef4444' }}>
              {errorDetalle}
            </p>
          )}

          {ordenSeleccionada && (

            <>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(230px, 1fr))',
                  gap: '24px',
                  marginTop: '24px',
                }}
              >

                <div>
                  <strong>Cliente</strong>
                  <p>
                    {ordenSeleccionada.cliente_nombre ||
                      'No disponible'}
                  </p>
                </div>

                <div>
                  <strong>Equipo</strong>
                  <p>{nombreEquipo(ordenSeleccionada)}</p>
                </div>

                <div>
                  <strong>Número de serie</strong>
                  <p>
                    {ordenSeleccionada.equipo_detalle?.numero_serie ||
                      'No registrado'}
                  </p>
                </div>

                <div>
                  <strong>Técnico asignado</strong>
                  <p>
                    {ordenSeleccionada.tecnico_nombre ||
                      'Sin asignar'}
                  </p>
                </div>

                <div>
                  <strong>Fecha de recepción</strong>
                  <p>
                    {formatearFecha(
                      ordenSeleccionada.fecha_recepcion
                    )}
                  </p>
                </div>

                <div>
                  <strong>Fecha de cierre</strong>
                  <p>
                    {ordenSeleccionada.fecha_cierre
                      ? formatearFecha(
                          ordenSeleccionada.fecha_cierre
                        )
                      : 'Orden abierta'}
                  </p>
                </div>

                <div>
                  <strong>Estado actual</strong>
                  <p>
                    <EstadoOrden
                      estado={ordenSeleccionada.estado}
                    />
                  </p>
                </div>

              </div>

              <div
                style={{
                  marginTop: '20px',
                  padding: '16px',
                  background: 'var(--bg-color)',
                  borderRadius: '8px',
                }}
              >

                <strong>Descripción del problema</strong>

                <p
                  style={{
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere',
                    marginTop: '10px',
                  }}
                >
                  {ordenSeleccionada.descripcion_problema}
                </p>

              </div>

              <div
                style={{
                  marginTop: '16px',
                  padding: '16px',
                  background: 'var(--bg-color)',
                  borderRadius: '8px',
                }}
              >

                <strong>Observaciones</strong>

                <p
                  style={{
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere',
                    marginTop: '10px',
                  }}
                >
                  {ordenSeleccionada.observaciones ||
                    'No hay observaciones registradas.'}
                </p>

              </div>

              {/* HU-014: ASIGNACION DE TECNICOS */}

              {puedeEditarOrden && (
<fieldset
                disabled={cerrandoOrden}
                style={{
                  border: 'none',
                  padding: 0,
                  margin: 0,
                  minWidth: 0,
                }}
              >
                <AsignacionTecnico
                  key={ordenSeleccionada.id}
                  orden={ordenSeleccionada}
                  onAsignado={actualizarOrdenAsignada}
                  onOcupado={setAsignandoTecnico}
                />
              </fieldset>
)}

              {/* CIERRE ADMINISTRATIVO */}

              {puedeEditarOrden && (
<CerrarOrdenServicio
                key={`${ordenSeleccionada.id}-${ordenSeleccionada.estado}`}
                orden={ordenSeleccionada}
                onActualizada={actualizarOrdenAsignada}
                onOcupado={setCerrandoOrden}
                bloqueado={ocupadoAsignacion}
              />
)}

            </>

          )}

        </article>

      )}

      {/* ESTADOS DE CARGA Y ERROR */}

      {cargando && (
        <p>Consultando órdenes de servicio...</p>
      )}

      {error && (
        <p role="alert" style={{ color: '#ef4444' }}>
          {error}
        </p>
      )}

      {/* LISTADO ADMINISTRATIVO */}

      {!cargando && !error && (

        <article style={estiloTarjeta}>

          <h2 style={{ marginBottom: '20px' }}>
            Listado de órdenes
          </h2>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '24px',
            }}
          >

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flex: 1,
                minWidth: '220px',
                ...estiloCampo,
              }}
            >

              <Search size={18} />

              <input
                type="search"
                aria-label="Buscar órdenes"
                placeholder="Buscar orden, cliente o equipo..."
                value={busqueda}
                onChange={evento =>
                  setBusqueda(evento.target.value)
                }
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  color: 'inherit',
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

              {Object.entries(ESTADOS).map(
                ([valor, configuracion]) => (

                  <option key={valor} value={valor}>
                    {configuracion.nombre}
                  </option>

                )
              )}

            </select>

          </div>

          <p
            style={{
              color: 'var(--text-light)',
              marginBottom: '16px',
            }}
          >
            Mostrando {ordenesFiltradas.length} de {totalOrdenes} órdenes.
          </p>

          {ordenesFiltradas.length === 0 ? (

            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'var(--text-light)',
              }}
            >

              <ClipboardList size={40} />

              <h3>
                {totalOrdenes === 0
                  ? 'No hay órdenes registradas'
                  : 'No se encontraron coincidencias'}
              </h3>

              <p>
                {totalOrdenes === 0
                  ? 'Las solicitudes de reparación aparecerán aquí.'
                  : 'Modifica los filtros de búsqueda.'}
              </p>

            </div>

          ) : (

            <div style={{ overflowX: 'auto' }}>

              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  minWidth: '950px',
                }}
              >

                <thead>

                  <tr>

                    <th style={estiloCelda}>Orden</th>
                    <th style={estiloCelda}>Cliente</th>
                    <th style={estiloCelda}>Equipo</th>
                    <th style={estiloCelda}>Recepción</th>
                    <th style={estiloCelda}>Estado</th>
                    <th style={estiloCelda}>Técnico</th>
                    <th style={estiloCelda}>Acciones</th>

                  </tr>

                </thead>

                <tbody>

                  {ordenesFiltradas.map(orden => (

                    <tr key={orden.id}>

                      <td style={estiloCelda}>
                        <strong>#{orden.id}</strong>
                      </td>

                      <td style={estiloCelda}>
                        {orden.cliente_nombre || 'No disponible'}
                      </td>

                      <td style={estiloCelda}>

                        <strong>
                          {nombreEquipo(orden)}
                        </strong>

                        <div
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-light)',
                            marginTop: '4px',
                          }}
                        >
                          {orden.equipo_detalle?.numero_serie ||
                            'Sin número de serie'}
                        </div>

                      </td>

                      <td style={estiloCelda}>
                        {formatearFecha(orden.fecha_recepcion)}
                      </td>

                      <td style={estiloCelda}>
                        <EstadoOrden estado={orden.estado} />
                      </td>

                      <td style={estiloCelda}>
                        {orden.tecnico_nombre || 'Sin asignar'}
                      </td>

                      <td style={estiloCelda}>

                        <button
                          type="button"
                          disabled={cargandoDetalle || asignandoTecnico}
                          onClick={() => consultarDetalle(orden.id)}
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

            </div>

          )}

        </article>

      )}

    </section>

  );
}
