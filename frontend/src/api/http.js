import axios from "axios";
export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

let isRefreshing = false;

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err?.response?.status;
    const config = err?.config || {};
    if (status === 401 && !config.__retried) {
      // (옵션) 1회 refresh
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          await api.post("/auth/refresh");
          isRefreshing = false;
          config.__retried = true;
          return api(config);
        } catch {
          isRefreshing = false;
        }
      }
      // 실패 → 루트로 보내고 모달 오픈은 RequireAuth가 처리
      if (location.pathname !== "/") {
        location.assign("/"); // 루트로
      }
    }
    return Promise.reject(err);
  }
);
