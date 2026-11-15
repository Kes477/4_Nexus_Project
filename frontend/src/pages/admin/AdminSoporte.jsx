import React, { useState } from 'react';
import { FileText, CheckCircle2, Search, Phone, Video, MoreVertical, Paperclip, Send, X, ShieldAlert } from 'lucide-react';

// Importación estricta de tus componentes UI
import { Button, Input, Select, Modal, SearchBar, Avatar, Badge, IconButton } from '../../components/ui';

export default function AdminSoporte() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChatId, setActiveChatId] = useState(1);
  const [messageInput, setMessageInput] = useState("");

  // Datos de prueba para la lista de chats
  const [chats, setChats] = useState([
    {
      id: 1,
      name: "Carlos Sosa",
      role: "Granjero - Finca El Naranjal",
      online: true,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      messages: [
        { id: 1, sender: "client", text: "Buenas tardes, tengo una duda con la calibración del sensor NDVI en el dron.", time: "10:30 AM" },
        { id: 2, sender: "admin", text: "¡Hola Carlos! Claro que sí, ¿qué problema estás experimentando exactamente?", time: "10:32 AM" },
        { id: 3, sender: "client", text: "Los valores de biomasa me están saliendo muy bajos en la Parcela 3.", time: "10:35 AM" }
      ]
    },
    {
      id: 2,
      name: "María Rodríguez",
      role: "Granjera - Finca Los Pinos",
      online: false,
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80",
      messages: [
        { id: 1, sender: "client", text: "Estimados, recibí la notificación sobre la renovación del Plan Profesional.", time: "09:10 AM" },
        { id: 2, sender: "admin", text: "Hola María, así es. ¿Deseas que te envíe la factura proforma?", time: "09:15 AM" }
      ]
    },
    {
      id: 3,
      name: "Javier Reyes",
      role: "Piloto Certificado",
      online: true,
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
      messages: [
        { id: 1, sender: "client", text: "Reporto llegada a la base. Misión #MIS-902 completada.", time: "Ayer" }
      ]
    }
  ]);

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];

  // Filtrar chats por búsqueda
  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    chat.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Enviar mensaje simulado
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const newMessage = {
      id: Date.now(),
      sender: "admin",
      text: messageInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChats(prevChats => prevChats.map(chat => 
      chat.id === activeChatId ? { ...chat, messages: [...chat.messages, newMessage] } : chat
    ));
    setMessageInput("");
  };

  return (
    <div style={{ 
      display: 'flex', 
      width: '100%', 
      height: '100vh', 
      backgroundColor: 'var(--bg-color)',
      fontFamily: "'Roboto', sans-serif",
      overflow: 'hidden'
    }}>
      
      {/* ================= BARRA LATERAL: LISTA DE CHATS ================= */}
      <aside style={{ 
        width: '380px', 
        backgroundColor: 'var(--white)', 
        borderRight: '1px solid var(--light-gray)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0
      }}>
        
        {/* Header de la barra lateral */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--light-gray)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: 'var(--color-dark)' }}>Panel de Soporte</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-light)' }}>Atención a granjeros y pilotos</p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
            <FileText size={16} style={{ marginRight: '6px' }} /> Ticket
          </Button>
        </div>

        {/* Buscador */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--light-gray)' }}>
          <SearchBar 
            placeholder="Buscar por nombre o rol..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
          />
        </div>

        {/* Lista de conversaciones */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredChats.length > 0 ? (
            filteredChats.map(chat => (
              <div 
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px 24px',
                  cursor: 'pointer',
                  backgroundColor: activeChatId === chat.id ? 'rgba(4, 201, 166, 0.05)' : 'transparent',
                  borderLeft: activeChatId === chat.id ? '4px solid var(--color-primary)' : '4px solid transparent',
                  borderBottom: '1px solid var(--light-gray)',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ position: 'relative' }}>
                  <Avatar size="sm" imageUrl={chat.avatar} />
                  {chat.online && (
                    <div style={{ 
                      position: 'absolute', bottom: 0, right: 0, 
                      width: '12px', height: '12px', 
                      backgroundColor: 'var(--color-success)', 
                      borderRadius: '50%', border: '2px solid var(--white)' 
                    }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--color-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chat.name}</span>
                  </div>
                  <span style={{ display: 'block', fontSize: '12px', color: 'var(--color-primary)', fontWeight: '600', marginBottom: '4px' }}>{chat.role}</span>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-light)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {chat.messages[chat.messages.length - 1].sender === 'admin' ? 'Tú: ' : ''}
                    {chat.messages[chat.messages.length - 1].text}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-light)' }}>No se encontraron chats.</div>
          )}
        </div>
      </aside>

      {/* ================= ÁREA PRINCIPAL DEL CHAT ================= */}
      <main style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: 'var(--bg-color)'
      }}>
        
        {/* Header del Chat Activo */}
        <header style={{ 
          padding: '16px 32px', 
          backgroundColor: 'var(--white)', 
          borderBottom: '1px solid var(--light-gray)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Avatar size="sm" imageUrl={activeChat.avatar} />
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'var(--color-dark)' }}>{activeChat.name}</h3>
              <div style={{ marginTop: '4px' }}>
                {activeChat.online ? (
                  <Badge text="En línea" color="success" />
                ) : (
                  <Badge text="Desconectado" color="warning" />
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <IconButton icon="fa-phone" variant="outline-dark" onClick={() => {}} />
            <IconButton icon="fa-video" variant="outline-dark" onClick={() => {}} />
            <IconButton icon="fa-ellipsis-v" variant="outline-dark" onClick={() => {}} />
          </div>
        </header>

        {/* Historial de Mensajes */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {activeChat.messages.map(msg => {
            const isAdmin = msg.sender === 'admin';
            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}>
                <div style={{ 
                  maxWidth: '65%', 
                  padding: '16px', 
                  borderRadius: '12px',
                  backgroundColor: isAdmin ? 'var(--color-primary)' : 'var(--white)',
                  color: isAdmin ? 'var(--white)' : 'var(--color-dark)',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                  border: isAdmin ? 'none' : '1px solid var(--light-gray)',
                  borderBottomRightRadius: isAdmin ? '2px' : '12px',
                  borderBottomLeftRadius: isAdmin ? '12px' : '2px'
                }}>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>{msg.text}</p>
                  <span style={{ 
                    display: 'block', 
                    textAlign: 'right', 
                    fontSize: '11px', 
                    marginTop: '8px',
                    color: isAdmin ? 'rgba(255,255,255,0.7)' : 'var(--text-light)'
                  }}>
                    {msg.time}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Caja de Texto para Responder */}
        <footer style={{ 
          padding: '20px 32px', 
          backgroundColor: 'var(--white)', 
          borderTop: '1px solid var(--light-gray)'
        }}>
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '16px' }}>
            <IconButton icon="fa-paperclip" variant="outline" onClick={() => {}} />
            <div style={{ flex: 1 }}>
              <Input 
                placeholder="Escribe una respuesta como administrador..." 
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
              />
            </div>
            <Button variant="primary" type="submit" style={{ padding: '0 24px' }}>
              <Send size={18} style={{ marginRight: '8px' }} /> Enviar
            </Button>
          </form>
        </footer>
      </main>

      {/* ================= MODAL: CREAR TICKET ================= */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setIsSubmitted(false); }} title="Registrar Ticket Interno">
        {!isSubmitted ? (
          <form onSubmit={(e) => { e.preventDefault(); setIsSubmitted(true); }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '8px' }}>Cliente / Granjero</label>
              <Input placeholder="Nombre del cliente..." required />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '8px' }}>Categoría del Problema</label>
              <Select 
                options={[
                  { value: "soporte", label: "Soporte Técnico - Drones" },
                  { value: "telemetria", label: "Falla en Telemetría IoT" },
                  { value: "facturacion", label: "Facturación y Licencias" }
                ]} 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '8px' }}>Descripción del problema</label>
              <textarea 
                rows={4}
                placeholder="Escribe los detalles aquí..."
                required
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  border: '1px solid var(--light-gray)',
                  borderRadius: '6px',
                  fontSize: '16px',
                  color: 'var(--color-dark)',
                  fontFamily: "'Roboto', sans-serif",
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--light-gray)' }}>
              <Button variant="outline-dark" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button variant="primary" type="submit">Guardar Ticket</Button>
            </div>
          </form>
        ) : (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <CheckCircle2 size={48} color="var(--color-success)" style={{ margin: '0 auto 16px' }} />
            <h4 style={{ margin: '0 0 8px 0', fontSize: '20px', color: 'var(--color-dark)' }}>¡Ticket Registrado!</h4>
            <p style={{ margin: '0 0 24px 0', color: 'var(--text-light)' }}>El ticket ha sido asignado al equipo técnico.</p>
            <Button variant="primary" onClick={() => { setIsModalOpen(false); setIsSubmitted(false); }}>
              Cerrar Ventana
            </Button>
          </div>
        )}
      </Modal>

    </div>
  );
}