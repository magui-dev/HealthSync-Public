import healthImg from "../assets/health.png";
import dietImg from "../assets/diet.png";
import "./MainPage.css";
import { useNavigate } from "react-router-dom";

export default function MainPage({ me, onLoginClick, onAccountClick }) {
  const nav = useNavigate();
  const goPlanSetup = (type) => nav(`/plan?type=${type}`);

  return (
    <div className="landing">
      {/* 메인 컨텐츠 영역 */}
      <main className="mainContent">
        <section className="hero health-hero" onClick={() => goPlanSetup("HEALTH")}>
          <div className="heroCard">
            <img src={healthImg} alt="건강" />
          </div>
        </section>

        <section className="hero diet-hero" onClick={() => goPlanSetup("LEAN")}>
          <div className="heroCard">
            <img src={dietImg} alt="다이어트" />
          </div>
        </section>
      </main>
    </div>
  );
}
