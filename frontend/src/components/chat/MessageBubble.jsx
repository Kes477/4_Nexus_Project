import React, { useState } from 'react';
import { Copy, Check, Edit2 } from 'lucide-react';

const isOnlyEmojis = (str) => {
  const trimmed = str.trim();
  if (!trimmed) return false;
  return !/[a-zA-Z0-9]/.test(trimmed);
};

export default function MessageBubble({ message, isMe, onEditClick }) {
  const [isCopied, setIsCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const emojiOnly = isOnlyEmojis(message.content);
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div 
      style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', width: '100%' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '83.333%' }}>
        
        {emojiOnly ? (
          <div style={{ position: 'relative' }}>
            <span style={{ fontSize: '48px', lineHeight: '1.2', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
              {message.content}
            </span>
            
            <div style={{ 
              position: 'absolute', 
              top: '-10px', 
              right: isMe ? 'auto' : '-40px', 
              left: isMe ? '-40px' : 'auto',
              display: 'flex', 
              gap: '4px',
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.2s',
              backgroundColor: 'var(--white)',
              padding: '4px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              pointerEvents: isHovered ? 'auto' : 'none'
            }}>
              <button onClick={handleCopy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: '2px', display: 'flex' }} title="Copiar">
                {isCopied ? <Check size={14} color="var(--color-success)" /> : <Copy size={14} />}
              </button>
              {isMe && message.is_editable && (
                <button onClick={() => onEditClick(message)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: '2px', display: 'flex' }} title="Editar">
                  <Edit2 size={14} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginTop: '4px' }}>
              <span style={{ backgroundColor: 'var(--color-success)', color: 'white', fontSize: '10px', fontWeight: '500', padding: '2px 6px', borderRadius: '10px', display: 'inline-block' }}>
                {time}
              </span>
            </div>
          </div>
        ) : (
          <div style={{ 
            position: 'relative',
            padding: '12px 16px', 
            borderRadius: '12px', 
            backgroundColor: isMe ? 'var(--color-primary)' : 'var(--white)', 
            color: isMe ? 'var(--white)' : 'var(--color-dark)', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)', 
            border: isMe ? 'none' : '1px solid var(--light-gray)', 
            borderBottomRightRadius: isMe ? '2px' : '12px', 
            borderBottomLeftRadius: isMe ? '12px' : '2px',
            wordBreak: 'break-word',
            overflowWrap: 'anywhere',
            minWidth: '80px'
          }}>
            <div style={{ 
              position: 'absolute', 
              top: '4px', 
              right: '6px', 
              display: 'flex', 
              gap: '4px',
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.2s',
              pointerEvents: isHovered ? 'auto' : 'none'
            }}>
              <button onClick={handleCopy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isMe ? 'rgba(255,255,255,0.7)' : 'var(--text-light)', padding: '2px', display: 'flex' }} title="Copiar">
                {isCopied ? <Check size={12} color={isMe ? "white" : "var(--color-success)"} /> : <Copy size={12} />}
              </button>
              {isMe && message.is_editable && (
                <button onClick={() => onEditClick(message)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isMe ? 'rgba(255,255,255,0.7)' : 'var(--text-light)', padding: '2px', display: 'flex' }} title="Editar">
                  <Edit2 size={12} />
                </button>
              )}
            </div>

            <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap', paddingRight: '24px' }}>{message.content}</p>
            
            <span style={{ display: 'block', textAlign: 'right', fontSize: '10px', marginTop: '6px', fontWeight: '500', color: isMe ? 'rgba(255,255,255,0.8)' : 'var(--text-light)' }}>
              {time}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}