import { useState, useEffect } from 'react';
import { Plane, Droplets, Eye, Camera, Target } from 'lucide-react';
import { getMisiones, cambiarEstadoMision } from '../../api/pilotoService';
import { 
    SectionHeading, 
    Tabs, 
    SearchBar, 
    Loader, 
    Alert,
    Select,
    Badge
} from '../../components/ui';
import { MisionCard } from '../../components/domain/MisionCard';

// Helper para obtener ícono y color según categoría
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

// Helper para color de Badge según estado (para el resumen)
const getBadgeColor = (estado) => {
    switch (estado) {
        case 'PENDIENTE': return 'warning';
        case 'ACEPTADA': return 'info';
        case 'EN_CURSO': return 'primary';
        case 'COMPLETADA': return 'success';
        case 'RECHAZADA': return 'danger';
        default: return 'dark';
    }
};

export default function PilotoMisiones() {
    const [mainMode, setMainMode] = useState("PERSONAL");
    const [misiones, setMisiones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    
    // Filtros
    const [searchTerm, setSearchTerm] = useState("");
    const [filtroCategoria, setFiltroCategoria] = useState("TODAS");
    const [filtroEstado, setFiltroEstado] = useState("TODOS");

    const estadosDisponibles = ['PENDIENTE', 'ACEPTADA', 'EN_CURSO', 'COMPLETADA', 'RECHAZADA'];

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            setCargando(true);
            try {
                const data = await getMisiones(mainMode);
                if (isMounted) setMisiones(data);
            } catch (error) {
                console.error(error);
                if (isMounted) setErrorMsg(error.message || "Error al cargar las misiones.");
            } finally {
                if (isMounted) setCargando(false);
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, [mainMode]);

    const handleCambiarEstado = async (id, nuevoEstado) => {
        setErrorMsg(null);
        try {
            await cambiarEstadoMision(id, nuevoEstado);
            const data = await getMisiones(mainMode);
            setMisiones(data);
        } catch (error) {
            setErrorMsg(error.message);
        }
    };

    // Obtener categorías únicas
    const categoriasUnicas = [...new Set(misiones.map(m => m.categoria).filter(Boolean))];
    
    // Generar el resumen por categoría con desglose de estados
    const resumenCategorias = categoriasUnicas.map(cat => {
        const misionesCat = misiones.filter(m => m.categoria === cat);
        const total = misionesCat.length;
        
        // Contar cuántas hay de cada estado
        const desgloseEstados = estadosDisponibles.reduce((acc, est) => {
            const count = misionesCat.filter(m => m.estado === est).length;
            if (count > 0) acc[est] = count;
            return acc;
        }, {});

        const style = getCategoryStyle(cat);
        return { categoria: cat, total, desgloseEstados, ...style };
    }).filter(cat => cat.total > 0); // Si el total es 0, no se muestra la tarjeta

    // Opciones para los selects
    const opcionesCategoria = [
        { value: 'TODAS', label: 'Todas las categorías' },
        ...categoriasUnicas.map(cat => ({ value: cat, label: cat }))
    ];

    const opcionesEstado = [
        { value: 'TODOS', label: 'Todos los estados' },
        ...estadosDisponibles.map(est => ({ value: est, label: est }))
    ];

    // Filtrar misiones
    const misionesFiltradas = misiones.filter(mision => {
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
                
                <SectionHeading 
                    eyebrow="Gestión de Vuelos"
                    title="Misiones Asignadas" 
                    description="Administra tus vuelos personales y los servicios solicitados por terceros."
                />

                {/* Pestañas de Modo */}
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

                {/* Barra de Filtros */}
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

                {/* Alerta de Error */}
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

                {/* Contenido Principal (Misiones) */}
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
                            No se encontraron misiones que coincidan con los filtros aplicados.
                        </p>
                    </div>
                ) : (
                    <div style={{ 
                        display: 'grid', 
                        gap: '24px', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' 
                    }}>
                        {misionesFiltradas.map((mision) => (
                            <MisionCard 
                                key={mision.id} 
                                mision={mision} 
                                onStatusChange={handleCambiarEstado}
                                isPersonal={mainMode === 'PERSONAL'} 
                            />
                        ))}
                    </div>
                )}

                {/* Tarjetas de Resumen por Categoría */}
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
                                    {/* Cabecera de la tarjeta de resumen */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ background: bg, color: color, padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Icon size={24} strokeWidth={2} />
                                        </div>
                                        <div>
                                            <span style={{ display: 'block', fontSize: '14px', color: 'var(--color-dark)', fontWeight: '700', textTransform: 'capitalize' }}>{categoria}</span>
                                            <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: '500' }}>Total: {total}</span>
                                        </div>
                                    </div>

                                    {/* Desglose de estados */}
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
        </div>
    );
}