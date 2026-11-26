import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';

import { Alert, Button, SectionHeading } from '../../components/ui';
import { useCarrito } from '../../hooks/useCarrito';
import { primerError } from '../../utils/errores';

const formatoLempiras = (valor) =>
  `L ${Number(valor).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ETIQUETA_TIPO = {
  ARTICULO: 'Artículo',
  SERVICIO: 'Servicio',
  SUSCRIPCION: 'Suscripción',
};

const tarjetaStyle = {
  background: 'var(--white)',
  border: '1px solid var(--light-gray)',
  borderRadius: '10px',
  padding: '20px',
};

const botonCantidadStyle = {
  width: '32px', height: '32px', borderRadius: '6px', border: '1px solid var(--light-gray)',
  background: 'var(--bg-color)', color: 'var(--color-dark)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

export default function ClienteCarrito() {
  const { carrito, cambiarCantidad, quitar, vaciar } = useCarrito();
  const [error, setError] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  // Envuelve cada operación: bloquea botones y muestra el error del backend
  const ejecutar = async (operacion) => {
    setError(null);
    setOcupado(true);
    try {
      await operacion();
    } catch (err) {
      setError(primerError(err));
    } finally {
      setOcupado(false);
    }
  };

  const vaciarConConfirmacion = () => {
    if (window.confirm('¿Vaciar todo el carrito?')) {
      ejecutar(vaciar);
    }
  };

  if (!carrito) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>
        Cargando carrito...
      </div>
    );
  }

  const vacio = carrito.detalles.length === 0;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '30px 20px' }}>
      <SectionHeading eyebrow="Compras" title="Mi Carrito" />

      {error && (
        <div style={{ marginBottom: '16px' }}>
          <Alert type="danger" title="Atención" message={error} onClose={() => setError(null)} />
        </div>
      )}

      {vacio ? (
        <div style={{ ...tarjetaStyle, textAlign: 'center', padding: '50px 20px' }}>
          <ShoppingCart size={48} color="var(--light-gray)" />
          <p style={{ color: 'var(--text-light)', margin: '16px 0' }}>Tu carrito está vacío.</p>
          <Link to="/catalog"><Button variant="primary">Ver catálogo</Button></Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', alignItems: 'start' }}>

          {/* Líneas del carrito */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', gridColumn: 'span 2' }}>
            {carrito.detalles.map((linea) => {
              const esArticulo = linea.tipo_producto === 'ARTICULO';
              return (
                <div key={linea.id} style={{ ...tarjetaStyle, display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <strong style={{ color: 'var(--color-dark)' }}>{linea.producto}</strong>
                    <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                      {linea.sku} · {ETIQUETA_TIPO[linea.tipo_producto] ?? linea.tipo_producto}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '4px' }}>
                      {formatoLempiras(linea.precio_unitario)} c/u
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      style={botonCantidadStyle}
                      disabled={ocupado || !esArticulo || linea.cantidad <= 1}
                      onClick={() => ejecutar(() => cambiarCantidad(linea.id, linea.cantidad - 1))}
                      title="Quitar uno"
                    >
                      <Minus size={14} />
                    </button>
                    <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 'bold' }}>{linea.cantidad}</span>
                    <button
                      type="button"
                      style={botonCantidadStyle}
                      disabled={ocupado || !esArticulo}
                      onClick={() => ejecutar(() => cambiarCantidad(linea.id, linea.cantidad + 1))}
                      title="Agregar uno"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <strong style={{ minWidth: '110px', textAlign: 'right', color: 'var(--color-dark)' }}>
                    {formatoLempiras(linea.subtotal)}
                  </strong>

                  <button
                    type="button"
                    onClick={() => ejecutar(() => quitar(linea.id))}
                    disabled={ocupado}
                    title="Quitar del carrito"
                    style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}

            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <Link to="/catalog"><Button variant="outline-dark" size="sm">Seguir comprando</Button></Link>
              <Button variant="danger" size="sm" onClick={vaciarConConfirmacion} disabled={ocupado}>
                Vaciar carrito
              </Button>
            </div>
          </div>

          {/* Resumen */}
          <div style={{ ...tarjetaStyle, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ margin: 0, color: 'var(--color-dark)' }}>Resumen</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-light)' }}>
              <span>Artículos</span>
              <span>{carrito.cantidad_articulos}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px' }}>
              <strong>Subtotal</strong>
              <strong style={{ color: 'var(--color-primary)' }}>{formatoLempiras(carrito.subtotal)}</strong>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-light)', margin: 0 }}>
              El impuesto (ISV) y el envío se calculan al confirmar el pedido.
            </p>
            <Button variant="primary" disabled title="Disponible en la siguiente fase">
              Continuar con la compra
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}