import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Interview.css';

export default function Interview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [state, setState] = useState({
    question: '', questionNumber: 1, totalQuestions: 0,
    isLastQuestion: false, loading: true, submitting: false,
    feedback: null, scores: null, followUp: '', showFeedback: false,
    error: '', answer: '', progress: 0
  });

  const textareaRef = useRef();

  // Restore interview if page refreshed mid-session
  useEffect(() => {
    api.get(`/interview/result/${id}`)
      .then(r => {
        const iv = r.data.interview;
        if (iv.status === 'completed') { navigate(`/results/${id}`, { replace: true }); return; }
        const idx = iv.currentQuestionIndex;
        const qa  = iv.qaHistory[idx];
        setState(s => ({
          ...s,
          question: qa.question,
          questionNumber: idx + 1,
          totalQuestions: iv.totalQuestions,
          isLastQuestion: idx + 1 >= iv.totalQuestions,
          progress: Math.round((idx / iv.totalQuestions) * 100),
          loading: false
        }));
      })
      .catch(() => setState(s => ({ ...s, loading: false, error: 'Failed to load interview.' })));
  }, [id, navigate]);

  const submitAnswer = async () => {
    if (!state.answer.trim()) return;
    setState(s => ({ ...s, submitting: true, error: '' }));
    try {
      const { data } = await api.post('/interview/answer', { interviewId: id, answer: state.answer });
      if (data.isComplete) { navigate(`/results/${id}`); return; }
      setState(s => ({
        ...s, submitting: false, showFeedback: true,
        feedback: data.feedback, scores: data.scores,
        followUp: data.followUpQuestion,
        nextQuestion: data.nextQuestion,
        progress: Math.round((data.progress.current / data.progress.total) * 100)
      }));
    } catch (err) {
      setState(s => ({ ...s, submitting: false, error: err.response?.data?.message || 'Failed to submit. Try again.' }));
    }
  };

  const nextQuestion = () => {
    setState(s => ({
      ...s,
      question: s.nextQuestion.question,
      questionNumber: s.nextQuestion.questionNumber,
      isLastQuestion: s.nextQuestion.isLastQuestion,
      answer: '', feedback: null, scores: null, followUp: '', showFeedback: false,
    }));
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const { question, questionNumber, totalQuestions, isLastQuestion,
    loading, submitting, feedback, scores, followUp, showFeedback,
    error, answer, progress } = state;

  if (loading) return (
    <div className="page-center">
      <div style={{ textAlign:'center' }}>
        <div className="spinner" style={{ margin:'0 auto 16px' }} />
        <p style={{ color:'var(--text2)' }}>Loading your interview…</p>
      </div>
    </div>
  );

  if (error && !question) return (
    <div className="page-center">
      <div style={{ textAlign:'center' }}>
        <p style={{ color:'var(--danger)', marginBottom:16 }}>{error}</p>
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>Go Home</button>
      </div>
    </div>
  );

  const scoreColor = v => v >= 7 ? 'var(--success)' : v >= 4 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div className="interview-page">
      {/* Progress bar */}
      <div className="progress-bar-wrap">
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-label">
          Question {questionNumber} of {totalQuestions}
        </div>
      </div>

      <div className="interview-container">
        {/* Question card */}
        <div className={`question-card fade-up ${showFeedback ? 'dimmed' : ''}`}>
          <div className="q-meta">
            <span className="q-number">Q{questionNumber}</span>
            {isLastQuestion && <span className="badge badge-yellow">Final Question</span>}
          </div>
          <p className="question-text">{question}</p>
        </div>

        {/* Answer area */}
        {!showFeedback && (
          <div className="answer-section fade-up">
            <label className="form-label">Your Answer</label>
            <textarea
              ref={textareaRef}
              className="form-input answer-textarea"
              placeholder="Type your answer here. Be as detailed as you'd like — treat this like a real interview…"
              value={answer}
              onChange={e => setState(s => ({ ...s, answer: e.target.value }))}
              onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') submitAnswer(); }}
            />
            <div className="answer-footer">
              <span className="hint">Ctrl + Enter to submit</span>
              {error && <span style={{ color:'var(--danger)', fontSize:13 }}>{error}</span>}
              <button className="btn btn-primary"
                onClick={submitAnswer}
                disabled={submitting || !answer.trim()}>
                {submitting ? (
                  <><div className="spinner" style={{ width:16, height:16, borderWidth:2 }} /> Evaluating…</>
                ) : isLastQuestion ? '✓ Submit & Finish' : 'Submit Answer →'}
              </button>
            </div>
          </div>
        )}

        {/* Feedback card */}
        {showFeedback && feedback && (
          <div className="feedback-card fade-up">
            <div className="feedback-header">
              <h3>📊 AI Feedback</h3>
              <div className="scores-row">
                {[
                  { label:'Technical',    value: scores?.technical },
                  { label:'Communication',value: scores?.communication },
                  { label:'Confidence',   value: scores?.confidence },
                  { label:'Overall',      value: scores?.overall, bold: true },
                ].map(s => (
                  <div key={s.label} className={`score-item ${s.bold ? 'score-overall' : ''}`}>
                    <div className="score-num" style={{ color: scoreColor(s.value) }}>{s.value}<span>/10</span></div>
                    <div className="score-lbl">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <p className="feedback-text">{feedback}</p>
            {followUp && (
              <div className="followup-box">
                <div className="followup-label">💬 Follow-up to consider</div>
                <p>{followUp}</p>
              </div>
            )}
            <div style={{ textAlign:'right' }}>
              <button className="btn btn-primary" onClick={nextQuestion}>
                Next Question →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
