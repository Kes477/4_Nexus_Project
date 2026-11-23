
import { useCallback, useEffect, useState } from 'react';
import {
  obtenerEquipos,
  registrarEquipo,
} from '../../api/reparacionesService';

const formularioInicial = {
  marca: '',
  modelo: '',
  numero_serie: '',
};

export default function ClienteEquipos() {
  const [equipos, setEquipos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [guardando, setGuardando] = useState(false);
  const [erroresFormulario, setErroresFormulario] = useState({});
  const [mensaje, setMensaje] = useState('');

  const cargarEquipos = useCallback(async () => {
    setCargando(true);
    setError('');

    try {
      const respuesta = await obtenerEquipos();

      const lista = Array.isArray(respuesta)
        ? respuesta
        : Array.isArray(respuesta?.results)
          ? respuesta.results
          : [];

      setEquipos(lista);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'No se pudieron consultar tus equipos.'
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarEquipos();
  }, [cargarEquipos]);

  const cambiarCampo = (evento) => {
    const { name, value } = evento.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));

    setErroresFormulario((anterior) => ({
      ...anterior,
      [name]: undefined,
      general: undefined,
    }));
  };

  const cerrarFormulario = () => {
    if (guardando) return;

    setMostrarFormulario(false);
    setFormulario({ ...formularioInicial });
    setErroresFormulario({});
  };

  const guardarEquipo = async (evento) => {
    evento.preventDefault();

    setMensaje('');
    setErroresFormulario({});

    const marca = formulario.marca.trim();
    const modelo = formulario.modelo.trim();
    const numeroSerie = formulario.numero_serie.trim();

    const errores = {};

    if (!marca) {
      errores.marca = 'La marca es obligatoria.';
    }

    if (!modelo) {
      errores.modelo = 'El modelo es obligatorio.';
    }

    if (Object.keys(errores).length > 0) {
      setErroresFormulario(errores);
      return;
    }

    setGuardando(true);

    try {
      const datos = {
        marca,
        modelo,
        numero_serie: numeroSerie || null,
      };

      await registrarEquipo(datos);

      setFormulario({ ...formularioInicial });
      setMostrarFormulario(false);
      setMensaje('Equipo registrado correctamente.');

      await cargarEquipos();
    } catch (err) {
      const datosError = err.response?.data;

      if (datosError && typeof datosError === 'object') {
        const erroresBackend = {};

        for (const [campo, valor] of Object.entries(datosError)) {
          const texto = Array.isArray(valor)
            ? valor.join(' ')
            : typeof valor === 'string'
              ? valor
              : JSON.stringify(valor);

          if (['marca', 'modelo', 'numero_serie'].includes(campo)) {
            erroresBackend[campo] = texto;
          } else {
            erroresBackend.general = [
              erroresBackend.general,
              texto,
            ].filter(Boolean).join(' ');
          }
        }

        setErroresFormulario(
          Object.keys(erroresBackend).length > 0
            ? erroresBackend
            : { general: 'No se pudo registrar el equipo.' }
        );
      } else {
        setErroresFormulario({
          general: 'No se pudo registrar el equipo. Inténtalo nuevamente.',
        });
      }
    } finally {
      setGuardando(false);
    }
  };

  const estiloBoton = {
    padding: '12px 20px',
    borderRadius: '8px',
    border: 'none',
    background: '#00c9a7',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 600,
  };

  const estiloCampo = {
    width: '100%',
    padding: '12px',
    border: '1px solid #94a3b8',
    borderRadius: '8px',
    background: 'transparent',
    color: 'inherit',
    boxSizing: 'border-box',
  };

  const estiloError = {
    color: '#ef4444',
    fontSize: '14px',
    marginTop: '6px',
  };

  return (
    <main
      style={{
        padding: '32px',
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        boxSizing: 'border-box',
        flex: 1,
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div>
          <h1>Mis equipos registrados</h1>
          <p>Consulta y registra los equipos asociados a tu cuenta.</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={cargarEquipos}
            disabled={cargando}
            style={{
              ...estiloBoton,
              background: '#334155',
            }}
          >
            {cargando ? 'Actualizando...' : 'Actualizar equipos'}
          </button>

          <button
            type="button"
            onClick={() => {
              setMensaje('');
              setMostrarFormulario(true);
            }}
            disabled={mostrarFormulario}
            style={estiloBoton}
          >
            + Registrar equipo
          </button>
        </div>
      </header>

      {mensaje && (
        <p role="status" style={{ color: '#10b981', marginBottom: '20px' }}>
          {mensaje}
        </p>
      )}

      {mostrarFormulario && (
        <section
          style={{
            border: '1px solid #64748b',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '28px',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Registrar nuevo equipo</h2>
          <p>Completa la información del equipo que deseas registrar.</p>

          <form onSubmit={guardarEquipo} noValidate>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px',
                marginTop: '20px',
              }}
            >
              <div>
                <label htmlFor="marca-equipo">
                  Marca *
                </label>

                <input
                  id="marca-equipo"
                  name="marca"
                  type="text"
                  value={formulario.marca}
                  onChange={cambiarCampo}
                  maxLength={100}
                  placeholder="Ejemplo: DJI"
                  aria-invalid={Boolean(erroresFormulario.marca)}
                  style={{ ...estiloCampo, marginTop: '8px' }}
                />

                {erroresFormulario.marca && (
                  <p style={estiloError}>{erroresFormulario.marca}</p>
                )}
              </div>

              <div>
                <label htmlFor="modelo-equipo">
                  Modelo *
                </label>

                <input
                  id="modelo-equipo"
                  name="modelo"
                  type="text"
                  value={formulario.modelo}
                  onChange={cambiarCampo}
                  maxLength={100}
                  placeholder="Ejemplo: Mini 4 Pro"
                  aria-invalid={Boolean(erroresFormulario.modelo)}
                  style={{ ...estiloCampo, marginTop: '8px' }}
                />

                {erroresFormulario.modelo && (
                  <p style={estiloError}>{erroresFormulario.modelo}</p>
                )}
              </div>

              <div>
                <label htmlFor="serie-equipo">
                  Número de serie (opcional)
                </label>

                <input
                  id="serie-equipo"
                  name="numero_serie"
                  type="text"
                  value={formulario.numero_serie}
                  onChange={cambiarCampo}
                  maxLength={100}
                  placeholder="Ejemplo: NEXUS-PRUEBA-011"
                  aria-invalid={Boolean(erroresFormulario.numero_serie)}
                  style={{ ...estiloCampo, marginTop: '8px' }}
                />

                {erroresFormulario.numero_serie && (
                  <p style={estiloError}>
                    {erroresFormulario.numero_serie}
                  </p>
                )}
              </div>
            </div>

            {erroresFormulario.general && (
              <p role="alert" style={estiloError}>
                {erroresFormulario.general}
              </p>
            )}

            <div
              style={{
                display: 'flex',
                gap: '12px',
                marginTop: '24px',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="submit"
                disabled={guardando}
                style={estiloBoton}
              >
                {guardando ? 'Guardando...' : 'Guardar equipo'}
              </button>

              <button
                type="button"
                onClick={cerrarFormulario}
                disabled={guardando}
                style={{
                  ...estiloBoton,
                  background: '#64748b',
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      {cargando && <p>Cargando equipos...</p>}

      {error && (
        <p role="alert" style={estiloError}>
          {error}
        </p>
      )}

      {!cargando && !error && equipos.length === 0 && (
        <section
          style={{
            border: '1px solid #94a3b8',
            borderRadius: '12px',
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <h2>No tienes equipos registrados</h2>
          <p>
            Cuando registres tu primer equipo, aparecerá aquí.
          </p>
        </section>
      )}

      {!cargando && !error && equipos.length > 0 && (
        <section style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
            }}
          >
            <thead>
              <tr>
                <th style={{ padding: '14px' }}>Marca</th>
                <th style={{ padding: '14px' }}>Modelo</th>
                <th style={{ padding: '14px' }}>
                  Número de serie
                </th>
              </tr>
            </thead>

            <tbody>
              {equipos.map((equipo) => (
                <tr key={equipo.id}>
                  <td style={{ padding: '14px' }}>
                    {equipo.marca}
                  </td>
                  <td style={{ padding: '14px' }}>
                    {equipo.modelo}
                  </td>
                  <td style={{ padding: '14px' }}>
                    {equipo.numero_serie || 'No registrado'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
