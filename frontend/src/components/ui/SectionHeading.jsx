const SectionHeading = ({ eyebrow, title, description, light = false }) => {
  return (
    <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '15px', 
        marginBottom: '30px' 
    }}>
      {/* Eyebrow: Línea pequeña + Texto superior */}
      {eyebrow && (
        <span style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            color: 'var(--color-primary)', 
            fontSize: '12px', 
            fontWeight: '700', 
            letterSpacing: '1.5px',
            textTransform: 'uppercase'
        }}>
            <span style={{ 
                display: 'inline-block', 
                width: '30px', 
                height: '2px', 
                background: 'var(--color-primary)' 
            }} />
            {eyebrow}
        </span>
      )}

      {/* Título Principal */}
      <h2 style={{ 
          color: light ? 'var(--white)' : 'var(--color-dark)', 
          fontSize: '32px',
          fontWeight: '700', 
          margin: 0,
          lineHeight: '1.2'
      }}>
          {title}
      </h2>

      {/* Descripción opcional */}
      {description && (
        <p style={{ 
            color: light ? 'var(--light-gray)' : 'var(--text-light)', 
            fontSize: '16px',
            lineHeight: '1.6', 
            margin: 0,
            maxWidth: '600px'
        }}>
            {description}
        </p>
      )}
    </div>
  );
};

export default SectionHeading;