import { useState, useEffect } from 'react';
import { Zap, Tag, Wrench, UserCheck, Shield } from 'lucide-react';
import { Tabs, Loader, Alert } from '../../components/ui';
import { ItemServiceCard } from '../../components/domain/ItemCard';
import CheckoutComprarAhora from '../../components/cliente/CheckoutComprarAhora';
import MisSuscripciones from '../../components/cliente/MisSuscripciones';
import { getProductos } from '../../api/droneService';

/* =========================================================
   SOLID - SRP PRINCIPIO DE RESPONSABILIDAD ÚNICA
   Este componente maneja UNA SOLA responsabilidad: 
   Obtener los datos, manejar las pestañas (tabs) y renderizar las tarjetas.
   No procesa pagos ni valida tarjetas de crédito.
   ========================================================= */
export const ClienteSuscripciones = () => {
    const [activeTab, setActiveTab] = useState('mis-suscripciones');
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [servicios, setServicios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);

    const tabKeys = ['mis-suscripciones', 'generales', 'descuentos-drones', 'asistencia-tecnica', 'contratacion-piloto'];
    const tabLabels = ['Mis Suscripciones', 'Planes Generales', 'Descuentos Drones', 'Asistencia Técnica', 'Contratar Piloto'];
    const activeTabIndex = tabKeys.indexOf(activeTab);

    useEffect(() => {
        const fetchData = async () => {
            try {
                /* SOLID - DIP PRINCIPIO DE INVERSIÓN DE DEPENDENCIAS
                   En lugar de acoplar el componente a `fetch` o a una URL específica, 
                   dependemos de una abstracción (el servicio `getProductos`). 
                   Si mañana cambia el endpoint o se usa GraphQL, solo se modifica el servicio,
                   no este componente. */
                const data = await getProductos();
                
                const serviciosData = data.filter(item => item.tipo_producto === 'SUSCRIPCION');
                
                const adaptedServicios = serviciosData.map((item, idx) => {
                    let Icono = idx % 2 === 0 ? Shield : Zap;
                    const cat = item.categoria || 'generales';
                    
                    if (cat === 'descuentos-drones') Icono = Tag;
                    if (cat === 'asistencia-tecnica') Icono = Wrench;
                    if (cat === 'contratacion-piloto') Icono = UserCheck;

                    const defaultFeatures = [
                        "Soporte técnico especializado",
                        "Acceso a plataforma web",
                        "Reportes analíticos"
                    ];
                    
                    let featuresArray = [];
                    if (Array.isArray(item.caracteristicas) && item.caracteristicas.length > 0) featuresArray = item.caracteristicas;
                    else if (Array.isArray(item.features) && item.features.length > 0) featuresArray = item.features;
                    else featuresArray = defaultFeatures;

                    return {
                        id: item.id,
                        categoria: cat,
                        nombre: item.nombre || item.name || 'Plan sin nombre',
                        precio: item.precio_desde ? `L ${Number(item.precio_desde).toLocaleString('en-US')}` : 'Consultar',
                        periodo: item.periodo || '/mes',
                        desc: item.descripcion || item.description || 'Plan de servicios aéreos diseñado para potenciar tu operación.',
                        features: featuresArray,
                        destacado: item.destacado === true || item.es_nuevo === true,
                        icon: Icono
                    };
                });

                setServicios(adaptedServicios);
            } catch (error) {
                console.error('Error al cargar planes:', error);
                setErrorMsg('No pudimos cargar los planes de suscripción.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Loader text="Cargando planes..." />
            </div>
        );
    }

    const serviciosFiltrados = activeTab === 'generales'
        ? servicios 
        : servicios.filter(s => s.categoria === activeTab);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {errorMsg && (
                <Alert type="danger" title="Atención" message={errorMsg} onClose={() => setErrorMsg(null)} />
            )}

            <div>
                <h1 style={{ margin: 0, fontSize: '24px', color: 'var(--color-dark)', fontWeight: '800' }}>Gestión de Suscripciones</h1>
                <p style={{ color: 'var(--text-light)', fontSize: '14px', marginTop: '5px' }}>Administra tu plan operativo y servicios adicionales.</p>
            </div>

            {selectedPlan ? (
                /* SOLID - SRP Delegamos toda la responsabilidad de pago al componente reutilizable CheckoutComprarAhora.
                   SOLID - ISP PRINCIPIO DE SEGREGACIÓN DE INTERFAZ
                   Le pasamos ÚNICAMENTE las props que necesita (`producto`, `onBack`, los textos y `onSeguir`), 
                   no todo el estado del componente padre ni la lista de servicios. */
                <CheckoutComprarAhora
                    producto={selectedPlan}
                    onBack={() => setSelectedPlan(null)}
                    textoVolver="Volver a los planes"
                    textoSeguir="Ver mis suscripciones"
                    onSeguir={() => {
                        setSelectedPlan(null);
                        setActiveTab('mis-suscripciones');
                    }}
                />
            ) : (
                <>
                    <div style={{ padding: '10px 20px 20px 20px', borderBottom: '1px solid var(--light-gray)', background: 'var(--bg-color)', display: 'flex', marginBottom: '10px' }}>
                        <Tabs 
                            tabs={tabLabels} 
                            activeTab={activeTabIndex} 
                            onChange={(idx) => setActiveTab(tabKeys[idx])} 
                        />
                    </div>

                    {activeTab === 'mis-suscripciones' ? (
                        <MisSuscripciones onVerPlanes={() => setActiveTab('generales')} />
                    ) : (
                        <div 
                            style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                                gap: '15px',
                                alignItems: 'stretch' 
                            }}
                        >
                            {serviciosFiltrados.length > 0 ? (
                                serviciosFiltrados.map((plan, idx) => (
                                    <div 
                                        key={plan.id} 
                                        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                                    >
                                        {/* SOLID - OCP PRINCIPIO DE ABIERTO/CERRADO
                                            El componente `ItemServiceCard` está cerrado a modificación (no tocamos su código fuente), 
                                            pero está abierto a extensión: podemos cambiar su contenido y su acción pasándole 
                                            el objeto `item` y la función `onAction`. */}
                                        <ItemServiceCard 
                                            item={{
                                                id: plan.id,
                                                number: String(idx + 1).padStart(2, '0'),
                                                icon: plan.icon,
                                                title: plan.nombre,
                                                description: plan.desc,
                                                price: plan.precio,
                                                period: plan.periodo,
                                                features: plan.features,
                                                destacado: plan.destacado
                                            }} 
                                            onAction={() => setSelectedPlan(plan)}
                                        />
                                    </div>
                                ))
                            ) : (
                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>
                                    No hay planes disponibles en esta categoría.
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};