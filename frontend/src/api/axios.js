// import axios from "axios";
// import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "../token";

// axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
// axios.defaults.withCredentials = true; // ★ 쿠키 전송 필수
// // axios.defaults.headers.common.Authorization = undefined; // 혹시 남아있다면 제거
// export default axios;


// export const api = axios.create({
//   baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
// });

// // 매 요청마다 Access 토큰 자동 첨부
// api.interceptors.request.use((config) => {
//   const at = getAccessToken();
//   if (at) {
//     config.headers.Authorization = `Bearer ${at}`;
//   }
//   return config;
// });

// // 401이면 자동으로 /api/auth/refresh 호출 → 성공 시 재시도
// api.interceptors.response.use(
//   (res) => res,
//   async (error) => {
//     const original = error.config;
//     const status = error.response?.status;

//     // 이미 한 번 리트라이 했으면 무한 루프 방지
//     if (status === 401 && !original._retry) {
//       original._retry = true;
//       try {
//         const rt = getRefreshToken();
//         if (!rt) throw new Error("no refresh");

//         const r = await axios.post(
//           (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080") + "/api/auth/refresh",
//           { refresh: rt }
//         );

//         // 백엔드에서 {access, refresh?} 리턴한다고 가정
//         setTokens({ access: r.data.access, refresh: r.data.refresh });
//         original.headers.Authorization = `Bearer ${r.data.access}`;
//         return api.request(original);
//       } catch (e) {
//         clearTokens();
//         // 필요한 경우 로그인 화면으로 보내기
//         window.location.href = "/";
//       }
//     }

//     return Promise.reject(error);
//   }
// );

import axios from "axios";

const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export const api = axios.create({
  baseURL: BASE,
  withCredentials: true, // ★ 쿠키 자동 첨부
});

// 401 → /refresh → 재시도 (쿠키 기반)
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        await api.post("/api/auth/refresh"); // 쿠키만으로 처리
        return api.request(original);
      } catch {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);
