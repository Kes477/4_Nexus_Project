import React, { useState, useEffect } from 'react';
import { Edit2, Phone, Mail, Lock, LogOut, Save, ShieldCheck, MapPin, CheckCircle, BarChart3, Database, Loader } from 'lucide-react';

import { Button, Avatar, Badge, Modal, Input, SectionHeading, Alert } from '../../components/ui';

export default function AdminPerfil({ onLogout }) {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estado para mostrar/ocultar la contraseña en el modal
  const [showPassword, setShowPassword] = useState(false);

  // Estado para los datos del perfil
  const [profileData, setProfileData] = useState({
    name: "", 
    email: "",
    phone: "", 
    avatar: "", 
    roleLabel: "Administrador",
    location: "No especificada",
    joinDate: "Reciente",
    status: "Activo"
  });

  // Estado para el formulario de edición
  const [editForm, setEditForm] = useState({
    phone: "",
    email: "",
    password: ""
  });

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) throw new Error('No hay sesión activa');

        const response = await fetch(`${API_URL}/auth/perfil/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) throw new Error('Error al cargar el perfil');
        
        const data = await response.json();
        
        setProfileData({
          name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Administrador',
          email: data.email || '',
          phone: data.telefono || '',
          avatar: data.avatar || null, 
          roleLabel: data.role === 'admin' ? 'Super Administrador' : 'Administrador',
          location: data.ubicacion || "Oficina Central Tegucigalpa, FM",
          joinDate: data.date_joined ? new Date(data.date_joined).toLocaleDateString('es-HN', { year: 'numeric', month: 'long', day: 'numeric' }) : "Reciente",
          status: data.is_active ? "Activa" : "Inactiva"
        });

        setEditForm({
          phone: data.telefono || '',
          email: data.email || '',
          password: ''
        });

      } catch (error) {
        console.error(error);
        setErrorMsg('No se pudieron cargar los datos del perfil.');
      } finally {
        setLoading(false);
      }
    };

    fetchPerfil();
  }, [API_URL]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);

    try {
      const token = localStorage.getItem('access_token');
      
      const bodyData = {
        telefono: editForm.phone,
        email: editForm.email
      };
      
      // Solo enviamos la contraseña si no está vacía
      if (editForm.password.trim() !== "") {
        bodyData.password = editForm.password;
      }

      const response = await fetch(`${API_URL}/auth/perfil/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyData)
      });

      if (!response.ok) throw new Error('Error al actualizar');

      // Actualizamos la UI localmente sin recargar la página
      setProfileData(prev => ({
        ...prev,
        email: editForm.email,
        phone: editForm.phone
      }));

      setIsModalOpen(false);
      setShowPassword(false); // Reseteamos el ojo al cerrar
      
    } catch (error) {
      console.error(error);
      setErrorMsg('Hubo un problema al guardar los cambios.');
    } finally {
      setIsSaving(false);
    }
  };

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

  const toggleEyeStyle = { 
    position: 'absolute', 
    right: '15px', 
    top: '50%', 
    transform: 'translateY(-50%)', 
    background: 'none', 
    border: 'none', 
    cursor: 'pointer', 
    color: 'var(--text-light)', 
    zIndex: 10 
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-color)' }}>
        <Loader text="Cargando perfil de administrador..." />
      </div>
    );
  }

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
      
      {errorMsg && (
        <div style={{ width: '100%', maxWidth: '1200px', marginBottom: '20px' }}>
          <Alert type="danger" title="Atención" message={errorMsg} onClose={() => setErrorMsg(null)} />
        </div>
      )}

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
          backgroundColor: 'var(--color-dark)', 
          backgroundImage: 'linear-gradient(45deg, var(--color-dark) 25%, #3a4673 25%, #3a4673 50%, var(--color-dark) 50%, var(--color-dark) 75%, #3a4673 75%, #3a4673 100%)',
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
              <Avatar size="lg" imageUrl={profileData.avatar} icon="fa-user-tie" />
            </div>
            
            <div style={{ paddingBottom: '16px' }}>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: 'var(--color-dark)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                {profileData.name}
                <Badge text={profileData.roleLabel} color="primary" />
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
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--color-dark)' }}>{profileData.phone || 'No registrado'}</span>
            </div>

            <div style={infoBoxStyle}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <Mail size={14} color="var(--color-primary)" /> Correo Corporativo
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

          <SectionHeading eyebrow="Actividad" title="Resumen de Gestión" />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div style={{ ...statBoxStyle, borderLeft: '4px solid var(--color-primary)' }}>
              <BarChart3 size={22} color="var(--color-primary)" style={{ marginBottom: '8px' }} />
              <span style={{ fontSize: '26px', fontWeight: '900', color: 'var(--color-dark)' }}>1,240</span>
              <span style={{ fontSize: '13px', color: 'var(--text-light)', fontWeight: '500' }}>Operaciones Gestionadas</span>
            </div>

            <div style={{ ...statBoxStyle, borderLeft: '4px solid var(--color-info)' }}>
              <Database size={22} color="var(--color-info)" style={{ marginBottom: '8px' }} />
              <span style={{ fontSize: '26px', fontWeight: '900', color: 'var(--color-dark)' }}>16</span>
              <span style={{ fontSize: '13px', color: 'var(--text-light)', fontWeight: '500' }}>Drones en Flota</span>
            </div>

            <div style={{ ...statBoxStyle, borderLeft: '4px solid var(--color-success)' }}>
              <ShieldCheck size={22} color="var(--color-success)" style={{ marginBottom: '8px' }} />
              <span style={{ fontSize: '26px', fontWeight: '900', color: 'var(--color-dark)' }}>0</span>
              <span style={{ fontSize: '13px', color: 'var(--text-light)', fontWeight: '500' }}>Alertas Críticas</span>
            </div>
          </div>

        </div>

        <div style={{ borderTop: '1px solid var(--light-gray)', padding: '16px 40px', backgroundColor: 'var(--bg-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: '500' }}>
            Miembro desde: {profileData.joinDate}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: 'bold', letterSpacing: '1px' }}>
            4 NEXUS SOLUTIONS
          </span>
        </div>

      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setShowPassword(false); }} title="Editar Credenciales">
        <form 
          onSubmit={handleUpdateProfile} 
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <div>
            <label style={labelStyle}>Teléfono</label>
            <Input 
              value={editForm.phone} 
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              icon="fa-phone" 
            />
          </div>

          <div>
            <label style={labelStyle}>Correo Electrónico</label>
            <Input 
              value={editForm.email} 
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              type="email" 
              icon="fa-envelope" 
            />
          </div>

          <div>
            <label style={labelStyle}>Nueva Contraseña (Opcional)</label>
            <div style={{ position: 'relative' }}>
              <Input 
                type={showPassword ? "text" : "password"} 
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                placeholder="Dejar en blanco para no cambiar" 
                icon="fa-lock" 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                style={toggleEyeStyle}
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--light-gray)', marginTop: '8px' }}>
            <Button variant="outline-dark" size="sm" type="button" onClick={() => { setIsModalOpen(false); setShowPassword(false); }}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={isSaving}>
              {isSaving ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fas fa-circle-notch fa-spin"></i> Guardando...
                </span>
              ) : (
                <>
                  <Save size={14} style={{ marginRight: '6px' }} /> Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}