import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/axios';

export default function BoardList() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load(p=0) {
    setLoading(true); setError(null);
    try {
      const { data } = await api.get('/posts', { params: { page: p, size: 10 } });
      const list = Array.isArray(data) ? data : (data?.content ?? []);
      setItems(list);
      setTotalPages(data?.totalPages ?? 1);
      setPage(p);
    } catch {
      setError('게시글 불러오기 실패');
    } finally { setLoading(false); }
  }

  useEffect(() => { load(0); }, []);
  if (loading) return <div style={{ padding: 16 }}>불러오는 중...</div>;
  if (error) return <div style={{ padding: 16, color: 'crimson' }}>{error}</div>;

  return (
    <div className="container" style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <h1>게시판</h1>
        <Link to="/board/new">새 글</Link>
      </div>
      <ul style={{ display: 'grid', gap: 12 }}>
        {items.map(post => (
          <li key={post.id} style={{ background: '#fff', padding: 16, borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <Link to={`/board/${post.id}`} style={{ fontWeight: 600 }}>{post.title || '(제목 없음)'}</Link>
            <p style={{ color: '#555' }}>{post.contentTxt}</p>
          </li>
        ))}
      </ul>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
        <button onClick={()=>load(Math.max(0, page-1))} disabled={page<=0}>이전</button>
        <span>{page+1} / {totalPages}</span>
        <button onClick={()=>load(Math.min(totalPages-1, page+1))} disabled={page>=totalPages-1}>다음</button>
      </div>
    </div>
  );
}
