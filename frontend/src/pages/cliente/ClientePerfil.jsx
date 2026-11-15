import React, { useState } from 'react';
import { Edit2, Phone, Mail, Lock, LogOut, Save, MapPin, CheckCircle, Map, Plane, TrendingUp } from 'lucide-react';

import { Button, Avatar, Badge, Modal, Input, SectionHeading } from '../../components/ui';

export default function ClientePerfil({ onLogout }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [profileData] = useState({
    name: "Juan Pérez", 
    email: "juan.perez@fincaelvalle.hn",
    phone: "+504 8877-6655", 
    avatar: "src/img/cliente_perfil.png", 
    roleLabel: "Cliente Premium",
    location: "Finca El Valle, Danlí",
    joinDate: "15 de Marzo, 2025",
    status: "Activo"
  });

  const infoBoxStyle = {
    padding: '20px',
    backgroundColor: 'var(--white)',
    border: '1px solid var(--light-gray)',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
    transition: 'transform 0.2s, box-shadow 0.2s'
  };

  const statBoxStyle = {
    ...infoBoxStyle,
    padding: '20px',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--text-light)',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
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
        borderRadius: '16px', 
        overflow: 'hidden', 
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        border: '1px solid var(--light-gray)'
      }}>
        
        <div style={{ 
          height: '150px', 
          backgroundColor: 'var(--color-primary)', 
          backgroundImage: 'linear-gradient(45deg, var(--color-primary) 25%, #03b394 25%, #03b394 50%, var(--color-primary) 50%, var(--color-primary) 75%, #03b394 75%, #03b394 100%)',
          backgroundSize: '40px 40px',
          position: 'relative'
        }} />

        <div style={{ padding: '0 40px', position: 'relative', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
          
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px' }}>
            
            <div style={{ 
              borderRadius: '50%', 
              border: '6px solid var(--white)', 
              backgroundColor: 'var(--white)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              marginTop: '-40px', 
              zIndex: 2,
              position: 'relative'
            }}>
              <Avatar size="lg" imageUrl={profileData.avatar} icon="fa-user" />
            </div>
            
            <div style={{ paddingBottom: '16px' }}>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: 'var(--color-dark)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                {profileData.name}
                <Badge text={profileData.roleLabel} color="success" />
              </h1>
              <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: 'var(--text-light)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} /> {profileData.location}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={14} color="var(--color-success)" /> Cuenta {profileData.status}
                </span>
              </p>
            </div>

          </div>

          <div style={{ paddingBottom: '20px', display: 'flex', gap: '10px' }}>
            <Button variant="outline-dark" size="sm" onClick={() => setIsModalOpen(true)}>
              <Edit2 size={14} style={{ marginRight: '6px' }} /> Editar Perfil
            </Button>
            <Button variant="danger" size="sm" onClick={onLogout}>
              <LogOut size={14} style={{ marginRight: '6px' }} /> Cerrar Sesión
            </Button>
          </div>
        </div>

        <div style={{ padding: '0 40px 32px 40px' }}>
          
          <SectionHeading eyebrow="Información" title="Datos de Contacto y Seguridad" />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            
            <div style={infoBoxStyle}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <Phone size={14} color="var(--color-primary)" /> Teléfono
              </span>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--color-dark)' }}>{profileData.phone}</span>
            </div>

            <div style={infoBoxStyle}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <Mail size={14} color="var(--color-primary)" /> Correo Electrónico
              </span>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--color-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profileData.email}</span>
            </div>

            <div style={infoBoxStyle}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <Lock size={14} color="var(--color-primary)" /> Contraseña
              </span>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--color-dark)', fontFamily: 'monospace' }}>••••••••••••</span>
            </div>

          </div>

          <SectionHeading eyebrow="Actividad" title="Resumen de Servicios" />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div style={{ ...statBoxStyle, borderLeft: '4px solid var(--color-primary)' }}>
              <Map size={22} color="var(--color-primary)" style={{ marginBottom: '8px' }} />
              <span style={{ fontSize: '26px', fontWeight: '900', color: 'var(--color-dark)' }}>450</span>
              <span style={{ fontSize: '13px', color: 'var(--text-light)', fontWeight: '500' }}>Hectáreas Atendidas</span>
            </div>

            <div style={{ ...statBoxStyle, borderLeft: '4px solid var(--color-info)' }}>
              <Plane size={22} color="var(--color-info)" style={{ marginBottom: '8px' }} />
              <span style={{ fontSize: '26px', fontWeight: '900', color: 'var(--color-dark)' }}>12</span>
              <span style={{ fontSize: '13px', color: 'var(--text-light)', fontWeight: '500' }}>Servicios Contratados</span>
            </div>

            <div style={{ ...statBoxStyle, borderLeft: '4px solid var(--color-success)' }}>
              <TrendingUp size={22} color="var(--color-success)" style={{ marginBottom: '8px' }} />
              <span style={{ fontSize: '26px', fontWeight: '900', color: 'var(--color-dark)' }}>L 15,000</span>
              <span style={{ fontSize: '13px', color: 'var(--text-light)', fontWeight: '500' }}>Ahorro Estimado</span>
            </div>
          </div>

        </div>

        <div style={{ borderTop: '1px solid var(--light-gray)', padding: '16px 40px', backgroundColor: 'var(--bg-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: '500' }}>
            Cliente desde: {profileData.joinDate}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: 'bold', letterSpacing: '1px' }}>
            4 NEXUS SOLUTIONS
          </span>
        </div>

      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Editar Credenciales">
        <form 
          onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); }} 
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <div>
            <label style={labelStyle}>Teléfono</label>
            <Input defaultValue={profileData.phone} icon="fa-phone" />
          </div>

          <div>
            <label style={labelStyle}>Correo Electrónico</label>
            <Input defaultValue={profileData.email} type="email" icon="fa-envelope" />
          </div>

          <div>
            <label style={labelStyle}>Nueva Contraseña</label>
            <Input type="password" placeholder="Dejar en blanco para no cambiar" icon="fa-lock" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--light-gray)', marginTop: '8px' }}>
            <Button variant="outline-dark" size="sm" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" size="sm" type="submit">
              <Save size={14} style={{ marginRight: '6px' }} /> Guardar Cambios
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}