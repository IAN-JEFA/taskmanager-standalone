import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('taskops_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('taskops_token'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) localStorage.setItem('taskops_token', token);
    else localStorage.removeItem('taskops_token');
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('taskops_user', JSON.stringify(user));
    else localStorage.removeItem('taskops_user');
  }, [user]);

  const register = useCallback(async ({ name, email, password, password_confirmation }) => {
    setLoading(true);
    try {
      const { data } = await client.post('/register', {
        name,
        email,
        password,
        password_confirmation,
      });
      setUser(data.user);
      setToken(data.token);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed.',
        errors: err.response?.data?.errors,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setLoading(true);
    try {
      const { data } = await client.post('/login', { email, password });
      setUser(data.user);
      setToken(data.token);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed.',
        errors: err.response?.data?.errors,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await client.post('/logout');
    } catch {
      // ignore — we clear local state regardless
    }
    setUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
