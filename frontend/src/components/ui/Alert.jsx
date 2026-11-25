const Alert = ({
    type = 'success',
    title,
    message,
    onClose
}) => {
    return (
        <div className={`alert alert-${type}`}>
            <div>
                <h4>{title}</h4>
                <p>{message}</p>
            </div>
            {onClose && (
                <button className="close-btn" onClick={onClose} aria-label="Cerrar">
                    <i className="fas fa-times"></i>
                </button>
            )}
            </div>
    );
};

export default Alert;