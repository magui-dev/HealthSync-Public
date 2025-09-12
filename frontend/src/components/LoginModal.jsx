const SERVER = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export default function LoginModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div style={styles.backdrop} onClick={(e)=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={styles.modal}>
        <h3 style={{marginTop:0}}>소셜 로그인</h3>
        <div style={styles.col}>
          <a style={styles.btn} href={`${SERVER}/oauth2/authorization/google`}>Google로 로그인</a>
          <a style={styles.btn} href={`${SERVER}/oauth2/authorization/naver`}>Naver로 로그인</a>
          <a style={styles.btn} href={`${SERVER}/oauth2/authorization/kakao`}>Kakao로 로그인</a>
        </div>
        <button style={styles.close} onClick={onClose}>닫기</button>
      </div>
    </div>
  );
}

const styles = {
  backdrop: { position:"fixed", inset:0, background:"rgba(0,0,0,.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2000 },
  modal: { width:360, background:"#fff", borderRadius:14, padding:20, boxShadow:"0 12px 40px rgba(0,0,0,.25)" },
  col: { display:"grid", gap:10, margin:"12px 0 8px" },
  btn: { display:"block", textAlign:"center", padding:"12px 14px", borderRadius:10, textDecoration:"none", border:"1px solid #ddd", color:"#111" },
  close: { width:"100%", padding:"10px 0", border:"none", borderRadius:8, background:"#f2f2f2", cursor:"pointer" }
};
