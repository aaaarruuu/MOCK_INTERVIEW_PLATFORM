import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/shared/Navbar';
import api from '../services/api';
import './Dashboard.css';

const StatCard = ({ label, value, sub, color }) => (
  <div className="stat-card">
    <div className="stat-value" style={{ color }}>{value}</div>
    <div className="stat-label">{label}</div>
    {sub && <div className="stat-sub">{sub}</div>}
  </div>
);

const diffBadge = d => {
  const map = { beginner: 'badge-green', intermediate: 'badge-yellow', advanced: 'badge-red' };
  return <span className={`badge ${map[d] || 'badge-blue'}`}>{d}</span>;
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [recent, setRecent]   = useState([]);
  const [stats, setStats]     = useState({ total: 0, completed: 0, avgScore: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/interview/history?limit=5').then(r => {
      const list = r.data.interviews || [];
      setRecent(list);
      const done = list.filter(i => i.status === 'completed');
      const avg  = done.length
        ? Math.round(done.reduce((s, i) => s + (i.finalReport?.overallScore || 0), 0) / done.length)
        : 0;
      setStats({ total: r.data.pagination?.total || list.length, completed: done.length, avgScore: avg });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="container">
        <div className="dashboard-hero fade-up">
          <div className="hero-text">
            <h1>Hey, {user?.name?.split(' ')[0]} 👋</h1>
            <p>Ready to ace your next interview? Practice makes perfect.</p>
          </div>
          <Link to="/setup" className="btn btn-primary btn-lg">
            <span>⚡</span> Start New Interview
          </Link>
        </div>

        <div className="stats-grid fade-up">
          <StatCard label="Total Sessions"   value={stats.total}     color="var(--accent)" />
          <StatCard label="Completed"        value={stats.completed} color="var(--success)" />
          <StatCard label="Avg. Score"       value={stats.avgScore ? `${stats.avgScore}%` : '—'} color="var(--warning)" sub="overall performance" />
        </div>

        <div className="section fade-up">
          <div className="section-header">
            <h2>Recent Interviews</h2>
            <Link to="/history" className="btn btn-secondary btn-sm">View All</Link>
          </div>

          {loading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:'40px' }}>
              <div className="spinner" />
            </div>
          ) : recent.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎯</div>
              <h3>No interviews yet</h3>
              <p>Start your first mock interview to see results here.</p>
              <Link to="/setup" className="btn btn-primary">Get Started</Link>
            </div>
          ) : (
            <div className="recent-list">
              {recent.map(iv => (
                <div key={iv._id} className="recent-item" onClick={() => iv.status === 'completed' && navigate(`/results/${iv._id}`)}>
                  <div className="recent-info">
                    <div className="recent-role">{iv.role}</div>
                    <div className="recent-meta">
                      {diffBadge(iv.difficulty)}
                      <span className="dot">·</span>
                      <span>{iv.totalQuestions} questions</span>
                      <span className="dot">·</span>
                      <span>{new Date(iv.startedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="recent-right">
                    {iv.status === 'completed' && iv.finalReport?.overallScore != null
                      ? <div className="score-pill">{iv.finalReport.overallScore}%</div>
                      : <span className={`badge ${iv.status === 'in-progress' ? 'badge-yellow' : 'badge-blue'}`}>{iv.status}</span>
                    }
                    {iv.status === 'completed' && <span className="arrow">→</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="tips-grid fade-up">
          {[
            { icon: '🎯', title: 'Be Specific',   tip: 'Use the STAR method: Situation, Task, Action, Result.' },
            { icon: '🧠', title: 'Think Aloud',   tip: 'Explain your reasoning as you work through problems.' },
            { icon: '📚', title: 'Know the Stack', tip: 'Review fundamentals relevant to the role you\'re targeting.' },
          ].map(t => (
            <div key={t.title} className="tip-card">
              <div className="tip-icon">{t.icon}</div>
              <div><strong>{t.title}</strong><p>{t.tip}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
