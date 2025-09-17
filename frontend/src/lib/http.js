const BASE_URL = import.meta?.env?.VITE_API_BASE_URL || "http://localhost:8080";

async function request(path, { method = "GET", headers = {}, body, retry = true } = {}) {
  const init = {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    credentials: "include", // send cookies
    body: body ? JSON.stringify(body) : undefined,
  };
  const res = await fetch(BASE_URL + path, init);
  if (res.status === 401 && retry) {
    // try refresh then retry once
    try {
      await fetch(BASE_URL + "/api/auth/refresh", { method: "POST", credentials: "include" });
      return request(path, { method, headers, body, retry: false });
    } catch (e) {}
  }
  if (!res.ok) {
    const msg = await res.text().catch(()=>res.statusText);
    throw new Error(msg || res.statusText);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

export const http = {
  get: (p, opts={}) => request(p, { ...opts, method: "GET" }),
  post: (p, body, opts={}) => request(p, { ...opts, method: "POST", body }),
  put: (p, body, opts={}) => request(p, { ...opts, method: "PUT", body }),
  patch: (p, body, opts={}) => request(p, { ...opts, method: "PATCH", body }),
  delete: (p, opts={}) => request(p, { ...opts, method: "DELETE" }),
  BASE_URL,
};
