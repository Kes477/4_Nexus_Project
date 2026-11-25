import React, { useState } from 'react';
import { Download, Eye, Calendar, MapPin, User, ShieldAlert } from 'lucide-react';

import { Button, SearchBar, Select, Badge, Modal, SectionHeading } from '../../components/ui';

export default function AdminHistorial() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);

  const logs = [
    { id: 'ADM-2026-301', targetModule: 'Módulo de Usuarios', responsible: 'Lic. Claudia Benítez', date: '21 Jul 2026, 08:30 AM', status: 'completed', terminalIp: '192.168.1.45', actionDetails: 'Asignación de privilegios avanzados a nuevos operadores de campo.', securityLevel: 'Alto', duration: '15 min', affectedCount: '12 usuarios' },
    { id: 'ADM-2026-300', targetModule: 'Servidor Central', responsible: 'Ing. Fernando Rivas', date: '21 Jul 2026, 07:15 AM', status: 'completed', terminalIp: '192.168.1.12', actionDetails: 'Modificación de umbrales de alerta por ráfagas de viento y protocolos RTH.', securityLevel: 'Crítico', duration: '45 min', affectedCount: '4 servidores' },
    { id: 'ADM-2026-299', targetModule: 'Subsistema de Respaldo', responsible: 'Lic. Claudia Benítez', date: '20 Jul 2026, 04:00 PM', status: 'interrupted', terminalIp: '192.168.1.45', actionDetails: 'Verificación de integridad y cifrado de los respaldos semanales.', securityLevel: 'Medio', duration: '30 min', affectedCount: '1 base de datos' },
    { id: 'ADM-2026-298', targetModule: 'Control de Acceso', responsible: 'Lic. Patricia Solís', date: '20 Jul 2026, 11:00 AM', status: 'completed', terminalIp: '192.168.1.88', actionDetails: 'Baja administrativa por término de contrato temporal de pilotaje.', securityLevel: 'Alto', duration: '10 min', affectedCount: '3 usuarios' },
    { id: 'ADM-2026-297', targetModule: 'Pasarela RTK', responsible: 'Ing. Fernando Rivas', date: '19 Jul 2026, 02:00 PM', status: 'failed', terminalIp: '192.168.1.12', actionDetails: 'Cambio de proveedor de enlaces móviles principales por redundancia.', securityLevel: 'Crítico', duration: '75 min', affectedCount: '8 dispositivos' },
    { id: 'ADM-2026-296', targetModule: 'Firewall Perimetral', responsible: 'Lic. Claudia Benítez', date: '18 Jul 2026, 09:00 AM', status: 'completed', terminalIp: '192.168.1.45', actionDetails: 'Inspección de intentos de acceso fallidos desde redes externas.', securityLevel: 'Medio', duration: '50 min', affectedCount: 'Todos los nodos' },
  ];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.targetModule.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.responsible.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    if (status === 'completed') return <Badge text="Completado" color="success" />;
    if (status === 'interrupted') return <Badge text="Pausado" color="warning" />;
    return <Badge text="Abortado" color="danger" />;
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
      minHeight: '100vh', 
      padding: '32px 48px', 
      boxSizing: 'border-box',
      backgroundColor: 'var(--bg-color)',
      color: 'var(--color-dark)',
      fontFamily: "'Roboto', sans-serif"
    }}>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px', marginBottom: '32px', paddingBottom: '20px', borderBottom: '1px solid var(--light-gray)' }}>
        <SectionHeading 
          eyebrow="Auditoría" 
          title="Panel de Control y Bitácora" 
          description="Registro detallado de cambios de configuración y auditorías de seguridad."
        />
        <div style={{ paddingBottom: '30px' }}>
           <Badge text={`${logs.length} registros totales`} color="primary" />
        </div>
        <Button variant="primary" style={{ marginBottom: '30px' }}>
          <Download size={18} style={{ marginRight: '8px' }}/> Exportar Bitácora (CSV)
        </Button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px', backgroundColor: 'var(--white)', padding: '16px', borderRadius: '8px', border: '1px solid var(--light-gray)' }}>
        <div style={{ flex: 1, minWidth: '250px', maxWidth: '400px' }}>
          <SearchBar 
            placeholder="Buscar por ID, módulo o responsable..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Select 
            options={[
              { value: "all", label: "Todos los estados" }, 
              { value: "completed", label: "Completados" },
              { value: "interrupted", label: "Pausados" },
              { value: "failed", label: "Abortados" }
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
                <th style={tableHeaderStyle}>Módulo Afectado</th>
                <th style={tableHeaderStyle}>Responsable</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Estado</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map(log => (
                  <tr 
                    key={log.id} 
                    style={{ transition: 'background-color 0.2s', cursor: 'pointer' }} 
                    onClick={() => setSelectedLog(log)}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-color)'} 
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={tableCellStyle}>
                      <div style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{log.id}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <Calendar size={12} /> {log.date}
                      </div>
                    </td>
                    <td style={{ ...tableCellStyle, fontWeight: 'bold' }}>{log.targetModule}</td>
                    <td style={tableCellStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={14} color="var(--text-light)" /> {log.responsible}
                      </div>
                    </td>
                    <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                      {getStatusBadge(log.status)}
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
                    No se encontraron registros con los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} title={`Detalle de Bitácora: ${selectedLog?.id}`}>
        {selectedLog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '14px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px', backgroundColor: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--light-gray)' }}>
              <div>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Terminal IP
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                  <MapPin size={16} color="var(--color-primary)" /> {selectedLog.terminalIp}
                </span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Responsable
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                  <User size={16} color="var(--color-primary)" /> {selectedLog.responsible}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '12px', backgroundColor: 'var(--bg-color)', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--light-gray)' }}>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-light)' }}>Duración</span>
                <span style={{ fontWeight: 'bold', color: 'var(--color-dark)' }}>{selectedLog.duration}</span>
              </div>
              <div style={{ padding: '12px', backgroundColor: 'var(--bg-color)', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--light-gray)' }}>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-light)' }}>Alcance</span>
                <span style={{ fontWeight: 'bold', color: 'var(--color-dark)' }}>{selectedLog.affectedCount}</span>
              </div>
              <div style={{ padding: '12px', backgroundColor: 'var(--bg-color)', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--light-gray)' }}>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-light)' }}>Seguridad</span>
                <span style={{ fontWeight: 'bold', color: 'var(--color-danger)' }}>{selectedLog.securityLevel}</span>
              </div>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'rgba(45, 210, 246, 0.05)', border: '1px solid var(--color-info)', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 'bold', color: 'var(--color-info)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldAlert size={16} /> Acción Ejecutada en {selectedLog.targetModule}
              </h4>
              <p style={{ margin: 0, color: 'var(--color-dark)', lineHeight: '1.5' }}>
                {selectedLog.actionDetails}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--light-gray)', marginTop: '8px' }}>
              <Button variant="primary" onClick={() => setSelectedLog(null)}>
                Cerrar Bitácora
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}