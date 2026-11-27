import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, X, Download, Calendar, MapPin, Target, Plane, 
  CheckCircle, Clock, FileText, History, Send, ThumbsDown, Ban, User
} from 'lucide-react';

import { Button, Badge, SectionHeading, Alert, Loader, Tabs } from '../../components/ui';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [vuelos, setVuelos] = useState([]);
  
  const [busqueda, setBusqueda] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('todos');
  const [exportando, setExportando] = useState(false);

  const searchInputRef = useRef(null);

  useEffect(() => {
    let activo = true;
    const fetchBitacora = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const token = localStorage.getItem('access_token');
        if (!token) throw new Error('No hay sesión activa');

        const res = await fetch(`${API_URL}/pilotos/misiones/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!res.ok) {
          throw new Error('Error al cargar la bitácora de vuelos.');
        }

        const data = await res.json();
        const lista = Array.isArray(data) ? data : data.results ?? [];

        const normalizados = lista.map((m) => {
          const nombreCliente = m.cliente_nombre || m.cliente;
          const clienteFinal = (!nombreCliente || String(nombreCliente).trim() === '' || String(nombreCliente).toLowerCase() === 'uso personal') 
            ? 'Uso Personal' 
            : nombreCliente;

          let duracion = null;
          if (m.duracion_horas != null) {
            duracion = Number(m.duracion_horas);
          } else if (m.fecha_creacion && m.fecha_cierre) {
            const inicio = new Date(m.fecha_creacion);
            const fin = new Date(m.fecha_cierre);
            const diffHoras = (fin - inicio) / (1000 * 60 * 60);
            if (diffHoras > 0) duracion = diffHoras;
          }

          const servicioFormateado = m.categoria 
            ? m.categoria.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) 
            : '—';

          return {
            id: m.id,
            codigo: `MIS-${String(m.id).padStart(4, '0')}`,
            fecha: m.fecha_programada || m.fecha_creacion || null,
            ubicacion: m.ubicacion || '—',
            cliente: clienteFinal,
            servicio: servicioFormateado,
            dron: m.dron_asignado || '—',
            duracion: duracion,
            area: m.area_size || null,
            estado: m.estado || 'COMPLETADA',
          };
        });

        if (activo) setVuelos(normalizados);
      } catch (err) {
        if (activo) setErrorMsg(err.message || 'No se pudo cargar la bitácora.');
      } finally {
        if (activo) setLoading(false);
      }
    };

    fetchBitacora();
    return () => { activo = false; };
  }, []);

  const vuelosFiltrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    const estadosPermitidos = FILTRO_A_ESTADOS[filtroActivo];

    return vuelos.filter((v) => {
      const cumpleEstado = !estadosPermitidos || estadosPermitidos.includes(v.estado);
      if (!cumpleEstado) return false;
      if (!term) return true;

      const haystack = [v.codigo, v.ubicacion, v.cliente, v.servicio, v.dron]
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
        { headers: { 'Authorization': `Bearer ${token}` } }
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
    padding: '14px 16px',
    fontSize: '11px',
    fontWeight: '800',
    color: 'var(--text-light)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '2px solid var(--light-gray)',
    backgroundColor: 'var(--bg-color)',
    whiteSpace: 'nowrap',
  };

  const tdStyle = {
    padding: '16px',
    fontSize: '13px',
    color: 'var(--color-dark)',
    borderBottom: '1px solid var(--light-gray)',
    verticalAlign: 'middle',
  };

  const tabIndex = FILTROS.findIndex(f => f.id === filtroActivo);

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      padding: '40px 20px',
      boxSizing: 'border-box',
      backgroundColor: 'var(--bg-color)',
      fontFamily: "'Roboto', sans-serif",
    }}>
      <div className="section-container" style={{ maxWidth: '1300px', margin: '0 auto' }}>
        
        {/* Cabecera Principal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
          <SectionHeading 
            title="Bitácora de Vuelos"
            description="Consulta, filtra y exporta tus operaciones registradas."
          />

          <Button
            variant="primary"
            size="sm"
            onClick={exportarPDF}
            disabled={exportando || vuelosFiltrados.length === 0}
          >
            {exportando ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-circle-notch fa-spin"></i> Generando...
              </span>
            ) : (
              <>
                <Download size={14} style={{ marginRight: '6px' }} /> Exportar PDF
              </>
            )}
          </Button>
        </div>

        {/* Alertas */}
        <div style={{ marginBottom: '20px' }}>
          {errorMsg && <Alert type="danger" title="Atención" message={errorMsg} onClose={() => setErrorMsg(null)} />}
          {successMsg && <Alert type="success" title="Listo" message={successMsg} onClose={() => setSuccessMsg(null)} />}
        </div>

        {/* Barra de Búsqueda y Filtros */}
        <div style={{ ...cardStyle, padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ position: 'relative', flex: '1 1 320px', minWidth: '240px' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', zIndex: 1 }}>
                <Search size={18} />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por código, ubicación, cliente o servicio..."
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 44px',
                  borderRadius: '8px',
                  border: '1px solid var(--light-gray)',
                  fontSize: '14px',
                  color: 'var(--color-dark)',
                  backgroundColor: 'var(--bg-color)',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--light-gray)'}
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={limpiarBusqueda}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Tabs sin el texto "Filtrar:" */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <Tabs 
              tabs={FILTROS.map(f => f.label)} 
              activeTab={tabIndex !== -1 ? tabIndex : 0} 
              onChange={(index) => setFiltroActivo(FILTROS[index].id)} 
            />
          </div>
        </div>

        {/* Tabla de Datos */}
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          {loading ? (
            <Loader text="Cargando bitácora de vuelos..." />
          ) : vuelosFiltrados.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <FileText size={48} color="var(--text-light)" style={{ marginBottom: '16px', opacity: 0.5 }} />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--color-dark)' }}>
                No se encontraron vuelos
              </h3>
              <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'var(--text-light)' }}>
                {busqueda.trim() || filtroActivo !== 'todos'
                  ? 'Ajusta la búsqueda o los filtros para ver resultados.'
                  : 'Aún no tienes vuelos registrados en tu bitácora.'}
              </p>
              {(busqueda.trim() || filtroActivo !== 'todos') && (
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
                  {busqueda.trim() && (
                    <Button variant="outline-dark" size="sm" onClick={limpiarBusqueda}>
                      <X size={14} style={{ marginRight: '6px' }} /> Limpiar búsqueda
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
                    <th style={thStyle}>Ubicación</th>
                    <th style={thStyle}>Cliente</th>
                    <th style={thStyle}>Servicio</th>
                    <th style={thStyle}>Dron / Métricas</th>
                    <th style={thStyle}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {vuelosFiltrados.map((v) => {
                    const estadoInfo = ESTADOS[v.estado] || { label: v.estado, color: 'dark', icon: Clock };
                    return (
                      <tr 
                        key={v.id} 
                        style={{ transition: 'background 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(4, 201, 166, 0.03)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={tdStyle}>
                          <div style={{ fontWeight: '800', fontSize: '14px', color: 'var(--color-primary)' }}>{v.codigo}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>
                            <Calendar size={13} /> {formatearFecha(v.fecha)}
                          </div>
                        </td>
                        
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '13px' }}>
                            <MapPin size={14} color="var(--color-primary)" /> {v.ubicacion}
                          </div>
                        </td>

                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '13px' }}>
                            <User size={14} color="var(--color-primary)" /> {v.cliente}
                          </div>
                        </td>
                        
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '13px' }}>
                            <Target size={14} color="var(--color-primary)" /> {v.servicio}
                          </div>
                        </td>
                        
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '13px' }}>
                            <Plane size={14} color="var(--color-primary)" /> {v.dron}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px', paddingLeft: '20px' }}>
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

          {/* Footer de la Tabla */}
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--light-gray)',
            backgroundColor: 'var(--bg-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            fontSize: '13px',
            color: 'var(--text-light)',
            fontWeight: '600'
          }}>
            <span>
              Mostrando <strong style={{ color: 'var(--color-dark)' }}>{vuelosFiltrados.length}</strong> de {vuelos.length} vuelos
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {busqueda.trim() && <span>Búsqueda: "{busqueda.trim()}"</span>}
              {busqueda.trim() && filtroActivo !== 'todos' && <span>·</span>}
              {filtroActivo !== 'todos' && <span>Filtro: {FILTROS.find((f) => f.id === filtroActivo)?.label}</span>}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}