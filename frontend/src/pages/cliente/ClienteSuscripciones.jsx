import { useState } from 'react';
import { ShieldCheck, Check, ArrowLeft, Zap, Tag, Wrench, UserCheck, CreditCard } from 'lucide-react';
import { Button, Tabs, Input } from '../../components/ui';
import { ServiceCard } from '../../components/domain/Card'; 

export const ClienteSuscripciones = () => {
    const [activeTab, setActiveTab] = useState('generales');
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const [cardData, setCardData] = useState({
        number: '',
        name: '',
        expiry: '',
        cvv: ''
    });

    const tabKeys = ['generales', 'descuentos-drones', 'asistencia-tecnica', 'contratacion-piloto'];
    const tabLabels = ['Planes Generales', 'Descuentos Drones', 'Asistencia Técnica', 'Contratar Piloto'];
    const activeTabIndex = tabKeys.indexOf(activeTab);

    const catalogos = {
        generales: [
            { id: 'p1', nombre: 'Plan Básico', precio: 'L 1,200', periodo: '/mes', desc: 'Optimización para parcelas pequeñas.', features: ['2 vuelos de monitoreo', 'Reportes PDF', 'Cobertura 10 mz'], destacado: false, icon: Zap },
            { id: 'p2', nombre: 'Plan Profesional', precio: 'L 2,800', periodo: '/mes', desc: 'Para fincas comerciales con seguimiento constante de cultivos y plagas.', features: ['10 vuelos mensuales', 'Analítica NDVI / SAVI', 'Soporte prioritario 24/7', 'Acceso a plataforma web'], destacado: true, icon: ShieldCheck },
            { id: 'p3', nombre: 'Plan Premium', precio: 'L 5,500', periodo: '/mes', desc: 'Infraestructura total para grandes agroindustrias.', features: ['Vuelos ilimitados', 'Procesamiento IA', 'Soporte 24/7'], destacado: false, icon: Check },
        ],
        'descuentos-drones': [
            { id: 'd1', nombre: 'Descuento Agras T40', precio: 'L 32,000', periodo: '/año', desc: 'Obtén 25% de descuento en hardware.', features: ['Descuento en compra', 'Mantenimiento 12 meses', 'Capacitación'], destacado: true, icon: Tag },
        ],
        'asistencia-tecnica': [
            { id: 't1', nombre: 'Asistencia Básica', precio: 'L 850', periodo: '/mes', desc: 'Revisión e inspección constante.', features: ['2 revisiones al mes', 'Limpieza ultrasónica', '10% dcto repuestos'], destacado: false, icon: Wrench },
        ],
        'contratacion-piloto': [
            { id: 'pi1', nombre: 'Piloto por Jornada', precio: 'L 1,500', periodo: '/día', desc: 'Piloto certificado para tareas puntuales.', features: ['Piloto certificado', 'Más de 200 hrs vuelo', 'Bioseguridad'], destacado: false, icon: UserCheck },
        ]
    };

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

    const handlePayment = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            setPaymentSuccess(true);
            setTimeout(() => {
                setPaymentSuccess(false);
                setSelectedPlan(null);
                setCardData({ number: '', name: '', expiry: '', cvv: '' });
            }, 3000);
        }, 1500);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div>
                <h1 style={{ margin: 0, fontSize: '24px', color: 'var(--color-dark)', fontWeight: '800' }}>Gestión de Suscripciones</h1>
                <p style={{ color: 'var(--text-light)', fontSize: '14px', marginTop: '5px' }}>Administra tu plan operativo y servicios adicionales.</p>
            </div>

            {selectedPlan ? (
                <div style={{ background: 'var(--white)', padding: '20px', borderRadius: '12px', border: '1px solid var(--light-gray)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                    <Button 
                        variant="outline-dark" 
                        size="sm" 
                        onClick={() => { setSelectedPlan(null); setPaymentSuccess(false); }} 
                        style={{ marginBottom: '15px', display: 'flex', gap: '5px', width: 'fit-content' }}
                    >
                        <ArrowLeft size={16} /> Volver a los planes
                    </Button>

                    {paymentSuccess ? (
                        <div style={{ textAlign: 'center', padding: '30px' }}>
                            <div style={{ background: 'rgba(4, 201, 166, 0.1)', color: 'var(--color-primary)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                                <Check size={30} />
                            </div>
                            <h2 style={{ color: 'var(--color-dark)', marginBottom: '10px' }}>¡Suscripción Exitosa!</h2>
                            <p style={{ color: 'var(--text-light)', fontSize: '15px' }}>Has adquirido el <strong>{selectedPlan.nombre}</strong>.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', alignItems: 'center' }}>
                            
                            <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '12px', border: '1px solid var(--light-gray)' }}>
                                <span style={{ background: 'rgba(4, 201, 166, 0.1)', color: 'var(--color-primary)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>Resumen de Compra</span>
                                <h2 style={{ fontSize: '22px', color: 'var(--color-dark)', margin: '10px 0 8px 0' }}>{selectedPlan.nombre}</h2>
                                <p style={{ color: 'var(--text-light)', fontSize: '14px', marginBottom: '15px', lineHeight: '1.4' }}>{selectedPlan.desc}</p>
                                
                                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 15px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {selectedPlan.features.map((f, i) => (
                                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-dark)' }}>
                                            <Check size={14} color="var(--color-primary)" /> {f}
                                        </li>
                                    ))}
                                </ul>

                                <hr style={{ border: 'none', borderTop: '1px solid var(--light-gray)', margin: '15px 0' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--text-light)', fontWeight: 'bold', fontSize: '14px' }}>Total:</span>
                                    <h3 style={{ fontSize: '24px', color: 'var(--color-primary)', margin: 0 }}>{selectedPlan.precio}</h3>
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
                                            onClick={handlePayment} 
                                            disabled={isProcessing} 
                                            style={{ marginTop: '5px', width: '100%', padding: '12px', fontSize: '15px' }}
                                        >
                                            {isProcessing ? 'Procesando...' : <><ShieldCheck size={18} /> Pagar {selectedPlan.precio}</>}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
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
                        {(catalogos[activeTab] || []).map(plan => (
                            <div 
                                key={plan.id} 
                                onClick={() => setSelectedPlan(plan)} 
                                style={{ cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column' }}
                            >
                                <ServiceCard 
                                    service={{
                                        number: plan.id.substring(1).padStart(2, '0'),
                                        icon: plan.icon,
                                        title: plan.nombre,
                                        description: plan.desc,
                                        price: plan.precio,
                                        period: plan.periodo,
                                        features: plan.features,
                                        destacado: plan.destacado
                                    }} 
                                />
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};