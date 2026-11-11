const Stars = ({ rating = 5, max = 5 }) => {
    return (
        <div style={{ color: 'var(--color-warning)', display: 'flex', gap: '5px', fontSize: '20px' }}>
            {[...Array(max)].map((_, i) => (
                <i key={i} className={`fas fa-star ${i >= rating ? 'empty' : ''}`} style={{ color: i >= rating ? '#cbd5e1' : 'var(--color-warning)' }}></i>
            ))}
        </div>
    );
};

export default Stars;