import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award } from 'lucide-react';
import { Button, Tabs, Loader, Alert } from '../../components/ui';
import { ItemProductCard } from '../../components/domain/ItemCard';
import CheckoutComprarAhora from '../../components/cliente/CheckoutComprarAhora';
import { getProductos } from '../../api/droneService';

/* =========================================================
   COMPONENTE PRINCIPAL: CLIENTE DRONES
   =========================================================
   APLICACIÓN DE PRINCIPIOS SOLID EN ESTE COMPONENTE:

   [SOLID - SRP]: Este componente tiene UNA SOLA responsabilidad:
   manejar la vista de la lista de drones. Ya no procesa pagos.

   [SOLID - DIP]: En lugar de usar `fetch` directamente para el catálogo,
   dependemos de la abstracción `getProductos()`. Si la URL cambia,
   solo modificamos el servicio.

   [SOLID - OCP]: Usamos `ItemProductCard` pasándole `actionText`.
   El componente está cerrado a modificación (no tocamos su código interno)
   pero abierto a extensión (acepta el texto dinámico).
   ========================================================= */
export const ClienteDrones = () => {
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

    const [activeTab, setActiveTab] = useState('mis-drones');
    const [selectedDrone, setSelectedDrone] = useState(null);
    
    const [misDrones, setMisDrones] = useState([]);
    const [catalogo, setCatalogo] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);

    const tabLabels = ['Mis Drones', 'Comprar'];
    const activeTabIndex = activeTab === 'mis-drones' ? 0 : 1;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('access_token');
                
                const results = await Promise.allSettled([
                    fetch(`${API_URL}/cliente/drones/`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }).then(res => {
                        if (!res.ok) throw new Error('Error al cargar mis drones');
                        return res.json();
                    }),
                    // [SOLID - DIP] Uso de la abstracción del servicio
                    getProductos() 
                ]);

                if (results[0].status === 'fulfilled') {
                    const dataOwned = results[0].value;
                    const ownedAdapted = dataOwned.map(dron => ({
                        id: dron.id,
                        nombre: dron.nombre,
                        modelo: dron.modelo || 'Modelo Estándar',
                        estado: dron.estado || 'Operativo',
                        bateria: dron.bateria || 100,
                        horas: dron.horas_vuelo || 0,
                        rating: 5
                    }));
                    setMisDrones(ownedAdapted);
                } else {
                    console.warn("No se pudieron cargar 'Mis Drones'.", results[0].reason);
                }

                if (results[1].status === 'fulfilled') {
                    const dataCatalog = results[1].value;
                    const catalogAdapted = dataCatalog
                        .filter(item => item.tipo_producto === 'ARTICULO')
                        .map(dron => ({
                            id: dron.id,
                            nombre: dron.nombre,
                            precio: dron.precio_desde ? Number(dron.precio_desde).toLocaleString('en-US') : 'Consultar',
                            desc: dron.descripcion || 'Sin descripción.',
                            categoria: dron.marca || 'General',
                            destacado: dron.es_nuevo || false,
                            rating: dron.rating || 5,
                            imagen: dron.imagen_principal || null
                        }));
                    setCatalogo(catalogAdapted);
                } else {
                    setErrorMsg('No pudimos cargar el catálogo de drones.');
                }

            } catch {
                setErrorMsg('No pudimos cargar la información. Verifica tu conexión.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [API_URL]);

    const handleSupportRequest = (drone) => {
        console.log("Solicitando ayuda técnica para:", drone.nombre);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Loader text="Cargando drones..." />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {errorMsg && (
                <Alert type="danger" title="Atención" message={errorMsg} onClose={() => setErrorMsg(null)} />
            )}

            {!selectedDrone ? (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '22px', color: 'var(--color-dark)', fontWeight: '800' }}>Adquisición y Estado de Drones</h1>
                            <p style={{ color: 'var(--text-light)', fontSize: '13px', marginTop: '5px' }}>Supervisa tu flota o explora el catálogo.</p>
                        </div>
                        <Button variant="outline-primary" size="sm">
                            <Award size={14}/> Cambiar a Piloto
                        </Button>
                    </div>

                    <div style={{ padding: '10px 20px 15px 20px', borderBottom: '1px solid var(--light-gray)', background: 'var(--bg-color)', display: 'flex' }}>
                        <Tabs 
                            tabs={tabLabels} 
                            activeTab={activeTabIndex} 
                            onChange={(idx) => setActiveTab(idx === 0 ? 'mis-drones' : 'comprar')} 
                        />
                    </div>

                    {activeTab === 'mis-drones' && (
                        misDrones.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '15px', alignItems: 'stretch', marginTop: '10px' }}>
                                {misDrones.map(dron => (
                                    <div key={dron.id} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                        <ItemProductCard 
                                            item={dron} 
                                            mode="owned" 
                                            onAction={handleSupportRequest} 
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-light)' }}>
                                No tienes drones registrados aún.
                            </div>
                        )
                    )}

                    {activeTab === 'comprar' && (
                        catalogo.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '15px', alignItems: 'stretch', marginTop: '10px' }}>
                                {catalogo.map(dron => (
                                    <div key={dron.id} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                        {/* [SOLID - OCP] Extendemos el comportamiento del botón sin modificar ItemProductCard */}
                                        <ItemProductCard 
                                            item={dron} 
                                            mode="catalog" 
                                            onAction={setSelectedDrone} 
                                            actionText="Comprar Ahora" 
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-light)' }}>
                                No hay drones disponibles en el catálogo.
                            </div>
                        )
                    )}
                </>
            ) : (
                <CheckoutComprarAhora
                    producto={selectedDrone}
                    onBack={() => setSelectedDrone(null)}
                    onSeguir={() => navigate('/cliente/pedidos')}
                />
            )}
        </div>
    );
};