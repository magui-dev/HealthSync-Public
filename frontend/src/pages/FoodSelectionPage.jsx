import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listGoals } from '../api/plan';
import MacroBoard from '../components/MacroBoard';

export default function FoodSelectionPage() {
  const [sp] = useSearchParams();
  const goalIdFromUrl = useMemo(() => {
    const v = Number(sp.get('goalId'));
    return Number.isFinite(v) ? v : null;
  }, [sp]);

  const [goals, setGoals] = useState([]);
  const [goalId, setGoalId] = useState(goalIdFromUrl);
  const [error, setError] = useState('');

  useEffect(() => {
    listGoals()
      .then(arr => {
        const list = Array.isArray(arr) ? arr : [];
        setGoals(list);
        if (!goalIdFromUrl && list.length) setGoalId(list[0].id);
        else if (goalIdFromUrl && !list.some(g => g.id === goalIdFromUrl) && list.length) setGoalId(list[0].id);
      })
      .catch(e => setError(e.message || String(e)));
  }, [goalIdFromUrl]);

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 12 }}>한 끼 구성</h2>

      <div style={{ marginBottom: 12 }}>
        <select
          value={goalId ?? ''}
          onChange={(e)=>setGoalId(e.target.value ? parseInt(e.target.value, 10) : null)}
          style={{ padding: 6, minWidth: 260 }}
        >
          {goals.map(g => (
            <option key={g.id} value={g.id}>
              {g.type} · {g.weeks}주 · {g.startDate}
            </option>
          ))}
        </select>
      </div>

      {error && <div style={{ color:'crimson', marginBottom: 12 }}>오류: {error}</div>}

      {goalId ? (
        <div style={{ border:'1px solid #eee', borderRadius: 12, padding: 16 }}>
          {/* 검색 → 탄/단/지 선택/저장 */}
          <MacroBoard goalId={goalId} />
        </div>
      ) : (
        <div style={{ color:'#777' }}>목표를 먼저 생성해 주세요.</div>
      )}
    </div>
  );
}
