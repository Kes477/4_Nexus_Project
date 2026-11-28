import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Drone } from 'lucide-react';

import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { SearchBar, Select, Modal, Button, Loader } from '../components/ui';

import { ProductCard } from '../components/domain/Card';

import { getProducto, getProductos } from '../api/droneService';
import { useSesion } from '../hooks/useSesion';
import { useCarrito } from '../hooks/useCarrito';
import { primerError } from '../utils/errores';

const DEFAULT_DRONE_IMG =
    'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=600&auto=format&fit=crop';

const formatPrice = (precioDesde) =>
    precioDesde
        ? `L ${Number(precioDesde).toLocaleString('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
          })}`
        : 'Consultar';

const formatoLempiras = (valor) =>
    `L ${Number(valor).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const adaptEquipoToProduct = (dron) => ({
    id: dron.id,
    name: dron.nombre,
    label: 'Equipo',
    category: dron.marca || dron.categoria || 'Dron',
    icon: Drone,
    image: dron.imagen_principal || DEFAULT_DRONE_IMG,
    price: formatPrice(dron.precio_desde),
    description: dron.descripcion || 'Sin descripción disponible.',
    destacado: dron.es_destacado,
});

const SORT_OPTIONS = [
    { value: 'relevancia', label: 'Relevancia' },
    { value: 'precio-asc', label: 'Precio: menor a mayor' },
    { value: 'precio-desc', label: 'Precio: mayor a menor' },
    { value: 'nombre', label: 'Nombre A-Z' },
];

export const Catalog = () => {
    const navigate = useNavigate();

    const [dronesRaw, setDronesRaw] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todas');
    const [sortBy, setSortBy] = useState('relevancia');
    const [selectedItem, setSelectedItem] = useState(null);
    const { usuario, rol } = useSesion();
    const { agregar } = useCarrito();

    const [variantes, setVariantes] = useState([]);
    const [varianteId, setVarianteId] = useState('');
    const [cantidad, setCantidad] = useState(1);
    const [cargandoVariantes, setCargandoVariantes] = useState(false);
    const [agregando, setAgregando] = useState(false);
    const [mensaje, setMensaje] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getProductos();
                const lista = Array.isArray(data) ? data : data.results || [];
                const articulos = lista.filter((item) => item.tipo_producto === 'ARTICULO');
                setDronesRaw(articulos);
            } catch (err) {
                console.error('Error al traer el catálogo:', err);
                setError('No pudimos cargar el catálogo. Intenta nuevamente.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const itemsConRaw = useMemo(
        () => dronesRaw.map((raw) => ({ adaptado: adaptEquipoToProduct(raw), raw })),
        [dronesRaw]
    );

    const categoriasOptions = useMemo(() => {
        const cats = ['Todas', ...new Set(
            itemsConRaw.map(({ raw }) => raw.marca || raw.categoria || 'Otros')
        )];
        return cats.map((cat) => ({
            value: cat,
            label: cat === 'Todas' ? 'Todas las categorías' : cat,
        }));
    }, [itemsConRaw]);

    const itemsFiltrados = useMemo(() => {
        const filtrados = itemsConRaw.filter(({ raw }) => {
            const texto = `${raw.nombre} ${raw.descripcion || ''}`.toLowerCase();
            const matchesSearch = texto.includes(searchTerm.toLowerCase());
            const cat = raw.marca || raw.categoria || 'Otros';
            const matchesCategory = selectedCategory === 'Todas' || cat === selectedCategory;
            return matchesSearch && matchesCategory;
        });

        const ordenados = [...filtrados];
        switch (sortBy) {
            case 'precio-asc':
                ordenados.sort((a, b) => Number(a.raw.precio_desde || 0) - Number(b.raw.precio_desde || 0));
                break;
            case 'precio-desc':
                ordenados.sort((a, b) => Number(b.raw.precio_desde || 0) - Number(a.raw.precio_desde || 0));
                break;
            case 'nombre':
                ordenados.sort((a, b) => a.raw.nombre.localeCompare(b.raw.nombre));
                break;
            default:
                break;
        }
        return ordenados;
    }, [itemsConRaw, searchTerm, selectedCategory, sortBy]);

    const abrirItem = async (raw) => {
        setSelectedItem(raw);
        setVariantes([]);
        setVarianteId('');
        setCantidad(1);
        setMensaje(null);

        if (!usuario || rol !== 'cliente') return;

        setCargandoVariantes(true);
        try {
            const detalle = await getProducto(raw.id);
            const lista = detalle.variantes ?? [];
            setVariantes(lista);
            const primera = lista.find((v) => v.disponible) ?? lista[0];
            setVarianteId(primera ? String(primera.id) : '');
        } catch {
            setMensaje({ tipo: 'danger', texto: 'No se pudieron cargar las opciones de este producto.' });
        } finally {
            setCargandoVariantes(false);
        }
    };

    const cerrarModal = () => {
        setSelectedItem(null);
        setMensaje(null);
    };

    const irALogin = () => {
        const item = selectedItem;
        cerrarModal();
        navigate('/login', {
            state: {
                from: '/catalog',
                message: `Inicia sesión para comprar ${item.nombre}.`,
            },
        });
    };

    const agregarAlCarrito = async () => {
        setMensaje(null);
        setAgregando(true);
        try {
            await agregar(Number(varianteId), cantidad);
            setMensaje({ tipo: 'success', texto: 'Producto agregado al carrito.' });
        } catch (error) {
            setMensaje({ tipo: 'danger', texto: primerError(error) });
        } finally {
            setAgregando(false);
        }
    };

    const varianteElegida = variantes.find((v) => String(v.id) === varianteId);

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
                                {itemsFiltrados.length} {itemsFiltrados.length === 1 ? 'dron encontrado' : 'drones encontrados'}
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
                    ) : itemsFiltrados.length === 0 ? (
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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 260px)', justifyContent: 'center', gap: '20px' }}>
                            {itemsFiltrados.map(({ adaptado, raw }) => (
                                <div key={adaptado.id} style={{ width: '260px' }}>
                                    <ProductCard
                                        product={adaptado}
                                        onCotizar={() => abrirItem(raw)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Modal
                isOpen={!!selectedItem}
                onClose={cerrarModal}
                title={selectedItem?.nombre}
            >
                {selectedItem && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {selectedItem.imagen_principal ? (
                            <img
                                src={selectedItem.imagen_principal}
                                alt={selectedItem.nombre}
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
                            {selectedItem.descripcion || 'Sin descripción disponible.'}
                        </p>

                        <div style={{ borderTop: '1px solid var(--light-gray)', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                            {mensaje && (
                                <div style={{
                                    padding: '10px 12px', borderRadius: '6px', fontSize: '13px',
                                    background: mensaje.tipo === 'success' ? 'rgba(4, 201, 166, 0.1)' : 'rgba(220, 53, 69, 0.1)',
                                    color: mensaje.tipo === 'success' ? 'var(--color-primary)' : 'var(--color-danger)',
                                }}>
                                    {mensaje.texto}
                                    {mensaje.tipo === 'success' && (
                                        <button
                                            type="button"
                                            onClick={() => navigate('/cliente/carrito')}
                                            style={{ marginLeft: '8px', background: 'none', border: 'none', color: 'inherit', fontWeight: 'bold', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
                                        >
                                            Ver carrito
                                        </button>
                                    )}
                                </div>
                            )}

                            {usuario && rol === 'cliente' && (
                                cargandoVariantes ? (
                                    <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>Cargando opciones...</span>
                                ) : variantes.length > 0 && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: '10px' }}>
                                        <select
                                            value={varianteId}
                                            onChange={(e) => setVarianteId(e.target.value)}
                                            style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--light-gray)', background: 'var(--white)', color: 'var(--color-dark)' }}
                                        >
                                            {variantes.map((v) => (
                                                <option key={v.id} value={v.id}>
                                                    {[v.sku, ...v.atributos.map((a) => a.valor_atributo)].join(' · ')}
                                                    {v.disponible ? '' : ' (agotado)'}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="number"
                                            min="1"
                                            value={cantidad}
                                            onChange={(e) => setCantidad(Math.max(1, Number(e.target.value) || 1))}
                                            style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--light-gray)', background: 'var(--white)', color: 'var(--color-dark)' }}
                                        />
                                    </div>
                                )
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-light)', fontWeight: 'bold' }}>PRECIO</span>
                                    <strong style={{ fontSize: '22px', color: 'var(--color-primary)' }}>
                                        {varianteElegida
                                            ? formatoLempiras(varianteElegida.precio)
                                            : formatPrice(selectedItem.precio_desde)}
                                    </strong>
                                </div>

                                {!usuario && (
                                    <Button variant="primary" onClick={irALogin} style={{ padding: '10px 20px', display: 'flex', gap: '8px' }}>
                                        <ShoppingBag size={18} /> Inicia sesión para comprar
                                    </Button>
                                )}

                                {usuario && rol === 'cliente' && (
                                    <Button
                                        variant="primary"
                                        onClick={agregarAlCarrito}
                                        disabled={!varianteId || agregando}
                                        style={{ padding: '10px 20px', display: 'flex', gap: '8px' }}
                                    >
                                        <ShoppingBag size={18} /> {agregando ? 'Agregando...' : 'Agregar al carrito'}
                                    </Button>
                                )}

                                {usuario && rol !== 'cliente' && (
                                    <span style={{ fontSize: '12px', color: 'var(--text-light)', maxWidth: '180px', textAlign: 'right' }}>
                                        Solo las cuentas de cliente pueden comprar.
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <Footer />
        </div>
    );
};

export default Catalog;