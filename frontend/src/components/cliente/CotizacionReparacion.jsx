import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Receipt, Send } from 'lucide-react';

import { Button } from '../ui';
import { cotizarOrden } from '../../api/reparacionesService';
import { primerError } from '../../utils/errores';

const formatoLempiras = (valor) =>
    `L ${Number(valor).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ESTADO_PAGO = {
    PENDIENTE: { texto: 'Pendiente de pago', color: 'var(--color-warning, #d4a017)' },
    PAGADO: { texto: 'Pagada', color: 'var(--color-primary)' },
};

const estilos = {
    contenedor: {
        marginTop: '24px',
        padding: '20px 24px',
        border: '1px solid var(--light-gray, #ddd)',
        borderRadius: '12px',
        background: 'var(--white)',
    },
    titulo: { display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, color: 'var(--color-dark)' },
    fila: { display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-light)', margin: '4px 0' },
    campo: {
        flex: '1 1 160px', padding: '10px 12px', borderRadius: '8px',
        border: '1px solid var(--light-gray, #ddd)', background: 'var(--white)', color: 'var(--color-dark)',
    },
};

/* =========================================================
   COTIZACIÓN DE LA REPARACIÓN

   modo="tecnico": puede cotizar si la orden está en diagnóstico.
   modo="cliente": ve el total y va a "Mis pedidos" a pagarlo.
   ========================================================= */
export default function CotizacionReparacion({ orden, modo, onActualizada }) {
    const navigate = useNavigate();
    const [costo, setCosto] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState(null);

    // Una cotización cancelada (el cliente la rechazó) ya no cuenta
    const vigente = orden.pedido && orden.pedido_estado !== 'CANCELADO';
    const puedeCotizar = modo === 'tecnico' && orden.estado === 'EN_DIAGNOSTICO' && !vigente;

    if (!vigente && !puedeCotizar) {
        return null;   // nada que mostrar
    }

    const enviar = async (evento) => {
        evento.preventDefault();
        setError(null);
        setEnviando(true);
        try {
            onActualizada?.(await cotizarOrden(orden.id, costo));
            setCosto('');
        } catch (err) {
            setError(primerError(err));
        } finally {
            setEnviando(false);
        }
    };

    // ---------- Formulario del técnico ----------
    if (puedeCotizar) {
        return (
            <section style={estilos.contenedor}>
                <h3 style={estilos.titulo}><Receipt size={22} /> Cotizar reparación</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-light)' }}>
                    Indica el costo del trabajo (sin ISV). El cliente recibirá un pedido para pagarlo
                    {orden.pedido_estado === 'CANCELADO' && '; rechazó la cotización anterior'}.
                </p>

                {error && <p role="alert" style={{ color: '#ef4444' }}>{error}</p>}

                <form onSubmit={enviar} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="Costo en lempiras"
                        value={costo}
                        onChange={(e) => setCosto(e.target.value)}
                        disabled={enviando}
                        required
                        style={estilos.campo}
                    />
                    <Button type="submit" variant="primary" disabled={enviando || !costo}>
                        <Send size={16} /> {enviando ? 'Enviando...' : 'Enviar cotización'}
                    </Button>
                </form>
            </section>
        );
    }

    // ---------- Resumen (técnico y cliente) ----------
    const pago = ESTADO_PAGO[orden.pedido_estado] ?? { texto: orden.pedido_estado, color: 'var(--text-light)' };

    return (
        <section style={estilos.contenedor}>
            <h3 style={estilos.titulo}><Receipt size={22} /> Cotización</h3>

            <div style={estilos.fila}><span>Costo de la reparación</span><span>{formatoLempiras(orden.costo)}</span></div>
            <div style={{ ...estilos.fila, fontWeight: 'bold', color: 'var(--color-dark)' }}>
                <span>Total con ISV</span><span>{formatoLempiras(orden.total_a_pagar)}</span>
            </div>
            <div style={estilos.fila}>
                <span>Pago</span>
                <strong style={{ color: pago.color }}>{pago.texto}</strong>
            </div>

            {modo === 'tecnico' && orden.pedido_estado === 'PENDIENTE' && (
                <p style={{ fontSize: '13px', color: 'var(--text-light)', marginBottom: 0 }}>
                    La orden no se podrá entregar hasta que el cliente pague.
                </p>
            )}

            {modo === 'cliente' && orden.pedido_estado === 'PENDIENTE' && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <Button
                        variant="primary"
                        onClick={() => navigate('/cliente/pedidos', { state: { abrirPedido: orden.pedido } })}
                    >
                        <CreditCard size={16} /> Pagar reparación
                    </Button>
                    <small style={{ color: 'var(--text-light)' }}>
                        Pedido #{orden.pedido}. Si no estás de acuerdo con el precio, puedes cancelarlo desde Mis pedidos.
                    </small>
                </div>
            )}
        </section>
    );
}
