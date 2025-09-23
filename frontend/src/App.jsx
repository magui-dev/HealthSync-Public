import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import PlanSetup from "./pages/PlanSetup";
import MyReportPage from "./myreport/pages/MyReportPage"; // 이 import 구문이 있는지 확인

import AuthSuccess from "./pages/AuthSuccess";
import Me from "./pages/Me";
import MainPage from "./pages/MainPage";
import Header from "./components/Header/Header";
import LoginModal from "./components/LoginModal";
import PostRoutes from "./features/posts/Routes";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import AIWithReportPage from "./openaiapi/pages/AIWithReportPage";

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
    await apiLogout(); // 서버가 쿠키 만료 처리
    reset(); // 요청 자체를 안 보냄 → 네트워크 탭에 빨간 줄 없음
  };

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

  const isRootPath = location.pathname === "/";

  return (
    <>
      {isRootPath ? (
        /* 메인 페이지 */
        <MainPage
          me={me}
          onLoginClick={openLogin}
          onAccountClick={onAccountClick}
        />
      ) : (
        <>
          {/* 헤더 영역 (고정) */}
          <Header
            me={me}
            onLoginClick={openLogin}
            onLogoutClick={logout}
            onAccountClick={onAccountClick}
          />

          {/* 메인 영역 (페이지별로 바뀜) */}
          <div className="mainArea" style={{ marginTop: 64 }}>
            <Routes>
              <Route
                path="/auth/success"
                element={<AuthSuccess onDone={refresh} />}
              />
              <Route path="/me" element={<Me />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="/my-report" element={<MyReportPage />} />{" "}
              <Route path="/community/posts/*" element={<PostRoutes />} />
              <Route
                path="/ai-with-report"
                element={<AIWithReportPage />}
              />{" "}
            </Routes>
          </div>
        </>
      )}

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
