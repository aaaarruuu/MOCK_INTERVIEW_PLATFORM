import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]     = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async e => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-glow" />
      <div className="auth-card fade-up">
        <div className="auth-header">
          <div className="auth-logo">⬡</div>
          <h1>Create account</h1>
          <p>Start practicing interviews with AI today</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input name="name" type="text" className="form-input"
              placeholder="Jane Smith" value={form.name} onChange={onChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input name="email" type="email" className="form-input"
              placeholder="you@example.com" value={form.email} onChange={onChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input name="password" type="password" className="form-input"
              placeholder="Min. 6 characters" value={form.password} onChange={onChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input name="confirm" type="password" className="form-input"
              placeholder="Repeat password" value={form.confirm} onChange={onChange} required />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{width:'100%'}} disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
