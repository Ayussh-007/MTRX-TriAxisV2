import { useState, useEffect } from 'react';
import API from '../api/client';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

export default function StudentPortal() {
  const [student, setStudent] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [pendingQuizzes, setPendingQuizzes] = useState([]);
  const [learningPath, setLearningPath] = useState('');
  const [loadingPath, setLoadingPath] = useState(false);

  // Quiz-taking state
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const refreshData = () => {
    const stored = localStorage.getItem('student');
    if (!stored) { window.location.href = '/login'; return; }
    const s = JSON.parse(stored);
    setStudent(s);
    API.get(`/students/${s.id}/dashboard`).then(r => setDashboard(r.data)).catch(() => {});
    API.get(`/quiz/pending/${s.id}`).then(r => setPendingQuizzes(r.data)).catch(() => {});
  };

  useEffect(() => { refreshData(); }, []);

  const genPath = async () => {
    setLoadingPath(true);
    try { const { data } = await API.post(`/students/${student.id}/learning-path`); setLearningPath(data.path); } catch { toast.error('Failed'); }
    setLoadingPath(false);
  };

  const startQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setQuizAnswers({});
    setQuizResult(null);
  };

  const submitQuiz = async () => {
    if (!activeQuiz || !student) return;
    setSubmitting(true);
    try {
      const { data } = await API.post('/quiz/evaluate', {
        student_id: student.id,
        quiz_data: activeQuiz.quiz_data,
        answers: quizAnswers,
      });
      setQuizResult(data);
      toast.success(`Score: ${data.percentage}%`);
      // Refresh pending list
      API.get(`/quiz/pending/${student.id}`).then(r => setPendingQuizzes(r.data)).catch(() => {});
      // Refresh dashboard
      API.get(`/students/${student.id}/dashboard`).then(r => setDashboard(r.data)).catch(() => {});
    } catch { toast.error('Failed to submit'); }
    setSubmitting(false);
  };

  const closeQuiz = () => {
    setActiveQuiz(null);
    setQuizAnswers({});
    setQuizResult(null);
  };

  const logout = () => { localStorage.removeItem('student'); window.location.href = '/login'; };

  if (!student) return null;

  return (
    <div>
      <div className="page-header">
        <h2>🎒 Student Portal</h2>
        <p>Welcome back, <strong>{student.name}</strong></p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button className="btn btn-secondary btn-sm" onClick={logout}>🚪 Logout</button>
      </div>

      {/* Active Quiz Modal-like */}
      {activeQuiz && (
        <div className="card" style={{ marginBottom: '2rem', border: '2px solid var(--primary)', borderRadius: 16, padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>📝 {activeQuiz.topic} Quiz</h3>
            <button className="btn btn-secondary btn-sm" onClick={closeQuiz}>✕ Close</button>
          </div>

          {activeQuiz.quiz_data.questions.map((q, qi) => (
            <div key={qi} className="card" style={{ marginBottom: '0.8rem', borderLeft: quizResult ? (quizResult.results[qi]?.is_correct ? '3px solid #22C55E' : '3px solid #EF4444') : '3px solid var(--border)' }}>
              <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Q{qi + 1}. {q.question}</p>
              {Object.entries(q.options).map(([key, val]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0', cursor: quizResult ? 'default' : 'pointer', fontSize: '0.88rem' }}>
                  <input type="radio" name={`sq${qi}`} value={key} checked={quizAnswers[qi] === key}
                    onChange={() => !quizResult && setQuizAnswers(prev => ({ ...prev, [qi]: key }))}
                    disabled={!!quizResult}
                    style={{ accentColor: 'var(--primary)' }} />
                  <strong>{key}.</strong> {val}
                </label>
              ))}
              {quizResult && quizResult.results[qi] && (
                <div style={{ marginTop: '0.5rem', padding: '0.5rem', borderRadius: 8, background: quizResult.results[qi].is_correct ? '#F0FDF4' : '#FEF2F2', fontSize: '0.85rem' }}>
                  {quizResult.results[qi].is_correct ? '✅ Correct!' : `❌ Wrong — Answer: ${quizResult.results[qi].correct_answer}`}
                  {q.explanation && <div style={{ fontSize: '0.78rem', color: '#4B5563', marginTop: '0.3rem' }}>💡 {q.explanation}</div>}
                </div>
              )}
            </div>
          ))}

          {!quizResult ? (
            <button className="btn btn-primary btn-block" onClick={submitQuiz} disabled={submitting}>
              {submitting ? '⏳ Submitting...' : '✅ Submit Answers'}
            </button>
          ) : (
            <div className="card" style={{ borderLeft: `4px solid ${quizResult.percentage >= 60 ? '#22C55E' : '#EF4444'}`, background: quizResult.percentage >= 60 ? '#F0FDF4' : '#FEF2F2' }}>
              <h3>🏆 Score: {quizResult.score}/{quizResult.max_score} ({quizResult.percentage}%)</h3>
              <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', margin: 0 }}>
                {quizResult.percentage >= 80 ? '🌟 Excellent work!' : quizResult.percentage >= 60 ? '👍 Good job, keep going!' : '📚 Review the weak areas and try again.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pending Quizzes */}
      {!activeQuiz && pendingQuizzes.length > 0 && (
        <div className="section">
          <h3 className="section-title">📋 Pending Quizzes ({pendingQuizzes.length})</h3>
          <div className="card-grid">
            {pendingQuizzes.map(q => (
              <div key={q.share_id} className="card" style={{ borderTop: '3px solid var(--accent)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>📝 {q.topic}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{q.questions_count} questions</div>
                  </div>
                  <span className="badge badge-yellow">Pending</span>
                </div>
                <button className="btn btn-primary btn-sm btn-block" onClick={() => startQuiz(q)}>
                  ▶️ Start Quiz
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!activeQuiz && pendingQuizzes.length === 0 && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
          ✅ No pending quizzes — you're all caught up!
        </div>
      )}

      {/* Dashboard Metrics */}
      {!activeQuiz && dashboard && (
        <>
          <div className="metric-row">
            <div className="metric-card"><div className="label">📈 Score</div><div className="value">{dashboard.overall_score}%</div></div>
            <div className="metric-card"><div className="label">📅 Attendance</div><div className="value">{dashboard.attendance_rate}%</div></div>
            <div className="metric-card"><div className="label">⚠️ Weak Topics</div><div className="value">{dashboard.weak_topics.length}</div></div>
            <div className="metric-card"><div className="label">✅ Strong Topics</div><div className="value">{dashboard.strong_topics.length}</div></div>
          </div>

          {Object.keys(dashboard.topic_scores).length > 0 && (
            <div className="section">
              <h3 className="section-title">📊 My Topic Scores</h3>
              {Object.entries(dashboard.topic_scores).sort((a, b) => a[1] - b[1]).map(([topic, score]) => {
                const color = score >= 70 ? '#22C55E' : score >= 50 ? '#FF9800' : '#EF4444';
                return (
                  <div key={topic} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                    <div style={{ minWidth: 160, fontWeight: 600, fontSize: '0.82rem' }}>{score >= 70 ? '✅' : score >= 50 ? '⚠️' : '❌'} {topic}</div>
                    <div className="progress-bar" style={{ flex: 1 }}>
                      <div className="progress-fill" style={{ width: `${score}%`, background: color }} />
                    </div>
                    <strong style={{ color, minWidth: 45, textAlign: 'right' }}>{score}%</strong>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {!activeQuiz && (
        <>
          <hr className="section-divider" />
          <div className="section">
            <h3 className="section-title">🎯 Personalized Learning Path</h3>
            <button className="btn btn-primary" onClick={genPath} disabled={loadingPath}>
              {loadingPath ? '⏳ Generating...' : '🧠 Generate Learning Path'}
            </button>
            {learningPath && <div className="card markdown-content" style={{ marginTop: '1rem' }}><ReactMarkdown>{learningPath}</ReactMarkdown></div>}
          </div>
        </>
      )}
    </div>
  );
}
