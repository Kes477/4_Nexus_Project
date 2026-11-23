
import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

export default function TecnicoLayout() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: 'var(--bg-color)'
    }}>
      <Navbar />

      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
