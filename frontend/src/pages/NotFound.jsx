import { useNavigate } from 'react-router-dom';
import { Navbar, Footer } from '../components/layout';
import { Button } from '../components/ui';
import { MapPinOff } from 'lucide-react';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-color)' }}>
            <Navbar />

            <main style={{ 
                flexGrow: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center', 
                alignItems: 'center', 
                padding: '110px 20px',
                textAlign: 'center'
            }}>
                <div style={{ 
                    background: 'rgba(4, 201, 166, 0.1)', 
                    color: 'var(--color-primary)', 
                    padding: '30px', 
                    borderRadius: '50%', 
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <MapPinOff size={64} strokeWidth={1.5} />
                </div>

                <h1 style={{ 
                    fontSize: '80px', 
                    fontWeight: '900', 
                    color: 'var(--color-primary)', 
                    margin: '0 0 10px 0',
                    lineHeight: '1'
                }}>
                    404
                </h1>

                <h2 style={{ 
                    fontSize: '28px', 
                    color: 'var(--color-dark)', 
                    marginBottom: '15px' 
                }}>
                    Página no encontrada
                </h2>

                <p style={{ 
                    fontSize: '16px', 
                    color: 'var(--text-light)', 
                    maxWidth: '500px', 
                    marginBottom: '30px',
                    lineHeight: '1.6'
                }}>
                    Lo sentimos, parece que has volado fuera de ruta. La página que estás buscando no existe o ha sido movida.
                </p>

                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Button 
                        variant="primary" 
                        onClick={() => navigate('/')}
                    >
                        Volver al Inicio
                    </Button>
                    <Button 
                        variant="outline-dark" 
                        onClick={() => navigate(-1)}
                    >
                        Regresar
                    </Button>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default NotFound;