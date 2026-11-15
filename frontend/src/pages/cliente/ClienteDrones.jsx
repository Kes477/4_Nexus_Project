import { useState } from 'react';
import { ShieldCheck, Award, Check, ArrowLeft, CreditCard } from 'lucide-react';
import { Button, Input, Tabs } from '../../components/ui';
import DroneCard from '../../components/domain/DroneCard'; 

export const ClienteDrones = () => {
    const [activeTab, setActiveTab] = useState('mis-drones');
    const [selectedDrone, setSelectedDrone] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    const [cardData, setCardData] = useState({
        number: '',
        name: '',
        expiry: '',
        cvv: ''
    });

    const tabLabels = ['Mis Drones', 'Comprar'];
    const activeTabIndex = activeTab === 'mis-drones' ? 0 : 1;

    const misDrones = [
        { id: 1, nombre: 'BioScout Micro I', modelo: 'Micro-Agro 2026', estado: 'Operativo', bateria: 92, horas: 14.5, rating: 5 },
        { id: 2, nombre: 'AgroNano Pro V1', modelo: 'Invernadero-Scan', estado: 'En mantenimiento', bateria: 45, horas: 32.0, rating: 4 },
        { id: 3, nombre: 'BioHawk Mini', modelo: 'Campo Abierto', estado: 'Operativo', bateria: 88, horas: 10.2, rating: 5 },
    ];

    const catalogo = [
        { id: 1, nombre: 'BioScout Micro II', precio: '45,000', desc: 'Micro dron ultraligero para mapeo sensorizado.', categoria: 'Micro', destacado: true, rating: 5, imagen: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=600&auto=format&fit=crop' },
        { id: 2, nombre: 'AgroNano Pro', precio: '62,000', desc: 'Diseñado para inspección foliar cercana.', categoria: 'Micro', destacado: false, rating: 4, imagen: 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?q=80&w=600&auto=format&fit=crop' },
        { id: 3, nombre: 'BioHawk Mini', precio: '115,000', desc: 'Dron compacto para supervisión de parcelas medianas.', categoria: 'Mini', destacado: true, rating: 5, imagen: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?q=80&w=600&auto=format&fit=crop' },
        { id: 4, nombre: 'GeoMapper S-200', precio: '210,000', desc: 'Aeronave de precisión topográfica para levantamientos 3D.', categoria: 'Pequeño', destacado: false, rating: 5, imagen: 'https://images.unsplash.com/photo-1524143986875-3b098d78b363?q=80&w=600&auto=format&fit=crop' },
    ];

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
        if (rawValue.length > 2) {
            formattedValue = `${rawValue.slice(0, 2)}/${rawValue.slice(2, 4)}`;
        }
        setCardData({ ...cardData, expiry: formattedValue });
    };

    const handleBuy = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            setPaymentSuccess(true);
            setTimeout(() => {
                setPaymentSuccess(false);
                setSelectedDrone(null);
                setCardData({ number: '', name: '', expiry: '', cvv: '' });
            }, 2500);
        }, 1500);
    };

    const handleSupportRequest = (drone) => {
        console.log("Solicitando ayuda técnica para:", drone.nombre);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '24px', color: 'var(--color-dark)', fontWeight: '800' }}>Adquisición y Estado de Drones</h1>
                    <p style={{ color: 'var(--text-light)', fontSize: '14px', marginTop: '5px' }}>Supervisa tu flota o explora el catálogo.</p>
                </div>
                <Button variant="outline-primary" size="sm">
                    <Award size={16}/> Cambiar a Piloto
                </Button>
            </div>

            {selectedDrone ? (
                <div style={{ background: 'var(--white)', padding: '20px', borderRadius: '12px', border: '1px solid var(--light-gray)' }}>
                    <Button 
                        variant="outline-dark" 
                        size="sm" 
                        onClick={() => setSelectedDrone(null)} 
                        style={{ marginBottom: '15px', display: 'flex', gap: '5px', width: 'fit-content' }}
                    >
                        <ArrowLeft size={16} /> Volver al catálogo
                    </Button>

                    {paymentSuccess ? (
                        <div style={{ textAlign: 'center', padding: '30px' }}>
                            <div style={{ background: 'rgba(4, 201, 166, 0.1)', color: 'var(--color-primary)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                                <Check size={30} />
                            </div>
                            <h2 style={{ color: 'var(--color-dark)', marginBottom: '10px' }}>¡Compra Exitosa!</h2>
                            <p style={{ color: 'var(--text-light)', fontSize: '15px' }}>Has adquirido el <strong>{selectedDrone.nombre}</strong>.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', alignItems: 'center' }}>
                            
                            <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '12px', border: '1px solid var(--light-gray)' }}>
                                <img 
                                    src={selectedDrone.imagen} 
                                    alt={selectedDrone.nombre} 
                                    style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px', marginBottom: '15px' }} 
                                />
                                <span style={{ background: 'rgba(4, 201, 166, 0.1)', color: 'var(--color-primary)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>Resumen de Compra</span>
                                <h2 style={{ fontSize: '22px', color: 'var(--color-dark)', margin: '10px 0 8px 0' }}>{selectedDrone.nombre}</h2>
                                <p style={{ color: 'var(--text-light)', fontSize: '14px', marginBottom: '15px', lineHeight: '1.4' }}>{selectedDrone.desc}</p>
                                <hr style={{ border: 'none', borderTop: '1px solid var(--light-gray)', margin: '15px 0' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--text-light)', fontWeight: 'bold', fontSize: '14px' }}>Total:</span>
                                    <h3 style={{ fontSize: '24px', color: 'var(--color-primary)', margin: 0 }}>L {selectedDrone.precio}</h3>
                                </div>
                            </div>
                            
                            <div>
                                <h3 style={{ margin: '0 0 15px 0', color: 'var(--color-dark)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
                                    <CreditCard size={18} /> Método de Pago
                                </h3>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div style={{
                                        background: getCardGradient(cardData.number),
                                        width: '100%', maxWidth: '300px', height: '160px',
                                        borderRadius: '12px', padding: '20px', color: 'var(--white)',
                                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                                        boxShadow: '0 10px 20px rgba(0,0,0,0.15)', transition: 'background 0.5s ease'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ width: '40px', height: '30px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.3)' }}></div>
                                            <span style={{ fontSize: '16px', fontWeight: 'bold', fontStyle: 'italic', textTransform: 'uppercase' }}>
                                                {cardData.number.startsWith('4') ? 'VISA' : cardData.number.startsWith('5') ? 'Mastercard' : '4 NEXUS'}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '20px', letterSpacing: '2px', fontFamily: 'monospace' }}>
                                            {cardData.number || '•••• •••• •••• ••••'}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontSize: '8px', opacity: 0.7 }}>Titular</span>
                                                <span>{cardData.name || 'NOMBRE APELLIDO'}</span>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                                                <span style={{ fontSize: '8px', opacity: 0.7 }}>Vence</span>
                                                <span>{cardData.expiry || 'MM/AA'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px' }}>
                                        <Input 
                                            type="text" 
                                            placeholder="Número de tarjeta" 
                                            value={cardData.number}
                                            onChange={handleCardNumberChange}
                                            maxLength={19}
                                            style={{ padding: '10px 12px' }}
                                        />
                                        
                                        <Input 
                                            type="text" 
                                            placeholder="Nombre del titular" 
                                            value={cardData.name}
                                            onChange={(e) => setCardData({ ...cardData, name: e.target.value.toUpperCase() })}
                                            style={{ padding: '10px 12px' }}
                                        />

                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <Input 
                                                type="text" 
                                                placeholder="MM/AA" 
                                                value={cardData.expiry}
                                                onChange={handleExpiryChange}
                                                maxLength={5}
                                                style={{ padding: '10px 12px' }}
                                            />
                                            <Input 
                                                type="password" 
                                                placeholder="CVV" 
                                                value={cardData.cvv}
                                                onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '') })}
                                                maxLength={4}
                                                style={{ padding: '10px 12px' }}
                                            />
                                        </div>
                                        
                                        <Button 
                                            variant="primary" 
                                            onClick={handleBuy} 
                                            disabled={isProcessing} 
                                            style={{ marginTop: '5px', width: '100%', padding: '12px', fontSize: '15px' }}
                                        >
                                            {isProcessing ? 'Procesando...' : <><ShieldCheck size={18} /> Pagar L {selectedDrone.precio}</>}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <div style={{ padding: '10px 20px 20px 20px', borderBottom: '1px solid var(--light-gray)', background: 'var(--bg-color)', display: 'flex' }}>
                        <Tabs 
                            tabs={tabLabels} 
                            activeTab={activeTabIndex} 
                            onChange={(idx) => setActiveTab(idx === 0 ? 'mis-drones' : 'comprar')} 
                        />
                    </div>

                    {activeTab === 'mis-drones' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px', alignItems: 'stretch', marginTop: '10px' }}>
                            {misDrones.map(dron => (
                                <div key={dron.id} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <DroneCard drone={dron} mode="owned" onAction={handleSupportRequest} />
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'comprar' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px', alignItems: 'stretch', marginTop: '10px' }}>
                            {catalogo.map(dron => (
                                <div key={dron.id} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <DroneCard drone={dron} mode="catalog" onAction={setSelectedDrone} />
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};