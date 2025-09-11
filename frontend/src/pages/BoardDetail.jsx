import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

export default function BoardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    try {
      const { data } = await api.get(`/posts/${id}`);
      setPost(data);
    } catch {
      setError('게시글 조회 실패');
    } finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!confirm('삭제할까요?')) return;
    try {
      await api.delete(`/posts/${id}`);
      alert('삭제되었습니다.');
      navigate('/board');
    } catch {
      alert('삭제 실패');
    }
  }

  useEffect(()=>{ load(); }, [id]);
  if (loading) return <div style={{ padding: 16 }}>불러오는 중...</div>;
  if (error) return <div style={{ padding: 16, color: 'crimson' }}>{error}</div>;
  if (!post) return null;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <div style={{ marginBottom: 8 }}><Link to="/board">← 목록</Link></div>
      <div style={{ background: '#fff', padding: 16, borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
        <h2>{post.title}</h2>
        <div style={{ color: '#888', margin: '8px 0 16px' }}>{post.createdAt?.slice(0,10)}</div>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{post.contentTxt}</pre>
        {user && (
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <Link to={`/board/${id}/edit`}>수정</Link>
            <button onClick={handleDelete}>삭제</button>
          </div>
        )}
      </div>
    </div>
  );
}
