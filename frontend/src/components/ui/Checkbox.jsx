const Checkbox = ({ type = 'checkbox', checked, onChange, label }) => {
    const isCheckbox = type === 'checkbox';
    
    return (
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <div 
                onClick={onChange}
                style={{
                    width: '24px', height: '24px', 
                    border: '2px solid var(--color-primary)', 
                    borderRadius: isCheckbox ? '6px' : '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    cursor: 'pointer',
                    background: checked && isCheckbox ? 'var(--color-primary)' : 'transparent',
                    color: 'white',
                    transition: 'all 0.2s'
                }}
            >
                {checked && isCheckbox && <i className="fas fa-check" style={{ fontSize: '14px' }}></i>}
                {checked && !isCheckbox && <div style={{ width: '12px', height: '12px', background: 'var(--color-primary)', borderRadius: '50%' }}></div>}
            </div>
            {label && <span style={{ color: 'var(--color-dark)', fontSize: '16px' }}>{label}</span>}
        </label>
    );
};

export default Checkbox;