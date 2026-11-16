import { useState, useEffect } from 'react';
import { ShieldCheck, Check, ArrowLeft, Zap, Tag, Wrench, UserCheck, CreditCard, Lock, Wifi, Shield } from 'lucide-react';
import { Button, Tabs, Input, Loader, Alert } from '../../components/ui';
// CORRECCIÓN: Importamos ItemServiceCard desde ItemCard
import { ItemServiceCard } from '../../components/domain/ItemCard'; 
import { getProductos } from '../../api/droneService'; 

/* =========================================================
   SOLID - SRP PRINCIPIO DE RESPONSABILIDAD ÚNICA
   Este componente tiene UNA SOLA razón para cambiar: la lógica de pago.
   No sabe cómo se obtienen los datos de la API ni cómo se listan los planes.
   ========================================================= */
const CheckoutSuscripcion = ({ plan, onBack, onSuccess }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [cardData, setCardData] = useState({ number: '', name: '', expiry: '', cvv: '' });

    /* SOLID - SRP Esta función solo se encarga del diseño visual de la tarjeta según la franquicia */
    const getCardGradient = (num) => {
        const cleanNum = num.replace(/\s/g, '');
        if (cleanNum.startsWith('4')) return 'linear-gradient(135deg, #1a2980 0%, #26d0ce 100%)';
        if (cleanNum.startsWith('5')) return 'linear-gradient(135deg, #cb2d3e 0%, #ef473a 100%)';
        if (cleanNum.startsWith('3')) return 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
        return 'linear-gradient(135deg, #2c365e 0%, #0E5E6F 100%)';
    };

    /* SOLID - SRP Responsabilidad única: formatear el número de tarjeta con espacios */
    const handleCardNumberChange = (e) => {
        const rawValue = e.target.value.replace(/\D/g, '');
        const formattedValue = rawValue.match(/.{1,4}/g)?.join(' ').substr(0, 19) || '';
        setCardData({ ...cardData, number: formattedValue });
    };

    /* SOLID - SRP Responsabilidad única: formatear la fecha de expiración */
    const handleExpiryChange = (e) => {
        const rawValue = e.target.value.replace(/\D/g, '');
        let formattedValue = rawValue;
        if (rawValue.length > 2) formattedValue = `${rawValue.slice(0, 2)}/${rawValue.slice(2, 4)}`;
        setCardData({ ...cardData, expiry: formattedValue });
    };

    /* SOLID - SRP Responsabilidad única: manejar el estado transaccional del pago */
    const handlePayment = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            setPaymentSuccess(true);
            setTimeout(() => onSuccess(), 2500);
        }, 1500);
    };

    if (paymentSuccess) {
        return (
            <div style={{ background: 'var(--white)', padding: '40px 20px', borderRadius: '16px', border: '1px solid var(--light-gray)', textAlign: 'center', maxWidth: '500px', margin: '0 auto', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                <div style={{ background: 'rgba(4, 201, 166, 0.1)', color: 'var(--color-primary)', width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <Check size={35} strokeWidth={3} />
                </div>
                <h2 style={{ color: 'var(--color-dark)', marginBottom: '10px', fontSize: '24px' }}>¡Suscripción Exitosa!</h2>
                <p style={{ color: 'var(--text-light)', fontSize: '14px', marginBottom: '20px' }}>Has adquirido el <strong>{plan.nombre}</strong>.</p>
                <Button variant="primary" onClick={onBack}>Volver a los planes</Button>
            </div>
        );
    }

    const inputStyleWithIcon = {
        fontSize: '13px', width: '100%', boxSizing: 'border-box',
        background: 'var(--bg-color)', color: 'var(--color-dark)',
        paddingTop: '8px', paddingBottom: '8px', paddingRight: '10px', paddingLeft: '40px'
    };

    const inputStyleNoIcon = { ...inputStyleWithIcon, paddingLeft: '10px' };

    return (
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
            <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontSize: '13px', fontWeight: '600', marginBottom: '15px' }}>
                <ArrowLeft size={16} /> Volver a los planes
            </button>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'stretch' }}>
                
                <div style={{ flex: '1 1 320px', background: 'var(--white)', padding: '20px', borderRadius: '12px', border: '1px solid var(--light-gray)', boxShadow: '0 8px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>
                    <h2 style={{ fontSize: '16px', color: 'var(--color-dark)', margin: '0 0 15px 0', fontWeight: '800' }}>Resumen de tu Suscripción</h2>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <span style={{ background: 'rgba(4, 201, 166, 0.1)', color: 'var(--color-primary)', padding: '3px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                            Plan Seleccionado
                        </span>
                        <h3 style={{ fontSize: '20px', color: 'var(--color-dark)', margin: '10px 0 5px 0' }}>{plan.nombre}</h3>
                        <p style={{ color: 'var(--text-light)', fontSize: '13px', margin: 0, lineHeight: '1.4' }}>{plan.desc}</p>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 15px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {plan.features?.map((f, i) => (
                            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--color-dark)' }}>
                                <Check size={14} color="var(--color-primary)" /> {f}
                            </li>
                        ))}
                    </ul>

                    <div style={{ background: 'var(--bg-color)', padding: '12px', borderRadius: '10px', marginTop: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--color-dark)', fontSize: '14px' }}>Total a Pagar</span>
                            <span style={{ fontSize: '20px', fontWeight: '900', color: 'var(--color-primary)' }}>{plan.precio}</span>
                        </div>
                    </div>
                </div>

                <div style={{ flex: '1 1 320px', background: 'var(--white)', padding: '20px', borderRadius: '12px', border: '1px solid var(--light-gray)', boxShadow: '0 8px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>
                    <h2 style={{ fontSize: '16px', color: 'var(--color-dark)', margin: '0 0 15px 0', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CreditCard size={18} color="var(--color-primary)" /> Información de Pago
                    </h2>

                    <div style={{
                        background: getCardGradient(cardData.number), width: '100%', maxWidth: '300px', aspectRatio: '1.58',
                        borderRadius: '12px', padding: '15px 20px', color: 'var(--white)', display: 'flex', flexDirection: 'column',
                        justifyContent: 'space-between', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', transition: 'background 0.5s ease',
                        margin: '0 auto 20px auto', position: 'relative', overflow: 'hidden', boxSizing: 'border-box'
                    }}>
                        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <div style={{ width: '35px', height: '25px', background: 'linear-gradient(135deg, #f1be26 0%, #d4a017 100%)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.3)' }}></div>
                                <Wifi size={16} style={{ transform: 'rotate(90deg)', opacity: 0.8 }} />
                            </div>
                            <span style={{ fontSize: '15px', fontWeight: 'bold', fontStyle: 'italic', textTransform: 'uppercase' }}>
                                {cardData.number.startsWith('4') ? 'VISA' : cardData.number.startsWith('5') ? 'Mastercard' : '4 NEXUS'}
                            </span>
                        </div>
                        <div style={{ fontSize: '17px', letterSpacing: '2px', fontFamily: 'monospace', zIndex: 1, textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
                            {cardData.number || '•••• •••• •••• ••••'}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', textTransform: 'uppercase', zIndex: 1 }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ opacity: 0.7, marginBottom: '2px' }}>Titular</span>
                                <span style={{ fontWeight: 'bold', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '10px' }}>
                                    {cardData.name || 'NOMBRE APELLIDO'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                                <span style={{ opacity: 0.7, marginBottom: '2px' }}>Vence</span>
                                <span style={{ fontWeight: 'bold', fontSize: '10px' }}>{cardData.expiry || 'MM/AA'}</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: 'var(--color-dark)', marginBottom: '4px' }}>Número de Tarjeta</label>
                            <Input type="text" placeholder="0000 0000 0000 0000" value={cardData.number} onChange={handleCardNumberChange} maxLength={19} icon="fa-credit-card" style={inputStyleWithIcon} />
                        </div>
                        
                        <div>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: 'var(--color-dark)', marginBottom: '4px' }}>Nombre del Titular</label>
                            <Input type="text" placeholder="Como aparece en la tarjeta" value={cardData.name} onChange={(e) => setCardData({ ...cardData, name: e.target.value.toUpperCase() })} icon="fa-user" style={inputStyleWithIcon} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: 'var(--color-dark)', marginBottom: '4px' }}>Fecha Exp.</label>
                                <Input type="text" placeholder="MM/AA" value={cardData.expiry} onChange={handleExpiryChange} maxLength={5} style={inputStyleNoIcon} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: 'var(--color-dark)', marginBottom: '4px' }}>CVV</label>
                                <Input type="password" placeholder="123" value={cardData.cvv} onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '') })} maxLength={4} icon="fa-lock" style={inputStyleWithIcon} />
                            </div>
                        </div>
                        
                        <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                            <Button 
                                variant="primary" 
                                onClick={handlePayment} 
                                disabled={isProcessing} 
                                style={{ width: '100%', height: '42px', padding: '0 15px', fontSize: '13px', fontWeight: 'bold', borderRadius: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', boxSizing: 'border-box' }}
                            >
                                {isProcessing ? (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                        <Loader text="Procesando..." />
                                    </div>
                                ) : (
                                    <><Lock size={14} /> Pagar {plan.precio}</>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


/* =========================================================
   SOLID - SRP PRINCIPIO DE RESPONSABILIDAD ÚNICA
   Este componente maneja UNA SOLA responsabilidad: 
   Obtener los datos, manejar las pestañas (tabs) y renderizar las tarjetas.
   No procesa pagos ni valida tarjetas de crédito.
   ========================================================= */
export const ClienteSuscripciones = () => {
    const [activeTab, setActiveTab] = useState('generales');
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [servicios, setServicios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);

    const tabKeys = ['generales', 'descuentos-drones', 'asistencia-tecnica', 'contratacion-piloto'];
    const tabLabels = ['Planes Generales', 'Descuentos Drones', 'Asistencia Técnica', 'Contratar Piloto'];
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
                /* SOLID - SRP Delegamos toda la responsabilidad de pago al componente CheckoutSuscripcion.
                   SOLID - ISP PRINCIPIO DE SEGREGACIÓN DE INTERFAZ
                   Le pasamos ÚNICAMENTE las props que necesita (`plan`, `onBack`, `onSuccess`), 
                   no todo el estado del componente padre ni la lista de servicios. */
                <CheckoutSuscripcion 
                    plan={selectedPlan} 
                    onBack={() => setSelectedPlan(null)} 
                    onSuccess={() => setSelectedPlan(null)} 
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
                </>
            )}
        </div>
    );
};