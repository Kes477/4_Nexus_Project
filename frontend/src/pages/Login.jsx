import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layers, Navigation, Wrench, Shield, ChevronLeft, ArrowRight, Check, Home } from 'lucide-react';
import { Input, Button, Alert } from '../components/ui'; 

const carouselImages = [
    "https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1579829366248-204fe8413f31?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1473968512647-3e447244af8f?q=80&w=1000&auto=format&fit=crop"
];

const Login = () => {
    const navigate = useNavigate();

    const [step, setStep] = useState('login'); 
    const [regSubStep, setRegSubStep] = useState(1); 
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    const [selectedRole, setSelectedRole] = useState('cliente');
    const [recoverMethod, setRecoverMethod] = useState('email');
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [mostrarConfirmarPassword, setMostrarConfirmarPassword] = useState(false);
    const [codeDigits, setCodeDigits] = useState(["", "", "", "", "", ""]);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [nombres, setNombres] = useState('');
    const [apellidos, setApellidos] = useState('');
    const [telefono, setTelefono] = useState('');
    const [identificacion, setIdentificacion] = useState(''); 

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const handleDigitChange = (value, index) => {
        const nextDigits = [...codeDigits];
        nextDigits[index] = value.slice(-1);
        setCodeDigits(nextDigits);
        if (value && index < 5) document.getElementById(`digit-${index + 1}`)?.focus();
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace" && !codeDigits[index] && index > 0) {
            document.getElementById(`digit-${index - 1}`)?.focus();
        }
    };

    const submitLogin = async (e) => {
        if(e) e.preventDefault();
        setErrorMsg(null);
        setIsLoading(true);

        setTimeout(() => {
            setIsLoading(false);
            
            localStorage.setItem('user_role', 'cliente'); 
            
            navigate('/cliente'); 
        }, 1200);
    };

    const handleNextStep = () => {
        setErrorMsg(null);
        if (step === 'register') {
            if (regSubStep === 1) {
                if (!email || !password || !confirmPassword) return setErrorMsg("Por favor, llena todos los campos.");
                if (password !== confirmPassword) return setErrorMsg("Las contraseñas no coinciden.");
                setRegSubStep(2);
            } else if (regSubStep === 2) {
                if (!nombres || !apellidos || !identificacion) return setErrorMsg("Por favor, llena todos los campos.");
                setRegSubStep(3);
            } else {
                setStep('verify');
            }
        } else if (step === 'recover') {
            setStep('verify');
        } else if (step === 'verify') {
            setStep('success');
        }
    };

    const roles = [
        { key: 'cliente', label: 'Cliente', icon: <Layers size={14} /> },
        { key: 'piloto', label: 'Piloto', icon: <Navigation size={14} /> },
        { key: 'tecnico', label: 'Técnico', icon: <Wrench size={14} /> },
        { key: 'admin', label: 'Admin', icon: <Shield size={14} /> },
    ];

    const getIdentificacionConfig = () => {
        switch (selectedRole) {
            case 'piloto': return { label: 'Licencia de Piloto', placeholder: 'AHAC-RPAS-2026-XXXX' };
            case 'admin': return { label: 'Clave de Empresa', placeholder: 'ADM-2026-X9' };
            default: return { label: 'Identificación (DNI / RTN)', placeholder: '0801-1990-00000' };
        }
    };

    const labelStyle = { fontSize: '12px', fontWeight: '600', color: 'var(--color-dark)', marginBottom: '6px', display: 'block' };
    const toggleEyeStyle = { position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-color)', padding: '30px 20px' }}>
            
            <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>

            <div style={{ 
                background: 'var(--white)', border: '1px solid var(--light-gray)', 
                borderRadius: '12px', overflow: 'hidden', 
                display: 'flex', width: '100%', maxWidth: '1000px', height: '620px',
                boxShadow: '0 15px 40px rgba(0,0,0,0.06)', position: 'relative'
            }}>
                
                <Link to="/" style={{
                    position: 'absolute', top: '20px', left: '20px', zIndex: 50,
                    background: 'rgba(255,255,255,0.9)', padding: '8px', borderRadius: '50%',
                    color: 'var(--color-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)', textDecoration: 'none', transition: 'all 0.3s'
                }}>
                    <Home size={18} />
                </Link>

                <div style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden', background: 'var(--color-dark)' }}>
                    {carouselImages.map((src, index) => (
                        <img
                            key={index} src={src} alt={`Slide ${index}`}
                            style={{
                                position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                                opacity: index === currentImageIndex ? 1 : 0, transition: 'opacity 1s ease-in-out'
                            }}
                        />
                    ))}
                    <div style={{ 
                        position: 'absolute', inset: 0, 
                        background: 'linear-gradient(to top, rgba(44, 54, 94, 0.95), transparent 60%)',
                        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '30px', zIndex: 10
                    }}>
                        <span style={{ background: 'var(--color-primary)', color: 'var(--white)', padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', width: 'fit-content', marginBottom: '10px' }}>
                            4 NEXUS
                        </span>
                        <p style={{ color: 'var(--white)', fontSize: '15px', margin: 0, fontWeight: '500', lineHeight: '1.4' }}>
                            Plataforma de gestión e infraestructura de vuelo autónomo.
                        </p>
                    </div>
                </div>

                <div style={{ flex: 1.1, display: 'flex', flexDirection: 'column', background: 'var(--white)', overflow: 'hidden' }}>
                    
                    {step !== 'success' && (
                        <div style={{ borderBottom: '1px solid var(--light-gray)', padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)', shrink: 0 }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--color-primary)', fontWeight: '900', letterSpacing: '1px' }}>4 NEXUS</h2>
                                <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: '500' }}>Acceso al sistema</span>
                            </div>

                            {(step === 'login' || step === 'register') && (
                                <div style={{ display: 'flex', background: 'var(--white)', border: '1px solid var(--light-gray)', borderRadius: '6px', padding: '3px' }}>
                                    <button 
                                        onClick={() => { setStep('login'); setRegSubStep(1); setErrorMsg(null); }}
                                        style={{ padding: '6px 20px', fontSize: '13px', fontWeight: 'bold', borderRadius: '4px', border: 'none', cursor: 'pointer', background: step === 'login' ? 'var(--color-primary)' : 'transparent', color: step === 'login' ? 'var(--white)' : 'var(--text-light)', transition: 'all 0.3s' }}
                                    >
                                        Ingresar
                                    </button>
                                    <button 
                                        onClick={() => { setStep('register'); setRegSubStep(1); setErrorMsg(null); }}
                                        style={{ padding: '6px 20px', fontSize: '13px', fontWeight: 'bold', borderRadius: '4px', border: 'none', cursor: 'pointer', background: step === 'register' ? 'var(--color-primary)' : 'transparent', color: step === 'register' ? 'var(--white)' : 'var(--text-light)', transition: 'all 0.3s' }}
                                    >
                                        Registrar
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="hide-scrollbar" style={{ padding: '30px 40px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        
                        {errorMsg && (
                            <div style={{ width: '100%', maxWidth: '380px', marginBottom: '15px' }}>
                                <Alert type="danger" title="Atención" message={errorMsg} onClose={() => setErrorMsg(null)} />
                            </div>
                        )}

                        {step === 'login' && (
                            <form onSubmit={submitLogin} style={{ width: '100%', maxWidth: '350px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div>
                                    <label style={labelStyle}>Correo Electrónico</label>
                                    <Input type="email" icon="fa-envelope" placeholder="usuario@ejemplo.hn" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                </div>

                                <div>
                                    <label style={labelStyle}>Contraseña</label>
                                    <div style={{ position: 'relative' }}>
                                        <Input type={mostrarPassword ? "text" : "password"} icon="fa-lock" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                        <button type="button" onClick={() => setMostrarPassword(!mostrarPassword)} style={toggleEyeStyle}>
                                            <i className={`fas ${mostrarPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-light)', cursor: 'pointer' }}>
                                        <input type="checkbox" style={{ accentColor: 'var(--color-primary)', width: '14px', height: '14px' }} /> Recordarme
                                    </label>
                                    <button type="button" onClick={() => { setStep('recover'); setErrorMsg(null); }} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                                        Recuperar clave
                                    </button>
                                </div>
                            </form>
                        )}

                        {step === 'register' && (
                            <div style={{ width: '100%', maxWidth: '380px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--light-gray)', paddingBottom: '10px', marginBottom: '15px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-dark)' }}>
                                        {regSubStep === 1 && "Paso 1: Credenciales"}
                                        {regSubStep === 2 && "Paso 2: Datos personales"}
                                        {regSubStep === 3 && "Paso 3: Verificación"}
                                    </span>
                                    <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 'bold', background: 'rgba(4, 201, 166, 0.1)', padding: '2px 8px', borderRadius: '20px' }}>Paso {regSubStep} de 3</span>
                                </div>

                                {regSubStep === 1 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div>
                                            <label style={labelStyle}>Correo Electrónico</label>
                                            <Input type="email" icon="fa-envelope" placeholder="usuario@ejemplo.hn" value={email} onChange={(e) => setEmail(e.target.value)} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Contraseña</label>
                                            <div style={{ position: 'relative' }}>
                                                <Input type={mostrarPassword ? "text" : "password"} icon="fa-lock" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                                                <button type="button" onClick={() => setMostrarPassword(!mostrarPassword)} style={toggleEyeStyle}><i className={`fas ${mostrarPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i></button>
                                            </div>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Confirmar Contraseña</label>
                                            <div style={{ position: 'relative' }}>
                                                <Input type={mostrarConfirmarPassword ? "text" : "password"} icon="fa-lock" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                                                <button type="button" onClick={() => setMostrarConfirmarPassword(!mostrarConfirmarPassword)} style={toggleEyeStyle}><i className={`fas ${mostrarConfirmarPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i></button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {regSubStep === 2 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <div>
                                            <label style={labelStyle}>Selecciona tu rol</label>
                                            
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                {roles.map((r) => (
                                                    <button key={r.key} type="button" onClick={() => setSelectedRole(r.key)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '8px 4px', fontSize: '11px', fontWeight: 'bold', borderRadius: '6px', border: `1px solid ${selectedRole === r.key ? 'var(--color-primary)' : 'var(--light-gray)'}`, cursor: 'pointer', background: selectedRole === r.key ? 'rgba(4, 201, 166, 0.1)' : 'transparent', color: selectedRole === r.key ? 'var(--color-primary)' : 'var(--text-light)', transition: 'all 0.2s' }}>
                                                        {r.icon} {r.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label style={labelStyle}>Nombre</label>
                                            <Input type="text" icon="fa-user" placeholder="Ej. Juan" value={nombres} onChange={(e) => setNombres(e.target.value)} />
                                        </div>
                                        
                                        <div>
                                            <label style={labelStyle}>Apellido</label>
                                            <Input type="text" icon="fa-user" placeholder="Ej. Pérez" value={apellidos} onChange={(e) => setApellidos(e.target.value)} />
                                        </div>

                                        <div>
                                            <label style={labelStyle}>Teléfono</label>
                                            <Input type="tel" icon="fa-phone" placeholder="+504 9999-0000" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                                        </div>

                                        <div>
                                            <label style={labelStyle}>{getIdentificacionConfig().label}</label>
                                            <Input type="text" icon="fa-id-card" placeholder={getIdentificacionConfig().placeholder} value={identificacion} onChange={(e) => setIdentificacion(e.target.value)} />
                                        </div>
                                    </div>
                                )}

                                {regSubStep === 3 && (
                                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', padding: '10px 0' }}>
                                        <div style={{ background: 'rgba(4, 201, 166, 0.1)', padding: '12px', borderRadius: '50%', color: 'var(--color-primary)' }}>
                                            <Shield size={28} />
                                        </div>
                                        <p style={{ fontSize: '13px', color: 'var(--text-light)', margin: 0, maxWidth: '280px' }}>Selecciona cómo deseas recibir tu código de verificación.</p>
                                        <div style={{ display: 'flex', background: 'var(--bg-color)', padding: '4px', borderRadius: '8px', width: '100%' }}>
                                            <button onClick={() => setRecoverMethod('email')} style={{ flex: 1, padding: '8px', fontSize: '12px', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', background: recoverMethod === 'email' ? 'var(--color-primary)' : 'transparent', color: recoverMethod === 'email' ? 'var(--white)' : 'var(--text-light)' }}>Correo</button>
                                            <button onClick={() => setRecoverMethod('phone')} style={{ flex: 1, padding: '8px', fontSize: '12px', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', background: recoverMethod === 'phone' ? 'var(--color-primary)' : 'transparent', color: recoverMethod === 'phone' ? 'var(--white)' : 'var(--text-light)' }}>Teléfono</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 'recover' && (
                            <div style={{ width: '100%', maxWidth: '350px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                                <div style={{ background: 'rgba(4, 201, 166, 0.1)', padding: '12px', borderRadius: '50%', color: 'var(--color-primary)' }}><Shield size={28} /></div>
                                <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--color-dark)' }}>Recuperación de cuenta</h3>
                                <div style={{ display: 'flex', background: 'var(--bg-color)', padding: '4px', borderRadius: '8px', width: '100%' }}>
                                    <button onClick={() => setRecoverMethod('email')} style={{ flex: 1, padding: '8px', fontSize: '12px', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', background: recoverMethod === 'email' ? 'var(--color-primary)' : 'transparent', color: recoverMethod === 'email' ? 'var(--white)' : 'var(--text-light)' }}>Correo</button>
                                    <button onClick={() => setRecoverMethod('phone')} style={{ flex: 1, padding: '8px', fontSize: '12px', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', background: recoverMethod === 'phone' ? 'var(--color-primary)' : 'transparent', color: recoverMethod === 'phone' ? 'var(--white)' : 'var(--text-light)' }}>Teléfono</button>
                                </div>
                                <div style={{ width: '100%', textAlign: 'left' }}>
                                    {recoverMethod === 'email' ? <Input type="email" icon="fa-envelope" placeholder="Correo registrado" /> : <Input type="tel" icon="fa-phone" placeholder="Teléfono registrado" />}
                                </div>
                            </div>
                        )}

                        {step === 'verify' && (
                            <div style={{ width: '100%', maxWidth: '350px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                                <div style={{ background: 'rgba(241, 190, 38, 0.1)', padding: '12px', borderRadius: '50%', color: 'var(--color-warning)' }}><Shield size={28} className="animate-pulse" /></div>
                                <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--color-dark)' }}>Verificación de seguridad</h3>
                                <p style={{ fontSize: '13px', color: 'var(--text-light)', margin: 0 }}>Ingresa el código de 6 dígitos enviado.</p>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    {codeDigits.map((digit, index) => (
                                        <input key={index} id={`digit-${index}`} type="text" maxLength={1} value={digit} onChange={(e) => handleDigitChange(e.target.value, index)} onKeyDown={(e) => handleKeyDown(e, index)}
                                            style={{ width: '40px', height: '45px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold', border: '1px solid var(--light-gray)', borderRadius: '6px', outline: 'none' }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 'success' && (
                            <div style={{ width: '100%', maxWidth: '350px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                                <div style={{ background: 'rgba(4, 201, 166, 0.1)', padding: '12px', borderRadius: '50%', color: 'var(--color-primary)' }}><Check size={28} /></div>
                                <h3 style={{ margin: 0, fontSize: '20px', color: 'var(--color-primary)' }}>¡Operación completada!</h3>
                                <p style={{ fontSize: '13px', color: 'var(--text-light)', margin: 0 }}>Tu cuenta ha sido confirmada con éxito.</p>
                                <Button variant="primary" onClick={() => { setStep('login'); setRegSubStep(1); }} style={{ width: '100%', marginTop: '10px' }}>Ir al inicio de sesión</Button>
                            </div>
                        )}
                    </div>

                    {step !== 'success' && (
                        <div style={{ borderTop: '1px solid var(--light-gray)', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)', shrink: 0 }}>
                            <button 
                                onClick={() => {
                                    setErrorMsg(null);
                                    if (step === 'register' && regSubStep > 1) setRegSubStep(prev => prev - 1);
                                    else if (step === 'verify') { setStep('register'); setRegSubStep(3); }
                                    else if (step === 'recover') setStep('login');
                                    else navigate(-1);
                                }}
                                style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', fontSize: '12px', fontWeight: 'bold' }}
                            >
                                <ChevronLeft size={16} /> 
                                {step === 'register' && regSubStep > 1 ? "Anterior" : step === 'verify' || step === 'recover' ? "Regresar" : "Cancelar"}
                            </button>

                            <Button 
                                variant="primary" 
                                disabled={isLoading}
                                onClick={(e) => {
                                    if (step === 'login') submitLogin(e);
                                    else handleNextStep();
                                }}
                                style={{ padding: '8px 20px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                            >
                                {step === 'login' && (isLoading ? "Ingresando..." : "Ingresar")}
                                {step === 'register' && (regSubStep < 3 ? <span style={{display:'flex', alignItems:'center', gap:'5px'}}>Siguiente <ArrowRight size={14}/></span> : "Enviar código")}
                                {step === 'recover' && "Enviar código"}
                                {step === 'verify' && "Verificar"}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;