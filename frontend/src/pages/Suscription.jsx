import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Zap, CreditCard, Check } from 'lucide-react';

import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { SearchBar, Select, Modal, Button, Loader } from '../components/ui';
import { ServiceCard } from '../components/domain/Card';
import { getProductos } from '../api/droneService';

const formatPrice = (precioDesde) =>
    precioDesde
        ? Number(precioDesde).toLocaleString('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
          })
        : 'Consultar';

const adaptSuscripcion = (item, idx) => {
    const defaultFeatures = [
        "2 vuelos de monitoreo mensuales",
        "Reportes analíticos de vigor en PDF",
        "Cobertura de hasta 10 manzanas",
        "Soporte técnico prioritario",
        "Acceso a plataforma web"
    ];

    return {
        id: item.id,
        number: String(idx + 1).padStart(2, '0'),
        icon: idx % 2 === 0 ? Shield : Zap,
        title: item.nombre || item.name || 'Plan sin nombre',
        description: item.descripcion || item.description || 'Plan de servicios aéreos diseñado para potenciar tu operación.',
        price: formatPrice(item.precio_desde),
        precioNumerico: Number(item.precio_desde) || 0,
        period: item.periodo || '/mes',
        destacado: item.destacado === true || item.es_nuevo === true,
        features: (Array.isArray(item.caracteristicas) && item.caracteristicas.length > 0)
            ? item.caracteristicas
            : (Array.isArray(item.features) && item.features.length > 0)
                ? item.features
                : defaultFeatures, 
        tags: Array.isArray(item.tags) && item.tags.length > 0
            ? item.tags 
            : (item.destacado ? ["Soporte 24/7", "Sin contratos"] : [])
    };
};

const SORT_OPTIONS = [
    { value: 'relevancia', label: 'Relevancia' },
    { value: 'destacados', label: 'Recomendados primero' },
    { value: 'precio-asc', label: 'Precio: menor a mayor' },
    { value: 'precio-desc', label: 'Precio: mayor a menor' },
];

export const Suscription = () => {
    const navigate = useNavigate();

    const [suscripciones, setSuscripciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('relevancia');
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        const fetchSuscripciones = async () => {
            try {
                const data = await getProductos();
                const subs = data.filter((item) => item.tipo_producto === 'SUSCRIPCION');
                setSuscripciones(subs.map(adaptSuscripcion));
            } catch (err) {
                console.error('❌ Error al traer los planes:', err);
                setError('No pudimos cargar los planes. Intenta nuevamente.');
            } finally {
                setLoading(false);
            }
        };

        fetchSuscripciones();
    }, []);

    const suscripcionesFiltradas = useMemo(() => {
        const filtradas = suscripciones.filter((s) => {
            const texto = `${s.title} ${s.description}`.toLowerCase();
            return texto.includes(searchTerm.toLowerCase());
        });

        const ordenadas = [...filtradas];
        switch (sortBy) {
            case 'destacados':
                ordenadas.sort((a, b) => Number(b.destacado) - Number(a.destacado));
                break;
            case 'precio-asc':
                ordenadas.sort((a, b) => a.precioNumerico - b.precioNumerico);
                break;
            case 'precio-desc':
                ordenadas.sort((a, b) => b.precioNumerico - a.precioNumerico);
                break;
            default:
                break;
        }
        return ordenadas;
    }, [suscripciones, searchTerm, sortBy]);

    const handleSubscribe = () => {
        if (!selected) return;

        const suscripcionId = selected.id;
        const suscripcionNombre = selected.title;

        setSelected(null);

        navigate('/login', {
            state: {
                from: '/cliente/suscripciones',
                suscripcionId,
                suscripcionNombre,
                message: `Inicia sesión para suscribirte al plan ${suscripcionNombre}.`,
            },
        });
    };

    const hayFiltrosActivos = searchTerm || sortBy !== 'relevancia';

    const limpiarFiltros = () => {
        setSearchTerm('');
        setSortBy('relevancia');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-color)' }}>
            <Navbar />

            <main style={{ flexGrow: 1, padding: '30px 20px' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                        <h1 style={{ fontSize: '28px', color: 'var(--color-dark)', fontWeight: '800', marginBottom: '5px' }}>
                            Nuestros Planes de Suscripción
                        </h1>
                        <p style={{ color: 'var(--text-light)', fontSize: '14px', maxWidth: '600px', margin: '0 auto' }}>
                            Elige el plan que se adapte a tu operación. Soporte técnico, mantenimiento y acceso a plataforma.
                        </p>
                    </div>

                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: '12px',
                        background: 'var(--white)',
                        padding: '12px 20px',
                        borderRadius: '10px',
                        border: '1px solid var(--light-gray)',
                    }}>
                        <div style={{ flex: '1 1 280px', minWidth: '240px' }}>
                            <SearchBar
                                placeholder="Buscar plan..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <Select
                            options={SORT_OPTIONS}
                            variant="dark"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        />

                        {hayFiltrosActivos && (
                            <Button
                                variant="outline-dark"
                                onClick={limpiarFiltros}
                                style={{ padding: '10px 16px', fontSize: '13px' }}
                            >
                                Limpiar filtros
                            </Button>
                        )}
                    </div>

                    {!loading && !error && (
                        <div style={{ padding: '0 5px' }}>
                            <span style={{ color: 'var(--text-light)', fontSize: '13px' }}>
                                {suscripcionesFiltradas.length} {suscripcionesFiltradas.length === 1 ? 'plan encontrado' : 'planes encontrados'}
                            </span>
                        </div>
                    )}

                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                            <Loader text="Cargando planes..." />
                        </div>
                    ) : error ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-light)' }}>
                            <CreditCard size={40} style={{ opacity: 0.2, marginBottom: '10px' }} />
                            <h3>No pudimos cargar los planes</h3>
                            <p>{error}</p>
                            <Button variant="outline-dark" onClick={() => window.location.reload()} style={{ marginTop: '15px' }}>
                                Reintentar
                            </Button>
                        </div>
                    ) : suscripcionesFiltradas.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-light)' }}>
                            <CreditCard size={40} style={{ opacity: 0.2, marginBottom: '10px' }} />
                            <h3>No se encontraron planes</h3>
                            <p>Intenta buscar con otras palabras o limpia los filtros.</p>
                            {hayFiltrosActivos && (
                                <Button variant="outline-dark" onClick={limpiarFiltros} style={{ marginTop: '15px' }}>
                                    Limpiar filtros
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '24px',
                            alignItems: 'stretch',
                        }}>
                            {suscripcionesFiltradas.map((suscripcion) => (
                                <div key={suscripcion.id} style={{ display: 'flex', justifyContent: 'center', height: '100%' }}>
                                    <ServiceCard
                                        service={suscripcion}
                                        onSuscribir={setSelected}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Modal
                isOpen={!!selected}
                onClose={() => setSelected(null)}
                title={selected?.title}
            >
                {selected && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <p style={{ color: 'var(--text-light)', lineHeight: '1.5', fontSize: '14px', margin: 0 }}>
                            {selected.description}
                        </p>

                        {selected.features && selected.features.length > 0 && (
                            <div>
                                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-light)', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '8px' }}>
                                    BENEFICIOS
                                </span>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {selected.features.map((feature, i) => (
                                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-dark)' }}>
                                            <div style={{ background: 'rgba(4, 201, 166, 0.15)', padding: '3px', borderRadius: '50%', display: 'flex' }}>
                                                <Check size={12} color="var(--color-primary)" strokeWidth={3} />
                                            </div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--light-gray)', paddingTop: '15px' }}>
                            <div>
                                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-light)', fontWeight: 'bold' }}>PRECIO</span>
                                <strong style={{ fontSize: '22px', color: 'var(--color-primary)' }}>
                                    {selected.price}
                                    <span style={{ fontSize: '13px', color: 'var(--text-light)', fontWeight: 'normal', marginLeft: '4px' }}>
                                        {selected.period}
                                    </span>
                                </strong>
                            </div>

                            <Button
                                type="button"
                                variant="primary"
                                onClick={handleSubscribe}
                                style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <CreditCard size={18} /> Suscribirse
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            <Footer />
        </div>
    );
};

export default Suscription;