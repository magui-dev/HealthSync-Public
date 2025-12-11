// src/App.jsx
import { useEffect, useState } from "react";
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
import FoodSelectionPage from "./pages/FoodSelectionPage";
import PlanReport from "./pages/PlanReport/PlanReport";
import { apiLogout } from "./api";
import { useMe } from "./hooks/useMe";
import RequireAuth from "./components/RequireAuth"; // ★ 보호 가드
import "./App.css";

function Shell() {
  const location = useLocation();
  const nav = useNavigate();
  const isRootPath = location.pathname === "/";
  const { me, refresh, reset } = useMe();

  // 로그인 모달 제어
  const [showLogin, setShowLogin] = useState(false);

  // ★ 고정 안내 배너 제어
  // - 보호 라우트에서 밀려오면 true
  // - 로그인 성공하면 자동 숨김
  // - 사용자가 X 누르면 수동 숨김
  const [mustLogin, setMustLogin] = useState(false);
  const [fromPath, setFromPath] = useState(null); // 로그인 후 돌아갈 경로(옵션)

  const onLoginClick = () => setShowLogin(true);
  const onAccountClick = () => {
    if (!me) return setShowLogin(true);
    nav("/profile");
  };

  const logout = async () => {
    await apiLogout();
    reset();
    nav("/", { replace: true });
  };

  // 보호 라우트에서 Redirect될 때 전달된 state 처리
  useEffect(() => {
    if (location.state && location.state.loginRequired) {
      setMustLogin(true);          // 안내 배너 ON
      setShowLogin(true);          // 로그인 모달도 바로 띄움(원하면 이 줄은 제거해도 됨)
      setFromPath(location.state.from || null);
      // state 초기화(뒤로가기 시 중복 방지)
      nav(location.pathname + location.search, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, location.search, nav]);

  // 로그인 성공(=me가 채워짐) 시 배너 자동 숨김
  useEffect(() => {
    if (me) setMustLogin(false);
  }, [me]);

  // (선택) 로그인 성공 후 원래 가던 페이지로 자동 이동하고 싶다면
  // AuthSuccess에서 refresh 완료 후 아래 로직을 트리거하도록 처리해도 됨.
  // 여기서는 간단히 me가 생기고 fromPath가 있으면 이동:
  useEffect(() => {
    if (me && fromPath) {
      nav(fromPath, { replace: true });
      setFromPath(null);
    }
  }, [me, fromPath, nav]);

  return (
    <>
      {/* 고정 안내 배너: 항상 화면 상단에 떠 있음(루트/서브 상관없음) */}
      {mustLogin && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px",
            background: "#111827",
            color: "#fff",
            borderBottom: "1px solid #1f2937",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <span>로그인이 필요한 서비스입니다.</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setShowLogin(true)}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #334155",
                background: "#0b1220",
                color: "#e2e8f0",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              로그인
            </button>
            <button
              onClick={() => setMustLogin(false)}
              title="닫기"
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #374151",
                background: "#1f2937",
                color: "#cbd5e1",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 모든 페이지에 통일된 헤더 표시 */}
      <div style={{ paddingTop: mustLogin ? 48 : 0 }}>
        <Header
          me={me}
          onLoginClick={onLoginClick}
          onLogoutClick={logout}
          onAccountClick={onAccountClick}
        />
      </div>

      {/* 메인 영역 */}
      <div className={isRootPath ? "" : "mainArea"}>
        <Routes>
          {/* OAuth 성공 후 me 갱신 */}
          <Route path="/auth/success" element={<AuthSuccess onDone={refresh} />} />

          {/* 메인 페이지 */}
          <Route
            path="/"
            element={
              <MainPage
                me={me}
                onLoginClick={onLoginClick}
                onAccountClick={onAccountClick}
              />
            }
          />

          {/* ===== 보호 라우트 (RequireAuth로 감싸기) ===== */}
          <Route path="/me" element={<RequireAuth><Me /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
          <Route path="/community/posts/*" element={<RequireAuth><PostRoutes /></RequireAuth>} />
          <Route path="/my-report" element={<RequireAuth><MyReportPage /></RequireAuth>} />
          <Route path="/ai-with-report" element={<RequireAuth><AIWithReportPage /></RequireAuth>} />
          <Route path="/plan" element={<RequireAuth><PlanSetup /></RequireAuth>} />
          <Route path="/plan/foods" element={<RequireAuth><FoodSelectionPage /></RequireAuth>} />
          <Route path="/plan/report" element={<RequireAuth><PlanReport /></RequireAuth>} />
        </Routes>
      </div>

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
