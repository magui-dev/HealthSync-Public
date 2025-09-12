// 로그인 페이지 
import { useState } from "react";
import { api } from "../api/axios";
import { clearTokens } from "../token";

const SERVER = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export default function Home() {
  const [me, setMe] = useState(null);

  const fetchMe = async () => {
    const res = await api.get("/api/auth/me");
    setMe(res.data);
  };

  const logout = async () => {
    try {
      // 서버 로그아웃 (세션이 아니라면 토큰 정리만)
      await api.post("/api/auth/logout"); // 서버에 구현되어 있다면 호출
    } catch (_) {}
    clearTokens();
    setMe(null);
  };

  return (
    <div style={{ padding: 24, lineHeight: 1.6 }}>
      <h1>HealthSync 로그인 데모</h1>
      <div style={{ display: "flex", gap: 12, margin: "12px 0" }}>
        <a href={`${SERVER}/oauth2/authorization/google`}>Google 로그인</a>
        <a href={`${SERVER}/oauth2/authorization/kakao`}>Kakao 로그인</a>
        <a href={`${SERVER}/oauth2/authorization/naver`}>Naver 로그인</a>
      </div>

      <div style={{ display: "flex", gap: 12, margin: "12px 0" }}>
        <button onClick={fetchMe}>/api/auth/me 호출</button>
        <button onClick={logout}>로그아웃</button>
      </div>

      <pre style={{ background: "#111", color: "#0f0", padding: 12 }}>
        {JSON.stringify(me, null, 2)}
      </pre>
    </div>
  );
}
