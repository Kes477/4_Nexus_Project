const IconButton = ({ icon, variant = 'primary', round = false, onClick }) => {
    // Variantes: primary, outline, dark
    let bgColor = 'var(--color-primary)';
    let textColor = 'var(--white)';
    let border = 'none';

    if (variant === 'outline') {
        bgColor = 'transparent';
        textColor = 'var(--color-primary)';
        border = '2px solid var(--color-primary)';
    } else if (variant === 'dark') {
        bgColor = 'var(--color-dark)';
    }

    return (
        <button 
            onClick={onClick}
            style={{
                width: '40px', height: '40px', 
                borderRadius: round ? '50%' : '6px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: bgColor, color: textColor, border: border,
                cursor: 'pointer', fontSize: '16px', transition: 'all 0.3s'
            }}
        >
            <i className={`fas ${icon}`}></i>
        </button>
    );
};

export default IconButton;