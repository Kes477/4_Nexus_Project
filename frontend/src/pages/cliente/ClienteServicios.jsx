import React, { useState } from 'react';
import { 
  Activity, ArrowRight, ArrowLeft, CheckCircle2, MapPin, Calendar, 
  ClipboardCopy, Pencil, Download, Share2, Trash2, Save, Check 
} from 'lucide-react';

import { 
  Button, 
  Input, 
  Select, 
  Modal, 
  Badge, 
  Tabs, 
  Stepper, 
  Checkbox, 
  SectionHeading 
} from '../../components/ui';

export default function ClienteServicios() {
  const [activeTab, setActiveTab] = useState(0);

  const [step, setStep] = useState(1);
  const [requestSuccess, setRequestSuccess] = useState(false);

  const [servicios] = useState([
    {
      id: 1,
      title: "Mapeo Topográfico Sector Sur",
      type: "Dron con mapeo",
      location: "Finca El Aguán, Sabana de Tepusteca",
      status: "Completado",
      date: "18 Jul 2026",
      notes: "Vuelo exitoso. Se entregó ortomosaico al administrador. Desnivel del 5% detectado.",
      missionId: "MIS-MAP-001"
    },
    {
      id: 2,
      title: "Fumigación de Precisión",
      type: "Dron agrícola",
      location: "Plantación San Lorenzo",
      status: "En marcha",
      date: "12 Jul 2026",
      notes: "El piloto está en campo ejecutando la ruta de fumigación.",
      missionId: "MIS-FUM-012"
    },
    {
      id: 3,
      title: "Inspección de Infraestructura",
      type: "Inspección visual",
      location: "Bodega Central, Olanchito",
      status: "Aprobado",
      date: "05 Jul 2026",
      notes: "Solicitud validada por admin. A la espera de asignación de dron de inspección.",
      missionId: null
    },
    {
      id: 4,
      title: "Análisis Multiespectral NDVI",
      type: "Dron con mapeo",
      location: "Finca Agalteca",
      status: "En revisión",
      date: "19 Jul 2026",
      notes: "El administrador está revisando la disponibilidad de la unidad multiespectral.",
      missionId: "MIS-MAP-005"
    },
  ]);

  const [formData, setFormData] = useState({
    serviceTitle: "Fumigación de precisión",
    serviceType: "General",
    location: "Finca El Aguán (Sabana de Tepusteca)",
    date: "2026-07-28",
    missionId: "",
  });

  const getStatusBadge = (status) => {
    if (status === "Completado") return <Badge text={status} color="success" />;
    if (status === "En marcha") return <Badge text={status} color="primary" />;
    if (status === "Aprobado") return <Badge text={status} color="info" />;
    if (status === "En revisión") return <Badge text={status} color="warning" />;
    return <Badge text={status} color="dark" />;
  };

  const [selectedTool, setSelectedTool] = useState("polygon");
  const [showZones, setShowZones] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showBoundaries, setShowBoundaries] = useState(true);
  const [altitude, setAltitude] = useState(45);
  const [speed, setSpeed] = useState(20);
  const [rate, setRate] = useState(2.5);
  const [mappingId, setMappingId] = useState("MIS-FUM-001");
  const [tempMappingId, setTempMappingId] = useState("MIS-FUM-001");
  
  const [isIdModalOpen, setIsIdModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isCopySuccessModalOpen, setIsCopySuccessModalOpen] = useState(false);

  const handleCopyExistingMission = (id) => {
    navigator.clipboard.writeText(id);
    setIsCopySuccessModalOpen(true);
  };

  const handleCopyMapId = () => {
    navigator.clipboard.writeText(mappingId);
    setIsCopySuccessModalOpen(true);
  };

  const handleSaveId = (e) => {
    e.preventDefault();
    if (tempMappingId.trim()) setMappingId(tempMappingId.trim().toUpperCase());
    setIsIdModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', minHeight: '100vh', backgroundColor: 'var(--bg-color)', fontFamily: "'Roboto', sans-serif", overflow: 'hidden' }}>
      
      <div style={{ backgroundColor: 'var(--white)', borderBottom: '1px solid var(--light-gray)', padding: '0 32px', zIndex: 10 }}>
        <Tabs 
          tabs={[
            <><Activity size={18} style={{ marginRight: '8px' }} /> Mis Servicios</>,
            <><Pencil size={18} style={{ marginRight: '8px' }} /> Editor de Mapas</>
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {activeTab === 0 && (
        <div style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
          
          <div style={{ backgroundColor: 'var(--white)', padding: '24px', borderRadius: '8px', border: '1px solid var(--light-gray)' }}>
            <SectionHeading 
              eyebrow="Panel de Control" 
              title="Mis Servicios" 
              description="Gestiona tus solicitudes, monitorea las fichas técnicas y el estado de cada servicio." 
            />
          </div>

          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {servicios.map(srv => (
                <div key={srv.id} style={{ backgroundColor: 'var(--white)', border: '1px solid var(--light-gray)', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  
                  <div style={{ height: '80px', backgroundColor: 'var(--color-dark)', position: 'relative', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>{srv.type}</span>
                    <h3 style={{ margin: '4px 0 0 0', fontSize: '16px', color: 'var(--white)', fontWeight: 'bold' }}>{srv.title}</h3>
                    <div style={{ position: 'absolute', top: '12px', right: '12px' }}>{getStatusBadge(srv.status)}</div>
                  </div>

                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-light)' }}>
                      <MapPin size={16} color="var(--color-primary)" /> <span>{srv.location}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-dark)', backgroundColor: 'var(--bg-color)', padding: '12px', borderRadius: '4px', border: '1px solid var(--light-gray)' }}>
                      {srv.notes}
                    </p>
                    
                    <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--light-gray)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Fecha</span>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {srv.date}</span>
                      </div>
                      {srv.missionId && (
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase' }}>ID Misión</span>
                          <Button variant="outline-dark" size="sm" onClick={() => handleCopyExistingMission(srv.missionId)} style={{ padding: '4px 8px' }}>
                            {srv.missionId} <ClipboardCopy size={14} style={{ marginLeft: '4px' }} />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ width: '360px', flexShrink: 0, backgroundColor: 'var(--white)', border: '1px solid var(--light-gray)', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid var(--light-gray)', backgroundColor: 'var(--bg-color)' }}>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'var(--color-dark)' }}>Solicitar Servicio</h2>
                
                <div style={{ marginTop: '16px' }}>
                  <Stepper 
                    steps={['Detalles', 'Mapeo', 'Revisión']} 
                    currentStep={step - 1} 
                  />
                </div>
              </div>

              <div style={{ padding: '20px', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                {requestSuccess ? (
                  <div style={{ textAlign: 'center', margin: 'auto' }}>
                    <CheckCircle2 size={48} color="var(--color-success)" style={{ margin: '0 auto 16px' }} />
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: 'var(--color-dark)' }}>Solicitud Enviada</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-light)', marginBottom: '16px' }}>El servicio para <strong>{formData.location}</strong> ha sido enviado al administrador.</p>
                    <Button variant="outline-dark" onClick={() => { setStep(1); setRequestSuccess(false); }}>Nueva solicitud</Button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                    
                    {step === 1 && (
                      <>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '6px' }}>Título del servicio</label>
                          <Input value={formData.serviceTitle} onChange={e => setFormData({ ...formData, serviceTitle: e.target.value })} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '6px' }}>Tipo de servicio</label>
                          <Select 
                            options={[{ value: "General", label: "General" }, { value: "Dron Agrícola", label: "Dron Agrícola" }, { value: "Dron con Mapeo", label: "Dron con Mapeo" }]} 
                            value={formData.serviceType} 
                            onChange={e => setFormData({ ...formData, serviceType: e.target.value })} 
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '6px' }}>Ubicación</label>
                          <Input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                        </div>
                        <Button variant="primary" onClick={() => setStep(2)} style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          Siguiente <ArrowRight size={16} />
                        </Button>
                      </>
                    )}

                    {step === 2 && (
                      <>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '6px' }}>Fecha de operación</label>
                          <Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                        </div>
                        {formData.serviceType === "Dron con Mapeo" && (
                          <div style={{ padding: '12px', backgroundColor: 'rgba(45, 210, 246, 0.1)', border: '1px solid var(--color-info)', borderRadius: '8px', textAlign: 'left' }}>
                            <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--color-info)', fontWeight: 'bold' }}>Mapeo obligatorio</p>
                            <Button variant="primary" size="sm" onClick={() => setActiveTab(1)} style={{ width: '100%', marginBottom: '8px' }}>Ir al Editor de Mapas</Button>
                            <Input placeholder="Pegar ID de misión aquí" value={formData.missionId} onChange={e => setFormData({ ...formData, missionId: e.target.value })} />
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                          <Button variant="outline-dark" onClick={() => setStep(1)} style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            <ArrowLeft size={16} /> Atrás
                          </Button>
                          <Button variant="primary" onClick={() => setStep(3)} style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            Revisar <ArrowRight size={16} />
                          </Button>
                        </div>
                      </>
                    )}

                    {step === 3 && (
                      <>
                        <div style={{ backgroundColor: 'var(--bg-color)', padding: '16px', borderRadius: '8px', border: '1px solid var(--light-gray)' }}>
                          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--color-dark)' }}>Resumen</h4>
                          <p style={{ margin: '0 0 4px 0', fontSize: '13px' }}><strong>Servicio:</strong> {formData.serviceTitle}</p>
                          <p style={{ margin: '0 0 4px 0', fontSize: '13px' }}><strong>Tipo:</strong> {formData.serviceType}</p>
                          <p style={{ margin: '0 0 4px 0', fontSize: '13px' }}><strong>Fecha:</strong> {formData.date}</p>
                          <p style={{ margin: 0, fontSize: '13px' }}><strong>Lugar:</strong> {formData.location}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                          <Button variant="outline-dark" onClick={() => setStep(2)} style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            <ArrowLeft size={16} /> Atrás
                          </Button>
                          <Button variant="primary" onClick={() => setRequestSuccess(true)} style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            <Check size={16} /> Enviar
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--white)' }}>
          
          <header style={{ backgroundColor: 'var(--bg-color)', borderBottom: '1px solid var(--light-gray)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '8px', backgroundColor: 'var(--color-primary)', color: 'var(--white)', borderRadius: '6px' }}>
                <MapPin size={18} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--color-dark)' }}>Editor de Mapas</h2>
                <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>Configura zonas y parámetros.</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="outline-dark" size="sm"><Download size={14} style={{ marginRight: '4px' }}/> Exportar</Button>
              <Button variant="outline-dark" size="sm"><Share2 size={14} style={{ marginRight: '4px' }}/> Compartir</Button>
              <Button variant="primary" size="sm"><Save size={14} style={{ marginRight: '4px' }}/> Guardar Mapa</Button>
            </div>
          </header>

          <main style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            
            <aside style={{ width: '260px', backgroundColor: 'var(--white)', borderRight: '1px solid var(--light-gray)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '12px', backgroundColor: 'var(--bg-color)', border: '1px solid var(--light-gray)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div onClick={() => setIsIdModalOpen(true)} style={{ cursor: 'pointer' }}>
                    <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-light)', textTransform: 'uppercase' }}>ID Misión</span>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-primary)' }}>#{mappingId}</span>
                  </div>
                  <Button variant="outline-dark" size="sm" onClick={handleCopyMapId} style={{ padding: '6px' }}>
                    <ClipboardCopy size={14} />
                  </Button>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Herramientas</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Button variant={selectedTool === 'polygon' ? 'primary' : 'outline-dark'} size="sm" onClick={() => setSelectedTool('polygon')} style={{ justifyContent: 'flex-start' }}>Dibujar Polígono</Button>
                    <Button variant={selectedTool === 'move' ? 'primary' : 'outline-dark'} size="sm" onClick={() => setSelectedTool('move')} style={{ justifyContent: 'flex-start' }}>Mover Nodos</Button>
                    <Button variant={selectedTool === 'delete' ? 'danger' : 'outline-dark'} size="sm" onClick={() => setSelectedTool('delete')} style={{ justifyContent: 'flex-start' }}><Trash2 size={14} style={{ marginRight: '6px' }}/> Eliminar Zona</Button>
                  </div>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Capas</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Checkbox label="Zonas" checked={showZones} onChange={() => setShowZones(!showZones)} />
                    <Checkbox label="Mapa NDVI" checked={showHeatmap} onChange={() => setShowHeatmap(!showHeatmap)} />
                    <Checkbox label="Límites" checked={showBoundaries} onChange={() => setShowBoundaries(!showBoundaries)} />
                  </div>
                </div>
              </div>
            </aside>

            <div style={{ flex: 1, backgroundColor: '#1e293b', position: 'relative', overflow: 'hidden' }}>
              <svg style={{ width: '100%', height: '100%', position: 'absolute' }}>
                {showZones && (
                  <>
                    <polygon points="300,150 500,100 650,250 550,450 300,400" fill="rgba(4, 201, 166, 0.3)" stroke="var(--color-primary)" strokeWidth="2" strokeDasharray="4 4" />
                    <polygon points="650,250 800,200 850,350 700,450 550,450" fill="rgba(241, 190, 38, 0.3)" stroke="var(--color-warning)" strokeWidth="2" strokeDasharray="4 4" />
                  </>
                )}
              </svg>
              <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Button variant="outline-dark" size="sm" style={{ padding: '8px 12px', backgroundColor: 'var(--white)' }}>+</Button>
                <Button variant="outline-dark" size="sm" style={{ padding: '8px 12px', backgroundColor: 'var(--white)' }}>-</Button>
              </div>
            </div>

            <aside style={{ width: '300px', backgroundColor: 'var(--white)', borderLeft: '1px solid var(--light-gray)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-color)', border: '1px solid var(--light-gray)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-dark)' }}>Dron Agras T50</span>
                  <Badge text="En línea" color="success" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', color: 'var(--text-light)' }}>
                  <span>Batería: 88%</span>
                  <span>GPS: 19 satélites</span>
                  <span>Velocidad: {speed} km/h</span>
                  <span>Altitud: {altitude} m</span>
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Parámetros de Vuelo</h4>
                
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                    <span>Altitud</span><span style={{ color: 'var(--color-warning)' }}>{altitude} m</span>
                  </div>
                  <input type="range" min="10" max="100" value={altitude} onChange={e => setAltitude(Number(e.target.value))} style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--color-primary)' }} />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                    <span>Velocidad</span><span style={{ color: 'var(--color-info)' }}>{speed} km/h</span>
                  </div>
                  <input type="range" min="5" max="40" value={speed} onChange={e => setSpeed(Number(e.target.value))} style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--color-info)' }} />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                    <span>Dosis Química</span><span style={{ color: '#B165E0' }}>{rate} L/ha</span>
                  </div>
                  <input type="range" min="0.5" max="10" step="0.5" value={rate} onChange={e => setRate(Number(e.target.value))} style={{ width: '100%', cursor: 'pointer', accentColor: '#B165E0' }} />
                </div>
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Button variant="primary" onClick={() => setIsApprovalModalOpen(true)} style={{ width: '100%' }}>Enviar edición</Button>
                <Button variant="outline-dark" style={{ width: '100%' }}>Auto-dibujar zona</Button>
                <Button variant="danger" style={{ width: '100%' }}>Cancelar edición</Button>
              </div>
            </aside>
          </main>
        </div>
      )}

      <Modal isOpen={isCopySuccessModalOpen} onClose={() => setIsCopySuccessModalOpen(false)} title="¡ID Copiado!">
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <CheckCircle2 size={48} color="var(--color-success)" style={{ margin: '0 auto 16px' }} />
          <p style={{ fontSize: '14px', color: 'var(--text-light)', marginBottom: '24px' }}>El ID se ha guardado en el portapapeles. Puedes pegarlo en el formulario de la pestaña <strong>Mis Servicios</strong>.</p>
          <Button variant="primary" onClick={() => setIsCopySuccessModalOpen(false)}>Entendido</Button>
        </div>
      </Modal>

      <Modal isOpen={isIdModalOpen} onClose={() => setIsIdModalOpen(false)} title="Cambiar ID de Misión">
        <form onSubmit={handleSaveId} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '6px' }}>Código / ID de la misión</label>
            <Input value={tempMappingId} onChange={e => setTempMappingId(e.target.value)} placeholder="Ej. MIS-FUM-001" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <Button variant="outline-dark" type="button" onClick={() => setIsIdModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" type="submit">Guardar ID</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isApprovalModalOpen} onClose={() => setIsApprovalModalOpen(false)} title="Mapeo Enviado a Revisión">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-light)' }}>La edición del mapa para la misión <strong>#{mappingId}</strong> ha sido enviada exitosamente a uno de los administradores.</p>
          <div style={{ padding: '12px', backgroundColor: 'rgba(241, 190, 38, 0.1)', border: '1px solid var(--color-warning)', borderRadius: '8px', fontSize: '13px', color: 'var(--color-warning)', fontWeight: 'bold' }}>
            Estado: En espera de ser aprobada por el administrador.
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <Button variant="primary" onClick={() => setIsApprovalModalOpen(false)}>Entendido</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}