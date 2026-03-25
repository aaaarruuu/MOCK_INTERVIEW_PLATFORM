import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/shared/Navbar';
import api from '../services/api';
import './Setup.css';

const ROLES = [
  'Frontend Developer','Backend Developer','Full Stack Developer','React Developer',
  'Node.js Developer','Python Developer','DevOps Engineer','Data Scientist',
  'Machine Learning Engineer','Mobile Developer','UI/UX Designer','Product Manager',
];

export default function Setup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    role: '', customRole: '', difficulty: 'intermediate',
    experience: '', totalQuestions: '5'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const onChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async e => {
    e.preventDefault();
    setError('');
    const role = form.role === 'custom' ? form.customRole.trim() : form.role;
    if (!role) return setError('Please select or enter a job role.');
    if (!form.experience.trim()) return setError('Please describe your experience.');
    setLoading(true);
    try {
      const { data } = await api.post('/interview/start', {
        role, difficulty: form.difficulty,
        experience: form.experience, totalQuestions: parseInt(form.totalQuestions)
      });
      navigate(`/interview/${data.interviewId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start interview. Check your Gemini API key.');
    } finally { setLoading(false); }
  };

  return (
    <div className="setup-page">
      <Navbar />
      <div className="container">
        <div className="setup-header fade-up">
          <h1>Configure Your Interview</h1>
          <p>Set up your mock interview session. Our AI will generate tailored questions.</p>
        </div>

        {error && <div className="alert alert-error fade-up">{error}</div>}

        <form onSubmit={onSubmit} className="setup-form fade-up">
          <div className="setup-grid">
            <div className="setup-section">
              <h3>Role & Difficulty</h3>

              <div className="form-group">
                <label className="form-label">Job Role</label>
                <select name="role" className="form-input" value={form.role} onChange={onChange} required>
                  <option value="">Select a role…</option>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  <option value="custom">Other (custom)</option>
                </select>
              </div>

              {form.role === 'custom' && (
                <div className="form-group">
                  <label className="form-label">Custom Role</label>
                  <input name="customRole" type="text" className="form-input"
                    placeholder="e.g. Blockchain Developer" value={form.customRole} onChange={onChange} />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Difficulty</label>
                <div className="diff-buttons">
                  {['beginner','intermediate','advanced'].map(d => (
                    <button type="button" key={d}
                      className={`diff-btn ${form.difficulty === d ? 'active' : ''} diff-${d}`}
                      onClick={() => setForm(f => ({ ...f, difficulty: d }))}>
                      {d === 'beginner' ? '🌱' : d === 'intermediate' ? '🔥' : '⚡'} {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Number of Questions</label>
                <div className="q-buttons">
                  {['3','5','7','10'].map(n => (
                    <button type="button" key={n}
                      className={`q-btn ${form.totalQuestions === n ? 'active' : ''}`}
                      onClick={() => setForm(f => ({ ...f, totalQuestions: n }))}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="setup-section">
              <h3>Your Background</h3>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Experience Level & Background</label>
                <textarea name="experience" className="form-input setup-textarea"
                  placeholder="e.g. 2 years building React apps, familiar with REST APIs, worked with Redux and TypeScript…"
                  value={form.experience} onChange={onChange} required />
                <div className="form-hint">The more detail you provide, the better tailored your questions will be.</div>
              </div>
            </div>
          </div>

          <div className="setup-footer">
            <div className="setup-summary">
              <span>🎯 <strong>{form.totalQuestions}</strong> questions</span>
              <span>·</span>
              <span>🔥 <strong>{form.difficulty}</strong></span>
              <span>·</span>
              <span>⏱ ~{parseInt(form.totalQuestions) * 3} min estimated</span>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? (
                <><div className="spinner" style={{ width:20, height:20, borderWidth:2 }} /> Generating questions…</>
              ) : (
                <><span>⚡</span> Start Interview</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
