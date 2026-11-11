import React from 'react';

const Stepper = ({ steps, currentStep }) => {
    // steps es un array de strings o números. Ej: ['Paso 1', 'Paso 2', 'Paso 3']
    return (
        <div className="stepper">
            {steps.map((step, index) => {
                const isActive = index < currentStep;
                const isCurrent = index === currentStep;
                const isLast = index === steps.length - 1;
                
                return (
                    <React.Fragment key={index}>
                        <div className="step">
                            <div className={`step-circle ${isActive || isCurrent ? 'active' : 'inactive'}`}>
                                {isActive ? <i className="fas fa-check"></i> : index + 1}
                            </div>
                            <div className="step-text">{step}</div>
                        </div>
                        {!isLast && <div className={`step-line ${isActive ? '' : 'inactive'}`}></div>}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default Stepper;