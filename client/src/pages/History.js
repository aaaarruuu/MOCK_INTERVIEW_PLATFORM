import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/shared/Navbar';
import api from '../services/api';
import './History.css';

const diffBadge = d => {
  const map = { beginner:'badge-green', intermediate:'badge-yellow', advanced:'badge-red' };
  return <span className={`badge ${map[d]||'badge-blue'}`}>{d}</span>;
};

const statusBadge = s => {
  if (s === 'completed')   return <span className="badge badge-green">Completed</span>;
  if (s === 'in-progress') return <span className="badge badge-yellow">In Progress</span>;
  return <span className="badge">Abandoned</span>;
};

export default function History() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [pagination, setPagination] = useState({ page:1, totalPages:1 });
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState(null);

  const load = (page=1) => {
    setLoading(true);
    api.get(`/interview/history?page=${page}&limit=10`)
      .then(r => { setInterviews(r.data.interviews); setPagination(r.data.pagination); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this interview?')) return;
    setDeleting(id);
    try {
      await api.delete(`/interview/${id}`);
      setInterviews(p => p.filter(i => i._id !== id));
    } catch {}
    setDeleting(null);
  };

  return (
    <div className="history-page">
      <Navbar />
      <div className="container">
        <div className="history-header fade-up">
          <div>
            <h1>Interview History</h1>
            <p style={{ color:'var(--text2)' }}>All your past sessions in one place</p>
          </div>
        </div>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'60px' }}><div className="spinner"/></div>
        ) : interviews.length === 0 ? (
          <div className="card empty-state fade-up">
            <div className="empty-icon">📋</div>
            <h3>No interviews yet</h3>
            <p>Your completed interviews will appear here.</p>
            <button className="btn btn-primary" onClick={() => navigate('/setup')}>Start an Interview</button>
          </div>
        ) : (
          <>
            <div className="history-list fade-up">
              {interviews.map(iv => (
                <div key={iv._id} className="history-item"
                  onClick={() => iv.status === 'completed' && navigate(`/results/${iv._id}`)}>
                  <div className="hi-left">
                    <div className="hi-role">{iv.role}</div>
                    <div className="hi-meta">
                      {diffBadge(iv.difficulty)}
                      {statusBadge(iv.status)}
                      <span className="hi-date">
                        {new Date(iv.startedAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                      </span>
                      <span style={{ color:'var(--text3)', fontSize:13 }}>{iv.totalQuestions} questions</span>
                    </div>
                  </div>
                  <div className="hi-right">
                    {iv.status === 'completed' && iv.finalReport?.overallScore != null && (
                      <div className="hi-score">{iv.finalReport.overallScore}%</div>
                    )}
                    <button className="btn btn-danger btn-sm"
                      onClick={e => handleDelete(e, iv._id)}
                      disabled={deleting === iv._id}>
                      {deleting === iv._id ? '…' : '🗑'}
                    </button>
                    {iv.status === 'completed' && <span style={{ color:'var(--text3)' }}>→</span>}
                  </div>
                </div>
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="pagination fade-up">
                <button className="btn btn-secondary btn-sm"
                  disabled={pagination.page <= 1}
                  onClick={() => load(pagination.page - 1)}>← Prev</button>
                <span style={{ color:'var(--text2)', fontSize:14 }}>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button className="btn btn-secondary btn-sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => load(pagination.page + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
