import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import "./Header.css";

export default function Header({ me, onLoginClick, onLogoutClick, onAccountClick }) {
  
  const label = me?.nickname ? `${me.nickname}님` : "Login";
  const click = me ? onAccountClick : onLoginClick;

  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const dropdownRef = useRef(null);

  // 회원 닉네임(label) 버튼 클릭 시, 드롭다운 열기/닫기 
  const handleProfileClick = () => {
   setIsDropdownVisible(!isDropdownVisible);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header style={styles.wrap}>
      <div style={styles.brand}>
        <Link to="/" style={styles.link}>Health&Lean</Link>
      </div>
      <nav style={styles.nav}>
        {me ? (
          <>
            {/* My Report */}
            <Link to="/me" style={styles.link}>My Report</Link>
            {/* Profile 설정 드롭다운 */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button onClick={handleProfileClick} style={styles.btnLink}>{label}</button>
              {isDropdownVisible && (
                <div id="dropdownMenu">
                  <Link to="/profile" className="dropdownItem" onClick={() => setIsDropdownVisible(false)}>프로필 설정</Link>
                  <Link onClick={() => { onLogoutClick(); setIsDropdownVisible(false); }} className="dropdownItem">로그아웃</Link>
                </div>
              )}
            </div>
          </>
        ) : (
          <button onClick={click} style={styles.btnLink}>{label}</button>
        )}
      </nav>
    </header>
  );
}

const styles = {
  wrap: { position:"fixed", top:0, left:0, right:0, height:64, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", background:"rgba(255,255,255)", zIndex:1000 },
  brand: { fontWeight:800, fontSize:20 },
  nav: { display:"flex", gap:16, alignItems:"center" },
  link: { color:"#111", textDecoration:"none" },
  btnLink: { background:"none", border:"none", cursor:"pointer", fontSize:16 }
};
