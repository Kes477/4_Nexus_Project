import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer'; // <-- 1. IMPORTAMOS EL FOOTER

export const ClienteLayout = () => {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            
            <main style={{ flexGrow: 1, padding: '30px 20px' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <Outlet />
                </div>
            </main>

            <Footer />
        </div>
    );
};