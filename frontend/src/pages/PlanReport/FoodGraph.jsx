// src/pages/PlanReport/FoodGraph.jsx
// 애니메이션: 처음 0%에서 초록/빨강으로 부드럽게 채워짐
import { useEffect, useMemo, useState } from "react";

export default function FoodGraph({ perMealKcal, ratio, actualByMacro }) {
  const clampPct = (v) => Math.max(0, Math.min(100, Number(v ?? 0)));

  const c = clampPct(ratio?.carb);
  const p = clampPct(ratio?.protein);
  const f = clampPct(ratio?.fat);

  const target = useMemo(() => ({
    carb:    perMealKcal ? Math.round(perMealKcal * c / 100) : 0,
    protein: perMealKcal ? Math.round(perMealKcal * p / 100) : 0,
    fat:     perMealKcal ? Math.round(perMealKcal * f / 100) : 0,
  }), [perMealKcal, c, p, f]);

  const actual = {
    carb:    Math.max(0, Math.round(actualByMacro?.carb ?? 0)),
    protein: Math.max(0, Math.round(actualByMacro?.protein ?? 0)),
    fat:     Math.max(0, Math.round(actualByMacro?.fat ?? 0)),
  };

  const baseRows = [
    { key: "carb",    label: "탄수화물" },
    { key: "protein", label: "단백질"   },
    { key: "fat",     label: "지방"     },
  ].map(r => {
    const tgt = target[r.key] || 0;
    const act = actual[r.key] || 0;
    const pctOfTarget = tgt > 0 ? Math.min(100, Math.round((act / tgt) * 100)) : 0;
    const over = act > tgt && tgt > 0;
    return { ...r, tgt, act, pctOfTarget, over };
  });

  // 애니메이션 폭 상태(초기 0 → 실제 퍼센트로 전환)
  const [widths, setWidths] = useState({ carb:0, protein:0, fat:0 });

  useEffect(() => {
    // 한 틱 뒤에 적용해서 0% → N% 트랜지션 유도
    const id = requestAnimationFrame(() => {
      setWidths({
        carb: baseRows.find(r=>r.key==="carb")?.pctOfTarget ?? 0,
        protein: baseRows.find(r=>r.key==="protein")?.pctOfTarget ?? 0,
        fat: baseRows.find(r=>r.key==="fat")?.pctOfTarget ?? 0,
      });
    });
    return () => cancelAnimationFrame(id);
  }, [baseRows[0].pctOfTarget, baseRows[1].pctOfTarget, baseRows[2].pctOfTarget]);

  const anyOver = baseRows.some(r => r.over);

  const barWrap = {
    width: "100%",
    height: 12,
    background: "#ffffff",       // 요청: 처음 흰색 바 느낌
    border: "1px solid #e5e7eb",
    borderRadius: 999,
    overflow: "hidden",
  };

  const barFill = (over) => ({
    position:"absolute", left:0, top:0, height:"100%",
    background: over ? "#ef4444" : "#10b981",
    transition: "width 420ms ease, background-color 180ms ease"
  });

  return (
    <div
      style={{
        position: "relative",
        background: "#ffffff",
        borderRadius: 12,
        padding: 14,
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
        color: "#111827",
      }}
    >
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>탄·단·지 분배 그래프</div>
        {anyOver && (
          <div style={{ fontSize: 12, color: "#b91c1c", fontWeight: 700 }}>
            *추천칼로리를 초과하였습니다.
          </div>
        )}
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {baseRows.map((r) => (
          <div
            key={r.key}
            style={{
              display: "grid",
              gridTemplateColumns: "84px 1fr auto",
              gap: 10,
              alignItems: "center",
            }}
          >
            <div style={{ opacity: 0.9, fontSize: 13 }}>{r.label}</div>

            {/* 비어있는 바(흰색) + 채워지는 바(초록/빨강) */}
            <div style={{ ...barWrap, position: "relative" }}>
              <div
                style={{
                  ...barFill(r.over),
                  width: `${widths[r.key]}%`,
                }}
              />
            </div>

            <div style={{ fontSize: 12, opacity: 0.85, minWidth: 160, textAlign: "right" }}>
              {r.pctOfTarget}% · {r.act} / {r.tgt} kcal
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
