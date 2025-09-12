// --- Token Utilities ---

export const ACCESS_KEY = "hs_access";
export const REFRESH_KEY = "hs_refresh";

/** 내부: same-tab에서도 App이 반응하도록 storage 이벤트 수동 발생 */
function notifyAuthChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"));
  }
}

/** 저장: { access, refresh } 일부만 넘어와도 해당 것만 저장 */
export function setTokens({ access, refresh } = {}) {
  if (access) localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  notifyAuthChanged();
}

/** alias */
export function saveTokens(access, refresh) {
  setTokens({ access, refresh });
}

/** 조회 */
export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}
export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

/** 삭제 */
export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  notifyAuthChanged();
}

/** URL 해시(#access=...&refresh=...) 파싱 */
export function parseHashTokens(hashStr) {
  const hash =
    (hashStr ?? (typeof window !== "undefined" ? window.location.hash : "")) || "";
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(raw);
  return { access: params.get("access"), refresh: params.get("refresh") };
}

/** 해시에서 토큰 파싱 후 저장 + (기본) 해시 제거 */
export function parseAndStoreFromHash(options) {
  const clearHash = options?.clearHash ?? true;
  const tokens = parseHashTokens();
  if (tokens.access || tokens.refresh) {
    setTokens(tokens); // 저장 + same-tab 알림
    if (typeof window !== "undefined" && clearHash) {
      const { pathname, search } = window.location;
      window.history.replaceState(null, "", pathname + search);
    }
  }
  return tokens;
}

/** 로그인 여부 */
export function isLoggedIn() {
  return !!getAccessToken();
}

/** 요청 헤더 */
export function authHeader() {
  const access = getAccessToken();
  return access ? { Authorization: `Bearer ${access}` } : {};
}
