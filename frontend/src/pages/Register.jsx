import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', name: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function onChange(e){ setForm({ ...form, [e.target.name]: e.target.value }); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      await register(form);
      alert('회원가입 완료! 로그인 해주세요.');
      navigate('/login');
    } catch (e) {
      setError(e?.response?.data?.message || '회원가입 실패');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ maxWidth: 420, margin: '32px auto', padding: 16, background: '#fff', borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
      <h1>회원가입</h1>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <input name="email" value={form.email} onChange={onChange} placeholder="이메일" required />
        <input name="name" value={form.name} onChange={onChange} placeholder="이름" required />
        <input name="password" type="password" value={form.password} onChange={onChange} placeholder="비밀번호" required />
        {error && <p style={{ color: 'crimson', fontSize: 14 }}>{error}</p>}
        <button disabled={loading}>{loading ? '가입 중...' : '가입하기'}</button>
      </form>
    </div>
  );
}
