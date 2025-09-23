import React, { useState } from 'react';

export default function MessageInput({ onSendMessage, isLoading }) {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="input-area">
      <div className="input-wrapper">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요..."
          disabled={isLoading}
          autoComplete="off"
        />
        <button onClick={handleSubmit} disabled={isLoading}>
          전송
        </button>
      </div>
    </div>
  );
}