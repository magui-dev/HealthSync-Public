import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import PlanSetup from "./pages/PlanSetup";

import AuthSuccess from "./pages/AuthSuccess";
import Me from "./pages/Me";
import MainPage from "./pages/MainPage";
import Header from "./components/Header";
import LoginModal from "./components/LoginModal";
<<<<<<< HEAD
import PostRoutes from "./features/posts/Routes";
=======
import ErrorBoundary from "./components/ErrorBoundary";   // ✅ 추가
import FoodSelectionPage from "./pages/FoodSelectionPage";

// ✅ MyReport 지연 로딩 (파일이 문제여도 앱 전체가 안죽음)
const MyReport = React.lazy(() => import("./pages/MyReport"));
>>>>>>> 8a028fa (feat|plan and user| plan추가)

// import { clearTokens } from "./token";
import { apiLogout } from "./api";
import { useMe } from "./hooks/useMe";

function Shell() {
  const location = useLocation();
 const { me, loading, refresh, changeNickname, reset } = useMe();
  const [showLogin, setShowLogin] = useState(false);

  const openLogin = () => setShowLogin(true);
  const closeLogin = () => setShowLogin(false);

  const logout = async () => {
<<<<<<< HEAD
  await apiLogout();  // 서버가 쿠키 만료 처리
 reset(); // ← 요청 자체를 안 보냄 → 네트워크 탭에 빨간 줄 없음
};
=======
    try { await apiLogout(); } finally { clearTokens(); await refresh(); }
  };
>>>>>>> 8a028fa (feat|plan and user| plan추가)

  useEffect(() => {
    if (loading) return;
    if (me && !me.profileCompleted) {
      const next = window.prompt("표시할 닉네임을 입력하세요", me.nickname);
      if (next && next.trim()) changeNickname(next.trim());
    }
  }, [me, loading, changeNickname]);

  const onAccountClick = () => {
    if (!me) return openLogin();
    const next = window.prompt("새 닉네임을 입력하세요", me.nickname ?? "");
    if (next && next.trim()) changeNickname(next.trim());
  };

  return (
    <>
      <Header
        me={me}
        onLoginClick={openLogin}
        onLogoutClick={logout}
        onAccountClick={onAccountClick}
      />

<<<<<<< HEAD
      <Routes>
        <Route path="/auth/success" element={<AuthSuccess onDone={refresh} />} />
        <Route path="/me" element={<Me />} />
        <Route path="/" element={<MainPage me={me} onLoginClick={openLogin} onAccountClick={onAccountClick} />} />
        <Route path="/community/posts/*" element={<PostRoutes />} />
      </Routes>
=======
      {/* ✅ 에러 경계 + 서스펜스로 라우트 보호 */}
      <ErrorBoundary>
        <Suspense fallback={<div style={{padding:16}}>로딩중...</div>}>
          <Routes>
            <Route path="/auth/success" element={<AuthSuccess onDone={refresh} />} />
            <Route path="/me" element={<Me />} />
            <Route path="/report" element={<MyReport />} />  {/* 리포트 페이지 */}
            <Route path="/plan/setup" element={<PlanSetup />} />
            <Route path="/plan/foods" element={<FoodSelectionPage />} />
            <Route
              path="/"
              element={<MainPage me={me} onLoginClick={openLogin} onAccountClick={onAccountClick} />}
            />
          </Routes>
        </Suspense>
      </ErrorBoundary>
>>>>>>> 8a028fa (feat|plan and user| plan추가)

      <LoginModal open={showLogin} onClose={closeLogin} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}
