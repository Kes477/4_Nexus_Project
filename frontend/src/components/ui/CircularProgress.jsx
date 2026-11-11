const CircularProgress = ({ percent = 50 }) => {
    return (
        <div style={{
            width: '90px', height: '90px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
            background: `conic-gradient(var(--color-primary) ${percent}%, var(--light-gray) 0)`,
            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 8px), #fff 0)',
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 8px), #fff 0)'
        }}>
            <span style={{ fontWeight: 'bold', color: 'var(--color-dark)', fontSize: '18px' }}>
                {percent}%
            </span>
        </div>
    );
};

export default CircularProgress;