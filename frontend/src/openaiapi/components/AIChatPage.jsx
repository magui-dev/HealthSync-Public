// import React, { useState } from "react";
// import MessageList from "./MessageList";
// import MessageInput from "./MessageInput";
// import "./AIChat.css";

// // 선택한 리포트를 기준으로 질문하고 싶을 때, 부모에서 selectedReport를 내려주세요.
// export default function AIChatPage({ selectedReport }) {
//   const [messages, setMessages] = useState([
//     { who: "ai", text: "안녕하세요! HealthSync AI 어시스턴트입니다." }
//   ]);
//   const [isLoading, setIsLoading] = useState(false);

//   const handleSendMessage = async (userInput) => {
//     if (!userInput || isLoading) return;

//     const userMessage = { who: "user", text: userInput };
//     const loadingMessage = { who: "ai", text: "답변을 생성 중입니다..." };
//     setMessages((prev) => [...prev, userMessage, loadingMessage]);
//     setIsLoading(true);

//     try {
//       const token = localStorage.getItem("accessToken");

//       const headers = {
//         "Content-Type": "application/json",
//         ...(token && { Authorization: `Bearer ${token}` }),
//       };

//       // ✅ 선택된 리포트 ID를 함께 전송
//       // const res = await fetch("/api/chat", {
//       //   method: "POST",
//       //   headers,
//       //   credentials: "include", // 쿠키 인증이면 유지, JWT만 쓰면 제거 가능
//       //   body: JSON.stringify({
//       //     message: userInput,
//       //     reportId: selectedReport?.id ?? null, // 서버 ChatRequest.reportId로 매핑
//       //   })
//       // });
//       const res = await fetch("/api/chat", {
//         method: "POST",
//         headers,
//         credentials: "include", 
//         body: JSON.stringify({
//           message: userInput,
//           reportContext: selectedReport, 
//         })
//       });


//       if (!res.ok) {
//         if (res.status === 401 || res.status === 403) {
//           throw new Error("로그인이 필요하거나 권한이 없습니다.");
//         }
//         throw new Error("서버에서 오류가 발생했습니다.");
//       }

//       const data = await res.json(); // { answer: string }
//       const aiResponse = { who: "ai", text: data.answer };
//       setMessages((prev) => [...prev.slice(0, -1), aiResponse]);

//     } catch (error) {
//       console.error("AI 응답 처리 중 오류:", error);
//       const errorMessage = { who: "ai", text: `오류: ${error.message}` };
//       setMessages((prev) => [...prev.slice(0, -1), errorMessage]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="chat-shell">
//       <div className="chat-header">
//         HealthSync AI
//         {selectedReport?.title && (
//           <span style={{ marginLeft: 8, fontSize: 12, color: "#888" }}>
//             (리포트: {selectedReport.title})
//           </span>
//         )}
//       </div>

//       {!selectedReport && (
//         <div style={{ padding: 12, fontSize: 13, color: "#666" }}>
//           왼쪽에서 “나의 리포트”를 선택하면 해당 리포트 기준으로 답변해 드려요.
//         </div>
//       )}

//       <MessageList messages={messages} />
//       <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
//     </div>
//   );
// }


// AIChatPage.js

import React, { useState } from "react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import "./AIChat.css";

export default function AIChatPage({ selectedReport }) {
  const [messages, setMessages] = useState([
    { who: "ai", text: "안녕하세요! HealthSync AI 어시스턴트입니다." }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (userInput) => {
    // isLoading 외에 selectedReport가 없을 때도 전송을 막는 가드 추가
    if (!userInput || isLoading || !selectedReport) return;

    const userMessage = { who: "user", text: userInput };
    const loadingMessage = { who: "ai", text: "답변을 생성 중입니다..." };
    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    setIsLoading(true);

    try {
      const token = localStorage.getItem("accessToken");
      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      };
      const res = await fetch("/api/chat", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          message: userInput,
          reportContext: selectedReport,
        })
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error("로그인이 필요하거나 권한이 없습니다.");
        }
        throw new Error("서버에서 오류가 발생했습니다.");
      }
      const data = await res.json();
      const aiResponse = { who: "ai", text: data.answer };
      setMessages((prev) => [...prev.slice(0, -1), aiResponse]);

    } catch (error) {
      console.error("AI 응답 처리 중 오류:", error);
      const errorMessage = { who: "ai", text: `오류: ${error.message}` };
      setMessages((prev) => [...prev.slice(0, -1), errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-shell">
      <div className="chat-header">
        HealthSync AI
        {selectedReport?.targetWeightKg && ( // title 대신 존재하는 필드로 변경
          <span style={{ marginLeft: 8, fontSize: 12, color: "#888" }}>
            (목표: {selectedReport.targetWeightKg.toFixed(1)}kg)
          </span>
        )}
      </div>

      {!selectedReport && (
        <div style={{ padding: 12, fontSize: 13, color: "#666" }}>
          왼쪽에서 “내 목표 목록 보기”를 선택하면 해당 리포트 기준으로 답변해 드려요.
        </div>
      )}

      <MessageList messages={messages} />
      {/* ✅ isLoading 외에 !selectedReport 조건도 추가하여 데이터가 없으면 입력창을 비활성화 */}
      <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading || !selectedReport} />
    </div>
  );
}