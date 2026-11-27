import { useState } from 'react';
import { MapPin, Calendar, Clock, Check, X, Play, CheckCircle, User, Camera, Shield, Package, Droplets, Target, Eye, Edit2, XCircle, Save, AlertTriangle } from 'lucide-react';
import { Button, Badge, Modal, Input, Alert } from '../ui';

export const MisionCard = ({ mision, onStatusChange, onEdit, isPersonal }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isCanceling, setIsCanceling] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    const [editForm, setEditForm] = useState({
        cliente_nombre: mision.cliente_nombre || '',
        ubicacion: mision.ubicacion || '',
        area_size: mision.area_size || '',
        fecha_programada: mision.fecha_programada ? new Date(mision.fecha_programada).toISOString().split('T')[0] : '',
        dron_asignado: mision.dron_asignado || '',
        categoria: mision.categoria || '',
        descripcion: mision.descripcion || ''
    });

    const getMissionStyle = (categoria) => {
        const cat = categoria?.toLowerCase() || '';
        
        if (cat.includes('fumig') || cat.includes('agri')) 
            return { Icon: Droplets, color: 'var(--color-info)', bg: 'rgba(45, 210, 246, 0.1)' };
        
        if (cat.includes('monitoreo') || cat.includes('vigil')) 
            return { Icon: Eye, color: 'var(--color-primary)', bg: 'rgba(4, 201, 166, 0.1)' };
        
        if (cat.includes('foto') || cat.includes('cam') || cat.includes('mapeo')) 
            return { Icon: Camera, color: 'var(--color-warning)', bg: 'rgba(241, 190, 38, 0.1)' };
        
        if (cat.includes('segur')) 
            return { Icon: Shield, color: 'var(--color-danger)', bg: 'rgba(240, 37, 88, 0.1)' };
        
        if (cat.includes('entrega') || cat.includes('paquete')) 
            return { Icon: Package, color: 'var(--color-dark)', bg: 'rgba(44, 54, 94, 0.1)' };
        
        return { Icon: Target, color: 'var(--color-primary)', bg: 'rgba(4, 201, 166, 0.1)' };
    };

    const { Icon: MissionIcon, color: iconColor, bg: iconBg } = getMissionStyle(mision.categoria);

    const getBadgeColor = (estado) => {
        switch (estado) {
            case 'PENDIENTE': return 'warning';
            case 'ACEPTADA': return 'info';
            case 'EN_CURSO': return 'primary';
            case 'COMPLETADA': return 'success';
            case 'RECHAZADA':
            case 'CANCELADA': return 'danger';
            default: return 'dark';
        }
    };

    const cardStyle = {
        background: "var(--white)",
        borderRadius: "12px",
        border: mision.estado === 'EN_CURSO' ? "1px solid var(--color-primary)" : "1px solid var(--light-gray)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        position: "relative",
        boxShadow: mision.estado === 'EN_CURSO' ? "0 8px 25px rgba(4, 201, 166, 0.1)" : "0 4px 15px rgba(0,0,0,0.03)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
    };

    const hoverEffect = {
        onMouseEnter: (e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = mision.estado === 'EN_CURSO' ? "0 12px 30px rgba(4, 201, 166, 0.15)" : "0 12px 30px rgba(0,0,0,0.06)";
        },
        onMouseLeave: (e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = mision.estado === 'EN_CURSO' ? "0 8px 25px rgba(4, 201, 166, 0.1)" : "0 4px 15px rgba(0,0,0,0.03)";
        }
    };

    const handleEditChange = (e) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        setErrorMsg(null);

        if (!editForm.ubicacion.trim() || !editForm.fecha_programada || !editForm.dron_asignado.trim() || !editForm.categoria.trim()) {
            setErrorMsg('Los campos: Ubicación, Fecha, Dron y Cultivo/Categoría son obligatorios.');
            return;
        }

        if (!isPersonal && !editForm.cliente_nombre.trim()) {
            setErrorMsg('El nombre del cliente es obligatorio para servicios a terceros.');
            return;
        }

        setIsSaving(true);
        try {
            await onEdit(mision.id, editForm);
            setIsEditing(false);
        } catch (error) {
            setErrorMsg(error.message || 'Error al guardar los cambios.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleConfirmCancel = async () => {
        try {
            await onStatusChange(mision.id, 'CANCELADA');
            setIsCanceling(false);
        } catch (error) {
            setErrorMsg(error.message || 'Error al cancelar la misión.');
        }
    };

    return (
        <>
            <article style={cardStyle} {...hoverEffect}>
                
                <div style={{ padding: "20px 20px 16px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: iconBg, color: iconColor, padding: "12px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <MissionIcon size={22} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 style={{ color: "var(--color-dark)", fontSize: "16px", margin: 0, fontWeight: "800", textTransform: "capitalize", lineHeight: 1.2 }}>
                                {mision.categoria}
                            </h3>
                            <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: '600', display: 'block', marginTop: '2px' }}>
                                ID: {mision.identificador || mision.id || 'N/A'}
                            </span>
                        </div>
                    </div>
                    <Badge text={mision.estado} color={getBadgeColor(mision.estado)} />
                </div>

                <div style={{ padding: "0 20px 20px 20px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                    <p style={{ 
                        color: "var(--text-light)", 
                        fontSize: "13px", 
                        lineHeight: "1.5", 
                        margin: "0 0 16px 0", 
                        wordBreak: "break-word",
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                    }}>
                        {mision.descripcion || "Sin descripción adicional."}
                    </p>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '16px',
                        marginBottom: '20px'
                    }}>
                        <div>
                            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-light)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ubicación</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                <MapPin size={14} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={mision.ubicacion}>
                                    {mision.ubicacion}
                                </span>
                            </div>
                        </div>
                        <div>
                            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-light)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fecha</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                <Calendar size={14} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-dark)' }}>{mision.fecha_programada}</span>
                            </div>
                        </div>
                        <div>
                            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-light)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dron</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                <Clock size={14} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={mision.dron_asignado}>
                                    {mision.dron_asignado || 'N/A'}
                                </span>
                            </div>
                        </div>
                        {!isPersonal && mision.cliente_nombre && (
                            <div>
                                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-light)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cliente</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                    <User size={14} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={mision.cliente_nombre}>
                                        {mision.cliente_nombre}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: 'auto', borderTop: '1px solid var(--light-gray)', paddingTop: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            
                            {mision.estado === 'PENDIENTE' && (
                                <>
                                    <Button variant="primary" size="sm" style={{ flex: 1, display: 'flex', gap: '6px', justifyContent: 'center' }} onClick={() => onStatusChange(mision.id, 'ACEPTADA')}>
                                        <Check size={16} /> Aceptar
                                    </Button>
                                    <Button variant="outline-danger" size="sm" style={{ flex: 1, display: 'flex', gap: '6px', justifyContent: 'center' }} onClick={() => onStatusChange(mision.id, 'RECHAZADA')}>
                                        <X size={16} /> Rechazar
                                    </Button>
                                </>
                            )}

                            {mision.estado === 'ACEPTADA' && (
                                <>
                                    <Button variant="dark" size="sm" style={{ width: '100%', display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '8px' }} onClick={() => onStatusChange(mision.id, 'EN_CURSO')}>
                                        <Play size={16} /> Iniciar Vuelo
                                    </Button>
                                    <Button variant="outline-dark" size="sm" style={{ flex: 1, display: 'flex', gap: '6px', justifyContent: 'center' }} onClick={() => setIsEditing(true)}>
                                        <Edit2 size={16} /> Editar
                                    </Button>
                                    <Button variant="outline-danger" size="sm" style={{ flex: 1, display: 'flex', gap: '6px', justifyContent: 'center' }} onClick={() => setIsCanceling(true)}>
                                        <XCircle size={16} /> Cancelar
                                    </Button>
                                </>
                            )}

                            {mision.estado === 'EN_CURSO' && (
                                <>
                                    <Button variant="success" size="sm" style={{ width: '100%', display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '8px' }} onClick={() => onStatusChange(mision.id, 'COMPLETADA')}>
                                        <CheckCircle size={16} /> Completar Misión
                                    </Button>
                                    <Button variant="outline-dark" size="sm" style={{ flex: 1, display: 'flex', gap: '6px', justifyContent: 'center' }} onClick={() => setIsEditing(true)}>
                                        <Edit2 size={16} /> Editar
                                    </Button>
                                    <Button variant="outline-danger" size="sm" style={{ flex: 1, display: 'flex', gap: '6px', justifyContent: 'center' }} onClick={() => setIsCanceling(true)}>
                                        <XCircle size={16} /> Cancelar
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </article>

            <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title={`Editar Misión MIS-${String(mision.id).padStart(4, '0')}`}>
                <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {errorMsg && <Alert type="danger" title="Error" message={errorMsg} onClose={() => setErrorMsg(null)} />}
                    
                    {!isPersonal && (
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>Cliente</label>
                            <Input name="cliente_nombre" value={editForm.cliente_nombre} onChange={handleEditChange} required />
                        </div>
                    )}
                    
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>Ubicación</label>
                        <Input name="ubicacion" value={editForm.ubicacion} onChange={handleEditChange} required />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>Fecha</label>
                            <Input type="date" name="fecha_programada" value={editForm.fecha_programada} onChange={handleEditChange} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>Área / Tamaño</label>
                            <Input name="area_size" value={editForm.area_size} onChange={handleEditChange} />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>Dron Asignado</label>
                        <Input name="dron_asignado" value={editForm.dron_asignado} onChange={handleEditChange} required />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>Cultivo / Categoría</label>
                        <Input name="categoria" value={editForm.categoria} onChange={handleEditChange} required />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>Descripción</label>
                        <textarea 
                            name="descripcion" 
                            value={editForm.descripcion} 
                            onChange={handleEditChange}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--light-gray)', minHeight: '80px', fontFamily: 'inherit' }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                        <Button variant="outline-dark" type="button" onClick={() => setIsEditing(false)}>Cancelar</Button>
                        <Button variant="primary" type="submit" disabled={isSaving}>
                            {isSaving ? 'Guardando...' : <><Save size={16} style={{ marginRight: '6px' }}/> Guardar</>}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isCanceling} onClose={() => setIsCanceling(false)} title="Confirmar Cancelación">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-danger)' }}>
                        <AlertTriangle size={32} />
                        <h3 style={{ margin: 0, fontSize: '18px' }}>¿Estás seguro de cancelar esta misión?</h3>
                    </div>
                    
                    <div style={{ backgroundColor: 'var(--bg-color)', padding: '16px', borderRadius: '8px', border: '1px solid var(--light-gray)' }}>
                        <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}><strong>Identificador:</strong> MIS-{String(mision.id).padStart(4, '0')}</p>
                        {!isPersonal && <p style={{ margin: 0, fontSize: '14px' }}><strong>Cliente:</strong> {mision.cliente_nombre}</p>}
                    </div>

                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-light)' }}>
                        Esta acción no se puede deshacer y la misión se retirará de tu lista activa.
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                        <Button variant="outline-dark" onClick={() => setIsCanceling(false)}>Volver</Button>
                        <Button variant="danger" onClick={handleConfirmCancel}>Sí, cancelar misión</Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};