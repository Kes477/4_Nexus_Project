import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Check, ArrowLeft, CreditCard, Lock, Truck, Wifi, MapPin, Clock, XCircle } from 'lucide-react';
import { Button, Input, Loader, Alert } from '../ui';
import { getProducto } from '../../api/droneService';
import { obtenerDirecciones } from '../../api/direccionService';
import { confirmarPedido, resumenPedido } from '../../api/pedidoService';
import { guardarTarjeta, obtenerFormasPago, pagarPedido } from '../../api/pagoService';
import { tokenizarTarjetaSimulada } from '../../utils/tarjeta';
import { primerError } from '../../utils/errores';

const formatoLempiras = (valor) =>
    `L ${Number(valor).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const TARJETA_VACIA = { number: '', name: '', expiry: '', cvv: '' };

const labelStyle = { display: 'block', fontSize: '10px', fontWeight: 'bold', color: 'var(--color-dark)', marginBottom: '4px' };
const filaStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', color: 'var(--text-light)' };
const panelStyle = { flex: '1 1 320px', background: 'var(--white)', padding: '20px', borderRadius: '12px', border: '1px solid var(--light-gray)', boxShadow: '0 8px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' };
const selectStyle = { width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid var(--light-gray)', background: 'var(--bg-color)', color: 'var(--color-dark)', boxSizing: 'border-box' };

const inputStyleWithIcon = {
    fontSize: '13px', width: '100%', boxSizing: 'border-box', background: 'var(--bg-color)', color: 'var(--color-dark)',
    paddingTop: '8px', paddingBottom: '8px', paddingRight: '10px', paddingLeft: '40px',
};
const inputStyleNoIcon = { ...inputStyleWithIcon, paddingLeft: '10px' };

const opcionStyle = (activa) => ({
    flex: '1 1 0', padding: '8px', fontSize: '11px', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer',
    border: `1px solid ${activa ? 'var(--color-primary)' : 'var(--light-gray)'}`,
    background: activa ? 'rgba(4, 201, 166, 0.1)' : 'var(--bg-color)',
    color: activa ? 'var(--color-primary)' : 'var(--color-dark)',
});

/* =========================================================
   TARJETA VISUAL (solo presentación)
   SOLID - SRP: dibuja la tarjeta con lo que el cliente escribe.
   No valida ni envía nada.
   ========================================================= */
const getCardGradient = (num) => {
    const cleanNum = num.replace(/\s/g, '');
    if (cleanNum.startsWith('4')) return 'linear-gradient(135deg, #1a2980 0%, #26d0ce 100%)';
    if (cleanNum.startsWith('5')) return 'linear-gradient(135deg, #cb2d3e 0%, #ef473a 100%)';
    if (cleanNum.startsWith('3')) return 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
    return 'linear-gradient(135deg, #2c365e 0%, #0E5E6F 100%)';
};

const TarjetaVisual = ({ cardData }) => (
    <div style={{
        background: getCardGradient(cardData.number), width: '100%', maxWidth: '300px', aspectRatio: '1.58',
        borderRadius: '12px', padding: '15px 20px', color: 'var(--white)', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', transition: 'background 0.5s ease',
        margin: '0 auto 20px auto', position: 'relative', overflow: 'hidden', boxSizing: 'border-box',
    }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ width: '35px', height: '25px', background: 'linear-gradient(135deg, #f1be26 0%, #d4a017 100%)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.3)' }}></div>
                <Wifi size={16} style={{ transform: 'rotate(90deg)', opacity: 0.8 }} />
            </div>
            <span style={{ fontSize: '15px', fontWeight: 'bold', fontStyle: 'italic', textTransform: 'uppercase' }}>
                {cardData.number.startsWith('4') ? 'VISA' : cardData.number.startsWith('5') ? 'Mastercard' : '4 NEXUS'}
            </span>
        </div>

        <div style={{ fontSize: '17px', letterSpacing: '2px', fontFamily: 'monospace', zIndex: 1, textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
            {cardData.number || '•••• •••• •••• ••••'}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', textTransform: 'uppercase', zIndex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ opacity: 0.7, marginBottom: '2px' }}>Titular</span>
                <span style={{ fontWeight: 'bold', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '10px' }}>
                    {cardData.name || 'NOMBRE APELLIDO'}
                </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                <span style={{ opacity: 0.7, marginBottom: '2px' }}>Vence</span>
                <span style={{ fontWeight: 'bold', fontSize: '10px' }}>{cardData.expiry || 'MM/AA'}</span>
            </div>
        </div>
    </div>
);

/* =========================================================
   RESULTADO DEL PAGO
   Aprobado, pendiente (transferencia / contra entrega) o rechazado.
   ========================================================= */
const RESULTADOS = {
    APROBADO: { titulo: '¡Pago aprobado!', color: 'var(--color-primary)', fondo: 'rgba(4, 201, 166, 0.1)', Icono: Check },
    PENDIENTE: { titulo: 'Pedido registrado', color: 'var(--color-warning, #d4a017)', fondo: 'rgba(241, 190, 38, 0.15)', Icono: Clock },
    RECHAZADO: { titulo: 'Pago rechazado', color: 'var(--color-danger)', fondo: 'rgba(220, 53, 69, 0.1)', Icono: XCircle },
};

const ResultadoPago = ({ resultado, textoVolver, onBack, textoSeguir, onSeguir }) => {
    const { pago, pedido } = resultado;
    const { titulo, color, fondo, Icono } = RESULTADOS[pago.estado];

    return (
        <div style={{ background: 'var(--white)', padding: '40px 20px', borderRadius: '16px', border: '1px solid var(--light-gray)', textAlign: 'center', maxWidth: '500px', margin: '0 auto', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <div style={{ background: fondo, color, width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Icono size={35} strokeWidth={3} />
            </div>
            <h2 style={{ color: 'var(--color-dark)', marginBottom: '10px', fontSize: '24px' }}>{titulo}</h2>
            <p style={{ color: 'var(--text-light)', fontSize: '14px', marginBottom: '6px' }}>
                Pedido <strong>#{pedido.id}</strong> por <strong>{formatoLempiras(pedido.total_final)}</strong>
            </p>
            <p style={{ color: 'var(--text-light)', fontSize: '13px', marginBottom: '20px' }}>
                {pago.mensaje}
                {pago.referencia && <><br />Referencia: <strong>{pago.referencia}</strong></>}
            </p>
            {pago.estado === 'RECHAZADO' && (
                <p style={{ color: 'var(--text-light)', fontSize: '12px', marginBottom: '20px' }}>
                    Tu pedido quedó pendiente: puedes pagarlo con otra tarjeta desde Mis pedidos.
                </p>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button variant="outline-dark" onClick={onBack}>{textoVolver}</Button>
                <Button variant="primary" onClick={onSeguir}>{textoSeguir}</Button>
            </div>
        </div>
    );
};

/* =========================================================
   CHECKOUT "COMPRAR AHORA" (reutilizable)
   SOLID - SRP: gestiona la compra de UN producto (dron o plan).
   Los precios, el ISV, el stock y el cobro los decide el backend.
   SOLID - OCP: sirve para cualquier producto sin modificarlo;
   lo que cambia entre páginas (textos y qué hacer al terminar) llega por props.
   Flujo: resumen → tokenizar tarjeta → crear pedido → pagar (Strategy).

   producto: { id, nombre, desc, categoria, imagen }
   ========================================================= */
export default function CheckoutComprarAhora({
    producto,
    onBack,
    textoVolver = 'Volver al catálogo',
    textoSeguir = 'Ver mis pedidos',
    onSeguir,
}) {
    const [variantes, setVariantes] = useState([]);
    const [varianteId, setVarianteId] = useState('');
    const [direcciones, setDirecciones] = useState([]);
    const [direccionId, setDireccionId] = useState('');
    const [formas, setFormas] = useState([]);
    const [forma, setForma] = useState('');
    const [resumen, setResumen] = useState(null);
    const [cardData, setCardData] = useState(TARJETA_VACIA);

    const [cargando, setCargando] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [pedidoPendiente, setPedidoPendiente] = useState(null);
    const [resultado, setResultado] = useState(null);

    // 1. Carga inicial: variantes del producto, direcciones y formas de pago
    useEffect(() => {
        let activo = true;

        Promise.all([getProducto(producto.id), obtenerDirecciones(), obtenerFormasPago()])
            .then(([producto, listaDirecciones, listaFormas]) => {
                if (!activo) return;
                const lista = producto.variantes ?? [];
                setVariantes(lista);
                const primera = lista.find((v) => v.disponible);
                setVarianteId(primera ? String(primera.id) : '');

                setDirecciones(listaDirecciones);
                const principal = listaDirecciones.find((d) => d.es_principal) ?? listaDirecciones[0];
                setDireccionId(principal ? String(principal.id) : '');

                setFormas(listaFormas);
                setForma(listaFormas[0]?.clave ?? '');
            })
            .catch((err) => activo && setError(primerError(err)))
            .finally(() => activo && setCargando(false));

        return () => { activo = false; };
    }, [producto.id]);

    // 2. Totales reales (subtotal, envío, ISV) cada vez que cambia la variante
    useEffect(() => {
        if (!varianteId) return undefined;
        let activo = true;

        resumenPedido({ variante: Number(varianteId), cantidad: 1 })
            .then((datos) => activo && setResumen(datos))
            .catch((err) => activo && setError(primerError(err)));

        return () => { activo = false; };
    }, [varianteId]);

    const handleCardNumberChange = (e) => {
        const rawValue = e.target.value.replace(/\D/g, '');
        const formattedValue = rawValue.match(/.{1,4}/g)?.join(' ').slice(0, 19) || '';
        setCardData({ ...cardData, number: formattedValue });
    };

    const handleExpiryChange = (e) => {
        const rawValue = e.target.value.replace(/\D/g, '');
        let formattedValue = rawValue;
        if (rawValue.length > 2) formattedValue = `${rawValue.slice(0, 2)}/${rawValue.slice(2, 4)}`;
        setCardData({ ...cardData, expiry: formattedValue });
    };

    const handleBuy = async () => {
        setError(null);
        setPedidoPendiente(null);

        // a) La tarjeta se tokeniza en el navegador ANTES de crear nada.
        //    El número completo y el CVV nunca salen de aquí.
        let tarjeta = null;
        if (forma === 'TARJETA') {
            const [mes, anio] = cardData.expiry.split('/');
            try {
                tarjeta = tokenizarTarjetaSimulada({ numero: cardData.number, mes, anio: `20${anio}`, cvv: cardData.cvv });
            } catch (err) {
                setError(err.message);
                return;
            }
        }

        setIsProcessing(true);
        let pedido = null;
        try {
            // b) Se guarda solo el token (si la tarjeta está vencida, falla aquí y no se crea el pedido)
            const metodo = tarjeta ? await guardarTarjeta(tarjeta) : null;

            // c) Pedido de una sola variante: no toca el carrito
            pedido = await confirmarPedido({
                variante: Number(varianteId),
                cantidad: 1,
                direccion: direccionId ? Number(direccionId) : null,
            });

            // d) El backend elige la estrategia según la forma de pago
            const respuesta = await pagarPedido(pedido.id, {
                forma_pago: forma,
                metodo_pago: metodo ? metodo.id : null,
            });
            setResultado(respuesta);
        } catch (err) {
            setError(err.response ? primerError(err) : err.message);
            if (pedido) setPedidoPendiente(pedido.id);   // el pedido existe pero no se pagó
        } finally {
            setIsProcessing(false);
        }
    };

    if (resultado) {
        return (
            <ResultadoPago
                resultado={resultado}
                textoVolver={textoVolver}
                onBack={onBack}
                textoSeguir={textoSeguir}
                onSeguir={onSeguir}
            />
        );
    }

    if (cargando) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                <Loader text="Preparando tu compra..." />
            </div>
        );
    }

    const variante = variantes.find((v) => String(v.id) === varianteId);
    const requiereDireccion = resumen?.requiere_direccion ?? true;
    // Contra entrega solo tiene sentido si hay algo que entregar (un plan no se envía)
    const formasVisibles = requiereDireccion ? formas : formas.filter((f) => f.clave !== 'CONTRA_ENTREGA');
    const tarjetaCompleta = cardData.number.length >= 15 && cardData.expiry.length === 5 && cardData.cvv.length >= 3 && cardData.name.trim();
    const puedePagar = Boolean(
        resumen && variante && !isProcessing &&
        formasVisibles.some((f) => f.clave === forma) &&
        (!requiereDireccion || direccionId) &&
        (forma !== 'TARJETA' || tarjetaCompleta),
    );

    return (
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
            <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontSize: '13px', fontWeight: '600', marginBottom: '15px' }}>
                <ArrowLeft size={16} /> {textoVolver}
            </button>

            {error && (
                <div style={{ marginBottom: '15px' }}>
                    <Alert
                        type="danger"
                        title="Atención"
                        message={pedidoPendiente
                            ? `${error} El pedido #${pedidoPendiente} quedó pendiente; puedes pagarlo desde Mis pedidos.`
                            : error}
                        onClose={() => setError(null)}
                    />
                </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'stretch' }}>

                {/* ---------- Columna izquierda: dron, variante, dirección y totales ---------- */}
                <div style={panelStyle}>
                    <h2 style={{ fontSize: '16px', color: 'var(--color-dark)', margin: '0 0 15px 0', fontWeight: '800' }}>Resumen de tu Pedido</h2>

                    <div style={{ display: 'flex', gap: '12px', marginBottom: '15px', flexWrap: 'wrap' }}>
                        {producto.imagen ? (
                            <img src={producto.imagen} alt={producto.nombre} style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '10px' }} />
                        ) : (
                            <div style={{ width: '90px', height: '90px', background: 'var(--bg-color)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fa-solid fa-image" style={{ fontSize: '24px', color: 'var(--light-gray)' }}></i>
                            </div>
                        )}
                        <div style={{ flex: 1, minWidth: '150px' }}>
                            <span style={{ background: 'rgba(4, 201, 166, 0.1)', color: 'var(--color-primary)', padding: '3px 8px', borderRadius: '20px', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                {producto.categoria}
                            </span>
                            <h3 style={{ fontSize: '16px', color: 'var(--color-dark)', margin: '8px 0 4px 0' }}>{producto.nombre}</h3>
                            <p style={{ color: 'var(--text-light)', fontSize: '11px', margin: 0, lineHeight: '1.3' }}>{producto.desc}</p>
                        </div>
                    </div>

                    {/* Variante (SKU) */}
                    <div style={{ marginBottom: '12px' }}>
                        <label style={labelStyle}>Versión</label>
                        {variantes.length === 0 ? (
                            <p style={{ fontSize: '12px', color: 'var(--color-danger)', margin: 0 }}>Este producto no tiene versiones a la venta.</p>
                        ) : (
                            <select style={selectStyle} value={varianteId} onChange={(e) => setVarianteId(e.target.value)}>
                                {!varianteId && <option value="">Sin stock disponible</option>}
                                {variantes.map((v) => (
                                    <option key={v.id} value={v.id} disabled={!v.disponible}>
                                        {v.sku} — {formatoLempiras(v.precio)}{v.disponible ? '' : ' (agotado)'}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Dirección de envío */}
                    {requiereDireccion && (
                        <div style={{ marginBottom: '12px' }}>
                            <label style={labelStyle}><MapPin size={10} /> Dirección de envío</label>
                            {direcciones.length === 0 ? (
                                <p style={{ fontSize: '12px', color: 'var(--text-light)', margin: 0 }}>
                                    No tienes direcciones.{' '}
                                    <Link to="/cliente/perfil" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Agrega una en tu perfil</Link>.
                                </p>
                            ) : (
                                <select style={selectStyle} value={direccionId} onChange={(e) => setDireccionId(e.target.value)}>
                                    {direcciones.map((d) => (
                                        <option key={d.id} value={d.id}>{d.linea_direccion1} — {d.ubicacion_texto}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}

                    {/* Totales calculados por el backend */}
                    <div style={{ background: 'var(--bg-color)', padding: '12px', borderRadius: '10px', marginTop: 'auto' }}>
                        {resumen ? (
                            <>
                                <div style={filaStyle}><span>Subtotal</span><span>{formatoLempiras(resumen.subtotal)}</span></div>
                                {Number(resumen.costo_envio) > 0 && (
                                    <div style={filaStyle}><span>Envío</span><span>{formatoLempiras(resumen.costo_envio)}</span></div>
                                )}
                                <div style={filaStyle}><span>ISV (15 %)</span><span>{formatoLempiras(resumen.total_impuestos)}</span></div>
                                <hr style={{ border: 'none', borderTop: '1px solid var(--light-gray)', margin: '10px 0' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 'bold', color: 'var(--color-dark)', fontSize: '14px' }}>Total a Pagar</span>
                                    <span style={{ fontSize: '20px', fontWeight: '900', color: 'var(--color-primary)' }}>{formatoLempiras(resumen.total_final)}</span>
                                </div>
                            </>
                        ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>Elige una versión para ver el total.</span>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-light)' }}><ShieldCheck size={12} /> Pago Seguro</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-light)' }}><Truck size={12} /> Envío Asegurado</div>
                    </div>
                </div>

                {/* ---------- Columna derecha: forma de pago ---------- */}
                <div style={panelStyle}>
                    <h2 style={{ fontSize: '16px', color: 'var(--color-dark)', margin: '0 0 15px 0', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CreditCard size={18} color="var(--color-primary)" /> Información de Pago
                    </h2>

                    {/* Las formas de pago vienen del registro de estrategias del backend */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', flexWrap: 'wrap' }}>
                        {formasVisibles.map((f) => (
                            <button key={f.clave} type="button" style={opcionStyle(forma === f.clave)} onClick={() => setForma(f.clave)}>
                                {f.nombre}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1 }}>
                        {forma === 'TARJETA' ? (
                            <>
                                <TarjetaVisual cardData={cardData} />

                                <div>
                                    <label style={labelStyle}>Número de Tarjeta</label>
                                    <Input type="text" placeholder="0000 0000 0000 0000" value={cardData.number}
                                        onChange={handleCardNumberChange} maxLength={19} icon="fa-credit-card" style={inputStyleWithIcon} />
                                </div>

                                <div>
                                    <label style={labelStyle}>Nombre del Titular</label>
                                    <Input type="text" placeholder="Como aparece en la tarjeta" value={cardData.name}
                                        onChange={(e) => setCardData({ ...cardData, name: e.target.value.toUpperCase() })}
                                        icon="fa-user" style={inputStyleWithIcon} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div>
                                        <label style={labelStyle}>Fecha Exp.</label>
                                        <Input type="text" placeholder="MM/AA" value={cardData.expiry}
                                            onChange={handleExpiryChange} maxLength={5} style={inputStyleNoIcon} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>CVV</label>
                                        <Input type="password" placeholder="123" value={cardData.cvv}
                                            onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '') })}
                                            maxLength={4} icon="fa-lock" style={inputStyleWithIcon} />
                                    </div>
                                </div>

                                <small style={{ fontSize: '10px', color: 'var(--text-light)' }}>
                                    Pagos simulados: 4242 4242 4242 4242 (aprobada) o 4000 0000 0002 0000 (rechazada).
                                </small>
                            </>
                        ) : (
                            <p style={{ fontSize: '13px', color: 'var(--text-light)', margin: 0, lineHeight: 1.5 }}>
                                {forma === 'TRANSFERENCIA'
                                    ? 'Al confirmar te daremos una referencia para hacer la transferencia. El pedido se procesa cuando el pago se verifique.'
                                    : 'Pagas en efectivo al recibir tu dron en la dirección elegida.'}
                            </p>
                        )}

                        <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                            <Button
                                variant="primary"
                                onClick={handleBuy}
                                disabled={!puedePagar}
                                style={{ width: '100%', height: '42px', padding: '0 15px', fontSize: '13px', fontWeight: 'bold', borderRadius: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', boxSizing: 'border-box' }}
                            >
                                {isProcessing ? (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                        <Loader text="Procesando..." />
                                    </div>
                                ) : (
                                    <><Lock size={14} /> {forma === 'TARJETA' ? 'Pagar' : 'Confirmar'} {resumen ? formatoLempiras(resumen.total_final) : ''}</>
                                )}
                            </Button>
                            <p style={{ textAlign: 'center', fontSize: '9px', color: 'var(--text-light)', margin: '8px 0 0 0' }}>
                                <ShieldCheck size={10} style={{ display: 'inline', marginRight: '4px' }} />
                                El número completo y el CVV nunca se envían a nuestro servidor.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
