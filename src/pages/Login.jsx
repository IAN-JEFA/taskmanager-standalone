import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const res = await login(form);
    if (res.success) {
      navigate('/', { replace: true });
    } else {
      setError(res.message);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-backdrop" aria-hidden="true">
        <div className="grid-lines" />
      </div>

      <div className="auth-card">
        <div className="auth-brand">
          <span className="beacon beacon--ok" />
          <span className="auth-brand__text">TASK OPS CONSOLE</span>
        </div>

        <h1 className="auth-title">Sign in to your console</h1>
        <p className="auth-subtitle">Access requires an authenticated session.</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="field">
            <span className="field__label">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@domain.com"
            />
          </label>

          <label className="field">
            <span className="field__label">Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />
          </label>

          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? 'Authenticating…' : 'Sign in'}
          </button>
        </form>

        <p className="auth-footnote">
          Don&apos;t have access yet? <Link to="/register">Create an account</Link>
        </p>

        <p className="auth-demo-hint">
          Demo credentials (after seeding): <code>demo@taskops.dev</code> / <code>password123</code>
        </p>
      </div>
    </div>
  );
}
