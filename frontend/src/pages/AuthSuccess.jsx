// import { useEffect } from "react";
// import { setTokens } from "../token";
// 
// export default function AuthSuccess({ onDone }) {
//   useEffect(() => {
//     try {
//       const hash = window.location.hash?.startsWith("#")
//         ? window.location.hash.slice(1)
//         : "";
//       const query = window.location.search?.startsWith("?")
//         ? window.location.search.slice(1)
//         : "";
//       const raw = hash || query;
//       const params = new URLSearchParams(raw);

//       const access = params.get("access");
//       const refresh = params.get("refresh");

//       if (access || refresh) {
//         setTokens({ access, refresh });
//       }
//     } catch (e) {
//       console.error("AuthSuccess error:", e);
//     } finally {
//       // ✅ 로그인 직후 /me 갱신
//       onDone?.();
//       window.location.replace("/");
//     }
//   }, [onDone]);

//   return <div style={{ padding: 24 }}>로그인 처리중...</div>;
// }

import { useEffect } from "react";

export default function AuthSuccess({ onDone }) {
  useEffect(() => {
    try {
      // 토큰 파싱/저장은 전부 제거 (쿠키는 브라우저가 자동 첨부)
    } catch (e) {
      console.error("AuthSuccess error:", e);
    } finally {
      onDone?.();                // 전역 상태 갱신이 있다면 사용
      window.location.replace("/"); // 홈으로 이동
    }
  }, [onDone]);

  return <div style={{ padding: 24 }}>로그인 처리중...</div>;
}
