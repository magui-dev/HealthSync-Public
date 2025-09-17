import React, { useEffect, useState } from 'react';
import { searchNutri, saveFoodSelection, listFoodSelections } from '../api/plan';

// 카테고리 & 라벨
const CATS = ['CARB', 'PROTEIN', 'FAT'];
const CAT_LABEL = { CARB: '탄수화물', PROTEIN: '단백질', FAT: '지방' };

export default function MacroBoard({ goalId }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [picks, setPicks] = useState({ CARB: null, PROTEIN: null, FAT: null });
  const [error, setError] = useState('');

  // 현재 goal에 저장된 내 픽 불러오기
  useEffect(() => {
    if (!goalId) return;
    listFoodSelections(goalId)
      .then((arr) => {
        const next = { CARB: null, PROTEIN: null, FAT: null };
        (arr || []).forEach((s) => { next[s.category] = s; });
        setPicks(next);
      })
      .catch((e) => setError(e.message || String(e)));
  }, [goalId]);

  async function onSearch() {
    try {
      setResults(await searchNutri(q));
      setError('');
    } catch (e) {
      setError(e.message || String(e));
    }
  }

  async function choose(cat, it) {
    try {
      const payload = {
        goalId,
        category: cat,                         // 'CARB' | 'PROTEIN' | 'FAT'
        label: `${it.name}${it.serving_g ? ` ${it.serving_g}g` : ''}`,
        servingG: it.serving_g ?? null,
        kcal: Math.round(it.kcal ?? 0),
        carbsG: it.carbs_g ?? 0,
        proteinG: it.protein_g ?? 0,
        fatG: it.fat_g ?? 0,
        source: 'NUTRI_API',
        externalId: it.id,
      };
      const saved = await saveFoodSelection(payload);
      setPicks((prev) => ({ ...prev, [cat]: saved }));
      setError('');
    } catch (e) {
      setError(e.message || String(e));
    }
  }

  // 슬롯(카테고리 한 칸) 컴포넌트
  const Slot = ({ cat, icon }) => {
    const s = picks[cat];
    return (
      <div className="slot" style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 12 }}>
        <div className="title" style={{ fontWeight: 600, marginBottom: 8 }}>
          {icon} <span style={{ marginLeft: 8 }}>{CAT_LABEL[cat]}</span>
        </div>
        {s ? (
          <>
            <div className="name" style={{ marginBottom: 4 }}>{s.label}</div>
            <div className="meta" style={{ color: '#666' }}>
              kcal {s.kcal} · C {s.carbsG}g · P {s.proteinG}g · F {s.fatG}g
            </div>
          </>
        ) : (
          <div className="empty" style={{ color: '#999' }}>검색에서 선택해주세요</div>
        )}
      </div>
    );
  };

  return (
    <div className="macro-board" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }}>
      {/* 좌측: 세 칸 */}
      <div className="left-panel">
        <Slot cat="CARB"    icon={<img src="/icons/rice.png" width={28} alt="carb" />} />
        <Slot cat="PROTEIN" icon={<img src="/icons/chicken.png" width={28} alt="protein" />} />
        <Slot cat="FAT"     icon={<img src="/icons/olive-oil.png" width={28} alt="fat" />} />
      </div>

      {/* 우측: 검색영역 */}
      <div className="right-panel" style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
        <div className="search" style={{ display: 'flex', gap: 8 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="식품 검색"
            style={{ flex: 1, padding: 8 }}
          />
          <button onClick={onSearch} style={{ padding: '8px 12px' }}>검색</button>
        </div>

        {error && <div style={{ color: 'crimson', marginTop: 8 }}>오류: {error}</div>}

        <div className="list" style={{ marginTop: 12, maxHeight: 320, overflowY: 'auto' }}>
          {results.map((it) => (
            <div key={it.id} className="row" style={{ borderBottom: '1px solid #f1f1f1', padding: '8px 0' }}>
              <div className="name" style={{ fontWeight: 500 }}>
                {it.name} {it.serving_g ? `· ${it.serving_g}g` : ''}
              </div>
              <div className="sub" style={{ color: '#666', fontSize: 13, marginTop: 4 }}>
                kcal {it.kcal ?? '-'} · C {it.carbs_g ?? '-'} · P {it.protein_g ?? '-'} · F {it.fat_g ?? '-'}
              </div>
              <div className="actions" style={{ marginTop: 6, display: 'flex', gap: 8 }}>
                <button onClick={() => choose('CARB', it)}>탄</button>
                <button onClick={() => choose('PROTEIN', it)}>단</button>
                <button onClick={() => choose('FAT', it)}>지</button>
              </div>
            </div>
          ))}
          {results.length === 0 && <div style={{ color: '#999', marginTop: 8 }}>검색 결과가 없습니다.</div>}
        </div>
      </div>
    </div>
  );
}
