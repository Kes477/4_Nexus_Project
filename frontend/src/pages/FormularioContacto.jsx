import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, Send, Phone, Mail, MapPin, Clock, MessageSquare } from 'lucide-react';
import { Input, Button, Alert, Checkbox, IconButton } from '../components/ui';
import emailjs from '@emailjs/browser'; 
import { useTheme } from '../context/useTheme';

const TIPOS_CONSULTA = [
    { value: '', label: 'Selecciona un tipo de consulta' },
    { value: 'mantenimiento', label: 'Mantenimiento' },
    { value: 'reparacion', label: 'Reparación' },
    { value: 'equipo', label: 'Cotización de equipo' },
    { value: 'suscripcion', label: 'Suscripción / Plan' },
    { value: 'otro', label: 'Otro' },
];

const REGEX = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    name: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
    phone: /^[0-9+\-\s]{8,15}$/,
};

const FormularioContacto = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        telefono: '',
        tipoConsulta: '',
        asunto: '',
        mensaje: '',
        aceptaContacto: false
    });

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    const validateField = (field, value) => {
        if (field === 'telefono') {
            if (value && !REGEX.phone.test(value)) return 'Ingresa un teléfono válido (8-15 dígitos).';
            return '';
        }

        if (field === 'aceptaContacto') {
            if (!value) return 'Debes aceptar ser contactado.';
            return '';
        }

        if (!value || !value.trim()) return 'Este campo es obligatorio.';

        switch (field) {
            case 'nombre':
                if (!REGEX.name.test(value)) return 'Solo se permiten letras y espacios.';
                break;
            case 'email':
                if (!REGEX.email.test(value)) return 'Ingresa un correo electrónico válido.';
                break;
            case 'mensaje':
                if (value.trim().length < 10) return 'Mínimo 10 caracteres.';
                break;
            default:
                break;
        }
        return '';
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched({ ...touched, [name]: true });
        const error = validateField(name, value);
        setErrors({ ...errors, [name]: error });
    };

    const validateStep = (currentStep) => {
        const newErrors = {};
        const fieldsToValidate = currentStep === 1
            ? ['nombre', 'email', 'telefono', 'tipoConsulta']
            : ['asunto', 'mensaje', 'aceptaContacto'];

        fieldsToValidate.forEach(field => {
            const error = validateField(field, formData[field]);
            if (error) newErrors[field] = error;
            setTouched(prev => ({ ...prev, [field]: true }));
        });

        setErrors(prev => ({ ...prev, ...newErrors }));
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        setErrorMsg(null);
        if (validateStep(1)) {
            setStep(2);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleBack = () => {
        setErrorMsg(null);
        if (step === 2) {
            setStep(1);
        } else {
            navigate(-1);
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setErrorMsg(null);
        if (!validateStep(2)) return;

        setIsLoading(true);
        try {
            const templateParams = {
                nombre: formData.nombre,
                email: formData.email,
                telefono: formData.telefono || 'No proporcionado',
                tipoConsulta: formData.tipoConsulta,
                asunto: formData.asunto || 'Sin asunto',
                mensaje: formData.mensaje
            };

            await emailjs.send(
                import.meta.env.VITE_EMAILJS_SERVICE_ID,
                import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
                templateParams,
                import.meta.env.VITE_EMAILJS_PUBLIC_KEY
            );
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
        setFormData({
            nombre: '',
            email: '',
            telefono: '',
            tipoConsulta: '',
            asunto: '',
            mensaje: '',
            aceptaContacto: false
        });
        setErrors({});
        setTouched({});
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
    const errorTextStyle = { color: 'var(--color-danger)', fontSize: '12px', marginTop: '4px', display: 'block' };
    const selectWrapperStyle = { position: 'relative' };

    const selectStyle = {
        width: '100%',
        padding: '12px 15px 12px 40px',
        border: `1px solid ${touched.tipoConsulta && errors.tipoConsulta ? 'var(--color-danger)' : 'var(--light-gray)'}`,
        borderRadius: '6px',
        fontSize: '16px',
        color: formData.tipoConsulta ? 'var(--color-dark)' : 'var(--text-light)',
        background: 'var(--white)',
        outline: 'none',
        fontFamily: 'inherit',
        cursor: 'pointer',
        transition: 'border-color 0.2s',
    };

    const textareaStyle = {
        width: '100%',
        padding: '12px 15px',
        border: `1px solid ${touched.mensaje && errors.mensaje ? 'var(--color-danger)' : 'var(--light-gray)'}`,
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
                        
                        {/* ETIQUETA VERDE CON LOGO */}
                        <div style={{
                            background: 'var(--color-primary)',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            width: 'fit-content',
                            marginBottom: '24px',
                            boxShadow: '0 4px 15px rgba(4, 201, 166, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <img
                                src={isLight
                                    ? 'https://storage.googleapis.com/cursopractica-imagenes-2026/img-logos/Logo_modo_claro.png'
                                    : 'https://storage.googleapis.com/cursopractica-imagenes-2026/img-logos/Logo_modo_oscuro.png'}
                                alt="4 Nexus Logo"
                                style={{ height: '40px', objectFit: 'contain' }}
                            />
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
                                    <span style={{ fontSize: '14px', fontWeight: '500' }}>+504 9595-2026</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--white)' }}>
                                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', color: 'var(--color-primary)' }}>
                                    <Mail size={18} />
                                </div>
                                <div>
                                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--light-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Escríbenos</span>
                                    <span style={{ fontSize: '14px', fontWeight: '500' }}>4nexus.contact@gmail.com</span>
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
                                        Gracias por escribirnos, {formData.nombre.split(' ')[0] || 'usuario'}. Te contactaremos pronto.
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
                            <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '420px' }}>
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
                                                name="nombre"
                                                icon="fa-user"
                                                value={formData.nombre}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                disabled={isLoading}
                                                error={touched.nombre && errors.nombre}
                                            />
                                        </div>

                                        <div style={fieldWrapperStyle}>
                                            <label style={labelStyle}>Correo electrónico *</label>
                                            <Input
                                                type="email"
                                                name="email"
                                                icon="fa-envelope"
                                                value={formData.email}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                disabled={isLoading}
                                                error={touched.email && errors.email}
                                            />
                                        </div>

                                        <div style={fieldWrapperStyle}>
                                            <label style={labelStyle}>Teléfono (Opcional)</label>
                                            <Input
                                                type="tel"
                                                name="telefono"
                                                icon="fa-phone"
                                                value={formData.telefono}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                disabled={isLoading}
                                                error={touched.telefono && errors.telefono}
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
                                                    name="tipoConsulta"
                                                    value={formData.tipoConsulta}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    style={selectStyle}
                                                    disabled={isLoading}
                                                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                                >
                                                    {TIPOS_CONSULTA.map((t) => (
                                                        <option key={t.value} value={t.value}>{t.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {touched.tipoConsulta && errors.tipoConsulta && (
                                                <span style={errorTextStyle}>{errors.tipoConsulta}</span>
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
                                                name="asunto"
                                                icon="fa-tag"
                                                value={formData.asunto}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                disabled={isLoading}
                                            />
                                        </div>

                                        <div style={fieldWrapperStyle}>
                                            <label style={labelStyle}>Mensaje *</label>
                                            <textarea
                                                name="mensaje"
                                                value={formData.mensaje}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                style={textareaStyle}
                                                disabled={isLoading}
                                                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                            />
                                            {touched.mensaje && errors.mensaje && (
                                                <span style={errorTextStyle}>{errors.mensaje}</span>
                                            )}
                                        </div>

                                        <div style={fieldWrapperStyle}>
                                            <Checkbox
                                                name="aceptaContacto"
                                                checked={formData.aceptaContacto}
                                                onChange={() => {
                                                    const nuevoValor = !formData.aceptaContacto;
                                                    setFormData({ ...formData, aceptaContacto: nuevoValor });
                                                    if (errors.aceptaContacto) {
                                                        setErrors({ ...errors, aceptaContacto: '' });
                                                    }
                                                    if (!touched.aceptaContacto) {
                                                        setTouched({ ...touched, aceptaContacto: true });
                                                    }
                                                }}
                                                onBlur={() => {
                                                    setTouched({ ...touched, aceptaContacto: true });
                                                    const error = validateField('aceptaContacto', formData.aceptaContacto);
                                                    setErrors({ ...errors, aceptaContacto: error });
                                                }}
                                                label="Acepto ser contactado por 4 Nexus."
                                            />
                                            {touched.aceptaContacto && errors.aceptaContacto && (
                                                <span style={errorTextStyle}>{errors.aceptaContacto}</span>
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
                                                    {formData.nombre} · {formData.email}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </form>
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
                                    type="button"
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
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isLoading}
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