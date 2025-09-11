import React, { useEffect, useMemo, useRef, useState } from 'react'
import { storage } from '../utils/storage.js'

const KEY = 'ws:mealPrepV2'
const KCAL = { carb: 4, protein: 4, fat: 9 }

class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { hasError: false } }
  static getDerivedStateFromError(){ return { hasError: true } }
  componentDidCatch(error, info){ console.error('MealPrep error:', error, info) }
  render(){
    if (this.state.hasError){
      return (
        <article className="card">
          <h3>밀프렙 화면을 불러오는 중 오류가 발생했어요.</h3>
          <p style={{color:'var(--muted)'}}>하드 리로드(Ctrl/Cmd+Shift+R) 또는 데이터 초기화를 시도해보세요.</p>
        </article>
      )
    }
    return this.props.children
  }
}

// ⬇⬇⬇ 여기 강화: 문자열 g 처리, name/macro 안전화
function normalizeIngredient(it){
  // grams: 문자열도 숫자로 변환
  const parsed = Number(it.grams)
  const grams = Number.isFinite(parsed)
    ? parsed
    : (it.unit === 'g' && typeof it.qty === 'number' ? it.qty : null)

  // name: 문자열 강제 + trim
  const name = String(it.name ?? '').trim()

  // macro: 유효성 보정
  const allowed = new Set(['carb', 'protein', 'fat'])
  const macro = allowed.has(it.macro) ? it.macro : 'carb'

  return {
    id: it.id ?? crypto.randomUUID(),
    name,
    macro,
    grams,
    done: !!it.done,
  }
}

function safeLoad() {
  const base = storage.get(KEY, null)
  if (base && typeof base === 'object') {
    return {
      ingredients: Array.isArray(base.ingredients) ? base.ingredients.map(normalizeIngredient) : [],
      recipes: Array.isArray(base.recipes) ? base.recipes : [],
      tasks: Array.isArray(base.tasks) ? base.tasks : [],
    }
  }
  // 초기 샘플
  return {
    ingredients: [
      { id: crypto.randomUUID(), name: '현미밥', macro: 'carb', grams: 150, done: false },
      { id: crypto.randomUUID(), name: '닭가슴살', macro: 'protein', grams: 120, done: false },
    ],
    recipes: [
      { id: crypto.randomUUID(), name: '닭가슴살 샐러드(1인분)', carb_g: 15, protein_g: 35, fat_g: 8, items: [] },
    ],
    tasks: [
      { id: crypto.randomUUID(), text: '밥짓기(현미)', done: false },
      { id: crypto.randomUUID(), text: '닭가슴살 소분 포장', done: false },
    ]
  }
}

export default function MealPrep() {
  const [data, setData] = useState(safeLoad)
  useEffect(()=> storage.set(KEY, data), [data])

  // 선택된 레시피(다중)
  const [selectedRecipeIds, setSelectedRecipeIds] = useState([])
  const toggleSelectRecipe = (id) => {
    setSelectedRecipeIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  const clearSelection = () => setSelectedRecipeIds([])

  // 도넛 표시 모드: kcal | percent
  const [donutMode, setDonutMode] = useState('kcal')

  // --- Ingredients state
  const [filterDone, setFilterDone] = useState('all') // all/todo/done
  const [search, setSearch] = useState('')

  // 레시피 생성 후 재료 비우기 옵션 (기본 true) + 영속화
  const [clearAfterCreate, setClearAfterCreate] = useState(() => {
    const v = storage.get(KEY + ':clearAfterCreate', null)
    return typeof v === 'boolean' ? v : true
  })
  useEffect(() => {
    storage.set(KEY + ':clearAfterCreate', clearAfterCreate)
  }, [clearAfterCreate])

  const filteredIngredients = useMemo(() => {
    return data.ingredients.filter(it => {
      if (filterDone==='todo' && it.done) return false
      if (filterDone==='done' && !it.done) return false
      if (search && !(`${it.name}`).toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [data.ingredients, filterDone, search])

  // ✅ 재료 추가: 최상단 삽입 + 필터/검색 초기화 + 포커스/스크롤
  function addIngredient(item) {
    const id = crypto.randomUUID()
    const normalized = normalizeIngredient({ id, ...item })

    setData(prev => ({
      ...prev,
      ingredients: [normalized, ...prev.ingredients],
    }))

    setSearch('')
    setFilterDone('all')

    setTimeout(() => {
      const el = document.getElementById('ingredient-name-' + id)
      if (el) {
        el.focus()
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 0)
  }

  function updateIngredient(id, patch) {
    setData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map(it => it.id===id ? normalizeIngredient({ ...it, ...patch }) : it)
    }))
  }
  function removeIngredient(id) {
    setData(prev => ({ ...prev, ingredients: prev.ingredients.filter(it => it.id!==id) }))
  }
  function toggleIngredient(id) {
    setData(prev => ({ ...prev, ingredients: prev.ingredients.map(it => it.id===id ? { ...it, done: !it.done } : it) }))
  }

  // --- Recipes
  function addRecipe(r) {
    setData(prev => ({ ...prev, recipes: [{ id: crypto.randomUUID(), ...r }, ...prev.recipes] }))
  }
  function updateRecipe(id, patch) {
    setData(prev => ({ ...prev, recipes: prev.recipes.map(it => it.id===id ? { ...it, ...patch } : it) }))
  }
  function removeRecipe(id) {
    setData(prev => ({ ...prev, recipes: prev.recipes.filter(it => it.id!==id) }))
    setSelectedRecipeIds(prev => prev.filter(x => x !== id))
  }

  // 총 칼로리(요약 그래프용: 전체 합계)
  const totalKcal = useMemo(() => {
    const s = { carb:0, protein:0, fat:0 }
    for (const r of data.recipes) {
      s.carb += (Number(r.carb_g)||0) * KCAL.carb
      s.protein += (Number(r.protein_g)||0) * KCAL.protein
      s.fat += (Number(r.fat_g)||0) * KCAL.fat
    }
    return s
  }, [data.recipes])

  function recipeKcal(r){
    const carb = (Number(r.carb_g)||0) * KCAL.carb
    const protein = (Number(r.protein_g)||0) * KCAL.protein
    const fat = (Number(r.fat_g)||0) * KCAL.fat
    return { carb, protein, fat }
  }

  const selectedKcal = useMemo(() => {
    const s = { carb:0, protein:0, fat:0 }
    for (const r of data.recipes) {
      if (!selectedRecipeIds.includes(r.id)) continue
      const k = recipeKcal(r)
      s.carb += k.carb
      s.protein += k.protein
      s.fat += k.fat
    }
    return s
  }, [data.recipes, selectedRecipeIds])

  const hasSelection = selectedRecipeIds.length > 0
  const donutData = hasSelection ? selectedKcal : totalKcal

  // --- Export/Import/Reset
  const fileRef = useRef(null)
  function exportJson() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'meal-prep.json'; a.click()
    URL.revokeObjectURL(url)
  }
  function importJson(file) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const obj = JSON.parse(String(reader.result || '{}'))
        if (!obj || !Array.isArray(obj.ingredients) || !Array.isArray(obj.tasks)) throw new Error('형식 오류')
        if (!Array.isArray(obj.recipes)) obj.recipes = []
        obj.ingredients = obj.ingredients.map(normalizeIngredient)
        setData({ ingredients: obj.ingredients, recipes: obj.recipes, tasks: obj.tasks })
        clearSelection()
      } catch (e) {
        alert('가져오기에 실패했습니다: ' + e.message)
      }
    }
    reader.readAsText(file, 'utf-8')
  }
  function clearAll() {
    if (confirm('밀프렙 데이터를 초기 상태로 되돌릴까요?')) {
      setData(safeLoad())
      clearSelection()
    }
  }

  // 재료 → 레시피 1개 생성 (재료 g 합산해서 탄/단/지 자동 입력)
  function createRecipeFromCurrentIngredients() {
    const id = crypto.randomUUID()
    let carb = 0, protein = 0, fat = 0
    const items = data.ingredients.map(x => ({ ...x }))
    for (const it of data.ingredients) {
      const g = Number(it.grams) || 0
      if (it.macro === 'carb') carb += g
      else if (it.macro === 'protein') protein += g
      else if (it.macro === 'fat') fat += g
    }
    setData(prev => ({
      ...prev,
      recipes: [{ id, name: '', carb_g: carb, protein_g: protein, fat_g: fat, items }, ...prev.recipes],
      ingredients: clearAfterCreate ? [] : prev.ingredients,
    }))
    setTimeout(()=>{
      const el = document.getElementById('recipe-name-'+id)
      if (el) el.focus()
      const anchor = document.getElementById('recipes-section')
      if (anchor) anchor.scrollIntoView({ behavior:'smooth', block:'start' })
    }, 0)
  }

  return (
    <ErrorBoundary>
      <section className="grid">
        {/* Header */}
        <article className="card">
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, flexWrap:'wrap'}}>
            <h2 style={{margin:0}}>밀프렙</h2>
          </div>

          {/* 파일/버튼 영역 */}
          <div style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', marginTop:8}}>
            <button className="btn" onClick={()=>fileRef.current?.click()}>가져오기(JSON)</button>
            <input ref={fileRef} type="file" accept="application/json,.json" style={{display:'none'}}
                   onChange={e=> e.target.files?.[0] && importJson(e.target.files[0])} />
            <button className="btn" onClick={exportJson}>내보내기(JSON)</button>
            <button className="btn" onClick={clearAll}>초기화</button>
            <span className="badge" style={{marginLeft:'auto'}}>
              재료 {data.ingredients.length} • 음식 {data.recipes.length} • 할 일 {data.tasks.length}
            </span>
          </div>

          {/* 그래프 */}
          <div style={{marginTop:16, display:'flex', gap:12, alignItems:'center', flexWrap:'wrap'}}>
            <strong style={{fontSize:12, color:'var(--muted)'}}>
              {hasSelection ? `선택 ${selectedRecipeIds.length}개 합계` : '총 칼로리 분포'}
            </strong>
            <DonutSummary
              carbs={donutData.carb}
              protein={donutData.protein}
              fat={donutData.fat}
              size={120}
              mode={donutMode}
            />
            <button className="btn" onClick={()=> setDonutMode(m => m === 'kcal' ? 'percent' : 'kcal')}>
              {donutMode === 'kcal' ? '%로 보기' : 'kcal로 보기'}
            </button>
            {hasSelection && (
              <button className="btn" onClick={clearSelection}>선택 해제</button>
            )}
          </div>
        </article>

        {/* Ingredients */}
        <article className="card">
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, flexWrap:'wrap'}}>
            <h3 style={{margin:0}}>재료</h3>
            <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
              <input className="input" placeholder="검색(이름)" value={search} onChange={e=>setSearch(e.target.value)} />
              <select className="select" value={filterDone} onChange={e=>setFilterDone(e.target.value)}>
                <option value="all">전체</option>
                <option value="todo">미완료</option>
                <option value="done">완료</option>
              </select>

              <label className="badge" style={{display:'inline-flex', alignItems:'center', gap:6}}>
                <input type="checkbox" checked={clearAfterCreate} onChange={e=>setClearAfterCreate(e.target.checked)} />
                레시피 생성 후 재료 비우기
              </label>

              <button className="btn primary" onClick={createRecipeFromCurrentIngredients}>
                현재 재료로 레시피 만들기
              </button>
            </div>
          </div>

          <IngredientForm onAdd={addIngredient} />

          <div className="card" style={{overflowX:'auto', marginTop:8}}>
            <table className="table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th style={{width:160}}>구분(탄/단/지)</th>
                  <th style={{width:120}}>g</th>
                  <th style={{width:140}}>동작</th>
                </tr>
              </thead>
              <tbody>
                {filteredIngredients.map(it => (
                  <tr key={it.id}>
                    <td>
                      <input
                        id={`ingredient-name-${it.id}`}   // 포커스 대상
                        className="input"
                        style={{ minWidth: 80 }}                // ← 가시성 UP
                        value={String(it.name ?? '')}            // ← 항상 문자열
                        placeholder="재료명"          
                        onChange={e=>updateIngredient(it.id, { name: e.target.value })}
                        onClick={(e)=>e.stopPropagation()}
                      />
                    </td>
                    <td>
                      <select
                        className="select"
                        style={{ minWidth: 90 }}     
                        value={it.macro ?? 'carb'}
                        onChange={e=>updateIngredient(it.id, { macro: e.target.value })}
                        onClick={(e)=>e.stopPropagation()}
                      >
                        <option value="carb">탄수화물</option>
                        <option value="protein">단백질</option>
                        <option value="fat">지방</option>
                      </select>
                    </td>
                    <td>
                      <input
                        className="input"
                        style={{ minWidth: 80 }}     
                        type="number"
                        step="0.1"
                        value={it.grams ?? ''}
                        onChange={e=>updateIngredient(it.id, { grams: numOrNull(e.target.value) })}
                        onClick={(e)=>e.stopPropagation()}
                      />
                    </td>
                    <td>
                      <button className="btn" onClick={(e)=>{e.stopPropagation(); removeIngredient(it.id);}}>삭제</button>
                    </td>
                  </tr>
                ))}
                {filteredIngredients.length===0 && <tr><td colSpan="5" style={{color:'var(--muted)'}}>표시할 재료가 없습니다.</td></tr>}
              </tbody>
            </table>
          </div>
        </article>

      {/* Recipes */}
      
          <article
            className="card"
            id="recipes-section"
            style={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: '60vh',       // 필요하면 50~70vh로 조절 가능
              minWidth: '170%'
            }}
          >
            <h3 style={{ margin: 0 }}>음식(레시피)</h3>

            <div style={{ flex: 1, marginTop: 8, overflow: 'auto', minWidth: '100%' }}>
            <table className="table" style={{ tableLayout: 'fixed', width: '100%' }}>
              {/* ✅ 열 너비 지정 */}
              <colgroup>
                <col style={{ width: 150 }} />   {/* 이름 */}
                <col style={{ width: 150 }} />   {/* 구성 재료 (가변) */}
                <col style={{ width: 110 }} />   {/* 탄(g) */}
                <col style={{ width: 110 }} />   {/* 단(g) */}
                <col style={{ width: 110 }} />   {/* 지(g) */}
                <col style={{ width: 120 }} />   {/* 칼로리 */}
                <col style={{ width: 100 }} />   {/* 요약 버튼 */}
                <col style={{ width: 80 }} />    {/* 삭제 버튼 */}
              </colgroup>

              <thead>
                <tr>
                  <th>이름</th>
                  <th>구성 재료</th>
                  <th>탄(g)</th>
                  <th>단(g)</th>
                  <th>지(g)</th>
                  <th>칼로리(kcal)</th>
                  <th>요약</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {data.recipes.map(r => {
                  const carbK = (Number(r.carb_g) || 0) * KCAL.carb
                  const protK = (Number(r.protein_g) || 0) * KCAL.protein
                  const fatK = (Number(r.fat_g) || 0) * KCAL.fat
                  const total = carbK + protK + fatK
                  const isSelected = selectedRecipeIds.includes(r.id)

                  return (
                    <tr
                      key={r.id}
                      onClick={() => toggleSelectRecipe(r.id)}
                      style={{ cursor: 'pointer', ...(isSelected ? { outline: '2px solid var(--primary)' } : null) }}
                      aria-selected={isSelected}
                    >
                      {/* 이름 */}
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          id={`recipe-name-${r.id}`}
                          className="input"
                          style={{ width: '100%' }}
                          value={r.name}
                          onChange={(e) => updateRecipe(r.id, { name: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>

                      {/* ✅ 구성 재료 */}
                      <td onClick={(e) => e.stopPropagation()}>
                        <span
                          title={
                            Array.isArray(r.items)
                              ? r.items.map(i => i?.name || '').filter(Boolean).join(', ')
                              : ''
                          }
                          style={{
                            display: 'inline-block',
                            maxWidth: '500%',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {Array.isArray(r.items)
                            ? r.items.map(i => i?.name || '').filter(Boolean).join(', ')
                            : ''}
                        </span>
                      </td>

                      {/* 탄수화물 */}
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          className="input"
                          type="number"
                          step="0.1"
                          style={{ width: '100%' }}
                          value={r.carb_g ?? ''}
                          onChange={(e) => updateRecipe(r.id, { carb_g: numOrNull(e.target.value) })}
                        />
                      </td>

                      {/* 단백질 */}
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          className="input"
                          type="number"
                          step="0.1"
                          style={{ width: '100%' }}
                          value={r.protein_g ?? ''}
                          onChange={(e) => updateRecipe(r.id, { protein_g: numOrNull(e.target.value) })}
                        />
                      </td>

                      {/* 지방 */}
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          className="input"
                          type="number"
                          step="0.1"
                          style={{ width: '100%' }}
                          value={r.fat_g ?? ''}
                          onChange={(e) => updateRecipe(r.id, { fat_g: numOrNull(e.target.value) })}
                        />
                      </td>

                      {/* 칼로리 */}
                      <td onClick={(e) => e.stopPropagation()}>{Math.round(total)}</td>

                      {/* 요약 버튼 */}
                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          className={isSelected ? 'btn primary' : 'btn'}
                          onClick={(e) => { e.stopPropagation(); toggleSelectRecipe(r.id); }}
                        >
                          {isSelected ? '해제' : '선택'}
                        </button>
                      </td>

                      {/* 삭제 버튼 */}
                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn"
                          onClick={(e) => { e.stopPropagation(); removeRecipe(r.id); }}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  )
                })}

                {data.recipes.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ color: 'var(--muted)' }}>아직 음식이 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>          

        {/* Tasks */}
        <article className="card">
          <h3>할 일</h3>
          <TaskForm onAdd={(text)=> setData(prev => ({ ...prev, tasks: [{ id: crypto.randomUUID(), text: text.trim(), done:false }, ...prev.tasks] }))} />
          <ul style={{listStyle:'none', padding:0, margin:0, display:'grid', gap:8}}>
            {data.tasks.map(t => (
              <li key={t.id} className="card" style={{display:'flex', alignItems:'center', gap:10, padding:'10px 12px'}}>
                <input type="checkbox" checked={t.done} onChange={()=> setData(prev => ({ ...prev, tasks: prev.tasks.map(x => x.id===t.id ? { ...x, done: !x.done } : x) }))} aria-label="완료 표시"/>
                <input className="input" style={{flex:1, textDecoration: t.done ? 'line-through' : 'none', opacity: t.done ? 0.7 : 1}} value={t.text} onChange={e=> setData(prev => ({ ...prev, tasks: prev.tasks.map(x => x.id===t.id ? { ...x, text: e.target.value } : x) }))} />
                <button className="btn" onClick={()=> setData(prev => ({ ...prev, tasks: prev.tasks.filter(x => x.id!==t.id) }))}>삭제</button>
              </li>
            ))}
            {data.tasks.length===0 && <li style={{color:'var(--muted)'}}>아직 할 일이 없어요.</li>}
          </ul>
        </article>
      </section>
    </ErrorBoundary>
  )
}

function IngredientForm({ onAdd }) {
  const [form, setForm] = useState({ name:'', macro:'carb', grams:'' })
  function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    onAdd({ name:form.name.trim(), macro:form.macro, grams:numOrNull(form.grams) })
    setForm({ name:'', macro:'carb', grams:'' })
  }
  return (
    <form onSubmit={submit} style={{display:'grid', gridTemplateColumns:'2fr 1.2fr 1fr 1fr', gap:8, marginTop:8}} aria-label="재료 추가 폼">
      <input className="input" placeholder="재료명" value={form.name} onChange={e=>setForm(f=>({...f, name:e.target.value}))} />
      <select className="select" value={form.macro} onChange={e=>setForm(f=>({...f, macro:e.target.value}))}>
        <option value="carb">탄수화물</option>
        <option value="protein">단백질</option>
        <option value="fat">지방</option>
      </select>
      <input className="input" type="number" step="0.1" placeholder="g" value={form.grams} onChange={e=>setForm(f=>({...f, grams:e.target.value}))} />
      <button className="btn primary" type="submit">추가</button>
    </form>
  )
}

function RecipeForm({ onAdd }) {
  const [form, setForm] = useState({ name:'', carb_g:'', protein_g:'', fat_g:'' })
  function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    onAdd({ name:form.name.trim(), carb_g:numOrNull(form.carb_g), protein_g:numOrNull(form.protein_g), fat_g:numOrNull(form.fat_g) })
    setForm({ name:'', carb_g:'', protein_g:'', fat_g:'' })
  }
  return (
    <form onSubmit={submit} style={{display:'grid', gridTemplateColumns:'2fr repeat(3, 1fr) 1fr', gap:8, marginTop:8}} aria-label="음식 추가 폼">
      <input className="input" placeholder="음식명" value={form.name} onChange={e=>setForm(f=>({...f, name:e.target.value}))} />
      <button className="btn primary" type="submit">추가</button>
    </form>
  )
}

/* 헤더에만 쓰는 요약 도넛 */
function Donut({ carbs, protein, fat, size=80 }) {
  const total = carbs + protein + fat
  const c = Math.max(1e-6, total)
  const r = size/2 - 6
  const circ = 2 * Math.PI * r

  const carbLen = (carbs / c) * circ
  const protLen = (protein / c) * circ
  const fatLen = (fat / c) * circ

  const gap = 2
  const offsetCarb = 0
  const offsetProt = offsetCarb + carbLen + gap
  const offsetFat = offsetProt + protLen + gap

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label="매크로 도넛 차트" role="img">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="10" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#7ad1f7" strokeWidth="10"
        strokeDasharray={`${carbLen} ${circ}`} strokeDashoffset={-offsetCarb} transform={`rotate(-90 ${size/2} ${size/2})`} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#7ce38b" strokeWidth="10"
        strokeDasharray={`${protLen} ${circ}`} strokeDashoffset={-offsetProt} transform={`rotate(-90 ${size/2} ${size/2})`} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#ef596f" strokeWidth="10"
        strokeDasharray={`${fatLen} ${circ}`} strokeDashoffset={-offsetFat} transform={`rotate(-90 ${size/2} ${size/2})`} />
    </svg>
  )
}

function DonutSummary({ carbs, protein, fat, size=120, mode='kcal' }) {
  const total = carbs + protein + fat
  const safeTotal = Math.max(1e-6, total)
  const fmt = (v) => mode === 'kcal' ? `${Math.round(v)} kcal` : `${Math.round((v / safeTotal) * 100)} %`
  const centerText = mode === 'kcal' ? `${Math.round(total)} kcal` : '100%'

  return (
    <div style={{display:'flex', alignItems:'center', gap:12}}>
      <div style={{position:'relative', width:size, height:size}}>
        <Donut carbs={carbs} protein={protein} fat={fat} size={size} />
        <div style={{
          position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:11, opacity:0.8
        }}>{centerText}</div>
      </div>
      <div style={{display:'grid', gap:4, fontSize:12}}>
        <Legend color="#7ad1f7" label="탄수화물" valueText={fmt(carbs)} />
        <Legend color="#7ce38b" label="단백질" valueText={fmt(protein)} />
        <Legend color="#ef596f" label="지방" valueText={fmt(fat)} />
      </div>
    </div>
  )
}

function Legend({ color, label, valueText }) {
  return (
    <div style={{display:'flex', alignItems:'center', gap:8}}>
      <span style={{width:12, height:12, borderRadius:3, background:color, display:'inline-block'}} aria-hidden="true" />
      <span style={{color:'var(--muted)'}}>{label}</span>
      <strong>{valueText}</strong>
    </div>
  )
}

function TaskForm({ onAdd }) {
  const [text, setText] = useState('')
  function submit(e) {
    e.preventDefault()
    if (!text.trim()) return
    onAdd(text)
    setText('')
  }
  return (
    <form onSubmit={submit} style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:8}} aria-label="할 일 추가 폼">
      <input className="input" placeholder="예: 닭가슴살 1.2kg 소분" value={text} onChange={e=>setText(e.target.value)} />
      <button className="btn primary" type="submit">추가</button>
    </form>
  )
}

function numOrNull(v) { const n = Number(v); return Number.isFinite(n) ? n : null }
