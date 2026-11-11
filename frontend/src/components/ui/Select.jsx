const Select = ({ options = [], variant = 'primary', value, onChange, ...props }) => {
    const isDark = variant === 'dark';
    
    return (
        <select 
            className="dropdown"
            value={value}
            onChange={onChange}
            style={{
                appearance: 'none',
                background: `url('data:image/svg+xml;utf8,<svg fill="white" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>') no-repeat right 12px center`,
                backgroundColor: isDark ? 'var(--color-dark)' : 'var(--color-primary)', 
                color: 'white', 
                fontWeight: '500',
                padding: '12px 15px', 
                borderRadius: '6px', 
                border: 'none', 
                cursor: 'pointer', 
                width: '100%', 
                maxWidth: '300px', 
                fontSize: '16px'
            }}
            {...props}
        >
            {options.map((opt, index) => (
                <option key={index} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    );
};

export default Select;