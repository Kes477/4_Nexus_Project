import { useEffect, useState } from 'react';
import { CreditCard, Plus, Trash2 } from 'lucide-react';

import { Alert, Button, Modal } from '../ui';
import {
  eliminarTarjeta,
  guardarTarjeta,
  obtenerFormasPago,
  obtenerTarjetas,
  pagarPedido,
} from '../../api/pagoService';
import { tokenizarTarjetaSimulada } from '../../utils/tarjeta';
import { primerError } from '../../utils/errores';

const formatoLempiras = (valor) =>
  `L ${Number(valor).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const campoStyle = {
  padding: '10px', borderRadius: '6px', border: '1px solid var(--light-gray)',
  background: 'var(--white)', color: 'var(--color-dark)', width: '100%', boxSizing: 'border-box',
};

const opcionStyle = (activa) => ({
  display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '8px',
  cursor: 'pointer', border: `1px solid ${activa ? 'var(--color-primary)' : 'var(--light-gray)'}`,
});

const TARJETA_VACIA = { numero: '', mes: '', anio: '', cvv: '' };

export default function PagarPedidoModal({ pedido, onClose, onPagado }) {
  const [formas, setFormas] = useState([]);
  const [tarjetas, setTarjetas] = useState([]);
  const [forma, setForma] = useState('');
  const [tarjetaId, setTarjetaId] = useState('');
  const [agregando, setAgregando] = useState(false);
  const [nueva, setNueva] = useState(TARJETA_VACIA);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  // Carga las formas de pago y las tarjetas al abrir la ventana
  useEffect(() => {
    let activo = true;

    Promise.all([obtenerFormasPago(), obtenerTarjetas()])
      .then(([listaFormas, listaTarjetas]) => {
        if (!activo) return;
        setFormas(listaFormas);
        setForma(listaFormas[0]?.clave ?? '');
        setTarjetas(listaTarjetas);
        const vigente = listaTarjetas.find((t) => !t.vencida);
        setTarjetaId(vigente ? String(vigente.id) : '');
      })
      .catch((err) => activo && setError(primerError(err)));

    return () => { activo = false; };
  }, []);

  const agregarTarjeta = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const datos = tokenizarTarjetaSimulada(nueva);   //el número no sale del navegador
      setOcupado(true);
      const tarjeta = await guardarTarjeta(datos);
      setTarjetas((lista) => [...lista, tarjeta]);
      setTarjetaId(String(tarjeta.id));
      setNueva(TARJETA_VACIA);
      setAgregando(false);
    } catch (err) {
      setError(err.response ? primerError(err) : err.message);
    } finally {
      setOcupado(false);
    }
  };

  const quitarTarjeta = async (id) => {
    setError(null);
    try {
      await eliminarTarjeta(id);
      setTarjetas((lista) => lista.filter((t) => t.id !== id));
      if (tarjetaId === String(id)) setTarjetaId('');
    } catch (err) {
      setError(primerError(err));
    }
  };

  const pagar = async () => {
    setError(null);
    setResultado(null);
    setOcupado(true);
    try {
      const respuesta = await pagarPedido(pedido.id, {
        forma_pago: forma,
        metodo_pago: forma === 'TARJETA' ? Number(tarjetaId) : null,
      });
      setResultado(respuesta.pago);
      onPagado(respuesta.pedido);
    } catch (err) {
      setError(primerError(err));
    } finally {
      setOcupado(false);
    }
  };

  const terminado = resultado && resultado.estado !== 'RECHAZADO';
  const faltaTarjeta = forma === 'TARJETA' && !tarjetaId;
  const escribiendoTarjeta = forma === 'TARJETA' && agregando;

  return (
    <Modal isOpen onClose={onClose} title={`Pagar pedido #${pedido.id}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px' }}>
          <span>Total a pagar</span>
          <strong style={{ color: 'var(--color-primary)' }}>{formatoLempiras(pedido.total_final)}</strong>
        </div>

        {error && <Alert type="danger" title="Atención" message={error} onClose={() => setError(null)} />}

        {resultado && (
          <Alert
            type={{ APROBADO: 'success', RECHAZADO: 'danger', PENDIENTE: 'info' }[resultado.estado]}
            title={{ APROBADO: '¡Pago aprobado!', RECHAZADO: 'Pago rechazado', PENDIENTE: 'Pago pendiente' }[resultado.estado]}
            message={[resultado.mensaje, resultado.referencia && `Referencia: ${resultado.referencia}`]
              .filter(Boolean).join(' ')}
          />
        )}

        {!terminado && (
          <>
            {/* Formas de pago: vienen del backend, no están escritas aquí */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {formas.map((f) => (
                <label key={f.clave} style={opcionStyle(forma === f.clave)}>
                  <input type="radio" name="forma" value={f.clave} checked={forma === f.clave} onChange={() => setForma(f.clave)} />
                  {f.nombre}
                </label>
              ))}
            </div>

            {forma === 'TARJETA' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {tarjetas.map((t) => (
                  <div key={t.id} style={{ ...opcionStyle(tarjetaId === String(t.id)), opacity: t.vencida ? 0.5 : 1 }}>
                    <input
                      type="radio"
                      name="tarjeta"
                      disabled={t.vencida}
                      checked={tarjetaId === String(t.id)}
                      onChange={() => setTarjetaId(String(t.id))}
                    />
                    <CreditCard size={18} />
                    <span style={{ flex: 1 }}>
                      {t.tipo_tarjeta} •••• {t.ultimos_cuatro}
                      <small style={{ color: 'var(--text-light)' }}> vence {t.fecha_expiracion}{t.vencida ? ' (vencida)' : ''}</small>
                    </span>
                    <button type="button" onClick={() => quitarTarjeta(t.id)} title="Eliminar tarjeta"
                      style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}

                {agregando ? (
                  <form onSubmit={agregarTarjeta} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    <input
                      style={{ ...campoStyle, gridColumn: 'span 3' }}
                      placeholder="Número de tarjeta"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      value={nueva.numero}
                      onChange={(e) => setNueva({ ...nueva, numero: e.target.value })}
                    />
                    <input style={campoStyle} placeholder="MM" inputMode="numeric" maxLength={2}
                      value={nueva.mes} onChange={(e) => setNueva({ ...nueva, mes: e.target.value })} />
                    <input style={campoStyle} placeholder="AAAA" inputMode="numeric" maxLength={4}
                      value={nueva.anio} onChange={(e) => setNueva({ ...nueva, anio: e.target.value })} />
                    <input style={campoStyle} placeholder="CVV" inputMode="numeric" maxLength={4} type="password"
                      value={nueva.cvv} onChange={(e) => setNueva({ ...nueva, cvv: e.target.value })} />
                    <div style={{ gridColumn: 'span 3', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <Button variant="outline-dark" size="sm" type="button" onClick={() => setAgregando(false)}>Cancelar</Button>
                      <Button variant="primary" size="sm" type="submit" disabled={ocupado}>Guardar tarjeta</Button>
                    </div>
                  </form>
                ) : (
                  <Button variant="outline-dark" size="sm" onClick={() => setAgregando(true)}>
                    <Plus size={14} style={{ marginRight: '6px' }} /> Agregar tarjeta
                  </Button>
                )}

                <small style={{ color: 'var(--text-light)' }}>
                  Pagos simulados. Prueba con 4242 4242 4242 4242 (aprobada) o 4000 0000 0002 0000 (rechazada).
                </small>
              </div>
            )}
          </>
        )}

        {escribiendoTarjeta && (
          <small style={{ color: 'var(--text-light)', textAlign: 'right' }}>
            Guarda la tarjeta nueva o cancela para poder pagar.
          </small>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--light-gray)', paddingTop: '16px' }}>
          <Button variant="outline-dark" size="sm" onClick={onClose}>{terminado ? 'Cerrar' : 'Cancelar'}</Button>
          {!terminado && (
            <Button variant="primary" size="sm" onClick={pagar} disabled={ocupado || !forma || faltaTarjeta || escribiendoTarjeta}>
              {ocupado ? 'Procesando...' : `Pagar ${formatoLempiras(pedido.total_final)}`}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}