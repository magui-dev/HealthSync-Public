import { useEffect, useMemo, useRef, useState } from 'react'
import { storage } from '../utils/storage.js'

const KEY = 'ws:weights'
const KEY_SETTINGS = 'ws:weightSettings'

function toISO(d) {
  return new Date(d).toISOString().slice(0,10)
}
function daysAgo(n) {
  const d = new Date(); d.setDate(d.getDate()-n); return toISO(d)
}
function parseNum(v) {
  const n = Number(v); return Number.isFinite(n) ? n : null
}

export default function WeightTrack() {
  const [entries, setEntries] = useState(() => storage.get(KEY, []))
  const [settings, setSettings] = useState(() => storage.get(KEY_SETTINGS, { heightCm: '', targetKg: '' }))

  const [date, setDate] = useState(() => toISO(new Date()))
  const [weight, setWeight] = useState('')
  const [note, setNote] = useState('')

  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [range, setRange] = useState('all') // chart range

  useEffect(()=> storage.set(KEY, entries), [entries])
  useEffect(()=> storage.set(KEY_SETTINGS, settings), [settings])

  // Derived
  const sorted = useMemo(() =>
    [...entries].sort((a,b)=> a.date.localeCompare(b.date)), [entries])

  const filtered = useMemo(() => {
    return sorted.filter(e => {
      if (from && e.date < from) return false
      if (to && e.date > to) return false
      return true
    })
  }, [sorted, from, to])

  const latest = sorted.at(-1) ?? null
  const first = sorted[0] ?? null
  const change = (latest && first) ? latest.weight - first.weight : null

  const heightM = parseNum(settings.heightCm) ? (Number(settings.heightCm)/100) : null
  const bmi = (heightM && latest) ? latest.weight / (heightM*heightM) : null
  const targetGap = (parseNum(settings.targetKg) != null && latest) ? latest.weight - Number(settings.targetKg) : null

  // rolling averages
  const avg7 = useMemo(()=> avgForWindow(sorted, 7), [sorted])
  const avg30 = useMemo(()=> avgForWindow(sorted, 30), [sorted])

  function addEntry(e) {
    e.preventDefault()
    if (!date || !weight) return
    const w = Number(weight)
    if (!Number.isFinite(w)) return
    const n = note.trim()
    setEntries(prev => {
      const without = prev.filter(x => x.date !== date)
      return [...without, { date, weight: w, note: n }]
    })
    setWeight('')
    setNote('')
  }

  function remove(date) {
    setEntries(prev => prev.filter(x => x.date !== date))
  }

  function updateRow(date, patch) {
    setEntries(prev => prev.map(x => x.date === date ? { ...x, ...patch } : x))
  }

  function clearAll() {
    if (confirm('모든 체중 기록을 삭제할까요?')) setEntries([])
  }

  // CSV export/import
  function exportCsv() {
    const header = 'date,weight,note\n'
    const lines = sorted.map(e => [e.date, e.weight, (e.note||'').replaceAll('\n',' ')].join(','))
    const blob = new Blob([header + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'weights.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const fileRef = useRef(null)
  function importCsvFromFile(file) {
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result || '')
      const rows = text.split(/\r?\n/).filter(Boolean)
      const out = []
      for (let i=0;i<rows.length;i++) {
        if (i===0 && rows[i].toLowerCase().startsWith('date')) continue
        const [d, w, ...rest] = rows[i].split(',')
        const weight = Number(w)
        if (!d || !Number.isFinite(weight)) continue
        out.push({ date: d.trim(), weight, note: rest.join(',').trim() })
      }
      if (out.length) setEntries(prev => mergeByDate(prev, out))
    }
    reader.readAsText(file, 'utf-8')
  }

  // Chart data range
  const chartData = useMemo(() => {
    let list = sorted
    if (range === '30d') list = sorted.filter(e => e.date >= daysAgo(30))
    if (range === '90d') list = sorted.filter(e => e.date >= daysAgo(90))
    return list
  }, [sorted, range])

  const chart = useMemo(()=> makeChartPath(chartData), [chartData])

  return (
    <section className="grid">
      {/* Settings */}
      <article className="card">
        <h2>체중관리</h2>
        <div className="grid">
          <form onSubmit={addEntry} aria-label="체중 입력 폼">
            <div className="grid">
              <label>
                <div>날짜</div>
                <input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)} required />
              </label>
              <label>
                <div>체중(kg)</div>
                <input className="input" type="number" step="0.1" inputMode="decimal" value={weight} onChange={e=>setWeight(e.target.value)} placeholder="예: 70.3" required/>
              </label>
              <label>
                <div>메모(선택)</div>
                <input className="input" type="text" value={note} onChange={e=>setNote(e.target.value)} placeholder="예: 운동 후 측정"/>
              </label>
              <div>
                <button className="btn primary" type="submit">추가/업데이트</button>
              </div>
            </div>
          </form>

          <div className="card" role="group" aria-label="목표/신장 설정">
            <div className="grid">
              <label>
                <div>신장(cm)</div>
                <input className="input" type="number" inputMode="decimal" value={settings.heightCm} onChange={e=>setSettings(s=>({...s, heightCm: e.target.value}))} placeholder="예: 175" />
              </label>
              <label>
                <div>목표 체중(kg)</div>
                <input className="input" type="number" inputMode="decimal" value={settings.targetKg} onChange={e=>setSettings(s=>({...s, targetKg: e.target.value}))} placeholder="예: 68"/>
              </label>
            </div>
          </div>
        </div>
      </article>

      {/* Stats & Chart */}
      <article className="card">
        <h3>요약</h3>
        <div className="grid">
          <div className="badge">기록 수: {sorted.length}</div>
          <div className="badge">최근 체중: {latest ? `${latest.weight.toFixed(1)} kg` : '-'}</div>
          <div className="badge">변화(첫 기록→최근): {change==null ? '-' : ((change>0?'+':'') + change.toFixed(1) + ' kg')}</div>
          <div className="badge">7일 평균: {avg7==null ? '-' : `${avg7.toFixed(1)} kg`}</div>
          <div className="badge">30일 평균: {avg30==null ? '-' : `${avg30.toFixed(1)} kg`}</div>
          <div className="badge">BMI: {bmi==null ? '-' : bmi.toFixed(1)}</div>
          <div className="badge">목표 대비: {targetGap==null ? '-' : ((targetGap>0?'+':'') + targetGap.toFixed(1) + ' kg')}</div>
        </div>

        <div style={{marginTop:12, display:'grid', gap:8}}>
          <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            <button className={range==='all'?'btn primary':'btn'} onClick={()=>setRange('all')}>전체</button>
            <button className={range==='30d'?'btn primary':'btn'} onClick={()=>setRange('30d')}>최근 30일</button>
            <button className={range==='90d'?'btn primary':'btn'} onClick={()=>setRange('90d')}>최근 90일</button>
          </div>
          <ChartSVG data={chartData} path={chart.path} min={chart.min} max={chart.max}/>
        </div>
      </article>

      {/* Table & Filters */}
      <article className="card">
        <h3>기록 목록</h3>
        <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:8}}>
          <input className="input" type="date" value={from} onChange={e=>setFrom(e.target.value)} aria-label="시작 날짜"/>
          <input className="input" type="date" value={to} onChange={e=>setTo(e.target.value)} aria-label="종료 날짜"/>
          <button className="btn" onClick={()=>{ setFrom(''); setTo('') }}>필터 해제</button>
          <span className="badge" aria-live="polite">{filtered.length}개 표시</span>
          <div style={{marginLeft:'auto', display:'flex', gap:8}}>
            <button className="btn" onClick={exportCsv}>CSV 내보내기</button>
            <input ref={fileRef} type="file" accept=".csv,text/csv" style={{display:'none'}} onChange={e=> e.target.files?.[0] && importCsvFromFile(e.target.files[0])}/>
            <button className="btn" onClick={()=>fileRef.current?.click()}>CSV 가져오기</button>
            <button className="btn" onClick={clearAll}>전체 삭제</button>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr><th>날짜</th><th>체중(kg)</th><th>메모</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.map(row => (
              <Row key={row.date} row={row} onChange={updateRow} onRemove={remove} />
            ))}
            {filtered.length===0 && <tr><td colSpan="4" style={{color:'var(--muted)'}}>표시할 기록이 없어요.</td></tr>}
          </tbody>
        </table>
      </article>
    </section>
  )
}

function Row({ row, onChange, onRemove }) {
  const [w, setW] = useState(String(row.weight))
  const [n, setN] = useState(row.note || '')

  useEffect(()=> setW(String(row.weight)), [row.weight])
  useEffect(()=> setN(row.note || ''), [row.note])

  return (
    <tr>
      <td>{row.date}</td>
      <td>
        <input className="input" type="number" step="0.1" style={{maxWidth:120}} value={w} onChange={e=>setW(e.target.value)} onBlur={()=>{
          const num = Number(w); if (Number.isFinite(num)) onChange(row.date, { weight: num })
        }}/>
      </td>
      <td>
        <input className="input" value={n} onChange={e=>setN(e.target.value)} onBlur={()=> onChange(row.date, { note: n })} placeholder="메모"/>
      </td>
      <td>
        <button className="btn" onClick={()=>onRemove(row.date)}>삭제</button>
      </td>
    </tr>
  )
}

function avgForWindow(list, windowDays) {
  if (!list.length) return null
  const cutoff = toISO(new Date(new Date().setDate(new Date().getDate()-windowDays)))
  const recent = list.filter(e => e.date >= cutoff)
  if (!recent.length) return null
  const sum = recent.reduce((s,e)=>s+e.weight, 0)
  return sum / recent.length
}

function mergeByDate(prev, incoming) {
  const map = new Map(prev.map(e => [e.date, e]))
  for (const e of incoming) map.set(e.date, e)
  return Array.from(map.values())
}

function makeChartPath(list) {
  const w = 640, h = 200, pad = 24
  if (list.length < 2) return { path: '', min: null, max: null }
  const min = Math.min(...list.map(x=>x.weight))
  const max = Math.max(...list.map(x=>x.weight))
  const range = Math.max(1e-6, max - min)

  const path = list.map((pt, i) => {
    const x = pad + (i/(list.length-1))*(w-2*pad)
    const y = (h - pad) - ((pt.weight - min)/range)*(h-2*pad)
    return `${i===0?'M':'L'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return { path, min, max }
}

function ChartSVG({ data, path, min, max }) {
  const w = 640, h = 200, pad = 24
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="체중 추이 그래프">
      {/* axes */}
      <line x1={pad} y1={h-pad} x2={w-pad} y2={h-pad} stroke="currentColor" opacity="0.3"/>
      <line x1={pad} y1={pad} x2={pad} y2={h-pad} stroke="currentColor" opacity="0.3"/>
      {/* labels */}
      {min!=null && max!=null && (
        <>
          <text x={pad} y={pad-6} fontSize="10" fill="currentColor" opacity="0.6">{max.toFixed(1)}kg</text>
          <text x={pad} y={h-6} fontSize="10" fill="currentColor" opacity="0.6">{min.toFixed(1)}kg</text>
        </>
      )}
      {/* path */}
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2"/>
      {/* dots */}
      {data.map((pt, i) => {
        const range = Math.max(1e-6, (max??0)-(min??0))
        const x = pad + (i/(data.length-1))*(w-2*pad)
        const y = (h - pad) - ((pt.weight - (min??0))/range)*(h-2*pad)
        return <circle key={pt.date} cx={x} cy={y} r="2.5" fill="currentColor" opacity="0.7">
          <title>{pt.date} • {pt.weight}kg{pt.note?` • ${pt.note}`:''}</title>
        </circle>
      })}
    </svg>
  )
}
