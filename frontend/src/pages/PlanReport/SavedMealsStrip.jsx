// src/pages/PlanReport/SavedMealsStrip.jsx
import React from "react";

function MacroBadge({ macro }) {
  const map = {
    CARB: { bg: "#eff6ff", fg: "#1e40af", label: "CARB" },
    PROTEIN: { bg: "#ecfdf5", fg: "#065f46", label: "PROTEIN" },
    FAT: { bg: "#fff7ed", fg: "#92400e", label: "FAT" },
    CUSTOM: { bg: "#f5f3ff", fg: "#5b21b6", label: "CUSTOM" },
  };
  const m = map[macro] || map.CUSTOM;
  return (
    <span style={{
      display: "inline-block", padding: "3px 8px", borderRadius: 999,
      background: m.bg, color: m.fg, fontSize: 10, fontWeight: 800, letterSpacing: .4
    }}>{m.label}</span>
  );
}

/**
 * saved: { id, createdAt, items:[{ id, macro, name, iconUrl, grams, carb, protein, fat, kcal }] }
 * onApply: (saved) => void  // "그래프 계산" 클릭 시 호출
 */
export default function SavedMealsStrip({ saved, onApply }) {
  return (
    <div>
      {/* 헤더 (제목/시간/버튼) */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>나의 식단 (최근 저장)</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {saved?.createdAt && (
            <div style={{ fontSize: 12, opacity: .7 }}>
              {new Date(saved.createdAt).toLocaleString()}
            </div>
          )}
          <button
            onClick={() => saved && onApply?.(saved)}
            disabled={!saved}
            style={{
              padding: "6px 10px", borderRadius: 8, border: "1px solid #e5e7eb",
              background: saved ? "#111827" : "#e5e7eb",
              color: saved ? "#fff" : "#6b7280", cursor: saved ? "pointer" : "not-allowed",
              fontWeight: 700
            }}
          >
            그래프 계산
          </button>
        </div>
      </div>

      {/* 목록 */}
      {!saved?.items?.length ? (
        <div style={{ fontSize: 12, opacity: .7 }}>아직 저장된 식단이 없습니다.</div>
      ) : (
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
          {saved.items.map(it => (
            <div key={it.id}
              style={{
                minWidth: 200, background: "#fff", border: "1px solid #e5e7eb",
                borderRadius: 10, padding: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img src={it.iconUrl} alt={it.name} style={{ width: 32, height: 32, objectFit: "contain" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                  <MacroBadge macro={(it.macro || "CUSTOM").toUpperCase()} />
                  <div style={{ fontWeight: 700, maxWidth: 160, whiteSpace: "normal", wordBreak: "keep-all", lineHeight: 1.2 }}>
                    {it.name}
                  </div>
                </div>
              </div>

              {/* ✅ 한 줄 → 여러 줄(탄/단/지/총량/칼로리) */}
              <div style={{
                marginTop: 8, fontSize: 12, opacity: .9,
                display: "grid", gridTemplateColumns: "56px 1fr", rowGap: 2, columnGap: 6
              }}>
                <div style={{ opacity: .7 }}>탄수화물</div><div>{it.carb} g</div>
                <div style={{ opacity: .7 }}>단백질</div><div>{it.protein} g</div>
                <div style={{ opacity: .7 }}>지방</div><div>{it.fat} g</div>
                {/* 원하면 아래 두 줄은 주석 해제/삭제해서 조절 */}
                <div style={{ opacity: .7 }}>총량</div><div>{it.grams} g</div>
                <div style={{ opacity: .7 }}>칼로리</div><div>{it.kcal} kcal</div>
              </div>
            </div>
            
      ))}
    </div>
  )
}
    </div >
  );
}
