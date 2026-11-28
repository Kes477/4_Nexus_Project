import { useState } from 'react';

import { Modal, Button } from '../ui';
import { registrarEmpleado } from '../../api/usuariosService';

const DATOS_INICIALES = {
    first_name: '',
    last_name: '',
    no_identificacion: '',
    telefono: '',
    email: '',
    fecha_nacimiento: '',
    codigo_empleado: '',
    cargo: '',
    fecha_ingreso: ''
};

const estiloInput = {
    width: '100%',
    padding: '11px',
    border: '1px solid var(--light-gray)',
    borderRadius: '6px',
    backgroundColor: 'var(--bg-color)',
    color: 'var(--color-dark)',
    boxSizing: 'border-box',
    colorScheme: 'light dark'
};

function Campo({
    nombre,
    etiqueta,
    tipo = 'text',
    datos,
    cambiar,
    errores,
    requerido = true,
    maxLength,
    deshabilitado
}) {

    return (
        <label style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontSize: '14px'
        }}>

            {etiqueta}
            {requerido ? ' *' : ''}

            <input
                name={nombre}
                type={tipo}
                value={datos[nombre]}
                onChange={cambiar}
                required={requerido}
                maxLength={maxLength}
                disabled={deshabilitado}
                style={estiloInput}
            />

            {errores[nombre] && (
                <small style={{ color: '#ef4444' }}>
                    {String(errores[nombre])}
                </small>
            )}

        </label>
    );
}

export default function FormularioEmpleado({
    onClose,
    onRegistrado
}) {

    const [datos, setDatos] = useState({
        ...DATOS_INICIALES
    });

    const [errores, setErrores] = useState({});
    const [guardando, setGuardando] = useState(false);

    function cambiar(evento) {

        const { name, value } = evento.target;

        setDatos(actual => ({
            ...actual,
            [name]: value
        }));

        setErrores(actual => ({
            ...actual,
            [name]: undefined
        }));
    }

    async function guardar(evento) {

        evento.preventDefault();

        if (guardando) return;

        setGuardando(true);
        setErrores({});

        try {

            const payload = {
                ...datos,
                fecha_nacimiento:
                    datos.fecha_nacimiento || null
            };

            const empleado = await registrarEmpleado(
                payload
            );

            onRegistrado(empleado);

        } catch (error) {

            const respuesta = error.response?.data;

            setErrores(
                respuesta
                && typeof respuesta === 'object'
                    ? respuesta
                    : {
                        detail: 'No fue posible registrar al empleado.'
                    }
            );

        } finally {

            setGuardando(false);
        }
    }

    const campos = {
        datos,
        cambiar,
        errores,
        deshabilitado: guardando
    };

    const estiloGrid = {
        display: 'grid',
        gridTemplateColumns:
            'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px'
    };

    return (

        <Modal
            isOpen={true}
            onClose={() => {
                if (!guardando) onClose();
            }}
            title="Registrar empleado"
        >

            <form onSubmit={guardar}>

                <h3>Información personal</h3>

                <div style={estiloGrid}>

                    <Campo
                        {...campos}
                        nombre="first_name"
                        etiqueta="Nombres"
                        maxLength={100}
                    />

                    <Campo
                        {...campos}
                        nombre="last_name"
                        etiqueta="Apellidos"
                        maxLength={100}
                    />

                    <Campo
                        {...campos}
                        nombre="no_identificacion"
                        etiqueta="Identificación"
                        maxLength={20}
                    />

                    <Campo
                        {...campos}
                        nombre="telefono"
                        etiqueta="Teléfono"
                        tipo="tel"
                        maxLength={20}
                        requerido={false}
                    />

                    <Campo
                        {...campos}
                        nombre="email"
                        etiqueta="Correo electrónico"
                        tipo="email"
                        maxLength={255}
                    />

                    <Campo
                        {...campos}
                        nombre="fecha_nacimiento"
                        etiqueta="Fecha de nacimiento"
                        tipo="date"
                        requerido={false}
                    />

                </div>

                <h3 style={{ marginTop: '24px' }}>
                    Información laboral
                </h3>

                <div style={estiloGrid}>

                    <Campo
                        {...campos}
                        nombre="codigo_empleado"
                        etiqueta="Código de empleado"
                        maxLength={20}
                    />

                    <Campo
                        {...campos}
                        nombre="cargo"
                        etiqueta="Cargo"
                        maxLength={100}
                    />

                    <Campo
                        {...campos}
                        nombre="fecha_ingreso"
                        etiqueta="Fecha de ingreso"
                        tipo="date"
                    />

                </div>

                <p style={{
                    padding: '12px',
                    backgroundColor: 'var(--bg-color)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    marginTop: '24px'
                }}>
                    La cuenta se creará como inactiva.
                    Deberás asignarle roles antes de activarla.
                </p>

                {(errores.detail || errores.non_field_errors) && (
                    <p role="alert" style={{ color: '#ef4444' }}>
                        {String(
                            errores.detail
                            || errores.non_field_errors
                        )}
                    </p>
                )}

                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginTop: '24px'
                }}>

                    <Button
                        type="button"
                        variant="outline-dark"
                        onClick={onClose}
                        disabled={guardando}
                    >
                        Cancelar
                    </Button>

                    <Button
                        type="submit"
                        variant="primary"
                        disabled={guardando}
                    >
                        {guardando
                            ? 'Registrando...'
                            : 'Registrar empleado'}
                    </Button>

                </div>

            </form>

        </Modal>
    );
}
