import { Link } from "react-router-dom";
import "./Header.css";
import DropdownMenu from "../common/DropdownMenu";

export default function Header({ me, onLoginClick, onLogoutClick, onAccountClick }) {
  
  const label = me?.nickname ? `${me.nickname}님` : "Login";
  const click = me ? onAccountClick : onLoginClick;

  return (
    <header>
      <div className="header-brand">
        <Link to="/" className="header-link">Health&Lean</Link>
      </div>

      <nav className="header-nav">
        {me && (
          <>
            {/* 목표 관리(건강/다이어트) */}       
            <DropdownMenu
              button={
                <button className="header-btn-link"> Plan </button>
              }
            >
              {(close) => (
                <>
                  <Link to="/plan?type=health" className="dropdownItem" onClick={close}>건강</Link>
                  <Link to="/plan?type=diet" className="dropdownItem" onClick={close}>다이어트</Link>
                </> 
              )}
            </DropdownMenu>
            {/* AI chat */}
            <Link to="/ai-with-report" className="header-link"> AI </Link>
            {/* Report */}
            <Link to="/my-report" className="header-link"> Report </Link>
            {/* 커뮤니티 */}
            <Link to="/community/posts" className="header-link"> Community </Link>
          </>
        )}
        {/* Profile 설정 드롭다운 */}
        {me ? (
          <DropdownMenu
            button={
              <button className="header-btn-link">{label}</button>
            }
          >
            {(close) => (
              <>
                <Link to="/profile" className="dropdownItem" onClick={close}>프로필 설정</Link>
                <Link onClick={() => { onLogoutClick(); close(); }} className="dropdownItem">로그아웃</Link>
              </>
            )}
          </DropdownMenu>
        ) : (
          <button onClick={click} className="header-btn-link">{label}</button>
        )}
      </nav>
    </header>
  );
}