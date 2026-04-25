import { useState, useEffect } from 'react';
import API from '../api/client';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

export default function StudentPortal() {
  const [student, setStudent] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [learningPath, setLearningPath] = useState('');
  const [loadingPath, setLoadingPath] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('student');
    if (!stored) { window.location.href = '/login'; return; }
    const s = JSON.parse(stored);
    setStudent(s);
    API.get(`/students/${s.id}/dashboard`).then(r => setDashboard(r.data)).catch(() => {});
    API.get(`/sharing/student/${s.id}`).then(r => setAssignments(r.data)).catch(() => {});
  }, []);

  const genPath = async () => {
    setLoadingPath(true);
    try { const { data } = await API.post(`/students/${student.id}/learning-path`); setLearningPath(data.path); } catch { toast.error('Failed'); }
    setLoadingPath(false);
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

      {dashboard && (
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

      <hr className="section-divider" />

      <div className="section">
        <h3 className="section-title">🎯 Personalized Learning Path</h3>
        <button className="btn btn-primary" onClick={genPath} disabled={loadingPath}>
          {loadingPath ? '⏳ Generating...' : '🧠 Generate Learning Path'}
        </button>
        {learningPath && <div className="card markdown-content" style={{ marginTop: '1rem' }}><ReactMarkdown>{learningPath}</ReactMarkdown></div>}
      </div>

      {assignments.length > 0 && (
        <div className="section">
          <h3 className="section-title">📎 Assignments</h3>
          {assignments.map((a, i) => (
            <div key={i} className="card markdown-content" style={{ marginBottom: '0.5rem' }}>
              <div className="badge badge-blue" style={{ marginBottom: '0.5rem' }}>{a.content_type?.replace('_', ' ')}</div>
              <ReactMarkdown>{a.content_data?.content || ''}</ReactMarkdown>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
