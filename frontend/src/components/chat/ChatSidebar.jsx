import React from 'react';
import { Search, UserPlus, Check, X } from 'lucide-react';
import { Button, Badge, Avatar, Tabs } from '../ui';

export default function ChatSidebar({
  rooms,
  pendingRequests,
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
  activeRoomId,
  setActiveRoomId,
  onNewChat,
  onRequestAction
}) {
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.other_user_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          room.other_user_email.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeTab === 1) return room.unread_count > 0;
    if (activeTab === 2) return room.unread_count === 0;
    return true;
  });

  return (
    <aside style={{ width: '350px', backgroundColor: 'var(--white)', borderRight: '1px solid var(--light-gray)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '20px 20px 10px 20px', borderBottom: '1px solid var(--light-gray)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: 'var(--color-dark)' }}>Mensajes</h2>
          <Button variant="primary" size="sm" onClick={onNewChat}>
            <UserPlus size={14} style={{ marginRight: '6px' }} /> Nuevo
          </Button>
        </div>

        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input 
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid var(--light-gray)', borderRadius: '8px', fontSize: '13px', outline: 'none', transition: 'border-color 0.2s' }}
            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--light-gray)'}
          />
        </div>

        <Tabs 
          tabs={['Todos', 'No leídos', 'Leídos']} 
          activeTab={activeTab} 
          onChange={(index) => setActiveTab(index)} 
        />
      </div>

      <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
        {pendingRequests.length > 0 && (
          <div style={{ padding: '12px', backgroundColor: 'var(--bg-color)', borderBottom: '1px solid var(--light-gray)' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: '800', color: 'var(--text-light)', textTransform: 'uppercase' }}>Solicitudes Pendientes</p>
            {pendingRequests.map(req => (
              <div key={req.id} style={{ backgroundColor: 'var(--white)', padding: '12px', borderRadius: '8px', border: '1px solid var(--light-gray)', marginBottom: '8px' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 'bold', color: 'var(--color-dark)' }}>{req.sender_name}</p>
                <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--text-light)' }}>{req.sender_email}</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button variant="primary" size="sm" onClick={() => onRequestAction(req.id, 'accept')} style={{ flex: 1 }}>
                    <Check size={12} style={{ marginRight: '4px' }}/> Aceptar
                  </Button>
                  <Button variant="outline-dark" size="sm" onClick={() => onRequestAction(req.id, 'reject')} style={{ flex: 1 }}>
                    <X size={12} style={{ marginRight: '4px' }}/> Rechazar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredRooms.length > 0 ? (
          filteredRooms.map(chat => {
            const isActive = activeRoomId === chat.id;
            return (
              <div 
                key={chat.id}
                onClick={() => setActiveRoomId(chat.id)}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-color)'; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', cursor: 'pointer',
                  backgroundColor: isActive ? 'rgba(4, 201, 166, 0.08)' : 'transparent',
                  borderBottom: '1px solid var(--light-gray)', transition: 'background-color 0.2s'
                }}
              >
                <Avatar size="sm" imageUrl={chat.other_user_avatar} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '14px', color: isActive ? 'var(--color-primary)' : 'var(--color-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chat.other_user_name}</span>
                    {chat.unread_count > 0 && (
                      <Badge text={chat.unread_count.toString()} color="primary" />
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-light)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chat.other_user_email}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-light)', fontSize: '13px' }}>No hay conversaciones.</div>
        )}
      </div>
    </aside>
  );
}