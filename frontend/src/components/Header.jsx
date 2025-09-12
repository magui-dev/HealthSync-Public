import { Link } from "react-router-dom";

export default function Header({ me, onLoginClick, onLogoutClick, onAccountClick }) {
  const label = me?.nickname ? `${me.nickname}님` : "Login";
  const click = me ? onAccountClick : onLoginClick;

  return (
    <header style={styles.wrap}>
      <div style={styles.brand}>
        <Link to="/" style={styles.link}>Health&Lean</Link>
      </div>
      <nav style={styles.nav}>
        {me ? (
          <>
            <Link to="/me" style={styles.link}>My Report</Link>
            <button onClick={click} style={styles.btnLink}>{label}</button>
            <button onClick={onLogoutClick} style={styles.btnLink}>Logout</button>
          </>
        ) : (
          <button onClick={click} style={styles.btnLink}>{label}</button>
        )}
      </nav>
    </header>
  );
}

const styles = {
  wrap: { position:"fixed", top:0, left:0, right:0, height:64, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", background:"rgba(255,255,255,.65)", backdropFilter:"blur(8px)", zIndex:1000 },
  brand: { fontWeight:800, fontSize:20 },
  nav: { display:"flex", gap:16, alignItems:"center" },
  link: { color:"#111", textDecoration:"none" },
  btnLink: { background:"none", border:"none", cursor:"pointer", fontSize:16 }
};
