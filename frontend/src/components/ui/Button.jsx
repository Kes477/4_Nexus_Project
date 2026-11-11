const Button = ({
    children,
    variant = 'primary',
    size = 'normal',
    className = '',
    ...props
}) => {
    const sizeClass = size === 'sm' ? 'btn-sm': '';
    return (
        <button classNme={`btn btn-${variant} ${sizeClass} ${className}`} {...props}>
            {children}
        </button>
    );
};

export default Button;
