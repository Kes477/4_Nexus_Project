import { useState, useEffect } from 'react';
import { ShieldCheck, Award, Check, ArrowLeft, CreditCard, Lock, ShoppingBag, Truck, Star, Wifi } from 'lucide-react';
import { Button, Input, Tabs, Loader, Alert } from '../../components/ui';
import { ItemProductCard } from '../../components/domain/ItemCard'; 
import { getProductos } from '../../api/droneService'; 

/* =========================================================
   COMPONENTE DE CHECKOUT 
   SOLID - SRP: Este componente tiene UNA SOLA responsabilidad: 
   gestionar el proceso de pago. No sabe de dónde viene el dron, 
   ni cómo se cargan los datos de la API. Solo recibe el dron y cobra.
   ========================================================= */
const CheckoutDron = ({ drone, onBack, onSuccess }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [cardData, setCardData] = useState({ number: '', name: '', expiry: '', cvv: '' });

    const getCardGradient = (num) => {
        const cleanNum = num.replace(/\s/g, '');
        if (cleanNum.startsWith('4')) return 'linear-gradient(135deg, #1a2980 0%, #26d0ce 100%)';
        if (cleanNum.startsWith('5')) return 'linear-gradient(135deg, #cb2d3e 0%, #ef473a 100%)';
        if (cleanNum.startsWith('3')) return 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
        return 'linear-gradient(135deg, #2c365e 0%, #0E5E6F 100%)';
    };

    const handleCardNumberChange = (e) => {
        const rawValue = e.target.value.replace(/\D/g, '');
        const formattedValue = rawValue.match(/.{1,4}/g)?.join(' ').substr(0, 19) || '';
        setCardData({ ...cardData, number: formattedValue });
    };

    const handleExpiryChange = (e) => {
        const rawValue = e.target.value.replace(/\D/g, '');
        let formattedValue = rawValue;
        if (rawValue.length > 2) formattedValue = `${rawValue.slice(0, 2)}/${rawValue.slice(2, 4)}`;
        setCardData({ ...cardData, expiry: formattedValue });
    };

    const handleBuy = () => {
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
                <h2 style={{ color: 'var(--color-dark)', marginBottom: '10px', fontSize: '24px' }}>¡Pago Exitoso!</h2>
                <p style={{ color: 'var(--text-light)', fontSize: '14px', marginBottom: '20px' }}>Tu pedido del <strong>{drone.nombre}</strong> ha sido procesado correctamente.</p>
                <Button variant="primary" onClick={onBack}>Volver al catálogo</Button>
            </div>
        );
    }

    const inputStyleWithIcon = {
        fontSize: '13px',
        width: '100%',
        boxSizing: 'border-box',
        background: 'var(--bg-color)',
        color: 'var(--color-dark)',
        paddingTop: '8px',
        paddingBottom: '8px',
        paddingRight: '10px',
        paddingLeft: '40px'
    };

    const inputStyleNoIcon = {
        ...inputStyleWithIcon,
        paddingLeft: '10px'
    };

    return (
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
            <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontSize: '13px', fontWeight: '600', marginBottom: '15px' }}>
                <ArrowLeft size={16} /> Volver al catálogo
            </button>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'stretch' }}>
                <div style={{ flex: '1 1 320px', background: 'var(--white)', padding: '20px', borderRadius: '12px', border: '1px solid var(--light-gray)', boxShadow: '0 8px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>
                    <h2 style={{ fontSize: '16px', color: 'var(--color-dark)', margin: '0 0 15px 0', fontWeight: '800' }}>Resumen de tu Pedido</h2>
                    
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '15px', flexWrap: 'wrap' }}>
                        {drone.imagen ? (
                            <img src={drone.imagen} alt={drone.nombre} style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '10px' }} />
                        ) : (
                            <div style={{ width: '90px', height: '90px', background: 'var(--bg-color)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fa-solid fa-image" style={{ fontSize: '24px', color: 'var(--light-gray)' }}></i>
                            </div>
                        )}
                        <div style={{ flex: 1, minWidth: '150px' }}>
                            <span style={{ background: 'rgba(4, 201, 166, 0.1)', color: 'var(--color-primary)', padding: '3px 8px', borderRadius: '20px', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                {drone.categoria}
                            </span>
                            <h3 style={{ fontSize: '16px', color: 'var(--color-dark)', margin: '8px 0 4px 0' }}>{drone.nombre}</h3>
                            <p style={{ color: 'var(--text-light)', fontSize: '11px', margin: 0, lineHeight: '1.3' }}>{drone.desc}</p>
                        </div>
                    </div>

                    <div style={{ background: 'var(--bg-color)', padding: '12px', borderRadius: '10px', marginTop: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', color: 'var(--text-light)' }}>
                            <span>Subtotal</span>
                            <span>L {drone.precio}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', color: 'var(--text-light)' }}>
                            <span>Envío</span>
                            <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>Gratis</span>
                        </div>
                        <hr style={{ border: 'none', borderTop: '1px solid var(--light-gray)', margin: '10px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--color-dark)', fontSize: '14px' }}>Total a Pagar</span>
                            <span style={{ fontSize: '20px', fontWeight: '900', color: 'var(--color-primary)' }}>L {drone.precio}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-light)' }}><ShieldCheck size={12} /> Pago Seguro</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-light)' }}><Truck size={12} /> Envío Asegurado</div>
                    </div>
                </div>

                <div style={{ flex: '1 1 320px', background: 'var(--white)', padding: '20px', borderRadius: '12px', border: '1px solid var(--light-gray)', boxShadow: '0 8px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>
                    <h2 style={{ fontSize: '16px', color: 'var(--color-dark)', margin: '0 0 15px 0', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CreditCard size={18} color="var(--color-primary)" /> Información de Pago
                    </h2>

                    {/* Tarjeta Visual */}
                    <div style={{
                        background: getCardGradient(cardData.number),
                        width: '100%', 
                        maxWidth: '300px', 
                        aspectRatio: '1.58', 
                        borderRadius: '12px', 
                        padding: '15px 20px', 
                        color: 'var(--white)',
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'space-between',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.15)', 
                        transition: 'background 0.5s ease',
                        margin: '0 auto 20px auto', 
                        position: 'relative', 
                        overflow: 'hidden',
                        boxSizing: 'border-box'
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
                            <Input 
                                type="text" 
                                placeholder="0000 0000 0000 0000" 
                                value={cardData.number}
                                onChange={handleCardNumberChange}
                                maxLength={19}
                                icon="fa-credit-card"
                                style={inputStyleWithIcon}
                            />
                        </div>
                        
                        <div>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: 'var(--color-dark)', marginBottom: '4px' }}>Nombre del Titular</label>
                            <Input 
                                type="text" 
                                placeholder="Como aparece en la tarjeta" 
                                value={cardData.name}
                                onChange={(e) => setCardData({ ...cardData, name: e.target.value.toUpperCase() })}
                                icon="fa-user"
                                style={inputStyleWithIcon}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: 'var(--color-dark)', marginBottom: '4px' }}>Fecha Exp.</label>
                                <Input 
                                    type="text" 
                                    placeholder="MM/AA" 
                                    value={cardData.expiry}
                                    onChange={handleExpiryChange}
                                    maxLength={5}
                                    style={inputStyleNoIcon}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: 'var(--color-dark)', marginBottom: '4px' }}>CVV</label>
                                <Input 
                                    type="password" 
                                    placeholder="123" 
                                    value={cardData.cvv}
                                    onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '') })}
                                    maxLength={4}
                                    icon="fa-lock"
                                    style={inputStyleWithIcon}
                                />
                            </div>
                        </div>
                        
                        <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                            <Button 
                                variant="primary" 
                                onClick={handleBuy} 
                                disabled={isProcessing} 
                                style={{ 
                                    width: '100%', 
                                    height: '42px',
                                    padding: '0 15px', 
                                    fontSize: '13px', 
                                    fontWeight: 'bold', 
                                    borderRadius: '6px', 
                                    display: 'flex', 
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxSizing: 'border-box'
                                }}
                            >
                                {isProcessing ? (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                        <Loader text="Procesando..." />
                                    </div>
                                ) : (
                                    <><Lock size={14} /> Pagar L {drone.precio}</>
                                )}
                            </Button>
                            <p style={{ textAlign: 'center', fontSize: '9px', color: 'var(--text-light)', margin: '8px 0 0 0' }}>
                                <ShieldCheck size={10} style={{ display: 'inline', marginRight: '4px' }} />
                                Encriptación SSL de 256 bits.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


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

            } catch (error) {
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
                <CheckoutDron 
                    drone={selectedDrone} 
                    onBack={() => setSelectedDrone(null)} 
                    onSuccess={() => setSelectedDrone(null)} 
                />
            )}
        </div>
    );
};