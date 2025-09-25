// src/pages/PlanReport/PlanReport.jsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMe } from "../../hooks/useMe";
import { getSummary } from "../../api/plan";
import { getMetrics } from "../../api/calc";
import { searchNutri } from "../../api/nutri";
import FoodSearchPanel from "./FoodSearchPanel";
import FoodGraph from "./FoodGraph";

/* ===== 작은 UI 컴포넌트: Pill (이 파일 안에 포함) ===== */
function Pill({ label, value, sub, tone = "gray" }) {
  const colors = {
    gray: { bg: "#f3f4f6", fg: "#111827", br: "#e5e7eb" },  // slate-100 on white
    blue: { bg: "#eef2ff", fg: "#1e3a8a", br: "#e5e7eb" },  // indigo-50
    green: { bg: "#ecfdf5", fg: "#065f46", br: "#e5e7eb" },  // emerald-50
    red: { bg: "#fef2f2", fg: "#7f1d1d", br: "#e5e7eb" },  // rose-50
    amber: { bg: "#fffbeb", fg: "#92400e", br: "#e5e7eb" },  // amber-50
  };

  const { bg, fg, br } = colors[tone] ?? colors.gray;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        background: bg,
        color: fg,
        fontSize: 12,
        fontWeight: 600,
        border: `1px solid ${br}`,
      }}
    >
      {/* ✅ 내부 텍스트 렌더링 유지 */}
      <span style={{ opacity: 0.85 }}>{label}</span>
      <span style={{ fontWeight: 700 }}>{value}</span>
      {sub ? <span style={{ opacity: 0.85 }}>{sub}</span> : null}
    </span>
  );
}

/* ===== 프리셋/유틸 ===== */
const PRESETS = {
  carb: [
    { key: "brown-rice", name: "현미밥", icon: "brown-rice", kcalPer100g: 172, macrosPer100g: { carb_g: 38.9, protein_g: 3.1, fat_g: 0.47 } },
    { key: "sweet-potato", name: "고구마", icon: "sweet-potato", kcalPer100g: 86, macrosPer100g: { carb_g: 20.1, protein_g: 1.6, fat_g: 0.10 } },
    { key: "oatmeal", name: "오트밀", icon: "oatmeal", kcalPer100g: 389, macrosPer100g: { carb_g: 66, protein_g: 17, fat_g: 7 } },
  ],
  protein: [
    { key: "chicken-breast", name: "닭가슴살", icon: "chicken-breast", kcalPer100g: 165, macrosPer100g: { carb_g: 0, protein_g: 31, fat_g: 3.6 } },
    { key: "tofu", name: "두부", icon: "tofu", kcalPer100g: 76, macrosPer100g: { carb_g: 1.9, protein_g: 8, fat_g: 4.8 } },
    { key: "eggs", name: "계란", icon: "eggs", kcalPer100g: 143, macrosPer100g: { carb_g: 1.1, protein_g: 13, fat_g: 10 } },
  ],
  fat: [
    { key: "olive-oil", name: "올리브유", icon: "olive-oil", kcalPer100g: 884, macrosPer100g: { carb_g: 0, protein_g: 0, fat_g: 100 } },
    { key: "avocado", name: "아보카도", icon: "avocado", kcalPer100g: 160, macrosPer100g: { carb_g: 9, protein_g: 2, fat_g: 15 } },
    { key: "almond", name: "아몬드", icon: "almond", kcalPer100g: 579, macrosPer100g: { carb_g: 22, protein_g: 21, fat_g: 50 } },
  ],
};
const KCAL_PER_G = { carb: 4, protein: 4, fat: 9 };
const DEFAULT_RATIO = { carb: 50, protein: 30, fat: 20 }; // 필요하면 50/25/25로 변경
const MKEY = { carb: "carb_g", protein: "protein_g", fat: "fat_g" };

const fmt = (n, digits = 0) =>
  (n ?? n === 0) && Number.isFinite(Number(n))
    ? Number(n).toLocaleString(undefined, { maximumFractionDigits: digits })
    : "-";

function recommendGrams(item, macro, perMealKcal, ratio) {
  const r = ratio?.[macro] ?? DEFAULT_RATIO[macro];
  const targetKcal = Math.max(0, Math.round((perMealKcal || 0) * r / 100));
  const grams100 = item?.macrosPer100g?.[MKEY[macro]] || 0;
  const kcalPer100gFromMacro = grams100 * KCAL_PER_G[macro];
  if (!targetKcal || !kcalPer100gFromMacro) return null;
  const grams = (targetKcal / kcalPer100gFromMacro) * 100;
  return Math.round(grams / 5) * 5;
}

/* ===== 페이지 컴포넌트 ===== */
export default function PlanReport() {
  const [sp] = useSearchParams();
  const goalId = sp.get("goalId"); // URL: /plan/report?goalId=12
  const { me } = useMe();

  const [metrics, setMetrics] = useState(null); // { bmi, bmr, dailyCalories }
  const [summary, setSummary] = useState(null); // { targetDailyCalories/perMealKcal/macroRatio/... }
  const [meals, setMeals] = useState(3);

  // 검색
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [err, setErr] = useState("");

  // 1) Metrics (BMI/BMR/TDEE)
  useEffect(() => {
    if (!me?.userId) return;
    (async () => {
      const m = await getMetrics(me.userId);
      setMetrics(m || {});
    })();
  }, [me?.userId]);

  // 2) Summary (권장 섭취/비율/끼니당)
  useEffect(() => {
    if (!goalId) return;
    (async () => {
      const s = await getSummary(goalId, { mealsPerDay: meals });
      setSummary(s || {});
      if (s?.mealsPerDay && s.mealsPerDay !== meals) setMeals(s.mealsPerDay); // 루프 방지
    })();
  }, [goalId, meals]);

  // 비율/끼니 kcal
  const ratio = useMemo(() => summary?.macroRatio || DEFAULT_RATIO, [summary]);
  const perMealKcal = useMemo(() => {
    if (summary?.perMealKcal) return summary.perMealKcal;
    const tdee = metrics?.dailyCalories || 0;
    return tdee && meals ? Math.round(tdee / meals) : 0;
  }, [summary?.perMealKcal, metrics?.dailyCalories, meals]);

  // 일일 권장 kcal(키 호환)
  const dailyKcalResolved = useMemo(
    () => summary?.targetDailyCalories ?? summary?.target_daily_kcal ?? summary?.dailyKcal ?? null,
    [summary]
  );

  // 목표 라벨 (LEAN/HEALTH)
  const goalLabel = useMemo(() => {
    const t = (summary?.goalType || "").toUpperCase();
    if (t === "LEAN") return "Lean";
    if (t === "HEALTH") return "Health";
    return "Health"; // 기본값
  }, [summary?.goalType]);

  // 검색
  const doSearch = async () => {
    setErr(""); setResults([]);
    if (!q.trim()) return;
    setLoading(true);
    try {
      const arr = await searchNutri(q.trim());
      setResults((Array.isArray(arr) ? arr : []).slice(0, 20));
    } catch {
      setErr("검색 실패");
    } finally {
      setLoading(false);
    }
  };

  // goalId 없으면 사용자 안내
  if (!goalId) {
    return (
      <div style={{ padding: 24 }}>
        <h2 style={{ marginTop: 0 }}>goalId 가 없습니다.</h2>
        <div>목표 생성 후 이 페이지로 이동해 주세요.</div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 24, padding: 24, alignItems: "start", background: "#fafafa"}}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* 상단 카드 */}
        <div style={{
          background: "#ffffff", color: "#111827",
          borderRadius: 16, padding: 20,
          border: "1px solid #e5e7eb", boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
        }}>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: 16, alignItems: "start"
          }}>
            {/* 좌측: 기존 요약 */}
            <div>
              <h2 style={{ margin: 0 }}>1회 식사 권장량 : {perMealKcal ? `${perMealKcal} kcal` : "-"}</h2>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8, marginBottom: 6 }}>
                <Pill label="BMI" value={fmt(metrics?.bmi, 1)} />
                <Pill label="BMR" value={fmt(metrics?.bmr)} sub="kcal" />
                <Pill label="TDEE" value={fmt(metrics?.dailyCalories)} sub="kcal/일" />
                <Pill label="권장 섭취" value={fmt(dailyKcalResolved)} sub="kcal/일" tone="blue" />
              </div>

              <div style={{ marginTop: 4, fontSize: 13 }}>
                목표 - <b>{goalLabel}</b> [
                탄수화물 - <b>{ratio?.carb ?? "-"}</b>% :
                단백질 - <b>{ratio?.protein ?? "-"}</b>% :
                지방 - <b>{ratio?.fat ?? "-"}</b>% ] 비율로 추천합니다.
              </div>

              {/* 식사 횟수 */}
              <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ opacity: 0.9, fontSize: 13 }}>식사 횟수</span>
                {[2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => setMeals(n)}
                    style={{
                      padding: "6px 10px", borderRadius: 8, border: "1px solid #444",
                      background: meals === n ? "#3a3a3a" : "#2a2a2a", color: "#fff", cursor: "pointer"
                    }}
                  >
                    {n}끼
                  </button>
                ))}
              </div>
            </div>

            {/* 우측: 새 FoodGraph */}
            <FoodGraph perMealKcal={perMealKcal} ratio={ratio} />
          </div>
        </div>

        {/* 프리셋 추천 카드 */}
        <PresetBlock title="Carb 탄수화물" items={PRESETS.carb} macro="carb" kcal={perMealKcal} ratio={ratio} />
        <PresetBlock title="Protein 단백질" items={PRESETS.protein} macro="protein" kcal={perMealKcal} ratio={ratio} />
        <PresetBlock title="지방" items={PRESETS.fat} macro="fat" kcal={perMealKcal} ratio={ratio} />
      </div>

      {/* 오른쪽: 검색 */}
      <FoodSearchPanel />
    </div>
  );
}

/* ===== 하위 블록 ===== */
function PresetBlock({ title, items, macro, kcal, ratio }) {
  const macroKcal = (m) => {
    const c = (m?.carb_g ?? 0) * KCAL_PER_G.carb;
    const p = (m?.protein_g ?? 0) * KCAL_PER_G.protein;
    const f = (m?.fat_g ?? 0) * KCAL_PER_G.fat;
    return { carbK: Math.round(c), protK: Math.round(p), fatK: Math.round(f), sum: Math.round(c + p + f) };
  };

  return (
    <div style={{ background: "#ffffff", color: "#111827", borderRadius: 12, padding: 16, border:"1px solid #e5e7eb", boxShadow:"0 1px 2px rgba(0,0,0,0.03)" }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {items?.map((it) => {
          const recG = recommendGrams(it, macro, kcal, ratio);
          const m = it.macrosPer100g || {};
          const mk = macroKcal(m);
          return (
            <div key={it.key}
              style={{
                background:"#fafafa", border:"1px solid #e5e7eb",
                borderRadius:10, padding:12,
                display:"flex", alignItems:"center", gap:12, minHeight:84
              }}>
              <img alt={it.name} src={`/icons/${it.icon}.png`}
                style={{ width: 44, height: 44, objectFit: "contain", flex: "0 0 44px" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{it.name}</div>
                <div style={{ fontSize: 12, opacity: 0.9, lineHeight: 1.2 }}>
                  <div>탄: {mk.carbK} kcal</div>
                  <div>단: {mk.protK} kcal</div>
                  <div>지: {mk.fatK} kcal</div>
                </div>
                <div style={{ marginTop: 2, fontSize: 12, opacity: 0.9 }}>총 칼로리: <b>{it.kcalPer100g}</b> kcal</div>
                <div style={{ marginTop: 4, fontSize: 13 }}>추천: <b>{recG != null ? `${recG} g` : "-"}</b></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
