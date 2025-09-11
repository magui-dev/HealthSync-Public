import { NavLink, Outlet } from 'react-router-dom'

export default function FoodLayout() {
  return (
    <section className="grid">
      <nav aria-label="breadcrumb" style={{marginBottom:8, color:'var(--muted)'}}>
        <span>홈</span> <span aria-hidden="true">›</span> <span>식단관리</span>
      </nav>

      <article className="card">
        <h2 style={{marginBottom:12}}>식단관리</h2>
        <div role="tablist" aria-label="식단관리 하위 탭" style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:4}}>
          <NavLink to="/food/plan" className={({isActive}) => isActive ? 'btn primary' : 'btn'} role="tab">식단짜기</NavLink>
          <NavLink to="/food/mealprep" className={({isActive}) => isActive ? 'btn primary' : 'btn'} role="tab">밀프렙</NavLink>
        </div>
      </article>

      <div style={{gridColumn:'1/-1'}}>
        <Outlet />
      </div>
    </section>
  )
}
