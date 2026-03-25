import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-glow" />
      <div className="auth-card fade-up">
        <div className="auth-header">
          <div className="auth-logo">⬡</div>
          <h1>Welcome back</h1>
          <p>Sign in to continue your interview prep</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input name="email" type="email" className="form-input"
              placeholder="you@example.com" value={form.email} onChange={onChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input name="password" type="password" className="form-input"
              placeholder="••••••••" value={form.password} onChange={onChange} required />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{width:'100%'}} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
