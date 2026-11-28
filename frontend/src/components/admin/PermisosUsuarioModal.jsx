import { useEffect, useState } from 'react';

import { Button, Modal } from '../ui';

import {
    consultarPermisosUsuario
} from '../../api/usuariosService';

import {
    ETIQUETAS_PERMISOS
} from '../../config/permisos';

const tarjeta = {
    padding: '16px',
    border: '1px solid var(--light-gray)',
    borderRadius: '8px',
    marginBottom: '10px'
};

function ListaPermisos({ permisos }) {

    if (permisos.length === 0) {
        return (
            <p style={{ color: 'var(--text-light)' }}>
                Sin permisos asignados.
            </p>
        );
    }

    return (

        <div style={tarjeta}>

            {permisos.map(codigo => (

                <div
                    key={codigo}
                    style={{
                        padding: '10px 0',
                        borderBottom:
                            '1px solid var(--light-gray)',
                        overflowWrap: 'anywhere'
                    }}
                >

                    <strong>
                        {ETIQUETAS_PERMISOS[codigo]
                            || codigo}
                    </strong>

                    {ETIQUETAS_PERMISOS[codigo] && (

                        <div style={{
                            fontSize: '12px',
                            color: 'var(--text-light)'
                        }}>
                            {codigo}
                        </div>

                    )}

                </div>

            ))}

        </div>
    );
}

function Seccion({ titulo, permisos }) {

    return (

        <section style={{ marginTop: '20px' }}>

            <h3 style={{ marginBottom: '10px' }}>
                {titulo} ({permisos.length})
            </h3>

            <ListaPermisos permisos={permisos} />

        </section>

    );
}

export default function PermisosUsuarioModal({
    usuario,
    onClose
}) {

    const [datos, setDatos] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {

        let vigente = true;

        async function cargar() {

            setCargando(true);
            setDatos(null);
            setError('');

            try {

                const respuesta =
                    await consultarPermisosUsuario(usuario.id);

                if (!vigente) return;

                const campos = [
                    'roles',
                    'permisos_directos',
                    'permisos_heredados',
                    'permisos_efectivos'
                ];

                if (
                    !respuesta ||
                    !campos.every(
                        campo => Array.isArray(respuesta[campo])
                    ) ||
                    !respuesta.roles.every(
                        rol => Array.isArray(rol.permisos)
                    )
                ) {

                    throw new Error(
                        'Respuesta de permisos incompatible.'
                    );

                }

                setDatos(respuesta);

            } catch (error) {

                if (vigente) {

                    setError(
                        error.response?.data?.detail
                        || error.message
                        || 'No se pudieron consultar los permisos.'
                    );

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

    }, [usuario.id]);

    return (

        <Modal
            isOpen={true}
            onClose={onClose}
            title="Permisos del usuario"
            maxWidth="650px"
        >

            <h3>{usuario.nombre_completo}</h3>

            <p>{usuario.email}</p>

            {cargando && (
                <p style={{ marginTop: '20px' }}>
                    Consultando permisos...
                </p>
            )}

            {error && (

                <p
                    role="alert"
                    style={{
                        color: '#ef4444',
                        marginTop: '20px'
                    }}
                >
                    {error}
                </p>

            )}

            {datos && (

                <>

                    <p style={{
                        marginTop: '12px',
                        color: datos.is_active
                            ? '#16a34a'
                            : '#ef4444'
                    }}>

                        {datos.is_active
                            ? 'Cuenta activa'
                            : 'Cuenta no activa'}

                    </p>

                    {datos.is_superuser && (

                        <p style={{ marginTop: '8px' }}>
                            Cuenta de superusuario.
                        </p>

                    )}

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px',
                        marginTop: '20px'
                    }}>

                        <div style={tarjeta}>

                            <p>Roles asignados</p>

                            <h2>
                                {datos.cantidad_roles}
                            </h2>

                        </div>

                        <div style={tarjeta}>

                            <p>Permisos efectivos</p>

                            <h2>
                                {datos.cantidad_permisos_efectivos}
                            </h2>

                        </div>

                    </div>

                    {!datos.is_active && (

                        <p style={{
                            padding: '12px',
                            marginTop: '12px',
                            border: '1px solid #ef4444',
                            borderRadius: '6px'
                        }}>

                            La cuenta conserva sus roles y
                            permisos asignados, pero no tiene
                            permisos efectivos mientras
                            permanezca inactiva.

                        </p>

                    )}

                    <section style={{ marginTop: '20px' }}>

                        <h3 style={{ marginBottom: '12px' }}>
                            Roles asignados
                        </h3>

                        {datos.roles.length === 0 && (
                            <p>Sin roles asignados.</p>
                        )}

                        {datos.roles.map(rol => (

                            <div
                                key={rol.id}
                                style={tarjeta}
                            >

                                <h4 style={{
                                    marginBottom: '8px'
                                }}>

                                    {rol.nombre === 'Tecnico'
                                        ? 'Técnico'
                                        : rol.nombre}

                                </h4>

                                <p style={{
                                    marginBottom: '10px'
                                }}>

                                    Permisos: {rol.permisos.length}

                                </p>

                                <ListaPermisos
                                    permisos={rol.permisos}
                                />

                            </div>

                        ))}

                    </section>

                    <Seccion
                        titulo="Permisos directos"
                        permisos={datos.permisos_directos}
                    />

                    <Seccion
                        titulo="Permisos heredados"
                        permisos={datos.permisos_heredados}
                    />

                    <Seccion
                        titulo="Permisos efectivos"
                        permisos={datos.permisos_efectivos}
                    />

                </>

            )}

            <div style={{ marginTop: '24px' }}>

                <Button
                    type="button"
                    variant="outline-dark"
                    onClick={onClose}
                    style={{ width: '100%' }}
                >
                    Cerrar
                </Button>

            </div>

        </Modal>

    );
}
