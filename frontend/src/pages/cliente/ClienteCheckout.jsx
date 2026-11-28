import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Tag, X } from 'lucide-react';

import { Alert, Button, SectionHeading } from '../../components/ui';
import { obtenerDirecciones } from '../../api/direccionService';
import { confirmarPedido, resumenPedido } from '../../api/pedidoService';
import { useCarrito } from '../../hooks/useCarrito';
import { primerError } from '../../utils/errores';

const formatoLempiras = (valor) =>
  `L ${Number(valor).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const tarjetaStyle = {
  background: 'var(--white)',
  border: '1px solid var(--light-gray)',
  borderRadius: '10px',
  padding: '20px',
};

const filaStyle = { display: 'flex', justifyContent: 'space-between', color: 'var(--text-light)' };

export default function ClienteCheckout() {
  const navigate = useNavigate();
  const { carrito, recargar } = useCarrito();

  const [direcciones, setDirecciones] = useState([]);
  const [direccionId, setDireccionId] = useState('');
  const [resumen, setResumen] = useState(null);
  const [cupon, setCupon] = useState('');
  const [cuponAplicado, setCuponAplicado] = useState('');
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [confirmando, setConfirmando] = useState(false);

  // Carga inicial: direcciones del cliente y totales sin cupón
  useEffect(() => {
    let activo = true;

    Promise.all([obtenerDirecciones(), resumenPedido()])
      .then(([lista, datos]) => {
        if (!activo) return;
        setDirecciones(lista);
        const principal = lista.find((d) => d.es_principal) ?? lista[0];
        setDireccionId(principal ? String(principal.id) : '');
        setResumen(datos);
      })
      .catch((err) => activo && setError(primerError(err)))
      .finally(() => activo && setCargando(false));

    return () => { activo = false; };
  }, []);

  const aplicarCupon = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const datos = await resumenPedido({ cupon });
      setResumen(datos);
      setCuponAplicado(datos.cupon ?? '');
    } catch (err) {
      setError(primerError(err));
    }
  };

  const quitarCupon = async () => {
    setError(null);
    setCupon('');
    setCuponAplicado('');
    try {
      setResumen(await resumenPedido());
    } catch (err) {
      setError(primerError(err));
    }
  };

  const confirmar = async () => {
    setError(null);
    setConfirmando(true);
    try {
      const pedido = await confirmarPedido({
        direccion: direccionId ? Number(direccionId) : null,
        cupon: cuponAplicado,
      });
      await recargar();
      navigate('/cliente/pedidos', { state: { nuevoPedido: pedido.id } });
    } catch (err) {
      setError(primerError(err));
    } finally {
      setConfirmando(false);
    }
  };

  if (cargando) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>Preparando tu pedido...</div>;
  }

  if (!resumen) {
    return (
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '30px 20px' }}>
        <SectionHeading eyebrow="Compras" title="Confirmar Compra" />
        {error && <Alert type="danger" title="Atención" message={error} />}
        <div style={{ marginTop: '16px' }}>
          <Link to="/catalog"><Button variant="primary">Ver catálogo</Button></Link>
        </div>
      </div>
    );
  }

  const faltaDireccion = resumen.requiere_direccion && !direccionId;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '30px 20px' }}>
      <SectionHeading eyebrow="Compras" title="Confirmar Compra" />

      {error && (
        <div style={{ marginBottom: '16px' }}>
          <Alert type="danger" title="Atención" message={error} onClose={() => setError(null)} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', alignItems: 'start' }}>

        {/* Columna izquierda: dirección y productos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', gridColumn: 'span 2' }}>

          {resumen.requiere_direccion && (
            <div style={tarjetaStyle}>
              <h3 style={{ marginTop: 0, color: 'var(--color-dark)' }}>Dirección de envío</h3>

              {direcciones.length === 0 ? (
                <p style={{ color: 'var(--text-light)' }}>
                  No tienes direcciones registradas.{' '}
                  <Link to="/cliente/perfil" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>
                    Agrega una en tu perfil
                  </Link>{' '}
                  para recibir tu pedido.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {direcciones.map((d) => (
                    <label
                      key={d.id}
                      style={{
                        display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer',
                        padding: '12px', borderRadius: '8px',
                        border: `1px solid ${String(d.id) === direccionId ? 'var(--color-primary)' : 'var(--light-gray)'}`,
                      }}
                    >
                      <input
                        type="radio"
                        name="direccion"
                        value={d.id}
                        checked={String(d.id) === direccionId}
                        onChange={(e) => setDireccionId(e.target.value)}
                        style={{ marginTop: '4px' }}
                      />
                      <span>
                        <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-dark)' }}>
                          <MapPin size={14} color="var(--color-primary)" /> {d.linea_direccion1}
                        </strong>
                        <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>{d.ubicacion_texto}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={tarjetaStyle}>
            <h3 style={{ marginTop: 0, color: 'var(--color-dark)' }}>Productos</h3>
            {carrito?.detalles.map((linea) => (
              <div key={linea.id} style={{ ...filaStyle, padding: '8px 0', borderBottom: '1px solid var(--light-gray)' }}>
                <span>{linea.cantidad} × {linea.producto} <small>({linea.sku})</small></span>
                <strong style={{ color: 'var(--color-dark)' }}>{formatoLempiras(linea.subtotal)}</strong>
              </div>
            ))}
            <div style={{ marginTop: '12px' }}>
              <Link to="/cliente/carrito" style={{ fontSize: '13px', color: 'var(--color-primary)' }}>Modificar carrito</Link>
            </div>
          </div>
        </div>

        {/* Columna derecha: cupón y totales */}
        <div style={{ ...tarjetaStyle, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ margin: 0, color: 'var(--color-dark)' }}>Resumen</h3>

          {cuponAplicado ? (
            <div style={{ ...filaStyle, alignItems: 'center', color: 'var(--color-primary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Tag size={14} /> {cuponAplicado}</span>
              <button type="button" onClick={quitarCupon} title="Quitar cupón" style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
          ) : (
            <form onSubmit={aplicarCupon} style={{ display: 'flex', gap: '8px' }}>
              <input
                value={cupon}
                onChange={(e) => setCupon(e.target.value)}
                placeholder="Código de cupón"
                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid var(--light-gray)', background: 'var(--white)', color: 'var(--color-dark)' }}
              />
              <Button variant="outline-dark" size="sm" type="submit" disabled={!cupon.trim()}>Aplicar</Button>
            </form>
          )}

          <div style={filaStyle}><span>Subtotal</span><span>{formatoLempiras(resumen.subtotal)}</span></div>
          {Number(resumen.total_descuento) > 0 && (
            <div style={{ ...filaStyle, color: 'var(--color-primary)' }}>
              <span>Descuento</span><span>− {formatoLempiras(resumen.total_descuento)}</span>
            </div>
          )}
          <div style={filaStyle}><span>Envío</span><span>{formatoLempiras(resumen.costo_envio)}</span></div>
          <div style={filaStyle}><span>ISV (15 %)</span><span>{formatoLempiras(resumen.total_impuestos)}</span></div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', borderTop: '1px solid var(--light-gray)', paddingTop: '12px' }}>
            <strong>Total</strong>
            <strong style={{ color: 'var(--color-primary)' }}>{formatoLempiras(resumen.total_final)}</strong>
          </div>

          <Button variant="primary" onClick={confirmar} disabled={confirmando || faltaDireccion}>
            {confirmando ? 'Confirmando...' : 'Confirmar pedido'}
          </Button>
          {faltaDireccion && (
            <span style={{ fontSize: '12px', color: 'var(--color-danger)' }}>Elige una dirección de envío.</span>
          )}
        </div>
      </div>
    </div>
  );
}