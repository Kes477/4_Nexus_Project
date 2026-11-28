import { useEffect, useState } from 'react';
import { Edit2, MapPin, Plus, Save, Star, Trash2 } from 'lucide-react';

import { Alert, Badge, Button, Input, Modal, SectionHeading } from '../ui';
import {
  actualizarDireccion,
  crearDireccion,
  eliminarDireccion,
  obtenerDirecciones,
  obtenerUbicacion,
  obtenerUbicaciones,
} from '../../api/direccionService';
import { primerError } from '../../utils/errores';

const TIPOS = [
  { value: 'casa', label: 'Casa' },
  { value: 'trabajo', label: 'Trabajo' },
  { value: 'finca', label: 'Finca / Terreno' },
  { value: 'otro', label: 'Otro' },
];
const ETIQUETA_TIPO = Object.fromEntries(TIPOS.map((t) => [t.value, t.label]));

const REGEX = {
  direccion: /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,#\-]{5,255}$/,
  codigoPostal: /^\d{5}$/,
};

const FORM_VACIO = {
  departamento: '',
  ubicacion: '',
  linea_direccion1: '',
  linea_direccion2: '',
  codigo_postal: '',
  tipo_direccion: 'casa',
  es_principal: false,
};

const labelStyle = {
  display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-light)',
  marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px',
};
const selectStyle = {
  width: '100%', padding: '12px 15px', borderRadius: '6px', fontSize: '15px',
  border: '1px solid var(--light-gray)', background: 'var(--white)', color: 'var(--color-dark)',
};
const tarjetaStyle = {
  padding: '20px', backgroundColor: 'var(--white)', border: '1px solid var(--light-gray)',
  borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '6px',
  boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
};
const textoSuave = { fontSize: '13px', color: 'var(--text-light)' };

export default function MisDirecciones({ onPrincipalChange }) {
  const [direcciones, setDirecciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorLista, setErrorLista] = useState(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [errorForm, setErrorForm] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    let activo = true;

    obtenerDirecciones()
      .then((datos) => {
        if (!activo) return;
        setDirecciones(datos);
        onPrincipalChange?.(datos.find((d) => d.es_principal) ?? null);
      })
      .catch(() => activo && setErrorLista('No se pudieron cargar tus direcciones.'))
      .finally(() => activo && setCargando(false));

    return () => { activo = false; };
  }, [onPrincipalChange]);

  const recargar = async () => {
    const datos = await obtenerDirecciones();
    setDirecciones(datos);
    onPrincipalChange?.(datos.find((d) => d.es_principal) ?? null);
  };

  const cargarDepartamentos = async () => {
    if (departamentos.length === 0) {
      setDepartamentos(await obtenerUbicaciones({ tipo__nombre: 'Departamento' }));
    }
  };

  const elegirDepartamento = async (departamentoId) => {
    setForm((actual) => ({ ...actual, departamento: departamentoId, ubicacion: '' }));
    setMunicipios(departamentoId ? await obtenerUbicaciones({ padre: departamentoId }) : []);
  };

  const validateField = (field, value) => {
    if (field === 'linea_direccion1' && !value.trim()) return 'La dirección es obligatoria.';
    if (field === 'linea_direccion1' && !REGEX.direccion.test(value)) return 'Ingresa una dirección válida (mín. 5 caracteres).';
    if (field === 'codigo_postal' && value && !REGEX.codigoPostal.test(value)) return 'El código postal debe tener 5 dígitos.';
    return '';
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });
    setErrors({ ...errors, [name]: validateField(name, value) });
  };

  const cambiar = (campo) => (e) => {
    const value = e.target.value;
    setForm({ ...form, [campo]: value });
    if (errors[campo]) {
      setErrors({ ...errors, [campo]: validateField(campo, value) });
    }
  };

  const abrirNueva = async () => {
    setEditandoId(null);
    setForm(FORM_VACIO);
    setMunicipios([]);
    setErrorForm(null);
    setErrors({});
    setTouched({});
    setModalAbierto(true);
    try {
      await cargarDepartamentos();
    } catch {
      setErrorForm('No se pudieron cargar los departamentos.');
    }
  };

  const abrirEditar = async (direccion) => {
    setEditandoId(direccion.id);
    setErrorForm(null);
    setErrors({});
    setTouched({});
    setModalAbierto(true);
    try {
      await cargarDepartamentos();
      
      if (direccion.ubicacion) {
        const municipio = await obtenerUbicacion(direccion.ubicacion);
        setMunicipios(await obtenerUbicaciones({ padre: municipio.padre }));
        setForm({
          departamento: String(municipio.padre),
          ubicacion: String(direccion.ubicacion),
          linea_direccion1: direccion.linea_direccion1,
          linea_direccion2: direccion.linea_direccion2,
          codigo_postal: direccion.codigo_postal,
          tipo_direccion: direccion.tipo_direccion,
          es_principal: direccion.es_principal,
        });
      } else {
        setMunicipios([]);
        setForm({
          departamento: '',
          ubicacion: '',
          linea_direccion1: direccion.linea_direccion1,
          linea_direccion2: direccion.linea_direccion2,
          codigo_postal: direccion.codigo_postal,
          tipo_direccion: direccion.tipo_direccion,
          es_principal: direccion.es_principal,
        });
      }
    } catch {
      setErrorForm('No se pudo cargar la dirección.');
    }
  };

  const cerrar = () => {
    setModalAbierto(false);
    setErrorForm(null);
    setErrors({});
    setTouched({});
  };

  const guardar = async (e) => {
    e.preventDefault();
    setErrorForm(null);

    const newErrors = {};
    ['linea_direccion1', 'codigo_postal'].forEach(field => {
      const error = validateField(field, form[field]);
      if (error) newErrors[field] = error;
      setTouched(prev => ({ ...prev, [field]: true }));
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const { departamento: _departamento, ...datos } = form;

    if (!datos.ubicacion) {
      datos.ubicacion = null;
    }

    setGuardando(true);
    try {
      if (editandoId) {
        await actualizarDireccion(editandoId, datos);
      } else {
        await crearDireccion(datos);
      }
      await recargar();
      cerrar();
    } catch (error) {
      setErrorForm(primerError(error));
    } finally {
      setGuardando(false);
    }
  };

  const hacerPrincipal = async (id) => {
    setErrorLista(null);
    try {
      await actualizarDireccion(id, { es_principal: true });
      await recargar();
    } catch (error) {
      setErrorLista(primerError(error));
    }
  };

  const borrar = async (direccion) => {
    if (!window.confirm(`¿Eliminar la dirección "${direccion.linea_direccion1}"?`)) return;
    setErrorLista(null);
    try {
      await eliminarDireccion(direccion.id);
      await recargar();
    } catch (error) {
      setErrorLista(primerError(error));
    }
  };

  return (
    <section id="mis-direcciones" style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
        <SectionHeading title="Mis Direcciones" />
        <Button variant="outline-dark" size="sm" onClick={abrirNueva}>
          <Plus size={14} style={{ marginRight: '6px' }} /> Agregar Dirección
        </Button>
      </div>

      {errorLista && (
        <div style={{ marginBottom: '16px' }}>
          <Alert type="danger" title="Atención" message={errorLista} onClose={() => setErrorLista(null)} />
        </div>
      )}

      {cargando && <p style={textoSuave}>Cargando direcciones...</p>}

      {!cargando && direcciones.length === 0 && (
        <p style={textoSuave}>Aún no tienes direcciones. Agrega una para recibir pedidos o servicios en campo.</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {direcciones.map((d) => (
          <div
            key={d.id}
            style={{ ...tarjetaStyle, borderColor: d.es_principal ? 'var(--color-primary)' : 'var(--light-gray)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <span style={{ ...labelStyle, marginBottom: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} color="var(--color-primary)" /> {ETIQUETA_TIPO[d.tipo_direccion] ?? d.tipo_direccion}
              </span>
              {d.es_principal && <Badge text="Principal" color="success" />}
            </div>

            <strong style={{ color: 'var(--color-dark)' }}>{d.linea_direccion1}</strong>
            {d.linea_direccion2 && <span style={textoSuave}>{d.linea_direccion2}</span>}
            
            {d.ubicacion_texto && <span style={textoSuave}>{d.ubicacion_texto}</span>}

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
              {!d.es_principal && (
                <Button variant="outline-dark" size="sm" onClick={() => hacerPrincipal(d.id)}>
                  <Star size={14} style={{ marginRight: '6px' }} /> Hacer principal
                </Button>
              )}
              <Button variant="outline-dark" size="sm" onClick={() => abrirEditar(d)}>
                <Edit2 size={14} style={{ marginRight: '6px' }} /> Editar
              </Button>
              <Button variant="danger" size="sm" onClick={() => borrar(d)}>
                <Trash2 size={14} style={{ marginRight: '6px' }} /> Eliminar
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modalAbierto} onClose={cerrar} title={editandoId ? 'Editar Dirección' : 'Nueva Dirección'}>
        <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {errorForm && <Alert type="danger" title="Atención" message={errorForm} onClose={() => setErrorForm(null)} />}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Departamento</label>
              <select style={selectStyle} value={form.departamento} onChange={(e) => elegirDepartamento(e.target.value)}>
                <option value="">Opcional</option>
                {departamentos.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Municipio</label>
              <select style={selectStyle} value={form.ubicacion} onChange={cambiar('ubicacion')} disabled={!form.departamento}>
                <option value="">Opcional</option>
                {municipios.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Dirección exacta</label>
            <Input 
              name="linea_direccion1"
              value={form.linea_direccion1} 
              onChange={cambiar('linea_direccion1')} 
              onBlur={handleBlur}
              error={touched.linea_direccion1 && errors.linea_direccion1}
              icon="fa-map-marker-alt" 
              placeholder="Colonia, calle, número de casa o referencia" 
              maxLength={255} 
            />
          </div>

          <div>
            <label style={labelStyle}>Referencia (opcional)</label>
            <Input 
              name="linea_direccion2"
              value={form.linea_direccion2} 
              onChange={cambiar('linea_direccion2')} 
              icon="fa-info-circle" 
              placeholder="Frente a la pulpería, portón negro..." 
              maxLength={255} 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Tipo de lugar</label>
              <select style={selectStyle} value={form.tipo_direccion} onChange={cambiar('tipo_direccion')}>
                {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Código postal</label>
              <Input 
                name="codigo_postal"
                value={form.codigo_postal} 
                onChange={cambiar('codigo_postal')} 
                onBlur={handleBlur}
                error={touched.codigo_postal && errors.codigo_postal}
                icon="fa-envelope" 
                placeholder="Opcional"
                maxLength={5} 
              />
            </div>
          </div>

          {!(editandoId && form.es_principal) && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', marginTop: '8px' }}>
              <input
                type="checkbox"
                checked={form.es_principal}
                onChange={(e) => setForm({ ...form, es_principal: e.target.checked })}
              />
              Usar como dirección principal
            </label>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--light-gray)', marginTop: '8px' }}>
            <Button variant="outline-dark" size="sm" type="button" onClick={cerrar}>Cancelar</Button>
            <Button variant="primary" size="sm" type="submit" disabled={guardando}>
              <Save size={14} style={{ marginRight: '6px' }} /> {guardando ? 'Guardando...' : 'Guardar Dirección'}
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}