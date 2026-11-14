import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, ShoppingBag } from 'lucide-react';

import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { Input, Modal, Button, Loader } from '../components/ui';
import DroneCard from '../components/domain/DroneCard'; 

const datosSimulados = [
    { id: 1, nombre: 'DJI FlyCart 30', descripcion_corta: 'Capacidad de carga útil de 30 kg con rango operativo extendido y resistencia climática.', precio: '450,000', rating: 5, es_nuevo: true, categoria: 'DJI', imagen: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=600&auto=format&fit=crop' },
    { id: 2, nombre: 'Ehang 184', descripcion_corta: 'Vehículo aéreo autónomo eléctrico diseñado para transporte seguro de un pasajero.', precio: '2,400,000', rating: 4, es_nuevo: false, categoria: 'Ehang', imagen: 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?q=80&w=600&auto=format&fit=crop' },
    { id: 3, nombre: 'GRIFF Aviation 300', descripcion_corta: 'Megadron industrial octocóptero diseñado para la elevación de insumos pesados.', precio: '1,850,000', rating: 5, es_nuevo: false, categoria: 'GRIFF', imagen: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?q=80&w=600&auto=format&fit=crop' },
    { id: 4, nombre: 'Freefly Alta X', descripcion_corta: 'Con una impresionante capacidad de elevación de 15 kg, redefine lo posible en cinematografía.', precio: '620,000', rating: 5, es_nuevo: true, categoria: 'Freefly', imagen: 'https://images.unsplash.com/photo-1524143986875-3b098d78b363?q=80&w=600&auto=format&fit=crop' },
    { id: 5, nombre: 'JOUAV CW-80E', descripcion_corta: 'Largo alcance y capacidad de carga de 25 kg para sensores de alta gama.', precio: '1,150,000', rating: 4, es_nuevo: false, categoria: 'JOUAV', imagen: 'https://images.unsplash.com/photo-1593001620493-89b67df769b0?q=80&w=600&auto=format&fit=crop' },
    { id: 6, nombre: 'Matrice 300 RTK', descripcion_corta: 'Plataforma industrial versátil con 55 minutos de tiempo de vuelo y resistencia al agua IP45.', precio: '980,000', rating: 5, es_nuevo: true, categoria: 'DJI', imagen: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=600&auto=format&fit=crop' }
];

export const Catalog = () => {
    const navigate = useNavigate(); 

    const [drones, setDrones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todas'); 
    const [selectedDrone, setSelectedDrone] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDrones(datosSimulados);
            setLoading(false);
        }, 800);

        return () => clearTimeout(timer);
    }, []);

    const dronesFiltrados = drones.filter(dron => {
        const matchesSearch = dron.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              dron.descripcion_corta.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'Todas' || dron.categoria === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handlePurchase = () => {
        const token = localStorage.getItem('access_token');
        
        const noEstaLogueado = !token || token === "undefined" || token === "null" || token.trim() === "";

        if (noEstaLogueado) {
            navigate('/login');
        } else {
            setSelectedDrone(null);
            navigate('/cliente/drones');
        }
    };

    const categoriasUnicas = ['Todas', ...new Set(datosSimulados.map(d => d.categoria))];

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
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                        flexWrap: 'wrap', gap: '15px', background: 'var(--white)', 
                        padding: '12px 20px', borderRadius: '10px', border: '1px solid var(--light-gray)' 
                    }}>
                        <div style={{ flex: '1 1 250px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Search size={18} color="var(--text-light)" />
                            <Input 
                                type="text" 
                                placeholder="Buscar dron..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '100%', border: 'none', boxShadow: 'none', padding: '5px', background: 'transparent' }}
                            />
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <SlidersHorizontal size={18} color="var(--text-light)" />
                            <select 
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                style={{
                                    padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--light-gray)',
                                    background: 'var(--bg-color)', color: 'var(--color-dark)', fontSize: '14px', outline: 'none', cursor: 'pointer'
                                }}
                            >
                                {categoriasUnicas.map((cat, index) => (
                                    <option key={index} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                            <Loader text="Cargando catálogo..." />
                        </div>
                    ) : dronesFiltrados.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-light)' }}>
                            <ShoppingBag size={40} style={{ opacity: 0.2, marginBottom: '10px' }} />
                            <h3>No se encontraron drones</h3>
                            <p>Intenta buscar con otras palabras o cambiar la categoría.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                            {dronesFiltrados.map((dron) => (
                                <div key={dron.id} style={{ display: 'flex', justifyContent: 'center' }}>
                                    <DroneCard 
                                        drone={dron} 
                                        onViewDetails={setSelectedDrone} 
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
                title={selectedDrone?.nombre}
            >
                {selectedDrone && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <img 
                            src={selectedDrone.imagen} 
                            alt={selectedDrone.nombre} 
                            style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px' }} 
                        />
                        <p style={{ color: 'var(--text-light)', lineHeight: '1.5', fontSize: '14px' }}>
                            {selectedDrone.descripcion_corta}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--light-gray)', paddingTop: '15px' }}>
                            <div>
                                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-light)', fontWeight: 'bold' }}>PRECIO</span>
                                <strong style={{ fontSize: '22px', color: 'var(--color-primary)' }}>L {selectedDrone.precio}</strong>
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