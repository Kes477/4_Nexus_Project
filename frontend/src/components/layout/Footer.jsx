const Footer = () => {
    return (
        <footer style={{ 
            padding: '40px 20px', background: 'var(--color-dark)', color: 'var(--white)',
            textAlign: 'center', marginTop: 'auto'
        }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px', fontSize: '20px' }}>
                <a href="#" style={{ color: 'var(--color-primary)' }}><i className="fab fa-facebook"></i></a>
                <a href="#" style={{ color: 'var(--color-primary)' }}><i className="fab fa-twitter"></i></a>
                <a href="#" style={{ color: 'var(--color-primary)' }}><i className="fab fa-instagram"></i></a>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-light)', margin: 0 }}>
                &copy; {new Date().getFullYear()} Nexus Project. Todos los derechos reservados.
            </p>
        </footer>
    );
};

export default Footer;