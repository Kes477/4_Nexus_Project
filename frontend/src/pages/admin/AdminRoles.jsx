import { useEffect, useState } from 'react';

import {
    ShieldCheck,
    Lock,
    Plus,
    Search,
    RefreshCw,
    Eye,
    Pencil,
    Trash2
} from 'lucide-react';

import { Button, Modal } from '../../components/ui';

import { useSesion } from '../../hooks/useSesion';
import {
    PERMISOS,
    obtenerEtiquetaPermiso
} from '../../config/permisos';

import {
    listarRoles,
    consultarRol,
    crearRol,
    editarRol,
    eliminarRol,
    listarPermisosDelegables,
    consultarPermisosRol,
    configurarPermisosRol
} from '../../api/rolesService';

const tarjeta = {
    padding: '20px',
    border: '1px solid var(--light-gray)',
    borderRadius: '8px',
    backgroundColor: 'var(--card-bg)'
};

const campo = {
    width: '100%',
    padding: '12px',
    border: '1px solid var(--light-gray)',
    borderRadius: '6px',
    backgroundColor: 'var(--bg-color)',
    color: 'var(--color-dark)',
    boxSizing: 'border-box'
};

const celda = {
    padding: '16px',
    borderBottom: '1px solid var(--light-gray)',
    textAlign: 'left'
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

    return 'No fue posible completar la operacion.';
}

export default function AdminRoles() {

    const { tienePermiso } = useSesion();

    const puedeCrear = tienePermiso(
        PERMISOS.CREAR_ROLES
    );

    const puedeEditar = tienePermiso(
        PERMISOS.EDITAR_ROLES
    );

    const puedeEliminar = tienePermiso(
        PERMISOS.ELIMINAR_ROLES
    );

    const puedeConfigurar = tienePermiso(
        PERMISOS.CONFIGURAR_PERMISOS
    );

    const [permisosDisponibles, setPermisosDisponibles] = useState([]);
    const [permisosProtegidos, setPermisosProtegidos] = useState([]);
    const [permisosSeleccionados, setPermisosSeleccionados] = useState([]);
    const [cargandoPermisos, setCargandoPermisos] = useState(false);
    const [permisosListos, setPermisosListos] = useState(false);

    const [roles, setRoles] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [recarga, setRecarga] = useState(0);

    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');
    const [errorModal, setErrorModal] = useState('');

    const [modal, setModal] = useState(null);
    const [rolSeleccionado, setRolSeleccionado] = useState(null);
    const [nombre, setNombre] = useState('');

    useEffect(() => {

        const controlador = new AbortController();

        async function cargar() {

            setCargando(true);
            setError('');

            try {

                const respuesta = await listarRoles(
                    {},
                    controlador.signal
                );

                const registros = Array.isArray(respuesta)
                    ? respuesta
                    : respuesta.results;

                if (!controlador.signal.aborted) {
                    setRoles(registros || []);
                }

            } catch (error) {

                if (!controlador.signal.aborted) {
                    setError(obtenerError(error));
                }

            } finally {

                if (!controlador.signal.aborted) {
                    setCargando(false);
                }
            }
        }

        cargar();

        return () => controlador.abort();

    }, [recarga]);

    const rolesFiltrados = roles.filter(
        rol => rol.nombre.toLowerCase().includes(
            busqueda.trim().toLowerCase()
        )
    );

    const protegidos = roles.filter(
        rol => rol.protegido
    ).length;

    function cerrarModal() {

        if (guardando || cargandoPermisos) return;

        setModal(null);
        setRolSeleccionado(null);
        setNombre('');
        setErrorModal('');
    }

    function abrirCrear() {

        setNombre('');
        setRolSeleccionado(null);
        setErrorModal('');
        setMensaje('');
        setModal('crear');
    }

    function abrirEditar(rol) {

        setRolSeleccionado(rol);
        setNombre(rol.nombre);
        setErrorModal('');
        setMensaje('');
        setModal('editar');
    }

    function abrirEliminar(rol) {

        setRolSeleccionado(rol);
        setErrorModal('');
        setMensaje('');
        setModal('eliminar');
    }

    async function abrirDetalle(rol) {

        setError('');
        setErrorModal('');
        setRolSeleccionado(rol);
        setModal('detalle');

        try {

            const detalle = await consultarRol(rol.id);

            setRolSeleccionado(actual =>
                actual?.id === rol.id
                    ? detalle
                    : actual
            );

        } catch (error) {

            setErrorModal(obtenerError(error));
        }
    }

    async function abrirPermisos(rol) {

        if (!puedeConfigurar || rol.nombre === 'Administrador') return;

        setRolSeleccionado(rol);
        setModal('permisos');
        setErrorModal('');
        setMensaje('');
        setPermisosDisponibles([]);
        setPermisosProtegidos([]);
        setPermisosSeleccionados([]);
        setPermisosListos(false);
        setCargandoPermisos(true);

        try {

            const [respuesta, detalle] = await Promise.all([
                listarPermisosDelegables(),
                consultarPermisosRol(rol.id)
            ]);

            const disponibles = Array.isArray(respuesta)
                ? respuesta
                : respuesta.results;

            if (!Array.isArray(disponibles) ||
                !Array.isArray(detalle.permisos)) {
                throw new Error('Respuesta de permisos incompatible.');
            }

            const actuales = detalle.permisos;

            const idsDelegables = new Set(
                disponibles.map(p => p.id)
            );

            setPermisosDisponibles(disponibles);

            setPermisosProtegidos(
                actuales.filter(p => !idsDelegables.has(p.id))
            );

            setPermisosSeleccionados(
                actuales.map(p => p.id)
            );

            setPermisosListos(true);

        } catch (error) {

            setErrorModal(obtenerError(error));

        } finally {

            setCargandoPermisos(false);
        }
    }

    function alternarPermiso(id) {

        if (guardando || !permisosListos) return;

        if (!permisosDisponibles.some(p => p.id === id)) return;

        setPermisosSeleccionados(actual =>
            actual.includes(id)
                ? actual.filter(valor => valor !== id)
                : [...actual, id]
        );
    }

    async function guardarPermisos(evento) {

        evento.preventDefault();

        if (
            guardando ||
            cargandoPermisos ||
            !permisosListos ||
            !puedeConfigurar ||
            !rolSeleccionado
        ) return;

        setGuardando(true);
        setErrorModal('');

        try {

            const ids = [...new Set([
                ...permisosSeleccionados,
                ...permisosProtegidos.map(p => p.id)
            ])];

            await configurarPermisosRol(
                rolSeleccionado.id,
                ids
            );

            setModal(null);
            setRolSeleccionado(null);
            setMensaje('Permisos actualizados correctamente.');
            setRecarga(n => n + 1);

        } catch (error) {

            setErrorModal(obtenerError(error));

        } finally {

            setGuardando(false);
        }
    }

    async function guardar(evento) {

        evento.preventDefault();

        if (guardando) return;

        const nombreLimpio = nombre.trim();

        if (
            nombreLimpio.length < 3
            || nombreLimpio.length > 50
        ) {

            setErrorModal(
                'El nombre debe contener entre 3 y 50 caracteres.'
            );

            return;
        }

        setGuardando(true);
        setErrorModal('');

        try {

            if (modal === 'crear') {

                await crearRol(nombreLimpio);

                setMensaje('Rol creado correctamente.');

            } else {

                await editarRol(
                    rolSeleccionado.id,
                    nombreLimpio
                );

                setMensaje('Rol actualizado correctamente.');
            }

            setModal(null);
            setRolSeleccionado(null);
            setNombre('');
            setRecarga(n => n + 1);

        } catch (error) {

            setErrorModal(obtenerError(error));

        } finally {

            setGuardando(false);
        }
    }

    async function confirmarEliminar() {

        if (guardando) return;

        setGuardando(true);
        setErrorModal('');

        try {

            await eliminarRol(rolSeleccionado.id);

            setMensaje('Rol eliminado correctamente.');
            setModal(null);
            setRolSeleccionado(null);
            setRecarga(n => n + 1);

        } catch (error) {

            setErrorModal(obtenerError(error));

        } finally {

            setGuardando(false);
        }
    }

    return (

        <section style={{
            padding: '32px',
            minHeight: '65vh'
        }}>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '24px'
            }}>

                <div>

                    <h1 style={{
                        fontSize: '30px',
                        fontWeight: 'bold'
                    }}>
                        Roles y permisos
                    </h1>

                    <p style={{
                        color: 'var(--text-light)'
                    }}>
                        Administración de privilegios y accesos.
                    </p>

                </div>

                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px'
                }}>

                    {puedeCrear && (

                        <Button
                            variant="primary"
                            onClick={abrirCrear}
                        >
                            <Plus size={16} />
                            Crear rol
                        </Button>

                    )}

                    <Button
                        variant="outline-dark"
                        onClick={() => setRecarga(n => n + 1)}
                        disabled={cargando}
                    >
                        <RefreshCw size={16} />
                        Actualizar
                    </Button>

                </div>

            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns:
                    'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
            }}>

                {[
                    ['Total de roles', roles.length],
                    ['Roles protegidos', protegidos],
                    ['Roles personalizados', roles.length - protegidos]
                ].map(([titulo, cantidad]) => (

                    <div key={titulo} style={tarjeta}>

                        <p style={{
                            color: 'var(--text-light)'
                        }}>
                            {titulo}
                        </p>

                        <strong style={{
                            fontSize: '28px'
                        }}>
                            {cantidad}
                        </strong>

                    </div>

                ))}

            </div>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                maxWidth: '380px',
                marginBottom: '24px'
            }}>

                <Search size={20} />

                <input
                    type="search"
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    placeholder="Buscar por nombre del rol..."
                    aria-label="Buscar rol"
                    style={campo}
                />

            </div>

            {mensaje && (

                <p role="status" style={{
                    color: '#04bfa6',
                    marginBottom: '16px'
                }}>
                    {mensaje}
                </p>

            )}

            {error && (

                <p role="alert" style={{
                    color: '#ef4444',
                    marginBottom: '16px'
                }}>
                    {error}
                </p>

            )}

            <div style={{
                ...tarjeta,
                padding: 0,
                overflowX: 'auto'
            }}>

                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse'
                }}>

                    <thead>

                        <tr>
                            <th style={celda}>ID</th>
                            <th style={celda}>Nombre</th>
                            <th style={celda}>Tipo</th>
                            <th style={celda}>Usuarios</th>
                            <th style={celda}>Permisos</th>
                            <th style={celda}>Acciones</th>
                        </tr>

                    </thead>

                    <tbody>

                        {cargando ? (

                            <tr>
                                <td colSpan={6} style={celda}>
                                    Cargando roles...
                                </td>
                            </tr>

                        ) : rolesFiltrados.length === 0 ? (

                            <tr>
                                <td colSpan={6} style={celda}>
                                    No se encontraron roles.
                                </td>
                            </tr>

                        ) : rolesFiltrados.map(rol => (

                            <tr key={rol.id}>

                                <td style={celda}>
                                    {rol.id}
                                </td>

                                <td style={celda}>
                                    <strong>{rol.nombre}</strong>
                                </td>

                                <td style={celda}>

                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>

                                        {rol.protegido ? (

                                            <>
                                                <Lock size={14} />
                                                Protegido
                                            </>

                                        ) : (

                                            <>
                                                <ShieldCheck size={14} />
                                                Personalizado
                                            </>

                                        )}

                                    </span>

                                </td>

                                <td style={celda}>
                                    {rol.cantidad_usuarios}
                                </td>

                                <td style={celda}>
                                    {rol.cantidad_permisos}
                                </td>

                                <td style={celda}>

                                    <div style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '8px'
                                    }}>

                                        <Button
                                            variant="outline-dark"
                                            onClick={() => abrirDetalle(rol)}
                                        >
                                            <Eye size={14} />
                                            Ver
                                        </Button>

                                        {puedeEditar
                                            && !rol.protegido
                                            && (

                                            <Button
                                                variant="outline-dark"
                                                onClick={() => abrirEditar(rol)}
                                            >
                                                <Pencil size={14} />
                                                Editar
                                            </Button>

                                        )}

                                        {puedeConfigurar
                                            && rol.nombre !== 'Administrador'
                                            && (

                                            <Button
                                                variant="outline-dark"
                                                onClick={() => abrirPermisos(rol)}
                                            >
                                                <ShieldCheck size={14} />
                                                Permisos
                                            </Button>

                                        )}

                                        {puedeEliminar
                                            && !rol.protegido
                                            && rol.cantidad_usuarios === 0
                                            && (

                                            <Button
                                                variant="outline-dark"
                                                onClick={() => abrirEliminar(rol)}
                                            >
                                                <Trash2 size={14} />
                                                Eliminar
                                            </Button>

                                        )}

                                    </div>

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

            {modal && (

                <Modal
                    isOpen={true}
                    onClose={cerrarModal}
                    title={{
                        permisos: 'Configurar permisos',
                        crear: 'Crear rol',
                        editar: 'Editar rol',
                        eliminar: 'Eliminar rol',
                        detalle: 'Información del rol'
                    }[modal]}
                >

                    <div style={{
                        minWidth: 0
                    }}>

                        {(modal === 'crear'
                            || modal === 'editar') && (

                            <form onSubmit={guardar}>

                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px'
                                }}>
                                    Nombre del rol *
                                </label>

                                <input
                                    value={nombre}
                                    onChange={e => setNombre(e.target.value)}
                                    minLength={3}
                                    maxLength={50}
                                    required
                                    disabled={guardando}
                                    placeholder="Ej. Coordinador de operaciones"
                                    aria-label="Nombre del rol"
                                    style={campo}
                                />

                                <p style={{
                                    color: 'var(--text-light)',
                                    fontSize: '13px',
                                    marginTop: '12px'
                                }}>
                                    {modal === 'crear'
                                        ? 'Los roles personalizados se crean sin permisos iniciales.'
                                        : 'Modificar el nombre no cambia los permisos asignados.'}
                                </p>

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: '12px',
                                    marginTop: '24px'
                                }}>

                                    <Button
                                        type="button"
                                        variant="outline-dark"
                                        onClick={cerrarModal}
                                        disabled={guardando}
                                    >
                                        Cancelar
                                    </Button>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={
                                            guardando
                                            || nombre.trim().length < 3
                                        }
                                    >
                                        {guardando
                                            ? 'Guardando...'
                                            : 'Guardar rol'}
                                    </Button>

                                </div>

                            </form>

                        )}

                        {modal === 'detalle' && rolSeleccionado && (

                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                            }}>

                                <h3>{rolSeleccionado.nombre}</h3>

                                <p>
                                    <strong>ID: </strong>
                                    {rolSeleccionado.id}
                                </p>

                                <p>
                                    <strong>Tipo: </strong>
                                    {rolSeleccionado.protegido
                                        ? 'Protegido'
                                        : 'Personalizado'}
                                </p>

                                <p>
                                    <strong>Usuarios asignados: </strong>
                                    {rolSeleccionado.cantidad_usuarios}
                                </p>

                                <p>
                                    <strong>Permisos asignados: </strong>
                                    {rolSeleccionado.cantidad_permisos}
                                </p>

                                <div style={tarjeta}>

                                    <strong>Permisos del rol</strong>

                                    {(rolSeleccionado.permisos || []).length
                                        === 0 ? (

                                        <p style={{ marginTop: '12px' }}>
                                            Sin permisos asignados.
                                        </p>

                                    ) : (

                                        (rolSeleccionado.permisos || []).map(
                                            permiso => (

                                                <div
                                                    key={permiso.id}
                                                    style={{
                                                        padding: '10px 0',
                                                        borderBottom:
                                                            '1px solid var(--light-gray)'
                                                    }}
                                                >

                                                    <strong>
                                                        {obtenerEtiquetaPermiso(permiso)}
                                                    </strong>

                                                    <p style={{
                                                        fontSize: '12px',
                                                        overflowWrap: 'anywhere'
                                                    }}>
                                                        {permiso.codigo_completo}
                                                    </p>

                                                </div>

                                            )
                                        )

                                    )}

                                </div>

                                <Button
                                    variant="outline-dark"
                                    onClick={cerrarModal}
                                >
                                    Cerrar
                                </Button>

                            </div>

                        )}

                        {modal === 'permisos' && rolSeleccionado && (

                            <form onSubmit={guardarPermisos}>

                                <p>
                                    Rol: <strong>{rolSeleccionado.nombre}</strong>
                                </p>

                                {cargandoPermisos && (
                                    <p>Cargando permisos...</p>
                                )}

                                {permisosListos && (

                                    <>

                                        <h3>Permisos disponibles</h3>

                                        {permisosDisponibles.length === 0 && (
                                            <p>No hay permisos delegables disponibles.</p>
                                        )}

                                        {permisosDisponibles.map(permiso => (

                                            <label
                                                key={permiso.id}
                                                style={{
                                                    ...tarjeta,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    marginBottom: '8px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={permisosSeleccionados.includes(permiso.id)}
                                                    disabled={guardando}
                                                    onChange={() => alternarPermiso(permiso.id)}
                                                />

                                                <span>
                                                    {obtenerEtiquetaPermiso(permiso)}
                                                </span>

                                            </label>

                                        ))}

                                        {permisosProtegidos.length > 0 && (

                                            <>

                                                <h3>Permisos protegidos</h3>

                                                <p>
                                                    Estos permisos se conservaran sin cambios.
                                                </p>

                                                {permisosProtegidos.map(permiso => (

                                                    <div
                                                        key={permiso.id}
                                                        style={{
                                                            ...tarjeta,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '12px',
                                                            marginBottom: '8px'
                                                        }}
                                                    >
                                                        <Lock size={16} />
                                                        {obtenerEtiquetaPermiso(permiso)}
                                                    </div>

                                                ))}

                                            </>

                                        )}

                                        <p>
                                            Permisos asignados: {permisosSeleccionados.length}
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
                                        onClick={cerrarModal}
                                        disabled={guardando || cargandoPermisos}
                                    >
                                        Cancelar
                                    </Button>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={
                                            guardando ||
                                            cargandoPermisos ||
                                            !permisosListos
                                        }
                                    >
                                        {guardando
                                            ? 'Guardando...'
                                            : 'Guardar permisos'}
                                    </Button>

                                </div>

                            </form>

                        )}

                        {modal === 'eliminar' && rolSeleccionado && (

                            <div>

                                <p>
                                    Confirma que deseas eliminar el rol
                                    <strong> {rolSeleccionado.nombre}</strong>.
                                </p>

                                <p style={{
                                    color: 'var(--text-light)',
                                    marginTop: '12px'
                                }}>
                                    Esta operación no se puede deshacer.
                                </p>

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: '12px',
                                    marginTop: '24px'
                                }}>

                                    <Button
                                        variant="outline-dark"
                                        onClick={cerrarModal}
                                        disabled={guardando}
                                    >
                                        Cancelar
                                    </Button>

                                    <Button
                                        variant="primary"
                                        onClick={confirmarEliminar}
                                        disabled={guardando}
                                    >
                                        {guardando
                                            ? 'Eliminando...'
                                            : 'Confirmar eliminación'}
                                    </Button>

                                </div>

                            </div>

                        )}

                        {errorModal && (

                            <p role="alert" style={{
                                color: '#ef4444',
                                marginTop: '16px'
                            }}>
                                {errorModal}
                            </p>

                        )}

                    </div>

                </Modal>

            )}

        </section>
    );
}
