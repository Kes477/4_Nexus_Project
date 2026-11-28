import React, { useState, useEffect, useCallback } from 'react';
import { Input, Modal, Alert, Loader, Button } from '../../components/ui';
import ChatSidebar from '../../components/chat/ChatSidebar';
import ChatWindow from '../../components/chat/ChatWindow';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function TecnicoSoporte() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  
  const [requests, setRequests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [warningMsg, setWarningMsg] = useState(null);

  const [targetEmail, setTargetEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const token = localStorage.getItem('access_token');
  const currentUserEmail = localStorage.getItem('user_email') || '';

  const fetchDatos = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [reqRes, roomsRes] = await Promise.all([
        fetch(`${API_URL}/mensajeria/requests/`, { headers }),
        fetch(`${API_URL}/mensajeria/rooms/`, { headers })
      ]);

      if (reqRes.ok) {
        const data = await reqRes.json();
        setRequests(Array.isArray(data) ? data : data.results || []);
      }
      if (roomsRes.ok) {
        const data = await roomsRes.json();
        const roomsList = Array.isArray(data) ? data : data.results || [];
        setRooms(roomsList);
      }
    } catch {
      setErrorMsg('Error al cargar los datos.');
    } finally {
      setLoading(false);
    }
  }, [API_URL, token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDatos();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchDatos]);

  const handleSetActiveRoom = (roomId) => {
    setActiveRoomId(roomId);
    if (roomId) {
      setRooms(prevRooms => 
        prevRooms.map(room => 
          room.id === roomId ? { ...room, unread_count: 0 } : room
        )
      );
    }
  };

  useEffect(() => {
    if (!activeRoomId || !token) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch(`${API_URL}/mensajeria/messages/?room=${activeRoomId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setMessages(Array.isArray(data) ? data : data.results || []);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [activeRoomId, API_URL, token]);

  const handleSendRequest = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setWarningMsg(null);

    if (!EMAIL_REGEX.test(targetEmail)) {
      setErrorMsg('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/mensajeria/requests/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ receiver_email: targetEmail })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.receiver_email ? data.receiver_email[0] : 'Error al enviar la solicitud.');
      }

      if (data.status === 'exists') {
        setWarningMsg('Ya tienes un chat activo con este usuario.');
        setIsModalOpen(false);
        setTargetEmail('');
        await fetchDatos();
        if (data.room_id) handleSetActiveRoom(data.room_id);
        return;
      }

      if (data.status === 'pending') {
        setWarningMsg('Ya enviaste una solicitud pendiente a este usuario.');
        setIsModalOpen(false);
        setTargetEmail('');
        return;
      }

      setSuccessMsg('Solicitud de chat enviada correctamente.');
      setIsModalOpen(false);
      setTargetEmail('');
      fetchDatos();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestAction = async (id, action) => {
    try {
      const response = await fetch(`${API_URL}/mensajeria/requests/${id}/${action}/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Error al procesar la solicitud.');

      setSuccessMsg(`Solicitud ${action === 'accept' ? 'aceptada' : 'rechazada'} correctamente.`);
      await fetchDatos();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleSendMessage = async (text) => {
    if (!text.trim() || !activeRoomId) return;

    try {
      const response = await fetch(`${API_URL}/mensajeria/messages/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          room: activeRoomId,
          content: text
        })
      });

      if (response.ok) {
        const res = await fetch(`${API_URL}/mensajeria/messages/?room=${activeRoomId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(Array.isArray(data) ? data : data.results || []);
        }
      }
    } catch {
      setErrorMsg('Error al enviar el mensaje.');
    }
  };

  const handleEditMessage = async (messageId, newText) => {
    try {
      const response = await fetch(`${API_URL}/mensajeria/messages/${messageId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newText })
      });

      if (response.ok) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, content: newText, is_editable: true } : msg
        ));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const activeRoom = rooms.find(r => r.id === activeRoomId);
  const pendingRequests = requests.filter(r => r.status === 'PENDING' && r.sender_email !== currentUserEmail);

  if (loading && rooms.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-color)' }}>
        <Loader text="Cargando mensajería..." />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', width: '100%', height: 'calc(100vh - 100px)', backgroundColor: 'var(--bg-color)', fontFamily: "'Roboto', sans-serif", overflow: 'hidden', borderRadius: '12px', border: '1px solid var(--light-gray)', margin: '0 auto', maxWidth: '1400px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }
      `}</style>

      <ChatSidebar
        rooms={rooms}
        pendingRequests={pendingRequests}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeRoomId={activeRoomId}
        setActiveRoomId={handleSetActiveRoom}
        onNewChat={() => setIsModalOpen(true)}
        onRequestAction={handleRequestAction}
      />

      <ChatWindow
        activeRoom={activeRoom}
        messages={messages}
        currentUserEmail={currentUserEmail}
        onSendMessage={handleSendMessage}
        onEditMessage={handleEditMessage}
      />

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setTargetEmail(''); setErrorMsg(null); setSuccessMsg(null); setWarningMsg(null); }} title="Nuevo Chat">
        <form onSubmit={handleSendRequest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {errorMsg && <Alert type="danger" message={errorMsg} onClose={() => setErrorMsg(null)} />}
          
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-light)', marginBottom: '6px', textTransform: 'uppercase' }}>Correo del Usuario</label>
            <Input 
              type="email" 
              placeholder="ejemplo@correo.com" 
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              required 
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', marginTop: '8px' }}>
            <Button variant="outline-dark" size="sm" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" size="sm" type="submit" disabled={isSubmitting || !targetEmail}>
              {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
            </Button>
          </div>
        </form>
      </Modal>

      {successMsg && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000, width: '350px' }}>
          <Alert type="success" title="Éxito" message={successMsg} onClose={() => setSuccessMsg(null)} />
        </div>
      )}

      {warningMsg && (
        <div style={{ position: 'fixed', bottom: '90px', right: '24px', zIndex: 1000, width: '350px' }}>
          <Alert type="warning" title="Aviso" message={warningMsg} onClose={() => setWarningMsg(null)} />
        </div>
      )}
    </div>
  );
}