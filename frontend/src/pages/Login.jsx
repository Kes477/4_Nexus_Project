import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Shield, ChevronLeft, ArrowRight, Check } from 'lucide-react';

import { Input, Button, Alert, IconButton, Checkbox, Modal } from '../components/ui';
import { useSesion } from '../hooks/useSesion';

const PANEL_POR_ROL = {
    admin: '/admin',
    piloto: '/piloto',
    tecnico: '/tecnico',
    vendedor: '/vendedor',

};

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { iniciarSesion, registrarse } = useSesion();

    const redirectTo = location.state?.from || '/cliente';
    const loginMessage = location.state?.message;
    const [step, setStep] = useState('login');
    const [regSubStep, setRegSubStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [rememberMe, setRememberMe] = useState(false);

    const [termsAccepted, setTermsAccepted] = useState(false);
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);


    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [mostrarConfirmarPassword, setMostrarConfirmarPassword] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [nombres, setNombres] = useState('');
    const [apellidos, setApellidos] = useState('');
    const [telefono, setTelefono] = useState('');
    const [identificacion, setIdentificacion] = useState('');


    const irAlPanel = (usuario) => {
        const destino = PANEL_POR_ROL[usuario.rol] ?? redirectTo;

        navigate(destino, {
            replace: true,
            state: location.state?.selectedDrone
                ? { selectedDrone: location.state.selectedDrone }
                : undefined,
        });
    };

    const submitLogin = async (e) => {
        if (e) e.preventDefault();
        setErrorMsg(null);
        setIsLoading(true);

        try {
            const usuario = await iniciarSesion(email, password);
            irAlPanel(usuario);
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
                if (!termsAccepted) {
                    return setErrorMsg("Debes aceptar los Términos y Condiciones para registrarte.");
                }

                setIsLoading(true);
                try {
                    const usuario = await registrarse({
                        email,
                        password,
                        first_name: nombres,
                        last_name: apellidos,
                        no_identificacion: identificacion,
                        telefono,
                    });
                    irAlPanel(usuario);
                } catch (error) {
                    const errores = error.response?.data;
                    if (!errores) {
                        setErrorMsg('No se pudo conectar con el servidor. Intenta de nuevo.');
                    } else {
                        const primerCampo = Object.keys(errores)[0];
                        setErrorMsg([].concat(errores[primerCampo])[0]);
                    }
                } finally {
                    setIsLoading(false);
                }
            }
        } else if (step === 'recover') {
            setStep('success');
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
                        {loginMessage && step ==='login' && !errorMsg &&(
                            <div style={{ width: '100%', maxWidth: '360px', marginBottom: '16px' }} >
                                <Alert type='info' title = 'Aviso' message={loginMessage}/>
                            </div>    
                        )}
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
                                        {regSubStep === 1 ? "Credenciales de acceso" : regSubStep === 2 ? "Información personal" : "Verificación Final"}
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
                                            <label style={labelStyle}>Identificación (DNI / RTN)</label>
                                            <Input type="text" icon="fa-id-card" value={identificacion} onChange={(e) => setIdentificacion(e.target.value)} />
                                        </div>
                                    </div>
                                )}

                                {regSubStep === 3 && (
                                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '10px 0' }}>
                                        <div style={{ background: 'rgba(4, 201, 166, 0.1)', padding: '12px', borderRadius: '50%', color: 'var(--color-primary)' }}><Shield size={28} /></div>
                                        <div>
                                            <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', color: 'var(--color-dark)' }}>Casi listo</h3>
                                            <p style={{ fontSize: '13px', color: 'var(--text-light)', margin: 0, maxWidth: '280px', lineHeight: '1.5' }}>
                                                Al hacer clic en "Finalizar Registro", tu cuenta será creada y podrás ingresar inmediatamente al sistema.
                                            </p>
                                        </div>

                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'flex-start', 
                                            gap: '12px',
                                            marginTop: '12px', 
                                            width: '100%', 
                                            textAlign: 'left', 
                                            background: 'var(--bg-color)', 
                                            padding: '16px', 
                                            borderRadius: '8px', 
                                            border: '1px solid var(--light-gray)',
                                            boxSizing: 'border-box'
                                        }}>
                                            <div style={{ marginTop: '2px' }}>
                                                <Checkbox 
                                                    checked={termsAccepted} 
                                                    onChange={() => setTermsAccepted(!termsAccepted)}
                                                />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <span style={{ fontSize: '13px', color: 'var(--color-dark)', lineHeight: '1.6', fontWeight: '500', display: 'inline-block' }}>
                                                    He leído y acepto los{' '}
                                                    <button 
                                                        type="button" 
                                                        onClick={(e) => { e.preventDefault(); setIsTermsModalOpen(true); }}
                                                        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', padding: 0, fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
                                                    >
                                                        Términos y Condiciones
                                                    </button>{' '}
                                                    y la{' '}
                                                    <button 
                                                        type="button" 
                                                        onClick={(e) => { e.preventDefault(); setIsTermsModalOpen(true); }}
                                                        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', padding: 0, fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
                                                    >
                                                        Política de Privacidad
                                                    </button>.
                                                </span>
                                            </div>
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
                                    <p style={{ fontSize: '13px', color: 'var(--text-light)', margin: 0 }}>Tu cuenta ha sido creada. Ya puedes ingresar al sistema.</p>
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
                                    else if (step === 'recover') setStep('login');
                                    else navigate(-1);
                                }}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', fontSize: '12px', fontWeight: 'bold' }}
                            >
                                <ChevronLeft size={16} />
                                {step === 'register' && regSubStep > 1 ? "Anterior" : step === 'recover' ? "Regresar" : "Cancelar"}
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
                                        {step === 'register' && (regSubStep < 3 ? <span style={{display:'flex', alignItems:'center', gap:'6px'}}>Siguiente <ArrowRight size={14}/></span> : "Finalizar Registro")}
                                        {step === 'recover' && "Recuperar cuenta"}
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <Modal 
                isOpen={isTermsModalOpen} 
                onClose={() => setIsTermsModalOpen(false)} 
                title="Términos y Condiciones de Uso"
                style={{ width: '1000px', maxWidth: '95vw' }}
            >
                <div style={{ 
                    height: '450px', 
                    overflowY: 'auto', 
                    paddingRight: '15px', 
                    fontSize: '13px', 
                    color: 'var(--text-light)', 
                    lineHeight: '1.7' 
                }}>
                    <h4 style={{ color: 'var(--color-dark)', marginBottom: '8px', fontSize: '15px' }}>1. Aceptación de los Términos</h4>
                    <p style={{ marginBottom: '16px' }}>
                        Al acceder y utilizar la plataforma 4 NEXUS, usted acepta estar sujeto a estos Términos y Condiciones, así como a todas las leyes y regulaciones aplicables. Si no está de acuerdo con alguno de estos términos, tiene prohibido usar o acceder a este sitio. Los materiales contenidos en este sitio web están protegidos por las leyes de derechos de autor y marcas registradas aplicables.
                    </p>

                    <h4 style={{ color: 'var(--color-dark)', marginBottom: '8px', fontSize: '15px' }}>2. Uso de la Plataforma y Servicios</h4>
                    <p style={{ marginBottom: '16px' }}>
                        Nuestra plataforma está diseñada para la gestión de vuelos autónomos, servicios de drones y operaciones relacionadas. Usted se compromete a utilizar los servicios de manera ética y de acuerdo con las regulaciones aeronáuticas vigentes en su país. Queda estrictamente prohibido el uso de la plataforma para actividades ilícitas, espionaje, o cualquier acción que viole la privacidad de terceros.
                    </p>

                    <h4 style={{ color: 'var(--color-dark)', marginBottom: '8px', fontSize: '15px' }}>3. Registro y Seguridad de la Cuenta</h4>
                    <p style={{ marginBottom: '16px' }}>
                        Para acceder a ciertas funciones, debe registrarse y crear una cuenta. Usted es responsable de mantener la confidencialidad de su contraseña y de todas las actividades que ocurran bajo su cuenta. Nos reservamos el derecho de suspender o cancelar cuentas que violen las normas de seguridad, presenten actividad sospechosa o incumplan estos términos. Usted acepta notificarnos inmediatamente cualquier uso no autorizado de su cuenta.
                    </p>

                    <h4 style={{ color: 'var(--color-dark)', marginBottom: '8px', fontSize: '15px' }}>4. Política de Privacidad y Datos Personales</h4>
                    <p style={{ marginBottom: '16px' }}>
                        Sus datos personales (nombre, correo electrónico, teléfono y documento de identidad) serán tratados de acuerdo con nuestra Política de Privacidad. Utilizamos esta información para la creación de su cuenta, la asignación de misiones, la facturación y la comunicación necesaria para el funcionamiento de la plataforma. No compartiremos su información con terceros sin su consentimiento, salvo que sea requerido por ley.
                    </p>

                    <h4 style={{ color: 'var(--color-dark)', marginBottom: '8px', fontSize: '15px' }}>5. Uso de Cookies y Tecnologías de Rastreo</h4>
                    <p style={{ marginBottom: '16px' }}>
                        Utilizamos cookies y tecnologías similares para rastrear la actividad en nuestra plataforma y mantener cierta información. Las cookies son archivos con una pequeña cantidad de datos que pueden incluir un identificador único anónimo. Se envían a su navegador desde un sitio web y se almacenan en el almacenamiento local de su dispositivo. Usted puede instruir a su navegador para rechazar todas las cookies o para indicar cuándo se envía una cookie.
                    </p>

                    <h4 style={{ color: 'var(--color-dark)', marginBottom: '8px', fontSize: '15px' }}>6. Obligaciones del Usuario</h4>
                    <p style={{ marginBottom: '16px' }}>
                        Usted se compromete a no utilizar la plataforma para ningún propósito que sea ilegal o prohibido por estos Términos. No debe realizar ingeniería inversa, descompilar o desensamblar ningún aspecto del software de la plataforma. Tampoco debe intentar obtener acceso no autorizado a los servidores o bases de datos de 4 NEXUS.
                    </p>

                    <h4 style={{ color: 'var(--color-dark)', marginBottom: '8px', fontSize: '15px' }}>7. Propiedad Intelectual</h4>
                    <p style={{ marginBottom: '16px' }}>
                        Todo el contenido, características y funcionalidades (incluyendo, pero no limitado a, toda la información, software, texto, pantallas, imágenes, video y audio, y el diseño, selección y arreglo de los mismos), son propiedad exclusiva de 4 NEXUS o sus licenciantes u otros proveedores de dicho material y están protegidos por las leyes de propiedad intelectual de Honduras y tratados internacionales.
                    </p>

                    <h4 style={{ color: 'var(--color-dark)', marginBottom: '8px', fontSize: '15px' }}>8. Limitación de Responsabilidad</h4>
                    <p style={{ marginBottom: '16px' }}>
                        En ningún caso 4 NEXUS será responsable de daños directos, indirectos, incidentales, especiales o consecuentes que resulten del uso o la imposibilidad de usar la plataforma. Usted asume la responsabilidad total por el uso de los drones y equipos operados a través de nuestra red, incluyendo el cumplimiento de todas las normativas locales de aviación civil.
                    </p>

                    <h4 style={{ color: 'var(--color-dark)', marginBottom: '8px', fontSize: '15px' }}>9. Resolución de Disputas y Legislación Aplicable</h4>
                    <p style={{ marginBottom: '16px' }}>
                        Cualquier disputa que surja en relación con estos Términos se resolverá de conformidad con las leyes de la República de Honduras. Las partes acuerdan someterse a la jurisdicción exclusiva de los tribunales de Tegucigalpa, renunciando a cualquier otro fuero que pudiera corresponderles.
                    </p>

                    <h4 style={{ color: 'var(--color-dark)', marginBottom: '8px', fontSize: '15px' }}>10. Modificaciones de los Términos</h4>
                    <p style={{ marginBottom: '16px' }}>
                        Nos reservamos el derecho de modificar o reemplazar estos Términos en cualquier momento. Si una revisión es material, le proporcionaremos un aviso con al menos 30 días de anticipación antes de que los nuevos términos entren en vigencia. Lo que constituye un cambio material será determinado a nuestra entera discreción.
                    </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--light-gray)' }}>
                    <Button variant="outline-dark" size="sm" onClick={() => setIsTermsModalOpen(false)}>
                        Cerrar
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => { setTermsAccepted(true); setIsTermsModalOpen(false); }}>
                        Aceptar Términos
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default Login;