// src/pages/PlanReport/FoodGraph.jsx
export default function FoodGraph({ perMealKcal, ratio }) {
  // 퍼센트(0~100) 안정화
  const c = Math.max(0, Math.min(100, Number(ratio?.carb ?? 0)));
  const p = Math.max(0, Math.min(100, Number(ratio?.protein ?? 0)));
  const f = Math.max(0, Math.min(100, Number(ratio?.fat ?? 0)));

  const rows = [
    { key: "carb",    label: "탄수화물", pct: c, kcal: perMealKcal ? Math.round(perMealKcal * c / 100) : 0 },
    { key: "protein", label: "단백질",   pct: p, kcal: perMealKcal ? Math.round(perMealKcal * p / 100) : 0 },
    { key: "fat",     label: "지방",     pct: f, kcal: perMealKcal ? Math.round(perMealKcal * f / 100) : 0 },
  ];

  const barWrap = {
    width: "100%",
    height: 12,
    background: "#f3f4f6",       // 라이트 배경
    border: "1px solid #e5e7eb", // 연한 테두리
    borderRadius: 999,
    overflow: "hidden",
  };

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 12,
        padding: 14,
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
        color: "#111827",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 8 }}>탄·단·지 분배 그래프</div>
      <div style={{ display: "grid", gap: 10 }}>
        {rows.map((r) => (
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
            <div style={barWrap}>
              {/* 막대 채움색: 중립 회색(추후 테마 컬러로 변경 가능) */}
              <div style={{ width: `${r.pct}%`, height: "100%", background: "#9ca3af" }} />
            </div>
            <div style={{ fontSize: 12, opacity: 0.85, minWidth: 90, textAlign: "right" }}>
              {r.pct}% · {r.kcal} kcal
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
