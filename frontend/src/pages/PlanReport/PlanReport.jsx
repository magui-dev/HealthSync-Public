import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMe } from "../../hooks/useMe";
import { getSummary } from "../../api/plan";
import { getMetrics } from "../../api/calc";
import { searchNutri } from "../../api/nutri";

/* ===== 프리셋/유틸 ===== */
const PRESETS = {
  carb: [
    { key: "brown-rice", name: "현미밥", icon: "brown-rice", kcalPer100g: 172, macrosPer100g: { carb_g: 38.9, protein_g: 3.1, fat_g: 0.47 } },
    { key: "sweet-potato", name: "고구마", icon: "sweet-potato", kcalPer100g: 86,  macrosPer100g: { carb_g: 20.1, protein_g: 1.6, fat_g: 0.10 } },
    { key: "oatmeal",     name: "오트밀", icon: "oatmeal",     kcalPer100g: 389, macrosPer100g: { carb_g: 66,  protein_g: 17,  fat_g: 7 } },
  ],
  protein: [
    { key: "chicken-breast", name: "닭가슴살", icon: "chicken-breast", kcalPer100g: 165, macrosPer100g: { carb_g: 0, protein_g: 31, fat_g: 3.6 } },
    { key: "tofu",           name: "두부",     icon: "tofu",           kcalPer100g: 76,  macrosPer100g: { carb_g: 1.9, protein_g: 8,  fat_g: 4.8 } },
    { key: "eggs",           name: "계란",     icon: "eggs",           kcalPer100g: 143, macrosPer100g: { carb_g: 1.1, protein_g: 13, fat_g: 10 } },
  ],
  fat: [
    { key: "olive-oil", name: "올리브유", icon: "olive-oil", kcalPer100g: 884, macrosPer100g: { carb_g: 0, protein_g: 0,  fat_g: 100 } },
    { key: "avocado",   name: "아보카도", icon: "avocado",   kcalPer100g: 160, macrosPer100g: { carb_g: 9, protein_g: 2,  fat_g: 15 } },
    { key: "almond",    name: "아몬드",   icon: "almond",    kcalPer100g: 579, macrosPer100g: { carb_g: 22, protein_g: 21, fat_g: 50 } },
  ],
};
const KCAL_PER_G = { carb: 4, protein: 4, fat: 9 };
const DEFAULT_RATIO = { carb: 50, protein: 30, fat: 20 };
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

/* ===== 컴포넌트 ===== */
export default function PlanReport() {
  const [sp] = useSearchParams();
  const goalId = sp.get("goalId");
  const { me } = useMe();

  const [metrics, setMetrics] = useState(null); // { bmi, bmr, dailyCalories }
  const [summary, setSummary] = useState(null); // { dailyKcal/targetDailyCalories, perMealKcal, macroRatio, ... }
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
      if (s?.mealsPerDay) setMeals(s.mealsPerDay);
    })();
  }, [goalId, meals]);

  const ratio = useMemo(() => summary?.macroRatio || DEFAULT_RATIO, [summary]);

  const perMealKcal = useMemo(() => {
    if (summary?.perMealKcal) return summary.perMealKcal;
    const tdee = metrics?.dailyCalories || 0;
    return tdee && meals ? Math.round(tdee / meals) : 0;
  }, [summary?.perMealKcal, metrics?.dailyCalories, meals]);

  // ✔ 권장섭취 안전 추출(키가 무엇이든 다 커버)
  const dailyKcalResolved = useMemo(
    () => summary?.targetDailyCalories ?? summary?.target_daily_kcal ?? summary?.dailyKcal ?? null,
    [summary]
  );

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

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 24, padding: 24, alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* 상단 카드 */}
        <div style={{ background: "#2b2b2b", color: "#fff", borderRadius: 16, padding: 20 }}>
          <h2 style={{ margin: 0 }}>한 끼 섭취량: {perMealKcal ? `${perMealKcal} kcal` : "-"}</h2>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8, marginBottom: 6 }}>
            <Pill label="BMI"  value={fmt(metrics?.bmi, 1)} />
            <Pill label="BMR"  value={fmt(metrics?.bmr)} sub="kcal" />
            <Pill label="TDEE" value={fmt(metrics?.dailyCalories)} sub="kcal/일" />
            {/* ▼ 여기 한 줄만 바뀜 */}
            <Pill label="권장 섭취" value={fmt(summary?.targetDailyCalories ?? summary?.target_daily_kcal ?? summary?.dailyKcal)} sub="kcal/일" />
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(2,auto)",gap:12, marginTop:4, fontSize:13}}>
            <div>권장 섭취(끼니): <b>{fmt(perMealKcal)}</b> kcal/끼니</div>
            <div>비율: 탄 {ratio.carb}% · 단 {ratio.protein}% · 지 {ratio.fat}%</div>
          </div>

          {/* 식사 횟수 */}
          <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ opacity: 0.9, fontSize: 13 }}>식사 횟수</span>
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => setMeals(n)}
                style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #444",
                         background: meals === n ? "#3a3a3a" : "#2a2a2a", color: "#fff", cursor: "pointer" }}
              >
                {n}끼
              </button>
            ))}
          </div>
        </div>

        {/* 프리셋 추천 카드 (기존 UI 유지) */}
        <PresetBlock title="Carb 탄수화물" items={PRESETS.carb} macro="carb" kcal={perMealKcal} ratio={ratio} />
        <PresetBlock title="Protein 단백질" items={PRESETS.protein} macro="protein" kcal={perMealKcal} ratio={ratio} />
        <PresetBlock title="지방" items={PRESETS.fat} macro="fat" kcal={perMealKcal} ratio={ratio} />
      </div>

      {/* 오른쪽: 검색 */}
      <div style={{ background: "#1f1f1f", color: "#fff", borderRadius: 16, padding: 16 }}>
        <h3 style={{ marginTop: 6, marginBottom: 12 }}>검색</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
            placeholder="식품명 입력 (예: 현미밥)"
            style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #333",
                     background: "#0f0f0f", color: "#fff", outline: "none" }}
          />
          <button onClick={doSearch}
                  style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #444",
                           background: "#2a2a2a", color: "#fff", cursor: "pointer" }}>
            검색
          </button>
        </div>

        <div style={{ marginTop: 14 }}>
          {loading && <div style={{ opacity: 0.8 }}>검색 중…</div>}
          {err && <div style={{ color: "#ff7b7b" }}>{err}</div>}
          {!loading && !err && results.length === 0 && <div style={{ opacity: 0.6, fontSize: 13 }}>검색 결과가 없습니다.</div>}

        <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
            {results.map((r, i) => (
              <div key={r?.foodCd || r?.id || i}
                   style={{ background: "#0f0f0f", border: "1px solid #222", borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 14, marginBottom: 4 }}>{r?.foodNm || r?.name || "이름 없음"}</div>
                {/* 필요한 필드만 간단히 표기 */}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PresetBlock({ title, items, macro, kcal, ratio }) {
  const macroKcal = (m) => {
    const c = (m?.carb_g ?? 0) * KCAL_PER_G.carb;
    const p = (m?.protein_g ?? 0) * KCAL_PER_G.protein;
    const f = (m?.fat_g ?? 0) * KCAL_PER_G.fat;
    return { carbK: Math.round(c), protK: Math.round(p), fatK: Math.round(f), sum: Math.round(c + p + f) };
  };

  return (
    <div style={{ background: "#1f1f1f", color: "#fff", borderRadius: 12, padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {items?.map((it) => {
          const recG = recommendGrams(it, macro, kcal, ratio);
          const m = it.macrosPer100g || {};
          const mk = macroKcal(m);
          return (
            <div key={it.key}
                 style={{ background: "#111", borderRadius: 10, padding: 12,
                          display: "flex", alignItems: "center", gap: 12, minHeight: 84 }}>
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
<<<<<<< HEAD
}
=======
}

function Pill({ label, value, sub }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 6, padding: "8px 12px",
                  borderRadius: 999, background: "#1a1a1a", border: "1px solid #333", color: "#fff", whiteSpace: "nowrap" }}>
      <span style={{ opacity: 0.85, fontSize: 12 }}>{label}</span>
      <strong style={{ fontSize: 14 }}>{value}</strong>
      {sub ? <span style={{ opacity: 0.7, fontSize: 12 }}>{sub}</span> : null}
    </div>
  );
}
>>>>>>> 77439e4 (plan 미완성본 일단올리고 보는작업)
