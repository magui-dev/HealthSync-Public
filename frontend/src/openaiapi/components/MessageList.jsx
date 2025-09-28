// import React, { useEffect, useRef } from 'react';
// import Message from './Message';

// export default function MessageList({ messages }) {
//   const endOfMessagesRef = useRef(null);

//   useEffect(() => {
//     endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   return (
//     <div className="chat-window">
//       {messages.map((msg, index) => (
//         <Message key={index} who={msg.who} text={msg.text} />
//       ))}
//       <div ref={endOfMessagesRef} />
//     </div>
//   );
// }

import React, { useEffect, useRef } from 'react';
import Message from './Message';
import ReactMarkdown from 'react-markdown'; // 1. react-markdown 라이브러리를 import 합니다.

export default function MessageList({ messages }) {
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-window">
      {messages.map((msg, index) => (
        // 2. Message 컴포넌트에 text를 전달하기 전에, msg.who가 'ai'인지 확인합니다.
        <Message
          key={index}
          who={msg.who}
          // ✅ AI의 메시지이면 ReactMarkdown으로 감싸고, 사용자 메시지이면 그대로 전달합니다.
          text={msg.who === 'ai' ? <ReactMarkdown>{msg.text}</ReactMarkdown> : msg.text}
        />
      ))}
      <div ref={endOfMessagesRef} />
    </div>
  );
}