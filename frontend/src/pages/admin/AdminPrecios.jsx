import React, { useState } from 'react';
import { Plus, Edit3, Drone, ShieldCheck, Tag, ShoppingBag } from 'lucide-react';

// Importación estricta de tus componentes
import { Button, Tabs, Badge, Input, Toggle, Modal, SectionHeading } from '../../components/ui';

export default function AdminPrecios() {
  const [tab, setTab] = useState(0); // 0: Planes, 1: Drones

  // --- ESTADOS DE PLANES ---
  const [planes, setPlanes] = useState([
    { id: 1, name: "Básico", price: 1200, cycle: "Mensual", active: true },
    { id: 2, name: "Operativo", price: 2800, cycle: "Mensual", active: true },
    { id: 3, name: "Premium", price: 5500, cycle: "Mensual", active: true },
  ]);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  // --- ESTADOS DE DRONES ---
  const [drones, setDrones] = useState([
    { id: 1, name: "DJI Agras T40", price: 180000, stock: 5, tag: "Fumigación", active: true },
    { id: 2, name: "DJI Matrice 300 RTK", price: 320000, stock: 2, tag: "Mapeo", active: true },
    { id: 3, name: "Wingcopter 178", price: 680000, stock: 1, tag: "Logística", active: false },
  ]);
  const [isDroneModalOpen, setIsDroneModalOpen] = useState(false);
  const [editingDrone, setEditingDrone] = useState(null);

  // Estilos para la tabla
  const tableHeaderStyle = {
    backgroundColor: 'var(--bg-color)',
    borderBottom: '2px solid var(--light-gray)',
    padding: '16px',
    fontSize: '13px',
    fontWeight: 'bold',
    color: 'var(--text-light)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    textAlign: 'left'
  };

  const tableCellStyle = {
    padding: '16px',
    fontSize: '14px',
    borderBottom: '1px solid var(--light-gray)',
    color: 'var(--color-dark)'
  };

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
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', paddingBottom: '20px', borderBottom: '1px solid var(--light-gray)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: 'var(--color-dark)' }}>Precios y Catálogo</h1>
          <p style={{ margin: '6px 0 0 0', fontSize: '15px', color: 'var(--text-light)', fontWeight: '500' }}>Configura planes de suscripción, tarifas y equipos de venta.</p>
        </div>
        
        {/* Botón dinámico según la pestaña */}
        <Button 
          variant="primary" 
          onClick={() => {
            if (tab === 0) {
              setEditingPlan({ id: 0, name: "", price: 1000, cycle: "Mensual", active: true });
              setIsPlanModalOpen(true);
            } else {
              setEditingDrone({ id: 0, name: "", price: 100000, stock: 1, tag: "Nuevo", active: true });
              setIsDroneModalOpen(true);
            }
          }}
        >
          <Plus size={18} style={{ marginRight: '8px' }} />
          {tab === 0 ? "Nuevo Plan" : "Nuevo Dron"}
        </Button>
      </div>

      {/* COMPONENTE TABS */}
      <div style={{ marginBottom: '32px' }}>
        <Tabs 
          tabs={["Planes de suscripción", "Catálogo de Drones"]} 
          activeTab={tab} 
          onChange={setTab} 
        />
      </div>

      {/* ========================================== */}
      {/* PESTAÑA 0: PLANES DE SUSCRIPCIÓN */}
      {/* ========================================== */}
      {tab === 0 && (
        <div style={{ backgroundColor: 'var(--white)', border: '1px solid var(--light-gray)', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Nombre del Plan</th>
                  <th style={tableHeaderStyle}>Precio (L.)</th>
                  <th style={tableHeaderStyle}>Ciclo</th>
                  <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Estado</th>
                  <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {planes.map(plan => (
                  <tr key={plan.id} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-color)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ ...tableCellStyle, fontWeight: 'bold' }}>{plan.name}</td>
                    <td style={{ ...tableCellStyle, fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                      L. {plan.price.toLocaleString()}
                    </td>
                    <td style={tableCellStyle}>{plan.cycle}</td>
                    <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                      <Badge text={plan.active ? "Activo" : "Inactivo"} color={plan.active ? "success" : "warning"} />
                    </td>
                    <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                      <Button variant="outline-dark" size="sm" onClick={() => { setEditingPlan(plan); setIsPlanModalOpen(true); }}>
                        <Edit3 size={14} style={{ marginRight: '6px' }} /> Editar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* PESTAÑA 1: CATÁLOGO DE DRONES (MEJORADA) */}
      {/* ========================================== */}
      {tab === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {drones.map(dron => (
            <div key={dron.id} style={{ 
              backgroundColor: 'var(--white)', 
              border: '1px solid var(--light-gray)', 
              borderRadius: '8px', 
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
            }}>
              {/* Imagen simulada del dron */}
              <div style={{ height: '160px', backgroundColor: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', borderBottom: '1px solid var(--light-gray)' }}>
                <Drone size={64} color="var(--text-light)" opacity={0.4} />
                <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
                   <Badge text={dron.tag} color="primary" />
                </div>
              </div>

              {/* Detalles del dron */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: 'var(--color-dark)' }}>{dron.name}</h3>
                  <ShieldCheck size={20} color="var(--color-primary)" />
                </div>
                
                <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-light)' }}>
                  Equipo profesional listo para operaciones de alta precisión.
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--light-gray)', marginTop: 'auto' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-light)', textTransform: 'uppercase' }}>Precio</span>
                    <span style={{ fontSize: '20px', fontWeight: '900', color: 'var(--color-primary)' }}>L. {dron.price.toLocaleString()}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-light)', textTransform: 'uppercase' }}>Stock</span>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--color-dark)' }}>{dron.stock} uds</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <Button variant="outline-dark" size="sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setEditingDrone(dron); setIsDroneModalOpen(true); }}>
                    <Edit3 size={14} style={{ marginRight: '6px' }} /> Editar
                  </Button>
                  <Button variant="primary" size="sm" style={{ flex: 1, justifyContent: 'center' }}>
                    <ShoppingBag size={14} style={{ marginRight: '6px' }} /> Vender
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: EDITAR/CREAR PLAN */}
      {/* ========================================== */}
      <Modal isOpen={isPlanModalOpen} onClose={() => setIsPlanModalOpen(false)} title={editingPlan?.id ? "Editar Plan de Suscripción" : "Crear Nuevo Plan"}>
        {editingPlan && (
          <form onSubmit={(e) => { e.preventDefault(); setIsPlanModalOpen(false); }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '8px' }}>Nombre del plan</label>
              <Input value={editingPlan.name} onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '8px' }}>Precio (L.)</label>
              <Input type="number" value={editingPlan.price} onChange={e => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })} required />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '8px' }}>
              <Toggle checked={editingPlan.active} onChange={e => setEditingPlan({ ...editingPlan, active: e.target.checked })} />
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-dark)' }}>Habilitar plan en el sistema</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '24px', borderTop: '1px solid var(--light-gray)' }}>
              <Button variant="outline-dark" type="button" onClick={() => setIsPlanModalOpen(false)}>Cancelar</Button>
              <Button variant="primary" type="submit">Guardar plan</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ========================================== */}
      {/* MODAL: EDITAR/CREAR DRON */}
      {/* ========================================== */}
      <Modal isOpen={isDroneModalOpen} onClose={() => setIsDroneModalOpen(false)} title={editingDrone?.id ? "Editar Dron" : "Agregar Nuevo Dron"}>
        {editingDrone && (
          <form onSubmit={(e) => { e.preventDefault(); setIsDroneModalOpen(false); }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '8px' }}>Modelo del Dron</label>
              <Input value={editingDrone.name} onChange={e => setEditingDrone({ ...editingDrone, name: e.target.value })} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '8px' }}>Precio (L.)</label>
                <Input type="number" value={editingDrone.price} onChange={e => setEditingDrone({ ...editingDrone, price: Number(e.target.value) })} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '8px' }}>Stock</label>
                <Input type="number" value={editingDrone.stock} onChange={e => setEditingDrone({ ...editingDrone, stock: Number(e.target.value) })} required />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '8px' }}>Etiqueta (Ej. Fumigación)</label>
              <Input value={editingDrone.tag} onChange={e => setEditingDrone({ ...editingDrone, tag: e.target.value })} required />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '24px', borderTop: '1px solid var(--light-gray)' }}>
              <Button variant="outline-dark" type="button" onClick={() => setIsDroneModalOpen(false)}>Cancelar</Button>
              <Button variant="primary" type="submit">Guardar dron</Button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
}