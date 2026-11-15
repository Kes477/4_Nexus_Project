import React, { useState } from 'react';
import { Edit2, Phone, Mail, Lock, LogOut, Save, ShieldCheck, MapPin, CheckCircle, BarChart3, Database } from 'lucide-react';

// Importación estricta de tus componentes
import { Button, Avatar, Badge, Modal, Input, SectionHeading } from '../../components/ui';

export default function AdminPerfil({ onLogout }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [profileData] = useState({
    name: "Lic. Carlos Rodríguez", 
    email: "carlos.rodriguez@4nexus.hn",
    phone: "+504 9988-7766", 
    avatar: "src/img/admin_perfil.png", 
    roleLabel: "Super Administrador",
    location: "Oficina Central Tegucigalpa, FM",
    joinDate: "12 de Enero, 2022",
    status: "Activo"
  });

  const infoBoxStyle = {
    padding: '24px',
    backgroundColor: 'var(--white)',
    border: '1px solid var(--light-gray)',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
  };

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
      
      <div style={{ 
        width: '100%', 
        maxWidth: '1200px', 
        backgroundColor: 'var(--white)', 
        borderRadius: '12px', 
        overflow: 'hidden', 
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        border: '1px solid var(--light-gray)'
      }}>
        
        {/* BANNER SUPERIOR (Fondo simulado) */}
        <div style={{ 
          height: '160px', 
          backgroundColor: 'var(--color-dark)', 
          backgroundImage: 'linear-gradient(45deg, var(--color-dark) 25%, #3a4673 25%, #3a4673 50%, var(--color-dark) 50%, var(--color-dark) 75%, #3a4673 75%, #3a4673 100%)',
          backgroundSize: '40px 40px',
          position: 'relative'
        }} />

        {/* CABECERA DEL PERFIL */}
        <div style={{ padding: '0 40px', position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
          
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px' }}>
            
            {/* AVATAR (Se sube con margen negativo para superponerse al banner) */}
            <div style={{ 
              borderRadius: '50%', 
              border: '6px solid var(--white)', 
              backgroundColor: 'var(--white)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              marginTop: '-40px', // <--- SOLUCIÓN: Sube solo el avatar
              zIndex: 2,
              position: 'relative'
            }}>
              <Avatar size="lg" imageUrl={profileData.avatar} icon="fa-user-tie" />
            </div>
            
            {/* TEXTOS (Quedan sobre el fondo blanco para asegurar su lectura) */}
            <div style={{ paddingBottom: '16px' }}>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: 'var(--color-dark)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                {profileData.name}
                <Badge text={profileData.roleLabel} color="primary" />
              </h1>
              <p style={{ margin: '6px 0 0 0', fontSize: '15px', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} /> {profileData.location}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={16} color="var(--color-success)" /> Cuenta {profileData.status}
                </span>
              </p>
            </div>

          </div>

          {/* Botones de Acción */}
          <div style={{ paddingBottom: '24px', display: 'flex', gap: '12px' }}>
            <Button variant="outline-dark" onClick={() => setIsModalOpen(true)}>
              <Edit2 size={16} style={{ marginRight: '8px' }} /> Editar Perfil
            </Button>
            <Button variant="danger" onClick={onLogout}>
              <LogOut size={16} style={{ marginRight: '8px' }} /> Cerrar Sesión
            </Button>
          </div>
        </div>

        {/* CUERPO DEL PERFIL */}
        <div style={{ padding: '0 40px 40px 40px' }}>
          
          <SectionHeading eyebrow="Información" title="Datos de Contacto y Seguridad" />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
            
            <div style={infoBoxStyle}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-light)', textTransform: 'uppercase' }}>
                <Phone size={16} color="var(--color-primary)" /> Teléfono
              </span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-dark)' }}>{profileData.phone}</span>
            </div>

            <div style={infoBoxStyle}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-light)', textTransform: 'uppercase' }}>
                <Mail size={16} color="var(--color-primary)" /> Correo Corporativo
              </span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-dark)' }}>{profileData.email}</span>
            </div>

            <div style={infoBoxStyle}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-light)', textTransform: 'uppercase' }}>
                <Lock size={16} color="var(--color-primary)" /> Contraseña
              </span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-dark)', fontFamily: 'monospace' }}>••••••••••••</span>
            </div>

          </div>

          <SectionHeading eyebrow="Actividad" title="Resumen de Gestión" />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
            <div style={{ ...infoBoxStyle, borderLeft: '4px solid var(--color-primary)' }}>
              <BarChart3 size={24} color="var(--color-primary)" style={{ marginBottom: '8px' }} />
              <span style={{ fontSize: '28px', fontWeight: '900', color: 'var(--color-dark)' }}>1,240</span>
              <span style={{ fontSize: '14px', color: 'var(--text-light)', fontWeight: '500' }}>Operaciones Gestionadas</span>
            </div>

            <div style={{ ...infoBoxStyle, borderLeft: '4px solid var(--color-info)' }}>
              <Database size={24} color="var(--color-info)" style={{ marginBottom: '8px' }} />
              <span style={{ fontSize: '28px', fontWeight: '900', color: 'var(--color-dark)' }}>16</span>
              <span style={{ fontSize: '14px', color: 'var(--text-light)', fontWeight: '500' }}>Drones en Flota</span>
            </div>

            <div style={{ ...infoBoxStyle, borderLeft: '4px solid var(--color-success)' }}>
              <ShieldCheck size={24} color="var(--color-success)" style={{ marginBottom: '8px' }} />
              <span style={{ fontSize: '28px', fontWeight: '900', color: 'var(--color-dark)' }}>0</span>
              <span style={{ fontSize: '14px', color: 'var(--text-light)', fontWeight: '500' }}>Alertas Críticas</span>
            </div>
          </div>

        </div>

        {/* FOOTER DEL PERFIL */}
        <div style={{ borderTop: '1px solid var(--light-gray)', padding: '20px 40px', backgroundColor: 'var(--bg-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-light)', fontWeight: '500' }}>
            Miembro desde: {profileData.joinDate}
          </span>
          <span style={{ fontSize: '13px', color: 'var(--text-light)', fontWeight: 'bold', letterSpacing: '1px' }}>
            4 NEXUS SOLUTIONS
          </span>
        </div>

      </div>

      {/* MODAL DE EDICIÓN */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Editar Credenciales">
        <form 
          onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); }} 
          style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '8px' }}>Teléfono</label>
            <Input defaultValue={profileData.phone} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '8px' }}>Correo Electrónico</label>
            <Input defaultValue={profileData.email} type="email" />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '8px' }}>Nueva Contraseña</label>
            <Input type="password" placeholder="Dejar en blanco para no cambiar" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--light-gray)', marginTop: '8px' }}>
            <Button variant="outline-dark" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" type="submit">
              <Save size={16} style={{ marginRight: '8px' }} /> Guardar Cambios
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}