import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile } from 'lucide-react';
import { Button } from '../ui';
import EmojiPicker from './EmojiPicker';

export default function MessageInput({ onSend, disabled }) {
  const [input, setInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef(null);
  const emojiRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
      const scrollHeight = textareaRef.current.scrollHeight;
      if (scrollHeight > 40) {
        textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
      }
    }
  }, [input]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || disabled || input.length > 160) return;
    onSend(input);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji) => {
    if (input.length + emoji.length <= 160) {
      setInput((prev) => prev + emoji);
    }
  };

  return (
    <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', position: 'relative' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '40px' }} ref={emojiRef}>
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Smile size={24} />
        </button>
        {showEmojiPicker && <EmojiPicker onSelect={handleEmojiSelect} />}
      </div>
      <div style={{ flex: 1, position: 'relative', display: 'flex' }}>
        <textarea 
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu mensaje aquí..." 
          className="custom-scrollbar"
          rows={1}
          maxLength={160}
          style={{ 
            width: '100%', 
            padding: '9px 16px', 
            border: '1px solid var(--light-gray)', 
            borderRadius: '8px', 
            fontSize: '14px', 
            outline: 'none', 
            backgroundColor: 'var(--bg-color)', 
            transition: 'border-color 0.2s',
            resize: 'none',
            height: '40px',
            maxHeight: '120px',
            overflowY: 'auto',
            fontFamily: 'inherit',
            lineHeight: '20px',
            boxSizing: 'border-box',
            paddingRight: '60px'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--light-gray)'}
        />
        <span style={{ 
          position: 'absolute', 
          right: '12px', 
          bottom: '10px', 
          fontSize: '10px', 
          fontWeight: 'bold',
          color: input.length >= 150 ? 'var(--color-danger)' : 'var(--text-light)'
        }}>
          {input.length}/160
        </span>
      </div>
      <Button variant="primary" type="submit" size="sm" disabled={!input.trim() || disabled || input.length > 160} style={{ height: '40px', padding: '0 20px', boxSizing: 'border-box' }}>
        <Send size={14} style={{ marginRight: '6px' }} /> Enviar
      </Button>
    </form>
  );
}