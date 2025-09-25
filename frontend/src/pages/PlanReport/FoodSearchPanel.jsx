// src/pages/PlanReport/FoodSearchPanel.jsx
import { useState } from "react";
import { searchNutri } from "../../api/nutri";

const fmt = (n, d = 0) =>
  (n ?? n === 0) && Number.isFinite(Number(n))
    ? Number(n).toLocaleString(undefined, { maximumFractionDigits: d })
    : "-";

// API 응답 정규화 (camel/snake/한글키 혼재 대비)
function normalize(item) {
  const name = item?.foodNm ?? item?.name ?? item?.desc_kor ?? "이름 없음";
  // kcal (보통 enerc, ENERC_KCAL 등)
  const kcal100 = Number(item?.enerc ?? item?.enercKcal ?? item?.ENERC_KCAL ?? item?.kcal ?? 0);
  // g(100g당) – 공공데이터: chocdf(탄수화물), prot(단백질), fatce(지방)
  const carb = Number(item?.chocdf ?? item?.carb ?? item?.CHOAVL ?? 0);
  const prot = Number(item?.prot ?? item?.protein ?? item?.PROCNP ?? 0);
  const fat  = Number(item?.fatce ?? item?.fat ?? item?.FAT ?? 0);

  return {
    id: item?.foodCd ?? item?.id ?? name,
    name,
    kcal100: Number.isFinite(kcal100) ? Math.round(kcal100) : null,
    carb: Number.isFinite(carb) ? +carb : null,
    prot: Number.isFinite(prot) ? +prot : null,
    fat:  Number.isFinite(fat) ? +fat : null,
  };
}

export default function FoodSearchPanel() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [results, setResults] = useState([]);

  const doSearch = async () => {
    setErr(""); setResults([]);
    if (!q.trim()) return;
    setLoading(true);
    try {
      const arr = await searchNutri(q.trim());
      const list = (Array.isArray(arr) ? arr : []).map(normalize);
      setResults(list.slice(0, 20));
    } catch (e) {
      console.error(e);
      setErr("검색 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "#ffffff",
        color: "#111827",
        borderRadius: 16,
        padding: 16,
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
      }}
    >
      <h3 style={{ marginTop: 6, marginBottom: 12 }}>검색</h3>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doSearch()}
          placeholder="식품명 입력 (예: 현미밥)"
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            color: "#111827",
            outline: "none",
            boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
          }}
        />
        <button
          onClick={doSearch}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            background: "#f9fafb",
            color: "#111827",
            cursor: "pointer",
          }}
        >
          검색
        </button>
      </div>

      <div style={{ marginTop: 14 }}>
        {loading && <div style={{ opacity: 0.8 }}>검색 중…</div>}
        {err && <div style={{ color: "#ef4444" }}>{err}</div>}
        {!loading && !err && results.length === 0 && (
          <div style={{ opacity: 0.6, fontSize: 13 }}>검색 결과가 없습니다.</div>
        )}

        <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
          {results.map((r) => {
            const sumG = (r.carb ?? 0) + (r.prot ?? 0) + (r.fat ?? 0);
            return (
              <div
                key={r.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                <div style={{ fontSize: 14, marginBottom: 6, fontWeight: 600 }}>{r.name}</div>
                <div style={{ fontSize: 12, color: "#111827", opacity: 0.9, lineHeight: 1.35 }}>
                  <div>100 g 당</div>
                  <div>· 탄수화물: <b>{fmt(r.carb, 1)}</b> g</div>
                  <div>· 단백질: <b>{fmt(r.prot, 1)}</b> g</div>
                  <div>· 지방: <b>{fmt(r.fat, 1)}</b> g</div>
                  <div style={{ marginTop: 4 }}>
                    [ 총 <b>{fmt(sumG, 1)}</b> g · <b>{fmt(r.kcal100)}</b> kcal ]
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
