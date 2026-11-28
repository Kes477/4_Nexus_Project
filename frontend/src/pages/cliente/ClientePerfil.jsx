import { useState, useEffect, useRef } from 'react';
import { Edit2, Phone, Mail, LogOut, Save, MapPin, CheckCircle, Loader, KeyRound, Lock, Check, Copy, Settings, Camera } from 'lucide-react';

import { Button, Badge, Modal, Input, SectionHeading, Alert } from '../../components/ui';
import { useSesion } from '../../hooks/useSesion';
import MisDirecciones from '../../components/cliente/MisDirecciones';
import { primerError } from '../../utils/errores';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const API_BASE_URL = API_URL.replace('/api', '');

const ETIQUETA_ROL = {
  admin: 'Administrador',
  piloto: 'Piloto',
  tecnico: 'Técnico',
  vendedor: 'Vendedor',
  cliente: 'Cliente',
};

const FORM_PASSWORD_VACIO = { actual: '', nueva: '', confirmar: '' };

const REGEX = {
  name: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
  phone: /^[0-9+\-\s]{8,15}$/,
};

const PATRONES = [
  { id: 'patron-1', nombre: '1. Mosaico Geométrico' },
  { id: 'patron-2', nombre: '2. Estrella Hexagonal' },
  { id: 'patron-3', nombre: '3. Escamas Radiales' },
  { id: 'patron-4', nombre: '4. Franjas Diagonales' },
  { id: 'patron-5', nombre: '5. Círculos Concéntricos' },
  { id: 'patron-6', nombre: '6. Cubos 3D' },
  { id: 'patron-7', nombre: '7. Tejido Herringbone' },
  { id: 'patron-8', nombre: '8. Arcos Superpuestos' },
  { id: 'patron-9', nombre: '9. Rombo de Círculos' },
  { id: 'patron-10', nombre: '10. Hexágonos 3D' },
  { id: 'patron-11', nombre: '11. Escamas de Pez' },
  { id: 'patron-12', nombre: '12. Cuadrados Anidados' },
  { id: 'patron-13', nombre: '13. Ondas Concéntricas' },
  { id: 'patron-14', nombre: '14. Óvalos Entrelazados' },
  { id: 'patron-15', nombre: '15. Zig-Zag Chevron' },
  { id: 'patron-16', nombre: '16. Estrella de Diamantes' },
  { id: 'patron-17', nombre: '17. Ondas 3D Suaves' },
  { id: 'patron-18', nombre: '18. Flores Radiales' },
  { id: 'patron-19', nombre: '19. Medallón Geométrico' },
  { id: 'patron-20', nombre: '20. Rejilla Triangular' },
];

const CheckItem = ({ label, isValid }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isValid ? 'var(--color-success)' : 'var(--text-light)' }}>
    {isValid ? <Check size={12} color="var(--color-success)" /> : <span style={{ fontSize: '10px', lineHeight: '12px', color: 'var(--text-light)', paddingBottom: '2px' }}>•</span>}
    <span style={{ fontSize: '10px' }}>{label}</span>
  </div>
);

export default function ClientePerfil({ onLogout }) {
  const { usuario, cargando, actualizarPerfil, cambiarPassword } = useSesion();

  const [modal, setModal] = useState(null);
  const [isPatternModalOpen, setIsPatternModalOpen] = useState(false);
  
  const [selectedPattern, setSelectedPattern] = useState(() => {
    const guardado = localStorage.getItem('nexus_header_pattern');
    return guardado || 'patron-15';
  });
  
  const [errorMsg, setErrorMsg] = useState(null);
  const [exitoMsg, setExitoMsg] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [fotoPreview, setFotoPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  const [copiedField, setCopiedField] = useState(null);

  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    telefono: '',
    fecha_nacimiento: '',
  });
  const [editErrors, setEditErrors] = useState({});
  const [editTouched, setEditTouched] = useState({});

  const [passForm, setPassForm] = useState(FORM_PASSWORD_VACIO);
  const [direccionPrincipal, setDireccionPrincipal] = useState(null);

  const passChecks = {
    length: passForm.nueva.length >= 8,
    upper: /[A-Z]/.test(passForm.nueva),
    lower: /[a-z]/.test(passForm.nueva),
    number: /[0-9]/.test(passForm.nueva),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(passForm.nueva)
  };

  const isPasswordValid = Object.values(passChecks).every(Boolean);
  const passwordsMatch = passForm.nueva === passForm.confirmar && passForm.nueva.length > 0;
  const canSubmitPassword = passForm.actual.length > 0 && isPasswordValid && passwordsMatch;

  const handlePatternChange = (patronId) => {
    setSelectedPattern(patronId);
    localStorage.setItem('nexus_header_pattern', patronId);
    setIsPatternModalOpen(false);
  };

  const handleFotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;

    const previewUrl = URL.createObjectURL(file);
    setFotoPreview(previewUrl);
    setIsUploading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('foto_perfil', file);

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_URL}/auth/perfil/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error('Error al subir la imagen');

      setExitoMsg('Foto de perfil actualizada correctamente.');
      
    } catch (error) {
      console.error(error);
      setErrorMsg('No se pudo subir la foto. Intenta de nuevo.');
      setFotoPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const cerrarModal = () => {
    setModal(null);
    setErrorMsg(null);
    setPassForm(FORM_PASSWORD_VACIO);
    setEditErrors({});
    setEditTouched({});
    setShowActual(false);
    setShowNueva(false);
    setShowConfirmar(false);
  };

  const abrirEditarDatos = () => {
    setEditForm({
      first_name: usuario.first_name,
      last_name: usuario.last_name,
      telefono: usuario.telefono || '',
      fecha_nacimiento: usuario.fecha_nacimiento || '',
    });
    setEditErrors({});
    setEditTouched({});
    setExitoMsg(null);
    setModal('datos');
  };

  const abrirCambiarPassword = () => {
    setExitoMsg(null);
    setErrorMsg(null);
    setModal('password');
  };

  const scrollToDirecciones = () => {
    const el = document.getElementById('mis-direcciones');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
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

  const validateEditField = (field, value) => {
    if (!value && field !== 'telefono') return 'Este campo es obligatorio.';

    switch (field) {
      case 'first_name':
      case 'last_name':
        if (!REGEX.name.test(value)) return 'Solo se permiten letras y espacios.';
        break;
      case 'telefono':
        if (value && !REGEX.phone.test(value)) return 'Ingresa un teléfono válido (8-15 dígitos).';
        break;
      default:
        break;
    }
    return '';
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm({ ...editForm, [name]: value });
    if (editErrors[name]) {
      setEditErrors({ ...editErrors, [name]: '' });
    }
  };

  const handleEditBlur = (e) => {
    const { name, value } = e.target;
    setEditTouched({ ...editTouched, [name]: true });
    const error = validateEditField(name, value);
    setEditErrors({ ...editErrors, [name]: error });
  };

  const guardarDatos = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);

    const newErrors = {};
    ['first_name', 'last_name', 'telefono'].forEach(field => {
      const error = validateEditField(field, editForm[field]);
      if (error) newErrors[field] = error;
      setEditTouched(prev => ({ ...prev, [field]: true }));
    });

    if (Object.keys(newErrors).length > 0) {
      setEditErrors(newErrors);
      setIsSaving(false);
      return;
    }

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
    if (!canSubmitPassword) return;

    setErrorMsg(null);
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

  if (cargando || !usuario) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-color)' }}>
        <Loader className="animate-spin" size={32} color="var(--color-primary)" />
      </div>
    );
  }

  const getAvatarUrl = () => {
    if (fotoPreview) return fotoPreview;
    if (!usuario.foto_perfil) return null;
    if (usuario.foto_perfil.startsWith('http')) return usuario.foto_perfil;
    return `${API_BASE_URL}${usuario.foto_perfil}`;
  };

  const profileData = {
    name: `${usuario.first_name} ${usuario.last_name}`.trim() || 'Usuario',
    email: usuario.email,
    phone: usuario.telefono,
    avatar: getAvatarUrl(),
    roleLabel: ETIQUETA_ROL[usuario.rol] ?? 'Cliente',
    location: direccionPrincipal?.ubicacion_texto || direccionPrincipal?.linea_direccion1 || 'Sin dirección principal',
    joinDate: new Date(usuario.date_joined).toLocaleDateString('es-HN', { year: 'numeric', month: 'long', day: 'numeric' }),
    status: usuario.is_active ? 'Activa' : 'Inactiva',
  };

  return (
    <div style={{ 
      width: '100%', 
      minHeight: '100vh', 
      padding: '0px 48px 32px 48px', 
      boxSizing: 'border-box',
      backgroundColor: 'var(--bg-color)',
      color: 'var(--color-dark)',
      fontFamily: "'Roboto', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      
      <style>{`
        .patron-1 { --s: 72px; --c1: var(--white); --c2: var(--light-gray); --c3: var(--text-light); --_g: 0 120deg,#0000 0; background: conic-gradient(at calc(250%/3) calc(100%/3),var(--c3) var(--_g)), conic-gradient(from -120deg at calc( 50%/3) calc(100%/3),var(--c2) var(--_g)), conic-gradient(from  120deg at calc(100%/3) calc(250%/3),var(--c1) var(--_g)), conic-gradient(from  120deg at calc(200%/3) calc(250%/3),var(--c1) var(--_g)), conic-gradient(from -180deg at calc(100%/3) 50%,var(--c2)  60deg,var(--c1) var(--_g)), conic-gradient(from   60deg at calc(200%/3) 50%,var(--c1)  60deg,var(--c3) var(--_g)), conic-gradient(from  -60deg at 50% calc(100%/3),var(--c1) 120deg,var(--c2) 0 240deg,var(--c3) 0); background-size: calc(var(--s)*1.732) var(--s); }
        .patron-2 { --s: 200px; --c1: var(--color-dark); --c2: var(--text-light); --c3: var(--color-primary); background: repeating-conic-gradient(from 30deg,#0000 0 120deg,var(--c3) 0 50%) calc(var(--s)/2) calc(var(--s)*0.577/2), repeating-conic-gradient(from 30deg,var(--c1) 0 60deg,var(--c2) 0 120deg,var(--c3) 0 50%); background-size: var(--s) calc(var(--s)*0.577); }
        .patron-3 { --s: 150px; --c1: var(--color-warning); --c2: var(--color-dark); --_g: var(--c1) 0% 5% ,var(--c2) 6% 15%,var(--c1) 16% 25%,var(--c2) 26% 35%,var(--c1) 36% 45%,var(--c2) 46% 55%,var(--c1) 56% 65%,var(--c2) 66% 75%,var(--c1) 76% 85%,var(--c2) 86% 95%,#0000 96%; background: radial-gradient(50% 50% at 100% 0,var(--_g)), radial-gradient(50% 50% at 0 100%,var(--_g)), radial-gradient(50% 50%,var(--_g)), radial-gradient(50% 50%,var(--_g)) calc(var(--s)/2) calc(var(--s)/2) var(--c1); background-size: var(--s) var(--s); }
        .patron-4 { --s: 100px; --c1: var(--color-info); --c2: var(--color-dark); background: linear-gradient(atan(-.5),var(--c1) 33%,var(--c2) 33.5% 66.5%,var(--c1) 67%) 0/var(--s) var(--s); }
        .patron-5 { --s: 140px; --c1: var(--color-dark); --c2: var(--color-primary); --_g: #0000 52%,var(--c1) 54% 57%,#0000 59%; background: radial-gradient(farthest-side at -33.33% 50%,var(--_g)) 0 calc(var(--s)/2), radial-gradient(farthest-side at 50% 133.33%,var(--_g)) calc(var(--s)/2) 0, radial-gradient(farthest-side at 133.33% 50%,var(--_g)), radial-gradient(farthest-side at 50% -33.33%,var(--_g)), var(--c2); background-size: calc(var(--s)/4.667) var(--s),var(--s) calc(var(--s)/4.667); }
        .patron-6 { --s: 150px; --c1: var(--color-danger); --c2: var(--color-warning); --c3: var(--color-info); --c4: var(--color-primary); background: conic-gradient(from 45deg at 75% 75%, var(--c3) 90deg,var(--c1) 0 180deg,#0000 0), conic-gradient(from -45deg at 25% 25%, var(--c3) 90deg,#0000 0), conic-gradient(from -45deg at 50% 100%,#0000 180deg,var(--c3) 0), conic-gradient(from -45deg,var(--c1) 90deg, var(--c2) 0 225deg,var(--c4) 0); background-size: var(--s) var(--s); }
        .patron-7 { --s: 222px; --c1: var(--text-light); --c2: var(--light-gray); --c3: var(--white); --_g: var(--c1) 10%,var(--c2) 10.5% 19%,#0000 19.5% 80.5%,var(--c2) 81% 89.5%,var(--c3) 90%; --_c: from -90deg at 37.5% 50%,#0000 75%; --_l1: linear-gradient(145deg,var(--_g)); --_l2: linear-gradient( 35deg,var(--_g)); background: var(--_l1), var(--_l1) calc(var(--s)/2) var(--s), var(--_l2), var(--_l2) calc(var(--s)/2) var(--s), conic-gradient(var(--_c),var(--c1) 0) calc(var(--s)/8) 0, conic-gradient(var(--_c),var(--c3) 0) calc(var(--s)/2) 0, linear-gradient(90deg,var(--c3) 38%,var(--c1) 0 50%,var(--c3) 0 62%,var(--c1) 0); background-size: var(--s) calc(2*var(--s)/3); }
        .patron-8 { --s: 200px; --c1: var(--white); --c2: var(--color-info); --_g: #0000 8%,var(--c1) 0 17%,#0000 0 58%; background: linear-gradient(135deg,#0000 20.5%,var(--c1) 0 29.5%,#0000 0) 0 calc(var(--s)/4), linear-gradient( 45deg,var(--_g)) calc(var(--s)/2) 0, linear-gradient(135deg,var(--_g),var(--c1) 0 67%,#0000 0), linear-gradient( 45deg,var(--_g),var(--c1) 0 67%,#0000 0 83%,var(--c1) 0 92%,#0000 0), var(--c2); background-size: var(--s) var(--s); }
        .patron-9 { --s: 120px; --c1: var(--color-primary); --c2: var(--color-dark); --_c: var(--c1) 25%,#0000 0; --_g1: conic-gradient(at 62.5% 12.5%,var(--_c)); --_g2: conic-gradient(at 87.5% 62.5%,var(--_c)); --_g3: conic-gradient(at 25% 12.5%,var(--_c)); background: var(--_g1) calc( var(--s)/-8) calc(var(--s)/2),var(--_g1) calc(-3*var(--s)/8) calc(var(--s)/4), var(--_g2) calc(3*var(--s)/8) calc(var(--s)/4),var(--_g2) calc(  var(--s)/-8) 0, var(--_g3) 0 calc(var(--s)/-4),var(--_g3) calc(var(--s)/-4) 0, conic-gradient(at 87.5% 87.5%,var(--_c)) calc(var(--s)/8) 0 var(--c2); background-size: var(--s) var(--s); }
        .patron-10 { --s: 82px; --c1: var(--text-light); --c2: var(--white); --c3: var(--light-gray); --_g: var(--c3) 0 120deg,#0000 0; background: conic-gradient(from -60deg at 50% calc(100%/3),var(--_g)), conic-gradient(from 120deg at 50% calc(200%/3),var(--_g)), conic-gradient(from  60deg at calc(200%/3),var(--c3) 60deg,var(--c2) 0 120deg,#0000 0), conic-gradient(from 180deg at calc(100%/3),var(--c1) 60deg,var(--_g)), linear-gradient(90deg,var(--c1) calc(100%/6),var(--c2) 0 50%, var(--c1) 0 calc(500%/6),var(--c2) 0); background-size: calc(1.732*var(--s)) var(--s); }
        .patron-11 { --s: 150px; --c1: var(--color-warning); --c2: var(--color-dark); --_g: var(--c1) 6.1%,var(--c2)  6.4% 18.6%,var(--c1) 18.9% 31.1%, var(--c2) 31.4% 43.6%,var(--c1) 43.9% 56.1%,var(--c2) 56.4% 68.6%,#0000 68.9%; background: radial-gradient(var(--s) at 100% 0   ,var(--_g)), radial-gradient(var(--s) at 0    0   ,var(--_g)), radial-gradient(var(--s) at 0    100%,var(--_g)), radial-gradient(var(--s) at 100% 100%,var(--_g)) var(--c1); background-size: var(--s) var(--s); }
        .patron-12 { --s: 50px; --c1: var(--color-danger); --c2: var(--color-dark); --c3: var(--white); --_g: conic-gradient(at 50% 25%,#0000 75%,var(--c1) 0); background: var(--_g),var(--_g) var(--s) var(--s), var(--_g) calc(2*var(--s)) calc(2*var(--s)), var(--_g) calc(3*var(--s)) calc(3*var(--s)), repeating-linear-gradient(135deg,var(--c2) 0 12.5%,var(--c3) 0 25%); background-size: calc(4*var(--s)) calc(4*var(--s)); }
        .patron-13 { --s: 100px; --c1: var(--color-primary); --c2: var(--color-dark); --_g: var(--c2) 6%  14%,var(--c1) 16% 24%,var(--c2) 26% 34%,var(--c1) 36% 44%, var(--c2) 46% 54%,var(--c1) 56% 64%,var(--c2) 66% 74%,var(--c1) 76% 84%,var(--c2) 86% 94%; background: radial-gradient(100% 100% at 100% 0,var(--c1) 4%,var(--_g),#0008 96%,#0000), radial-gradient(100% 100% at 0 100%,#0000, #0008 4%,var(--_g),var(--c1) 96%) var(--c1); background-size: var(--s) var(--s); }
        .patron-14 { --s: 140px; --c1: var(--color-danger); --c2: var(--color-warning); --c3: var(--color-primary); --c4: var(--color-info); --_g: #0000 25%,#0008 47%,var(--c1)  53% 147%,var(--c2) 153% 247%, var(--c1) 253% 347%,var(--c2) 353% 447%,var(--c1) 453% 547%,#0008 553%,#0000 575%; --_s: calc(25%/3) calc(25%/4) at 50%; background: radial-gradient(var(--_s) 100%,var(--_g)), radial-gradient(var(--_s) 100%,var(--_g)) calc(var(--s)/2) calc(3*var(--s)/4), radial-gradient(var(--_s) 0   ,var(--_g)) calc(var(--s)/2) 0, radial-gradient(var(--_s) 0   ,var(--_g)) 0                calc(3*var(--s)/4), repeating-linear-gradient(90deg,var(--c3) calc(25%/-6) calc(25%/6),var(--c4) 0 calc(25%/2)); background-size: var(--s) calc(3*var(--s)/2); }
        .patron-15 { --s: 150px; --c1: var(--color-dark); --c2: var(--color-primary); background: linear-gradient(135deg,#0000 18.75%,var(--c1) 0 31.25%,#0000 0), repeating-linear-gradient(45deg,var(--c1) -6.25% 6.25%,var(--c2) 0 18.75%); background-size: var(--s) var(--s); }
        .patron-16 { --s: 34px; --c1: var(--color-warning); --c2: var(--color-info); --_g: radial-gradient(calc(var(--s)/2),var(--c1) 97%,#0000); background: var(--_g),var(--_g) calc(2*var(--s)) calc(2*var(--s)), repeating-conic-gradient(from 45deg,#0000 0 25%,var(--c2) 0 50%) calc(-.707*var(--s)) calc(-.707*var(--s)), repeating-linear-gradient(135deg,var(--c1) calc(var(--s)/-2) calc(var(--s)/2),var(--c2) 0 calc(2.328*var(--s))); background-size: calc(4*var(--s)) calc(4*var(--s)); }
        .patron-17 { --s: 100px; --c1: var(--bg-color); --c2: var(--color-dark); --_g: #0000, #0004 5%, var(--c2) 6%  14%,var(--c1) 16% 24%,var(--c2) 26% 34%,var(--c1) 36% 44%, var(--c2) 46% 54%,var(--c1) 56% 64%,var(--c2) 66% 74%,var(--c1) 76% 84%, var(--c2) 86% 94%,#0004 95%,#0000; background: radial-gradient(100% 50% at 100% 0   ,var(--_g)), radial-gradient(100% 50% at 0    50% ,var(--_g)), radial-gradient(100% 50% at 100% 100%,var(--_g)); background-size: var(--s) calc(2*var(--s)); }
        .patron-18 { --s: 100px; --c1: var(--color-danger); --c2: var(--color-dark); --_g: #0000 24%, var(--c2) 26% 34%,var(--c1) 36% 44%, var(--c2) 46% 54%,var(--c1) 56% 64%, var(--c2) 66% 74%,#0000 76%; background: radial-gradient(100% 100% at 100% 0,var(--_g)), radial-gradient(100% 100% at 0 100%,var(--_g)), radial-gradient(var(--c2) 14%,var(--c1) 16%) calc(var(--s)/2) calc(var(--s)/2); background-size: var(--s) var(--s); }
        .patron-19 { --s: 120px; --c1: var(--color-danger); --c2: var(--color-dark); background: conic-gradient(at calc(50%/3) calc(50%/3),#0000 75%,var(--c2) 0) calc(var(--s)/3) calc(var(--s)/3), conic-gradient(#0000 75%,var(--c1) 0) calc(var(--s)/6) calc(var(--s)/6), conic-gradient(at calc(250%/3) calc(250%/3),var(--c1) 75%,var(--c2) 0); background-size: var(--s) var(--s); }
        .patron-20 { --s: 37px; --c1: var(--color-primary); --c2: var(--color-warning); --c:#0000,var(--c1) .5deg 119.5deg,#0000 120deg; --g1:conic-gradient(from  60deg at 56.25% calc(425%/6),var(--c)); --g2:conic-gradient(from 180deg at 43.75% calc(425%/6),var(--c)); --g3:conic-gradient(from -60deg at 50%   calc(175%/12),var(--c)); background: var(--g1),var(--g1) var(--s) calc(1.73*var(--s)), var(--g2),var(--g2) var(--s) calc(1.73*var(--s)), var(--g3) var(--s) 0,var(--g3) 0 calc(1.73*var(--s)) var(--c2); background-size: calc(2*var(--s)) calc(3.46*var(--s)); }
      `}</style>

      {exitoMsg && (
        <div style={{ width: '100%', maxWidth: '1200px', marginBottom: '20px' }}>
          <Alert type="success" title="Listo" message={exitoMsg} onClose={() => setExitoMsg(null)} />
        </div>
      )}

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
        
        <div 
          className={selectedPattern} 
          style={{ 
            height: '150px', 
            position: 'relative',
            transition: 'background 0.5s ease'
          }} 
        >
          <button
            onClick={() => setIsPatternModalOpen(true)}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(4px)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--white)',
              zIndex: 10,
              transition: 'transform 0.2s, background 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.4)'; e.currentTarget.style.transform = 'rotate(90deg)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'rotate(0deg)'; }}
            title="Cambiar Fondo de Cabecera"
          >
            <Settings size={20} />
          </button>
        </div>

        <div style={{ padding: '0 40px', position: 'relative', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
          
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px' }}>
            
            <div style={{ position: 'relative', marginTop: '-80px', zIndex: 2 }}>
              <div style={{ 
                borderRadius: '50%', 
                border: '6px solid var(--white)', 
                backgroundColor: 'var(--white)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                position: 'relative',
                width: '140px',
                height: '140px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                {profileData.avatar ? (
                  <img 
                    src={profileData.avatar} 
                    alt="Foto de perfil" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                ) : (
                  <i className="fas fa-user" style={{ fontSize: '64px', color: 'var(--text-light)' }}></i>
                )}
              </div>
              
              <button
                onClick={() => fileInputRef.current.click()}
                disabled={isUploading}
                style={{
                  position: 'absolute',
                  bottom: '5px',
                  right: '5px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--color-primary)',
                  color: 'white',
                  border: '2px solid var(--white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                  transition: 'transform 0.2s'
                }}
                title="Subir nueva foto de perfil"
              >
                {isUploading ? <Loader size={16} className="animate-spin" /> : <Camera size={16} />}
              </button>
              
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handleFotoChange} 
                style={{ display: 'none' }} 
              />
            </div>
            
            <div style={{ paddingBottom: '16px' }}>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: 'var(--color-dark)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                {profileData.name}
                <Badge text={profileData.roleLabel} color="success" />
              </h1>
              <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: 'var(--text-light)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
                
                <span 
                  onClick={scrollToDirecciones}
                  title="Haz clic para gestionar tus direcciones"
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '6px', 
                    cursor: 'pointer', 
                    color: 'var(--color-primary)', fontWeight: '500'
                  }}
                >
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
          
          <SectionHeading title="Datos de Contacto" />

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
          
          <MisDirecciones onPrincipalChange={setDireccionPrincipal} />

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

      <Modal 
        isOpen={isPatternModalOpen} 
        onClose={() => setIsPatternModalOpen(false)} 
        title="Seleccionar Fondo de Cabecera"
        style={{ width: '800px', maxWidth: '95vw' }}
      >
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
          gap: '15px', 
          maxHeight: '60vh', 
          overflowY: 'auto',
          paddingRight: '10px'
        }}>
          {PATRONES.map((patron) => (
            <div 
              key={patron.id}
              onClick={() => handlePatternChange(patron.id)}
              style={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                alignItems: 'center'
              }}
            >
              <div 
                className={patron.id}
                style={{
                  width: '100%',
                  height: '80px',
                  borderRadius: '8px',
                  border: selectedPattern === patron.id ? '3px solid var(--color-primary)' : '1px solid var(--light-gray)',
                  boxShadow: selectedPattern === patron.id ? '0 0 0 2px var(--color-primary)' : 'none',
                  transition: 'transform 0.2s',
                  transform: selectedPattern === patron.id ? 'scale(1.05)' : 'scale(1)'
                }}
              />
              <span style={{ fontSize: '11px', textAlign: 'center', fontWeight: selectedPattern === patron.id ? 'bold' : 'normal' }}>
                {patron.nombre}
              </span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--light-gray)' }}>
          <Button variant="outline-dark" size="sm" onClick={() => setIsPatternModalOpen(false)}>
            Cerrar
          </Button>
        </div>
      </Modal>

      <Modal isOpen={modal === 'datos'} onClose={cerrarModal} title="Editar Datos Personales">
        <form onSubmit={guardarDatos} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {errorMsg && <Alert type="danger" title="Atención" message={errorMsg} onClose={() => setErrorMsg(null)} />}

          <div>
            <label style={labelStyle}>Nombre</label>
            <Input 
              name="first_name"
              value={editForm.first_name} 
              onChange={handleEditChange} 
              onBlur={handleEditBlur}
              error={editTouched.first_name && editErrors.first_name}
              icon="fa-user" 
            />
          </div>

          <div>
            <label style={labelStyle}>Apellido</label>
            <Input 
              name="last_name"
              value={editForm.last_name} 
              onChange={handleEditChange} 
              onBlur={handleEditBlur}
              error={editTouched.last_name && editErrors.last_name}
              icon="fa-user" 
            />
          </div>

          <div>
            <label style={labelStyle}>Teléfono</label>
            <Input 
              name="telefono"
              type="tel" 
              value={editForm.telefono} 
              onChange={handleEditChange} 
              onBlur={handleEditBlur}
              error={editTouched.telefono && editErrors.telefono}
              icon="fa-phone" 
              maxLength={20} 
            />
          </div>

          <div>
            <label style={labelStyle}>Fecha de Nacimiento</label>
            <Input 
              name="fecha_nacimiento"
              type="date" 
              value={editForm.fecha_nacimiento} 
              onChange={handleEditChange} 
              icon="fa-calendar" 
            />
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

          <div>
            <label style={labelStyle}>Contraseña Actual</label>
            <div style={{ position: 'relative' }}>
              <Input
                type={showActual ? 'text' : 'password'}
                value={passForm.actual}
                onChange={(e) => setPassForm({ ...passForm, actual: e.target.value })}
                icon="fa-lock"
                required
              />
              <button type="button" onClick={() => setShowActual(!showActual)} style={toggleEyeStyle}>
                <i className={`fas ${showActual ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Nueva Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Input
                type={showNueva ? 'text' : 'password'}
                value={passForm.nueva}
                onChange={(e) => setPassForm({ ...passForm, nueva: e.target.value })}
                icon="fa-lock"
                required
              />
              <button type="button" onClick={() => setShowNueva(!showNueva)} style={toggleEyeStyle}>
                <i className={`fas ${showNueva ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            
            <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <CheckItem label="8+ caracteres" isValid={passChecks.length} />
              <CheckItem label="Mayúscula" isValid={passChecks.upper} />
              <CheckItem label="Minúscula" isValid={passChecks.lower} />
              <CheckItem label="Número" isValid={passChecks.number} />
              <CheckItem label="Símbolo" isValid={passChecks.special} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Confirmar Nueva Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Input
                type={showConfirmar ? 'text' : 'password'}
                value={passForm.confirmar}
                onChange={(e) => setPassForm({ ...passForm, confirmar: e.target.value })}
                icon="fa-lock"
                required
              />
              <button type="button" onClick={() => setShowConfirmar(!showConfirmar)} style={toggleEyeStyle}>
                <i className={`fas ${showConfirmar ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            {passwordsMatch && passForm.confirmar.length > 0 && (
              <span style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '4px', display: 'block' }}>Las contraseñas coinciden.</span>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--light-gray)', marginTop: '8px' }}>
            <Button variant="outline-dark" size="sm" type="button" onClick={cerrarModal}>Cancelar</Button>
            <Button variant="primary" size="sm" type="submit" disabled={isSaving || !canSubmitPassword}>
              <Lock size={14} style={{ marginRight: '6px' }} /> {isSaving ? 'Guardando...' : 'Cambiar Contraseña'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}