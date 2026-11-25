
import { useCallback, useEffect, useState } from 'react';
import { obtenerOrdenes, obtenerOrdenPorId } from '../../api/reparacionesService';

const estilos = {
  pagina: {
    padding: '32px',
    width: '100%',
    maxWidth: '1300px',
    margin: '0 auto',
    boxSizing: 'border-box',
    flex: 1,
  },
  encabezado: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '28px',
  },
  tarjetas: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  tarjeta: {
    background: 'var(--card-bg, var(--bg-color, #fff))',
    border: '1px solid var(--border-color, #ddd)',
    borderRadius: '12px',
    padding: '22px',
  },
  boton: {
    padding: '11px 18px',
    background: '#00c9a7',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  seccion: {
    border: '1px solid var(--border-color, #ddd)',
    borderRadius: '12px',
    padding: '24px',
  },
};

const estados = {
  RECIBIDA: 'Recibida',
  EN_DIAGNOSTICO: 'En diagnóstico',
  EN_REPARACION: 'En reparación',
  FINALIZADA: 'Finalizada',
  ENTREGADA: 'Entregada',
  CANCELADA: 'Cancelada',
};

export default function TecnicoOrdenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const cargarOrdenes = useCallback(async () => {
    setCargando(true);
    setError('');

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
        err.response?.data?.detail ||
        'No fue posible consultar las órdenes de reparación.'
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarOrdenes();
  }, [cargarOrdenes]);

  const verDetalle = async (id) => {
    setCargandoDetalle(true);
    setError('');

    try {
      const respuesta = await obtenerOrdenPorId(id);
      setDetalle(respuesta);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'No fue posible consultar el detalle de la orden.'
      );
    } finally {
      setCargandoDetalle(false);
    }
  };

  const contarEstado = (estado) =>
    ordenes.filter((orden) => orden.estado === estado).length;

  const indicadores = [
    {
      titulo: 'Órdenes asignadas',
      valor: ordenes.length,
    },
    {
      titulo: 'En diagnóstico',
      valor: contarEstado('EN_DIAGNOSTICO'),
    },
    {
      titulo: 'En reparación',
      valor: contarEstado('EN_REPARACION'),
    },
    {
      titulo: 'Finalizadas',
      valor: contarEstado('FINALIZADA'),
    },
  ];

  return (
    <div style={estilos.pagina}>
      <header style={estilos.encabezado}>
        <div>
          <h1 style={{ marginBottom: '8px' }}>
            Panel de reparaciones
          </h1>
          <p style={{ color: 'var(--text-secondary, #64748b)' }}>
            Consulta y supervisa tus órdenes de servicio técnico.
          </p>
        </div>

        <button
          type="button"
          style={estilos.boton}
          onClick={cargarOrdenes}
          disabled={cargando}
        >
          {cargando ? 'Actualizando...' : 'Actualizar órdenes'}
        </button>
      </header>

      <div style={estilos.tarjetas}>
        {indicadores.map((indicador) => (
          <div key={indicador.titulo} style={estilos.tarjeta}>
            <p style={{ margin: '0 0 14px', opacity: 0.75 }}>
              {indicador.titulo}
            </p>
            <h2 style={{ fontSize: '32px', margin: 0 }}>
              {indicador.valor}
            </h2>
          </div>
        ))}
      </div>

      <section style={estilos.seccion}>
        <h2 style={{ marginTop: 0 }}>Mis órdenes de servicio</h2>

        {cargando && <p>Cargando órdenes...</p>}

        {error && (
          <p role="alert" style={{ color: '#dc2626' }}>
            {error}
          </p>
        )}

        {!cargando && !error && ordenes.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 16px',
            }}
          >
            <h3>No tienes órdenes asignadas</h3>
            <p style={{ opacity: 0.75 }}>
              Cuando se te asigne una reparación, aparecerá
              aquí con su estado y sus detalles.
            </p>
          </div>
        )}

        {!cargando && ordenes.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
              }}
            >
              <thead>
                <tr>
                  <th style={{ padding: '12px' }}>Orden</th>
                  <th style={{ padding: '12px' }}>Equipo</th>
                  <th style={{ padding: '12px' }}>Problema</th>
                  <th style={{ padding: '12px' }}>Estado</th>
                  <th style={{ padding: '12px' }}>Acción</th>
                </tr>
              </thead>

              <tbody>
                {ordenes.map((orden) => (
                  <tr key={orden.id}>
                    <td style={{ padding: '12px' }}>
                      #{orden.id}
                    </td>
                    <td style={{ padding: '12px' }}>
                      Equipo #{orden.equipo}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {orden.descripcion_problema}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {estados[orden.estado] || orden.estado}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button
                        type="button"
                        onClick={() => verDetalle(orden.id)}
                        disabled={cargandoDetalle}
                      >
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

      {detalle && (
        <section
          style={{
            ...estilos.seccion,
            marginTop: '24px',
          }}
        >
          <h2>Detalle de la orden #{detalle.id}</h2>

          <p>
            <strong>Equipo:</strong> #{detalle.equipo}
          </p>

          <p>
            <strong>Problema:</strong>{' '}
            {detalle.descripcion_problema}
          </p>

          <p>
            <strong>Estado:</strong>{' '}
            {estados[detalle.estado] || detalle.estado}
          </p>

          <p>
            <strong>Observaciones:</strong>{' '}
            {detalle.observaciones || 'Sin observaciones'}
          </p>

          <button
            type="button"
            onClick={() => setDetalle(null)}
          >
            Cerrar detalle
          </button>
        </section>
      )}
    </div>
  );
}
