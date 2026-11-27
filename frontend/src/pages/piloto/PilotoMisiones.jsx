import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plane, Droplets, Eye, Camera, Target, Plus } from 'lucide-react';
import { getMisiones, cambiarEstadoMision } from '../../api/pilotoService';
import { 
    SectionHeading, 
    Tabs, 
    SearchBar, 
    Loader, 
    Alert,
    Select,
    Badge,
    Button,
    Modal,
    Input
} from '../../components/ui';
import { MisionCard } from '../../components/domain/MisionCard';

const getCategoryStyle = (categoria) => {
    const cat = categoria?.toLowerCase() || '';
    if (cat.includes('fumig') || cat.includes('agri')) 
        return { Icon: Droplets, color: 'var(--color-info)', bg: 'rgba(45, 210, 246, 0.1)' };
    if (cat.includes('monitoreo') || cat.includes('vigil')) 
        return { Icon: Eye, color: 'var(--color-primary)', bg: 'rgba(4, 201, 166, 0.1)' };
    if (cat.includes('foto') || cat.includes('cam') || cat.includes('mapeo')) 
        return { Icon: Camera, color: 'var(--color-warning)', bg: 'rgba(241, 190, 38, 0.1)' };
    return { Icon: Target, color: 'var(--color-primary)', bg: 'rgba(4, 201, 166, 0.1)' };
};

const getBadgeColor = (estado) => {
    switch (estado) {
        case 'PENDIENTE': return 'warning';
        case 'ACEPTADA': return 'info';
        case 'EN_CURSO': return 'primary';
        case 'COMPLETADA': return 'success';
        case 'RECHAZADA':
        case 'CANCELADA': return 'danger';
        default: return 'dark';
    }
};

export default function PilotoMisiones() {
    const [mainMode, setMainMode] = useState("PERSONAL");
    const [misiones, setMisiones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    
    const [searchTerm, setSearchTerm] = useState("");
    const [filtroCategoria, setFiltroCategoria] = useState("TODAS");
    const [filtroEstado, setFiltroEstado] = useState("TODOS");

    const [searchParams] = useSearchParams();
    const misionIdParam = searchParams.get('id');
    const [highlightedId, setHighlightedId] = useState(null);
    const scrollTargetRef = useRef(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState(null);
    const [createForm, setCreateForm] = useState({
        categoria: 'fotografia',
        ubicacion: '',
        fecha_programada: '',
        dron_asignado: '',
        descripcion: '',
        area_size: ''
    });

    const estadosDisponibles = ['PENDIENTE', 'ACEPTADA', 'EN_CURSO', 'COMPLETADA', 'RECHAZADA', 'CANCELADA'];

    const fetchAllMisiones = async () => {
        const [personal, terceros] = await Promise.all([
            getMisiones('PERSONAL'),
            getMisiones('TERCEROS')
        ]);
        return [...personal, ...terceros];
    };

    useEffect(() => {
        let isMounted = true;
        const initFetch = async () => {
            setCargando(true);
            try {
                const data = await fetchAllMisiones();
                if (isMounted) {
                    setMisiones(data);
                    
                    const hasPersonal = data.some(m => m.tipo_mision === 'PERSONAL');
                    const hasTerceros = data.some(m => m.tipo_mision === 'TERCEROS');
                    
                    if (!hasPersonal && hasTerceros) {
                        setMainMode('TERCEROS');
                    } else {
                        setMainMode('PERSONAL');
                    }
                }
            } catch (error) {
                if (isMounted) setErrorMsg(error.message || "Error al cargar las misiones.");
            } finally {
                if (isMounted) setCargando(false);
            }
        };
        initFetch();
        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        if (!cargando && misionIdParam && misiones.length > 0) {
            const found = misiones.find(m => String(m.id) === String(misionIdParam));
            
            if (found) {
                if (found.tipo_mision === 'TERCEROS') {
                    setMainMode('TERCEROS');
                } else {
                    setMainMode('PERSONAL');
                }

                setHighlightedId(misionIdParam);
                
                setTimeout(() => {
                    if (scrollTargetRef.current) {
                        scrollTargetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 300);

                const timer = setTimeout(() => {
                    setHighlightedId(null);
                }, 4000);

                return () => clearTimeout(timer);
            }
        }
    }, [cargando, misionIdParam, misiones]);

    const handleCambiarEstado = async (id, nuevoEstado) => {
        setErrorMsg(null);
        try {
            await cambiarEstadoMision(id, nuevoEstado);
            const data = await fetchAllMisiones();
            setMisiones(data);
        } catch (error) {
            setErrorMsg(error.message);
            throw error;
        }
    };

    const handleEditarMision = async (id, datosActualizados) => {
        setErrorMsg(null);
        try {
            const token = localStorage.getItem('access_token');
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
            
            const response = await fetch(`${API_URL}/pilotos/misiones/${id}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosActualizados)
            });

            if (!response.ok) {
                throw new Error('Error al editar la misión. Revisa los datos.');
            }

            const data = await fetchAllMisiones();
            setMisiones(data);
        } catch (error) {
            setErrorMsg(error.message);
            throw error;
        }
    };

    const handleCreateMission = async (e) => {
        e.preventDefault();
        setIsCreating(true);
        setCreateError(null);

        try {
            const token = localStorage.getItem('access_token');
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

            const response = await fetch(`${API_URL}/pilotos/misiones/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...createForm,
                    tipo_mision: 'PERSONAL'
                })
            });

            if (!response.ok) {
                throw new Error('Error al crear la misión. Verifica los datos.');
            }

            const data = await fetchAllMisiones();
            setMisiones(data);
            setIsCreateModalOpen(false);
            setCreateForm({
                categoria: 'fotografia',
                ubicacion: '',
                fecha_programada: '',
                dron_asignado: '',
                descripcion: '',
                area_size: ''
            });
        } catch (error) {
            setCreateError(error.message);
        } finally {
            setIsCreating(false);
        }
    };

    const misionesBase = misiones.filter(m => m.tipo_mision === mainMode);

    const categoriasUnicas = [...new Set(misionesBase.map(m => m.categoria).filter(Boolean))];
    
    const resumenCategorias = categoriasUnicas.map(cat => {
        const misionesCat = misionesBase.filter(m => m.categoria === cat);
        const total = misionesCat.length;
        
        const desgloseEstados = estadosDisponibles.reduce((acc, est) => {
            const count = misionesCat.filter(m => m.estado === est).length;
            if (count > 0) acc[est] = count;
            return acc;
        }, {});

        const style = getCategoryStyle(cat);
        return { categoria: cat, total, desgloseEstados, ...style };
    }).filter(cat => cat.total > 0);

    const opcionesCategoria = [
        { value: 'TODAS', label: 'Todas las categorías' },
        ...categoriasUnicas.map(cat => ({ value: cat, label: cat }))
    ];

    const opcionesEstado = [
        { value: 'TODOS', label: 'Todos los estados' },
        ...estadosDisponibles.map(est => ({ value: est, label: est }))
    ];

    const categoriasGlobales = [...new Set(misiones.map(m => m.categoria).filter(Boolean))];
    const opcionesCategoriaModal = categoriasGlobales.length > 0
        ? categoriasGlobales.map(cat => ({ 
            value: cat, 
            label: cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) 
          }))
        : [
            { value: 'fotografia', label: 'Fotografía' },
            { value: 'fumigacion', label: 'Fumigación' },
            { value: 'mapeo', label: 'Mapeo' },
            { value: 'carreras_fpv', label: 'Carreras FPV' },
            { value: 'monitoreo', label: 'Monitoreo' }
          ];

    const misionesFiltradas = misionesBase.filter(mision => {
        const esVisible = ['PENDIENTE', 'ACEPTADA', 'EN_CURSO'].includes(mision.estado);
        if (!esVisible) return false;

        const searchLower = searchTerm.toLowerCase();
        const matchSearch = 
            (mision.cliente_nombre?.toLowerCase().includes(searchLower) || false) ||
            (mision.identificador?.toLowerCase().includes(searchLower) || false) ||
            (mision.id?.toString().toLowerCase().includes(searchLower) || false);

        const matchCategoria = filtroCategoria === 'TODAS' || mision.categoria === filtroCategoria;
        const matchEstado = filtroEstado === 'TODOS' || mision.estado === filtroEstado;

        return matchSearch && matchCategoria && matchEstado;
    });

    return (
        <div style={{ padding: '40px 20px', backgroundColor: 'var(--bg-color)', minHeight: '100vh' }}>
            <div className="section-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
                    <SectionHeading 
                        title="Misiones Asignadas" 
                        description="Administra tus vuelos personales y los servicios solicitados por terceros."
                    />
                    {mainMode === 'PERSONAL' && (
                        <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Plus size={18} /> Nueva Misión
                        </Button>
                    )}
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <Tabs 
                        tabs={['Uso Personal', 'Servicios a Terceros']} 
                        activeTab={mainMode === 'PERSONAL' ? 0 : 1} 
                        onChange={(index) => {
                            setMainMode(index === 0 ? 'PERSONAL' : 'TERCEROS');
                            setSearchTerm('');
                            setFiltroCategoria('TODAS');
                            setFiltroEstado('TODOS');
                        }} 
                    />
                </div>

                <div style={{ 
                    display: 'flex', 
                    gap: '15px', 
                    marginBottom: '30px', 
                    flexWrap: 'wrap',
                    alignItems: 'center'
                }}>
                    <div style={{ flex: 1, minWidth: '250px' }}>
                        <SearchBar 
                            placeholder="Buscar por cliente o ID..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div style={{ width: '200px' }}>
                        <Select 
                            options={opcionesCategoria} 
                            value={filtroCategoria} 
                            onChange={(e) => setFiltroCategoria(e.target.value)} 
                        />
                    </div>
                    <div style={{ width: '200px' }}>
                        <Select 
                            options={opcionesEstado} 
                            value={filtroEstado} 
                            onChange={(e) => setFiltroEstado(e.target.value)} 
                            variant="dark"
                        />
                    </div>
                </div>

                {errorMsg && (
                    <div style={{ marginBottom: '20px' }}>
                        <Alert 
                            type="danger" 
                            title="Ha ocurrido un error" 
                            message={errorMsg} 
                            onClose={() => setErrorMsg(null)} 
                        />
                    </div>
                )}

                {cargando ? (
                    <Loader text="Cargando misiones..." />
                ) : misionesFiltradas.length === 0 ? (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '60px 20px', 
                        color: 'var(--text-light)', 
                        background: 'var(--white)', 
                        borderRadius: '12px', 
                        border: '1px dashed var(--light-gray)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <div style={{ 
                            background: 'rgba(4, 201, 166, 0.1)', 
                            padding: '20px', 
                            borderRadius: '50%',
                            marginBottom: '20px',
                            color: 'var(--color-primary)'
                        }}>
                            <Plane size={48} strokeWidth={1.5} />
                        </div>
                        <h3 style={{ color: 'var(--color-dark)', fontSize: '20px', marginBottom: '8px' }}>
                            No hay misiones disponibles
                        </h3>
                        <p style={{ fontSize: '15px', maxWidth: '400px' }}>
                            No se encontraron misiones activas que coincidan con los filtros aplicados.
                        </p>
                    </div>
                ) : (
                    <div style={{ 
                        display: 'grid', 
                        gap: '24px', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' 
                    }}>
                        {misionesFiltradas.map((mision) => {
                            const isHighlighted = highlightedId === String(mision.id);
                            return (
                                <div 
                                    key={mision.id} 
                                    ref={isHighlighted ? scrollTargetRef : null}
                                    style={{
                                        transition: 'all 0.4s ease',
                                        borderRadius: '12px',
                                        border: isHighlighted ? '2px solid var(--color-primary)' : '2px solid transparent',
                                        boxShadow: isHighlighted ? '0 0 0 2px rgba(4, 201, 166, 0.2)' : 'none'
                                    }}
                                >
                                    <MisionCard 
                                        mision={mision} 
                                        onStatusChange={handleCambiarEstado}
                                        onEdit={handleEditarMision}
                                        isPersonal={mainMode === 'PERSONAL'} 
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}

                {!cargando && resumenCategorias.length > 0 && (
                    <div style={{ marginTop: '50px' }}>
                        <h3 style={{ 
                            color: 'var(--color-dark)', 
                            fontSize: '18px', 
                            fontWeight: '700', 
                            marginBottom: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            Resumen de Carga por Categoría
                        </h3>
                        
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
                            gap: '20px' 
                        }}>
                            {resumenCategorias.map(({ categoria, total, desgloseEstados, Icon, color, bg }) => (
                                <div key={categoria} style={{
                                    background: 'var(--white)',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    border: '1px solid var(--light-gray)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '15px',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ background: bg, color: color, padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Icon size={24} strokeWidth={2} />
                                        </div>
                                        <div>
                                            <span style={{ display: 'block', fontSize: '14px', color: 'var(--color-dark)', fontWeight: '700', textTransform: 'capitalize' }}>{categoria}</span>
                                            <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: '500' }}>Total: {total}</span>
                                        </div>
                                    </div>

                                    <div style={{ 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        gap: '8px', 
                                        borderTop: '1px solid var(--light-gray)', 
                                        paddingTop: '12px' 
                                    }}>
                                        {Object.entries(desgloseEstados).map(([estado, count]) => (
                                            <div key={estado} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: '600' }}>
                                                    {estado.charAt(0) + estado.slice(1).toLowerCase()}
                                                </span>
                                                <Badge text={count.toString()} color={getBadgeColor(estado)} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>

            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Crear Misión Personal">
                <form onSubmit={handleCreateMission} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {createError && (
                        <Alert type="danger" title="Error" message={createError} onClose={() => setCreateError(null)} />
                    )}
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '6px' }}>Categoría</label>
                            <Select 
                                options={opcionesCategoriaModal} 
                                value={createForm.categoria} 
                                onChange={e => setCreateForm({ ...createForm, categoria: e.target.value })} 
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '6px' }}>Fecha</label>
                            <Input required type="date" value={createForm.fecha_programada} onChange={e => setCreateForm({ ...createForm, fecha_programada: e.target.value })} />
                        </div>
                    </div>
                    
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '6px' }}>Ubicación</label>
                        <Input required value={createForm.ubicacion} onChange={e => setCreateForm({ ...createForm, ubicacion: e.target.value })} placeholder="Ej. Lago de Yojoa" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '6px' }}>Dron Asignado</label>
                            <Input required value={createForm.dron_asignado} onChange={e => setCreateForm({ ...createForm, dron_asignado: e.target.value })} placeholder="Ej. DJI Mavic 3" />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '6px' }}>Área (Opcional)</label>
                            <Input value={createForm.area_size} onChange={e => setCreateForm({ ...createForm, area_size: e.target.value })} placeholder="Ej. 4.2 km dist." />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '6px' }}>Descripción</label>
                        <textarea
                            required
                            value={createForm.descripcion}
                            onChange={(e) => setCreateForm({ ...createForm, descripcion: e.target.value })}
                            placeholder="Detalles de la misión..."
                            rows={2}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid var(--light-gray)',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                color: 'var(--color-dark)',
                                outline: 'none',
                                resize: 'vertical'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                        <Button variant="outline-dark" type="button" onClick={() => setIsCreateModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button variant="primary" type="submit" disabled={isCreating}>
                            {isCreating ? 'Creando...' : 'Crear Misión'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}