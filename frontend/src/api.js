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

     const isRefreshCall = config?.url?.includes("/api/auth/refresh");
   const shouldSkip    = !!config?.skipAuthRefresh; // ← 호출 측에서 의도된 401임을 표시




   if (response.status === 401 && !config._retry && !isRefreshCall && !shouldSkip) {
      config._retry = true;
      try {
        if (!refreshing) {
          // 쿠키 기반: 본문/헤더에 refresh 안 보냄
          refreshing = api.post("/api/auth/refresh", null, { skipAuthRefresh: true }).finally(() => {
            refreshing = null;
          });
        }
        await refreshing; // 새 accessToken이 쿠키로 세팅됨
        return api(config); // 원 요청 재시도
      } catch {
         // 하드 리다이렉트 대신 호출 측에서 처리하게 에러 전파
       throw error;
      }
    }
    throw error;
  }
);

export default api;

// --- API 함수들 (쿠키만 사용) ---
export async function getMe(options = {}) {
  const res = await api.get("/api/auth/me", options); // ← skipAuthRefresh 전달 가능
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
