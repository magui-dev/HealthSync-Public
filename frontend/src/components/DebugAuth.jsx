// import { useState } from "react";
// import api, { apiLogout } from "../api";
// import {
//   getAccessToken, getRefreshToken,
//   setTokens, clearTokens
// } from "../token";

// export default function DebugAuth() {
//   const [log, setLog] = useState([]);

//   const add = (m) => setLog((x) => [...x, `[${new Date().toLocaleTimeString()}] ${m}`]);

//   const checkLocal = () => {
//     add(`hs_access: ${getAccessToken() ? 'YES' : 'NO'}`);
//     add(`hs_refresh: ${getRefreshToken() ? 'YES' : 'NO'}`);
//   };

//   const callMe = async () => {
//     try {
//       const r = await api.get("/api/auth/me");
//       add(`/api/auth/me → ${JSON.stringify(r.data)}`);
//     } catch (e) {
//       add(`/api/auth/me FAIL → ${e?.response?.status || e.message}`);
//     }
//   };

//   const doLogout = async () => {
//     try {
//       await apiLogout();
//       clearTokens();
//       add("logout: server RT 폐기 + 로컬 토큰 삭제");
//     } catch (e) {
//       clearTokens();
//       add(`logout FAIL(서버) → 로컬만 삭제, 이유: ${e?.response?.status || e.message}`);
//     }
//   };

//   const clearLocal = () => { clearTokens(); add("localStorage 토큰 삭제"); };

//   const fakeExpire = () => { // 액세스만 지워서 401->refresh 흐름 강제
//     localStorage.removeItem("hs_access");
//     window.dispatchEvent(new Event("storage"));
//     add("액세스만 삭제(401 유도) → 다음 보호 API에서 refresh 플로우 확인");
//   };

//   const setFake = () => { // 임시 값 저장 테스트
//     setTokens({ access: "DUMMY_ACCESS", refresh: "DUMMY_REFRESH" });
//     add("임시 토큰 저장(setTokens) 호출 완료");
//   };

//   return (
//     <div style={boxStyle}>
//       <div style={{fontWeight:600, marginBottom:6}}>DEBUG AUTH</div>
//       <div style={row}><button onClick={checkLocal}>토큰확인</button><button onClick={callMe}>/me 호출</button></div>
//       <div style={row}><button onClick={doLogout}>로그아웃(서버+로컬)</button><button onClick={clearLocal}>로컬삭제</button></div>
//       <div style={row}><button onClick={fakeExpire}>액세스만삭제(401 유도)</button><button onClick={setFake}>임시토큰세팅</button></div>
//       <div style={logStyle}>
//         {log.slice(-12).map((m,i)=>(<div key={i}>{m}</div>))}
//       </div>
//     </div>
//   );
// }
// const boxStyle = {position:"fixed", right:12, bottom:12, zIndex:9999, background:"#fff", border:"1px solid #ddd", borderRadius:10, padding:10, width:320, boxShadow:"0 6px 24px rgba(0,0,0,.15)"};
// const row = {display:"flex", gap:8, margin:"6px 0"};
// const logStyle = {marginTop:6, height:160, overflow:"auto", fontFamily:"ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize:12, background:"#fafafa", border:"1px solid #eee", borderRadius:6, padding:6};
import { useState } from "react";
import api, { apiLogout } from "../api";

export default function DebugAuth() {
  const [log, setLog] = useState([]);

  const add = (m) =>
    setLog((x) => [...x, `[${new Date().toLocaleTimeString()}] ${m}`]);

  // JS로 HttpOnly 쿠키 확인 불가 → 서버 상태로만 판별
  const checkState = async () => {
    try {
      const r = await api.get("/api/auth/me");
      add(`ME OK → ${JSON.stringify(r.data)}`);
    } catch (e) {
      add(`ME FAIL → ${e?.response?.status || e.message}`);
    }
  };

  const callMe = async () => {
    try {
      const r = await api.get("/api/auth/me");
      add(`/api/auth/me → ${JSON.stringify(r.data)}`);
    } catch (e) {
      add(`/api/auth/me FAIL → ${e?.response?.status || e.message}`);
    }
  };

  const doRefresh = async () => {
    try {
      // 쿠키 기반: 바디/헤더에 refresh 안 보냄
      await api.post("/api/auth/refresh");
      add("REFRESH OK → 새 accessToken이 쿠키로 세팅됨");
    } catch (e) {
      add(`REFRESH FAIL → ${e?.response?.status || e.message}`);
    }
  };

  const doLogout = async () => {
    try {
      await apiLogout(); // 서버가 accessToken/refreshToken 쿠키 만료
      add("LOGOUT OK → 쿠키 만료됨");
    } catch (e) {
      add(`LOGOUT FAIL → ${e?.response?.status || e.message}`);
    }
  };

  return (
    <div style={boxStyle}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>DEBUG AUTH (Cookie)</div>

      <div style={row}>
        <button onClick={checkState}>상태확인(/me)</button>
        <button onClick={callMe}>/me 호출</button>
      </div>

      <div style={row}>
        <button onClick={doRefresh}>리프레시 호출</button>
        <button onClick={doLogout}>로그아웃</button>
      </div>

      <div style={{ marginTop: 6, fontSize: 12, color: "#666" }}>
        ※ HttpOnly 쿠키는 JS에서 볼 수 없습니다. 상태는 /me 응답으로 판단합니다.
      </div>

      <div style={logStyle}>
        {log.slice(-12).map((m, i) => (
          <div key={i}>{m}</div>
        ))}
      </div>
    </div>
  );
}

const boxStyle = {
  position: "fixed",
  right: 12,
  bottom: 12,
  zIndex: 9999,
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 10,
  padding: 10,
  width: 360,
  boxShadow: "0 6px 24px rgba(0,0,0,.15)",
};
const row = { display: "flex", gap: 8, margin: "6px 0" };
const logStyle = {
  marginTop: 6,
  height: 160,
  overflow: "auto",
  fontFamily:
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  fontSize: 12,
  background: "#fafafa",
  border: "1px solid #eee",
  borderRadius: 6,
  padding: 6,
};
