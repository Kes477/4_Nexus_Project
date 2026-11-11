const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(44, 54, 94, 0.7)', // Usando --color-dark con opacidad
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div style={{
                background: 'var(--white)', borderRadius: '8px', padding: '30px',
                width: '90%', maxWidth: '500px', position: 'relative',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}>
                <button 
                    onClick={onClose} 
                    style={{
                        position: 'absolute', top: '15px', right: '15px',
                        background: 'none', border: 'none', fontSize: '20px',
                        color: 'var(--text-light)', cursor: 'pointer', transition: 'color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
                    onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-light)'}
                >
                    <i className="fas fa-times"></i>
                </button>
                {title && <h2 style={{ color: 'var(--color-dark)', marginBottom: '20px', fontSize: '24px' }}>{title}</h2>}
                <div>{children}</div>
            </div>
        </div>
    );
};

export default Modal;