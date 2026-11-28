import React, { useRef, useEffect, useState } from 'react';
import { MessageSquare, X, Save } from 'lucide-react';
import { Avatar, Badge, Modal, Button, Alert } from '../ui';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

const EMOJIS = ['😀', '😂', '😍', '😎', '😭', '😡', '👍', '👎', '🙏', '👏', '🔥', '💯', '✅', '❌', '🎉', '💡', '🚀', '❤️', '💔', '⭐'];

const isOnlyEmojis = (str) => {
  const trimmed = str.trim();
  if (!trimmed) return false;
  return !/[a-zA-Z0-9]/.test(trimmed);
};

export default function ChatWindow({ activeRoom, messages, currentUserEmail, onSendMessage, onEditMessage }) {
  const messagesContainerRef = useRef(null);
  const prevMessagesLength = useRef(0);
  const prevRoomId = useRef(null);

  const [messageToEdit, setMessageToEdit] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState(null);

  useEffect(() => {
    if (!messagesContainerRef.current) return;

    const roomChanged = prevRoomId.current !== activeRoom?.id;
    const lastMsg = messages[messages.length - 1];
    const isMyMessage = lastMsg && lastMsg.sender_email === currentUserEmail;
    const hasNewMessage = messages.length > prevMessagesLength.current;

    if (roomChanged) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    } else if (hasNewMessage && isMyMessage) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }

    prevMessagesLength.current = messages.length;
    prevRoomId.current = activeRoom?.id;
  }, [messages, activeRoom?.id, currentUserEmail]);

  const handleCloseEdit = () => {
    if (isSaving) return;
    setMessageToEdit(null);
    setEditContent('');
    setEditError(null);
  };

  const handleOpenEdit = (message) => {
    setMessageToEdit(message);
    setEditContent(message.content);
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    
    setIsSaving(true);
    setEditError(null);

    const success = await onEditMessage(messageToEdit.id, editContent);
    
    setIsSaving(false);
    if (success) {
      handleCloseEdit();
    } else {
      setEditError('No se pudo editar el mensaje. Es posible que hayan pasado más de 5 minutos.');
    }
  };

  const isEditingEmoji = messageToEdit ? isOnlyEmojis(messageToEdit.content) : false;

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)', position: 'relative' }}>
      {activeRoom ? (
        <>
          <header style={{ padding: '16px 24px', backgroundColor: 'var(--white)', borderBottom: '1px solid var(--light-gray)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <Avatar size="sm" imageUrl={activeRoom.other_user_avatar} />
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--color-dark)' }}>{activeRoom.other_user_name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>{activeRoom.other_user_email}</span>
                  <Badge text="En línea" color="success" />
                </div>
              </div>
            </div>
          </header>

          <div 
            ref={messagesContainerRef}
            className="custom-scrollbar"
            style={{ 
              flex: 1, 
              overflowY: 'auto', 
              overflowX: 'hidden', 
              padding: '24px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px', 
              backgroundColor: '#ffffff',
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0, 0, 0, 0.15) 1px, transparent 0)',
              backgroundSize: '20px 20px'
            }}
          >
            {messages.map(msg => (
              <MessageBubble 
                key={msg.id} 
                message={msg} 
                isMe={msg.sender_email === currentUserEmail} 
                onEditClick={handleOpenEdit}
              />
            ))}
          </div>

          <footer style={{ padding: '16px 24px', backgroundColor: 'var(--white)', borderTop: '1px solid var(--light-gray)', flexShrink: 0 }}>
            <MessageInput onSend={onSendMessage} disabled={!activeRoom} />
          </footer>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-light)' }}>
          <MessageSquare size={64} style={{ opacity: 0.2, marginBottom: '16px' }} />
          <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-dark)', fontSize: '18px' }}>Tus Mensajes</h3>
          <p style={{ margin: 0, fontSize: '14px' }}>Selecciona una conversación o crea una nueva.</p>
        </div>
      )}

      <Modal isOpen={!!messageToEdit} onClose={handleCloseEdit} title={isEditingEmoji ? "Editar Emoji" : "Editar Mensaje"}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {editError && (
            <Alert type="danger" title="Atención" message={editError} onClose={() => setEditError(null)} />
          )}

          {messageToEdit && (
            <div style={{ 
              padding: '16px', 
              backgroundColor: 'var(--bg-color)', 
              borderRadius: '8px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              border: '1px solid var(--light-gray)'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Mensaje original
              </span>
              <div style={{ 
                fontSize: isEditingEmoji ? '48px' : '14px', 
                color: 'var(--text-light)', 
                textAlign: 'center',
                wordBreak: 'break-word',
                lineHeight: '1.2'
              }}>
                {messageToEdit.content}
              </div>
            </div>
          )}

          {isEditingEmoji ? (
            <div>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-light)', display: 'block', marginBottom: '12px' }}>
                Selecciona el nuevo emoji:
              </span>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(6, 1fr)', 
                gap: '12px',
                backgroundColor: 'var(--white)',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--light-gray)'
              }}>
                {EMOJIS.map((emoji, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setEditContent(emoji)}
                    style={{ 
                      background: editContent === emoji ? 'rgba(4, 201, 166, 0.15)' : 'transparent', 
                      border: editContent === emoji ? '2px solid var(--color-primary)' : '2px solid transparent',
                      borderRadius: '8px',
                      fontSize: '28px', 
                      cursor: 'pointer', 
                      padding: '8px',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => { if(editContent !== emoji) e.currentTarget.style.background = 'var(--bg-color)' }}
                    onMouseLeave={(e) => { if(editContent !== emoji) e.currentTarget.style.background = 'transparent' }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-light)', display: 'block', marginBottom: '8px' }}>
                Escribe el nuevo texto:
              </span>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                maxLength={160}
                rows={4}
                className="custom-scrollbar"
                disabled={isSaving}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  border: '1px solid var(--light-gray)', 
                  fontSize: '14px', 
                  outline: 'none', 
                  resize: 'none',
                  maxHeight: '150px',
                  fontFamily: 'inherit', 
                  lineHeight: '1.5',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: editContent.length >= 150 ? 'var(--color-danger)' : 'var(--text-light)' }}>
                  {editContent.length}/160
                </span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px' }}>
            <Button variant="danger" size="sm" type="button" onClick={handleCloseEdit} disabled={isSaving}>
              <X size={16} style={{ marginRight: '6px' }} /> Cancelar
            </Button>
            <Button variant="primary" size="sm" type="button" onClick={handleSaveEdit} disabled={isSaving || !editContent.trim()}>
              {isSaving ? 'Guardando...' : <><Save size={16} style={{ marginRight: '6px' }} /> Guardar</>}
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}