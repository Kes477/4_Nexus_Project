import React, { useState } from 'react';
import { FileText, CheckCircle2, Search, Send } from 'lucide-react';

import { Button, Input, Select, Modal, Avatar, Badge, IconButton } from '../../components/ui';

export default function AdminSoporte() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChatId, setActiveChatId] = useState(1);
  const [messageInput, setMessageInput] = useState("");

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

  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    chat.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      height: 'calc(100vh - 100px)',
      backgroundColor: 'var(--bg-color)',
      fontFamily: "'Roboto', sans-serif",
      overflow: 'hidden',
      borderRadius: '12px',
      border: '1px solid var(--light-gray)',
      margin: '0 auto',
      maxWidth: '1400px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
    }}>
      
      <aside style={{ 
        width: '350px', 
        backgroundColor: 'var(--white)', 
        borderRight: '1px solid var(--light-gray)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0
      }}>
        
        <div style={{ padding: '20px', borderBottom: '1px solid var(--light-gray)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: 'var(--color-dark)' }}>Panel de Soporte</h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-light)' }}>Atención a granjeros y pilotos</p>
            </div>
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)} style={{ padding: '8px 12px', borderRadius: '8px' }}>
              <FileText size={14} style={{ marginRight: '6px' }} /> Ticket
            </Button>
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
            <input 
              type="text"
              placeholder="Buscar cliente o rol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                width: '100%', padding: '10px 12px 10px 36px', 
                border: '1px solid var(--light-gray)', borderRadius: '8px', 
                fontSize: '13px', outline: 'none', transition: 'border-color 0.2s' 
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--light-gray)'}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredChats.length > 0 ? (
            filteredChats.map(chat => {
              const lastMsg = chat.messages[chat.messages.length - 1];
              const isActive = activeChatId === chat.id;
              return (
                <div 
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', cursor: 'pointer',
                    backgroundColor: isActive ? 'rgba(4, 201, 166, 0.05)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                    borderBottom: '1px solid var(--light-gray)', transition: 'all 0.2s'
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <Avatar size="sm" imageUrl={chat.avatar} />
                    <div style={{ 
                      position: 'absolute', bottom: 0, right: 0, 
                      width: '12px', height: '12px', 
                      backgroundColor: chat.online ? 'var(--color-success)' : 'var(--light-gray)', 
                      borderRadius: '50%', border: '2px solid var(--white)' 
                    }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--color-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chat.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: '500' }}>{lastMsg?.time}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-primary)', fontWeight: '600', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chat.role}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-light)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {lastMsg?.sender === 'admin' ? 'Tú: ' : ''}
                      {lastMsg?.text}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-light)', fontSize: '13px' }}>No se encontraron chats.</div>
          )}
        </div>
      </aside>

      <main style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: 'var(--bg-color)',
        position: 'relative'
      }}>
        
        <header style={{ 
          padding: '16px 24px', 
          backgroundColor: 'var(--white)', 
          borderBottom: '1px solid var(--light-gray)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Avatar size="sm" imageUrl={activeChat.avatar} />
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--color-dark)' }}>{activeChat.name}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>{activeChat.role}</span>
                {activeChat.online ? (
                  <Badge text="En línea" color="success" />
                ) : (
                  <Badge text="Desconectado" color="warning" />
                )}
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <IconButton icon="fa-phone" variant="outline" onClick={() => {}} />
            <IconButton icon="fa-video" variant="outline" onClick={() => {}} />
            <IconButton icon="fa-ellipsis-v" variant="outline" onClick={() => {}} />
          </div>
        </header>

        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          backgroundImage: 'radial-gradient(var(--light-gray) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}>
          {activeChat.messages.map(msg => {
            const isAdmin = msg.sender === 'admin';
            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}>
                {!isAdmin && (
                  <Avatar size="sm" imageUrl={activeChat.avatar} style={{ marginRight: '8px', width: '28px', height: '28px', alignSelf: 'flex-end', marginBottom: '4px' }} />
                )}
                <div style={{ 
                  maxWidth: '70%', 
                  padding: '12px 16px', 
                  borderRadius: '12px',
                  backgroundColor: isAdmin ? 'var(--color-primary)' : 'var(--white)',
                  color: isAdmin ? 'var(--white)' : 'var(--color-dark)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  border: isAdmin ? 'none' : '1px solid var(--light-gray)',
                  borderBottomRightRadius: isAdmin ? '2px' : '12px',
                  borderBottomLeftRadius: isAdmin ? '12px' : '2px'
                }}>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>{msg.text}</p>
                  <span style={{ 
                    display: 'block', textAlign: 'right', fontSize: '10px', marginTop: '6px', fontWeight: '500',
                    color: isAdmin ? 'rgba(255,255,255,0.8)' : 'var(--text-light)'
                  }}>
                    {msg.time}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <footer style={{ 
          padding: '16px 24px', 
          backgroundColor: 'var(--white)', 
          borderTop: '1px solid var(--light-gray)',
          flexShrink: 0
        }}>
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <IconButton icon="fa-paperclip" variant="outline" onClick={() => {}} />
            <div style={{ flex: 1, position: 'relative' }}>
              <input 
                type="text"
                placeholder="Escribe una respuesta como administrador..." 
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                style={{ 
                  width: '100%', padding: '12px 16px', 
                  border: '1px solid var(--light-gray)', borderRadius: '24px', 
                  fontSize: '14px', outline: 'none', backgroundColor: 'var(--bg-color)',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--light-gray)'}
              />
            </div>
            <Button variant="primary" type="submit" style={{ padding: '10px 20px', borderRadius: '24px' }}>
              <Send size={16} style={{ marginRight: '6px' }} /> Enviar
            </Button>
          </form>
        </footer>
      </main>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setIsSubmitted(false); }} title="Registrar Ticket Interno">
        {!isSubmitted ? (
          <form onSubmit={(e) => { e.preventDefault(); setIsSubmitted(true); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-light)', marginBottom: '6px', textTransform: 'uppercase' }}>Cliente / Granjero</label>
              <Input placeholder="Nombre del cliente..." required />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-light)', marginBottom: '6px', textTransform: 'uppercase' }}>Categoría del Problema</label>
              <Select 
                options={[
                  { value: "soporte", label: "Soporte Técnico - Drones" },
                  { value: "telemetria", label: "Falla en Telemetría IoT" },
                  { value: "facturacion", label: "Facturación y Licencias" }
                ]} 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-light)', marginBottom: '6px', textTransform: 'uppercase' }}>Descripción del problema</label>
              <textarea 
                rows={4}
                placeholder="Escribe los detalles aquí..."
                required
                style={{
                  width: '100%', padding: '12px 15px',
                  border: '1px solid var(--light-gray)', borderRadius: '8px',
                  fontSize: '14px', color: 'var(--color-dark)',
                  fontFamily: "'Roboto', sans-serif", outline: 'none',
                  resize: 'vertical', minHeight: '100px',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--light-gray)'}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--light-gray)', marginTop: '8px' }}>
              <Button variant="outline-dark" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button variant="primary" type="submit">Guardar Ticket</Button>
            </div>
          </form>
        ) : (
          <div style={{ padding: '24px 0', textAlign: 'center' }}>
            <div style={{ background: 'rgba(4, 201, 166, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle2 size={32} color="var(--color-primary)" />
            </div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', color: 'var(--color-dark)' }}>¡Ticket Registrado!</h4>
            <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: 'var(--text-light)' }}>El ticket ha sido asignado al equipo técnico.</p>
            <Button variant="primary" onClick={() => { setIsModalOpen(false); setIsSubmitted(false); }}>
              Cerrar Ventana
            </Button>
          </div>
        )}
      </Modal>

    </div>
  );
}