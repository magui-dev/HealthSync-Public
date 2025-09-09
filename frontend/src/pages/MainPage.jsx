import leftImg from "../assets/leftbackground.png";
import centerImg from "../assets/centerbackground.png";
import rightImg from "../assets/rightbackground.png";
import "./MainPage.css";

export default function MainPage() {
  const go = (msg) => () => alert(msg);

  return (
    <div className="landing">
      {/* 왼쪽 사이드 */}
      <aside className="side">
        <img className="bg" src={leftImg} alt="left bg" />
        <nav className="menu">
          <button className="menuBtn" onClick={go("Login")}>Login</button>
          <button className="menuBtn" onClick={go("AI 식단 추천")}>AI 식단 추천</button>
          <button className="menuBtn" onClick={go("나의 리포트")}>나의 리포트</button>
          <button className="menuBtn" onClick={go("커뮤니티")}>커뮤니티</button>
        </nav>
      </aside>

      {/* 가운데 히어로(Health) */}
      <section className="hero">
        <img src={centerImg} alt="health" />
        <div className="overlay" />
        <button className="heroBtn" onClick={go("Health 모드")}>
          <div className="title">
            <strong>Health</strong>
            <span>건강/근력</span>
          </div>
        </button>
      </section>

      {/* 오른쪽 히어로(Lean) */}
      <section className="hero">
        <img src={rightImg} alt="lean" />
        <div className="overlay" />
        <button className="heroBtn" onClick={go("Lean 모드")}>
          <div className="title">
            <strong>Lean</strong>
            <span>다이어트</span>
          </div>
        </button>
      </section>
    </div>
  );
}
