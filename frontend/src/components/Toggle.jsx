import React from 'react';

const Toggle = ({ checked, onChange, disabled }) => {
    return (
        <label className="toggle">
            <input 
                type="checkbox" 
                checked={checked} 
                onChange={onChange} 
                disabled={disabled} 
            />
            <span className="slider"></span>
        </label>
    );
};

export default Toggle;