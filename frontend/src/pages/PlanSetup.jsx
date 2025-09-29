// src/pages/PlanSetup.jsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import "./PlanSetup.css";
import leanImg from "../assets/lean.png";
import healthImg from "../assets/health.png";
import { listGoals, savePlan, deleteGoal } from "../api/plan";

const WEEK_OPTIONS = [2, 4, 6, 8, 10, 12, 14, 16];
const VISUALS = {
  LEAN:   { img: leanImg,   line1: "Lean",   line2: "다이어트" },
  HEALTH: { img: healthImg, line1: "Health", line2: "건강/근력" },
};

function normalizeGoal(g) {
  if (!g) return null;
  return {
    id: g.id,
    type: (g.type || "HEALTH").toUpperCase(),
    startDate: (g.startDate || g.start_date || "").slice(0, 10),
    weeks: g.weeks ?? g.periodWeeks ?? 8,
    startWeightKg:
      g.startWeightKg ?? g.start_weight_kg ?? g.startWeight ?? g.start_weight ?? null,
    targetWeightKg:
      g.targetWeightKg ?? g.target_weight_kg ?? g.targetWeight ?? g.target_weight ?? null,
    createdAt: g.createdAt || g.created_at,
    status: g.status || "ACTIVE",
  };
}

/* ---------------------- 팝업: 기존 목표 선택 ---------------------- */
function GoalPickerModal({ open, goals, onApply, onGo, onDelete, onClose }) {
  const [picked, setPicked] = useState(null);

  useEffect(() => {
    if (!open) return;
    setPicked(goals?.[0]?.id ?? null);
  }, [open, goals]);

  if (!open) return null;

  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.55)",
      display:"grid", placeItems:"center", zIndex:10000
    }}>
      <div style={{
        width:560, maxWidth:"92vw", background:"#0b1220", color:"#e6edf3",
        border:"1px solid #243244", borderRadius:16, padding:18, boxShadow:"0 12px 40px rgba(0,0,0,.4)"
      }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <h3 style={{ margin:"6px 0 12px 0", fontSize:18 }}>기존 목표 불러오기</h3>
          <button onClick={onClose}
            style={{ border:"1px solid #334155", background:"transparent", color:"#e2e8f0",
                     borderRadius:8, padding:"6px 10px", cursor:"pointer" }}>
            닫기
          </button>
        </div>

        {!goals?.length ? (
          <div style={{ fontSize:13, opacity:.75 }}>저장된 목표가 없습니다.</div>
        ) : (
          <div style={{ display:"grid", gap:8, marginBottom:12, maxHeight:"50vh", overflowY:"auto" }}>
            {goals.map(g => (
              <label key={g.id}
                     style={{
                       display:"grid",
                       gridTemplateColumns:"18px 1fr auto",
                       alignItems:"center", gap:10,
                       padding:"10px 12px", border:"1px solid #243244",
                       background:"#0f172a", borderRadius:10
                     }}>
                <input type="radio" name="goalPick" checked={picked===g.id} onChange={()=>setPicked(g.id)} />
                <div>
                  <div style={{ fontWeight:700 }}>
                    {g.type} • {g.weeks}주 • 시작 {g.startDate}
                  </div>
                  <div style={{ fontSize:12, opacity:.85 }}>
                    현재 {g.startWeightKg ?? "-"} kg → 목표 {g.targetWeightKg ?? "-"} kg
                  </div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={() => onGo(g.id)}
                          style={{ padding:"6px 10px", borderRadius:8, border:"1px solid #334155",
                                   background:"#0b1220", color:"#e2e8f0", cursor:"pointer" }}>
                    바로 보기
                  </button>
                  <button onClick={() => onApply(g)}
                          style={{ padding:"6px 10px", borderRadius:8, border:"1px solid #111827",
                                   background:"#111827", color:"#fff", cursor:"pointer" }}>
                    값 불러오기
                  </button>
                  <button
                    onClick={() => onDelete(g.id)}
                    style={{ padding:"6px 10px", borderRadius:8, border:"1px solid #7f1d1d",
                             background:"#7f1d1d", color:"#fff", cursor:"pointer" }}>
                    삭제
                  </button>
                </div>
              </label>
            ))}
          </div>
        )}

        <div style={{ fontSize:12, opacity:.65 }}>
          • “값 불러오기”는 입력칸만 채우고 저장은 따로 눌러야 합니다.
        </div>
      </div>
    </div>
  );
}

/* --------------- 첫 진입 선택 모달: 새 리포트 vs 기존 불러오기 --------------- */
function FirstChoiceModal({ open, hasGoals, onNew, onPick, onClose }) {
  if (!open) return null;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", display:"grid", placeItems:"center", zIndex:10000 }}>
      <div style={{ width:420, maxWidth:"92vw", background:"#0b1220", color:"#e6edf3",
                    border:"1px solid #243244", borderRadius:16, padding:18 }}>
        <h3 style={{ margin:"6px 0 12px 0", fontSize:18 }}>무엇을 할까요?</h3>
        <p style={{ opacity:.85, marginTop:0 }}>새 리포트를 오늘 날짜로 시작하거나, 저장된 목표에서 불러올 수 있어요.</p>
        <div style={{ display:"grid", gap:8, marginTop:8 }}>
          <button onClick={onNew}
            style={{ padding:"10px 12px", borderRadius:10, border:"1px solid #111827",
                     background:"#111827", color:"#fff", fontWeight:700, cursor:"pointer" }}>
            새 리포트(오늘로 시작)
          </button>
          <button onClick={onPick} disabled={!hasGoals}
            style={{ padding:"10px 12px", borderRadius:10, border:"1px solid #334155",
                     background:"#0b1220", color: hasGoals ? "#e2e8f0" : "#64748b", cursor: hasGoals ? "pointer" : "not-allowed" }}>
            기존 목표 불러오기
          </button>
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end", marginTop:12 }}>
          <button onClick={onClose}
            style={{ padding:"6px 10px", borderRadius:8, border:"1px solid #334155",
                     background:"transparent", color:"#e2e8f0", cursor:"pointer" }}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- 페이지 ---------------------------- */
export default function PlanSetup() {
  const [sp] = useSearchParams();
  const planType = (sp.get("type") || "HEALTH").toUpperCase();
  const visual = VISUALS[planType] || VISUALS.LEAN;
  const nav = useNavigate();

  // 기존 목표
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [goals, setGoals] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  // 첫 진입 선택 모달
  const [firstOpen, setFirstOpen] = useState(false);

  // 입력 폼 (기본은 오늘 날짜로 세팅)
  const [weeks, setWeeks] = useState(8);
  const [startDate, setStartDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [current, setCurrent] = useState("");
  const [target, setTarget] = useState("");

  // 저장/충돌
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState({ open: false, goals: [] });

  // 공통 유틸
  function prefillFromGoal(g) {
    setWeeks(g.weeks || 8);
    setStartDate(g.startDate || dayjs().format("YYYY-MM-DD"));
    setCurrent(g.startWeightKg != null ? String(g.startWeightKg) : "");
    setTarget(g.targetWeightKg != null ? String(g.targetWeightKg) : "");
    setPickerOpen(false);
  }
  function goReport(id) {
    nav(`/plan/report?goalId=${id}`);
  }
  function resetAsNewReport() {
    setWeeks(8);
    setStartDate(dayjs().format("YYYY-MM-DD"));
    setCurrent("");
    setTarget("");
  }

  // 기존 목표 로드 (자동 프리필 제거! 사용자가 고를 때만 불러오게)
  useEffect(() => {
    (async () => {
      setGoalsLoading(true);
      try {
        const raw = await listGoals().catch(() => []);
        const all = (Array.isArray(raw) ? raw : []).map(normalizeGoal).filter(Boolean);
        const filtered = all.filter(g => g.type === planType)
                            .sort((a,b)=> new Date(b.startDate||0)-new Date(a.startDate||0));
        setGoals(filtered);
        // 첫 진입 선택 모달 오픈(해당 타입의 목표가 있을 때만)
        if (filtered.length > 0) setFirstOpen(true);
      } finally {
        setGoalsLoading(false);
      }
    })();
  }, [planType]);

  // 그래프 데이터
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

  async function removeGoal(id) {
    if (!window.confirm("정말로 이 목표를 삭제할까요?")) return;
    try {
      await deleteGoal(id);
      setGoals(prev => prev.filter(g => g.id !== id));
    } catch (e) {
      console.error(e);
      alert("삭제에 실패했습니다.");
    }
  }

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
      try {
        const exist = await listGoals();
        if (Array.isArray(exist) && exist.length > 0) {
          nav(`/plan/report?goalId=${exist[0].id}`);
          return;
        }
      } catch (_) {}
      console.error(e);
      alert(e?.response?.data?.message ?? "저장 실패. 콘솔을 확인하세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="plan-wrap">
      {/* 좌측 비주얼 */}
      <div className="plan-left">
        <img src={visual.img} alt={planType} className="bg-img" />
        <div className="overlay-title">
          <div>{visual.line1}</div>
          <div>{visual.line2}</div>
        </div>
      </div>

      {/* 우측 카드 */}
      <div className="plan-right">
        <div className="card">
          {/* 상단 유틸: 새 리포트(오늘), 기존 목표 선택 */}
          <div className="topbar">
            <div />
            <div style={{ display:"flex", gap:8 }}>
              <button
                className="btn-ghost"
                onClick={() => { resetAsNewReport(); }}
                title="폼을 오늘 날짜로 초기화"
              >
                새 리포트(오늘)
              </button>
              <button
                className="btn-ghost"
                onClick={() => setPickerOpen(true)}
                disabled={goalsLoading}
                title="기존 목표에서 선택"
              >
                {goalsLoading ? "불러오는 중…" : "기존 목표 선택"}
              </button>
            </div>
          </div>

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
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" />
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
          <div className="progress-bar"><div className="progress-gradient" /></div>

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

      {/* 기존 목표 선택 팝업 */}
      <GoalPickerModal
        open={pickerOpen}
        goals={goals}
        onApply={prefillFromGoal}
        onGo={goReport}
        onDelete={removeGoal}
        onClose={() => setPickerOpen(false)}
      />

      {/* 첫 진입 선택 모달 */}
      <FirstChoiceModal
        open={firstOpen}
        hasGoals={goals.length > 0}
        onNew={() => { resetAsNewReport(); setFirstOpen(false); }}
        onPick={() => { setFirstOpen(false); setPickerOpen(true); }}
        onClose={() => setFirstOpen(false)}
      />

      {/* 충돌 모달(기존 유지) */}
      {conflict.open && (
        <GoalConflictModal
          goals={conflict.goals}
          onClose={() => setConflict({ open: false, goals: [] })}
          onGo={(id) => { setConflict({ open: false, goals: [] }); nav(`/plan/report?goalId=${id}`); }}
          onChangeDate={() => {
            setStartDate(dayjs().add(1, "day").format("YYYY-MM-DD"));
            setConflict({ open: false, goals: [] });
            alert("시작 날짜를 내일로 변경했어요. 다시 저장을 눌러주세요.");
          }}
        />
      )}
    </div>
  );
}

/* 기존 GoalConflictModal 그대로 */
function GoalConflictModal({ goals, onGo, onChangeDate, onClose }) {
  const active = goals?.[0];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "grid", placeItems: "center", zIndex: 9999 }}>
      <div style={{ background: "#1f2937", color: "#fff", width: 480, borderRadius: 16, padding: 24 }}>
        <h3 style={{ marginTop: 0 }}>이미 진행 중인 목표가 있어요</h3>
        <p style={{ opacity: .85, marginBottom: 16 }}>기존 목표로 바로 이동하거나, 시작 날짜를 바꿔 새 목표를 만들 수 있어요.</p>

        {active && (
          <div style={{ background: "#111827", borderRadius: 12, padding: 12, marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>
              현재: {active.type} • {active.weeks}주 • 시작 {active.startDate}
            </div>
            <button onClick={() => onGo(active.id)} style={{ padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer" }}>
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
