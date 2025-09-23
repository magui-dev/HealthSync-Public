// src/pages/plan/PlanReport.jsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMe } from "../../hooks/useMe";
import { getSummary } from "../../api/plan";
import { api } from "../../api/axios";
import { searchNutri } from "../../api/nutri";

/* ===============================
   프리셋(아이콘 키는 대시-이름)
=================================*/
const PRESETS = {
  carb: [
    { key: "brown-rice",  name: "현미밥",   icon: "brown-rice",  kcalPer100g: 172, macrosPer100g: { carb_g: 38.9, protein_g: 3.1,  fat_g: 0.47 } },
    { key: "sweet-potato",name: "고구마",   icon: "sweet-potato",kcalPer100g:  86, macrosPer100g: { carb_g: 20.1, protein_g: 1.6,  fat_g: 0.10 } },
    { key: "oatmeal",     name: "오트밀",   icon: "oatmeal",     kcalPer100g: 389, macrosPer100g: { carb_g: 66,   protein_g: 17,   fat_g: 7    } },
  ],
  protein: [
    { key: "chicken-breast", name: "닭가슴살", icon: "chicken-breast", kcalPer100g: 165, macrosPer100g: { carb_g: 0, protein_g: 31, fat_g: 3.6 } },
    { key: "tofu",           name: "두부",     icon: "tofu",            kcalPer100g:  76, macrosPer100g: { carb_g: 1.9, protein_g: 8, fat_g: 4.8 } },
    { key: "eggs",           name: "계란",     icon: "eggs",            kcalPer100g: 143, macrosPer100g: { carb_g: 1.1, protein_g: 13, fat_g: 10 } },
  ],
  fat: [
    { key: "olive-oil",   name: "올리브유", icon: "olive-oil",   kcalPer100g: 884, macrosPer100g: { carb_g: 0,  protein_g: 0,  fat_g: 100 } },
    { key: "avocado",     name: "아보카도", icon: "avocado",     kcalPer100g: 160, macrosPer100g: { carb_g: 9,  protein_g: 2,  fat_g: 15  } },
    { key: "almond",      name: "아몬드",   icon: "almond",      kcalPer100g: 579, macrosPer100g: { carb_g: 22, protein_g: 21, fat_g: 50  } },
  ],
};

const KCAL_PER_G = { carb: 4, protein: 4, fat: 9 };
const MKEY = { carb: "carb_g", protein: "protein_g", fat: "fat_g" };
const DEFAULT_RATIO = { carb: 50, protein: 30, fat: 20 };

/* ===============================
   공통 파서
=================================*/
const toNumOrNull = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};

const pickKcal = (obj) => {
  const candidates = [
    obj?.kcalPer100g, obj?.kcal_100g, obj?.kcal100g, obj?.kcal,
    obj?.energyPer100g, obj?.ENERC_KCAL, obj?.enerc, obj?.ENERC, obj?.NUTR_CONT1
  ];
  for (const c of candidates) {
    const n = toNumOrNull(c);
    if (n != null) return n;
  }
  return null;
};

const pickMacros = (obj) => {
  const carbCands = [obj?.carb_g, obj?.carb, obj?.CHOCDF, obj?.chocdf, obj?.NUTR_CONT2, obj?.CHOAVL];
  const protCands = [obj?.protein_g, obj?.protein, obj?.PROCNT, obj?.PROT, obj?.prot, obj?.NUTR_CONT3];
  const fatCands  = [obj?.fat_g, obj?.fat, obj?.FAT, obj?.fatce, obj?.NUTR_CONT4, obj?.LIPID];
  const get = (arr) => {
    for (const v of arr) {
      const n = toNumOrNull(v);
      if (n != null) return n;
    }
    return null;
  };
  return { carb_g: get(carbCands), protein_g: get(protCands), fat_g: get(fatCands) };
};

/* ===============================
   추천 g 계산
=================================*/
function recommendGrams(item, macro, perMealKcal, ratio) {
  const r = ratio?.[macro] ?? DEFAULT_RATIO[macro];
  const targetKcal = Math.max(0, Math.round((perMealKcal || 0) * r / 100));
  const grams100 = item?.macrosPer100g?.[MKEY[macro]] || 0;
  const kcalFromMacroPer100g = grams100 * KCAL_PER_G[macro];
  if (!targetKcal || !kcalFromMacroPer100g) return null;
  const grams = (targetKcal / kcalFromMacroPer100g) * 100;
  return Math.round(grams / 5) * 5;
}

/* ===============================
   메인 컴포넌트
=================================*/
export default function PlanReport() {
  const [sp] = useSearchParams();
  const goalId = sp.get("goalId");
  const { me } = useMe();

  // 요약/비율
  const [summary, setSummary] = useState(null);

  // 칼로리 기준 & 식사 횟수
  const [dailyKcalBMI, setDailyKcalBMI] = useState(null);
  const [dailyKcalGoal, setDailyKcalGoal] = useState(null);
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [kcalSource, setKcalSource] = useState("bmi"); // 'bmi' | 'goal' | 'custom'
  const [customDailyKcal, setCustomDailyKcal] = useState("");

  // BMI 세부
  const [bmiInfo, setBmiInfo] = useState(null);

  // 검색
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!goalId) return;
    (async () => {
      // 요약
      try {
        const s = await getSummary(goalId);
        setSummary(s || {});
        const goalKcal = Number(s?.targetDailyCalories || s?.dailyTargetKcal || 0) || null;
        if (goalKcal) setDailyKcalGoal(goalKcal);
        if (s?.mealsPerDay) setMealsPerDay(s.mealsPerDay);
      } catch {
        setSummary({});
      }

      // BMI 기준 칼로리 + 세부
      try {
        if (me?.id) {
          const res = await api.post("/calc/bmi", null, { params: { userId: me.id } });
          const { dailyCalories, bmr, activityCalories, bmi } = res.data || {};
          setDailyKcalBMI(Number(dailyCalories || 0));
          setBmiInfo({
            bmi: bmi ?? null,
            bmr: bmr ?? null,                       // 기초대사량
            activity: activityCalories ?? null,     // 활동대사량
            total: dailyCalories ?? null,           // 총 대사량
          });
        } else {
          setDailyKcalBMI(0);
          setBmiInfo(null);
        }
      } catch {
        setDailyKcalBMI(0);
        setBmiInfo(null);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalId, me?.id]);

  // 한 끼 kcal
  const perMealKcal = useMemo(() => {
    const base =
      kcalSource === "goal"   ? (dailyKcalGoal ?? 0)
    : kcalSource === "custom" ? (Number(customDailyKcal) || 0)
    :                           (dailyKcalBMI ?? 0);
    return base && mealsPerDay ? Math.round(base / mealsPerDay) : 0;
  }, [kcalSource, dailyKcalBMI, dailyKcalGoal, customDailyKcal, mealsPerDay]);

  const ratio = useMemo(() => summary?.macroRatio || DEFAULT_RATIO, [summary]);
  const kcal = perMealKcal ?? 0;

  // 검색
  const doSearch = async () => {
    setErr("");
    setResults([]);
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
  const onKeyDown = (e) => { if (e.key === "Enter") doSearch(); };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.2fr 0.8fr",
        gap: 24,
        padding: 24,
        alignItems: "start",
      }}
    >
      {/* 왼쪽: 상단 요약 + 프리셋 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* 상단 카드 */}
        <div style={{ background: "#2b2b2b", color: "#fff", borderRadius: 16, padding: 20 }}>
          <h2 style={{ margin: 0 }}>한 끼 섭취량: {kcal ? `${kcal} kcal` : "-"}</h2>

          <div style={{ marginTop: 8, opacity: 0.9 }}>
            비율: 탄 {ratio.carb}% · 단 {ratio.protein}% · 지 {ratio.fat}%
          </div>

          {/* 식사 횟수 */}
          <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ opacity: 0.9, fontSize: 13 }}>식사 횟수</span>
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => setMealsPerDay(n)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "1px solid #444",
                  background: mealsPerDay === n ? "#3a3a3a" : "#2a2a2a",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                {n}끼
              </button>
            ))}
          </div>

          {/* 일일 기준 선택 */}
          <div style={{ marginTop: 10, display: "grid", gap: 8, fontSize: 13 }}>
            {/* BMI 기준 + 상세 */}
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="radio"
                  name="kcalSource"
                  checked={kcalSource === "bmi"}
                  onChange={() => setKcalSource("bmi")}
                />
                <span>프로필(BMI) 기준</span>
                {dailyKcalBMI ? <span>· {dailyKcalBMI} kcal/일</span> : null}
              </div>
              {bmiInfo && (
                <div style={{ marginLeft: 24, fontSize: 12, opacity: 0.8, lineHeight: 1.35 }}>
                  <div>BMI: {bmiInfo.bmi ?? "-"}</div>
                  <div>기초대사량(BMR): {bmiInfo.bmr ?? "-"} kcal</div>
                  <div>활동대사량: {bmiInfo.activity ?? "-"} kcal</div>
                  <div>총 대사량: {bmiInfo.total ?? "-" } kcal</div>
                </div>
              )}
            </label>

            {/* 목표 칼로리 */}
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="radio"
                name="kcalSource"
                checked={kcalSource === "goal"}
                onChange={() => setKcalSource("goal")}
                disabled={!dailyKcalGoal}
              />
              목표 칼로리 {dailyKcalGoal ? `· ${dailyKcalGoal} kcal/일` : "(미설정)"}
            </label>

            {/* 직접 입력 */}
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="radio"
                name="kcalSource"
                checked={kcalSource === "custom"}
                onChange={() => setKcalSource("custom")}
              />
              직접 입력
              <input
                type="number"
                placeholder="예: 1800"
                value={customDailyKcal}
                onChange={(e) => setCustomDailyKcal(e.target.value)}
                style={{
                  width: 100,
                  padding: "6px 8px",
                  borderRadius: 6,
                  border: "1px solid #333",
                  background: "#0f0f0f",
                  color: "#fff",
                  outline: "none",
                }}
              />
              kcal/일
            </label>
          </div>

          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>
            * 추천 g은 식사 횟수와 선택한 일일 기준(kcal)에 따라 자동 계산됩니다.
          </div>
        </div>

        {/* 프리셋 카드(아이콘 좌 / 텍스트 우) */}
        <PresetBlock title="Carb 탄수화물" items={PRESETS.carb} macro="carb" kcal={kcal} ratio={ratio} />
        <PresetBlock title="Protein 단백질"   items={PRESETS.protein} macro="protein" kcal={kcal} ratio={ratio} />
        <PresetBlock title="지방"              items={PRESETS.fat} macro="fat" kcal={kcal} ratio={ratio} />
      </div>

      {/* 오른쪽: 검색 */}
      <div style={{ background: "#1f1f1f", color: "#fff", borderRadius: 16, padding: 16 }}>
        <h3 style={{ marginTop: 6, marginBottom: 12 }}>검색</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="식품명 입력 (예: 현미밥)"
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #333",
              background: "#0f0f0f",
              color: "#fff",
              outline: "none",
            }}
          />
          <button
            onClick={doSearch}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #444",
              background: "#2a2a2a",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            검색
          </button>
        </div>

        <div style={{ marginTop: 14 }}>
          {loading && <div style={{ opacity: 0.8 }}>검색 중…</div>}
          {err && <div style={{ color: "#ff7b7b" }}>{err}</div>}
          {!loading && !err && results.length === 0 && (
            <div style={{ opacity: 0.6, fontSize: 13 }}>검색 결과가 없습니다.</div>
          )}

          <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
            {results.map((r, i) => {
              const kcal100 = pickKcal(r);
              const m = pickMacros(r);
              return (
                <div
                  key={r?.foodCd || r?.id || i}
                  style={{
                    background: "#0f0f0f",
                    border: "1px solid #222",
                    borderRadius: 10,
                    padding: 10,
                  }}
                >
                  <div style={{ fontSize: 14, marginBottom: 4 }}>{r?.foodNm || r?.name || "이름 없음"}</div>
                  <div style={{ fontSize: 12, opacity: 0.9 }}>
                    100g 당 <b>{kcal100 ?? "-"}</b> kcal · 탄 {m.carb_g ?? "-"}g · 단 {m.protein_g ?? "-"}g · 지 {m.fat_g ?? "-"}g
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===============================
   프리셋 카드 묶음 (아이콘 좌 / 텍스트 우)
=================================*/
function PresetBlock({ title, items, macro, kcal, ratio }) {
  const macroKcal = (m) => {
    const c = (m?.carb_g ?? 0) * KCAL_PER_G.carb;
    const p = (m?.protein_g ?? 0) * KCAL_PER_G.protein;
    const f = (m?.fat_g ?? 0) * KCAL_PER_G.fat;
    return {
      carbK: Math.round(c),
      protK: Math.round(p),
      fatK: Math.round(f),
      sum: Math.round(c + p + f),
    };
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
            <div
              key={it.key}
              style={{
                background: "#111",
                borderRadius: 10,
                padding: 12,
                display: "flex",
                alignItems: "center",
                gap: 12,
                minHeight: 84,
              }}
            >
              {/* 왼쪽: 아이콘 */}
              <img
                alt={it.name}
                src={`/icons/${it.icon}.png`}
                style={{ width: 44, height: 44, objectFit: "contain", flex: "0 0 44px" }}
              />

              {/* 오른쪽: 텍스트 */}
              <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{it.name}</div>
                <div style={{ fontSize: 12, opacity: 0.9, lineHeight: 1.2 }}>
                  <div>탄: {mk.carbK} kcal</div>
                  <div>단: {mk.protK} kcal</div>
                  <div>지: {mk.fatK} kcal</div>
                </div>
                <div style={{ marginTop: 2, fontSize: 12, opacity: 0.9 }}>
                  총 칼로리: <b>{it.kcalPer100g}</b> kcal
                </div>
                <div style={{ marginTop: 4, fontSize: 13 }}>
                  추천: <b>{recG != null ? `${recG} g` : "-"}</b>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
