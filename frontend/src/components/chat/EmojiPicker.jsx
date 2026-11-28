import React from 'react';

const EMOJIS = ['😀', '😂', '😍', '😎', '😭', '😡', '👍', '👎', '🙏', '👏', '🔥', '💯', '✅', '❌', '🎉', '💡', '🚀', '❤️', '💔', '⭐'];

export default function EmojiPicker({ onSelect }) {
  return (
    <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: '8px', background: 'var(--white)', border: '1px solid var(--light-gray)', borderRadius: '8px', padding: '10px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', zIndex: 10 }}>
      {EMOJIS.map((emoji, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onSelect(emoji)}
          style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', padding: '4px', borderRadius: '4px', transition: 'background 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-color)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}