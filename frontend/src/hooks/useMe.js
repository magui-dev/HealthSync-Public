import { useEffect, useState, useCallback } from "react";
import { getMe, changeNickname as apiChangeNickname } from "../api";

 // 백엔드 응답 → 프론트 공통 모델로 변환
 function adaptMe(raw) {
    if (!raw || !raw.userId) return null;
  return {
    userId: raw.userId,              // ✅ 그대로 유지
    email: raw.email ?? null,
    name: raw.name ?? null,
    nickname: raw.nickname ?? null,
    profileCompleted: !!raw.nicknameSet,
  };
 }


export function useMe() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  const reset = useCallback(() => {
   setMe(null);
   setLoading(false);
 }, []);

  const refresh = useCallback(async (options = {}) => {
    setLoading(true);
    try {
      const data = await getMe(options);
      setMe(adaptMe(data)); // ← 통일된 형태로 저장
    } catch (_) {
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const changeNickname = useCallback(async (nickname) => {
    await apiChangeNickname(nickname);
    await refresh();
  }, [refresh]);

  useEffect(() => { refresh(); }, [refresh]);

 return { me, loading, refresh, changeNickname, reset };
}
