import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/shared/Navbar';
import api from '../services/api';
import './Results.css';

const Ring = ({ score, size = 100 }) => {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease', transform:'rotate(-90deg)', transformOrigin:'50% 50%' }} />
      </svg>
      <div className="score-ring-text">
        <span style={{ fontSize: size*0.22, fontFamily:'Syne,sans-serif', fontWeight:800, color }}>{score}</span>
        <span style={{ fontSize: size*0.12, color:'var(--text3)' }}>%</span>
      </div>
    </div>
  );
};

const ScoreBar = ({ label, value }) => {
  const pct = (value / 10) * 100;
  const color = value >= 7 ? 'var(--success)' : value >= 4 ? 'var(--warning)' : 'var(--danger)';
  return (
    <div className="score-bar-item">
      <div className="score-bar-header">
        <span>{label}</span>
        <span style={{ color, fontFamily:'Syne,sans-serif', fontWeight:700 }}>{value}/10</span>
      </div>
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width:`${pct}%`, background: color }} />
      </div>
    </div>
  );
};

export default function Results() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [iv, setIv]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get(`/interview/result/${id}`)
      .then(r => setIv(r.data.interview))
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <div className="page-center"><div className="spinner" /></div>;
  if (!iv) return null;

  const report = iv.finalReport;
  const avgScores = iv.qaHistory.reduce((acc, q) => {
    if (!q.scores) return acc;
    acc.technical     += q.scores.technical;
    acc.communication += q.scores.communication;
    acc.confidence    += q.scores.confidence;
    acc.count++;
    return acc;
  }, { technical:0, communication:0, confidence:0, count:0 });
  const n = avgScores.count || 1;

  return (
    <div className="results-page">
      <Navbar />
      <div className="container">
        <div className="results-header fade-up">
          <div>
            <h1>Interview Complete 🎉</h1>
            <p style={{ color:'var(--text2)' }}>{iv.role} · {iv.difficulty} · {iv.totalQuestions} questions</p>
          </div>
          <div className="results-actions">
            <Link to="/setup" className="btn btn-primary">New Interview</Link>
            <Link to="/history" className="btn btn-secondary">View History</Link>
          </div>
        </div>

        <div className="results-top fade-up">
          {/* Overall score */}
          <div className="card overall-card">
            <h3>Overall Score</h3>
            <Ring score={report?.overallScore ?? 0} size={140} />
            <p style={{ color:'var(--text2)', fontSize:14, marginTop:8, textAlign:'center' }}>{report?.summary}</p>
          </div>

          {/* Skill breakdown */}
          <div className="card breakdown-card">
            <h3>Skill Breakdown</h3>
            <div className="score-bars">
              <ScoreBar label="Technical Accuracy"    value={Math.round(avgScores.technical/n)} />
              <ScoreBar label="Communication Clarity" value={Math.round(avgScores.communication/n)} />
              <ScoreBar label="Confidence & Depth"    value={Math.round(avgScores.confidence/n)} />
            </div>
          </div>
        </div>

        <div className="results-mid fade-up">
          {[
            { title:'💪 Strengths',       items: report?.strengths,   cls:'green' },
            { title:'📈 Areas to Improve', items: report?.weaknesses,  cls:'yellow' },
            { title:'💡 Suggestions',      items: report?.suggestions, cls:'blue' },
          ].map(({ title, items, cls }) => (
            <div key={title} className="card insight-card">
              <h3>{title}</h3>
              <ul className={`insight-list insight-${cls}`}>
                {(items || []).map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>

        <div className="card fade-up">
          <h3 style={{ marginBottom:16 }}>Question-by-Question Review</h3>
          <div className="qa-list">
            {iv.qaHistory.map((qa, i) => (
              <div key={i} className={`qa-item ${expanded === i ? 'expanded' : ''}`}>
                <div className="qa-header" onClick={() => setExpanded(expanded === i ? null : i)}>
                  <div className="qa-left">
                    <span className="qa-num">Q{qa.questionNumber}</span>
                    <span className="qa-q">{qa.question}</span>
                  </div>
                  <div className="qa-right">
                    <span className="qa-score" style={{ color: qa.scores.overall >= 7 ? 'var(--success)' : qa.scores.overall >= 4 ? 'var(--warning)' : 'var(--danger)' }}>
                      {qa.scores.overall}/10
                    </span>
                    <span className="qa-chevron">{expanded === i ? '▲' : '▼'}</span>
                  </div>
                </div>
                {expanded === i && (
                  <div className="qa-body">
                    <div className="qa-section">
                      <div className="qa-section-label">Your Answer</div>
                      <p>{qa.answer || <em style={{color:'var(--text3)'}}>No answer provided</em>}</p>
                    </div>
                    <div className="qa-section">
                      <div className="qa-section-label">AI Feedback</div>
                      <p>{qa.feedback}</p>
                    </div>
                    <div className="qa-mini-scores">
                      {['technical','communication','confidence'].map(k => (
                        <div key={k} className="qa-mini-score">
                          <span>{qa.scores[k]}/10</span>
                          <span>{k}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
