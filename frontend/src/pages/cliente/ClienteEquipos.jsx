import { useCallback, useEffect, useState } from 'react';

import {
  obtenerEquipos,
  registrarEquipo,
} from '../../api/reparacionesService';

import FormularioSolicitudReparacion from './FormularioSolicitudReparacion';

// ======================================================
// VALORES INICIALES
// ======================================================

const formularioInicial = {
  marca: '',
  modelo: '',
  numero_serie: '',
};

export default function ClienteEquipos() {

  // ======================================================
  // ESTADOS
  // ======================================================

  const [equipos, setEquipos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [guardando, setGuardando] = useState(false);
  const [erroresFormulario, setErroresFormulario] = useState({});
  const [mensaje, setMensaje] = useState('');

  // HU-012: Equipo seleccionado para reparación.

  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);

  const formularioActivo =
    mostrarFormulario || Boolean(equipoSeleccionado);

  // ======================================================
  // HU-010: CONSULTAR EQUIPOS
  // ======================================================

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

  // ======================================================
  // HU-011: REGISTRAR EQUIPOS
  // ======================================================

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

    if (guardando) return;

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

      setMensaje(
        'Equipo registrado correctamente.'
      );

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
            : {
                general: 'No se pudo registrar el equipo.',
              }
        );

      } else {
        setErroresFormulario({
          general:
            'No se pudo registrar el equipo. Inténtalo nuevamente.',
        });
      }

    } finally {
      setGuardando(false);
    }
  };

  // ======================================================
  // HU-012: SOLICITAR REPARACIÓN
  // ======================================================

  const abrirSolicitudReparacion = (equipo) => {
    if (formularioActivo) return;

    setMensaje('');
    setEquipoSeleccionado(equipo);
  };

  const cancelarSolicitudReparacion = () => {
    setEquipoSeleccionado(null);
  };

  const manejarSolicitudCreada = (orden) => {
    setEquipoSeleccionado(null);

    setMensaje(
      `Solicitud #${orden.id} registrada correctamente. Estado: ${orden.estado}.`
    );
  };

  // ======================================================
  // ESTILOS
  // ======================================================

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

  // ======================================================
  // INTERFAZ
  // ======================================================

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

      {/* ENCABEZADO */}

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

          <p>
            Consulta y registra los equipos asociados a tu cuenta.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >

          <button
            type="button"
            onClick={cargarEquipos}
            disabled={cargando || formularioActivo}
            style={{
              ...estiloBoton,
              background: '#334155',
            }}
          >
            {cargando
              ? 'Actualizando...'
              : 'Actualizar equipos'}
          </button>

          <button
            type="button"
            onClick={() => {
              setMensaje('');
              setMostrarFormulario(true);
            }}
            disabled={formularioActivo}
            style={{
              ...estiloBoton,
              opacity: formularioActivo ? 0.5 : 1,
              cursor: formularioActivo
                ? 'not-allowed'
                : 'pointer',
            }}
          >
            + Registrar equipo
          </button>

        </div>
      </header>

      {/* MENSAJES DE CONFIRMACIÓN */}

      {mensaje && (
        <p
          role="status"
          style={{
            color: '#10b981',
            marginBottom: '20px',
          }}
        >
          {mensaje}
        </p>
      )}

      {/* HU-012: FORMULARIO DE SOLICITUD DE REPARACIÓN */}

      {equipoSeleccionado && (
        <FormularioSolicitudReparacion
          key={equipoSeleccionado.id}
          equipo={equipoSeleccionado}
          onCancelar={cancelarSolicitudReparacion}
          onSolicitudCreada={manejarSolicitudCreada}
        />
      )}

      {/* HU-011: FORMULARIO DE REGISTRO DE EQUIPO */}

      {mostrarFormulario && (
        <section
          style={{
            border: '1px solid #64748b',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '28px',
          }}
        >

          <h2 style={{ marginTop: 0 }}>
            Registrar nuevo equipo
          </h2>

          <p>
            Completa la información del equipo que deseas registrar.
          </p>

          <form onSubmit={guardarEquipo} noValidate>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px',
                marginTop: '20px',
              }}
            >

              {/* MARCA */}

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
                  disabled={guardando}
                  aria-invalid={
                    Boolean(erroresFormulario.marca)
                  }
                  style={{
                    ...estiloCampo,
                    marginTop: '8px',
                  }}
                />

                {erroresFormulario.marca && (
                  <p style={estiloError}>
                    {erroresFormulario.marca}
                  </p>
                )}
              </div>

              {/* MODELO */}

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
                  disabled={guardando}
                  aria-invalid={
                    Boolean(erroresFormulario.modelo)
                  }
                  style={{
                    ...estiloCampo,
                    marginTop: '8px',
                  }}
                />

                {erroresFormulario.modelo && (
                  <p style={estiloError}>
                    {erroresFormulario.modelo}
                  </p>
                )}
              </div>

              {/* NÚMERO DE SERIE */}

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
                  disabled={guardando}
                  aria-invalid={
                    Boolean(erroresFormulario.numero_serie)
                  }
                  style={{
                    ...estiloCampo,
                    marginTop: '8px',
                  }}
                />

                {erroresFormulario.numero_serie && (
                  <p style={estiloError}>
                    {erroresFormulario.numero_serie}
                  </p>
                )}
              </div>

            </div>

            {/* ERRORES GENERALES */}

            {erroresFormulario.general && (
              <p role="alert" style={estiloError}>
                {erroresFormulario.general}
              </p>
            )}

            {/* BOTONES DE REGISTRO */}

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
                style={{
                  ...estiloBoton,
                  opacity: guardando ? 0.5 : 1,
                }}
              >
                {guardando
                  ? 'Guardando...'
                  : 'Guardar equipo'}
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

      {/* ESTADO DE CARGA */}

      {cargando && (
        <p>Cargando equipos...</p>
      )}

      {/* ERROR DE CONSULTA */}

      {error && (
        <p role="alert" style={estiloError}>
          {error}
        </p>
      )}

      {/* LISTA VACÍA */}

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

      {/* HU-010: TABLA DE EQUIPOS */}

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

                <th style={{ padding: '14px' }}>
                  Marca
                </th>

                <th style={{ padding: '14px' }}>
                  Modelo
                </th>

                <th style={{ padding: '14px' }}>
                  Número de serie
                </th>

                <th style={{ padding: '14px' }}>
                  Acciones
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

                  {/* HU-012: ACCIÓN DE REPARACIÓN */}

                  <td style={{ padding: '14px' }}>

                    <button
                      type="button"
                      disabled={formularioActivo}
                      onClick={() =>
                        abrirSolicitudReparacion(equipo)
                      }
                      style={{
                        ...estiloBoton,
                        whiteSpace: 'nowrap',
                        opacity: formularioActivo ? 0.5 : 1,
                        cursor: formularioActivo
                          ? 'not-allowed'
                          : 'pointer',
                      }}
                    >

                      Solicitar reparación

                    </button>

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