import React from 'react';
import { Battery, Droplet, Pause, MapPin, Activity, Navigation, MessageSquare, AlertTriangle } from 'lucide-react';

import { Button, ProgressBar } from '../../components/ui';

export default function AdminTracking({ onFinish }) {
  
  const pulseStyle = `
    @keyframes pulse-red {
      0% { box-shadow: 0 0 0 0 rgba(240, 37, 88, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(240, 37, 88, 0); }
      100% { box-shadow: 0 0 0 0 rgba(240, 37, 88, 0); }
    }
  `;

  const cardStyle = {
    backgroundColor: 'var(--white)',
    border: '1px solid var(--light-gray)',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh', 
      padding: '32px 48px', 
      boxSizing: 'border-box',
      backgroundColor: 'var(--bg-color)',
      color: 'var(--color-dark)',
      fontFamily: "'Roboto', sans-serif"
    }}>
      <style>{pulseStyle}</style>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px', marginBottom: '32px', paddingBottom: '20px', borderBottom: '1px solid var(--light-gray)' }}>
        <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ 
            width: '16px', height: '16px', 
            backgroundColor: 'var(--color-danger)', 
            borderRadius: '50%',
            animation: 'pulse-red 1.5s infinite'
          }} />
          Monitoreo en Vivo
        </h2>
        <span style={{ 
          backgroundColor: 'var(--white)', 
          border: '2px solid var(--color-primary)', 
          color: 'var(--color-primary)', 
          padding: '8px 24px', 
          borderRadius: '20px', 
          fontWeight: 'bold', 
          textTransform: 'uppercase', 
          fontSize: '14px', 
          letterSpacing: '1px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
        }}>
          Estado: En Vuelo (Activo)
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', flex: 1, gap: '32px' }}>
        
        <div style={{ ...cardStyle, flex: 1, minWidth: '400px', display: 'flex', flexDirection: 'column', padding: '16px' }}>
          
          <div style={{ 
            flex: 1, 
            backgroundColor: '#1e293b', 
            borderRadius: '8px', 
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            minHeight: '400px'
          }}>
            <svg style={{ position: 'absolute', width: '100%', height: '100%' }}>
              <polygon points="200,150 600,100 700,400 300,500" fill="rgba(4, 201, 166, 0.15)" stroke="var(--color-primary)" strokeWidth="2" strokeDasharray="5 5" />
              <path d="M 250 200 L 300 180 L 350 250 L 400 220 L 450 300 L 500 280 L 550 350 L 600 320" fill="none" stroke="var(--color-warning)" strokeWidth="3" />
              <circle cx="600" cy="320" r="8" fill="var(--color-warning)" />
            </svg>
            
            <div style={{ zIndex: 1, color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={24} /> Ruta de Vuelo en Progreso
            </div>
          </div>
          
        </div>

        <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ ...cardStyle, flex: 1 }}>
             <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '900', borderBottom: '1px solid var(--light-gray)', paddingBottom: '16px' }}>
               Telemetría del Dron
             </h3>
             
             <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
               
               <div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                   <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-light)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <Battery size={18} color="var(--color-primary)" /> Batería
                   </span>
                   <span style={{ fontWeight: 'bold', fontSize: '18px', color: 'var(--color-dark)' }}>42%</span>
                 </div>
                 <ProgressBar current={42} max={100} />
               </div>

               <div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                   <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-light)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <Droplet size={18} color="var(--color-info)" /> Tanque Químico
                   </span>
                   <span style={{ fontWeight: 'bold', fontSize: '18px', color: 'var(--color-dark)' }}>30%</span>
                 </div>
                 <ProgressBar current={30} max={100} />
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingTop: '16px', borderTop: '1px solid var(--light-gray)' }}>
                 <div>
                   <span style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-light)', textTransform: 'uppercase' }}>Velocidad</span>
                   <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--color-dark)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                     <Navigation size={14} color="var(--color-primary)" /> 18 km/h
                   </span>
                 </div>
                 <div>
                   <span style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-light)', textTransform: 'uppercase' }}>Altitud</span>
                   <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--color-dark)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                     <Activity size={14} color="var(--color-primary)" /> 45 m
                   </span>
                 </div>
               </div>

             </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
             <Button variant="outline-dark" style={{ width: '100%', padding: '14px' }}>
               <Pause size={18} style={{ marginRight: '8px' }} /> Pausar Servicio
             </Button>
             
             <Button variant="outline-dark" style={{ width: '100%', padding: '14px' }}>
               <MessageSquare size={18} style={{ marginRight: '8px' }} /> Comunicar con Piloto
             </Button>

             <Button variant="primary" onClick={onFinish} style={{ width: '100%', padding: '16px', marginTop: '8px', fontSize: '16px' }}>
               <AlertTriangle size={18} style={{ marginRight: '8px' }} /> Simular Fin de Servicio
             </Button>
          </div>

        </div>

      </div>
    </div>
  );
}