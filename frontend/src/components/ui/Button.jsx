export const Button = ({
    children,
    variant = 'primary',
    size = 'normal',
    className = '',
    ...props
}) => {
    const sizeClass = size === 'sm' ? 'btn-sm' : '';
    
    return (
        <button className={`btn btn-${variant} ${sizeClass} ${className}`.trim()} {...props}>
            {children}
        </button>
    );
};
