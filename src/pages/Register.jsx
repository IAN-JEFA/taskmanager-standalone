import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    const res = await register(form);
    if (res.success) {
      navigate('/', { replace: true });
    } else {
      setError(res.message);
      setFieldErrors(res.errors || {});
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

        <h1 className="auth-title">Provision a new account</h1>
        <p className="auth-subtitle">Set up credentials to start tracking tasks.</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="field">
            <span className="field__label">Name</span>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ada Lovelace"
            />
            {fieldErrors.name && <span className="field__error">{fieldErrors.name[0]}</span>}
          </label>

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
            {fieldErrors.email && <span className="field__error">{fieldErrors.email[0]}</span>}
          </label>

          <label className="field">
            <span className="field__label">Password</span>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="At least 8 characters"
            />
            {fieldErrors.password && (
              <span className="field__error">{fieldErrors.password[0]}</span>
            )}
          </label>

          <label className="field">
            <span className="field__label">Confirm password</span>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={form.password_confirmation}
              onChange={(e) =>
                setForm({ ...form, password_confirmation: e.target.value })
              }
              placeholder="Repeat password"
            />
          </label>

          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? 'Provisioning…' : 'Create account'}
          </button>
        </form>

        <p className="auth-footnote">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
