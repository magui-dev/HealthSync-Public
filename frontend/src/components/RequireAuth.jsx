// src/components/RequireAuth.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useMe } from "../hooks/useMe";

/**
 * 로그인이 필요한 라우트를 보호합니다.
 * - me 로딩 중이면 잠깐 빈 화면(or 스피너) 표시
 * - 미로그인이면 "/"로 돌려보내며 loginRequired 상태를 전달
 */
export default function RequireAuth({ children }) {
  const { me, loading } = useMe();
  const loc = useLocation();

  if (loading) return null;

  if (!me) {
    return (
      <Navigate
        to="/"
        replace
        state={{
          loginRequired: true,
          from: loc.pathname + loc.search,
        }}
      />
    );
  }
  return children;
}