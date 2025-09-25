import { useState } from "react";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Header from "./components/Header/Header";
import LoginModal from "./components/LoginModal";
import PostRoutes from "./features/posts/Routes";
import MyReportPage from "./myreport/pages/MyReportPage";
import AIWithReportPage from "./openaiapi/pages/AIWithReportPage";
import AuthSuccess from "./pages/AuthSuccess";
import MainPage from "./pages/MainPage";
import Me from "./pages/Me";
import PlanSetup from "./pages/PlanSetup";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
//목표설정 임포트
import FoodSelectionPage from "./pages/FoodSelectionPage";
import PlanReport from "./pages/PlanReport/PlanReport";
import ProfileImage from "./components/Profile/ProfileImageEdit";

// import { clearTokens } from "./token";
import { apiLogout } from "./api";
import { useMe } from "./hooks/useMe";
import "./App.css";

function Shell() {
  const location = useLocation();
  const nav = useNavigate();
  const isRootPath = location.pathname === "/";
  const { me, refresh, reset } = useMe();
  const [showLogin, setShowLogin] = useState(false);

  const onLoginClick = () => setShowLogin(true);
  const onAccountClick = () => {
    if (!me) return setShowLogin(true);  
    nav("/profile");
  };

  const logout = async () => {
    await apiLogout(); // 서버가 쿠키 만료 처리
    reset(); // 요청 자체를 안 보냄 → 네트워크 탭에 빨간 줄 없음
    nav("/", {replace: true}); // 로그아웃 시, 메인 페이지로 이동(뒤로가기 방지)
  };

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
        <div className="mainArea">
          <Routes>
            <Route path="/auth/success" element={<AuthSuccess onDone={refresh} />} />
            <Route path="/me" element={<Me />} />
            <Route path='/profile' element={<ProfilePage/>}/>
            <Route path="/community/posts/*" element={<PostRoutes />} />
            <Route path="/my-report" element={<MyReportPage />} />
            <Route path="/ai-with-report" element={<AIWithReportPage />} />
            {/* 목표설정 구간 */}
            <Route path="/" element={<MainPage me={me} onLoginClick={onLoginClick} onAccountClick={onAccountClick} />} />
            <Route path="/plan" element={<PlanSetup />} />
            <Route path="/plan/foods" element={<FoodSelectionPage />} /> 
            <Route path="/plan/report" element={<PlanReport />} />
          </Routes>
        </div>
      </>
      )}

      {/* 로그인 모달 */}
      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
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
