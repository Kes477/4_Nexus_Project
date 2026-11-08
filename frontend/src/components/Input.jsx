import React from 'react';

const Input = ({ 
    type = 'text', 
    placeholder, 
    icon,
    error,
    disabled = false, 
    className = '', 
    ...props 
}) => {
    const inputClasses = `input-field ${error ? 'error' : ''} ${disabled ? 'disabled' : ''}`;

    if (icon) {
        return (
            <div className={`input-icon-wrapper ${className}`}>
                <i className={`fas ${icon}`}></i>
                <input 
                    type={type} 
                    className={inputClasses} 
                    placeholder={placeholder} 
                    disabled={disabled}
                    {...props}
                />
                {error && <span style={{ color: 'var(--color-danger)', fontSize: '12px', marginTop: '5px', display: 'block' }}>{error}</span>}
            </div>
        );
    }

    return (
        <div className={className} style={{ width: '100%' }}>
            <input 
                type={type} 
                className={inputClasses} 
                placeholder={placeholder} 
                disabled={disabled}
                {...props}
            />
            {error && <span style={{ color: 'var(--color-danger)', fontSize: '12px', marginTop: '5px', display: 'block' }}>{error}</span>}
        </div>
    );
};

export default Input;