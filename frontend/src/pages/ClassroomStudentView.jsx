import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

export default function ClassroomStudentView() {
  const { classroomId } = useParams();
  const { user } = useAuth();
  const [classroom, setClassroom] = useState(null);
  const [pendingQuizzes, setPendingQuizzes] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [learningPath, setLearningPath] = useState('');
  const [loadingPath, setLoadingPath] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    API.get(`/classrooms/${classroomId}`).then(r => setClassroom(r.data.classroom)).catch(() => {});
    API.get(`/students/${user.id}/dashboard`).then(r => setDashboard(r.data)).catch(() => {});
    API.get(`/quiz/pending/${user.id}`).then(r => setPendingQuizzes(r.data)).catch(() => {});
  }, [classroomId, user]);

  const genPath = async () => {
    setLoadingPath(true);
    try { const { data } = await API.post(`/students/${user.id}/learning-path`); setLearningPath(data.path); } catch { toast.error('Failed'); }
    setLoadingPath(false);
  };

  const startQuiz = (quiz) => { setActiveQuiz(quiz); setQuizAnswers({}); setQuizResult(null); };
  const closeQuiz = () => { setActiveQuiz(null); setQuizAnswers({}); setQuizResult(null); };

  const submitQuiz = async () => {
    if (!activeQuiz || !user) return;
    setSubmitting(true);
    try {
      const { data } = await API.post('/quiz/evaluate', { student_id: user.id, quiz_data: activeQuiz.quiz_data, answers: quizAnswers });
      setQuizResult(data);
      toast.success(`Score: ${data.percentage}%`);
      API.get(`/quiz/pending/${user.id}`).then(r => setPendingQuizzes(r.data)).catch(() => {});
      API.get(`/students/${user.id}/dashboard`).then(r => setDashboard(r.data)).catch(() => {});
    } catch { toast.error('Failed to submit'); }
    setSubmitting(false);
  };

  if (!classroom || !user) return null;

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem',
      }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
            🏫 {classroom.name}
          </h1>
          {classroom.subject && (
            <span style={{
              padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 600,
              background: 'rgba(99,102,241,0.1)', color: '#6366F1', border: '1px solid rgba(99,102,241,0.2)',
              display: 'inline-block', marginTop: '0.3rem',
            }}>{classroom.subject}</span>
          )}
        </div>
      </div>

      {/* Metrics */}
      {dashboard && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.8rem', marginBottom: '1.5rem',
        }}>
          {[
            { label: 'Score', value: `${dashboard.overall_score}%`, icon: '📈', color: '#34D399' },
            { label: 'Attendance', value: `${dashboard.attendance_rate}%`, icon: '📅', color: '#60A5FA' },
            { label: 'Weak Topics', value: dashboard.weak_topics.length, icon: '⚠️', color: '#FB923C' },
            { label: 'Strong Topics', value: dashboard.strong_topics.length, icon: '✅', color: '#22C55E' },
          ].map((m, i) => (
            <div key={i} style={{
              padding: '1rem', borderRadius: 'var(--radius-md)',
              background: 'var(--glass)', border: '1px solid var(--glass-border)',
            }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{m.icon} {m.label}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: m.color, marginTop: '0.2rem' }}>{m.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Active Quiz */}
      {activeQuiz && (
        <div style={{
          padding: '1.5rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-lg)',
          background: 'var(--glass)', border: '1px solid rgba(34,211,153,0.2)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ color: 'var(--text)', margin: 0, fontSize: '1rem' }}>📝 {activeQuiz.topic} Quiz</h3>
            <button className="btn btn-secondary btn-sm" onClick={closeQuiz}>✕ Close</button>
          </div>

          {activeQuiz.quiz_data.questions.map((q, qi) => (
            <div key={qi} style={{
              marginBottom: '0.8rem', padding: '1rem', borderRadius: 'var(--radius-md)',
              background: 'var(--glass)', border: '1px solid var(--glass-border)',
              borderLeft: quizResult ? (quizResult.results[qi]?.is_correct ? '3px solid #34D399' : '3px solid #F87171') : '3px solid var(--glass-border)',
            }}>
              <p style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text)' }}>Q{qi + 1}. {q.question}</p>
              {Object.entries(q.options).map(([key, val]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0', cursor: quizResult ? 'default' : 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <input type="radio" name={`sq${qi}`} value={key} checked={quizAnswers[qi] === key}
                    onChange={() => !quizResult && setQuizAnswers(prev => ({ ...prev, [qi]: key }))} disabled={!!quizResult} />
                  <strong style={{ color: 'var(--text-muted)' }}>{key}.</strong> {val}
                </label>
              ))}
              {quizResult && quizResult.results[qi] && (
                <div style={{ marginTop: '0.5rem', padding: '0.4rem 0.7rem', borderRadius: 8, background: quizResult.results[qi].is_correct ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)', fontSize: '0.82rem', color: quizResult.results[qi].is_correct ? '#34D399' : '#F87171' }}>
                  {quizResult.results[qi].is_correct ? '✅ Correct!' : `❌ Wrong — Answer: ${quizResult.results[qi].correct_answer}`}
                </div>
              )}
            </div>
          ))}

          {!quizResult ? (
            <button className="btn btn-primary btn-block" onClick={submitQuiz} disabled={submitting}>
              {submitting ? '⏳ Submitting...' : '✅ Submit Answers'}
            </button>
          ) : (
            <div style={{
              padding: '1rem', borderRadius: 'var(--radius-md)',
              borderLeft: `3px solid ${quizResult.percentage >= 60 ? '#34D399' : '#F87171'}`,
              background: quizResult.percentage >= 60 ? 'rgba(52,211,153,0.06)' : 'rgba(248,113,113,0.06)',
            }}>
              <h3 style={{ color: quizResult.percentage >= 60 ? '#34D399' : '#F87171', margin: 0 }}>🏆 Score: {quizResult.score}/{quizResult.max_score} ({quizResult.percentage}%)</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.3rem 0 0' }}>
                {quizResult.percentage >= 80 ? '🌟 Excellent work!' : quizResult.percentage >= 60 ? '👍 Good job!' : '📚 Review the weak areas.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pending Quizzes */}
      {!activeQuiz && pendingQuizzes.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.6rem' }}>
            📋 Pending Quizzes ({pendingQuizzes.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.8rem' }}>
            {pendingQuizzes.map(q => (
              <div key={q.share_id} style={{
                padding: '1rem', borderRadius: 'var(--radius-md)',
                background: 'var(--glass)', border: '1px solid var(--glass-border)',
                borderTop: '2px solid #6366F1',
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>📝 {q.topic}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{q.questions_count} questions</div>
                <button className="btn btn-primary btn-sm btn-block" onClick={() => startQuiz(q)}>▶️ Start Quiz</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!activeQuiz && pendingQuizzes.length === 0 && (
        <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(34,211,153,0.06)', border: '1px solid rgba(34,211,153,0.12)', color: '#34D399', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          ✅ No pending quizzes — you're all caught up!
        </div>
      )}

      {/* Topic Scores */}
      {!activeQuiz && dashboard && Object.keys(dashboard.topic_scores).length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.6rem' }}>📊 My Topic Scores</h3>
          {Object.entries(dashboard.topic_scores).sort((a, b) => a[1] - b[1]).map(([topic, score]) => {
            const color = score >= 70 ? '#34D399' : score >= 50 ? '#FB923C' : '#F87171';
            return (
              <div key={topic} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                <div style={{ minWidth: 140, fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{topic}</div>
                <div className="progress-bar" style={{ flex: 1 }}>
                  <div className="progress-fill" style={{ width: `${score}%`, background: color }} />
                </div>
                <strong style={{ color, minWidth: 40, textAlign: 'right', fontSize: '0.82rem' }}>{score}%</strong>
              </div>
            );
          })}
        </div>
      )}

      {/* Learning Path */}
      {!activeQuiz && (
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.6rem' }}>🎯 Learning Path</h3>
          <button className="btn btn-primary" onClick={genPath} disabled={loadingPath}>
            {loadingPath ? '⏳ Generating...' : '🧠 Generate Learning Path'}
          </button>
          {learningPath && (
            <div style={{ marginTop: '1rem', padding: '1.2rem', borderRadius: 'var(--radius-md)', background: 'var(--glass)', border: '1px solid var(--glass-border)' }}>
              <ReactMarkdown>{learningPath}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
