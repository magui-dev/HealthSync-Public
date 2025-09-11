import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Topbar() {
  const { user, logout } = useAuth();
  return (
    <div style={{ borderBottom: '1px solid #eee', background: '#fafafa' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/board">게시판</Link>
          {user && <Link to="/board/new">새 글</Link>}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {user ? (
            <>
              <span style={{ fontSize: 14, color: '#666' }}>{user.name || user.email}</span>
              <button onClick={logout}>로그아웃</button>
            </>
          ) : (
            <>
              <Link to="/login">로그인</Link>
              <Link to="/register">회원가입</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
