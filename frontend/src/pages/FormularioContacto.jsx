import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ChevronLeft, ChevronRight, Check, Send } from 'lucide-react';
import { Input, Button, Alert, Checkbox } from '../components/ui';

const carouselImages = [
    "https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1579829366248-204fe8413f31?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1473968512647-3e447244af8f?q=80&w=1000&auto=format&fit=crop",
];

const TIPOS_CONSULTA = [
    { value: '', label: 'Selecciona un tipo de consulta' },
    { value: 'mantenimiento', label: 'Mantenimiento' },
    { value: 'reparacion', label: 'Reparación' },
    { value: 'equipo', label: 'Cotización de equipo' },
    { value: 'suscripcion', label: 'Suscripción / Plan' },
    { value: 'otro', label: 'Otro' },
];

const FormularioContacto = () => {
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [success, setSuccess] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [fieldErrors, setFieldErrors] = useState({});

    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [telefono, setTelefono] = useState('');
    const [tipoConsulta, setTipoConsulta] = useState('');
    const [asunto, setAsunto] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [aceptaContacto, setAceptaContacto] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const validateStep1 = () => {
        const errs = {};
        if (!nombre.trim()) errs.nombre = 'El nombre es requerido.';
        if (!email.trim()) errs.email = 'El correo es requerido.';
        else if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = 'Correo inválido.';
        if (!tipoConsulta) errs.tipoConsulta = 'Selecciona un tipo de consulta.';
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const validateStep2 = () => {
        const errs = {};
        if (!mensaje.trim()) errs.mensaje = 'El mensaje es requerido.';
        else if (mensaje.trim().length < 10) errs.mensaje = 'Mínimo 10 caracteres.';
        if (!aceptaContacto) errs.aceptaContacto = 'Debes aceptar ser contactado.';
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const goToStep = (nextStep) => {
        setErrorMsg(null);
        setFieldErrors({});
        setStep(nextStep);
    };

    const handleNext = () => {
        if (validateStep1()) goToStep(2);
    };

    const handleBack = () => {
        if (step === 2) goToStep(1);
        else navigate(-1);
    };

    const handleSubmit = async () => {
        setErrorMsg(null);
        if (!validateStep2()) return;

        setIsLoading(true);
        try {
            const respuesta = await fetch('http://localhost:8000/api/contacto/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre,
                    email,
                    telefono,
                    tipo_consulta: tipoConsulta,
                    asunto,
                    mensaje,
                }),
            });

            if (!respuesta.ok) throw new Error('Error al enviar el mensaje');
            setSuccess(true);
        } catch (error) {
            console.error('Error al enviar:', error);
            setErrorMsg('No pudimos enviar tu mensaje. Intenta nuevamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setSuccess(false);
        setStep(1);
        setNombre('');
        setEmail('');
        setTelefono('');
        setTipoConsulta('');
        setAsunto('');
        setMensaje('');
        setAceptaContacto(false);
        setFieldErrors({});
        setErrorMsg(null);
    };

    const labelStyle = {
        fontSize: '12px',
        fontWeight: '600',
        color: 'var(--color-dark)',
        marginBottom: '6px',
        display: 'block',
    };

    const fieldWrapperStyle = { display: 'flex', flexDirection: 'column' };

    const errorTextStyle = {
        color: 'var(--color-danger)',
        fontSize: '12px',
        marginTop: '5px',
        display: 'block',
    };

    const selectWrapperStyle = { position: 'relative' };

    const selectStyle = {
        width: '100%',
        padding: '12px 15px 12px 40px',
        border: `1px solid ${fieldErrors.tipoConsulta ? 'var(--color-danger)' : 'var(--light-gray)'}`,
        borderRadius: '6px',
        fontSize: '16px',
        color: tipoConsulta ? 'var(--color-dark)' : 'var(--text-light)',
        background: 'var(--white)',
        outline: 'none',
        fontFamily: 'inherit',
        cursor: 'pointer',
    };

    const textareaStyle = {
        width: '100%',
        padding: '12px 15px',
        border: `1px solid ${fieldErrors.mensaje ? 'var(--color-danger)' : 'var(--light-gray)'}`,
        borderRadius: '6px',
        fontSize: '16px',
        color: 'var(--color-dark)',
        background: 'var(--white)',
        outline: 'none',
        fontFamily: 'inherit',
        resize: 'vertical',
        minHeight: '110px',
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-color)', padding: '30px 20px' }}>

            <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>

            <div style={{
                background: 'var(--white)', border: '1px solid var(--light-gray)',
                borderRadius: '12px', overflow: 'hidden',
                display: 'flex', width: '100%', maxWidth: '1000px', height: '620px',
                boxShadow: '0 15px 40px rgba(0,0,0,0.06)', position: 'relative',
            }}>

                <Link
                    to="/"
                    style={{
                        position: 'absolute', top: '20px', left: '20px', zIndex: 50,
                        background: 'rgba(255,255,255,0.9)', padding: '8px', borderRadius: '50%',
                        color: 'var(--color-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)', textDecoration: 'none', transition: 'all 0.3s',
                    }}
                    title="Volver al inicio"
                >
                    <Home size={18} />
                </Link>

                <div style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden', background: 'var(--color-dark)' }}>
                    {carouselImages.map((src, index) => (
                        <img
                            key={index}
                            src={src}
                            alt={`Slide ${index}`}
                            style={{
                                position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                                opacity: index === currentImageIndex ? 1 : 0, transition: 'opacity 1s ease-in-out',
                            }}
                        />
                    ))}
                    <div
                        style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(to top, rgba(44, 54, 94, 0.95), transparent 60%)',
                            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '30px', zIndex: 10,
                        }}
                    >
                        <span style={{ background: 'var(--color-primary)', color: 'var(--white)', padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', width: 'fit-content', marginBottom: '10px' }}>
                            4 NEXUS
                        </span>
                        <p style={{ color: 'var(--white)', fontSize: '15px', margin: 0, fontWeight: '500', lineHeight: '1.4' }}>
                            Cuéntanos qué necesitas. Te responderemos a la brevedad.
                        </p>
                    </div>
                </div>

                <div style={{ flex: 1.1, display: 'flex', flexDirection: 'column', background: 'var(--white)', overflow: 'hidden' }}>

                    {!success && (
                        <div style={{ borderBottom: '1px solid var(--light-gray)', padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)', shrink: 0 }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--color-primary)', fontWeight: '900', letterSpacing: '1px' }}>4 NEXUS</h2>
                                <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: '500' }}>Formulario de contacto</span>
                            </div>
                            <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 'bold', background: 'rgba(4, 201, 166, 0.1)', padding: '4px 10px', borderRadius: '20px' }}>
                                Respuesta &lt; 24h
                            </span>
                        </div>
                    )}

                    <div
                        className="hide-scrollbar"
                        style={{
                            padding: '25px 40px', flexGrow: 1, display: 'flex', flexDirection: 'column',
                            justifyContent: success ? 'center' : 'flex-start',
                            alignItems: 'center', overflowY: 'auto',
                            scrollbarWidth: 'none', msOverflowStyle: 'none',
                        }}
                    >
                        {errorMsg && (
                            <div style={{ width: '100%', maxWidth: '420px', marginBottom: '12px' }}>
                                <Alert type="danger" title="Atención" message={errorMsg} onClose={() => setErrorMsg(null)} />
                            </div>
                        )}

                        {success ? (
                            <div style={{ width: '100%', maxWidth: '380px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                                <div style={{ background: 'rgba(4, 201, 166, 0.1)', padding: '14px', borderRadius: '50%', color: 'var(--color-primary)' }}>
                                    <Check size={28} />
                                </div>
                                <h3 style={{ margin: 0, fontSize: '20px', color: 'var(--color-primary)' }}>¡Mensaje enviado!</h3>
                                <p style={{ fontSize: '13px', color: 'var(--text-light)', margin: 0 }}>
                                    Gracias por escribirnos, {nombre.split(' ')[0] || 'usuario'}. Te contactaremos pronto.
                                </p>
                                <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '10px' }}>
                                    <Button variant="outline-dark" onClick={() => navigate('/')} style={{ flex: 1 }}>
                                        Ir al inicio
                                    </Button>
                                    <Button variant="primary" onClick={resetForm} style={{ flex: 1 }}>
                                        Enviar otro
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ width: '100%', maxWidth: '420px' }}>
                                {/* Indicador de paso — mismo patrón que Login.jsx */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--light-gray)', paddingBottom: '10px', marginBottom: '18px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-dark)' }}>
                                        {step === 1 && 'Paso 1: Información de contacto'}
                                        {step === 2 && 'Paso 2: Detalles del mensaje'}
                                    </span>
                                    <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 'bold', background: 'rgba(4, 201, 166, 0.1)', padding: '2px 8px', borderRadius: '20px' }}>
                                        Paso {step} de 2
                                    </span>
                                </div>

                                {/* PASO 1 */}
                                {step === 1 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                        <div style={fieldWrapperStyle}>
                                            <label style={labelStyle}>Nombre completo *</label>
                                            <Input
                                                type="text"
                                                icon="fa-user"
                                                placeholder="Ej. Juan Pérez"
                                                value={nombre}
                                                onChange={(e) => setNombre(e.target.value)}
                                                disabled={isLoading}
                                                error={fieldErrors.nombre}
                                            />
                                        </div>

                                        <div style={fieldWrapperStyle}>
                                            <label style={labelStyle}>Correo electrónico *</label>
                                            <Input
                                                type="email"
                                                icon="fa-envelope"
                                                placeholder="usuario@ejemplo.hn"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                disabled={isLoading}
                                                error={fieldErrors.email}
                                            />
                                        </div>

                                        <div style={fieldWrapperStyle}>
                                            <label style={labelStyle}>Teléfono</label>
                                            <Input
                                                type="tel"
                                                icon="fa-phone"
                                                placeholder="+504 9999-0000"
                                                value={telefono}
                                                onChange={(e) => setTelefono(e.target.value)}
                                                disabled={isLoading}
                                            />
                                        </div>

                                        <div style={fieldWrapperStyle}>
                                            <label style={labelStyle}>Tipo de consulta *</label>
                                            <div style={selectWrapperStyle}>
                                                <i
                                                    className="fas fa-list"
                                                    style={{
                                                        position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)',
                                                        color: 'var(--text-light)', fontSize: '14px', pointerEvents: 'none',
                                                    }}
                                                ></i>
                                                <select
                                                    value={tipoConsulta}
                                                    onChange={(e) => setTipoConsulta(e.target.value)}
                                                    style={selectStyle}
                                                    disabled={isLoading}
                                                >
                                                    {TIPOS_CONSULTA.map((t) => (
                                                        <option key={t.value} value={t.value}>{t.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {fieldErrors.tipoConsulta && (
                                                <span style={errorTextStyle}>{fieldErrors.tipoConsulta}</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* PASO 2 */}
                                {step === 2 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                        <div style={fieldWrapperStyle}>
                                            <label style={labelStyle}>Asunto</label>
                                            <Input
                                                type="text"
                                                icon="fa-tag"
                                                placeholder="Motivo breve de tu consulta"
                                                value={asunto}
                                                onChange={(e) => setAsunto(e.target.value)}
                                                disabled={isLoading}
                                            />
                                        </div>

                                        <div style={fieldWrapperStyle}>
                                            <label style={labelStyle}>Mensaje *</label>
                                            <textarea
                                                value={mensaje}
                                                onChange={(e) => setMensaje(e.target.value)}
                                                placeholder="Describe tu necesidad, equipo o proyecto..."
                                                style={textareaStyle}
                                                disabled={isLoading}
                                            />
                                            {fieldErrors.mensaje && (
                                                <span style={errorTextStyle}>{fieldErrors.mensaje}</span>
                                            )}
                                        </div>

                                        <div style={fieldWrapperStyle}>
                                            <Checkbox
                                                checked={aceptaContacto}
                                                onChange={() => setAceptaContacto(!aceptaContacto)}
                                                label="Acepto ser contactado por 4 Nexus."
                                            />
                                            {fieldErrors.aceptaContacto && (
                                                <span style={errorTextStyle}>{fieldErrors.aceptaContacto}</span>
                                            )}
                                        </div>

                                        {/* Resumen compacto del paso 1 */}
                                        <div style={{ marginTop: '4px', padding: '10px 12px', background: 'var(--bg-color)', borderRadius: '6px', border: '1px solid var(--light-gray)' }}>
                                            <span style={{ fontSize: '11px', color: 'var(--text-light)', display: 'block', marginBottom: '2px', fontWeight: 'bold', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                                Contacto
                                            </span>
                                            <span style={{ fontSize: '13px', color: 'var(--color-dark)', fontWeight: '600' }}>
                                                {nombre} · {email}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {!success && (
                        <div style={{ borderTop: '1px solid var(--light-gray)', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)', shrink: 0 }}>
                            <button
                                type="button"
                                onClick={handleBack}
                                disabled={isLoading}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none',
                                    cursor: isLoading ? 'not-allowed' : 'pointer',
                                    color: 'var(--text-light)', fontSize: '12px', fontWeight: 'bold',
                                    opacity: isLoading ? 0.6 : 1,
                                }}
                            >
                                <ChevronLeft size={16} />
                                {step === 2 ? 'Anterior' : 'Cancelar'}
                            </button>

                            {step === 1 ? (
                                <Button
                                    variant="primary"
                                    onClick={handleNext}
                                    disabled={isLoading}
                                    style={{ padding: '8px 20px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    Siguiente <ChevronRight size={14} />
                                </Button>
                            ) : (
                                <Button
                                    variant="primary"
                                    disabled={isLoading}
                                    onClick={handleSubmit}
                                    style={{ padding: '8px 20px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    {isLoading ? (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <i className="fas fa-circle-notch fa-spin"></i> Enviando...
                                        </span>
                                    ) : (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            Enviar mensaje <Send size={14} />
                                        </span>
                                    )}
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FormularioContacto;