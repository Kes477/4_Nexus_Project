import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronUp, Package } from 'lucide-react';

import { Alert, Badge, Button, SectionHeading } from '../../components/ui';
import { cancelarPedido, obtenerPedidos } from '../../api/pedidoService';
import { primerError } from '../../utils/errores';

const formatoLempiras = (valor) =>
  `L ${Number(valor).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const COLOR_ESTADO = {
  PENDIENTE: 'warning',
  PAGADO: 'info',
  EN_PROCESO: 'info',
  ENVIADO: 'primary',
  ENTREGADO: 'success',
  CANCELADO: 'danger',
};

const tarjetaStyle = {
  background: 'var(--white)',
  border: '1px solid var(--light-gray)',
  borderRadius: '10px',
  padding: '20px',
};

export default function ClientePedidos() {
  const location = useLocation();
  const nuevoPedido = location.state?.nuevoPedido ?? null;

  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [abierto, setAbierto] = useState(nuevoPedido);
  const [ocupado, setOcupado] = useState(null);

  useEffect(() => {
    let activo = true;

    obtenerPedidos()
      .then((lista) => activo && setPedidos(lista))
      .catch((err) => activo && setError(primerError(err)))
      .finally(() => activo && setCargando(false));

    return () => { activo = false; };
  }, []);

  const cancelar = async (pedido) => {
    if (!window.confirm(`¿Cancelar el pedido #${pedido.id}?`)) return;
    setError(null);
    setOcupado(pedido.id);
    try {
      const actualizado = await cancelarPedido(pedido.id);
      setPedidos((lista) => lista.map((p) => (p.id === actualizado.id ? actualizado : p)));
    } catch (err) {
      setError(primerError(err));
    } finally {
      setOcupado(null);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '30px 20px' }}>
      <SectionHeading eyebrow="Compras" title="Mis Pedidos" />

      {nuevoPedido && (
        <div style={{ marginBottom: '16px' }}>
          <Alert type="success" title="¡Pedido confirmado!" message={`Tu pedido #${nuevoPedido} está pendiente de pago.`} />
        </div>
      )}

      {error && (
        <div style={{ marginBottom: '16px' }}>
          <Alert type="danger" title="Atención" message={error} onClose={() => setError(null)} />
        </div>
      )}

      {cargando && <p style={{ color: 'var(--text-light)' }}>Cargando pedidos...</p>}

      {!cargando && pedidos.length === 0 && (
        <div style={{ ...tarjetaStyle, textAlign: 'center', padding: '50px 20px' }}>
          <Package size={48} color="var(--light-gray)" />
          <p style={{ color: 'var(--text-light)', margin: '16px 0' }}>Todavía no has hecho pedidos.</p>
          <Link to="/catalog"><Button variant="primary">Ver catálogo</Button></Link>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {pedidos.map((pedido) => {
          const estaAbierto = abierto === pedido.id;
          return (
            <div
              key={pedido.id}
              style={{ ...tarjetaStyle, borderColor: pedido.id === nuevoPedido ? 'var(--color-primary)' : 'var(--light-gray)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <strong style={{ color: 'var(--color-dark)' }}>Pedido #{pedido.id}</strong>
                  <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>
                    {new Date(pedido.fecha_pedido).toLocaleString('es-HN')}
                  </div>
                </div>
                <Badge text={pedido.estado_texto} color={COLOR_ESTADO[pedido.estado_pedido] ?? 'dark'} />
                <strong style={{ fontSize: '18px', color: 'var(--color-dark)' }}>{formatoLempiras(pedido.total_final)}</strong>
                <button
                  type="button"
                  onClick={() => setAbierto(estaAbierto ? null : pedido.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {estaAbierto ? <ChevronUp size={18} /> : <ChevronDown size={18} />} Detalle
                </button>
              </div>

              {estaAbierto && (
                <div style={{ marginTop: '16px', borderTop: '1px solid var(--light-gray)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {pedido.detalles.map((linea) => (
                    <div key={linea.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-light)' }}>
                      <span>{linea.cantidad} × {linea.producto} ({linea.sku}) a {formatoLempiras(linea.precio_unitario)}</span>
                      <span>{formatoLempiras(linea.subtotal_linea)}</span>
                    </div>
                  ))}

                  <div style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '8px' }}>
                    {pedido.direccion_texto && <div>Envío a: {pedido.direccion_texto}</div>}
                    {pedido.cupon && <div>Cupón: {pedido.cupon} (− {formatoLempiras(pedido.total_descuento)})</div>}
                    <div>
                      Subtotal {formatoLempiras(pedido.subtotal)} · Envío {formatoLempiras(pedido.costo_envio)} · ISV {formatoLempiras(pedido.total_impuestos)}
                    </div>
                  </div>

                  {pedido.puede_cancelar && (
                    <div style={{ marginTop: '8px' }}>
                      <Button variant="danger" size="sm" onClick={() => cancelar(pedido)} disabled={ocupado === pedido.id}>
                        {ocupado === pedido.id ? 'Cancelando...' : 'Cancelar pedido'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}