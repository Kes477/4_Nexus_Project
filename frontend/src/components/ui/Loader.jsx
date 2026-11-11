const Loader = ({ text = "Cargando..." }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
            <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '32px', color: 'var(--color-primary)', marginBottom: '15px' }}></i>
            <span style={{ color: 'var(--text-light)', fontSize: '16px' }}>{text}</span>
        </div>
    );
};

export default Loader;