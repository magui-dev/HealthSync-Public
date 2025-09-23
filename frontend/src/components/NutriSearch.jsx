// src/components/NutriSearch.jsx
import { useState } from "react";
import { searchNutri } from "../api/nutri";            
import { normalizeNutri } from "../lib/nutri-normalize";

export default function NutriSearch() {
  const [q, setQ] = useState("아몬드");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // ← 네가 준 헬퍼를 컴포넌트 안으로 넣은 버전 (state에 직접 접근)
  const onSearch = async () => {
    setLoading(true); setErr(null);
    try {
      const data = await searchNutri(q);                           // /nutri/search?name=...
      const normalized = data.map(normalizeNutri).filter(r => r.name);
      setRows(normalized);
      console.log("raw:", data);
      console.log("normalized:", normalized);
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => { if (e.key === "Enter") onSearch(); };

  return (
    <div style={{maxWidth: 720, margin: "20px auto", fontFamily: "system-ui, sans-serif"}}>
      <div style={{display: "flex", gap: 8}}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKey}
          placeholder="식품명을 입력 (예: 아몬드, 귀리, 달걀)"
          style={{flex: 1, padding: 8}}
        />
        <button onClick={onSearch} disabled={loading} style={{padding: "8px 12px"}}>
          {loading ? "검색중..." : "검색"}
        </button>
      </div>

      {err && <div style={{color: "red", marginTop: 8}}>에러: {err}</div>}

      <ul style={{marginTop: 12, lineHeight: 1.6}}>
        {rows.map((r, i) => (
          <li key={i}>
            <b>{r.name}</b> — {r.kcal ?? "-"} kcal / P {r.protein ?? "-"} g / F {r.fat ?? "-"} g / C {r.carbs ?? "-"} g / Na {r.sodiumMg ?? "-"} mg
          </li>
        ))}
      </ul>

      {!loading && rows.length === 0 && !err && (
        <div style={{marginTop: 12}}>검색 결과가 없습니다.</div>
      )}
    </div>
  );
}
