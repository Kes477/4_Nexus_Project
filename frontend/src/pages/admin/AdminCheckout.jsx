import React from 'react';
import { ChevronLeft, Check, MapPin, User, Droplets } from 'lucide-react';

import { Button } from '../../components/ui';

export default function AdminCheckout({ onConfirm, onBack }) {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '80vh', 
      padding: '32px', 
      backgroundColor: 'var(--bg-color)', 
      fontFamily: "'Roboto', sans-serif" 
    }}>
      
      <div style={{ width: '100%', maxWidth: '420px', marginBottom: '16px' }}>
        <Button variant="outline-dark" size="sm" onClick={onBack}>
          <ChevronLeft size={16} style={{ marginRight: '6px' }} /> Volver al Panel
        </Button>
      </div>

      <div style={{ 
        width: '100%', 
        maxWidth: '420px', 
        backgroundColor: 'var(--white)', 
        borderRadius: '8px', 
        padding: '32px', 
        position: 'relative',
        boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
        border: '1px solid var(--light-gray)'
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: 'var(--color-dark)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Resumen de Vuelo
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-light)', fontWeight: '500' }}>
            Cotización preliminar
          </p>
        </div>

        <div style={{ borderBottom: '2px dashed var(--light-gray)', marginBottom: '24px' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Droplets size={14} /> Servicio
            </span>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-dark)' }}>
              Fumigación / Riego
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={14} /> Área
            </span>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-dark)' }}>
              12 Hectáreas
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} /> Piloto
            </span>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
              Javier Reyes
            </span>
          </div>

        </div>

        <div style={{ borderBottom: '2px dashed var(--light-gray)', marginBottom: '24px' }} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginBottom: '32px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-light)', fontWeight: 'bold', textTransform: 'uppercase' }}>
            Total Estimado
          </span>
          <span style={{ fontSize: '32px', fontWeight: '900', color: 'var(--color-primary)', fontFamily: 'monospace' }}>
            L 2,300.00
          </span>
        </div>

        <Button 
          variant="primary" 
          onClick={onConfirm} 
          style={{ 
            width: '100%', 
            padding: '16px', 
            fontSize: '16px', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '8px',
            borderRadius: '6px'
          }}
        >
          <Check size={18} /> Confirmar y Programar
        </Button>

        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.5 }}>
          <div style={{ display: 'flex', gap: '2px', height: '24px' }}>
            {[4,2,6,2,8,3,5,2,7,4,2,9,3,5,2,4,8,3,6,2,5,7].map((w, i) => (
               <div key={i} style={{ width: `${w}px`, backgroundColor: 'var(--color-dark)', height: '100%' }} />
            ))}
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-light)', marginTop: '8px', fontFamily: 'monospace', letterSpacing: '2px' }}>
            MIS-FUM-001
          </span>
        </div>

      </div>
    </div>
  );
}