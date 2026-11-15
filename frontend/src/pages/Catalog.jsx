import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { SearchBar, Select, Modal, Button, Loader } from '../components/ui';
import { ItemProductCard } from '../components/domain/ItemCard';

const API_URL = 'http://localhost:8000/api/catalogo/productos/';

const formatPrice = (precioDesde) =>
    precioDesde
        ? Number(precioDesde).toLocaleString('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
          })
        : 'Consultar';

const adaptDron = (item) => ({
    id: item.id,
    name: item.nombre,
    description: item.descripcion || 'Sin descripción disponible.',
    price: formatPrice(item.precio_desde),
    numericPrice: Number(item.precio_desde) || 0,
    rating: item.rating ?? 5,
    isNew: item.es_nuevo === true,
    category: item.marca || item.categoria || 'Otros',
    size: Number(item.tamano ?? item.tamaño ?? item.peso ?? item.capacidad_carga ?? 0) || 0,
    image: item.imagen_principal || null,
    hasImage: Boolean(item.imagen_principal),
    battery: item.autonomia || '45 min',
    stock: item.stock || null,
});

const SORT_OPTIONS = [
    { value: 'relevancia', label: 'Relevancia' },
    { value: 'precio-asc', label: 'Precio: menor a mayor' },
    { value: 'precio-desc', label: 'Precio: mayor a menor' },
    { value: 'rating', label: 'Mejor valorados' },
    { value: 'tamano-asc', label: 'Tamaño: menor a mayor' },
    { value: 'tamano-desc', label: 'Tamaño: mayor a menor' },
    { value: 'categoria', label: 'Categoría A-Z' },
];

export const Catalog = () => {
    const navigate = useNavigate();

    const [drones, setDrones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todas');
    const [sortBy, setSortBy] = useState('relevancia');
    const [selectedDrone, setSelectedDrone] = useState(null);

    useEffect(() => {
        const fetchDrones = async () => {
            try {
                const respuesta = await fetch(API_URL);
                if (!respuesta.ok) throw new Error('Error al cargar el catálogo');

                const data = await respuesta.json();
                const articulos = data.filter((item) => item.tipo_producto === 'ARTICULO');
                setDrones(articulos.map(adaptDron));
            } catch (err) {
                console.error('Error al traer el catálogo:', err);
                setError('No pudimos cargar el catálogo. Intenta nuevamente.');
            } finally {
                setLoading(false);
            }
        };

        fetchDrones();
    }, []);

    const categoriasOptions = useMemo(() => {
        const cats = ['Todas', ...new Set(drones.map((d) => d.category))];
        return cats.map((cat) => ({
            value: cat,
            label: cat === 'Todas' ? 'Todas las categorías' : cat,
        }));
    }, [drones]);

    const dronesFiltrados = useMemo(() => {
        const filtrados = drones.filter((dron) => {
            const texto = `${dron.name} ${dron.description}`.toLowerCase();
            const matchesSearch = texto.includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'Todas' || dron.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });

        const ordenados = [...filtrados];
        switch (sortBy) {
            case 'precio-asc':
                ordenados.sort((a, b) => a.numericPrice - b.numericPrice);
                break;
            case 'precio-desc':
                ordenados.sort((a, b) => b.numericPrice - a.numericPrice);
                break;
            case 'rating':
                ordenados.sort((a, b) => b.rating - a.rating);
                break;
            case 'tamano-asc':
                ordenados.sort((a, b) => a.size - b.size);
                break;
            case 'tamano-desc':
                ordenados.sort((a, b) => b.size - a.size);
                break;
            case 'categoria':
                ordenados.sort((a, b) => a.category.localeCompare(b.category));
                break;
            default:
                break;
        }
        return ordenados;
    }, [drones, searchTerm, selectedCategory, sortBy]);

    const handlePurchase = () => {
        const dronParaComprar = selectedDrone;
        setSelectedDrone(null);
        navigate('/login', {
            state: {
                from: '/cliente/drones',
                selectedDrone: dronParaComprar,
                message: dronParaComprar
                    ? `Inicia sesión para comprar el ${dronParaComprar.name}.`
                    : 'Inicia sesión para continuar con tu compra.',
            },
        });
    };

    const hayFiltrosActivos = searchTerm || selectedCategory !== 'Todas' || sortBy !== 'relevancia';

    const limpiarFiltros = () => {
        setSearchTerm('');
        setSelectedCategory('Todas');
        setSortBy('relevancia');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-color)' }}>
            <Navbar />

            <main style={{ flexGrow: 1, padding: '30px 20px' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                        <h1 style={{ fontSize: '28px', color: 'var(--color-dark)', fontWeight: '800', marginBottom: '5px' }}>
                            Catálogo de Drones
                        </h1>
                        <p style={{ color: 'var(--text-light)', fontSize: '14px', maxWidth: '600px', margin: '0 auto' }}>
                            Explora nuestra selección de aeronaves para agricultura, topografía y uso industrial.
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
                                placeholder="Buscar dron..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <Select
                            options={categoriasOptions}
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        />

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
                                {dronesFiltrados.length} {dronesFiltrados.length === 1 ? 'dron encontrado' : 'drones encontrados'}
                            </span>
                        </div>
                    )}

                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                            <Loader text="Cargando catálogo..." />
                        </div>
                    ) : error ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-light)' }}>
                            <ShoppingBag size={40} style={{ opacity: 0.2, marginBottom: '10px' }} />
                            <h3>No pudimos cargar el catálogo</h3>
                            <p>{error}</p>
                            <Button variant="outline-dark" onClick={() => window.location.reload()} style={{ marginTop: '15px' }}>
                                Reintentar
                            </Button>
                        </div>
                    ) : dronesFiltrados.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-light)' }}>
                            <ShoppingBag size={40} style={{ opacity: 0.2, marginBottom: '10px' }} />
                            <h3>No se encontraron drones</h3>
                            <p>Intenta buscar con otras palabras o cambiar la categoría.</p>
                            {hayFiltrosActivos && (
                                <Button variant="outline-dark" onClick={limpiarFiltros} style={{ marginTop: '15px' }}>
                                    Limpiar filtros
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                            {dronesFiltrados.map((dron) => (
                                <div key={dron.id} style={{ height: '100%', display: 'flex' }}>
                                    <ItemProductCard 
                                        item={dron} 
                                        mode="catalog" 
                                        onAction={setSelectedDrone} 
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Modal
                isOpen={!!selectedDrone}
                onClose={() => setSelectedDrone(null)}
                title={selectedDrone?.name}
            >
                {selectedDrone && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {selectedDrone.hasImage ? (
                            <img
                                src={selectedDrone.image}
                                alt={selectedDrone.name}
                                style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px' }}
                            />
                        ) : (
                            <div style={{
                                width: '100%', height: '200px', borderRadius: '8px',
                                background: 'var(--bg-color)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                <i className="fa-solid fa-image" style={{ fontSize: '56px', color: 'var(--light-gray)' }} />
                            </div>
                        )}
                        <p style={{ color: 'var(--text-light)', lineHeight: '1.5', fontSize: '14px' }}>
                            {selectedDrone.description}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--light-gray)', paddingTop: '15px' }}>
                            <div>
                                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-light)', fontWeight: 'bold' }}>PRECIO</span>
                                <strong style={{ fontSize: '22px', color: 'var(--color-primary)' }}>
                                    {selectedDrone.price === 'Consultar' ? 'Consultar' : `L ${selectedDrone.price}`}
                                </strong>
                            </div>

                            <Button variant="primary" onClick={handlePurchase} style={{ padding: '10px 20px', display: 'flex', gap: '8px' }}>
                                <ShoppingBag size={18} /> Comprar Ahora
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            <Footer />
        </div>
    );
};

export default Catalog;