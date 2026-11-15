import React, { useState } from 'react';
import { Users, ShieldCheck, Wrench, Eye, MapPin, Calendar, Mail, Phone } from 'lucide-react';

// Importación estricta de tus componentes UI
import { Button, SearchBar, Select, Badge, Modal, Tabs } from '../../components/ui';

export default function AdminUsuarios() {
  // Cambiamos activeTab a un índice numérico (0, 1, 2) porque tu componente Tabs lo requiere así
  const [activeTab, setActiveTab] = useState(0); 
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState(null);

  const tabNames = ["Clientes", "Pilotos", "Técnicos"];

  const [clients] = useState([
    { id: "CL-101", init: "CV", name: "Comercializadora El Valle", companyOrDept: "Sector agrícola", loc: "Danlí, El Paraíso", email: "contacto@elvalle.hn", phone: "+504 9876-5432", status: "Activo", joinDate: "12/01/2024" },
    { id: "CL-102", init: "FA", name: "Finca El Agualote", companyOrDept: "Producción cafetalera", loc: "San Esteban, Olancho", email: "finca_agualote@gmail.com", phone: "+504 8811-2233", status: "Activo", joinDate: "05/03/2024" },
    { id: "CL-103", init: "AG", name: "Agropecuaria Yoro", companyOrDept: "Cultivos de palma", loc: "El Progreso, Yoro", email: "operaciones@agroyoro.hn", phone: "+504 3344-5566", status: "Inactivo", joinDate: "18/08/2023" },
    { id: "CL-104", init: "HN", name: "Hacienda Nueva Esperanza", companyOrDept: "Ganadería y forraje", loc: "Juticalpa, Olancho", email: "admin@nesperanza.hn", phone: "+504 9900-1122", status: "Pendiente", joinDate: "20/07/2026" },
  ]);

  const [pilots] = useState([
    { id: "PL-201", init: "JR", name: "Javier Reyes", companyOrDept: "Licencia AHAC A-492", loc: "Catacamas, Olancho", email: "javier.reyes@4nexus.hn", phone: "+504 9788-4411", status: "Activo", joinDate: "10/02/2023" },
    { id: "PL-202", init: "MG", name: "María Gómez", companyOrDept: "Licencia AHAC A-501", loc: "Comayagua", email: "maria.gomez@4nexus.hn", phone: "+504 8765-4321", status: "Activo", joinDate: "15/11/2023" },
    { id: "PL-203", init: "HR", name: "Héctor Ramírez", companyOrDept: "Licencia AHAC A-388", loc: "Choluteca", email: "hector.ramirez@4nexus.hn", phone: "+504 9123-8899", status: "Inactivo", joinDate: "01/06/2022" },
  ]);

  const [techs] = useState([
    { id: "TC-301", init: "LN", name: "Luis Navarro", companyOrDept: "Sistemas eléctricos", loc: "Tegucigalpa", email: "luis.navarro@4nexus.hn", phone: "+504 9455-6677", status: "Activo", joinDate: "14/01/2022" },
    { id: "TC-302", init: "RE", name: "Roberto Escalante", companyOrDept: "Mecánica estructural", loc: "San Pedro Sula", email: "roberto.e@4nexus.hn", phone: "+504 8899-0011", status: "Activo", joinDate: "09/05/2023" },
  ]);

  const getFilteredData = (dataset) => {
    return dataset.filter(item => {
      const matchesText = (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      return matchesText && matchesStatus;
    });
  };

  // Seleccionamos el dataset según el índice de la pestaña
  const currentData = activeTab === 0 ? clients : activeTab === 1 ? pilots : techs;

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px', paddingBottom: '20px', borderBottom: '1px solid var(--light-gray)' }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: 'var(--color-dark)' }}>Panel de Control e Inspección Operativa</h1>
        <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-light)', fontWeight: '500' }}>Valida cuentas de clientes, certificaciones de pilotos, técnicos y aprueba reservas.</p>
      </div>

      {/* COMPONENTE TABS DE TU KIT UI */}
      <div style={{ marginBottom: '24px' }}>
        <Tabs 
          tabs={[
            `Clientes (${clients.length})`, 
            `Pilotos (${pilots.length})`, 
            `Técnicos (${techs.length})`
          ]} 
          activeTab={activeTab} 
          onChange={setActiveTab} 
        />
      </div>

      {/* FILTROS Y BÚSQUEDA (Componentes de tu Kit UI) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div style={{ flex: 1, minWidth: '250px', maxWidth: '400px' }}>
          <SearchBar 
            placeholder="Buscar por nombre o empresa..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Select 
            options={[
              {value: "ALL", label: "Todos los estados"}, 
              {value: "Activo", label: "Activos"}, 
              {value: "Inactivo", label: "Inactivos"},
              {value: "Pendiente", label: "Pendientes"}
            ]} 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
          />
        </div>
      </div>

      {/* TABLA DE DATOS */}
      <div style={{ backgroundColor: 'var(--white)', border: '1px solid var(--light-gray)', borderRadius: '8px', overflow: 'hidden', width: '100%', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Usuario o empresa</th>
                <th style={tableHeaderStyle}>Sector / Licencia</th>
                <th style={tableHeaderStyle}>Ubicación</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Estado</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredData(currentData).map(item => (
                <tr key={item.id} style={{ transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-color)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={tableCellStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '36px', height: '36px', 
                        borderRadius: '8px', 
                        backgroundColor: 'rgba(4, 201, 166, 0.1)', 
                        color: 'var(--color-primary)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        fontWeight: 'bold', fontSize: '14px', flexShrink: 0,
                        border: '1px solid rgba(4, 201, 166, 0.2)'
                      }}>
                        {item.init}
                      </div>
                      <div>
                        <span style={{ display: 'block', fontWeight: 'bold', color: 'var(--color-dark)' }}>{item.name}</span>
                        <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-light)' }}>{item.id}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ ...tableCellStyle, fontWeight: '500' }}>{item.companyOrDept}</td>
                  <td style={{ ...tableCellStyle, color: 'var(--text-light)' }}>{item.loc}</td>
                  <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                    {/* Componente Badge de tu Kit UI */}
                    <Badge text={item.status} color={item.status === "Activo" ? "success" : item.status === "Pendiente" ? "info" : "warning"} />
                  </td>
                  <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                    {/* Componente Button de tu Kit UI */}
                    <Button variant="outline-dark" size="sm" onClick={() => setSelectedUser(item)}>
                      <Eye size={14} style={{ marginRight: '6px' }} /> Ver
                    </Button>
                  </td>
                </tr>
              ))}
              {getFilteredData(currentData).length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-light)' }}>
                    No se encontraron resultados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE DETALLE (Componente de tu Kit UI) */}
      <Modal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title="Ficha de Registro Operativo">
        {selectedUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--light-gray)', paddingBottom: '16px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: 'var(--color-dark)' }}>{selectedUser.name}</h4>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-light)' }}>{selectedUser.companyOrDept}</p>
              </div>
              <Badge text={selectedUser.status} color={selectedUser.status === "Activo" ? "success" : selectedUser.status === "Pendiente" ? "info" : "warning"} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', color: 'var(--color-dark)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={16} color="var(--color-primary)" />
                <span>{selectedUser.loc}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} color="var(--color-primary)" />
                <span>Registro: {selectedUser.joinDate}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={16} color="var(--color-primary)" />
                <span style={{ fontFamily: 'monospace' }}>{selectedUser.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={16} color="var(--color-primary)" />
                <span style={{ fontFamily: 'monospace' }}>{selectedUser.phone}</span>
              </div>
            </div>

            <div style={{ paddingTop: '16px', borderTop: '1px solid var(--light-gray)', display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <Button variant="primary" onClick={() => setSelectedUser(null)}>Cerrar ficha</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}