import { useEffect, useState, useCallback } from "react";
import { getMe, changeNickname as apiChangeNickname } from "../api";

export function useMe() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await getMe();
      setMe(data?.login === "jwt" ? data : null);
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

  return { me, loading, refresh, changeNickname };
}
