import { useEffect, useMemo, useRef, useState } from 'react'
import { storage } from '../utils/storage.js'

const KEY = 'ws:foodPlanV2'
const DAYS = ['월','화','수','목','금','토','일']
const MEALS = ['아침','점심','저녁']

const PRESETS = [
  { name: '닭가슴살 150g', kcal: 165, protein: 31, carb: 0, fat: 3.6 },
  { name: '현미밥 200g', kcal: 246, protein: 5, carb: 52, fat: 2 },
  { name: '샐러드(무드레싱)', kcal: 60, protein: 2, carb: 10, fat: 1 },
  { name: '삶은 계란 2개', kcal: 156, protein: 13, carb: 1, fat: 11 },
]

function emptyPlan() {
  const p = {}
  for (const d of DAYS) {
    p[d] = {}
    for (const m of MEALS) p[d][m] = []
  }
  return p
}

export default function FoodPlan() {
  const [plan, setPlan] = useState(() => storage.get(KEY, emptyPlan()))
  const [editing, setEditing] = useState(null) // { day, meal }
  const [copyFrom, setCopyFrom] = useState('월')
  const [copyTo, setCopyTo] = useState('화')

  useEffect(() => storage.set(KEY, plan), [plan])

  // Derived totals
  const totalsByDay = useMemo(() => {
    const res = {}
    for (const d of DAYS) {
      res[d] = { kcal: 0, protein: 0, carb: 0, fat: 0 }
      for (const m of MEALS) {
        const t = sumItems(plan[d][m])
        res[d].kcal += t.kcal; res[d].protein += t.protein; res[d].carb += t.carb; res[d].fat += t.fat
      }
    }
    return res
  }, [plan])

  const weeklyTotals = useMemo(() => {
    return DAYS.reduce((acc, d) => ({
      kcal: acc.kcal + totalsByDay[d].kcal,
      protein: acc.protein + totalsByDay[d].protein,
      carb: acc.carb + totalsByDay[d].carb,
      fat: acc.fat + totalsByDay[d].fat,
    }), {kcal:0, protein:0, carb:0, fat:0})
  }, [totalsByDay])

  function openEditor(day, meal) { setEditing({ day, meal }) }
  function closeEditor() { setEditing(null) }

  function addItem(day, meal, item) {
    setPlan(prev => ({ ...prev, [day]: { ...prev[day], [meal]: [...prev[day][meal], item] } }))
  }
  function updateItem(day, meal, idx, patch) {
    setPlan(prev => {
      const next = [...prev[day][meal]]
      next[idx] = { ...next[idx], ...patch }
      return { ...prev, [day]: { ...prev[day], [meal]: next } }
    })
  }
  function removeItem(day, meal, idx) {
    setPlan(prev => {
      const next = prev[day][meal].filter((_,i)=>i!==idx)
      return { ...prev, [day]: { ...prev[day], [meal]: next } }
    })
  }

  function resetAll() {
    if (confirm('모든 식단을 초기화할까요?')) setPlan(emptyPlan())
  }

  function copyDay(from, to) {
    if (from === to) return
    setPlan(prev => {
      const clone = {}
      for (const m of MEALS) clone[m] = prev[from][m].map(x=>({ ...x }))
      return { ...prev, [to]: clone }
    })
  }

  // Export/Import JSON
  const fileRef = useRef(null)
  function exportJson() {
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'food-plan.json'; a.click()
    URL.revokeObjectURL(url)
  }
  function importJson(file) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const obj = JSON.parse(String(reader.result || '{}'))
        if (!isValidPlan(obj)) throw new Error('형식이 올바르지 않습니다.')
        setPlan(obj)
      } catch (e) {
        alert('가져오기에 실패했습니다: ' + e.message)
      }
    }
    reader.readAsText(file, 'utf-8')
  }

  return (
    <section className="grid">
      <article className="card">
        <h2>식단짜기</h2>
        <p style={{color:'var(--muted)'}}>요일 × 끼니 별로 여러 음식을 추가하고, 칼로리와 탄/단/지를 자동 합산합니다.</p>
        <div className="card" style={{overflowX:'auto'}}>
          <table className="table" role="grid" aria-label="주간 식단 표">
            <thead>
              <tr>
                <th>요일 \ 끼니</th>
                {MEALS.map(m => <th key={m}>{m}</th>)}
                <th style={{width:180}}>일일 합계</th>
              </tr>
            </thead>
            <tbody>
              {DAYS.map(d => {
                const total = totalsByDay[d]
                return (
                  <tr key={d}>
                    <th style={{color:'var(--muted)'}}>{d}</th>
                    {MEALS.map(m => (
                      <td key={m}>
                        <CellList day={d} meal={m} items={plan[d][m]} onOpen={()=>openEditor(d,m)} />
                      </td>
                    ))}
                    <td>
                      <TotalsBadge t={total}/>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr>
                <th>주간 합계</th>
                <td colSpan={3}>
                  <TotalsBadge t={weeklyTotals}/>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div style={{marginTop:12, display:'flex', gap:8, flexWrap:'wrap'}}>
          <button className="btn" onClick={()=>fileRef.current?.click()}>가져오기(JSON)</button>
          <input ref={fileRef} type="file" accept="application/json,.json" style={{display:'none'}} onChange={e=> e.target.files?.[0] && importJson(e.target.files[0])} />
          <button className="btn" onClick={exportJson}>내보내기(JSON)</button>
          <button className="btn" onClick={resetAll}>초기화</button>

          <div className="badge" style={{marginLeft:'auto'}}>자동 저장됨</div>
        </div>

        <div className="card" style={{marginTop:12, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
          <strong>요일 복사</strong>
          <select className="select" value={copyFrom} onChange={e=>setCopyFrom(e.target.value)}>
            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <span>→</span>
          <select className="select" value={copyTo} onChange={e=>setCopyTo(e.target.value)}>
            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <button className="btn" onClick={()=>copyDay(copyFrom, copyTo)}>복사</button>
        </div>
      </article>

      {editing && (
        <MealEditor
          day={editing.day}
          meal={editing.meal}
          items={plan[editing.day][editing.meal]}
          onAdd={(item)=>addItem(editing.day, editing.meal, item)}
          onUpdate={(idx, patch)=>updateItem(editing.day, editing.meal, idx, patch)}
          onRemove={(idx)=>removeItem(editing.day, editing.meal, idx)}
          onClose={closeEditor}
        />
      )}
    </section>
  )
}

function CellList({ day, meal, items, onOpen }) {
  const total = sumItems(items)
  return (
    <div>
      <button className="btn" style={{width:'100%', justifyContent:'flex-start'}} onClick={onOpen} aria-label={`${day} ${meal} 편집`}>
        {items.length === 0 ? (
          <span style={{color:'var(--muted)'}}>클릭해서 추가</span>
        ) : (
          <div>
            <div style={{fontWeight:600, marginBottom:4}}>{items.length}개 항목</div>
            <small style={{color:'var(--muted)'}}>합계: {fmtTotal(total)}</small>
          </div>
        )}
      </button>
    </div>
  )
}

function MealEditor({ day, meal, items, onAdd, onUpdate, onRemove, onClose }) {
  const [draft, setDraft] = useState({ name:'', kcal:'', carb:'', protein:'', fat:'' })
  const totals = sumItems(items)

  function addFromDraft(e) {
    e.preventDefault()
    if (!draft.name.trim()) return
    const item = {
      name: draft.name.trim(),
      kcal: numOrZero(draft.kcal),
      carb: numOrZero(draft.carb),
      protein: numOrZero(draft.protein),
      fat: numOrZero(draft.fat),
    }
    onAdd(item)
    setDraft({ name:'', kcal:'', carb:'', protein:'', fat:'' })
  }

  return (
    <article className="card">
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, flexWrap:'wrap'}}>
        <h3 style={{margin:0}}>{day}요일 · {meal}</h3>
        <button className="btn" onClick={onClose} aria-label="편집 닫기">닫기</button>
      </div>

      <div className="grid" style={{marginTop:8}}>
        <form onSubmit={addFromDraft} className="grid" aria-label="음식 추가 폼">
          <div style={{display:'grid', gridTemplateColumns:'1fr repeat(4, 120px) 120px', gap:8, alignItems:'center'}}>
            <input className="input" placeholder="음식명" value={draft.name} onChange={e=>setDraft(d=>({...d, name: e.target.value}))} />
            <input className="input" type="number" step="1" placeholder="kcal" value={draft.kcal} onChange={e=>setDraft(d=>({...d, kcal: e.target.value}))} />
            <input className="input" type="number" step="0.1" placeholder="탄" value={draft.carb} onChange={e=>setDraft(d=>({...d, carb: e.target.value}))} />
            <input className="input" type="number" step="0.1" placeholder="단" value={draft.protein} onChange={e=>setDraft(d=>({...d, protein: e.target.value}))} />
            <input className="input" type="number" step="0.1" placeholder="지" value={draft.fat} onChange={e=>setDraft(d=>({...d, fat: e.target.value}))} />
            <button className="btn primary" type="submit">추가</button>
          </div>
        </form>

        <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
          {PRESETS.map(p => (
            <button key={p.name} className="btn" onClick={()=>onAdd(p)}>{p.name}</button>
          ))}
        </div>

        <div className="card" style={{overflowX:'auto'}}>
          <table className="table">
            <thead>
              <tr>
                <th style={{minWidth:160}}>음식명</th>
                <th>kcal</th>
                <th>탄</th>
                <th>단</th>
                <th>지</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  <td><input className="input" value={it.name} onChange={e=>onUpdate(i, { name: e.target.value })} /></td>
                  <td><input className="input" type="number" step="1" value={it.kcal} onChange={e=>onUpdate(i, { kcal: numOrZero(e.target.value) })} /></td>
                  <td><input className="input" type="number" step="0.1" value={it.carb} onChange={e=>onUpdate(i, { carb: numOrZero(e.target.value) })} /></td>
                  <td><input className="input" type="number" step="0.1" value={it.protein} onChange={e=>onUpdate(i, { protein: numOrZero(e.target.value) })} /></td>
                  <td><input className="input" type="number" step="0.1" value={it.fat} onChange={e=>onUpdate(i, { fat: numOrZero(e.target.value) })} /></td>
                  <td><button className="btn" onClick={()=>onRemove(i)}>삭제</button></td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan="6" style={{color:'var(--muted)'}}>아직 항목이 없어요. 위에서 추가해보세요.</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <th>합계</th>
                <th>{totals.kcal}</th>
                <th>{fmt(totals.carb)}</th>
                <th>{fmt(totals.protein)}</th>
                <th>{fmt(totals.fat)}</th>
                <th></th>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </article>
  )
}

function TotalsBadge({ t }) {
  return (
    <div className="badge">
      {fmtTotal(t)}
    </div>
  )
}

function fmt(n) {
  return (Math.round(n*10)/10).toFixed(1)
}
function fmtTotal(t) {
  return `${t.kcal} kcal • 탄 ${fmt(t.carb)} • 단 ${fmt(t.protein)} • 지 ${fmt(t.fat)}`
}
function sumItems(items) {
  return items.reduce((acc, it) => ({
    kcal: acc.kcal + (Number(it.kcal)||0),
    carb: acc.carb + (Number(it.carb)||0),
    protein: acc.protein + (Number(it.protein)||0),
    fat: acc.fat + (Number(it.fat)||0),
  }), {kcal:0, carb:0, protein:0, fat:0})
}
function numOrZero(v){ const n = Number(v); return Number.isFinite(n) ? n : 0 }
function isValidPlan(obj) {
  if (typeof obj !== 'object' || obj === null) return false
  for (const d of DAYS) {
    if (!obj[d]) return false
    for (const m of MEALS) {
      if (!Array.isArray(obj[d][m])) return false
    }
  }
  return true
}
