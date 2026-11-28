import { useEffect, useState } from 'react';

import { Button, Modal } from '../ui';

import { listarRoles } from '../../api/rolesService';

import {
    consultarRolesUsuario,
    asignarRolesUsuario
} from '../../api/usuariosService';

const PERFILES_REQUERIDOS = {
    Cliente: 'cliente',
    Tecnico: 'tecnico',
    Piloto: 'piloto',
    Vendedor: 'vendedor'
};

const ETIQUETAS_ROLES = {
    Tecnico: 'T?cnico'
};

const estiloRol = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    border: '1px solid var(--light-gray)',
    borderRadius: '8px',
    marginBottom: '8px'
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
        return Object.values(datos).flat().join(' ');
    }

    return error.message || 'No se pudo completar la operaci?n.';
}

export default function AsignacionRolesModal({
    usuario,
    onClose,
    onActualizado
}) {

    const [roles, setRoles] = useState([]);
    const [seleccionados, setSeleccionados] = useState([]);
    const [originales, setOriginales] = useState([]);

    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [listo, setListo] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {

        const controller = new AbortController();

        async function cargar() {

            setCargando(true);
            setListo(false);
            setError('');

            try {

                const [respuesta, asignados] = await Promise.all([
                    listarRoles(
                        { ordering: 'name' },
                        controller.signal
                    ),
                    consultarRolesUsuario(usuario.id)
                ]);

                if (controller.signal.aborted) return;

                const disponibles = Array.isArray(respuesta)
                    ? respuesta
                    : respuesta.results;

                if (
                    !Array.isArray(disponibles) ||
                    !Array.isArray(asignados.roles)
                ) {
                    throw new Error(
                        'Respuesta de roles incompatible.'
                    );
                }

                const catalogo = new Map(
                    disponibles.map(rol => [rol.id, rol])
                );

                // Conservar roles asignados aunque no aparezcan
                // en la primera pagina del catalogo.

                asignados.roles.forEach(rol => {
                    if (!catalogo.has(rol.id)) {
                        catalogo.set(rol.id, rol);
                    }
                });

                const ids = asignados.roles.map(
                    rol => rol.id
                );

                setRoles([...catalogo.values()]);
                setOriginales(ids);
                setSeleccionados(ids);
                setListo(true);

            } catch (error) {

                if (!controller.signal.aborted) {
                    setError(obtenerError(error));
                }

            } finally {

                if (!controller.signal.aborted) {
                    setCargando(false);
                }
            }
        }

        cargar();

        return () => controller.abort();

    }, [usuario.id]);

    function motivoBloqueo(rol) {

        if (rol.nombre === 'Administrador') {
            return 'Rol administrativo protegido.';
        }

        const perfil = PERFILES_REQUERIDOS[rol.nombre];

        if (
            perfil &&
            !originales.includes(rol.id) &&
            !usuario.perfiles?.includes(perfil)
        ) {
            return 'Requiere el perfil correspondiente.';
        }

        return '';
    }

    function alternarRol(rol) {

        if (
            guardando ||
            !listo ||
            motivoBloqueo(rol)
        ) return;

        setError('');

        setSeleccionados(actual =>
            actual.includes(rol.id)
                ? actual.filter(id => id !== rol.id)
                : [...actual, rol.id]
        );
    }

    function cerrar() {

        if (!guardando) {
            onClose();
        }
    }

    async function guardar(evento) {

        evento.preventDefault();

        if (guardando || cargando || !listo) return;

        if (
            usuario.estado_cuenta === 'A' &&
            seleccionados.length === 0
        ) {

            setError(
                'Un usuario activo debe conservar al menos un rol.'
            );

            return;
        }

        setGuardando(true);
        setError('');

        try {

            const actualizado = await asignarRolesUsuario(
                usuario.id,
                [...new Set(seleccionados)]
            );

            onActualizado(actualizado);

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
            title="Asignar roles"
            maxWidth="550px"
        >

            <form onSubmit={guardar}>

                <div style={{ marginBottom: '20px' }}>

                    <h3>{usuario.nombre_completo}</h3>

                    <p>{usuario.email}</p>

                    <p>
                        Selecciona los roles que tendr?
                        asignados este usuario.
                    </p>

                </div>

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
                    <p>Cargando roles disponibles...</p>
                )}

                {listo && (

                    <>

                        <h3 style={{ marginBottom: '12px' }}>
                            Roles disponibles
                        </h3>

                        {roles.map(rol => {

                            const motivo = motivoBloqueo(rol);

                            return (

                                <label
                                    key={rol.id}
                                    style={{
                                        ...estiloRol,
                                        opacity: motivo ? 0.65 : 1,
                                        cursor: motivo
                                            ? 'not-allowed'
                                            : 'pointer'
                                    }}
                                >

                                    <input
                                        type="checkbox"
                                        checked={
                                            seleccionados.includes(rol.id)
                                        }
                                        disabled={
                                            guardando || Boolean(motivo)
                                        }
                                        onChange={() => alternarRol(rol)}
                                    />

                                    <div>

                                        <strong>
                                            {ETIQUETAS_ROLES[rol.nombre]
                                                || rol.nombre}
                                        </strong>

                                        {motivo && (
                                            <p style={{
                                                fontSize: '12px',
                                                marginTop: '4px'
                                            }}>
                                                {motivo}
                                            </p>
                                        )}

                                    </div>

                                </label>
                            );
                        })}

                        <p style={{ marginTop: '16px' }}>
                            Roles seleccionados: {seleccionados.length}
                        </p>

                    </>

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
                        onClick={cerrar}
                        disabled={guardando}
                    >
                        Cancelar
                    </Button>

                    <Button
                        type="submit"
                        variant="primary"
                        disabled={
                            guardando ||
                            cargando ||
                            !listo
                        }
                    >
                        {guardando
                            ? 'Guardando...'
                            : 'Guardar roles'}
                    </Button>

                </div>

            </form>

        </Modal>
    );
}
