// import axios from "axios";
// import {
//   getAccessToken,
//   getRefreshToken,
//   setTokens,
//   clearTokens,
// } from "./token";

// const BASE_URL =
//   import.meta?.env?.VITE_API_BASE_URL || "http://localhost:8080";

// const api = axios.create({ baseURL: BASE_URL });

// // 요청에 access 자동 첨부
// api.interceptors.request.use((config) => {
//   const access = getAccessToken();
//   if (access) config.headers.Authorization = `Bearer ${access}`;
//   return config;
// });

// // 401 -> refresh 한 번만 재시도
// let refreshing = null;

// api.interceptors.response.use(
//   (res) => res,
//   async (error) => {
//     const { config, response } = error;
//     if (!response) throw error;

//     if (response.status === 401 && !config._retry) {
//       config._retry = true;
//       try {
//         if (!refreshing) {
//           const refresh = getRefreshToken();
//           refreshing = api
//             .post("/api/auth/refresh", null, {
//               headers: { "X-Refresh-Token": refresh },
//             })
//             .then((r) => {
//               const { access } = r.data || {};
//               if (access) setTokens({ access }); // hs_access에 저장
//               return access;
//             })
//             .finally(() => {
//               refreshing = null;
//             });
//         }
//         const newAccess = await refreshing;
//         if (!newAccess) throw new Error("refresh failed");
//         config.headers.Authorization = `Bearer ${newAccess}`;
//         return api(config);
//       } catch (e) {
//         clearTokens();
//         throw e;
//       }
//     }
//     throw error;
//   }
// );

// export default api;

// // --- 추가 ---
// export async function getMe() {
//   const res = await api.get("/api/auth/me");
//   return res.data;
// }

// export async function changeNickname(nickname) {
//   return api.patch("/api/auth/nickname", { nickname });
// }

// export async function apiLogout() {
//   const refresh = getRefreshToken();
//   if (!refresh) return;
//   try {
//     await api.post("/api/auth/logout", null, {
//       headers: { "X-Refresh-Token": refresh },
//     });
//   } catch {}
// }
import axios from "axios";

const BASE_URL = import.meta?.env?.VITE_API_BASE_URL || "http://localhost:8080";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // ★ 쿠키 자동 첨부
});

// 401 → /api/auth/refresh (쿠키 기반) → 1회 재시도
let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    if (!response) throw error;

    if (response.status === 401 && !config._retry) {
      config._retry = true;
      try {
        if (!refreshing) {
          // 쿠키 기반: 본문/헤더에 refresh 안 보냄
          refreshing = api.post("/api/auth/refresh").finally(() => {
            refreshing = null;
          });
        }
        await refreshing; // 새 accessToken이 쿠키로 세팅됨
        return api(config); // 원 요청 재시도
      } catch {
        // 실패 시 홈으로 보내거나 로그인 모달 열기 등 처리
        window.location.href = "/";
      }
    }
    throw error;
  }
);

export default api;

// --- API 함수들 (쿠키만 사용) ---
export async function getMe() {
  const res = await api.get("/api/auth/me");
  return res.data;
}

export async function changeNickname(nickname) {
  return api.patch("/api/auth/nickname", { nickname });
}

export async function apiLogout() {
  try {
    await api.post("/api/auth/logout"); // 서버가 쿠키 만료
  } catch {}
}
