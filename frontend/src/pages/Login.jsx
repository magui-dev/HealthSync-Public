import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      await login({ email, password });
      navigate(location.state?.from || '/', { replace: true });
    } catch (e) {
      setError(e?.response?.data?.message || '로그인 실패');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ maxWidth: 420, margin: '32px auto', padding: 16, background: '#fff', borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
      <h1>로그인</h1>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" placeholder="이메일" required />
        <input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" placeholder="비밀번호" required />
        {error && <p style={{ color: 'crimson', fontSize: 14 }}>{error}</p>}
        <button disabled={loading}>{loading ? '로그인 중...' : '로그인'}</button>
      </form>
    </div>
  );
}
