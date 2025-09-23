import React, { useEffect, useRef } from 'react';
import Message from './Message';

export default function MessageList({ messages }) {
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-window">
      {messages.map((msg, index) => (
        <Message key={index} who={msg.who} text={msg.text} />
      ))}
      <div ref={endOfMessagesRef} />
    </div>
  );
}