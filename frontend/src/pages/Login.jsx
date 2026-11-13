import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Alert, SectionHeading } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { Lock, Mail } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // Traemos la lógica del hook
    const { handleLogin, loading, error, setError } = useAuth();

    const onSubmit = (e) => {
        e.preventDefault();
        if (!email || !password) {
            setError("Por favor, llena todos los campos.");
            return;
        }
        handleLogin(email, password); // <-- Ejecutamos la petición al backend
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
            <div style={{ 
                background: 'var(--white)', padding: '40px', borderRadius: '12px', 
                border: '1px solid var(--light-gray)', width: '100%', maxWidth: '400px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
            }}>
                <SectionHeading eyebrow="4 NEXUS" title="Iniciar Sesión" description="Ingresa a tu cuenta para gestionar tus operaciones." />

                {error && (
                    <div style={{ marginBottom: '20px' }}>
                        <Alert type="danger" title="Error" message={error} onClose={() => setError(null)} />
                    </div>
                )}

                <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Usamos tus componentes Input, pero ajustados para que tengan el icono de lucide */}
                    <div style={{ position: 'relative' }}>
                        <Mail size={18} color="var(--color-primary)" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input 
                            type="email" 
                            placeholder="Correo Electrónico" 
                            className="input-field"
                            style={{ paddingLeft: '45px' }}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Lock size={18} color="var(--color-primary)" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input 
                            type="password" 
                            placeholder="Contraseña" 
                            className="input-field"
                            style={{ paddingLeft: '45px' }}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <Button variant="primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: '10px' }}>
                        {loading ? 'Ingresando...' : 'Ingresar'}
                    </Button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '25px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>¿No tienes cuenta? </span>
                    <Link to="/register" style={{ color: 'var(--color-primary)', fontSize: '13px', fontWeight: 'bold' }}>
                        Regístrate aquí
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;