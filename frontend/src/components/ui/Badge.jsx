const Badge = ({ text, color = 'primary' }) => {
    const colors = {
        primary: 'var(--color-primary)', success: 'var(--color-success)',
        danger: 'var(--color-danger)', info: 'var(--color-info)',
        warning: 'var(--color-warning)', dark: 'var(--color-dark)'
    };

    return (
        <span style={{
            backgroundColor: colors[color],
            color: color === 'warning' || color === 'info' ? 'var(--color-dark)' : 'var(--white)',
            padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold'
        }}>
            {text}
        </span>
    );
};

export default Badge;