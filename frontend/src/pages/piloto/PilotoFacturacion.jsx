import React, { useEffect, useMemo, useState } from 'react';
import { DollarSign, Clock, TrendingUp, FileText, Download } from 'lucide-react';
import { 
    SectionHeading, 
    Loader, 
    Alert, 
    Select, 
    Tabs, 
    Badge,
    Button
} from '../../components/ui';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const LOCALE = 'es-HN';
const MONEDA = 'HNL';

const PERIODOS = [
  { key: 'semanal', label: 'Semanal' },
  { key: 'mensual', label: 'Mensual' },
  { key: 'anual', label: 'Anual' },
];

const formatMoney = (n) =>
  new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: MONEDA,
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString(LOCALE, { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatHoras = (n) => `${(Number(n) || 0).toFixed(1)} h`;

const formatCategoria = (cat) => {
  if (cat === 'TODAS') return 'Todos los servicios';
  return cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const rangoPeriodo = (key) => {
  const ahora = new Date();
  const desde = new Date(ahora);
  const hasta = new Date(ahora);

  if (key === 'semanal') {
    desde.setDate(ahora.getDate() - 6);
  } else if (key === 'mensual') {
    desde.setDate(1);
    hasta.setMonth(ahora.getMonth() + 1, 0);
  } else if (key === 'anual') {
    desde.setMonth(0, 1);
    hasta.setMonth(11, 31);
  }

  desde.setHours(0, 0, 0, 0);
  hasta.setHours(23, 59, 59, 999);
  return { desde, hasta };
};

export default function PilotoFacturacion() {
  const [periodo, setPeriodo] = useState('mensual');
  const [servicioActivo, setServicioActivo] = useState('TODAS');
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    let activo = true;
    const fetchFacturacion = async () => {
      setCargando(true);
      setErrorMsg(null);
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${API_URL}/pilotos/misiones/facturacion/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!res.ok) {
          throw new Error(
            res.status === 403
              ? 'No tienes permiso para consultar la facturación.'
              : 'Error al cargar los datos de facturación.'
          );
        }
        
        const data = await res.json();
        const lista = Array.isArray(data) ? data : data.results ?? [];
        
        if (activo) {
          setRegistros(lista.filter((r) => r.estado === 'COMPLETADA' || r.estado === undefined));
        }
      } catch (err) {
        if (activo) setErrorMsg(err.message || 'No se pudo cargar la facturación.');
      } finally {
        if (activo) setCargando(false);
      }
    };

    fetchFacturacion();
    return () => { activo = false; };
  }, []);

  const resumenTotal = useMemo(() => {
    return {
      monto: registros.reduce((s, r) => s + (Number(r.monto) || 0), 0),
      horas: registros.reduce((s, r) => s + (Number(r.horas) || 0), 0),
      servicios: registros.length,
    };
  }, [registros]);

  const categoriasDisponibles = useMemo(() => {
    const cats = new Set(registros.map(r => r.categoria));
    return ['TODAS', ...Array.from(cats)];
  }, [registros]);

  const registrosFiltrados = useMemo(() => {
    const { desde, hasta } = rangoPeriodo(periodo);
    return registros
      .filter((r) => {
        const f = new Date(`${r.fecha}T00:00:00`);
        const matchPeriodo = f >= desde && f <= hasta;
        const matchServicio = servicioActivo === 'TODAS' || r.categoria === servicioActivo;
        return matchPeriodo && matchServicio;
      })
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [registros, periodo, servicioActivo]);

  const totalPeriodo = useMemo(
    () => registrosFiltrados.reduce((s, r) => s + (Number(r.monto) || 0), 0),
    [registrosFiltrados],
  );

  const tabIndex = categoriasDisponibles.indexOf(servicioActivo);

  const exportarPDF = async () => {
    if (registrosFiltrados.length === 0) {
      setErrorMsg('No hay registros para exportar con los filtros actuales.');
      return;
    }

    setExportando(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams();
      params.append('periodo', periodo);
      params.append('categoria', servicioActivo);

      const resp = await fetch(
        `${API_URL}/pilotos/misiones/facturacion/exportar-pdf/?${params.toString()}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (!resp.ok) throw new Error('Error al generar el PDF');

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = `facturacion_${new Date().toISOString().slice(0, 10)}.pdf`;
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

  return (
    <div style={{ padding: '40px 20px', backgroundColor: 'var(--bg-color)', minHeight: '100vh' }}>
      <div className="section-container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-end', 
          flexWrap: 'wrap', 
          gap: '16px', 
          marginBottom: '30px' 
        }}>
          <SectionHeading 
            title="Facturación y Ganancias"
            description="Consulta el historial total de tus ingresos por servicios de vuelo."
          />
          <Button
            variant="primary"
            size="sm"
            onClick={exportarPDF}
            disabled={exportando || registrosFiltrados.length === 0}
          >
            {exportando ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-circle-notch fa-spin"></i> Generando PDF...
              </span>
            ) : (
              <>
                <Download size={14} style={{ marginRight: '6px' }} /> Exportar PDF
              </>
            )}
          </Button>
        </div>

        {successMsg && (
          <div style={{ marginBottom: '20px' }}>
            <Alert 
              type="success" 
              title="Listo" 
              message={successMsg} 
              onClose={() => setSuccessMsg(null)} 
            />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ background: 'var(--white)', padding: '20px', borderRadius: '12px', border: '1px solid var(--light-gray)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Facturación Total</span>
              <DollarSign size={20} color="var(--color-primary)" />
            </div>
            <div style={{ fontSize: '26px', fontWeight: '900', color: 'var(--color-dark)' }}>{formatMoney(resumenTotal.monto)}</div>
          </div>

          <div style={{ background: 'var(--white)', padding: '20px', borderRadius: '12px', border: '1px solid var(--light-gray)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Horas Totales</span>
              <Clock size={20} color="var(--color-info)" />
            </div>
            <div style={{ fontSize: '26px', fontWeight: '900', color: 'var(--color-dark)' }}>{formatHoras(resumenTotal.horas)}</div>
          </div>

          <div style={{ background: 'var(--white)', padding: '20px', borderRadius: '12px', border: '1px solid var(--light-gray)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Servicios Completados</span>
              <TrendingUp size={20} color="var(--color-success)" />
            </div>
            <div style={{ fontSize: '26px', fontWeight: '900', color: 'var(--color-dark)' }}>{resumenTotal.servicios}</div>
          </div>
        </div>

        <div style={{ background: 'var(--white)', padding: '25px', borderRadius: '12px', border: '1px solid var(--light-gray)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: '600', color: 'var(--color-dark)', fontSize: '14px' }}>Filtrar por periodo:</span>
            <Select
              options={PERIODOS.map(p => ({ value: p.key, label: p.label }))}
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              style={{ maxWidth: '150px' }}
            />
          </div>

          {categoriasDisponibles.length > 1 && (
            <div style={{ marginBottom: '25px' }}>
              <Tabs
                tabs={categoriasDisponibles.map(formatCategoria)}
                activeTab={tabIndex !== -1 ? tabIndex : 0}
                onChange={(index) => setServicioActivo(categoriasDisponibles[index])}
              />
            </div>
          )}

          {cargando && <Loader text="Cargando facturación..." />}
          
          {!cargando && errorMsg && (
            <div style={{ marginBottom: '20px' }}>
              <Alert 
                type="danger" 
                title="Error de conexión" 
                message={errorMsg} 
                onClose={() => setErrorMsg(null)} 
              />
            </div>
          )}

          {!cargando && !errorMsg && registrosFiltrados.length === 0 && (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-light)', background: 'var(--bg-color)', borderRadius: '10px', border: '1px dashed var(--light-gray)' }}>
              <FileText size={36} color="var(--text-light)" style={{ marginBottom: '15px' }} />
              <h3 style={{ color: 'var(--color-dark)', fontSize: '18px', marginBottom: '8px' }}>Sin ingresos en el periodo</h3>
              <p style={{ fontSize: '14px', margin: 0 }}>
                No se registraron servicios facturados de {formatCategoria(servicioActivo)} en el periodo {periodo}.
              </p>
            </div>
          )}

          {!cargando && !errorMsg && registrosFiltrados.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--light-gray)', backgroundColor: 'var(--bg-color)' }}>
                    <th style={{ textAlign: 'left', padding: '12px 10px', color: 'var(--color-dark)', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fecha</th>
                    <th style={{ textAlign: 'left', padding: '12px 10px', color: 'var(--color-dark)', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Servicio</th>
                    <th style={{ textAlign: 'right', padding: '12px 10px', color: 'var(--color-dark)', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Horas</th>
                    <th style={{ textAlign: 'right', padding: '12px 10px', color: 'var(--color-dark)', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monto</th>
                    <th style={{ textAlign: 'center', padding: '12px 10px', color: 'var(--color-dark)', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {registrosFiltrados.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--light-gray)' }}>
                      <td style={{ padding: '15px 10px', color: 'var(--color-dark)' }}>{formatDate(r.fecha)}</td>
                      <td style={{ padding: '15px 10px' }}>
                        <strong style={{ color: 'var(--color-dark)' }}>{formatCategoria(r.categoria)}</strong>
                      </td>
                      <td style={{ padding: '15px 10px', color: 'var(--color-dark)', textAlign: 'right' }}>{formatHoras(r.horas)}</td>
                      <td style={{ padding: '15px 10px', color: 'var(--color-primary)', textAlign: 'right', fontWeight: 'bold' }}>{formatMoney(r.monto)}</td>
                      <td style={{ padding: '15px 10px', textAlign: 'center' }}>
                        <Badge text={r.estado || 'COMPLETADA'} color="success" />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: 'rgba(4, 201, 166, 0.05)' }}>
                    <td colSpan={3} style={{ padding: '15px 10px', textAlign: 'right', fontWeight: '700', color: 'var(--color-dark)' }}>
                      Total del periodo
                    </td>
                    <td style={{ padding: '15px 10px', textAlign: 'right', fontWeight: '900', color: 'var(--color-primary)', fontSize: '16px' }}>
                      {formatMoney(totalPeriodo)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}