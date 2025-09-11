import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/axios';

export default function BoardEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [title, setTitle] = useState('');
  const [contentTxt, setContentTxt] = useState('');
  const [visibility, setVisibility] = useState('PUBLIC');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    if (!isEdit) return;
    (async ()=>{
      try {
        const { data } = await api.get(`/posts/${id}`);
        setTitle(data.title || '');
        setContentTxt(data.contentTxt || '');
        setVisibility(data.visibility || 'PUBLIC');
      } catch { setError('불러오기 실패'); }
    })();
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const payload = { title, contentTxt, visibility };
      if (isEdit) {
        await api.put(`/posts/${id}`, payload);
        alert('수정되었습니다.');
        navigate(`/board/${id}`);
      } else {
        const { data } = await api.post('/posts', payload);
        alert('작성되었습니다.');
        navigate(data?.id ? `/board/${data.id}` : '/board');
      }
    } catch (e) {
      setError(e?.response?.data?.message || '저장 실패');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 16, borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', display: 'grid', gap: 12 }}>
        <h1>{isEdit ? '글 수정' : '새 글 작성'}</h1>
        <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="제목" maxLength={200} required />
        <select value={visibility} onChange={(e)=>setVisibility(e.target.value)}>
          <option value="PUBLIC">공개</option>
          <option value="PRIVATE">비공개</option>
        </select>
        <textarea value={contentTxt} onChange={(e)=>setContentTxt(e.target.value)} placeholder="내용" rows={12} required />
        {error && <p style={{ color: 'crimson', fontSize: 14 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button disabled={loading}>{loading ? '저장 중...' : '저장'}</button>
          <button type="button" onClick={()=>navigate(-1)}>취소</button>
        </div>
      </form>
    </div>
  );
}
