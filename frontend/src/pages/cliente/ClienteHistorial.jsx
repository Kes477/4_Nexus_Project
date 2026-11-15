import React, { useState } from 'react';
import { Download, Eye, Calendar, MapPin, User, Drone, Activity, FileText } from 'lucide-react';

import { Button, SearchBar, Select, Badge, Modal, SectionHeading } from '../../components/ui';

export default function ClienteHistorial() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedService, setSelectedService] = useState(null);

  const services = [
    { id: 'SRV-2026-015', type: 'Fumigación de Precisión', pilot: 'Javier Reyes', date: '21 Jul 2026, 08:30 AM', status: 'completed', location: 'Parcela 3 - Finca El Valle', details: 'Aplicación de pesticida orgánico. Se completaron las 12 hectáreas sin incidencias. El dron Agras T40 operó con batería al 100% y retornó a base según lo previsto.', quality: 'Excelente', duration: '45 min', areaCovered: '12 Hectáreas' },
    { id: 'SRV-2026-014', type: 'Mapeo Multiespectral NDVI', pilot: 'María Gómez', date: '18 Jul 2026, 09:15 AM', status: 'completed', location: 'Sector Norte - Finca El Valle', details: 'Vuelo de levantamiento topográfico para análisis de salud del cultivo. Se generaron mapas de calor y se detectaron 2 zonas con estrés hídrico en el sector noreste.', quality: 'Excelente', duration: '30 min', areaCovered: '8 Hectáreas' },
    { id: 'SRV-2026-013', type: 'Riego Focalizado', pilot: 'Roberto Varela', date: '15 Jul 2026, 04:00 PM', status: 'interrupted', location: 'Parcela 1 - Finca El Valle', details: 'Servicio pausado temporalmente por ráfagas de viento superiores a 25 km/h. Se completó el 60% del área programada. El piloto coordinó reprogramación para el día siguiente.', quality: 'Buena', duration: '20 min', areaCovered: '5 Hectáreas' },
    { id: 'SRV-2026-012', type: 'Transporte de Insumos', pilot: 'Sofía Reyes', date: '10 Jul 2026, 11:00 AM', status: 'completed', location: 'Bodega Central a Parcela 4', details: 'Entrega exitosa de 15 kg de semillas certificadas utilizando el dron de carga pesada. Tiempo de entrega récord de 5 minutos frente a los 45 minutos en vehículo terrestre.', quality: 'Excelente', duration: '15 min', areaCovered: '15 kg / 2 cajas' },
    { id: 'SRV-2026-011', type: 'Fumigación de Precisión', pilot: 'Carlos Mendoza', date: '05 Jul 2026, 07:00 AM', status: 'failed', location: 'Parcela 2 - Finca El Valle', details: 'Servicio cancelado por falla en el sensor de flujo del dron. El equipo técnico está realizando el mantenimiento correctivo. No se generaron cargos por este vuelo.', quality: 'N/A', duration: '0 min', areaCovered: '0 Hectáreas' },
    { id: 'SRV-2026-010', type: 'Mapeo Topográfico 3D', pilot: 'María Gómez', date: '28 Jun 2026, 10:30 AM', status: 'completed', location: 'Límites de la Finca', details: 'Generación de modelo digital de elevación y ortomosaico de toda la finca. Excelente precisión RTK con 18 satélites conectados. Archivos entregados en la plataforma web.', quality: 'Excelente', duration: '90 min', areaCovered: '50 Hectáreas' },
  ];

  const filteredServices = services.filter(srv => {
    const matchesSearch = 
      srv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      srv.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      srv.pilot.toLowerCase().includes(searchQuery.toLowerCase()) ||
      srv.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || srv.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    if (status === 'completed') return <Badge text="Completado" color="success" />;
    if (status === 'interrupted') return <Badge text="Pausado" color="warning" />;
    return <Badge text="Cancelado" color="danger" />;
  };

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
      padding: '20px 0',
      boxSizing: 'border-box',
      backgroundColor: 'transparent',
      color: 'var(--color-dark)',
      fontFamily: "'Roboto', sans-serif"
    }}>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px', marginBottom: '32px', paddingBottom: '20px', borderBottom: '1px solid var(--light-gray)' }}>
        <SectionHeading 
          eyebrow="Historial" 
          title="Mis Servicios y Vuelos" 
          description="Registro detallado de todas las operaciones realizadas en tus cultivos."
        />
        <div style={{ paddingBottom: '30px' }}>
           <Badge text={`${services.length} servicios realizados`} color="primary" />
        </div>
        <Button variant="primary" style={{ marginBottom: '30px' }}>
          <Download size={18} style={{ marginRight: '8px' }}/> Exportar Historial (PDF)
        </Button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px', backgroundColor: 'var(--white)', padding: '16px', borderRadius: '8px', border: '1px solid var(--light-gray)' }}>
        <div style={{ flex: 1, minWidth: '250px', maxWidth: '400px' }}>
          <SearchBar 
            placeholder="Buscar por servicio, piloto o ubicación..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Select 
            options={[
              { value: "all", label: "Todos los servicios" }, 
              { value: "completed", label: "Completados" },
              { value: "interrupted", label: "Pausados" },
              { value: "failed", label: "Cancelados" }
            ]} 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--white)', border: '1px solid var(--light-gray)', borderRadius: '8px', overflow: 'hidden', width: '100%', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>ID / Fecha</th>
                <th style={tableHeaderStyle}>Servicio / Piloto</th>
                <th style={tableHeaderStyle}>Ubicación</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Estado</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.length > 0 ? (
                filteredServices.map(srv => (
                  <tr 
                    key={srv.id} 
                    style={{ transition: 'background-color 0.2s', cursor: 'pointer' }} 
                    onClick={() => setSelectedService(srv)}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-color)'} 
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={tableCellStyle}>
                      <div style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{srv.id}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <Calendar size={12} /> {srv.date}
                      </div>
                    </td>
                    <td style={tableCellStyle}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{srv.type}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={12} /> Piloto: {srv.pilot}
                      </div>
                    </td>
                    <td style={tableCellStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-dark)' }}>
                        <MapPin size={14} color="var(--text-light)" /> {srv.location}
                      </div>
                    </td>
                    <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                      {getStatusBadge(srv.status)}
                    </td>
                    <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                      <Button variant="outline-dark" size="sm">
                        <Eye size={14} style={{ marginRight: '6px' }} /> Ver Detalle
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-light)' }}>
                    No se encontraron servicios con los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={!!selectedService} onClose={() => setSelectedService(null)} title={`Detalle del Servicio: ${selectedService?.id}`}>
        {selectedService && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '14px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px', backgroundColor: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--light-gray)' }}>
              <div>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Ubicación
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                  <MapPin size={16} color="var(--color-primary)" /> {selectedService.location}
                </span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Piloto Asignado
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                  <User size={16} color="var(--color-primary)" /> {selectedService.pilot}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '12px', backgroundColor: 'var(--bg-color)', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--light-gray)' }}>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-light)' }}>Duración</span>
                <span style={{ fontWeight: 'bold', color: 'var(--color-dark)' }}>{selectedService.duration}</span>
              </div>
              <div style={{ padding: '12px', backgroundColor: 'var(--bg-color)', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--light-gray)' }}>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-light)' }}>Área / Cantidad</span>
                <span style={{ fontWeight: 'bold', color: 'var(--color-dark)' }}>{selectedService.areaCovered}</span>
              </div>
              <div style={{ padding: '12px', backgroundColor: 'var(--bg-color)', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--light-gray)' }}>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-light)' }}>Calidad</span>
                <span style={{ fontWeight: 'bold', color: selectedService.quality === 'Excelente' ? 'var(--color-success)' : 'var(--color-dark)' }}>{selectedService.quality}</span>
              </div>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'rgba(45, 210, 246, 0.05)', border: '1px solid var(--color-info)', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 'bold', color: 'var(--color-info)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={16} /> Reporte del Vuelo - {selectedService.type}
              </h4>
              <p style={{ margin: 0, color: 'var(--color-dark)', lineHeight: '1.5' }}>
                {selectedService.details}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--light-gray)', marginTop: '8px' }}>
              <Button variant="outline-dark" onClick={() => setSelectedService(null)}>
                Cerrar Ventana
              </Button>
              <Button variant="primary">
                <FileText size={16} style={{ marginRight: '8px' }}/> Descargar Reporte PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}