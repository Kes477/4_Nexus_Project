import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, Download, Loader, Calendar, MapPin, Target, Plane, CheckCircle, Clock, AlertTriangle, FileText, Filter, History, Send, ThumbsDown, Ban } from 'lucide-react';

import { Button, Badge, SectionHeading, Alert } from '../../components/ui';

const ESTADOS = {
  PENDIENTE: { label: 'Pendiente', color: 'warning', icon: Clock },
  ACEPTADA: { label: 'Aceptada', color: 'info', icon: Send },
  EN_CURSO: { label: 'En curso', color: 'primary', icon: Clock },
  COMPLETADA: { label: 'Completada', color: 'success', icon: CheckCircle },
  RECHAZADA: { label: 'Rechazada', color: 'danger', icon: ThumbsDown },
  CANCELADA: { label: 'Cancelada', color: 'dark', icon: Ban },
};

const FILTROS = [
  { id: 'todos', label: 'Todos' },
  { id: 'completados', label: 'Completados' },
  { id: 'en_proceso', label: 'En proceso' },
  { id: 'alertas', label: 'Alertas' },
  { id: 'pendientes', label: 'Pendientes' },
];

const FILTRO_A_ESTADOS = {
  todos: null,
  completados: ['COMPLETADA'],
  en_proceso: ['ACEPTADA', 'EN_CURSO'],
  alertas: ['RECHAZADA', 'CANCELADA'],
  pendientes: ['PENDIENTE'],
};

export default function PilotoBitacora() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [vuelos, setVuelos] = useState([]);
  const [piloto, setPiloto] = useState({ nombre: '', licencia: '' });

  const [busqueda, setBusqueda] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('todos');
  const [exportando, setExportando] = useState(false);

  const searchInputRef = useRef(null);

  useEffect(() => {
    const fetchBitacora = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) throw new Error('No hay sesión activa');

        const [perfilResp, misionesResp] = await Promise.all([
          fetch(`${API_URL}/auth/perfil/`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch(`${API_URL}/pilotos/misiones/`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        ]);

        if (!perfilResp.ok) throw new Error('Error al cargar el perfil');
        if (!misionesResp.ok) throw new Error('Error al cargar la bitácora');

        const perfilData = await perfilResp.json();
        const misionesData = await misionesResp.json();

        setPiloto({
          nombre: `${perfilData.first_name || ''} ${perfilData.last_name || ''}`.trim() || 'Piloto',
          licencia: perfilData.perfil_piloto?.numero_licencia_aeronautica || '',
        });

        const lista = Array.isArray(misionesData) ? misionesData : (misionesData.results || []);

        const normalizados = lista.map((m) => ({
          id: m.id,
          codigo: `MIS-${String(m.id).padStart(4, '0')}`,
          fecha: m.fecha_programada || m.fecha_creacion || null,
          ubicacion: m.ubicacion || '—',
          proyecto: m.cliente_nombre || m.categoria || '—',
          objetivo: m.descripcion || m.categoria || '—',
          dron: m.dron_asignado || '—',
          duracion: m.duracion_horas != null ? Number(m.duracion_horas) : null,
          estado: m.estado || 'COMPLETADA',
          area: m.area_size || null,
        }));

        setVuelos(normalizados);
      } catch (error) {
        console.error(error);
        setErrorMsg('No se pudo cargar la bitácora de vuelos.');
      } finally {
        setLoading(false);
      }
    };

    fetchBitacora();
  }, [API_URL]);

  const vuelosFiltrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    const estadosPermitidos = FILTRO_A_ESTADOS[filtroActivo];

    return vuelos.filter((v) => {
      const cumpleEstado = !estadosPermitidos || estadosPermitidos.includes(v.estado);
      if (!cumpleEstado) return false;
      if (!term) return true;

      const haystack = [v.codigo, v.ubicacion, v.objetivo, v.dron, v.proyecto]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [vuelos, busqueda, filtroActivo]);

  const limpiarBusqueda = () => {
    setBusqueda('');
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '—';
    try {
      return new Date(fecha).toLocaleDateString('es-HN', {
        year: 'numeric', month: 'short', day: '2-digit'
      });
    } catch {
      return fecha;
    }
  };

  const formatearDuracion = (horas) => {
    if (horas == null || isNaN(horas)) return '—';
    const h = Math.floor(horas);
    const m = Math.round((horas - h) * 60);
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} h`;
    return `${h} h ${m} min`;
  };

  const exportarPDF = async () => {
    if (vuelosFiltrados.length === 0) {
      setErrorMsg('No hay registros para exportar con los filtros actuales.');
      return;
    }

    setExportando(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams();
      if (busqueda.trim()) params.append('busqueda', busqueda.trim());
      params.append('filtro', filtroActivo);

      const resp = await fetch(
        `${API_URL}/pilotos/misiones/exportar-pdf/?${params.toString()}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (!resp.ok) throw new Error('Error al generar el PDF');

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = `bitacora_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
      URL.revokeObjectURL(url);

      setSuccessMsg('PDF generado y descargado correctamente.');
    } catch (error) {
      console.error(error);
      setErrorMsg('No se pudo generar el PDF. Intenta de nuevo.');
    } finally {
      setExportando(false);
    }
  };

  const cardStyle = {
    backgroundColor: 'var(--white)',
    border: '1px solid var(--light-gray)',
    borderRadius: '12px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
  };

  const thStyle = {
    textAlign: 'left',
    padding: '12px 14px',
    fontSize: '11px',
    fontWeight: '800',
    color: 'var(--text-light)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid var(--light-gray)',
    backgroundColor: 'var(--bg-color)',
    whiteSpace: 'nowrap',
  };

  const tdStyle = {
    padding: '12px 14px',
    fontSize: '13px',
    color: 'var(--color-dark)',
    borderBottom: '1px solid var(--light-gray)',
    verticalAlign: 'top',
  };

  const filtroBtnStyle = (activo) => ({
    padding: '8px 16px',
    borderRadius: '999px',
    border: activo ? '1px solid var(--color-primary)' : '1px solid var(--light-gray)',
    backgroundColor: activo ? 'var(--color-primary)' : 'var(--white)',
    color: activo ? 'var(--white)' : 'var(--text-light)',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-color)' }}>
        <Loader text="Cargando bitácora..." />
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      padding: '32px 48px',
      boxSizing: 'border-box',
      backgroundColor: 'var(--bg-color)',
      color: 'var(--color-dark)',
      fontFamily: "'Roboto', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>

      {errorMsg && (
        <div style={{ width: '100%', maxWidth: '1300px', marginBottom: '16px' }}>
          <Alert type="danger" title="Atención" message={errorMsg} onClose={() => setErrorMsg(null)} />
        </div>
      )}

      {successMsg && (
        <div style={{ width: '100%', maxWidth: '1300px', marginBottom: '16px' }}>
          <Alert type="success" title="Listo" message={successMsg} onClose={() => setSuccessMsg(null)} />
        </div>
      )}

      <div style={{ width: '100%', maxWidth: '1300px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <History size={18} color="var(--color-primary)" />
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Historial de Operaciones
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '900', color: 'var(--color-dark)' }}>
              Bitácora de Vuelos
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-light)' }}>
              Consulta, filtra y exporta tus operaciones registradas.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={exportarPDF}
            disabled={exportando || vuelosFiltrados.length === 0}
          >
            {exportando ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-circle-notch fa-spin"></i> Generando PDF...
              </span>
            ) : (
              <>
                <Download size={14} style={{ marginRight: '6px' }} /> Exportar bitácora PDF
              </>
            )}
          </Button>
        </div>

        <div style={{ ...cardStyle, padding: '16px 20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ position: 'relative', flex: '1 1 320px', minWidth: '240px' }}>
              <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', zIndex: 1 }}>
                <Search size={16} />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por código, ubicación, objetivo o dron..."
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 40px',
                  borderRadius: '8px',
                  border: '1px solid var(--light-gray)',
                  fontSize: '13px',
                  color: 'var(--color-dark)',
                  backgroundColor: 'var(--white)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={limpiarBusqueda}
                  aria-label="Limpiar búsqueda"
                  title="Limpiar búsqueda"
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-light)',
                    padding: '4px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: '4px' }}>
              <Filter size={13} /> Filtrar:
            </span>
            {FILTROS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltroActivo(f.id)}
                style={filtroBtnStyle(filtroActivo === f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          {vuelosFiltrados.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <FileText size={42} color="var(--text-light)" style={{ marginBottom: '12px' }} />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--color-dark)' }}>
                No se encontraron vuelos
              </h3>
              <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: 'var(--text-light)' }}>
                {busqueda.trim() || filtroActivo !== 'todos'
                  ? 'Ajusta la búsqueda o los filtros para ver resultados.'
                  : 'Aún no tienes vuelos registrados en tu bitácora.'}
              </p>
              {(busqueda.trim() || filtroActivo !== 'todos') && (
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  {busqueda.trim() && (
                    <Button variant="outline-dark" size="sm" onClick={limpiarBusqueda}>
                      <X size={13} style={{ marginRight: '4px' }} /> Limpiar búsqueda
                    </Button>
                  )}
                  {filtroActivo !== 'todos' && (
                    <Button variant="outline-dark" size="sm" onClick={() => setFiltroActivo('todos')}>
                      Ver todos
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Código / Fecha</th>
                    <th style={thStyle}>Ubicación / Proyecto</th>
                    <th style={thStyle}>Objetivo</th>
                    <th style={thStyle}>Dron / Métricas</th>
                    <th style={thStyle}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {vuelosFiltrados.map((v) => {
                    const estadoInfo = ESTADOS[v.estado] || { label: v.estado, color: 'dark', icon: Clock };
                    return (
                      <tr key={v.id}>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: '800', fontSize: '13px' }}>{v.codigo}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-light)', marginTop: '2px' }}>
                            <Calendar size={11} /> {formatearFecha(v.fecha)}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                            <MapPin size={12} color="var(--color-primary)" /> {v.ubicacion}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '2px' }}>
                            {v.proyecto}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                            <Target size={12} color="var(--color-primary)" style={{ marginTop: '2px', flexShrink: 0 }} />
                            <span style={{ fontSize: '12px' }}>{v.objetivo}</span>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                            <Plane size={12} color="var(--color-primary)" /> {v.dron}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '2px' }}>
                            {formatearDuracion(v.duracion)}{v.area ? ` · ${v.area}` : ''}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <Badge text={estadoInfo.label} color={estadoInfo.color} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--light-gray)',
            backgroundColor: 'var(--bg-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            fontSize: '12px',
            color: 'var(--text-light)',
            fontWeight: '600'
          }}>
            <span>
              Total de vuelos filtrados: <strong style={{ color: 'var(--color-dark)' }}>{vuelosFiltrados.length}</strong>
              {vuelos.length !== vuelosFiltrados.length && <> de {vuelos.length}</>}
            </span>
            <span>
              {busqueda.trim() && `Búsqueda: "${busqueda.trim()}"`}
              {busqueda.trim() && filtroActivo !== 'todos' && ' · '}
              {filtroActivo !== 'todos' && `Filtro: ${FILTROS.find((f) => f.id === filtroActivo)?.label}`}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}