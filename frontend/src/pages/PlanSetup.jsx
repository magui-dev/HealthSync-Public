import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import "./PlanSetup.css";
import leanImg from "../assets/lean.png";
import healthImg from "../assets/health.png";
import { useNavigate } from "react-router-dom"
import { listGoals, savePlan } from "../api/plan"


const WEEK_OPTIONS = [2, 4, 6, 8, 10, 12, 14, 16];
const VISUALS = {
  LEAN: { img: leanImg, line1: "Lean", line2: "다이어트" },
  HEALTH: { img: healthImg, line1: "Health", line2: "건강/근력" }, //
};

export default function PlanSetup() {
  const [sp] = useSearchParams();
  const planType = (sp.get("type") || "HEALTH").toUpperCase();
  const visual = VISUALS[planType] || VISUALS.LEAN;
  const nav = useNavigate();

  const [weeks, setWeeks] = useState(8);
  const [startDate, setStartDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [current, setCurrent] = useState(""); // kg
  const [target, setTarget] = useState("");  // kg
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState({ open: false, goals: [] });

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
      const goal = await savePlan({
        type: planType,
        startDate,
        weeks,
        startWeightKg: Number(current),
        targetWeightKg: Number(target),
      });
      nav(`/plan/report?goalId=${goal.id}`);
    } catch (e) {
      // 409 등 실패 시: 최신 목표가 있으면 그걸로 이동
      try {
        const goals = await listGoals();
        if (Array.isArray(goals) && goals.length > 0) {
          nav(`/plan/report?goalId=${goals[0].id}`);
          return;
        }
      } catch (_) { }
      console.error(e);
      alert(e?.response?.data?.message ?? "저장 실패. 콘솔을 확인하세요.");
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
      {conflict.open && (
        <GoalConflictModal
          goals={conflict.goals}
          onClose={() => setConflict({ open: false, goals: [] })}
          onGo={(id) => { setConflict({ open: false, goals: [] }); nav(`/plan/report?goalId=${id}`); }}
          onChangeDate={() => {
            // 예: 자동으로 내일로 세팅 후 모달 닫기
            setStartDate(dayjs().add(1, "day").format("YYYY-MM-DD"));
            setConflict({ open: false, goals: [] });
            // 필요하면 안내 메시지
            alert("시작 날짜를 내일로 변경했어요. 다시 저장을 눌러주세요.");
          }}
        />
      )}
    </div>
  );
}

function GoalConflictModal({ goals, onGo, onChangeDate, onClose }) {
  const active = goals?.[0]; // 최신 목표 가정
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "grid", placeItems: "center", zIndex: 9999
    }}>
      <div style={{ background: "#1f2937", color: "#fff", width: 480, borderRadius: 16, padding: 24 }}>
        <h3 style={{ marginTop: 0 }}>이미 진행 중인 목표가 있어요</h3>
        <p style={{ opacity: .85, marginBottom: 16 }}>
          기존 목표로 바로 이동하거나, 시작 날짜를 바꿔 새 목표를 만들 수 있어요.
        </p>

        {active && (
          <div style={{ background: "#111827", borderRadius: 12, padding: 12, marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>
              현재: {active.type} • {active.weeks}주 • 시작 {active.startDate}
            </div>
            <button
              onClick={() => onGo(active.id)}
              style={{ padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer" }}
            >
              이 목표로 이동
            </button>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onChangeDate} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #374151", background: "transparent", color: "#fff" }}>
            시작 날짜 바꾸기
          </button>
          <button onClick={onClose} style={{ padding: "10px 12px", borderRadius: 8, border: "none", background: "#374151", color: "#fff" }}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}