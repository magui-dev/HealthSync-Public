import axios from "axios";
// dev(5173)에서는 vite proxy를 타게 baseURL을 ''로 둔다.
// prod 에선 VITE_API_BASE_URL(예: https://api.myapp.com) 사용.
const BASE = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_BASE_URL ?? "");

//원래 코드 혹시모를 복구용 
//const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export const api = axios.create({
  baseURL: BASE, // '' 이면 아래에서 '/api/...' 그대로 호출 → 프록시가 8080으로 전달
  withCredentials: true,
});

let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    if (!response) throw error;

    const isRefreshCall = config?.url?.includes("/api/auth/refresh");
    const shouldSkip = !!config?.skipAuthRefresh;

    if (response.status === 401 && !config._retry && !isRefreshCall && !shouldSkip) {
      config._retry = true;
      try {
        if (!refreshing) {
          refreshing = api.post("/api/auth/refresh", null, { skipAuthRefresh: true }).finally(() => {
            refreshing = null;
          });
        }
        await refreshing;
        return api.request(config);
      } catch (e) {
        // 여기서 하드 리다이렉트하지 말고 호출측에서 처리
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);

// --- API 함수들 ---
export async function getMe(options = {}) {
  const res = await api.get("/api/auth/me", options); // ← 여기로 skipAuthRefresh 전달됨
  return res.data;
}

export async function changeNickname(nickname) {
  return api.patch("/api/auth/nickname", { nickname });
}

export async function apiLogout() {
  try {
    await api.post("/api/auth/logout");
  } catch {}
}
