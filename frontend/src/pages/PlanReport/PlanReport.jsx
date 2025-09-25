// src/pages/PlanReport/PlanReport.jsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMe } from "../../hooks/useMe";
import { getSummary } from "../../api/plan";
import { getMetrics } from "../../api/calc";
import FoodSearchPanel from "./FoodSearchPanel";
import FoodGraph from "./FoodGraph";
import SavedMealsStrip from "./SavedMealsStrip"; // 공용 컴포넌트

/* ===== 전역 UI ===== */
const UI = {
  presetTitleSize: 16,
  blockGap: 12,
  innerGap: 10,
  iconImg: 40,
  iconCardPadding: 10,
  iconCardMinH: 112,
  slotsColWidth: 280,
};

/* ===== 공통 유틸 ===== */
const DEFAULT_RATIO = { carb: 50, protein: 30, fat: 20 };
const fmt = (n, d = 0) =>
  (n ?? n === 0) && Number.isFinite(Number(n))
    ? Number(n).toLocaleString(undefined, { maximumFractionDigits: d })
    : "-";

function summarizeSlot(s) {
  if (!s) return null;
  const f = (s.grams || 0) / 100;
  const carb = +(Number(s.per100?.carb || 0) * f).toFixed(1);
  const protein = +(Number(s.per100?.protein || 0) * f).toFixed(1);
  const fat = +(Number(s.per100?.fat || 0) * f).toFixed(1);
  const kcal = Math.round(carb * 4 + protein * 4 + fat * 9);
  return { ...s, carb, protein, fat, kcal };
}

/* ===== 작은 UI ===== */
function Pill({ label, value, sub, tone = "gray" }) {
  const colors = {
    gray: { bg: "#f3f4f6", fg: "#111827", br: "#e5e7eb" },
    blue: { bg: "#eef2ff", fg: "#1e3a8a", br: "#e5e7eb" },
    green: { bg: "#ecfdf5", fg: "#065f46", br: "#e5e7eb" },
    red: { bg: "#fef2f2", fg: "#7f1d1d", br: "#e5e7eb" },
    amber: { bg: "#fffbeb", fg: "#92400e", br: "#e5e7eb" },
  };
  const { bg, fg, br } = colors[tone] ?? colors.gray;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:6, padding:"4px 10px",
      borderRadius:999, background:bg, color:fg, fontSize:12, fontWeight:600, border:`1px solid ${br}`
    }}>
      <span style={{ opacity:.85 }}>{label}</span>
      <span style={{ fontWeight:700 }}>{value}</span>
      {sub ? <span style={{ opacity:.85 }}>{sub}</span> : null}
    </span>
  );
}

/* ===== 프리셋 데이터 ===== */
const PRESETS = {
  carb: [
    { key:"brown-rice", name:"현미밥", icon:"brown-rice", kcalPer100g:172, macrosPer100g:{ carb_g:38.9, protein_g:3.1, fat_g:0.47 } },
    { key:"sweet-potato", name:"고구마", icon:"sweet-potato", kcalPer100g:86,  macrosPer100g:{ carb_g:20.1, protein_g:1.6, fat_g:0.10 } },
    { key:"oatmeal", name:"오트밀", icon:"oatmeal", kcalPer100g:389, macrosPer100g:{ carb_g:66, protein_g:17, fat_g:7 } },
  ],
  protein: [
    { key:"chicken-breast", name:"닭가슴살", icon:"chicken-breast", kcalPer100g:165, macrosPer100g:{ carb_g:0, protein_g:31, fat_g:3.6 } },
    { key:"tofu", name:"두부", icon:"tofu", kcalPer100g:76,  macrosPer100g:{ carb_g:1.9, protein_g:8, fat_g:4.8 } },
    { key:"eggs", name:"계란", icon:"eggs", kcalPer100g:143, macrosPer100g:{ carb_g:1.1, protein_g:13, fat_g:10 } },
  ],
  fat: [
    { key:"olive-oil", name:"올리브유", icon:"olive-oil", kcalPer100g:884, macrosPer100g:{ carb_g:0, protein_g:0, fat_g:100 } },
    { key:"avocado", name:"아보카도", icon:"avocado", kcalPer100g:160, macrosPer100g:{ carb_g:9, protein_g:2, fat_g:15 } },
    { key:"almond", name:"아몬드", icon:"almond", kcalPer100g:579, macrosPer100g:{ carb_g:22, protein_g:21, fat_g:50 } },
  ],
};

/* ===== 좌측 세로 4칸 슬롯 ===== */
function SlotsColumn({ slots, setSlot, onSave }) {
  const box = {
    background:"#fff", border:"1px solid #e5e7eb", borderRadius:12,
    padding:10, boxShadow:"0 1px 2px rgba(0,0,0,0.03)",
    minHeight:112, display:"flex", flexDirection:"column", justifyContent:"space-between"
  };
  const btn = { padding:"6px 10px", border:"1px solid #e5e7eb", borderRadius:8, background:"#f9fafb", cursor:"pointer" };

  const slotCard = (title, key) => {
    const s = slots[key];
    if (!s) {
      return (
        <div style={box}>
          <div style={{ fontWeight:700, marginBottom:6 }}>{title}</div>
          <div style={{ fontSize:12, opacity:.6 }}>왼쪽 프리셋의 ‘담기’로 채워보세요.</div>
        </div>
      );
    }
    const sum = summarizeSlot(s);
    return (
      <div style={box}>
        <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
          <img src={s.iconUrl} alt={s.name} style={{ width:40, height:40, objectFit:"contain" }}/>
          <div style={{ minWidth:0 }}>
            <div style={{ fontWeight:700, marginBottom:2 }}>{title}</div>
            <div style={{ fontWeight:600, fontSize:13, maxWidth:"100%", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{s.name}</div>
          </div>
        </div>
        <div style={{ fontSize:12, opacity:.85, marginTop:6 }}>
          {s.grams} g · 탄 {sum.carb} g · 단 {sum.protein} g · 지 {sum.fat} g · {sum.kcal} kcal
        </div>
        <div style={{ display:"flex", gap:6, marginTop:8 }}>
          <button style={btn} onClick={()=>setSlot(key, { ...s, grams: Math.max(0, s.grams-10) })}>-10g</button>
          <button style={btn} onClick={()=>setSlot(key, { ...s, grams: s.grams+10 })}>+10g</button>
          <button style={{ ...btn, background:"#fee2e2", border:"1px solid #fecaca" }} onClick={()=>setSlot(key, null)}>삭제</button>
        </div>
      </div>
    );
  };

  // 커스텀 입력
  const [custom, setCustom] = useState({
    name:"사용자 정의",
    per100:{ carb:0, protein:0, fat:0, kcal:0 },
    grams:100,
  });
  const [nameFocused, setNameFocused] = useState(false);
  const inp = { padding:"3px 12px", border:"1px solid #e5e7eb", borderRadius:9, width:"100%", maxWidth:"100%", boxSizing:"border-box", fontSize:13, background:"#fff" };
  const inpGray = { ...inp, background: nameFocused ? "#fff" : "#f3f4f6", border: nameFocused ? "1px solid #d1d5db" : "1px solid #e5e7eb" };
  const row = { display:"grid", gridTemplateColumns:"90px 1fr 18px", gap:6, alignItems:"center" };

  const addCustom = () => {
    setSlot("custom", {
      id: crypto.randomUUID?.() ?? String(Date.now()),
      macro: "CUSTOM",
      name: (custom.name?.trim() || "사용자 정의").slice(0, 20),
      iconUrl: "/icons/custom.png",
      grams: Math.max(0, Number(custom.grams)||0),
      per100: {
        carb: Number(custom.per100.carb)||0,
        protein: Number(custom.per100.protein)||0,
        fat: Number(custom.per100.fat)||0,
        kcal: Number(custom.per100.kcal)||0,
      }
    });
  };

  return (
    <div style={{ display:"grid", gap:10, width:UI.slotsColWidth }}>
      {slotCard("탄수화물", "carb")}
      {slotCard("단백질",   "protein")}
      {slotCard("지방",     "fat")}

      {/* 커스텀 폼 */}
      <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:10, boxShadow:"0 1px 2px rgba(0,0,0,0.03)" }}>
        {slots.custom ? (
          <>{slotCard("", "custom")}</>
        ) : (
          <>
            <div style={{ fontWeight:700, marginBottom:6 }}>커스텀</div>
            <div style={{ marginBottom:6 }}>
              <div style={{ fontSize:12, opacity:.85, marginBottom:4 }}>이름</div>
              <input
                placeholder="사용자 정의"
                value={custom.name}
                onFocus={()=>setNameFocused(true)}
                onBlur={()=>setNameFocused(false)}
                onChange={e=>setCustom(v=>({...v, name:e.target.value}))}
                style={inpGray}
                maxLength={24}
              />
            </div>
            <div style={{ fontWeight:700, margin:"4px 0 6px 0", fontSize:13 }}>100 g 당 영양</div>
            <div style={{ ...row, marginBottom:4 }}>
              <div style={{ fontSize:12, opacity:.85 }}>탄수화물</div>
              <input placeholder="g" value={custom.per100.carb}
                onChange={e=>setCustom(v=>({...v, per100:{...v.per100, carb:e.target.value.replace(/[^\d.]/g,"")}}))}
                style={inp}/><div style={{ fontSize:12, opacity:.7, textAlign:"center" }}>g</div>
            </div>
            <div style={{ ...row, marginBottom:4 }}>
              <div style={{ fontSize:12, opacity:.85 }}>단백질</div>
              <input placeholder="g" value={custom.per100.protein}
                onChange={e=>setCustom(v=>({...v, per100:{...v.per100, protein:e.target.value.replace(/[^\d.]/g,"")}}))}
                style={inp}/><div style={{ fontSize:12, opacity:.7, textAlign:"center" }}>g</div>
            </div>
            <div style={{ ...row, marginBottom:8 }}>
              <div style={{ fontSize:12, opacity:.85 }}>지방</div>
              <input placeholder="g" value={custom.per100.fat}
                onChange={e=>setCustom(v=>({...v, per100:{...v.per100, fat:e.target.value.replace(/[^\d.]/g,"")}}))}
                style={inp}/><div style={{ fontSize:12, opacity:.7, textAlign:"center" }}>g</div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"90px 1fr auto", gap:6, alignItems:"center" }}>
              <div style={{ fontSize:12, opacity:.85 }}>그램</div>
              <input placeholder="예: 300" value={custom.grams}
                onChange={(e)=>setCustom(v=>({...v, grams:e.target.value.replace(/[^\d]/g,"")}))}
                style={inp} maxLength={5}/>
              <button onClick={addCustom}
                style={{ padding:"7px 12px", border:"1px solid #e5e7eb", background:"#f9fafb", borderRadius:9, cursor:"pointer", fontWeight:600, fontSize:13 }}>
                담기
              </button>
            </div>
          </>
        )}
      </div>

      {/* 저장 버튼 */}
      <button
        onClick={onSave}
        style={{
          width:"100%", height:UI.iconCardMinH, borderRadius:12,
          border:"1px solid #111827", background:"#111827", color:"#fff",
          fontWeight:700, boxShadow:"0 1px 2px rgba(0,0,0,0.06)"
        }}
      >
        나의 식단 구성 저장
      </button>
    </div>
  );
}

/* ===== 프리셋 카드 ===== */
function PresetBlock({ title, items, macro, onAdd }) {
  const macroKcal = (m) => {
    const c = (m?.carb_g ?? 0) * 4;
    const p = (m?.protein_g ?? 0) * 4;
    const f = (m?.fat_g ?? 0) * 9;
    return { carbK: Math.round(c), protK: Math.round(p), fatK: Math.round(f) };
  };
  return (
    <div style={{
      background:"#ffffff", color:"#111827",
      borderRadius:12, padding:14, border:"1px solid #e5e7eb", boxShadow:"0 1px 2px rgba(0,0,0,0.03)"
    }}>
      <h3 style={{ marginTop:0, marginBottom:8, fontSize:UI.presetTitleSize }}>{title}</h3>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:UI.innerGap }}>
        {items?.map((it) => {
          const m = it.macrosPer100g || {};
          const mk = macroKcal(m);
          return (
            <div key={it.key}
              style={{
                background:"#fafafa", border:"1px solid #e5e7eb", borderRadius:10, padding:UI.iconCardPadding,
                display:"flex", flexDirection:"column", gap:8, minHeight:UI.iconCardMinH
              }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <img alt={it.name} src={`/icons/${it.icon}.png`} style={{ width:UI.iconImg, height:UI.iconImg, objectFit:"contain" }}/>
                <div style={{ fontSize:14, fontWeight:600 }}>{it.name}</div>
              </div>
              <div style={{ fontSize:12, opacity:.9, lineHeight:1.25 }}>
                <div>탄: {mk.carbK} kcal · 단: {mk.protK} kcal · 지: {mk.fatK} kcal</div>
                <div>총 칼로리: <b>{it.kcalPer100g}</b> kcal</div>
              </div>
              <div>
                <button onClick={() => onAdd?.(macro, it)}
                  style={{ padding:"6px 10px", borderRadius:8, border:"1px solid #e5e7eb", background:"#f9fafb", cursor:"pointer" }}>
                  담기
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ===== 페이지 컴포넌트 ===== */
export default function PlanReport() {
  const [sp] = useSearchParams();
  const goalId = sp.get("goalId");
  const { me } = useMe();

  const [metrics, setMetrics] = useState(null);
  const [summary, setSummary] = useState(null);
  const [meals, setMeals] = useState(3);

  // 우측 슬롯 상태
  const [slots, setSlots] = useState({ carb:null, protein:null, fat:null, custom:null });
  const setSlot = (macro, slotOrNull) => setSlots(prev => ({ ...prev, [macro]: slotOrNull }));

  // 저장된 “나의 식단” 목록 (최신이 0번)
  const [savedCompositions, setSavedCompositions] = useState(() => {
    try { return JSON.parse(localStorage.getItem("savedMeals") || "[]"); } catch { return []; }
  });

  // 프리셋에서 담기
  function handleAddFromPreset(macro, presetItem) {
    const slot = {
      id: crypto.randomUUID?.() ?? String(Date.now()),
      macro: macro.toUpperCase(),
      name: presetItem.name,
      iconUrl: `/icons/${presetItem.icon}.png`,
      grams: 100,
      per100: {
        carb: presetItem?.macrosPer100g?.carb_g ?? 0,
        protein: presetItem?.macrosPer100g?.protein_g ?? 0,
        fat: presetItem?.macrosPer100g?.fat_g ?? 0,
        kcal: presetItem?.kcalPer100g ?? 0,
      }
    };
    setSlot(macro, slot);
  }

  // ✅ 최근 저장을 슬롯으로 로드해 그래프 즉시 계산
  function handleApplySavedToSlots(saved) {
    if (!saved?.items?.length) return;

    const toSlot = (it) => ({
      id: it.id,
      macro: (it.macro || "CUSTOM").toUpperCase(),
      name: it.name,
      iconUrl: it.iconUrl || "/icons/custom.png",
      grams: Math.max(0, Number(it.grams) || 0),
      per100: {
        // per100 = (총량 / g) * 100  => summarizeSlot()와 역산 관계
        carb: it.grams ? +( (Number(it.carb)||0)    * 100 / it.grams ).toFixed(2) : 0,
        protein: it.grams ? +( (Number(it.protein)||0) * 100 / it.grams ).toFixed(2) : 0,
        fat: it.grams ? +( (Number(it.fat)||0)      * 100 / it.grams ).toFixed(2) : 0,
        kcal: it.grams ? Math.round( (Number(it.kcal)||0) * 100 / it.grams ) : 0,
      }
    });

    const next = { carb:null, protein:null, fat:null, custom:null };
    saved.items.forEach(it => {
      const key = (it.macro || "CUSTOM").toLowerCase();
      if (key === "carb" || key === "protein" || key === "fat") {
        next[key] = toSlot(it);
      } else {
        next.custom = toSlot(it);
      }
    });
    setSlots(next);
  }

  // 저장 버튼: 현재 우측 슬롯 스냅샷을 “나의 식단”으로 저장
  async function handleSaveMyFoods() {
    const items = ["carb","protein","fat","custom"].map(k => summarizeSlot(slots[k])).filter(Boolean);
    if (items.length === 0) { alert("저장할 항목이 없습니다."); return; }

    const snapshot = {
      id: crypto.randomUUID?.() ?? String(Date.now()),
      createdAt: new Date().toISOString(),
      items: items.map(it => ({
        id: it.id, macro: it.macro, name: it.name, iconUrl: it.iconUrl,
        grams: it.grams, carb: it.carb, protein: it.protein, fat: it.fat, kcal: it.kcal
      }))
    };
    const next = [snapshot, ...savedCompositions].slice(0, 10);
    setSavedCompositions(next);
    localStorage.setItem("savedMeals", JSON.stringify(next));
    alert("현재 구성이 ‘나의 식단’으로 저장되었습니다.");
  }

  // Metrics
  useEffect(() => {
    if (!me?.userId) return;
    (async () => {
      const m = await getMetrics(me.userId);
      setMetrics(m || {});
    })();
  }, [me?.userId]);

  // Summary
  useEffect(() => {
    if (!goalId) return;
    (async () => {
      const s = await getSummary(goalId, { mealsPerDay: meals });
      setSummary(s || {});
      if (s?.mealsPerDay && s.mealsPerDay !== meals) setMeals(s.mealsPerDay);
    })();
  }, [goalId, meals]);

  const ratio = useMemo(() => summary?.macroRatio || DEFAULT_RATIO, [summary]);
  const perMealKcal = useMemo(() => {
    if (summary?.perMealKcal) return summary.perMealKcal;
    const tdee = metrics?.dailyCalories || 0;
    return tdee && meals ? Math.round(tdee / meals) : 0;
  }, [summary?.perMealKcal, metrics?.dailyCalories, meals]);

  const dailyKcalResolved = useMemo(
    () => summary?.targetDailyCalories ?? summary?.target_daily_kcal ?? summary?.dailyKcal ?? null,
    [summary]
  );

  const goalLabel = useMemo(() => {
    const t = (summary?.goalType || "").toUpperCase();
    if (t === "LEAN") return "Lean";
    if (t === "HEALTH") return "Health";
    return "Health";
  }, [summary?.goalType]);

  // 그래프용 실제 kcal (custom 포함)
  const actualByMacro = useMemo(() => {
    const kcalOf = (slot, macroKey) => {
      if (!slot) return 0;
      const grams = (slot.per100?.[macroKey] || 0) * (slot.grams / 100);
      const kcalPerG = macroKey === "fat" ? 9 : 4;
      return Math.max(0, Math.round(grams * kcalPerG));
    };
    const allSlots = [slots.carb, slots.protein, slots.fat, slots.custom];
    const sumFor = (macro) => allSlots.reduce((acc, s) => acc + kcalOf(s, macro), 0);
    return { carb: sumFor("carb"), protein: sumFor("protein"), fat: sumFor("fat") };
  }, [slots.carb, slots.protein, slots.fat, slots.custom]);

  if (!goalId) {
    return (
      <div style={{ padding: 24 }}>
        <h2 style={{ marginTop: 0 }}>goalId 가 없습니다.</h2>
        <div>목표 생성 후 이 페이지로 이동해 주세요.</div>
      </div>
    );
  }

  return (
    <div style={{
      display:"grid", gridTemplateColumns:"1.2fr 0.8fr", gap:24, padding:24, alignItems:"start", background:"#fafafa"
    }}>
      {/* ===== 왼쪽 영역 ===== */}
      <div style={{ display:"grid", gap:UI.blockGap }}>
        {/* 상단 카드 */}
        <div style={{
          background:"#fff", color:"#111827", borderRadius:16, padding:20,
          border:"1px solid #e5e7eb", boxShadow:"0 1px 2px rgba(0,0,0,0.04)"
        }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:UI.innerGap, alignItems:"start" }}>
            <div>
              <h2 style={{ margin: 0 }}>1회 식사 권장량 : {perMealKcal ? `${perMealKcal} kcal` : "-"}</h2>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginTop:8, marginBottom:6 }}>
                <Pill label="BMI" value={metrics?.bmi?.toFixed?.(1) ?? "-"} />
                <Pill label="BMR" value={fmt(metrics?.bmr)} sub="kcal" />
                <Pill label="TDEE" value={fmt(metrics?.dailyCalories)} sub="kcal/일" />
                <Pill label="권장 섭취" value={fmt(dailyKcalResolved)} sub="kcal/일" tone="blue" />
              </div>
              <div style={{ marginTop:4, fontSize:13 }}>
                목표 - <b>{goalLabel}</b> [ 탄수화물 - <b>{ratio?.carb ?? "-"}</b>% :
                단백질 - <b>{ratio?.protein ?? "-"}</b>% : 지방 - <b>{ratio?.fat ?? "-"}</b>% ] 비율로 추천합니다.
              </div>
              <div style={{ marginTop:8, display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                <span style={{ opacity:.9, fontSize:13 }}>식사 횟수</span>
                {[2,3,4].map(n=>(
                  <button key={n} onClick={()=>setMeals(n)}
                    style={{
                      padding:"6px 10px", borderRadius:8, border:"1px solid #e5e7eb",
                      background: meals===n ? "#111827" : "#f9fafb",
                      color: meals===n ? "#fff" : "#111827", cursor:"pointer"
                    }}>
                    {n}끼
                  </button>
                ))}
              </div>
            </div>

            {/* 그래프 (실제 섭취량 반영) */}
            <FoodGraph perMealKcal={perMealKcal} ratio={ratio} actualByMacro={actualByMacro} />
          </div>
        </div>

        {/* 프리셋(좌) + 슬롯(우) + 나의 식단 */}
        <div style={{ display:"grid", gridTemplateColumns:`1fr ${UI.slotsColWidth}px`, gap:UI.innerGap, alignItems:"start" }}>
          {/* 좌 프리셋 */}
          <div style={{ display:"grid", gap:UI.innerGap }}>
            <PresetBlock title="Carb 탄수화물" items={PRESETS.carb} macro="carb" onAdd={handleAddFromPreset}/>
            <PresetBlock title="Protein 단백질" items={PRESETS.protein} macro="protein" onAdd={handleAddFromPreset}/>
            <PresetBlock title="지방" items={PRESETS.fat} macro="fat" onAdd={handleAddFromPreset}/>

            {/* ✅ 나의 식단(최근 저장) — 제목은 SavedMealsStrip 내부에서만 렌더 */}
            <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:14, color:"#111827", boxShadow:"0 1px 2px rgba(0,0,0,0.03)" }}>
              <SavedMealsStrip
                saved={savedCompositions[0] || null}
                onApply={handleApplySavedToSlots}
              />
            </div>
          </div>

          {/* 우 슬롯 */}
          <SlotsColumn slots={slots} setSlot={setSlot} onSave={handleSaveMyFoods}/>
        </div>
      </div>

      {/* ===== 오른쪽 영역 ===== */}
      <div style={{ display:"grid", gap:UI.innerGap }}>
        <FoodSearchPanel />
      </div>
    </div>
  );
}
