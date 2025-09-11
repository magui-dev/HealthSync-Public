export default function Home() {
  return (
    <section className="grid">
      <article className="card">
        <h2>체중관리</h2>
        <p>매일/주간 체중을 기록하고 추이를 확인하세요.</p>
        <a className="btn primary" href="/weight/track" aria-label="체중관리로 이동">바로 가기</a>
      </article>
      <article className="card">
        <h2>식단관리</h2>
        <p>식단짜기와 밀프렙을 한 곳에서 관리합니다.</p>
        <a className="btn primary" href="/food" aria-label="식단관리로 이동">바로 가기</a>
      </article>
    </section>
  )
}
