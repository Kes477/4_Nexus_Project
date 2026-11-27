import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ChevronRight, UserCheck, Wrench, TrendingUp, Battery, Droplet, Wind, RotateCcw, BarChart3, MapPin, Activity, AlertTriangle } from 'lucide-react';
import { Button, IconButton, Badge, Tabs } from '../../components/ui';
import axiosClient from '../../api/axiosClient';
import { getDrones, actualizarEstadoDron } from '../../api/droneService';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [simBateria, setSimBateria] = useState(85);
  const [simCargaInsumo, setSimCargaInsumo] = useState(60);
  const [simViento, setSimViento] = useState(14);

  const unreadCount = 2;

  const resetSimulador = () => { 
    setSimBateria(100); 
    setSimCargaInsumo(100); 
    setSimViento(8); 
  };

  const cardStyle = {
    backgroundColor: 'var(--white)',
    border: '1px solid var(--light-gray)',
    padding: '24px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    textAlign: 'left',
    boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
    width: '100%',
    boxSizing: 'border-box'
  };

  const panelStyle = {
    backgroundColor: 'var(--white)',
    border: '1px solid var(--light-gray)',
    padding: '30px',
    borderRadius: '8px',
    marginBottom: '30px',
    textAlign: 'left',
    width: '100%',
    boxSizing: 'border-box'
  };

  const [actualizandoDron, setActualizandoDron] = useState(null);
  const [clientesActivos, setClientesActivos] = useState(null);
  const [totalPilotos, setTotalPilotos] = useState(null);

  const cambiarEstado = async (id, nuevoEstado) => {
    setActualizandoDron(id);

    try {
        const actualizado = await actualizarEstadoDron(
            id,
            nuevoEstado
        );

        setDrones(prev =>
            prev.map(dron =>
                dron.id === id ? actualizado : dron
            )
        );

    } catch {
        alert('No se pudo actualizar el estado del dron');
    } finally {
        setActualizandoDron(null);
    }
   };

  const [drones, setDrones] = useState([]);
  const [cargandoDrones, setCargandoDrones] = useState(true);
  const [errorDrones, setErrorDrones] = useState('');

  const [filtroModelo, setFiltroModelo] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const modelos = [...new Set(drones.map(d => d.modelo))];

  const tipos = [...new Set(drones.map(d => d.tipo_producto))];

  const estados = [...new Set(drones.map(d => d.estado))];

  const dronesFiltrados = drones.filter(dron =>
    (!filtroModelo || dron.modelo === filtroModelo) &&
    (!filtroTipo || dron.tipo_producto === filtroTipo) &&
    (!filtroEstado || dron.estado === filtroEstado)
  );

  const coloresEstado = {
    DISPONIBLE: 'success',
    ALQUILADO: 'info',
    EN_MANTENIMIENTO: 'warning'
  };

  const celdaStyle = {
    padding: '16px',
    fontSize: '14px',
    textAlign: 'left',
    borderBottom: '1px solid var(--light-gray)'
  };

  const filtroStyle = {
    width: '100%',
    padding: '8px',
    marginTop: '8px',
    borderRadius: '6px',
    border: '1px solid var(--light-gray)',
    backgroundColor: 'var(--white)',
    color: 'var(--color-dark)'
  };

  useEffect(() => {
  // Devuelve clientes activos
    axiosClient.get('/auth/clientes/activos/')
        .then(response => {
            setClientesActivos(response.data.total);
        })
        .catch(error => {
            console.error(error);
        });

        // Devuelve total de pilotos
    axiosClient.get('/pilotos/total/')
        .then(response => {
            setTotalPilotos(response.data.total);
        })
        .catch(error => {
            console.error('Error al consultar pilotos:', error);
        });
     
        // Devuelve drones
    getDrones()
        .then(setDrones)
        .catch(() => {
            setErrorDrones('No se pudo cargar la flota');
        })
        .finally(() => {
            setCargandoDrones(false);
        });
  }, []);

  return (
    <div style={{ 
      width: '100%', 
      minHeight: '100vh', 
      padding: '32px 48px', 
      boxSizing: 'border-box',
      backgroundColor: 'var(--bg-color)',
      color: 'var(--color-dark)',
      fontFamily: "'Roboto', sans-serif"
    }}>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px', marginBottom: '32px', paddingBottom: '20px', borderBottom: '1px solid var(--light-gray)' }}>
        <div style={{ textAlign: 'left' }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: 'var(--color-dark)' }}>Panel de Control Administrativo</h1>
          <p style={{ margin: '6px 0 0 0', fontSize: '15px', color: 'var(--text-light)', fontWeight: '500' }}>Consola central 4 Nexus • Telemetría, personal, finanzas y monitoreo global</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Badge text="Super admin root" color="primary" />
          
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <IconButton 
              icon="fa-bell" 
              variant="outline" 
              onClick={() => setShowNotifications(!showNotifications)} 
            />
            {unreadCount > 0 && (
              <div style={{ position: 'absolute', top: '-8px', right: '-8px', pointerEvents: 'none' }}>
                <Badge text={unreadCount} color="danger" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Clientes</span>
            <div style={{ backgroundColor: 'rgba(4, 201, 166, 0.1)', padding: '8px', borderRadius: '8px' }}>
              <Users size={20} color="var(--color-success)" />
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: '900' }}>{clientesActivos ?? '—'}{' '} <span style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-light)' }}>clientes activos</span></p>
        </div>
        
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Drones activos</span>
            <div style={{ backgroundColor: 'rgba(45, 210, 246, 0.1)', padding: '8px', borderRadius: '8px' }}>
              <UserCheck size={20} color="var(--color-info)" />
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: '900' }}>16 <span style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-light)' }}>drones</span></p>
          <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: 'var(--text-light)', fontWeight: '500' }}>12 operativos en misión hoy</p>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pilotos</span>
            <div style={{ backgroundColor: 'rgba(4, 201, 166, 0.1)', padding: '8px', borderRadius: '8px' }}>
              <Wrench size={20} color="var(--color-primary)" />
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: '900' }}>{totalPilotos ?? '—'}{' '} <span style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-light)' }}>pilotos</span></p>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ingresos totales</span>
            <div style={{ backgroundColor: 'rgba(241, 190, 38, 0.1)', padding: '8px', borderRadius: '8px' }}>
              <TrendingUp size={20} color="var(--color-warning)" />
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: '900' }}>L 38,500</p>
          <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: 'var(--text-light)', fontWeight: '500' }}>Margen operacional: 42%</p>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <Tabs 
          tabs={["Métricas y Finanzas", "Mapa en Vivo", "Simulador de Vuelo", "Estado de Drones"]} 
          activeTab={activeTab} 
          onChange={setActiveTab} 
        />
      </div>
 
      {/* Pestaña 1 */} 
      {activeTab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
          <div style={panelStyle}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} color="var(--color-primary)"/> Resumen Financiero
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-color)', borderRadius: '8px', borderLeft: '4px solid var(--color-success)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>Ingresos Mes Actual</span>
                <p style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 'bold' }}>L 38,500.00</p>
              </div>
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-color)', borderRadius: '8px', borderLeft: '4px solid var(--color-info)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>Suscripciones Activas</span>
                <p style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 'bold' }}>27 planes</p>
              </div>
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-color)', borderRadius: '8px', borderLeft: '4px solid var(--color-warning)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>Pagos Pendientes</span>
                <p style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 'bold' }}>L 4,200.00</p>
              </div>
            </div>
          </div>
          
          <div style={panelStyle}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={20} color="var(--color-primary)"/> Ingresos por Servicio (Últimos 6 meses)
            </h3>
            <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', borderBottom: '2px solid var(--light-gray)', paddingBottom: '10px' }}>
              {[40, 65, 50, 85, 70, 100].map((h, i) => (
                <div key={i} style={{ width: '60px', backgroundColor: 'var(--color-primary)', height: `${h}%`, borderRadius: '4px 4px 0 0', opacity: 0.8 }}></div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '12px', color: 'var(--text-light)', fontSize: '13px' }}>
              <span>Ene</span><span>Feb</span><span>Mar</span><span>Abr</span><span>May</span><span>Jun</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={20} color="var(--color-primary)"/> Flota de Drones Activos
            </h3>
            <Badge text="12 en misión" color="success" />
          </div>
          
          <div style={{ position: 'relative', width: '100%', height: '500px', backgroundColor: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--light-gray)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'var(--text-light)', fontWeight: 'bold', fontSize: '18px' }}>Visualización Satelital (Integración pendiente)</p>
            
            <div style={{ position: 'absolute', top: '30%', left: '20%', backgroundColor: 'var(--white)', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderLeft: '4px solid var(--color-success)' }}>
              <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>Agras T40 (#DRN-101)</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-light)' }}>Piloto: C. Mendoza</p>
            </div>

            <div style={{ position: 'absolute', top: '60%', left: '70%', backgroundColor: 'var(--white)', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderLeft: '4px solid var(--color-warning)' }}>
              <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>Matrice 300 (#DRN-204)</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-light)' }}>Piloto: A. Bermúdez</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--light-gray)' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={20} color="var(--color-primary)"/> Simulador de Rendimiento
            </h3>
            <Button variant="outline-dark" size="sm" onClick={resetSimulador}>
              <RotateCcw size={15} style={{ marginRight: '8px' }}/> Restablecer
            </Button>
          </div>
          
          <div style={{ backgroundColor: 'var(--bg-color)', padding: '24px', borderRadius: '8px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>
                <Battery size={18} color="var(--color-primary)" /> Batería: {simBateria}%
              </label>
              <input type="range" min="5" max="100" value={simBateria} onChange={(e) => setSimBateria(Number(e.target.value))} style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--color-primary)' }} />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>
                <Droplet size={18} color="var(--color-primary)" /> Tanque: {simCargaInsumo}%
              </label>
              <input type="range" min="0" max="100" value={simCargaInsumo} onChange={(e) => setSimCargaInsumo(Number(e.target.value))} style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--color-primary)' }} />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>
                <Wind size={18} color="var(--color-primary)" /> Viento: {simViento} km/h
              </label>
              <input type="range" min="0" max="40" value={simViento} onChange={(e) => setSimViento(Number(e.target.value))} style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--color-primary)' }} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 3 && (
        <div style={panelStyle}>

    <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
    }}>
        <h3 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        }}>
            <MapPin size={20} color="var(--color-primary)" />
            Flota de Drones
        </h3>

        <Badge
            text={`${dronesFiltrados.length} drones`}
            color="primary"
        />
    </div>

    <div style={{ overflowX: 'auto' }}>

        <table style={{
            width: '100%',
            borderCollapse: 'collapse'
        }}>

            <thead style={{
                backgroundColor: 'var(--bg-color)'
            }}>
                <tr>
                    <th style={celdaStyle}>
                        Modelo

                        <select
                            style={filtroStyle}
                            value={filtroModelo}
                            onChange={e => setFiltroModelo(e.target.value)}
                        >
                            <option value="">Todos</option>

                            {modelos.map(modelo => (
                                <option key={modelo} value={modelo}>
                                    {modelo}
                                </option>
                            ))}
                        </select>
                    </th>

                    <th style={celdaStyle}>
                        Tipo de producto

                        <select
                            style={filtroStyle}
                            value={filtroTipo}
                            onChange={e => setFiltroTipo(e.target.value)}
                        >
                            <option value="">Todos</option>

                            {tipos.map(tipo => (
                                <option key={tipo} value={tipo}>
                                    {tipo}
                                </option>
                            ))}
                        </select>
                    </th>

                    <th style={celdaStyle}>
                        Estado

                        <select
                            style={filtroStyle}
                            value={filtroEstado}
                            onChange={e => setFiltroEstado(e.target.value)}
                        >
                            <option value="">Todos</option>

                            {estados.map(estado => (
                                <option key={estado} value={estado}>
                                    {estado}
                                </option>
                            ))}
                        </select>
                    </th>
                </tr>
            </thead>

            <tbody>

                {cargandoDrones ? (
                    <tr>
                        <td colSpan={3} style={celdaStyle}>
                            Cargando drones...
                        </td>
                    </tr>
                ) : errorDrones ? (
                    <tr>
                        <td colSpan={3} style={celdaStyle}>
                            {errorDrones}
                        </td>
                    </tr>
                ) : dronesFiltrados.length === 0 ? (
                    <tr>
                        <td colSpan={3} style={celdaStyle}>
                            No se encontraron drones.
                        </td>
                    </tr>
                ) : (
                    dronesFiltrados.map(dron => (
                        <tr key={dron.id}>

                            <td style={celdaStyle}>
                                {dron.modelo}
                            </td>

                            <td style={celdaStyle}>
                                {dron.tipo_producto}
                            </td>

                            <td style={celdaStyle}>
    <select
        style={{
            ...filtroStyle,
            marginTop: 0,
            color: `var(--color-${coloresEstado[dron.estado]})`,
            fontWeight: 'bold'
        }}
        value={dron.estado}
        disabled={actualizandoDron !== null}
        onChange={e =>
            cambiarEstado(dron.id, e.target.value)
        }
    >
        <option value="DISPONIBLE">
            Disponible
        </option>

        <option value="ALQUILADO">
            Alquilado
        </option>

        <option value="EN_MANTENIMIENTO">
            En Mantenimiento
        </option>
    </select>
</td>
                        </tr>
                    ))
                )}

            </tbody>
        </table>

    </div>

    <Button
        variant="outline-dark"
        size="sm"
        onClick={() => {
            setFiltroModelo('');
            setFiltroTipo('');
            setFiltroEstado('');
        }}
        style={{ marginTop: '16px' }}
    >
        Limpiar filtros
    </Button>

    </div>
      )}

      <div style={{ border: '1px solid var(--color-primary)', padding: '32px', backgroundColor: 'var(--white)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '24px', textAlign: 'left', borderRadius: '8px', width: '100%', boxSizing: 'border-box', marginTop: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ padding: '16px', color: 'var(--color-primary)', backgroundColor: 'rgba(4, 201, 166, 0.1)', borderRadius: '12px' }}>
            <AlertTriangle size={32} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--color-dark)' }}>¿Necesitas Dar de Alta un Nuevo Piloto o Dron en 4 Nexus?</h4>
            <p style={{ margin: '6px 0 0 0', fontSize: '15px', color: 'var(--text-light)' }}>Gestiona los permisos de acceso y asignaciones técnicas desde la consola central.</p>
          </div>
        </div>
        <Button variant="primary" onClick={() => navigate("/admin/operaciones")} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 24px', fontSize: '15px' }}>
          <span>Gestionar flota y personal</span>
          <ChevronRight size={18} />
        </Button>
      </div>
    </div>
  );
}