import { useState } from 'react';
import { Edit2, Phone, Mail, Lock, LogOut, Save, MapPin, CheckCircle, Map, Plane, TrendingUp, Loader, KeyRound } from 'lucide-react';

import { Button, Avatar, Badge, Modal, Input, SectionHeading, Alert } from '../../components/ui';
import { useSesion } from '../../hooks/useSesion';

const ETIQUETA_ROL = {
  admin: 'Administrador',
  piloto: 'Piloto',
  tecnico: 'Técnico',
  vendedor: 'Vendedor',
  cliente: 'Cliente',
};

const FORM_PASSWORD_VACIO = { actual: '', nueva: '', confirmar: '' };

// Toma el primer mensaje de error que devuelve Django
function primerError(error) {
  const errores = error.response?.data;
  if (!errores) return 'No se pudo conectar con el servidor. Intenta de nuevo.';
  const primerCampo = Object.keys(errores)[0];
  return [].concat(errores[primerCampo])[0];
}

export default function ClientePerfil({ onLogout }) {
  const { usuario, cargando, actualizarPerfil, cambiarPassword } = useSesion();

  // null = cerrado, 'datos' = editar datos, 'password' = cambiar contraseña
  const [modal, setModal] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [exitoMsg, setExitoMsg] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    telefono: '',
    fecha_nacimiento: '',
  });
  const [passForm, setPassForm] = useState(FORM_PASSWORD_VACIO);

  const cerrarModal = () => {
    setModal(null);
    setErrorMsg(null);
    setShowPassword(false);
    setPassForm(FORM_PASSWORD_VACIO);
  };

  const abrirEditarDatos = () => {
    setEditForm({
      first_name: usuario.first_name,
      last_name: usuario.last_name,
      telefono: usuario.telefono || '',
      fecha_nacimiento: usuario.fecha_nacimiento || '',
    });
    setExitoMsg(null);
    setModal('datos');
  };

  const abrirCambiarPassword = () => {
    setExitoMsg(null);
    setModal('password');
  };

  const guardarDatos = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);

    try {
      await actualizarPerfil({
        ...editForm,
        fecha_nacimiento: editForm.fecha_nacimiento || null,
      });
      cerrarModal();
      setExitoMsg('Tus datos se actualizaron correctamente.');
    } catch (error) {
      setErrorMsg(primerError(error));
    } finally {
      setIsSaving(false);
    }
  };

  const guardarPassword = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (passForm.nueva !== passForm.confirmar) {
      setErrorMsg('La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    setIsSaving(true);
    try {
      await cambiarPassword(passForm.actual, passForm.nueva);
      cerrarModal();
      setExitoMsg('Tu contraseña se cambió correctamente.');
    } catch (error) {
      setErrorMsg(primerError(error));
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

  if (cargando || !usuario) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-color)' }}>
        <Loader className="animate-spin" size={32} color="var(--color-primary)" />
      </div>
    );
  }

  // Datos que se muestran, calculados desde el usuario del contexto
  const profileData = {
    name: `${usuario.first_name} ${usuario.last_name}`.trim() || 'Usuario',
    email: usuario.email,
    phone: usuario.telefono,
    avatar: usuario.foto_perfil_url || null,
    roleLabel: ETIQUETA_ROL[usuario.rol] ?? 'Cliente',
    location: 'Tegucigalpa, Honduras',
    joinDate: new Date(usuario.date_joined).toLocaleDateString('es-HN', { year: 'numeric', month: 'long', day: 'numeric' }),
    status: usuario.is_active ? 'Activa' : 'Inactiva',
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
      
      {exitoMsg && (
        <div style={{ width: '100%', maxWidth: '1200px', marginBottom: '20px' }}>
          <Alert type="success" title="Listo" message={exitoMsg} onClose={() => setExitoMsg(null)} />
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

          <div style={{ paddingBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Button variant="outline-dark" size="sm" onClick={abrirEditarDatos}>
              <Edit2 size={14} style={{ marginRight: '6px' }} /> Editar Perfil
            </Button>
            <Button variant="outline-dark" size="sm" onClick={abrirCambiarPassword}>
              <KeyRound size={14} style={{ marginRight: '6px' }} /> Cambiar Contraseña
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

      <Modal isOpen={modal === 'datos'} onClose={cerrarModal} title="Editar Datos Personales">
        <form onSubmit={guardarDatos} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {errorMsg && <Alert type="danger" title="Atención" message={errorMsg} onClose={() => setErrorMsg(null)} />}

          <div>
            <label style={labelStyle}>Nombre</label>
            <Input value={editForm.first_name} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} icon="fa-user" />
          </div>

          <div>
            <label style={labelStyle}>Apellido</label>
            <Input value={editForm.last_name} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} icon="fa-user" />
          </div>

          <div>
            <label style={labelStyle}>Teléfono</label>
            <Input type="tel" value={editForm.telefono} onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })} icon="fa-phone" maxLength={20} />
          </div>

          <div>
            <label style={labelStyle}>Fecha de Nacimiento</label>
            <Input type="date" value={editForm.fecha_nacimiento} onChange={(e) => setEditForm({ ...editForm, fecha_nacimiento: e.target.value })} icon="fa-calendar" />
          </div>

          <div>
            <label style={labelStyle}>Correo Electrónico</label>
            <Input value={usuario.email} icon="fa-envelope" disabled />
            <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>El correo no se puede cambiar desde aquí.</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--light-gray)', marginTop: '8px' }}>
            <Button variant="outline-dark" size="sm" type="button" onClick={cerrarModal}>Cancelar</Button>
            <Button variant="primary" size="sm" type="submit" disabled={isSaving}>
              <Save size={14} style={{ marginRight: '6px' }} /> {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={modal === 'password'} onClose={cerrarModal} title="Cambiar Contraseña">
        <form onSubmit={guardarPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {errorMsg && <Alert type="danger" title="Atención" message={errorMsg} onClose={() => setErrorMsg(null)} />}

          {[
            { campo: 'actual', etiqueta: 'Contraseña Actual' },
            { campo: 'nueva', etiqueta: 'Nueva Contraseña' },
            { campo: 'confirmar', etiqueta: 'Confirmar Nueva Contraseña' },
          ].map(({ campo, etiqueta }) => (
            <div key={campo}>
              <label style={labelStyle}>{etiqueta}</label>
              <div style={{ position: 'relative' }}>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={passForm[campo]}
                  onChange={(e) => setPassForm({ ...passForm, [campo]: e.target.value })}
                  icon="fa-lock"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={toggleEyeStyle}>
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--light-gray)', marginTop: '8px' }}>
            <Button variant="outline-dark" size="sm" type="button" onClick={cerrarModal}>Cancelar</Button>
            <Button variant="primary" size="sm" type="submit" disabled={isSaving}>
              <Lock size={14} style={{ marginRight: '6px' }} /> {isSaving ? 'Guardando...' : 'Cambiar Contraseña'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}