import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowRight, ArrowLeft, CheckCircle2, MapPin, Calendar, 
  Check, Star, User, DollarSign, RefreshCw
} from 'lucide-react';

import { 
  Button, 
  Input, 
  Select, 
  Modal, 
  Badge, 
  Stepper, 
  SectionHeading,
  Alert,
  Loader,
  Tabs
} from '../../components/ui';

const PESTANAS = [
  { key: 'todos', label: 'Todos' },
  { key: 'en_proceso', label: 'En Proceso' },
  { key: 'por_calificar', label: 'Por Calificar' },
  { key: 'calificados', label: 'Calificados' },
];

export default function ClienteServicios() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [step, setStep] = useState(1);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  const [servicios, setServicios] = useState([]);
  const [catalogoServicios, setCatalogoServicios] = useState([]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const [formData, setFormData] = useState({
    productoId: "",
    location: "",
    date: "",
    time: "",
  });

  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [serviceToRate, setServiceToRate] = useState(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  const fetchServicios = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const token = localStorage.getItem('access_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [catalogoResp, misionesResp] = await Promise.all([
        fetch(`${API_URL}/catalogo/productos/?tipo_producto=SERVICIO`, { headers }),
        fetch(`${API_URL}/pilotos/misiones/`, { headers })
      ]);

      let catList = [];

      if (catalogoResp.ok) {
        const catalogoData = await catalogoResp.json();
        catList = Array.isArray(catalogoData) ? catalogoData : catalogoData.results || [];
        setCatalogoServicios(catList);
      }

      if (misionesResp.ok) {
        const misionesData = await misionesResp.json();
        const lista = Array.isArray(misionesData) ? misionesData : misionesData.results || [];
        
        const mappedServicios = lista.map(m => {
          let statusText = m.estado;
          if (m.estado === 'COMPLETADA') statusText = 'Completado';
          else if (m.estado === 'EN_CURSO') statusText = 'En marcha';
          else if (m.estado === 'ACEPTADA') statusText = 'Aceptada';
          else if (m.estado === 'PENDIENTE') statusText = 'En revisión';
          else if (m.estado === 'CANCELADA') statusText = 'Cancelada';

          const productoCat = catList.find(p => p.id === m.producto);
          let precioFormateado = 'Cotización pendiente';
          
          if (productoCat && productoCat.precio_desde) {
            precioFormateado = `L ${Number(productoCat.precio_desde).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`;
          }

          return {
            id: m.id,
            productId: m.producto,
            title: m.categoria || 'Servicio',
            type: 'Servicio',
            location: m.ubicacion || 'Sin ubicación',
            status: statusText,
            date: new Date(`${m.fecha_programada}T00:00:00`).toLocaleDateString(),
            notes: m.descripcion || 'Sin notas adicionales.',
            pilotoNombre: m.piloto_nombre,
            isRated: m.esta_calificada,
            price: precioFormateado
          };
        });
        
        setServicios(mappedServicios);
      } else {
        setErrorMsg('No se pudieron cargar los servicios. Verifica tu sesión.');
      }
    } catch (err) {
      setErrorMsg('Error al cargar los datos. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicios();
  }, [API_URL]);

  const getStatusBadge = (status) => {
    if (status === "Completado") return <Badge text={status} color="success" />;
    if (status === "En marcha") return <Badge text={status} color="primary" />;
    if (status === "Aceptada") return <Badge text={status} color="info" />;
    if (status === "En revisión") return <Badge text={status} color="warning" />;
    return <Badge text={status} color="dark" />;
  };

  const handleSolicitarServicio = async () => {
    setIsSubmittingRequest(true);
    setErrorMsg(null);
    
    try {
      const token = localStorage.getItem('access_token');
      const productoSeleccionado = catalogoServicios.find(p => p.id === parseInt(formData.productoId));
      
      const payload = {
        producto: formData.productoId,
        categoria: productoSeleccionado?.nombre || "Servicio General",
        ubicacion: formData.location,
        fecha_programada: formData.date,
        dron_asignado: "Por asignar",
        descripcion: `Servicio: ${productoSeleccionado?.nombre}\nHora aproximada: ${formData.time}`,
        estado: "PENDIENTE"
      };

      const response = await fetch(`${API_URL}/pilotos/misiones/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Error al enviar la solicitud. Revisa los datos.');
      }

      setRequestSuccess(true);
      setSuccessMsg('Solicitud enviada correctamente.');
      await fetchServicios();
      setActiveTabIndex(0);

    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const openRatingModal = (servicio) => {
    if (!servicio.productId) {
      setErrorMsg('Este servicio no está vinculado a un producto en el catálogo, por lo que no puede ser calificado.');
      return;
    }
    setServiceToRate(servicio);
    setRatingValue(5);
    setReviewComment('');
    setRatingError(null);
    setIsRatingModalOpen(true);
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    setIsSubmittingRating(true);
    setRatingError(null);

    try {
      const token = localStorage.getItem('access_token');

      const response = await fetch(`${API_URL}/catalogo/resenias/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          producto: serviceToRate.productId,
          mision: serviceToRate.id,
          calificacion: ratingValue,
          comentario: reviewComment
        })
      });

      if (!response.ok) {
        let errorString = 'Error al enviar la calificación. Intenta de nuevo.';
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const errorData = await response.json();
          if (errorData.mision) {
            errorString = Array.isArray(errorData.mision) ? errorData.mision[0] : errorData.mision;
          } else if (errorData.producto) {
            errorString = Array.isArray(errorData.producto) ? errorData.producto[0] : errorData.producto;
          } else if (errorData.non_field_errors) {
            errorString = errorData.non_field_errors[0];
          } else if (errorData.detail) {
            errorString = errorData.detail;
          } else if (errorData.calificacion) {
            errorString = 'La calificación debe estar entre 1 y 5.';
          }
        } else {
          errorString = 'Ocurrió un error en el servidor al procesar tu calificación.';
        }
        throw new Error(errorString);
      }

      setServicios(prev => prev.map(srv => 
        srv.id === serviceToRate.id ? { ...srv, isRated: true } : srv
      ));

      setIsRatingModalOpen(false);
      setSuccessMsg('¡Gracias por tu calificación!');
      fetchServicios(); 
    } catch (error) {
      setRatingError(error.message);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const tabCounts = useMemo(() => {
    return {
      todos: servicios.length,
      en_proceso: servicios.filter(srv => ['En revisión', 'Aceptada', 'En marcha'].includes(srv.status)).length,
      por_calificar: servicios.filter(srv => srv.status === 'Completado' && !srv.isRated).length,
      calificados: servicios.filter(srv => srv.status === 'Completado' && srv.isRated).length,
    };
  }, [servicios]);

  const serviciosFiltrados = useMemo(() => {
    const tabKey = PESTANAS[activeTabIndex].key;
    if (tabKey === 'en_proceso') {
      return servicios.filter(srv => ['En revisión', 'Aceptada', 'En marcha'].includes(srv.status));
    }
    if (tabKey === 'por_calificar') {
      return servicios.filter(srv => srv.status === 'Completado' && !srv.isRated);
    }
    if (tabKey === 'calificados') {
      return servicios.filter(srv => srv.status === 'Completado' && srv.isRated);
    }
    return servicios; 
  }, [servicios, activeTabIndex]);

  const tabsLabels = PESTANAS.map(p => {
    const count = tabCounts[p.key];
    return count > 0 ? `${p.label} (${count})` : p.label;
  });

  if (loading && servicios.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-color)' }}>
        <Loader text="Cargando panel de servicios..." />
      </div>
    );
  }

  const selectedService = catalogoServicios.find(c => c.id === parseInt(formData.productoId));
  const formattedPrice = selectedService?.precio_desde
    ? `L ${Number(selectedService.precio_desde).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`
    : 'Precio no disponible';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', minHeight: '100vh', backgroundColor: 'var(--bg-color)', fontFamily: "'Roboto', sans-serif", overflow: 'hidden' }}>
      
      <div style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
        
        <div style={{ backgroundColor: 'var(--white)', padding: '24px', borderRadius: '8px', border: '1px solid var(--light-gray)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <SectionHeading 
            eyebrow="Panel de Control" 
            title="Mis Servicios" 
            description="Gestiona tus solicitudes, monitorea las fichas técnicas y el estado de cada servicio." 
          />
          <Button variant="outline-dark" onClick={fetchServicios} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refrescar
          </Button>
        </div>

        {errorMsg && <Alert type="danger" title="Atención" message={errorMsg} onClose={() => setErrorMsg(null)} />}
        {successMsg && <Alert type="success" title="Éxito" message={successMsg} onClose={() => setSuccessMsg(null)} />}

        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          
          <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div style={{ backgroundColor: 'var(--white)', padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--light-gray)' }}>
              <Tabs
                tabs={tabsLabels}
                activeTab={activeTabIndex}
                onChange={(index) => setActiveTabIndex(index)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {serviciosFiltrados.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', backgroundColor: 'var(--white)', borderRadius: '8px', border: '1px dashed var(--light-gray)' }}>
                  <p style={{ color: 'var(--text-light)' }}>No hay servicios en esta categoría.</p>
                </div>
              ) : (
                serviciosFiltrados.map(srv => (
                  <div key={srv.id} style={{ backgroundColor: 'var(--white)', border: '1px solid var(--light-gray)', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    
                    <div style={{ height: '80px', backgroundColor: 'var(--color-dark)', position: 'relative', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>{srv.type}</span>
                      <h3 style={{ margin: '4px 0 0 0', fontSize: '16px', color: 'var(--white)', fontWeight: 'bold' }}>{srv.title}</h3>
                      <div style={{ position: 'absolute', top: '12px', right: '12px' }}>{getStatusBadge(srv.status)}</div>
                    </div>

                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-light)' }}>
                        <DollarSign size={16} color="var(--color-primary)" /> 
                        <span>Precio estimado: <strong style={{ color: 'var(--color-dark)' }}>{srv.price}</strong></span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-light)' }}>
                        <MapPin size={16} color="var(--color-primary)" /> <span>{srv.location}</span>
                      </div>
                      
                      {srv.pilotoNombre && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-light)' }}>
                          <User size={16} color="var(--color-primary)" /> <span>Piloto: <strong>{srv.pilotoNombre}</strong></span>
                        </div>
                      )}

                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-dark)', backgroundColor: 'var(--bg-color)', padding: '12px', borderRadius: '4px', border: '1px solid var(--light-gray)', whiteSpace: 'pre-line' }}>
                        {srv.notes}
                      </p>
                      
                      <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--light-gray)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase' }}>Fecha</span>
                          <span style={{ fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {srv.date}</span>
                        </div>
                        
                        {srv.status === 'Completado' && (
                          srv.isRated ? (
                            <Badge text="Calificado" color="success" />
                          ) : (
                            <Button variant="primary" size="sm" onClick={() => openRatingModal(srv)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Star size={14} /> Calificar
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ width: '360px', flexShrink: 0, backgroundColor: 'var(--white)', border: '1px solid var(--light-gray)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--light-gray)', backgroundColor: 'var(--bg-color)' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'var(--color-dark)' }}>Solicitar Servicio</h2>
              
              <div style={{ marginTop: '16px' }}>
                <Stepper 
                  steps={['Detalles', 'Fecha y Hora', 'Revisión']} 
                  currentStep={step - 1} 
                />
              </div>
            </div>

            <div style={{ padding: '20px', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
              {requestSuccess ? (
                <div style={{ textAlign: 'center', margin: 'auto' }}>
                  <CheckCircle2 size={48} color="var(--color-success)" style={{ margin: '0 auto 16px' }} />
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: 'var(--color-dark)' }}>Solicitud Enviada</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-light)', marginBottom: '16px' }}>El servicio para <strong>{formData.location}</strong> ha sido enviado al administrador.</p>
                  <Button variant="outline-dark" onClick={() => { setStep(1); setRequestSuccess(false); setFormData({ productoId: "", location: "", date: "", time: "" }); }}>Nueva solicitud</Button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                  
                  {step === 1 && (
                    <>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '6px' }}>Servicio a solicitar</label>
                        <Select 
                          options={[
                            { value: "", label: "Seleccione un servicio..." },
                            ...catalogoServicios.map(cat => ({ value: cat.id, label: cat.nombre }))
                          ]} 
                          value={formData.productoId} 
                          onChange={e => setFormData({ ...formData, productoId: e.target.value })} 
                        />
                        {formData.productoId && (
                          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: 'rgba(4, 201, 166, 0.1)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', fontSize: '13px', fontWeight: 'bold' }}>
                            <DollarSign size={16} />
                            Precio estimado: {formattedPrice}
                          </div>
                        )}
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '6px' }}>Ubicación</label>
                        <Input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="Ej. Finca El Aguán" />
                      </div>
                      <Button variant="primary" onClick={() => setStep(2)} disabled={!formData.productoId || !formData.location} style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        Siguiente <ArrowRight size={16} />
                      </Button>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '6px' }}>Fecha de operación</label>
                        <Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '6px' }}>Hora aproximada</label>
                        <Input type="time" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} />
                      </div>
                      <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                        <Button variant="outline-dark" onClick={() => setStep(1)} style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          <ArrowLeft size={16} /> Atrás
                        </Button>
                        <Button variant="primary" onClick={() => setStep(3)} disabled={!formData.date || !formData.time} style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          Revisar <ArrowRight size={16} />
                        </Button>
                      </div>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <div style={{ backgroundColor: 'var(--bg-color)', padding: '16px', borderRadius: '8px', border: '1px solid var(--light-gray)' }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--color-dark)' }}>Resumen</h4>
                        <p style={{ margin: '0 0 4px 0', fontSize: '13px' }}><strong>Servicio:</strong> {selectedService?.nombre}</p>
                        <p style={{ margin: '0 0 4px 0', fontSize: '13px' }}><strong>Precio estimado:</strong> {formattedPrice}</p>
                        <p style={{ margin: '0 0 4px 0', fontSize: '13px' }}><strong>Fecha:</strong> {formData.date}</p>
                        <p style={{ margin: '0 0 4px 0', fontSize: '13px' }}><strong>Hora aprox:</strong> {formData.time}</p>
                        <p style={{ margin: 0, fontSize: '13px' }}><strong>Lugar:</strong> {formData.location}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                        <Button variant="outline-dark" onClick={() => setStep(2)} style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          <ArrowLeft size={16} /> Atrás
                        </Button>
                        <Button variant="primary" onClick={handleSolicitarServicio} disabled={isSubmittingRequest} style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          {isSubmittingRequest ? 'Enviando...' : <><Check size={16} /> Enviar</>}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isRatingModalOpen} onClose={() => setIsRatingModalOpen(false)} title="Calificar Servicio">
        <form onSubmit={handleSubmitRating} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {ratingError && (
            <Alert type="danger" title="Error" message={ratingError} onClose={() => setRatingError(null)} />
          )}

          <div style={{ textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: 'var(--color-dark)' }}>
              {serviceToRate?.title}
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-light)' }}>
              ¿Cómo fue tu experiencia con este servicio?
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRatingValue(star)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <Star 
                  size={36} 
                  fill={star <= ratingValue ? "var(--color-warning)" : "none"} 
                  color={star <= ratingValue ? "var(--color-warning)" : "var(--light-gray)"} 
                />
              </button>
            ))}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '6px' }}>
              Comentario (Opcional)
            </label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Cuéntanos qué tal estuvo el servicio..."
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--light-gray)',
                fontSize: '14px',
                fontFamily: 'inherit',
                color: 'var(--color-dark)',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Button variant="outline-dark" type="button" onClick={() => setIsRatingModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmittingRating}>
              {isSubmittingRating ? 'Enviando...' : 'Enviar Calificación'}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}