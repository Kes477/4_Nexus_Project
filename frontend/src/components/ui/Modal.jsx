import { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = '500px'
}) => {

    useEffect(() => {
        if (!isOpen) return;

        const manejarTeclado = (evento) => {
            if (evento.key === 'Escape') {
                onClose?.();
            }
        };

        document.addEventListener('keydown', manejarTeclado);

        return () => {
            document.removeEventListener(
                'keydown',
                manejarTeclado
            );
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(44, 54, 94, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '16px',
            boxSizing: 'border-box',
            zIndex: 1100
        }}>

            <div
                role="dialog"
                aria-modal="true"
                aria-label={title || 'Ventana modal'}
                style={{
                    background: 'var(--white)',
                    borderRadius: '8px',
                    width: '100%',
                    maxWidth,
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                }}
            >

                <header style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    padding: '24px 30px 16px',
                    flexShrink: 0
                }}>

                    <h2 style={{
                        color: 'var(--color-dark)',
                        margin: 0,
                        fontSize: '24px'
                    }}>
                        {title}
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar ventana"
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-light)',
                            cursor: 'pointer',
                            display: 'flex',
                            padding: '4px'
                        }}
                    >
                        <X size={22} />
                    </button>

                </header>

                <div style={{
                    padding: '8px 30px 30px',
                    overflowY: 'auto',
                    minHeight: 0,
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'var(--text-light) transparent'
                }}>
                    {children}
                </div>

            </div>

        </div>
    );
};

export default Modal;
