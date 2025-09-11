import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function fetchMe() {
    try {
      const { data } = await api.get('/api/auth/me');
      setUser(data || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchMe(); }, []);

  async function login({ email, password }) {
    await api.post('/logintest/login', { email, password });
    await fetchMe();
  }

  async function register({ email, name, password }) {
    await api.post('/api/auth/register', { email, name, password });
  }

  async function logout() {
    await api.post('/logintest/logout');
    setUser(null);
    navigate('/login');
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshMe: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
