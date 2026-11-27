import React from 'react';

const CircularProgress = ({ 
    percent = 50, 
    color = 'var(--color-primary)', 
    size = 90,
    thickness = 8,
    children, 
    style, 
    ...props 
}) => {
    return (
        <div 
            style={{ 
                position: 'relative', 
                width: `${size}px`, 
                height: `${size}px`, 
                ...style 
            }} 
            {...props}
        >
            {/* La rueda de progreso con el mask para que sea un anillo */}
            <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: `conic-gradient(${color} ${percent}%, var(--light-gray) 0)`,
                WebkitMask: `radial-gradient(farthest-side, transparent calc(100% - ${thickness}px), #fff 0)`,
                mask: `radial-gradient(farthest-side, transparent calc(100% - ${thickness}px), #fff 0)`
            }} />
            
            {/* El contenido central (porcentaje por defecto, o la carita si se pasa como children) */}
            <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center'
            }}>
                {children ? children : (
                    <span style={{ fontWeight: 'bold', color: 'var(--color-dark)', fontSize: '18px' }}>
                        {Math.round(percent)}%
                    </span>
                )}
            </div>
        </div>
    );
};

export default CircularProgress;