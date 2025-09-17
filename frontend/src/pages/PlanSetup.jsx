import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import "./PlanSetup.css";
import leanImg from "../assets/lean.png";
import healthImg from "../assets/health.png";
import { savePlan } from "../api/plan"; // 이미 있는 API 모듈 가정

const WEEK_OPTIONS = [2, 4, 6, 8, 10, 12, 14, 16];
const VISUALS = {
  LEAN:   { img: leanImg,    line1: "Lean",   line2: "다이어트" },
  HEALTH: { img: healthImg,  line1: "Health", line2: "건강/근력" }, //
};

export default function PlanSetup() {
  const [sp] = useSearchParams();
  const planType = (sp.get("type") || "HEALTH").toUpperCase();
  const visual = VISUALS[planType] || VISUALS.LEAN;

  const [weeks, setWeeks] = useState(8);
  const [startDate, setStartDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [current, setCurrent] = useState(""); // kg
  const [target, setTarget] = useState("");  // kg
  const [saving, setSaving] = useState(false);

  // 예상 흐름(선형감량)
  const chartData = useMemo(() => {
    const cur = Number(current);
    const tar = Number(target);
    const w = Number(weeks);
    if (!cur || !tar || !w) return [];
    const step = (cur - tar) / w;
    return Array.from({ length: w }, (_, i) => {
      const week = i + 1;
      const val = +(cur - step * week).toFixed(1);
      return { name: `${week}주`, weight: val };
    });
  }, [current, target, weeks]);

  const handleSave = async () => {
    if (!current || !target) {
      alert("현재/목표 체중을 입력하세요.");
      return;
    }
    setSaving(true);
    try {
      await savePlan({
        type: planType,
        startDate,
        weeks,
        currentWeight: Number(current),
        targetWeight: Number(target),
      });
      alert("저장 완료!");
      // 필요 시 이동: navigate("/report") 등
    } catch (e) {
      console.error(e);
      alert("저장 실패. 콘솔을 확인하세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="plan-wrap">
      {/* 좌측: 배경 이미지 + 레드 타이틀 */}
      <div className="plan-left">
      <img src={visual.img} alt={planType} className="bg-img" />  
        <div className="overlay-title">
        <div>{visual.line1}</div>
        <div>{visual.line2}</div>
      </div>
      </div>

      {/* 우측: 카드 */}
      <div className="plan-right">
        <div className="card">
          <h2 className="title">목표 기간</h2>
          <div className="weeks-grid">
            {WEEK_OPTIONS.map((w) => (
              <button
                key={w}
                className={`week-btn ${weeks === w ? "active" : ""} ${w === 8 ? "accent" : ""}`}
                onClick={() => setWeeks(w)}
              >
                {w}주
              </button>
            ))}
          </div>

          <div className="row">
            <div className="label">시작 날짜</div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
            />
          </div>

          <div className="row two">
            <div className="box">
              <div className="label">현재 체중(kg)</div>
              <input
                placeholder="예: 93"
                value={current}
                onChange={(e) => setCurrent(e.target.value.replace(/[^\d.]/g, ""))}
                className="input"
                inputMode="decimal"
              />
            </div>
            <div className="box">
              <div className="label">목표 체중(kg)</div>
              <input
                placeholder="예: 88"
                value={target}
                onChange={(e) => setTarget(e.target.value.replace(/[^\d.]/g, ""))}
                className="input"
                inputMode="decimal"
              />
            </div>
          </div>

          <div className="progress-title">예상 흐름</div>
          <div className="progress-bar">
            <div className="progress-gradient" />
          </div>

          <div className="chart-area">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={["auto", "auto"]} />
                <Tooltip />
                <Line type="monotone" dataKey="weight" dot />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="actions">
            <button className="save-btn" onClick={handleSave} disabled={saving}>
              {saving ? "저장중..." : "저장"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
