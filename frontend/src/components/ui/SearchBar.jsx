const SearchBar = ({ placeholder = "Buscar...", value, onChange, onSearch, withButton = false }) => {
    return (
        <div className={`search-bar ${withButton ? 'with-btn' : ''}`} style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
            {!withButton && (
                <i className="fas fa-search" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
            )}
            <input 
                type="text" 
                placeholder={placeholder} 
                value={value}
                onChange={onChange}
                style={{
                    width: '100%', 
                    padding: withButton ? '12px 15px' : '12px 15px 12px 40px',
                    border: '1px solid var(--light-gray)', 
                    borderRadius: withButton ? '6px 0 0 6px' : '6px',
                    borderRight: withButton ? 'none' : '1px solid var(--light-gray)',
                    outline: 'none', 
                    fontSize: '16px', 
                    color: 'var(--color-dark)'
                }}
            />
            {withButton && (
                <button 
                    onClick={onSearch}
                    style={{
                        background: 'var(--color-primary)', color: 'white', border: 'none',
                        padding: '0 20px', borderRadius: '0 6px 6px 0', cursor: 'pointer'
                    }}
                >
                    <i className="fas fa-search"></i>
                </button>
            )}
        </div>
    );
};

export default SearchBar;