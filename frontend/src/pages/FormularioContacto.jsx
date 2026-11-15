import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ChevronLeft, ChevronRight, Check, Send, Phone, Mail, MapPin, Clock, MessageSquare } from 'lucide-react';
import { Input, Button, Alert, Checkbox, IconButton } from '../components/ui';

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
    const [fieldErrors, setFieldErrors] = useState({});

    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [telefono, setTelefono] = useState('');
    const [tipoConsulta, setTipoConsulta] = useState('');
    const [asunto, setAsunto] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [aceptaContacto, setAceptaContacto] = useState(false);

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
        fontSize: '11px',
        fontWeight: '700',
        color: 'var(--text-light)',
        marginBottom: '6px',
        display: 'block',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    };

    const fieldWrapperStyle = { display: 'flex', flexDirection: 'column' };

    const errorTextStyle = {
        color: 'var(--color-danger)',
        fontSize: '12px',
        marginTop: '4px',
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
        transition: 'border-color 0.2s',
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
        minHeight: '100px',
        transition: 'border-color 0.2s',
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-color)', padding: '20px' }}>

            <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>

            <div style={{
                background: 'var(--white)', border: '1px solid var(--light-gray)',
                borderRadius: '16px', overflow: 'hidden',
                display: 'flex', width: '100%', maxWidth: '1000px', height: '600px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.08)', position: 'relative',
            }}>

                <Link to="/" style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 50, textDecoration: 'none' }} title="Volver al inicio">
                    <IconButton 
                        icon="fa-home" 
                        customColor="rgba(255, 255, 255, 0.15)" 
                    />
                </Link>

                <div style={{ 
                    flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', 
                    overflow: 'hidden', background: 'var(--color-dark)',
                    padding: '32px 40px'
                }}>
                    <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(4, 201, 166, 0.25) 0%, transparent 70%)' }} />
                    <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(4, 201, 166, 0.15) 0%, transparent 70%)' }} />

                    <div style={{ zIndex: 10, marginTop: 'auto', marginBottom: 'auto' }}>
                        <div style={{ 
                            background: 'var(--color-primary)', color: 'var(--white)', 
                            padding: '6px 14px', borderRadius: '8px', fontSize: '13px', 
                            fontWeight: '900', width: 'fit-content', marginBottom: '24px',
                            letterSpacing: '1px', boxShadow: '0 4px 15px rgba(4, 201, 166, 0.3)'
                        }}>
                            4 NEXUS
                        </div>
                        
                        <h1 style={{ color: 'var(--white)', fontSize: '28px', fontWeight: '800', lineHeight: '1.2', marginBottom: '12px' }}>
                            Hablemos de tu próximo proyecto.
                        </h1>
                        
                        <p style={{ color: 'var(--light-gray)', fontSize: '14px', lineHeight: '1.6', marginBottom: '32px', maxWidth: '90%' }}>
                            Completa el formulario y nuestro equipo de soporte técnico y ventas se pondrá en contacto contigo a la brevedad.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--white)' }}>
                                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', color: 'var(--color-primary)' }}>
                                    <Phone size={18} />
                                </div>
                                <div>
                                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--light-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Llámanos</span>
                                    <span style={{ fontSize: '14px', fontWeight: '500' }}>+504 9999-0000</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--white)' }}>
                                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', color: 'var(--color-primary)' }}>
                                    <Mail size={18} />
                                </div>
                                <div>
                                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--light-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Escríbenos</span>
                                    <span style={{ fontSize: '14px', fontWeight: '500' }}>soporte@4nexus.com</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--white)' }}>
                                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', color: 'var(--color-primary)' }}>
                                    <MapPin size={18} />
                                </div>
                                <div>
                                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--light-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Ubicación</span>
                                    <span style={{ fontSize: '14px', fontWeight: '500' }}>Tegucigalpa, Honduras</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--white)' }}>
                                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', color: 'var(--color-primary)' }}>
                                    <Clock size={18} />
                                </div>
                                <div>
                                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--light-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Horario</span>
                                    <span style={{ fontSize: '14px', fontWeight: '500' }}>Lun - Vie, 8:00 AM - 5:00 PM</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ flex: 1.1, display: 'flex', flexDirection: 'column', background: 'var(--white)', overflow: 'hidden' }}>

                    {!success && (
                        <div style={{ borderBottom: '1px solid var(--light-gray)', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)', shrink: 0 }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--color-dark)', fontWeight: '900' }}>
                                    Formulario de Contacto
                                </h2>
                                <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: '500' }}>
                                    Envíanos un mensaje directo.
                                </span>
                            </div>
                            <span style={{ fontSize: '10px', color: 'var(--color-primary)', fontWeight: 'bold', background: 'rgba(4, 201, 166, 0.1)', padding: '4px 10px', borderRadius: '20px' }}>
                                Respuesta &lt; 24h
                            </span>
                        </div>
                    )}

                    <div
                        className="hide-scrollbar"
                        style={{
                            padding: '24px 32px', flexGrow: 1, display: 'flex', flexDirection: 'column',
                            justifyContent: success ? 'center' : 'flex-start',
                            alignItems: 'center', overflowY: 'auto',
                            scrollbarWidth: 'none', msOverflowStyle: 'none',
                        }}
                    >
                        {errorMsg && (
                            <div style={{ width: '100%', maxWidth: '420px', marginBottom: '16px' }}>
                                <Alert type="danger" title="Atención" message={errorMsg} onClose={() => setErrorMsg(null)} />
                            </div>
                        )}

                        {success ? (
                            <div style={{ width: '100%', maxWidth: '380px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                <div style={{ background: 'rgba(4, 201, 166, 0.1)', padding: '16px', borderRadius: '50%', color: 'var(--color-primary)' }}>
                                    <Check size={32} />
                                </div>
                                <div>
                                    <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', color: 'var(--color-primary)' }}>¡Mensaje enviado!</h3>
                                    <p style={{ fontSize: '13px', color: 'var(--text-light)', margin: 0 }}>
                                        Gracias por escribirnos, {nombre.split(' ')[0] || 'usuario'}. Te contactaremos pronto.
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '16px' }}>
                                    <Button variant="outline-dark" onClick={() => navigate('/')} style={{ flex: 1, padding: '10px' }}>
                                        Ir al inicio
                                    </Button>
                                    <Button variant="primary" onClick={resetForm} style={{ flex: 1, padding: '10px' }}>
                                        Enviar otro
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ width: '100%', maxWidth: '420px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--light-gray)', paddingBottom: '12px', marginBottom: '16px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-dark)' }}>
                                        {step === 1 && 'Paso 1: Información de contacto'}
                                        {step === 2 && 'Paso 2: Detalles del mensaje'}
                                    </span>
                                    <span style={{ fontSize: '10px', color: 'var(--color-primary)', fontWeight: 'bold', background: 'rgba(4, 201, 166, 0.1)', padding: '2px 8px', borderRadius: '20px' }}>
                                        Paso {step} de 2
                                    </span>
                                </div>

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
                                            <label style={labelStyle}>Teléfono (Opcional)</label>
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
                                                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                                    onBlur={(e) => e.target.style.borderColor = fieldErrors.tipoConsulta ? 'var(--color-danger)' : 'var(--light-gray)'}
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
                                                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                                onBlur={(e) => e.target.style.borderColor = fieldErrors.mensaje ? 'var(--color-danger)' : 'var(--light-gray)'}
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

                                        <div style={{ marginTop: '4px', padding: '12px', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--light-gray)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ background: 'var(--white)', padding: '6px', borderRadius: '50%', color: 'var(--color-primary)', border: '1px solid var(--light-gray)' }}>
                                                <MessageSquare size={16} />
                                            </div>
                                            <div style={{ overflow: 'hidden' }}>
                                                <span style={{ fontSize: '10px', color: 'var(--text-light)', display: 'block', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    Contacto
                                                </span>
                                                <span style={{ fontSize: '13px', color: 'var(--color-dark)', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                                                    {nombre} · {email}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {!success && (
                        <div style={{ borderTop: '1px solid var(--light-gray)', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)', shrink: 0 }}>
                            <button
                                type="button"
                                onClick={handleBack}
                                disabled={isLoading}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none',
                                    cursor: isLoading ? 'not-allowed' : 'pointer',
                                    color: 'var(--text-light)', fontSize: '13px', fontWeight: 'bold',
                                    opacity: isLoading ? 0.6 : 1,
                                    transition: 'color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-dark)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-light)'}
                            >
                                <ChevronLeft size={16} />
                                {step === 2 ? 'Anterior' : 'Cancelar'}
                            </button>

                            {step === 1 ? (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleNext}
                                    disabled={isLoading}
                                    style={{ padding: '10px 28px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    Siguiente <ChevronRight size={14} />
                                </Button>
                            ) : (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    disabled={isLoading}
                                    onClick={handleSubmit}
                                    style={{ padding: '10px 28px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
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