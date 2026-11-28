import { useState } from 'react';

import { Modal, Button } from '../ui';
import { cambiarEstadoUsuario } from '../../api/usuariosService';

const ESTADOS = {
    A: 'Activo',
    I: 'Inactivo',
    S: 'Suspendido',
    B: 'Bloqueado'
};

const estiloInput = {
    width: '100%',
    padding: '12px',
    border: '1px solid var(--light-gray)',
    borderRadius: '6px',
    backgroundColor: 'var(--bg-color)',
    color: 'var(--color-dark)',
    boxSizing: 'border-box',
    colorScheme: 'light dark'
};

export default function FormularioEstadoUsuario({
    usuario,
    onClose,
    onActualizado
}) {

    const [estado, setEstado] = useState('');
    const [motivo, setMotivo] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [errores, setErrores] = useState({});

    const estadosDisponibles = Object.entries(
        ESTADOS
    ).filter(
        ([codigo]) => codigo !== usuario.estado_cuenta
    );

    const formularioValido =
        estado !== ''
        && estado !== usuario.estado_cuenta
        && motivo.trim().length >= 5
        && motivo.trim().length <= 500;

    async function guardar(evento) {

        evento.preventDefault();

        if (guardando || !formularioValido) {
            return;
        }

        setGuardando(true);
        setErrores({});

        try {

            const actualizado = await cambiarEstadoUsuario(
                usuario.id,
                estado,
                motivo.trim()
            );

            onActualizado(actualizado);

        } catch (error) {

            const respuesta = error.response?.data;

            setErrores(
                respuesta
                && typeof respuesta === 'object'
                    ? respuesta
                    : {
                        detail: 'No fue posible cambiar el estado.'
                    }
            );

        } finally {

            setGuardando(false);
        }
    }

    return (

        <Modal
            isOpen={true}
            title="Gestionar estado de cuenta"
            onClose={() => {
                if (!guardando) onClose();
            }}
        >

            <form
                onSubmit={guardar}
                style={{
                    maxHeight: '70vh',
                    overflowY: 'auto'
                }}
            >

                <h3>{usuario.nombre_completo}</h3>

                <p style={{
                    color: 'var(--text-light)',
                    marginBottom: '20px'
                }}>
                    {usuario.email}
                </p>

                <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--bg-color)',
                    borderRadius: '6px',
                    marginBottom: '20px'
                }}>

                    <strong>Estado actual: </strong>

                    {ESTADOS[usuario.estado_cuenta]}

                </div>

                <label style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    marginBottom: '20px'
                }}>

                    Nuevo estado *

                    <select
                        value={estado}
                        onChange={e => setEstado(e.target.value)}
                        disabled={guardando}
                        required
                        style={estiloInput}
                    >

                        <option value="">
                            Seleccionar estado
                        </option>

                        {estadosDisponibles.map(
                            ([codigo, nombre]) => (

                                <option
                                    key={codigo}
                                    value={codigo}
                                >
                                    {nombre}
                                </option>

                            )
                        )}

                    </select>

                </label>

                <label style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                }}>

                    Motivo del cambio *

                    <textarea
                        value={motivo}
                        onChange={e => setMotivo(e.target.value)}
                        placeholder="Escriba el motivo del cambio..."
                        rows={4}
                        minLength={5}
                        maxLength={500}
                        disabled={guardando}
                        required
                        style={{
                            ...estiloInput,
                            resize: 'vertical'
                        }}
                    />

                    <small style={{
                        textAlign: 'right',
                        color: 'var(--text-light)'
                    }}>
                        {motivo.length}/500
                    </small>

                </label>

                {estado === 'A' && (

                    <p style={{
                        padding: '12px',
                        backgroundColor: 'var(--bg-color)',
                        borderRadius: '6px',
                        fontSize: '13px',
                        marginTop: '16px'
                    }}>
                        Para habilitar la cuenta, el usuario debe
                        tener una contraseña válida y al menos
                        un rol asignado.
                    </p>

                )}

                {Object.keys(errores).length > 0 && (

                    <div
                        role="alert"
                        style={{
                            color: '#ef4444',
                            marginTop: '16px'
                        }}
                    >

                        {Object.entries(errores).map(
                            ([campo, error]) => (

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
                        disabled={
                            guardando || !formularioValido
                        }
                    >
                        {guardando
                            ? 'Guardando...'
                            : 'Guardar estado'}
                    </Button>

                </div>

            </form>

        </Modal>
    );
}
