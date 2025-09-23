// src/userinfoui/components/ReportPicker.jsx
import React, { useEffect, useState } from "react";

export default function ReportPicker({ onSelect }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selId, setSelId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        // 인증 방식에 맞게 수정 (쿠키면 credentials: "include")
        const token = localStorage.getItem("accessToken");
        const res = await fetch("/api/reports", {
          headers: {
            "Accept": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          credentials: "include", // 쿠키 기반이면 유지, Bearer만 쓴다면 제거 가능
        });
        if (!res.ok) throw new Error(`리포트 목록 조회 실패 (${res.status})`);
        const data = await res.json();
        if (!ignore) {
          setReports(data); // [{id, title, savedAt}, ...]
          setLoading(false);
        }
      } catch (e) {
        if (!ignore) {
          setError(e.message ?? "리포트 조회 중 오류");
          setLoading(false);
        }
      }
    }

    load();
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    const found = reports.find(r => r.id === selId) || null;
    onSelect?.(found);
  }, [selId, reports, onSelect]);

  if (loading) return <div style={{ padding: 16 }}>리포트 불러오는 중…</div>;
  if (error) return <div style={{ padding: 16, color: "crimson" }}>오류: {error}</div>;
  if (reports.length === 0) return <div style={{ padding: 16 }}>저장된 리포트가 없습니다.</div>;

  return (
    <div style={{ padding: 12 }}>
      <h3 style={{ margin: "4px 0 12px" }}>나의 리포트</h3>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <select
          value={selId ?? ""}
          onChange={(e) => setSelId(e.target.value || null)}
          style={{ flex: 1, padding: 8 }}
        >
          <option value="">리포트를 선택하세요</option>
          {reports.map(r => (
            <option key={r.id} value={r.id}>
              {r.title ?? formatDate(r.savedAt)}
            </option>
          ))}
        </select>
        {selId && (
          <button onClick={() => setSelId(null)} style={{ padding: "8px 12px" }}>
            해제
          </button>
        )}
      </div>

      {/* 선택한 리포트의 간단 미리보기 */}
      {selId && (
        <ReportPreview reportId={selId} />
      )}
    </div>
  );
}

function ReportPreview({ reportId }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setErr("");
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch(`/api/reports/${reportId}`, {
          headers: {
            "Accept": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          credentials: "include",
        });
        if (!res.ok) throw new Error(`리포트 상세 조회 실패 (${res.status})`);
        const data = await res.json(); // { id, title, savedAt, summary, ... }
        if (!ignore) {
          setPreview(data);
          setLoading(false);
        }
      } catch (e) {
        if (!ignore) {
          setErr(e.message ?? "상세 조회 중 오류");
          setLoading(false);
        }
      }
    }
    load();
    return () => { ignore = true; };
  }, [reportId]);

  if (loading) return <div style={{ padding: 8 }}>미리보기 불러오는 중…</div>;
  if (err) return <div style={{ padding: 8, color: "crimson" }}>오류: {err}</div>;
  if (!preview) return null;

  return (
    <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>
        {preview.title ?? formatDate(preview.savedAt)}
      </div>
      <div style={{ fontSize: 13, color: "#666", whiteSpace: "pre-wrap" }}>
        {preview.summary ?? "요약 없음"}
      </div>
    </div>
  );
}

function formatDate(d) {
  try {
    const date = new Date(d);
    return date.toLocaleString();
  } catch {
    return d;
  }
}
