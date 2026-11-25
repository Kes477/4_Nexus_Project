import React, { useState } from 'react';
import { MapPin, Layers, Settings, Play, Save, Trash2, Crosshair, Navigation, ZoomIn, ZoomOut, ShieldCheck } from 'lucide-react';

import { 
  Button, 
  IconButton, 
  Modal, 
  Toggle, 
  Select, 
  Badge, 
  ProgressBar, 
  Alert, 
  Input,
  SectionHeading
} from '../../components/ui';

export default function AdminOperaciones() {
  const [mappingId, setMappingId] = useState("MIS-FUM-001");
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  
  const [showZones, setShowZones] = useState(true);
  const [showNDVI, setShowNDVI] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  
  const [selectedDrone, setSelectedDrone] = useState("agras_t40");

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      width: '100%', 
      height: '100vh', 
      backgroundColor: 'var(--bg-color)', 
      fontFamily: "'Roboto', sans-serif",
      overflow: 'hidden'
    }}>
      
      <header style={{ 
        backgroundColor: 'var(--white)', 
        borderBottom: '2px solid var(--light-gray)', 
        padding: '0 24px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        height: '72px', 
        flexShrink: 0,
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            padding: '10px', 
            backgroundColor: 'var(--color-primary)', 
            color: 'var(--white)', 
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
             <MapPin size={24} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: 'var(--color-dark)' }}>
              Editor y Aprobador de Mapas
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-light)', fontWeight: '500' }}>
              Consola GIS - Misión: <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>#{mappingId}</span>
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="outline-dark" size="sm"><Trash2 size={16} style={{ marginRight: '6px' }}/> Borrar</Button>
            <Button variant="primary" size="sm"><Save size={16} style={{ marginRight: '6px' }}/> Guardar Mapa</Button>
          </div>
        </div>
      </header>

      <main style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        <aside style={{ 
          width: '300px', 
          backgroundColor: 'var(--white)', 
          borderRight: '1px solid var(--light-gray)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          overflowY: 'auto'
        }}>
          <SectionHeading eyebrow="Edición" title="Herramientas" />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
            <Button variant="primary" style={{ width: '100%', justifyContent: 'flex-start' }}>
              <Crosshair size={18} style={{ marginRight: '10px' }} /> Dibujar Polígono
            </Button>
            <Button variant="outline-dark" style={{ width: '100%', justifyContent: 'flex-start' }}>
              <Navigation size={18} style={{ marginRight: '10px' }} /> Mover Nodos
            </Button>
            <Button variant="outline-dark" style={{ width: '100%', justifyContent: 'flex-start' }}>
              <Trash2 size={18} style={{ marginRight: '10px' }} /> Eliminar Zona
            </Button>
          </div>

          <SectionHeading eyebrow="Visualización" title="Capas del Mapa" />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-dark)' }}>Zonas de Cultivo</span>
              <Toggle checked={showZones} onChange={() => setShowZones(!showZones)} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-dark)' }}>Mapa de Calor NDVI</span>
              <Toggle checked={showNDVI} onChange={() => setShowNDVI(!showNDVI)} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-dark)' }}>Cuadrícula GPS</span>
              <Toggle checked={showGrid} onChange={() => setShowGrid(!showGrid)} />
            </div>
          </div>

          <div style={{ marginTop: 'auto' }}>
            <Alert type="info" title="Modo Edición" message="Haz clic en el mapa para añadir vértices al polígono." />
          </div>
        </aside>

        <section style={{ 
          flex: 1, 
          position: 'relative', 
          backgroundColor: '#0f172a', 
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {showGrid && (
            <div style={{ 
              position: 'absolute', inset: 0, 
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }} />
          )}

          <svg style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
            {showZones && (
              <polygon 
                points="300,200 500,150 650,300 550,500 300,450" 
                fill="rgba(4, 201, 166, 0.2)" 
                stroke="var(--color-primary)" 
                strokeWidth="3" 
                strokeDasharray="8 4"
              />
            )}
            {showNDVI && (
              <circle cx="450" cy="300" r="100" fill="rgba(241, 190, 38, 0.3)" />
            )}
          </svg>

          <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: '32px', fontWeight: '900', pointerEvents: 'none', zIndex: 1 }}>
            VISTA SATELITAL
          </div>

          <div style={{ position: 'absolute', bottom: '24px', right: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <IconButton icon="fa-plus" variant="primary" onClick={() => {}} />
            <IconButton icon="fa-minus" variant="dark" onClick={() => {}} />
          </div>
        </section>

        <aside style={{ 
          width: '340px', 
          backgroundColor: 'var(--white)', 
          borderLeft: '1px solid var(--light-gray)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          overflowY: 'auto'
        }}>
          <SectionHeading eyebrow="Asignación" title="Control del Dron" />

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '8px' }}>
              Seleccionar Dron
            </label>
            <Select 
              options={[
                { value: 'agras_t40', label: 'DJI Agras T40' },
                { value: 'matrice_300', label: 'DJI Matrice 300 RTK' }
              ]}
              value={selectedDrone}
              onChange={(e) => setSelectedDrone(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            <Badge text="GPS: 18 SAT" color="success" />
            <Badge text="RTK Activo" color="info" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-dark)' }}>Batería</span>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-primary)' }}>88%</span>
              </div>
              <ProgressBar current={88} max={100} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-dark)' }}>Tanque Químico</span>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-info)' }}>40L</span>
              </div>
              <ProgressBar current={100} max={100} />
            </div>
          </div>

          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--light-gray)', paddingTop: '24px' }}>
             <Input label="ID de Misión" value={mappingId} onChange={(e) => setMappingId(e.target.value)} />
             
             <Button 
                variant="primary" 
                style={{ width: '100%', marginTop: '16px', padding: '14px', fontSize: '16px' }} 
                onClick={() => setIsApprovalModalOpen(true)}
             >
               <ShieldCheck size={20} style={{ marginRight: '8px' }} />
               Aprobar Mapeo y Vuelo
             </Button>
          </div>
        </aside>

      </main>

      <Modal 
        isOpen={isApprovalModalOpen} 
        onClose={() => setIsApprovalModalOpen(false)} 
        title="Confirmar Aprobación"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p style={{ margin: 0, fontSize: '15px', color: 'var(--color-dark)', lineHeight: '1.5' }}>
            ¿Estás seguro de que deseas aprobar el mapeo para la misión <strong style={{ color: 'var(--color-primary)' }}>#{mappingId}</strong>?
            Una vez aprobado, el dron procederá con la ruta trazada.
          </p>
          
          <Alert 
            type="warning" 
            title="Atención" 
            message="Asegúrate de que las zonas de exclusión aérea (si las hay) estén debidamente marcadas." 
          />
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--light-gray)' }}>
            <Button variant="outline-dark" onClick={() => setIsApprovalModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={() => setIsApprovalModalOpen(false)}>
              Confirmar y Aprobar
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}