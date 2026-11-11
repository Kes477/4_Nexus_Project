const Avatar = ({ size = 'sm', icon = 'fa-user', imageUrl }) => {
    const isLg = size === 'lg';
    
    const style = {
        width: isLg ? '70px' : '48px', 
        height: isLg ? '70px' : '48px', 
        borderRadius: '50%', 
        background: isLg ? 'var(--color-dark)' : 'var(--color-primary)',
        color: 'var(--white)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        fontSize: isLg ? '28px' : '20px',
        overflow: 'hidden'
    };

    return (
        <div style={style}>
            {imageUrl ? (
                <img src={imageUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
                <i className={`fas ${icon}`}></i>
            )}
        </div>
    );
};

export default Avatar;