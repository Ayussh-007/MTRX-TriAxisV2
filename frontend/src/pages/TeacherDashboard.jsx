import { useState, useEffect } from 'react';
import API from '../api/client';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

export default function TeacherDashboard() {
  const [perf, setPerf] = useState(null);
  const [risk, setRisk] = useState([]);
  const [weather, setWeather] = useState(null);
  const [weakTopics, setWeakTopics] = useState([]);
  const [suggestions, setSuggestions] = useState('');
  const [doubtSheet, setDoubtSheet] = useState('');
  const [loadingSugg, setLoadingSugg] = useState(false);
  const [loadingDoubt, setLoadingDoubt] = useState(false);

  useEffect(() => {
    API.get('/teacher/performance').then(r => setPerf(r.data));
    API.get('/teacher/risk-heatmap').then(r => setRisk(r.data));
    API.get('/teacher/weather').then(r => setWeather(r.data));
    API.get('/teacher/weak-topics').then(r => setWeakTopics(r.data));
  }, []);

  const genSuggestions = async () => {
    setLoadingSugg(true);
    try { const { data } = await API.post('/teacher/suggestions', { city: weather?.city }); setSuggestions(data.suggestions); } catch { toast.error('Failed'); }
    setLoadingSugg(false);
  };

  const genDoubtSheet = async () => {
    const topics = weakTopics.slice(0, 3).map(w => w.topic);
    if (!topics.length) return toast.error('No weak topics');
    setLoadingDoubt(true);
    try { const { data } = await API.post('/teacher/doubt-sheet', { topics }); setDoubtSheet(data.sheet); } catch { toast.error('Failed'); }
    setLoadingDoubt(false);
  };

  const riskColor = (level) => ({ critical: '#EF4444', high: '#FF9800', medium: '#FFC107', low: '#22C55E' }[level] || '#888');

  return (
    <div>
      <div className="page-header">
        <h2>👩‍🏫 Teacher Dashboard</h2>
        <p>Class analytics, feedback, and AI-powered teaching suggestions.</p>
      </div>

      {/* Weather Bar */}
      {weather && (
        <div className={`alert ${weather.is_bad ? 'alert-danger' : 'alert-info'}`}>
          {weather.is_bad ? '⚠️ Bad Weather Alert: ' : '☀️ '}{weather.summary}
        </div>
      )}

      {/* Class Overview */}
      {perf && (
        <div className="metric-row">
          <div className="metric-card"><div className="label">👥 Students</div><div className="value">{perf.num_students}</div></div>
          <div className="metric-card"><div className="label">📈 Class Avg</div><div className="value">{perf.class_avg}%</div></div>
          <div className="metric-card"><div className="label">📅 Avg Attendance</div><div className="value">{perf.avg_attendance}%</div></div>
          <div className="metric-card"><div className="label">⚠️ Weak Topics</div><div className="value">{weakTopics.length}</div></div>
        </div>
      )}

      {/* Risk Badges */}
      {risk.length > 0 && (
        <div className="section">
          <h3 className="section-title">🔥 Student Risk Levels</h3>
          <div className="card-grid">
            {risk.map(r => (
              <div key={r.id} className="card" style={{ borderLeft: `4px solid ${riskColor(r.risk_level)}`, padding: '0.6rem 1rem' }}>
                <strong>{r.name}</strong><br />
                <span className="badge" style={{ background: `${riskColor(r.risk_level)}15`, color: riskColor(r.risk_level), marginTop: 4 }}>
                  {r.risk_level.toUpperCase()} · {r.risk_score}%
                </span>
                <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 4 }}>
                  Score: {r.overall_score}% · Att: {r.attendance}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weak Topics */}
      {weakTopics.length > 0 && (
        <div className="section">
          <h3 className="section-title">📝 Class Weak Topics</h3>
          {weakTopics.map((w, i) => {
            const color = w.class_avg < 30 ? '#EF4444' : w.class_avg < 50 ? '#FF9800' : '#FFC107';
            return (
              <div key={i} className="card" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', padding: '0.5rem 1rem' }}>
                <span><strong style={{ color }}>#{i + 1}</strong> {w.topic} <span style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>— {w.students_struggling}/{w.total_students} struggling</span></span>
                <strong style={{ color }}>{w.class_avg}%</strong>
              </div>
            );
          })}
          <button className="btn btn-primary" onClick={genDoubtSheet} disabled={loadingDoubt} style={{ marginTop: '0.5rem' }}>
            {loadingDoubt ? '⏳ Generating...' : '📋 Generate Doubt Sheet'}
          </button>
          {doubtSheet && <div className="card markdown-content" style={{ marginTop: '1rem' }}><ReactMarkdown>{doubtSheet}</ReactMarkdown></div>}
        </div>
      )}

      <hr className="section-divider" />

      {/* AI Suggestions */}
      <div className="section">
        <h3 className="section-title">🧠 AI Teaching Suggestions</h3>
        <button className="btn btn-primary" onClick={genSuggestions} disabled={loadingSugg}>
          {loadingSugg ? '⏳ Analyzing...' : '💡 Generate Suggestions'}
        </button>
        {suggestions && <div className="card markdown-content" style={{ marginTop: '1rem' }}><ReactMarkdown>{suggestions}</ReactMarkdown></div>}
      </div>

      {/* Student Performance Table */}
      {perf && perf.per_student.length > 0 && (
        <div className="section">
          <h3 className="section-title">👥 Student Performance</h3>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>ID</th><th>Name</th><th>Score</th><th>Attendance</th></tr></thead>
              <tbody>
                {perf.per_student.map(s => (
                  <tr key={s.id}>
                    <td>{s.id}</td><td><strong>{s.name}</strong></td>
                    <td style={{ color: s.overall_score >= 70 ? '#22C55E' : s.overall_score >= 50 ? '#FF9800' : '#EF4444' }}>{s.overall_score}%</td>
                    <td style={{ color: s.attendance_rate >= 75 ? '#22C55E' : '#FF9800' }}>{s.attendance_rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
