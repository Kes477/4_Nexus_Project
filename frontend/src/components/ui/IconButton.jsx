const IconButton = ({ 
    icon, 
    iconType = 'fas', 
    variant = 'primary', 
    round = false, 
    onClick, 
    className = '',
    customColor
}) => {
    let bgColor = 'var(--color-primary)';
    let textColor = 'var(--white)';
    let border = 'none';

    if (customColor) {
        bgColor = customColor;
        textColor = 'var(--white)';
        border = 'none';
    } else if (variant === 'outline') {
        bgColor = 'transparent';
        textColor = 'var(--color-primary)';
        border = '2px solid var(--color-primary)';
    } else if (variant === 'dark') {
        bgColor = 'var(--color-dark)';
    } else if (variant === 'social') {
        bgColor = 'var(--white)';
        textColor = 'var(--text-light)';
        border = '1px solid var(--light-gray)';
    }

    return (
        <button 
            onClick={onClick}
            className={className}
            style={{
                width: '40px', 
                height: '40px', 
                borderRadius: round ? '50%' : '6px',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: bgColor, 
                color: textColor, 
                border: border,
                cursor: 'pointer', 
                fontSize: '16px', 
                transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
                if (customColor) {
                    e.currentTarget.style.filter = 'brightness(0.85)';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                } else if (variant === 'social') {
                    e.currentTarget.style.background = 'var(--color-primary)';
                    e.currentTarget.style.color = 'var(--white)';
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                }
            }}
            onMouseLeave={(e) => {
                if (customColor) {
                    e.currentTarget.style.filter = 'brightness(1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                } else if (variant === 'social') {
                    e.currentTarget.style.background = 'var(--white)';
                    e.currentTarget.style.color = 'var(--text-light)';
                    e.currentTarget.style.borderColor = 'var(--light-gray)';
                    e.currentTarget.style.transform = 'translateY(0)';
                }
            }}
        >
            <i className={`${iconType} ${icon}`}></i>
        </button>
    );
};

export default IconButton;