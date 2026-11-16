import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Layers, Navigation, Wrench, Shield, ChevronLeft, ArrowRight, Check, Home } from 'lucide-react';
import { Input, Button, Alert } from '../components/ui';
import {useSesion} from '../hooks/useSesion';

const carouselImages = [
    "https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1579829366248-204fe8413f31?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1473968512647-3e447244af8f?q=80&w=1000&auto=format&fit=crop"
];

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { iniciarSesion } = useSesion();

    const redirectTo = location.state?.from || '/cliente';
    const loginMessage = location.state?.message;

    const [step, setStep] = useState('login');
    const [regSubStep, setRegSubStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [rememberMe, setRememberMe] = useState(false);

    const [selectedRole, setSelectedRole] = useState('cliente');
    const [recoverMethod, setRecoverMethod] = useState('email');

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

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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
        if (e) e.preventDefault();
        setErrorMsg(null);
        setIsLoading(true);

        try {
            const usuario = await iniciarSesion(email, password);
            const destino = usuario.is_staff ? '/admin' : redirectTo;

            navigate(destino, {
                replace: true,
                state: location.state?.selectedDrone
                    ? { selectedDrone: location.state.selectedDrone }
                    : undefined,
            });
        } catch (error) {
            if (error.response?.status === 401) {
                setErrorMsg('Correo o contraseña incorrectos.');
            } else {
                setErrorMsg('No se pudo conectar con el servidor. Intenta de nuevo.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleNextStep = async () => {
        setErrorMsg(null);
        
        if (step === 'register') {
            if (regSubStep === 1) {
                if (!email || !password || !confirmPassword) return setErrorMsg("Por favor, llena todos los campos.");
                if (password !== confirmPassword) return setErrorMsg("Las contraseñas no coinciden.");
                setRegSubStep(2);
            } else if (regSubStep === 2) {
                if (!nombres || !apellidos || !identificacion) return setErrorMsg("Por favor, llena todos los campos obligatorios.");
                setRegSubStep(3);
            } else {
                setIsLoading(true);
                try {
                    const response = await fetch(`${API_URL}/auth/registro/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email,
                            password,
                            first_name: nombres,
                            last_name: apellidos,
                            no_identificacion: identificacion,
                            telefono,
                            role: selectedRole
                        })
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        const msg = data.email ? data.email[0] : data.no_identificacion ? data.no_identificacion[0] : "Error al registrar.";
                        throw new Error(msg);
                    }

                    setStep('success');
                } catch (error) {
                    setErrorMsg(error.message);
                } finally {
                    setIsLoading(false);
                }
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
            case 'piloto': return { label: 'Licencia de Piloto', icon: "fa-id-card" };
            case 'admin': return { label: 'Clave de Empresa', icon: "fa-key" };
            default: return { label: 'Identificación (DNI / RTN)', icon: "fa-id-card" };
        }
    };

    const labelStyle = { fontSize: '11px', fontWeight: '700', color: 'var(--text-light)', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' };
    const toggleEyeStyle = { position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', zIndex: 10 };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-color)', padding: '20px' }}>
            <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>

            <div style={{
                background: 'var(--white)', border: '1px solid var(--light-gray)',
                borderRadius: '16px', overflow: 'hidden',
                display: 'flex', width: '100%', maxWidth: '1000px', height: '580px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.08)', position: 'relative'
            }}>
                <Link to="/" style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 50, textDecoration: 'none' }}>
                    <IconButton icon="fa-home" customColor="rgba(255, 255, 255, 0.15)" />
                </Link>

                <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--color-dark)', padding: '32px 40px' }}>
                    <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(4, 201, 166, 0.25) 0%, transparent 70%)' }} />
                    <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(4, 201, 166, 0.15) 0%, transparent 70%)' }} />
                    <div style={{ zIndex: 10, marginTop: 'auto', marginBottom: 'auto' }}>
                        <div style={{ background: 'var(--color-primary)', color: 'var(--white)', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '900', width: 'fit-content', marginBottom: '24px', letterSpacing: '1px', boxShadow: '0 4px 15px rgba(4, 201, 166, 0.3)' }}>
                            4 NEXUS
                        </div>
                        <h1 style={{ color: 'var(--white)', fontSize: '30px', fontWeight: '800', lineHeight: '1.2', marginBottom: '16px' }}>
                            Gestión e infraestructura de vuelo autónomo.
                        </h1>
                        <p style={{ color: 'var(--light-gray)', fontSize: '14px', lineHeight: '1.6', marginBottom: '32px', maxWidth: '90%' }}>
                            Accede a la plataforma central para monitorear tu flota, gestionar servicios y operaciones.
                        </p>
                    </div>
                </div>

                <div style={{ flex: 1.1, display: 'flex', flexDirection: 'column', background: 'var(--white)', overflow: 'hidden' }}>
                    {step !== 'success' && (
                        <div style={{ borderBottom: '1px solid var(--light-gray)', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)', shrink: 0 }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--color-dark)', fontWeight: '900' }}>
                                    {step === 'login' ? 'Iniciar Sesión' : step === 'register' ? 'Crear una Cuenta' : 'Recuperar Acceso'}
                                </h2>
                            </div>
                            {(step === 'login' || step === 'register') && (
                                <div style={{ display: 'flex', background: 'var(--white)', border: '1px solid var(--light-gray)', borderRadius: '8px', padding: '4px' }}>
                                    <button onClick={() => { setStep('login'); setRegSubStep(1); setErrorMsg(null); }} style={{ padding: '6px 20px', fontSize: '12px', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', background: step === 'login' ? 'var(--color-primary)' : 'transparent', color: step === 'login' ? 'var(--white)' : 'var(--text-light)' }}>Ingresar</button>
                                    <button onClick={() => { setStep('register'); setRegSubStep(1); setErrorMsg(null); }} style={{ padding: '6px 20px', fontSize: '12px', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', background: step === 'register' ? 'var(--color-primary)' : 'transparent', color: step === 'register' ? 'var(--white)' : 'var(--text-light)' }}>Registrar</button>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="hide-scrollbar" style={{ padding: '24px 32px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', overflowY: 'auto' }}>
                        {errorMsg && (
                            <div style={{ width: '100%', maxWidth: '360px', marginBottom: '16px' }}>
                                <Alert type="danger" title="Atención" message={errorMsg} onClose={() => setErrorMsg(null)} />
                            </div>
                        )}

                        {step === 'login' && (
                            <form onSubmit={submitLogin} style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={labelStyle}>Correo Electrónico</label>
                                    <Input type="email" icon="fa-envelope" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                </div>
                                <div>
                                    <label style={labelStyle}>Contraseña</label>
                                    <div style={{ position: 'relative' }}>
                                        <Input type={mostrarPassword ? "text" : "password"} icon="fa-lock" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                        <button type="button" onClick={() => setMostrarPassword(!mostrarPassword)} style={toggleEyeStyle}><i className={`fas ${mostrarPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i></button>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                                    <Checkbox label="Recordarme" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
                                    <button type="button" onClick={() => { setStep('recover'); setErrorMsg(null); }} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>¿Olvidaste tu contraseña?</button>
                                </div>
                            </form>
                        )}

                        {step === 'register' && (
                            <div style={{ width: '100%', maxWidth: '360px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--light-gray)', paddingBottom: '12px', marginBottom: '16px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-dark)' }}>
                                        {regSubStep === 1 ? "Credenciales de acceso" : regSubStep === 2 ? "Información personal" : "Verificación"}
                                    </span>
                                    <span style={{ fontSize: '10px', color: 'var(--color-primary)', fontWeight: 'bold', background: 'rgba(4, 201, 166, 0.1)', padding: '2px 8px', borderRadius: '20px' }}>Paso {regSubStep} de 3</span>
                                </div>

                                {regSubStep === 1 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                        <div>
                                            <label style={labelStyle}>Correo Electrónico</label>
                                            <Input type="email" icon="fa-envelope" value={email} onChange={(e) => setEmail(e.target.value)} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Contraseña</label>
                                            <div style={{ position: 'relative' }}>
                                                <Input type={mostrarPassword ? "text" : "password"} icon="fa-lock" value={password} onChange={(e) => setPassword(e.target.value)} />
                                                <button type="button" onClick={() => setMostrarPassword(!mostrarPassword)} style={toggleEyeStyle}><i className={`fas ${mostrarPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i></button>
                                            </div>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Confirmar Contraseña</label>
                                            <div style={{ position: 'relative' }}>
                                                <Input type={mostrarConfirmarPassword ? "text" : "password"} icon="fa-lock" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                                                <button type="button" onClick={() => setMostrarConfirmarPassword(!mostrarConfirmarPassword)} style={toggleEyeStyle}><i className={`fas ${mostrarConfirmarPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i></button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {regSubStep === 2 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div>
                                            <label style={labelStyle}>Selecciona tu rol</label>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                {roles.map((r) => (
                                                    <button 
                                                        key={r.key} 
                                                        type="button" 
                                                        onClick={() => setSelectedRole(r.key)} 
                                                        style={{ 
                                                            flex: 1,
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            justifyContent: 'center',
                                                            gap: '4px', 
                                                            padding: '8px 2px', 
                                                            fontSize: '11px', 
                                                            fontWeight: 'bold', 
                                                            borderRadius: '8px', 
                                                            border: `2px solid ${selectedRole === r.key ? 'var(--color-primary)' : 'var(--light-gray)'}`, 
                                                            cursor: 'pointer', 
                                                            background: selectedRole === r.key ? 'rgba(4, 201, 166, 0.05)' : 'transparent', 
                                                            color: selectedRole === r.key ? 'var(--color-primary)' : 'var(--text-light)' 
                                                        }}
                                                    >
                                                        {r.icon} {r.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label style={labelStyle}>Nombre</label>
                                            <Input type="text" icon="fa-user" value={nombres} onChange={(e) => setNombres(e.target.value)} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Apellido</label>
                                            <Input type="text" icon="fa-user" value={apellidos} onChange={(e) => setApellidos(e.target.value)} />
                                        </div>

                                        <div>
                                            <label style={labelStyle}>Teléfono</label>
                                            <Input type="tel" icon="fa-phone" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>{getIdentificacionConfig().label}</label>
                                            <Input type="text" icon={getIdentificacionConfig().icon} value={identificacion} onChange={(e) => setIdentificacion(e.target.value)} />
                                        </div>
                                    </div>
                                )}

                                {regSubStep === 3 && (
                                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '10px 0' }}>
                                        <div style={{ background: 'rgba(4, 201, 166, 0.1)', padding: '12px', borderRadius: '50%', color: 'var(--color-primary)' }}><Shield size={28} /></div>
                                        <div>
                                            <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', color: 'var(--color-dark)' }}>Casi listo</h3>
                                            <p style={{ fontSize: '12px', color: 'var(--text-light)', margin: 0, maxWidth: '260px' }}>Al hacer clic en "Enviar código", tu cuenta será creada y podrás ingresar al sistema.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 'success' && (
                            <div style={{ width: '100%', maxWidth: '360px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                <div style={{ background: 'rgba(4, 201, 166, 0.1)', padding: '12px', borderRadius: '50%', color: 'var(--color-primary)' }}><Check size={28} /></div>
                                <div>
                                    <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', color: 'var(--color-primary)' }}>¡Registro Exitoso!</h3>
                                    <p style={{ fontSize: '13px', color: 'var(--text-light)', margin: 0 }}>Tu cuenta ha sido confirmada. Ya puedes ingresar al sistema.</p>
                                </div>
                                <Button variant="primary" size="sm" onClick={() => { setStep('login'); setRegSubStep(1); }} style={{ width: '100%', marginTop: '12px', padding: '10px' }}>Ir al inicio de sesión</Button>
                            </div>
                        )}
                    </div>

                    {step !== 'success' && (
                        <div style={{ borderTop: '1px solid var(--light-gray)', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)', shrink: 0 }}>
                            <button
                                onClick={() => {
                                    setErrorMsg(null);
                                    if (step === 'register' && regSubStep > 1) setRegSubStep(prev => prev - 1);
                                    else if (step === 'verify') { setStep('register'); setRegSubStep(3); }
                                    else if (step === 'recover') setStep('login');
                                    else navigate(-1);
                                }}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', fontSize: '12px', fontWeight: 'bold' }}
                            >
                                <ChevronLeft size={16} />
                                {step === 'register' && regSubStep > 1 ? "Anterior" : step === 'verify' || step === 'recover' ? "Regresar" : "Cancelar"}
                            </button>

                            <Button
                                variant="primary"
                                size="sm"
                                disabled={isLoading}
                                onClick={(e) => {
                                    if (step === 'login') submitLogin(e);
                                    else handleNextStep();
                                }}
                                style={{ padding: '8px 24px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                {isLoading ? "Procesando..." : (
                                    <>
                                        {step === 'login' && "Ingresar al sistema"}
                                        {step === 'register' && (regSubStep < 3 ? <span style={{display:'flex', alignItems:'center', gap:'6px'}}>Siguiente <ArrowRight size={14}/></span> : "Enviar código")}
                                        {step === 'recover' && "Enviar código"}
                                        {step === 'verify' && "Verificar código"}
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;