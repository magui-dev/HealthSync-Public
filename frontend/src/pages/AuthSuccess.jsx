import { useEffect } from "react";
import { setTokens } from "../token";

export default function AuthSuccess({ onDone }) {
  useEffect(() => {
    try {
      const hash = window.location.hash?.startsWith("#")
        ? window.location.hash.slice(1)
        : "";
      const query = window.location.search?.startsWith("?")
        ? window.location.search.slice(1)
        : "";
      const raw = hash || query;
      const params = new URLSearchParams(raw);

      const access = params.get("access");
      const refresh = params.get("refresh");

      if (access || refresh) {
        setTokens({ access, refresh });
      }
    } catch (e) {
      console.error("AuthSuccess error:", e);
    } finally {
      // ✅ 로그인 직후 /me 갱신
      onDone?.();
      window.location.replace("/");
    }
  }, [onDone]);

  return <div style={{ padding: 24 }}>로그인 처리중...</div>;
}
