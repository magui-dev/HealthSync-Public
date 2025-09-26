import leftImg from "../assets/leftbackground.png";
import centerImg from "../assets/centerbackground.png";
import rightImg from "../assets/rightbackground.png";
import "./MainPage.css";
import { useNavigate } from "react-router-dom";

export default function MainPage({ me, onLoginClick, onAccountClick }) {
  // const go = (msg) => () => alert(msg);
  const nav = useNavigate();
  // 목표설정 구간
  const goPlanSetup = (type) => nav(`/plan?type=${type}`);

  return (
    <div className="landing">
      <aside className="side">
        <img className="bg" src={leftImg} alt="left bg" />
        <nav className="menu">
          <button className="menuBtn" onClick={me ? onAccountClick : onLoginClick}>
            {me?.nickname ? `${me.nickname}님` : "Login"}
          </button>
          <button className="menuBtn" onClick={() => nav("/ai-with-report")}>AI 식단 추천</button>
          <button className="menuBtn" onClick={() => nav("/my-report")}>나의 리포트</button>
          <button className="menuBtn" onClick={() => nav("/community/posts")}>커뮤니티</button>
        </nav>
      </aside>

      <section className="hero">
        <img src={centerImg} alt="health" />
        <div className="overlay" />
        <button className="heroBtn" onClick={() => goPlanSetup("HEALTH")}>
          <div className="title">
            <strong>Health</strong>
            <span>건강</span>
          </div>
        </button>
      </section>

      <section className="hero">
        <img src={rightImg} alt="lean" />
        <div className="overlay" />
        <button className="heroBtn" onClick={() => goPlanSetup("LEAN")}>
          <div className="title">
            <strong>Lean</strong>
            <span>다이어트</span>
          </div>
        </button>
      </section>
    </div>
  );
}
