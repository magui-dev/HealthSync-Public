import { Link, useNavigate } from "react-router-dom";
import "./Header.css";
import DropdownMenu from "../common/DropdownMenu";

export default function Header({ me, onLoginClick, onLogoutClick, onAccountClick }) {
  const nav = useNavigate();
  
  return (
    <header className="unified-header">
      <div className="header-logo">
        <Link to="/">HealthSync</Link>
      </div>

      <nav className="header-menu">
        {me ? (
          <DropdownMenu
            button={
              <button className="header-menu-btn">
                {me.nickname}님
              </button>
            }
          >
            {(close) => (
              <div className="dropdown-content">
                <button className="dropdown-item" onClick={() => { nav("/profile"); close(); }}>
                  프로필 설정
                </button>
                <button className="dropdown-item" onClick={() => { onLogoutClick(); close(); }}>
                  로그아웃
                </button>
              </div>
            )}
          </DropdownMenu>
        ) : (
          <button className="header-menu-btn" onClick={onLoginClick}>
            Login
          </button>
        )}
        <button className="header-menu-btn" onClick={() => nav("/ai-with-report")}>
          AI 챗봇
        </button>
        <button className="header-menu-btn" onClick={() => nav("/my-report")}>
          나의 리포트
        </button>
        <button className="header-menu-btn" onClick={() => nav("/community/posts")}>
          커뮤니티
        </button>
      </nav>
    </header>
  );
}
