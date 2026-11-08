import React from 'react';

const ProgressBar = ({ current, max, markerPosition }) => {
    const percentage = Math.min((current / max) * 100, 100); // Evita pasar del 100%
    
    return (
        <div className="progress-container">
            <div className="progress-labels">
                <span>{current}</span>
                <span>{max}</span>
            </div>
            <div className="progress-track">
                <div className="progress-fill" style={{ width: `${percentage}%` }}></div>
                {markerPosition && (
                    <div className="progress-markers" style={{ left: `${markerPosition}%` }}></div>
                )}
            </div>
        </div>
    );
};

export default ProgressBar;