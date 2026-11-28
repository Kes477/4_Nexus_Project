import { useState } from 'react';
import { Modal, Button } from '../ui';
import { editarUsuario } from '../../api/usuariosService';

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

const estiloGrid = {
    display: 'grid',
    gridTemplateColumns:
        'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px'
};

function Campo({
    etiqueta,
    nombre,
    valor,
    cambiar,
    error,
    tipo = 'text',
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

            <input
                name={nombre}
                value={valor ?? ''}
                type={tipo}
                onChange={cambiar}
                required={requerido}
                maxLength={maxLength}
                disabled={deshabilitado}
                style={estiloInput}
            />

            {error && (
                <small style={{ color: '#ef4444' }}>
                    {String(error)}
                </small>
            )}

        </label>
    );
}

export default function FormularioEdicionUsuario({
    usuario,
    onClose,
    onActualizado
}) {

    const [datos, setDatos] = useState({
        first_name: usuario.first_name || '',
        last_name: usuario.last_name || '',
        telefono: usuario.telefono || '',
        fecha_nacimiento: usuario.fecha_nacimiento || ''
    });

    const [laborales, setLaborales] = useState(
        usuario.perfil_empleado
            ? { ...usuario.perfil_empleado }
            : null
    );

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

    function cambiarLaborales(evento) {

        const { name, value } = evento.target;

        setLaborales(actual => ({
            ...actual,
            [name]: value
        }));

        setErrores(actual => ({
            ...actual,
            perfil_empleado: undefined
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

            if (laborales) {
                payload.perfil_empleado = laborales;
            }

            const actualizado = await editarUsuario(
                usuario.id,
                payload
            );

            onActualizado(actualizado);

        } catch (error) {

            const respuesta = error.response?.data;

            setErrores(
                respuesta
                && typeof respuesta === 'object'
                    ? respuesta
                    : {
                        detail: 'No fue posible guardar los cambios.'
                    }
            );

        } finally {

            setGuardando(false);
        }
    }

    return (

        <Modal
            isOpen={true}
            onClose={() => {
                if (!guardando) onClose();
            }}
            title="Editar usuario"
        >

            <form
                onSubmit={guardar}
                style={{
                    maxHeight: '70vh',
                    overflowY: 'auto',
                    paddingRight: '6px'
                }}
            >

                <p style={{
                    color: 'var(--text-light)',
                    marginBottom: '20px'
                }}>
                    Usuario #{usuario.id} - {usuario.email}
                </p>

                <h3>Información personal</h3>

                <div style={estiloGrid}>

                    <Campo
                        etiqueta="Nombres"
                        nombre="first_name"
                        valor={datos.first_name}
                        cambiar={cambiar}
                        error={errores.first_name}
                        maxLength={100}
                        deshabilitado={guardando}
                    />

                    <Campo
                        etiqueta="Apellidos"
                        nombre="last_name"
                        valor={datos.last_name}
                        cambiar={cambiar}
                        error={errores.last_name}
                        maxLength={100}
                        deshabilitado={guardando}
                    />

                    <Campo
                        etiqueta="Teléfono"
                        nombre="telefono"
                        valor={datos.telefono}
                        cambiar={cambiar}
                        error={errores.telefono}
                        requerido={false}
                        tipo="tel"
                        maxLength={20}
                        deshabilitado={guardando}
                    />

                    <Campo
                        etiqueta="Fecha de nacimiento"
                        nombre="fecha_nacimiento"
                        valor={datos.fecha_nacimiento}
                        cambiar={cambiar}
                        error={errores.fecha_nacimiento}
                        tipo="date"
                        requerido={false}
                        deshabilitado={guardando}
                    />

                </div>

                {laborales && (

                    <section style={{ marginTop: '24px' }}>

                        <h3>Información laboral</h3>

                        <div style={estiloGrid}>

                            <Campo
                                etiqueta="Código de empleado"
                                nombre="codigo_empleado"
                                valor={laborales.codigo_empleado}
                                cambiar={cambiarLaborales}
                                error={errores.perfil_empleado?.codigo_empleado}
                                maxLength={20}
                                deshabilitado={guardando}
                            />

                            <Campo
                                etiqueta="Cargo"
                                nombre="cargo"
                                valor={laborales.cargo}
                                cambiar={cambiarLaborales}
                                error={errores.perfil_empleado?.cargo}
                                maxLength={100}
                                deshabilitado={guardando}
                            />

                            <Campo
                                etiqueta="Fecha de ingreso"
                                nombre="fecha_ingreso"
                                valor={laborales.fecha_ingreso}
                                cambiar={cambiarLaborales}
                                error={errores.perfil_empleado?.fecha_ingreso}
                                tipo="date"
                                deshabilitado={guardando}
                            />

                        </div>

                    </section>
                )}

                {Object.keys(errores).length > 0 && (

                    <div
                        role="alert"
                        style={{
                            color: '#ef4444',
                            marginTop: '16px',
                            fontSize: '13px'
                        }}
                    >
                        {Object.entries(errores).map(
                            ([campo, error]) => error && (
                                <p key={campo}>
                                    {campo}: {
                                        typeof error === 'object'
                                            ? JSON.stringify(error)
                                            : String(error)
                                    }
                                </p>
                            )
                        )}
                    </div>

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
                            ? 'Guardando...'
                            : 'Guardar cambios'}
                    </Button>

                </div>

            </form>

        </Modal>
    );
}
