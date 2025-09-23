import React from 'react';

export default function Message({ who, text }) {
  const messageClass = `msg ${who === 'user' ? 'user' : 'ai'}`;
  return (
    <div className={messageClass}>
      {text}
    </div>
  );
}