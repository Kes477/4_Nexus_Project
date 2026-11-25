import React, { useState, useEffect } from 'react';
import { Edit2, Phone, Mail, LogOut, Save, MapPin, CheckCircle, Plane, Loader, ShieldCheck, Clock, ToggleLeft, ToggleRight, AlertTriangle, Copy, Check, User, KeyRound } from 'lucide-react';

import { Button, Avatar, Badge, Modal, Input, SectionHeading, Alert } from '../../components/ui';

export default function PilotoPerfil({ onLogout }) {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('datos');
  const [loading, setLoading] = useState(true);

  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [isTogglingDisponibilidad, setIsTogglingDisponibilidad] = useState(false);

  const [isSavingDatos, setIsSavingDatos] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [datosError, setDatosError] = useState(null);
  const [datosSuccess, setDatosSuccess] = useState(null);

  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);

  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  const [profileData, setProfileData] = useState({
    name: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    avatar: "",
    roleLabel: "Piloto",
    location: "No especificada",
    joinDate: "Reciente",
    status: "Activo",
    numeroLicencia: "",
    tipoCertificacion: "",
    horasVuelo: 0,
    disponible: true,
  });

  const [datosForm, setDatosForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    passwordActual: "",
    passwordNueva: "",
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
        const perfilPiloto = data.perfil_piloto || {};

        setProfileData({
          name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Usuario',
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          email: data.email || '',
          phone: data.telefono || '',
          avatar: data.foto_perfil_url || data.avatar || null,
          roleLabel: data.rol === 'admin' ? 'Administrador' : 'Piloto',
          location: data.ubicacion || "Tegucigalpa, Honduras",
          joinDate: data.date_joined
            ? new Date(data.date_joined).toLocaleDateString('es-HN', {
                year: 'numeric', month: 'long', day: 'numeric'
              })
            : "Reciente",
          status: data.is_active ? "Activa" : "Inactiva",
          numeroLicencia: perfilPiloto.numero_licencia_aeronautica || '',
          tipoCertificacion: perfilPiloto.tipo_certificacion || '',
          horasVuelo: Number(perfilPiloto.horas_vuelo_acumuladas ?? 0),
          disponible: perfilPiloto.disponible ?? true,
        });

        setDatosForm({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          phone: data.telefono || '',
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

  const resetModalState = () => {
    setActiveTab('datos');
    setDatosError(null);
    setDatosSuccess(null);
    setPasswordError(null);
    setPasswordSuccess(null);
    setShowPassword(false);
    setPasswordForm({ passwordActual: '', passwordNueva: '' });
  };

  const abrirModal = () => {
    resetModalState();
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    resetModalState();
  };

  const handleCopy = async (field, value) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error(error);
      setErrorMsg('No se pudo copiar al portapapeles.');
    }
  };

  const handleToggleDisponibilidad = async () => {
    setIsTogglingDisponibilidad(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const nuevoValor = !profileData.disponible;
    setProfileData(prev => ({ ...prev, disponible: nuevoValor }));

    try {
      const token = localStorage.getItem('access_token');

      const response = await fetch(`${API_URL}/auth/perfil/piloto/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ disponible: nuevoValor })
      });

      if (!response.ok) throw new Error('Error al actualizar disponibilidad');

      const data = await response.json();
      setProfileData(prev => ({
        ...prev,
        disponible: data.disponible,
        horasVuelo: Number(data.horas_vuelo_acumuladas ?? prev.horasVuelo),
        numeroLicencia: data.numero_licencia_aeronautica ?? prev.numeroLicencia,
        tipoCertificacion: data.tipo_certificacion ?? prev.tipoCertificacion,
      }));

      setSuccessMsg(
        nuevoValor
          ? 'Ahora estás disponible para recibir asignaciones.'
          : 'Has marcado tu perfil como No disponible.'
      );
    } catch (error) {
      console.error(error);
      setProfileData(prev => ({ ...prev, disponible: !nuevoValor }));
      setErrorMsg('No se pudo actualizar tu disponibilidad. Intenta de nuevo.');
    } finally {
      setIsTogglingDisponibilidad(false);
    }
  };

  const extraerMensajeError = (err) => {
    const primerError = Object.values(err || {})[0];
    if (Array.isArray(primerError)) return primerError[0];
    if (typeof primerError === 'string') return primerError;
    return null;
  };

  const handleGuardarDatos = async (e) => {
    e.preventDefault();
    setDatosError(null);
    setDatosSuccess(null);

    if (!datosForm.firstName.trim() || !datosForm.lastName.trim()) {
      setDatosError('Nombre y apellido son obligatorios.');
      return;
    }

    setIsSavingDatos(true);

    try {
      const token = localStorage.getItem('access_token');

      const resp = await fetch(`${API_URL}/auth/perfil/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          first_name: datosForm.firstName.trim(),
          last_name: datosForm.lastName.trim(),
          telefono: datosForm.phone.trim(),
        })
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(extraerMensajeError(err) || 'Error al actualizar datos personales');
      }

      const data = await resp.json();

      setProfileData(prev => ({
        ...prev,
        firstName: data.first_name,
        lastName: data.last_name,
        name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || prev.name,
        phone: data.telefono || '',
      }));

      setDatosSuccess('Datos personales actualizados correctamente.');

    } catch (error) {
      console.error(error);
      setDatosError(error.message || 'Hubo un problema al guardar los datos.');
    } finally {
      setIsSavingDatos(false);
    }
  };

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!passwordForm.passwordActual.trim()) {
      setPasswordError('Debes indicar tu contraseña actual.');
      return;
    }
    if (!passwordForm.passwordNueva.trim()) {
      setPasswordError('Debes indicar la nueva contraseña.');
      return;
    }
    if (passwordForm.passwordNueva.length < 8) {
      setPasswordError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setIsSavingPassword(true);

    try {
      const token = localStorage.getItem('access_token');

      const resp = await fetch(`${API_URL}/auth/perfil/cambiar-password/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password_actual: passwordForm.passwordActual,
          password_nueva: passwordForm.passwordNueva,
        })
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(extraerMensajeError(err) || 'Error al cambiar la contraseña');
      }

      setPasswordSuccess('Contraseña actualizada correctamente.');
      setPasswordForm({ passwordActual: '', passwordNueva: '' });
      setShowPassword(false);

    } catch (error) {
      console.error(error);
      setPasswordError(error.message || 'Hubo un problema al cambiar la contraseña.');
    } finally {
      setIsSavingPassword(false);
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
    transition: 'transform 0.2s, box-shadow 0.2s',
    position: 'relative'
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

  const copyButtonStyle = {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-light)',
    padding: '4px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s, color 0.2s'
  };

  const tabsContainerStyle = {
    display: 'flex',
    gap: '4px',
    borderBottom: '2px solid var(--light-gray)',
    marginBottom: '20px'
  };

  const tabButtonStyle = (isActive) => ({
    flex: 1,
    padding: '12px 16px',
    background: 'none',
    border: 'none',
    borderBottom: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
    marginBottom: '-2px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '13px',
    fontWeight: '700',
    color: isActive ? 'var(--color-primary)' : 'var(--text-light)',
    transition: 'color 0.2s, border-color 0.2s'
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-color)' }}>
        <Loader text="Cargando perfil..." />
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

      {successMsg && (
        <div style={{ width: '100%', maxWidth: '1200px', marginBottom: '20px' }}>
          <Alert type="success" title="Listo" message={successMsg} onClose={() => setSuccessMsg(null)} />
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
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: 'var(--color-dark)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                {profileData.name}
                <Badge text={profileData.roleLabel} color="success" />
                <Badge
                  text={profileData.disponible ? 'Disponible' : 'No disponible'}
                  color={profileData.disponible ? 'success' : 'danger'}
                />
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
            <Button variant="outline-dark" size="sm" onClick={abrirModal}>
              <Edit2 size={14} style={{ marginRight: '6px' }} /> Editar Perfil
            </Button>
            <Button variant="danger" size="sm" onClick={onLogout}>
              <LogOut size={14} style={{ marginRight: '6px' }} /> Cerrar Sesión
            </Button>
          </div>
        </div>

        <div style={{ padding: '0 40px 32px 40px' }}>

          <SectionHeading eyebrow="Información Profesional" title="Licencia y Certificación" />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>

            <div style={infoBoxStyle}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <ShieldCheck size={14} color="var(--color-primary)" /> Número de Licencia Aeronáutica
              </span>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--color-dark)' }}>
                {profileData.numeroLicencia || 'No registrada'}
              </span>
            </div>

            <div style={infoBoxStyle}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <Plane size={14} color="var(--color-primary)" /> Tipo de Certificación
              </span>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--color-dark)' }}>
                {profileData.tipoCertificacion || 'No registrada'}
              </span>
            </div>

            <div style={infoBoxStyle}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <Clock size={14} color="var(--color-primary)" /> Horas de Vuelo Acumuladas
              </span>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--color-dark)' }}>
                {profileData.horasVuelo.toFixed(2)} hrs
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                Calculadas por el sistema.
              </span>
            </div>

            <div style={{ ...infoBoxStyle, justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {profileData.disponible
                  ? <ToggleRight size={14} color="var(--color-success)" />
                  : <ToggleLeft size={14} color="var(--color-danger, #dc3545)" />}
                Estado de Disponibilidad
              </span>
              <span style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: profileData.disponible ? 'var(--color-success)' : 'var(--color-danger, #dc3545)'
              }}>
                {profileData.disponible ? 'Disponible' : 'No disponible'}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                {profileData.disponible
                  ? 'Puedes recibir asignaciones de misión.'
                  : 'No recibirás nuevas asignaciones mientras estés inactivo.'}
              </span>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <Button
                  variant={profileData.disponible ? 'outline-dark' : 'primary'}
                  size="sm"
                  onClick={handleToggleDisponibilidad}
                  disabled={isTogglingDisponibilidad}
                >
                  {isTogglingDisponibilidad ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fas fa-circle-notch fa-spin"></i> ...
                    </span>
                  ) : profileData.disponible ? (
                    'Marcar No disponible'
                  ) : (
                    'Marcar Disponible'
                  )}
                </Button>
              </div>
            </div>

          </div>

          <SectionHeading eyebrow="Información" title="Datos de Contacto" />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>

            <div style={infoBoxStyle}>
              <button
                type="button"
                onClick={() => handleCopy('phone', profileData.phone)}
                style={copyButtonStyle}
                title={copiedField === 'phone' ? 'Copiado' : 'Copiar teléfono'}
                disabled={!profileData.phone}
              >
                {copiedField === 'phone'
                  ? <Check size={14} color="var(--color-success)" />
                  : <Copy size={14} />}
              </button>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <Phone size={14} color="var(--color-primary)" /> Teléfono
              </span>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--color-dark)' }}>{profileData.phone || 'No registrado'}</span>
            </div>

            <div style={infoBoxStyle}>
              <button
                type="button"
                onClick={() => handleCopy('email', profileData.email)}
                style={copyButtonStyle}
                title={copiedField === 'email' ? 'Copiado' : 'Copiar correo'}
                disabled={!profileData.email}
              >
                {copiedField === 'email'
                  ? <Check size={14} color="var(--color-success)" />
                  : <Copy size={14} />}
              </button>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <Mail size={14} color="var(--color-primary)" /> Correo Electrónico
              </span>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--color-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profileData.email}</span>
            </div>

          </div>

        </div>

        <div style={{ borderTop: '1px solid var(--light-gray)', padding: '16px 40px', backgroundColor: 'var(--bg-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: '500' }}>
            Piloto desde: {profileData.joinDate}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: 'bold', letterSpacing: '1px' }}>
            4 NEXUS SOLUTIONS
          </span>
        </div>

      </div>

      <Modal isOpen={isModalOpen} onClose={cerrarModal} title="Editar Perfil">
        <div style={{ display: 'flex', flexDirection: 'column' }}>

          <div style={tabsContainerStyle}>
            <button
              type="button"
              onClick={() => setActiveTab('datos')}
              style={tabButtonStyle(activeTab === 'datos')}
            >
              <User size={15} /> Datos del Usuario
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('password')}
              style={tabButtonStyle(activeTab === 'password')}
            >
              <KeyRound size={15} /> Contraseña
            </button>
          </div>

          {activeTab === 'datos' && (
            <form onSubmit={handleGuardarDatos} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {datosError && (
                <Alert
                  type="danger"
                  title="No se pudo guardar"
                  message={datosError}
                  onClose={() => setDatosError(null)}
                />
              )}

              {datosSuccess && (
                <Alert
                  type="success"
                  title="Listo"
                  message={datosSuccess}
                  onClose={() => setDatosSuccess(null)}
                />
              )}

              <div>
                <label style={labelStyle}>Nombre</label>
                <Input
                  value={datosForm.firstName}
                  onChange={(e) => setDatosForm({ ...datosForm, firstName: e.target.value })}
                  icon="fa-user"
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Apellido</label>
                <Input
                  value={datosForm.lastName}
                  onChange={(e) => setDatosForm({ ...datosForm, lastName: e.target.value })}
                  icon="fa-user"
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Teléfono</label>
                <Input
                  value={datosForm.phone}
                  onChange={(e) => setDatosForm({ ...datosForm, phone: e.target.value })}
                  icon="fa-phone"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
                <Button variant="primary" size="sm" type="submit" disabled={isSavingDatos}>
                  {isSavingDatos ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fas fa-circle-notch fa-spin"></i> Guardando...
                    </span>
                  ) : (
                    <>
                      <Save size={14} style={{ marginRight: '6px' }} /> Guardar Datos
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handleCambiarPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {passwordError && (
                <Alert
                  type="danger"
                  title="No se pudo cambiar"
                  message={passwordError}
                  onClose={() => setPasswordError(null)}
                />
              )}

              {passwordSuccess && (
                <Alert
                  type="success"
                  title="Listo"
                  message={passwordSuccess}
                  onClose={() => setPasswordSuccess(null)}
                />
              )}

              <div>
                <label style={labelStyle}>Contraseña Actual</label>
                <Input
                  type="password"
                  value={passwordForm.passwordActual}
                  onChange={(e) => setPasswordForm({ ...passwordForm, passwordActual: e.target.value })}
                  placeholder="Tu contraseña actual"
                  icon="fa-lock"
                  autoComplete="current-password"
                />
              </div>

              <div>
                <label style={labelStyle}>Nueva Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={passwordForm.passwordNueva}
                    onChange={(e) => setPasswordForm({ ...passwordForm, passwordNueva: e.target.value })}
                    placeholder="Mínimo 8 caracteres"
                    icon="fa-lock"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={toggleEyeStyle}
                    aria-label={showPassword ? 'Ocultar contraseña nueva' : 'Mostrar contraseña nueva'}
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
                <Button variant="primary" size="sm" type="submit" disabled={isSavingPassword}>
                  {isSavingPassword ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fas fa-circle-notch fa-spin"></i> Cambiando...
                    </span>
                  ) : (
                    <>
                      <KeyRound size={14} style={{ marginRight: '6px' }} /> Cambiar Contraseña
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px', backgroundColor: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--light-gray)', marginTop: '20px' }}>
            <AlertTriangle size={16} color="var(--color-warning, #f0ad4e)" style={{ marginTop: '2px', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: 'var(--text-light)', lineHeight: 1.4 }}>
              La licencia, certificación, horas de vuelo y correo electrónico no se pueden modificar desde aquí. Contacta a un administrador si necesitas actualizarlos.
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--light-gray)', marginTop: '16px' }}>
            <Button variant="outline-dark" size="sm" type="button" onClick={cerrarModal}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}