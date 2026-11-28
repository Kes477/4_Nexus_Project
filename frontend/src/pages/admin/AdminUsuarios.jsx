import { useEffect, useMemo, useState } from 'react';

import {
    Users,
    UserCheck,
    UserMinus,
    ShieldAlert,
    Eye,
    RefreshCw
} from 'lucide-react';

import {
    Button,
    SearchBar,
    Select,
    Badge,
    Modal,
    Tabs
} from '../../components/ui';

import { listarUsuarios } from '../../api/usuariosService';
import { useSesion } from '../../hooks/useSesion';
import { PERMISOS } from '../../config/permisos';

import FormularioEmpleado from '../../components/admin/FormularioEmpleado';
import FormularioEdicionUsuario from '../../components/admin/FormularioEdicionUsuario';
import FormularioEstadoUsuario from '../../components/admin/FormularioEstadoUsuario';
import AsignacionRolesModal from '../../components/admin/AsignacionRolesModal';
import PermisosUsuarioModal from '../../components/admin/PermisosUsuarioModal';
import PerfilesUsuarioModal from '../../components/admin/PerfilesUsuarioModal';
import ActivacionUsuarioModal from '../../components/admin/ActivacionUsuarioModal';


const ESTADOS = {
    A: 'Activo',
    I: 'Inactivo',
    S: 'Suspendido',
    B: 'Bloqueado'
};

const COLORES = {
    A: 'success',
    I: 'warning',
    S: 'warning',
    B: 'warning'
};

const estiloTarjeta = {
    padding: '20px',
    backgroundColor: 'var(--white)',
    border: '1px solid var(--light-gray)',
    borderRadius: '8px'
};

const estiloCelda = {
    padding: '16px',
    textAlign: 'left',
    borderBottom: '1px solid var(--light-gray)',
    fontSize: '14px'
};

function Indicador({ titulo, cantidad, Icono }) {

    return (
        <div style={estiloTarjeta}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: 'var(--text-light)'
            }}>
                <span>{titulo}</span>
                <Icono size={20} />
            </div>

            <h2 style={{
                margin: '12px 0 0',
                fontSize: '30px',
                fontWeight: '800',

                color: 'var(--color-dark)'
            }}>
                {cantidad}
            </h2>
        </div>
    );
}

function EstadoUsuario({ estado }) {

    return (
        <Badge
            text={ESTADOS[estado] || estado}
            color={COLORES[estado] || 'info'}
        />
    );
}

export default function AdminUsuarios() {

    const {
        usuario: usuarioSesion,
        tienePermiso
    } = useSesion();

    const [usuarios, setUsuarios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [recarga, setRecarga] = useState(0);

    const [activeTab, setActiveTab] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [rolFilter, setRolFilter] = useState('ALL');

    const [selectedUser, setSelectedUser] = useState(null);

    const [usuarioRoles, setUsuarioRoles] = useState(null);

    const [usuarioPermisos, setUsuarioPermisos] = useState(null);

    const [usuarioPerfiles, setUsuarioPerfiles] = useState(null);

    const [usuarioActivacion, setUsuarioActivacion] = useState(null);

    function perfilesActualizados() {
        setUsuarioPerfiles(null);
        setMensaje('Perfil actualizado correctamente.');
        setRecarga(n => n + 1);
    }

    const puedeAsignarRoles = tienePermiso(
        PERMISOS.ASIGNAR_ROLES
    ) && tienePermiso(
        PERMISOS.CONSULTAR_ROLES
    );

    function rolesActualizados(usuario) {

        setUsuarioRoles(null);
        setSelectedUser(null);

        setMensaje(
            `Roles actualizados correctamente. ID: ${usuario.id}`
        );

        setRecarga(n => n + 1);
    }

    const [usuarioEdicion, setUsuarioEdicion] = useState(null);

    const [usuarioEstado, setUsuarioEstado] = useState(null);

    const puedeGestionarEstado = tienePermiso(
        PERMISOS.GESTIONAR_ESTADOS
    );

    function estadoActualizado(usuario) {

        setUsuarioEstado(null);
        setSelectedUser(null);

        setMensaje(
            `Estado actualizado correctamente. ID: ${usuario.id}`
        );

        setRecarga(n => n + 1);
    }


    const puedeEditar = tienePermiso(
        PERMISOS.EDITAR_USUARIOS
    );

    function usuarioActualizado(usuario) {

        setUsuarioEdicion(null);
        setSelectedUser(null);

        setMensaje(
            `Usuario actualizado correctamente. ID: ${usuario.id}`
        );

        setRecarga(n => n + 1);
    }


    const [mostrarRegistro, setMostrarRegistro] = useState(false);
    const [mensaje, setMensaje] = useState('');

    const puedeRegistrar = tienePermiso(
        PERMISOS.REGISTRAR_USUARIOS
    );

    function empleadoRegistrado(empleado) {

        setMostrarRegistro(false);

        setMensaje(
            `Empleado registrado correctamente. ID: ${empleado.id}`
        );

        setActiveTab(0);
        setSearchTerm('');
        setStatusFilter('ALL');
        setRolFilter('ALL');
        setRecarga(n => n + 1);
    }


    const puedeConsultar = tienePermiso(
        PERMISOS.CONSULTAR_USUARIOS
    );

    useEffect(() => {

        if (!puedeConsultar) {
            setUsuarios([]);
            setCargando(false);
            return;
        }

        const controller = new AbortController();

        async function cargarUsuarios() {

            setCargando(true);
            setError('');
            setUsuarios([]);
            setSelectedUser(null);

            try {

                const datos = await listarUsuarios(
                    { ordering: '-id' },
                    controller.signal
                );

                if (controller.signal.aborted) {
                    return;
                }

                if (Array.isArray(datos)) {

                    setUsuarios(datos);

                } else if (
                    Array.isArray(datos.results)
                    && !datos.next
                ) {

                    setUsuarios(datos.results);

                } else {

                    throw new Error(
                        'La respuesta requiere soporte de paginacion.'
                    );
                }

            } catch (err) {

                if (controller.signal.aborted) {
                    return;
                }

                setError(
                    err.response?.data?.detail
                    || err.message
                    || 'No fue posible cargar los usuarios.'
                );

            } finally {

                if (!controller.signal.aborted) {
                    setCargando(false);
                }
            }
        }

        cargarUsuarios();

        return () => controller.abort();

    }, [recarga, puedeConsultar]);

    const esInterno = (usuario) => {

        return (
            usuario.perfiles?.includes('empleado')
            || usuario.roles?.some(
                rol => rol !== 'Cliente'
            )
        );
    };

    const esCliente = (usuario) => {

        return (
            usuario.roles?.includes('Cliente')
            || usuario.perfiles?.includes('cliente')
        );
    };

    const rolesDisponibles = useMemo(() => {

        return [...new Set(
            usuarios.flatMap(
                usuario => usuario.roles || []
            )
        )].sort();

    }, [usuarios]);

    const filtrados = useMemo(() => {

        const texto = searchTerm.trim().toLowerCase();

        return usuarios.filter(usuario => {

            if (activeTab === 1 && !esInterno(usuario)) {
                return false;
            }

            if (activeTab === 2 && !esCliente(usuario)) {
                return false;
            }

            if (
                statusFilter !== 'ALL'
                && usuario.estado_cuenta !== statusFilter
            ) {
                return false;
            }

            if (
                rolFilter !== 'ALL'
                && !usuario.roles?.includes(rolFilter)
            ) {
                return false;
            }

            const contenido = [
                usuario.nombre_completo,
                usuario.first_name,
                usuario.last_name,
                usuario.email,
                usuario.no_identificacion
            ].join(' ').toLowerCase();

            return contenido.includes(texto);

        });

    }, [
        usuarios,
        activeTab,
        searchTerm,
        statusFilter,
        rolFilter
    ]);

    const totalActivos = usuarios.filter(
        u => u.estado_cuenta === 'A'
    ).length;

    const totalInactivos = usuarios.filter(
        u => u.estado_cuenta === 'I'
    ).length;

    const totalRestringidos = usuarios.filter(
        u => ['S', 'B'].includes(u.estado_cuenta)
    ).length;

    if (!puedeConsultar) {

        return (
            <div style={{ padding: '32px' }}>
                No tienes permiso para consultar usuarios.
            </div>
        );
    }

    return (

        <div style={{
            padding: '32px',
            width: '100%',
            boxSizing: 'border-box',
            color: 'var(--color-dark)',
            backgroundColor: 'var(--bg-color)'
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
                    <h1 style={{ margin: 0 }}>
                        Gestión de usuarios
                    </h1>

                    <p style={{ color: 'var(--text-light)' }}>
                        Administración de cuentas y accesos.
                    </p>
                </div>


                <div style={{
                    display: 'flex',
                    gap: '12px',
                    flexWrap: 'wrap'
                }}>

                    {puedeRegistrar && (
                        <Button
                            variant="primary"
                            onClick={() => {
                                setMensaje('');
                                setMostrarRegistro(true);
                            }}
                        >
                            + Registrar empleado
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
                marginBottom: '28px'
            }}>

                <Indicador
                    titulo="Usuarios registrados"
                    cantidad={cargando || error ? '—' : usuarios.length}
                    Icono={Users}
                />

                <Indicador
                    titulo="Cuentas activas"
                    cantidad={cargando || error ? '—' : totalActivos}
                    Icono={UserCheck}
                />

                <Indicador
                    titulo="Cuentas inactivas"
                    cantidad={cargando || error ? '—' : totalInactivos}
                    Icono={UserMinus}
                />

                <Indicador
                    titulo="Suspendidas o bloqueadas"
                    cantidad={cargando || error ? '—' : totalRestringidos}
                    Icono={ShieldAlert}
                />

            </div>

            <Tabs
                tabs={[
                    `Todos (${usuarios.length})`,
                    `Usuarios internos (${usuarios.filter(esInterno).length})`,
                    `Clientes (${usuarios.filter(esCliente).length})`
                ]}
                activeTab={activeTab}
                onChange={setActiveTab}
            />

            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '16px',
                margin: '24px 0'
            }}>

                <div style={{ flex: 1, minWidth: '220px' }}>
                    <SearchBar
                        placeholder="Nombre, correo o identificación..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <Select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    options={[
                        { value: 'ALL', label: 'Todos los estados' },
                        { value: 'A', label: 'Activos' },
                        { value: 'I', label: 'Inactivos' },
                        { value: 'S', label: 'Suspendidos' },
                        { value: 'B', label: 'Bloqueados' }
                    ]}
                />

                <Select
                    value={rolFilter}
                    onChange={e => setRolFilter(e.target.value)}
                    options={[
                        { value: 'ALL', label: 'Todos los roles' },
                        ...rolesDisponibles.map(rol => ({
                            value: rol,
                            label: rol
                        }))
                    ]}
                />

            </div>

            {mensaje && (
                <p role="status" style={{
                    color: 'var(--color-success)',
                    padding: '12px'
                }}>
                    {mensaje}
                </p>
            )}

            {error && (
                <p role="alert" style={{ color: '#dc2626' }}>
                    {error}
                </p>
            )}

            <div style={{
                ...estiloTarjeta,
                padding: 0,
                overflowX: 'auto'
            }}>

                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    minWidth: '750px'
                }}>

                    <thead style={{
                        backgroundColor: 'var(--bg-color)'
                    }}>

                        <tr>
                            {[
                                'ID',
                                'Usuario',
                                'Correo electrónico',
                                'Roles',
                                'Estado',
                                'Acciones'
                            ].map(titulo => (
                                <th key={titulo} style={estiloCelda}>
                                    {titulo}
                                </th>
                            ))}
                        </tr>

                    </thead>

                    <tbody>

                        {cargando && (
                            <tr>
                                <td colSpan={6} style={estiloCelda}>
                                    Cargando usuarios...
                                </td>
                            </tr>
                        )}

                        {!cargando && !error && filtrados.map(usuario => (

                            <tr key={usuario.id}>

                                <td style={estiloCelda}>
                                    {usuario.id}
                                </td>

                                <td style={estiloCelda}>
                                    <strong>
                                        {usuario.nombre_completo
                                            || `${usuario.first_name} ${usuario.last_name}`}
                                    </strong>
                                </td>

                                <td style={estiloCelda}>
                                    {usuario.email}
                                </td>

                                <td style={estiloCelda}>
                                    {usuario.roles?.join(', ')
                                        || 'Sin roles'}
                                </td>

                                <td style={estiloCelda}>
                                    <EstadoUsuario
                                        estado={usuario.estado_cuenta}
                                    />
                                </td>

                                <td style={estiloCelda}>
                                    <Button
                                        variant="outline-dark"
                                        size="sm"
                                        onClick={() => setSelectedUser(usuario)}
                                    >
                                        <Eye size={15} /> Ver
                                    </Button>
                                </td>

                            </tr>
                        ))}

                        {!cargando && !error && filtrados.length === 0 && (
                            <tr>
                                <td colSpan={6} style={estiloCelda}>
                                    No se encontraron usuarios.
                                </td>
                            </tr>
                        )}

                    </tbody>

                </table>

            </div>

            {mostrarRegistro && puedeRegistrar && (
                <FormularioEmpleado
                    onClose={() => setMostrarRegistro(false)}
                    onRegistrado={empleadoRegistrado}
                />
            )}

            {usuarioEstado && puedeGestionarEstado && (
                <FormularioEstadoUsuario
                    usuario={usuarioEstado}
                    onClose={() => setUsuarioEstado(null)}
                    onActualizado={estadoActualizado}
                />
            )}

            {usuarioEdicion && puedeEditar && (
                <FormularioEdicionUsuario
                    usuario={usuarioEdicion}
                    onClose={() => setUsuarioEdicion(null)}
                    onActualizado={usuarioActualizado}
                />
            )}

            {usuarioActivacion && (
                <ActivacionUsuarioModal
                    usuario={usuarioActivacion}
                    onClose={() => setUsuarioActivacion(null)}
                />
            )}

            {usuarioPerfiles && (
                <PerfilesUsuarioModal
                    usuario={usuarioPerfiles}
                    onClose={() => setUsuarioPerfiles(null)}
                    onActualizado={perfilesActualizados}
                />
            )}

            {usuarioPermisos && (
                <PermisosUsuarioModal
                    usuario={usuarioPermisos}
                    onClose={() => setUsuarioPermisos(null)}
                />
            )}

            {usuarioRoles && (
                <AsignacionRolesModal
                    usuario={usuarioRoles}
                    onClose={() => setUsuarioRoles(null)}
                    onActualizado={rolesActualizados}
                />
            )}

            <Modal
                isOpen={Boolean(selectedUser)}
                onClose={() => setSelectedUser(null)}
                title="Información del usuario"
            >

                {selectedUser && (

                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>

                        <h3>{selectedUser.nombre_completo}</h3>

                        <EstadoUsuario
                            estado={selectedUser.estado_cuenta}
                        />

                        <p><strong>ID:</strong> {selectedUser.id}</p>

                        <p>
                            <strong>Correo:</strong> {selectedUser.email}
                        </p>

                        <p>
                            <strong>Identificación:</strong>{' '}
                            {selectedUser.no_identificacion}
                        </p>

                        <p>
                            <strong>Teléfono:</strong>{' '}
                            {selectedUser.telefono || 'No registrado'}
                        </p>

                        <p>
                            <strong>Fecha de nacimiento:</strong>{' '}
                            {selectedUser.fecha_nacimiento || 'No registrada'}
                        </p>

                        <p>
                            <strong>Roles:</strong>{' '}
                            {selectedUser.roles?.join(', ') || 'Sin roles'}
                        </p>

                        <p>
                            <strong>Perfiles:</strong>{' '}
                            {selectedUser.perfiles?.join(', ') || 'Sin perfiles'}
                        </p>

                        <p>
                            <strong>Fecha de registro:</strong>{' '}
                            {selectedUser.date_joined
                                ? new Date(selectedUser.date_joined)
                                    .toLocaleDateString('es-HN')
                                : 'No registrada'}
                        </p>

                        {selectedUser.perfil_empleado && (

                            <section style={{
                                padding: '16px',
                                backgroundColor: 'var(--bg-color)',
                                borderRadius: '6px'
                            }}>

                                <h3>Información laboral</h3>

                                <p>
                                    <strong>Código:</strong>{' '}
                                    {selectedUser.perfil_empleado.codigo_empleado}
                                </p>

                                <p>
                                    <strong>Cargo:</strong>{' '}
                                    {selectedUser.perfil_empleado.cargo}
                                </p>

                                <p>
                                    <strong>Fecha de ingreso:</strong>{' '}
                                    {selectedUser.perfil_empleado.fecha_ingreso}
                                </p>

                            </section>
                        )}

                        {puedeEditar && (
                            <Button
                                variant="primary"
                                onClick={() => {
                                    setUsuarioEdicion(selectedUser);
                                    setSelectedUser(null);
                                }}
                            >
                                Editar información
                            </Button>
                        )}

                        {puedeConsultar && (

                            <Button
                                variant="outline-dark"
                                onClick={() => {
                                    setUsuarioPermisos(selectedUser);
                                    setSelectedUser(null);
                                }}
                            >
                                Consultar permisos
                            </Button>

                        )}

                        {usuarioSesion?.is_superuser === true && (

                            <Button
                                variant="outline-dark"
                                onClick={() => {
                                    setUsuarioPerfiles(selectedUser);
                                    setSelectedUser(null);
                                }}
                            >
                                Gestionar perfiles
                            </Button>

                        )}

                        {usuarioSesion?.is_superuser === true
                            && selectedUser.estado_cuenta === 'I'
                            && selectedUser.roles?.length > 0
                            && !selectedUser.roles.includes('Administrador')
                            && selectedUser.id !== usuarioSesion?.id
                            && (

                            <Button
                                variant="primary"
                                onClick={() => {
                                    setUsuarioActivacion(selectedUser);
                                    setSelectedUser(null);
                                }}
                            >
                                Generar enlace de activaci\u00f3n
                            </Button>

                        )}

                        {puedeAsignarRoles
                            && selectedUser.id !== usuarioSesion?.id
                            && !selectedUser.roles?.includes('Administrador')
                            && (

                            <Button
                                variant="outline-dark"
                                onClick={() => {
                                    setUsuarioRoles(selectedUser);
                                    setSelectedUser(null);
                                }}
                            >
                                Asignar roles
                            </Button>

                        )}

                        {puedeGestionarEstado
                            && selectedUser.id !== usuarioSesion?.id
                            && (

                            <Button
                                variant="outline-dark"
                                onClick={() => {
                                    setUsuarioEstado(selectedUser);
                                    setSelectedUser(null);
                                }}
                            >
                                Gestionar estado
                            </Button>

                        )}

                        <Button
                            variant="outline-dark"
                            onClick={() => setSelectedUser(null)}
                        >
                            Cerrar
                        </Button>

                    </div>
                )}

            </Modal>

        </div>
    );
}
