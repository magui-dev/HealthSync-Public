import React from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import PlanSetup from "./pages/PlanSetup";

import AuthSuccess from "./pages/AuthSuccess";
import Me from "./pages/Me";
import MainPage from "./pages/MainPage";
import Header from "./components/Header/Header";
import LoginModal from "./components/LoginModal";
import PostRoutes from "./features/posts/Routes";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
<<<<<<< HEAD
import MyReportPage from "./myreport/pages/MyReportPage";
import ProfileEditModal from "./components/Profile/ProfileEditModal";
=======
//목표설정 임포트
import FoodSelectionPage from "./pages/FoodSelectionPage";
import PlanReport from "./pages/PlanReport/PlanReport";

>>>>>>> b3299f3 (feat|plan&nutri|로직추가 삭제 등 프론트 추가)
// import { clearTokens } from "./token";
import { apiLogout } from "./api";
import { useMe } from "./hooks/useMe";

function Shell() {
  const location = useLocation();
  const nav = useNavigate();
  const isRootPath = location.pathname === "/";
  const { me, loading, refresh, changeNickname, reset } = useMe();
  const [showLogin, setShowLogin] = useState(false);

  // const openLogin = () => setShowLogin(true);
  // const closeLogin = () => setShowLogin(false);
  const onLoginClick = () => setShowLogin(true);
  const onAccountClick = () => {
    if (!me) return setShowLogin(true);  
    nav("/profile");
    // setShowProfile(true); // ✅ 로그인 시 프로필 모달 열기
    // const next = window.prompt("새 닉네임을 입력하세요", me.nickname ?? "");
    // if (next && next.trim()) changeNickname(next.trim());
  };

  const logout = async () => {
    await apiLogout();  // 서버가 쿠키 만료 처리
    reset();            // 요청 자체를 안 보냄 → 네트워크 탭에 빨간 줄 없음
  };

  useEffect(() => {
    if (loading) return;
    if (me && !me.profileCompleted) {
      const next = window.prompt("표시할 닉네임을 입력하세요", me.nickname);
      if (next && next.trim()) changeNickname(next.trim());
    }
  }, [me, loading, changeNickname]);

  return (
    <>
      {isRootPath ? (
        /* 메인 페이지 */
        <MainPage me={me} onLoginClick={onLoginClick} onAccountClick={onAccountClick} />
      ) : (
      <>
        {/* 헤더 영역 (고정) */}
        <Header
          me={me}
          onLoginClick={onLoginClick}
          onLogoutClick={logout}
          onAccountClick={onAccountClick}
        />
        
        {/* 메인 영역 (페이지별로 바뀜) */}
        <div className="mainArea" style={{ marginTop: 64 }}>
          <Routes>
            <Route path="/auth/success" element={<AuthSuccess onDone={refresh} />} />
            <Route path="/me" element={<Me />} />
            <Route path='profile' element={<ProfilePage/>}/>
            <Route path="/community/posts/*" element={<PostRoutes />} />
<<<<<<< HEAD
            <Route path="/my-report" element={<MyReportPage />} />
=======
            
            {/* 목표설정 구간 */}
            <Route path="/" element={<MainPage me={me} onLoginClick={openLogin} onAccountClick={onAccountClick} />} />
            <Route path="/plan" element={<PlanSetup />} />
            <Route path="/plan/foods" element={<FoodSelectionPage />} /> 
            <Route path="/plan/report" element={<PlanReport />} />
            
>>>>>>> b3299f3 (feat|plan&nutri|로직추가 삭제 등 프론트 추가)
          </Routes>
        </div>
      </>
      )}

      {/* 로그인 모달 */}
      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
            
      {/* 프로필 편집 모달 */}
      {/* <ProfileEditModal open={showProfile} onClose={() => setShowProfile(false)}/> */}
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
