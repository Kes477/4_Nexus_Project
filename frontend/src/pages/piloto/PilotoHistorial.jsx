import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Construction, ArrowLeft, Settings, Clock, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui';

export default function PilotoHistorial() {
  const location = useLocation();

  const getSectionName = () => {
    const path = location.pathname.split('/').pop();
    const names = {
      'misiones': 'Misiones de Vuelo',
      'bitacora': 'Bitácora de Vuelos',
      'facturacion': 'Facturación y Ganancias',
      'historial': 'Calificaciones y Reseñas',
      'soporte': 'Soporte Técnico',
      'perfil': 'Perfil del Piloto'
    };
    return names[path] || 'Panel del Piloto';
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', fontFamily: "'Roboto', sans-serif" }}>
      
      <div style={{ 
        width: '100%', 
        maxWidth: '800px', 
        backgroundColor: 'var(--white)', 
        borderRadius: '16px', 
        overflow: 'hidden', 
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        border: '1px solid var(--light-gray)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Banner superior */}
        <div style={{ 
          height: '120px', 
          backgroundColor: 'var(--color-dark)', 
          backgroundImage: 'linear-gradient(45deg, var(--color-dark) 25%, #3a4673 25%, #3a4673 50%, var(--color-dark) 50%, var(--color-dark) 75%, #3a4673 75%, #3a4673 100%)',
          backgroundSize: '40px 40px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'var(--white)',
            padding: '16px',
            borderRadius: '50%',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            transform: 'translateY(30px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Construction size={40} color="var(--color-primary)" />
          </div>
        </div>

        {/* Contenido */}
        <div style={{ padding: '60px 40px 40px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: 'var(--color-dark)', marginBottom: '16px' }}>
            {getSectionName()}
          </h1>
          
          <p style={{ margin: 0, fontSize: '16px', color: 'var(--text-light)', lineHeight: '1.6', marginBottom: '32px', maxWidth: '500px' }}>
            Estamos trabajando arduamente para habilitar esta sección. Nuestro equipo está afinando los últimos detalles para brindarte la mejor experiencia en tus operaciones de vuelo.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', width: '100%', marginBottom: '40px' }}>
            <div style={{ padding: '20px', backgroundColor: 'var(--bg-color)', border: '1px solid var(--light-gray)', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Settings size={24} color="var(--color-primary)" />
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-dark)' }}>En Desarrollo</span>
              <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>Módulo en optimización</span>
            </div>
            <div style={{ padding: '20px', backgroundColor: 'var(--bg-color)', border: '1px solid var(--light-gray)', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Clock size={24} color="var(--color-info)" />
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-dark)' }}>Próximamente</span>
              <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>Disponible en la próxima actualización</span>
            </div>
            <div style={{ padding: '20px', backgroundColor: 'var(--bg-color)', border: '1px solid var(--light-gray)', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={24} color="var(--color-success)" />
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-dark)' }}>Tus datos están seguros</span>
              <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>Sin afectaciones al sistema</span>
            </div>
          </div>

          <Link to="/piloto" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="md" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
              <ArrowLeft size={18} />
              Volver al Dashboard
            </Button>
          </Link>
        </div>

        {/* Footer interno de la tarjeta */}
        <div style={{ borderTop: '1px solid var(--light-gray)', padding: '16px 40px', backgroundColor: 'var(--bg-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: '500' }}>Sección en mantenimiento programado</span>
          <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: 'bold', letterSpacing: '1px' }}>4 NEXUS SOLUTIONS</span>
        </div>

      </div>
    </div>
  );
}