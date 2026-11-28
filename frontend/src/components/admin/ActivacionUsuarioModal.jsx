import { useState } from 'react';

import { Button, Modal } from '../ui';

import { generarActivacion } from '../../api/usuariosService';

export default function ActivacionUsuarioModal({
    usuario,
    onClose
}) {

    const [enlace, setEnlace] = useState('');
    const [cargando, setCargando] = useState(false);
    const [copiado, setCopiado] = useState(false);
    const [error, setError] = useState('');

    async function generar() {

        if (cargando) return;

        setCargando(true);
        setError('');
        setCopiado(false);
        setEnlace('');

        try {

            const datos = await generarActivacion(usuario.id);

            if (!datos.uid || !datos.token) {
                throw new Error('Respuesta de activaci\u00f3n incompatible.');
            }

            const parametros = new URLSearchParams({
                uid: datos.uid,
                token: datos.token
            });

            const url =
                window.location.origin
                + '/activar-cuenta#'
                + parametros.toString();

            setEnlace(url);

        } catch (error) {

            setError(
                error.response?.data?.detail
                || error.message
                || 'No se pudo generar el enlace.'
            );

        } finally {

            setCargando(false);

        }
    }

    async function copiar() {

        try {

            await navigator.clipboard.writeText(enlace);

            setCopiado(true);

        } catch {

            setError(
                'No se pudo copiar autom\u00e1ticamente. Copie el enlace manualmente.'
            );

        }
    }

    function cerrar() {

        if (!cargando) onClose();

    }

    return (

        <Modal
            isOpen={true}
            onClose={cerrar}
            title={'Activaci\u00f3n de cuenta'}
            maxWidth="600px"
        >

            <h3>{usuario.nombre_completo}</h3>

            <p>{usuario.email}</p>

            <p style={{ marginTop: '16px' }}>
                Roles: {usuario.roles?.join(', ')}
            </p>

            <div style={{
                marginTop: '20px',
                padding: '16px',
                border: '1px solid var(--light-gray)',
                borderRadius: '8px'
            }}>

                <p>
                    El empleado debe establecer su propia
                    {' contrase\u00f1a mediante el enlace de activaci\u00f3n.'}
                </p>

                <p style={{ marginTop: '12px' }}>
                    Vigencia del enlace: 24 horas.
                </p>

                <p style={{ marginTop: '12px' }}>
                    Generar otro enlace invalida el anterior.
                </p>

            </div>

            {error && (

                <p role="alert" style={{
                    color: '#ef4444',
                    marginTop: '16px'
                }}>
                    {error}
                </p>

            )}

            {enlace && (

                <div style={{ marginTop: '20px' }}>

                    <label>

                        <strong>
                            {'Enlace de activaci\u00f3n'}
                        </strong>

                        <textarea
                            readOnly
                            value={enlace}
                            rows={4}
                            onFocus={e => e.target.select()}
                            style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                padding: '12px',
                                marginTop: '8px',
                                border: '1px solid var(--light-gray)',
                                borderRadius: '6px',
                                resize: 'vertical'
                            }}
                        />

                    </label>

                    <p style={{
                        fontSize: '13px',
                        marginTop: '8px'
                    }}>
                        Comparta este enlace solamente con
                        el empleado correspondiente.
                    </p>

                    <Button
                        type="button"
                        variant="outline-dark"
                        onClick={copiar}
                    >
                        {copiado ? 'Enlace copiado' : 'Copiar enlace'}
                    </Button>

                </div>

            )}

            <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '24px'
            }}>

                <Button
                    type="button"
                    variant="outline-dark"
                    disabled={cargando}
                    onClick={cerrar}
                >
                    Cerrar
                </Button>

                <Button
                    type="button"
                    variant="primary"
                    disabled={cargando}
                    onClick={generar}
                >
                    {cargando
                        ? 'Generando...'
                        : enlace
                            ? 'Generar nuevo enlace'
                            : 'Generar enlace'}
                </Button>

            </div>

        </Modal>

    );
}
