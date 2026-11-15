import React from 'react';
import { ChevronLeft, MapPin, Package } from 'lucide-react';

// Importación estricta de tus componentes UI
import { Button, Input } from '../../components/ui';

export default function AdminConfigCarga({ onNext, onBack }) {
  
  // Estilos reutilizables
  const containerStyle = {
    width: '100%',
    minHeight: '100vh',
    padding: '32px 48px',
    boxSizing: 'border-box',
    backgroundColor: 'var(--bg-color)',
    color: 'var(--color-dark)',
    fontFamily: "'Roboto', sans-serif"
  };

  const panelStyle = {
    backgroundColor: 'var(--white)',
    borderRadius: '12px',
    padding: '32px',
    border: '1px solid var(--light-gray)',
    boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
  };

  const sectionTitleStyle = {
    margin: '0 0 24px 0',
    fontSize: '18px',
    fontWeight: '800',
    color: 'var(--color-dark)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    paddingBottom: '16px',
    borderBottom: '1px solid var(--light-gray)'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 'bold',
    color: 'var(--text-light)',
    marginBottom: '8px'
  };

  return (
    <div style={containerStyle}>
      
      {/* Botón Volver */}
      <Button 
        variant="outline-dark" 
        size="sm" 
        onClick={onBack} 
        style={{ marginBottom: '24px' }}
      >
        <ChevronLeft size={16} style={{ marginRight: '6px' }} /> Volver al Panel
      </Button>

      {/* Título Principal */}
      <h2 style={{ 
        margin: '0 0 32px 0', 
        fontSize: '28px', 
        fontWeight: '900', 
        color: 'var(--color-dark)',
        paddingBottom: '20px',
        borderBottom: '2px solid var(--light-gray)'
      }}>
        Configuración: Transporte de Carga
      </h2>
      
      {/* Contenedor de 2 Columnas */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px' }}>
        
        {/* PANEL IZQUIERDO: MAPA Y COORDENADAS */}
        <div style={{ ...panelStyle, flex: 1, minWidth: '400px' }}>
          <h3 style={{ ...sectionTitleStyle, color: 'var(--color-primary)' }}>
            <MapPin size={20} /> 1. Puntos de Origen y Destino
          </h3>
          
          {/* Simulación del Mapa */}
          <div style={{ 
            height: '300px', 
            width: '100%', 
            backgroundColor: 'var(--bg-color)', 
            marginBottom: '24px', 
            borderRadius: '8px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '2px dashed var(--light-gray)',
            color: 'var(--text-light)',
            fontWeight: 'bold',
            fontSize: '16px'
          }}>
            [ Mapa Interactivo - Seleccionar Ruta ]
          </div>

          {/* Inputs de Coordenadas */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Punto A (Recolección)</label>
              <Input placeholder="Coordenadas o ubicación..." />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Punto B (Descarga)</label>
              <Input placeholder="Coordenadas o ubicación..." />
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: ESPECIFICACIONES Y ACCIÓN */}
        <div style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={panelStyle}>
            <h3 style={{ ...sectionTitleStyle, color: 'var(--color-primary)' }}>
              <Package size={20} /> 2. Especificación de Carga
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Peso Estimado (KG)</label>
              <Input type="number" placeholder="Ej: 30" />
            </div>
            
            <div>
              <label style={labelStyle}>Cantidad de Cajas / Bultos</label>
              <Input type="number" placeholder="Ej: 5" />
            </div>
          </div>

          <Button 
            variant="primary" 
            onClick={onNext} 
            style={{ width: '100%', padding: '16px', fontSize: '18px' }}
          >
            Revisar Cotización
          </Button>

        </div>

      </div>
    </div>
  );
}