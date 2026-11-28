import { useEffect, useState } from 'react';

import { Button, Modal } from '../ui';

import {
    consultarPerfilEspecializado,
    guardarPerfilEspecializado
} from '../../api/usuariosService';

const CONFIGURACIONES = {

    tecnico: {

        nombre: 'Técnico',

        inicial: {
            especialidad_tecnica: '',
            certificacion_fabricante: '',
            disponible: true
        },

        campos: [
            {
                nombre: 'especialidad_tecnica',
                etiqueta: 'Especialidad técnica',
                tipo: 'text',
                requerido: true
            },
            {
                nombre: 'certificacion_fabricante',
                etiqueta: 'Certificación del fabricante',
                tipo: 'text'
            }
        ]
    },

    piloto: {

        nombre: 'Piloto',

        inicial: {
            numero_licencia_aeronautica: '',
            horas_vuelo_acumuladas: 0,
            tipo_certificacion: '',
            disponible: true
        },

        campos: [
            {
                nombre: 'numero_licencia_aeronautica',
                etiqueta: 'Número de licencia aeronáutica',
                tipo: 'text',
                requerido: true,
                maxLength: 50
            },
            {
                nombre: 'horas_vuelo_acumuladas',
                etiqueta: 'Horas de vuelo acumuladas',
                tipo: 'number',
                requerido: true,
                min: 0,
                step: 'any'
            },
            {
                nombre: 'tipo_certificacion',
                etiqueta: 'Tipo de certificación',
                tipo: 'text',
                maxLength: 100
            }
        ]
    }
};

const estiloInput = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px',
    border: '1px solid var(--light-gray)',
    borderRadius: '6px',
    backgroundColor: 'var(--white)',
    color: 'var(--color-dark)'
};

const estiloTarjeta = {
    padding: '16px',
    border: '1px solid var(--light-gray)',
    borderRadius: '8px',
    marginBottom: '16px'
};

function obtenerError(error) {

    const datos = error.response?.data;

    if (typeof datos === 'string') {
        return datos;
    }

    if (datos?.detail) {
        return String(datos.detail);
    }

    if (datos && typeof datos === 'object') {

        return Object.entries(datos)
            .map(([campo, mensaje]) =>
                campo + ': ' + [mensaje].flat().join(' ')
            )
            .join(' | ');
    }

    return error.message
        || 'No se pudo completar la operación.';
}

export default function PerfilesUsuarioModal({
    usuario,
    onClose,
    onActualizado
}) {

    const [tipo, setTipo] = useState('tecnico');

    const configuracion = CONFIGURACIONES[tipo];

    const [formulario, setFormulario] = useState({
        ...CONFIGURACIONES.tecnico.inicial
    });

    const [existe, setExiste] = useState(false);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [listo, setListo] = useState(false);
    const [error, setError] = useState('');

    const cuentaAdministrativa =
        usuario.is_superuser === true ||
        usuario.is_staff === true ||
        usuario.roles?.includes('Administrador');

    const cuentaActiva =
        usuario.estado_cuenta === 'A' ||
        usuario.is_active === true;

    const tienePerfilEmpleado =
        Boolean(usuario.perfil_empleado) ||
        usuario.perfiles?.includes('empleado');

    const puedeGuardar =
        !cuentaAdministrativa &&
        !cuentaActiva &&
        tienePerfilEmpleado;

    useEffect(() => {

        let vigente = true;

        async function cargar() {

            setCargando(true);
            setListo(false);
            setExiste(false);
            setError('');

            setFormulario({
                ...CONFIGURACIONES[tipo].inicial
            });

            try {

                const datos =
                    await consultarPerfilEspecializado(
                        usuario.id,
                        tipo
                    );

                if (!vigente) return;

                const inicial =
                    CONFIGURACIONES[tipo].inicial;

                const valores = Object.fromEntries(
                    Object.keys(inicial).map(campo => [
                        campo,
                        datos[campo] ?? inicial[campo]
                    ])
                );

                setFormulario(valores);
                setExiste(true);
                setListo(true);

            } catch (error) {

                if (!vigente) return;

                if (error.response?.status === 404) {

                    setExiste(false);
                    setListo(true);

                } else {

                    setError(obtenerError(error));

                }

            } finally {

                if (vigente) {
                    setCargando(false);
                }

            }
        }

        cargar();

        return () => {
            vigente = false;
        };

    }, [usuario.id, tipo]);

    function cambiarTipo(nuevoTipo) {

        if (guardando || nuevoTipo === tipo) return;

        setListo(false);
        setExiste(false);
        setError('');
        setTipo(nuevoTipo);
    }

    function cambiarCampo(campo, valor) {

        setFormulario(actual => ({
            ...actual,
            [campo]: valor
        }));
    }

    function cerrar() {

        if (!guardando) {
            onClose();
        }
    }

    async function guardar(evento) {

        evento.preventDefault();

        if (
            !puedeGuardar ||
            !listo ||
            cargando ||
            guardando
        ) return;

        setError('');

        const datos = { ...formulario };

        for (const campo of configuracion.campos) {

            if (campo.tipo === 'text') {

                datos[campo.nombre] =
                    String(datos[campo.nombre] ?? '').trim();

                if (
                    campo.requerido &&
                    !datos[campo.nombre]
                ) {

                    setError(
                        campo.etiqueta + ' es obligatorio.'
                    );

                    return;
                }
            }
        }

        if (tipo === 'piloto') {

            const horas = Number(
                datos.horas_vuelo_acumuladas
            );

            if (
                datos.horas_vuelo_acumuladas === '' ||
                !Number.isFinite(horas) ||
                horas < 0
            ) {

                setError(
                    'Las horas de vuelo deben ser válidas y no negativas.'
                );

                return;
            }

            datos.horas_vuelo_acumuladas = horas;
        }

        setGuardando(true);

        try {

            await guardarPerfilEspecializado(
                usuario.id,
                tipo,
                datos
            );

            onActualizado();

        } catch (error) {

            setError(obtenerError(error));

        } finally {

            setGuardando(false);

        }
    }

    return (

        <Modal
            isOpen={true}
            onClose={cerrar}
            title="Gestionar perfiles"
            maxWidth="600px"
        >

            <h3>{usuario.nombre_completo}</h3>

            <p>{usuario.email}</p>

            <div style={{
                ...estiloTarjeta,
                marginTop: '16px'
            }}>

                <strong>Perfiles registrados</strong>

                <p style={{ marginTop: '8px' }}>
                    {usuario.perfiles?.join(', ')
                        || 'Sin perfiles'}
                </p>

            </div>

            <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '20px'
            }}>

                {Object.entries(CONFIGURACIONES).map(
                    ([clave, config]) => (

                        <Button
                            key={clave}
                            type="button"
                            variant={
                                tipo === clave
                                    ? 'primary'
                                    : 'outline-dark'
                            }
                            disabled={guardando}
                            onClick={() => cambiarTipo(clave)}
                        >
                            {config.nombre}
                        </Button>

                    )
                )}

            </div>

            {!puedeGuardar && (

                <div style={estiloTarjeta}>

                    <strong>Modo de consulta</strong>

                    {cuentaAdministrativa && (
                        <p>
                            La cuenta administrativa está protegida.
                        </p>
                    )}

                    {cuentaActiva && (
                        <p>
                            La cuenta debe estar inactiva para
                            configurar perfiles.
                        </p>
                    )}

                    {!tienePerfilEmpleado && (
                        <p>
                            El usuario necesita un perfil de empleado.
                        </p>
                    )}

                </div>

            )}

            {error && (

                <p
                    role="alert"
                    style={{
                        color: '#ef4444',
                        marginBottom: '16px'
                    }}
                >
                    {error}
                </p>

            )}

            {cargando && (
                <p>Consultando perfil...</p>
            )}

            {listo && (

                <form onSubmit={guardar}>

                    <h3 style={{ marginBottom: '8px' }}>
                        Perfil {configuracion.nombre}
                    </h3>

                    <p style={{ marginBottom: '20px' }}>

                        {existe
                            ? 'Perfil registrado'
                            : 'Perfil todavía no registrado'}

                    </p>

                    {configuracion.campos.map(campo => (

                        <label
                            key={campo.nombre}
                            style={{
                                display: 'block',
                                marginBottom: '16px'
                            }}
                        >

                            <strong>
                                {campo.etiqueta}
                            </strong>

                            <input
                                style={{
                                    ...estiloInput,
                                    marginTop: '6px'
                                }}
                                type={campo.tipo}
                                value={formulario[campo.nombre]}
                                required={campo.requerido}
                                min={campo.min}
                                step={campo.step}
                                maxLength={campo.maxLength}
                                disabled={
                                    guardando || !puedeGuardar
                                }
                                onChange={evento =>
                                    cambiarCampo(
                                        campo.nombre,
                                        evento.target.value
                                    )
                                }
                            />

                        </label>

                    ))}

                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginTop: '16px'
                    }}>

                        <input
                            type="checkbox"
                            checked={formulario.disponible}
                            disabled={
                                guardando || !puedeGuardar
                            }
                            onChange={evento =>
                                cambiarCampo(
                                    'disponible',
                                    evento.target.checked
                                )
                            }
                        />

                        Disponible

                    </label>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '12px',
                        marginTop: '24px'
                    }}>

                        <Button
                            type="button"
                            variant="outline-dark"
                            onClick={cerrar}
                            disabled={guardando}
                        >
                            Cerrar
                        </Button>

                        {puedeGuardar && (

                            <Button
                                type="submit"
                                variant="primary"
                                disabled={guardando}
                            >

                                {guardando
                                    ? 'Guardando...'
                                    : existe
                                        ? 'Guardar cambios'
                                        : 'Crear perfil'}

                            </Button>

                        )}

                    </div>

                </form>

            )}

            {!listo && (

                <div style={{ marginTop: '20px' }}>

                    <Button
                        type="button"
                        variant="outline-dark"
                        onClick={cerrar}
                    >
                        Cerrar
                    </Button>

                </div>

            )}

        </Modal>

    );
}
