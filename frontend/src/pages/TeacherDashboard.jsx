import { useState, useEffect } from 'react';
import API from '../api/client';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function TeacherDashboard() {
  const [perf, setPerf] = useState(null);
  const [risk, setRisk] = useState([]);
  const [weather, setWeather] = useState(null);
  const [weakTopics, setWeakTopics] = useState([]);
  const [suggestions, setSuggestions] = useState('');
  const [doubtSheet, setDoubtSheet] = useState('');
  const [loadingSugg, setLoadingSugg] = useState(false);
  const [loadingDoubt, setLoadingDoubt] = useState(false);
  const [trends, setTrends] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    API.get('/teacher/performance').then(r => setPerf(r.data)).catch(() => {});
    API.get('/teacher/risk-heatmap').then(r => setRisk(r.data)).catch(() => {});
    API.get('/teacher/weather').then(r => setWeather(r.data)).catch(() => {});
    API.get('/teacher/weak-topics').then(r => setWeakTopics(r.data)).catch(() => {});
    API.get('/quiz/trends').then(r => setTrends(r.data)).catch(() => {});
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

  const riskColor = (level) => ({ critical: '#F87171', high: '#FB923C', medium: '#FBBF24', low: '#34D399' }[level] || '#64748B');
  const trendColor = (t) => t === 'improving' ? '#34D399' : t === 'declining' ? '#F87171' : '#FBBF24';
  const trendIcon = (t) => t === 'improving' ? '📈' : t === 'declining' ? '📉' : '➡️';
  const scoreBarColor = (val) => val >= 70 ? '#34D399' : val >= 50 ? '#FB923C' : '#F87171';

  const chartTooltipStyle = { borderRadius: 10 };

  return (
    <div>
      <div className="page-header">
        <h2>👩‍🏫 Teacher Dashboard</h2>
        <p>Class analytics, quiz trends, and AI-powered teaching suggestions.</p>
      </div>

      <div className="tabs">
        {[
          { id: 'overview', label: '📊 Overview' },
          { id: 'trends', label: '📈 Quiz Trends' },
          { id: 'risk', label: '🔥 Risk & Weak Topics' },
          { id: 'ai', label: '🧠 AI Suggestions' },
        ].map(tab => (
          <button key={tab.id} className={`tab${activeTab === tab.id ? ' active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ──── OVERVIEW ──── */}
      {activeTab === 'overview' && (
        <>
          {weather && (
            <div className={`alert ${weather.is_bad ? 'alert-danger' : 'alert-info'}`}>
              {weather.is_bad ? '⚠️ Bad Weather: ' : '☀️ '}{weather.summary}
            </div>
          )}
          {perf && (
            <div className="metric-row">
              <div className="metric-card"><div className="label">👥 Students</div><div className="value">{perf.num_students}</div></div>
              <div className="metric-card"><div className="label">📈 Class Avg</div><div className="value">{perf.class_avg}%</div></div>
              <div className="metric-card"><div className="label">📅 Attendance</div><div className="value">{perf.avg_attendance}%</div></div>
              <div className="metric-card"><div className="label">⚠️ Weak Topics</div><div className="value">{weakTopics.length}</div></div>
              <div className="metric-card"><div className="label">📝 Quizzes</div><div className="value">{trends?.quizzes_over_time?.length || 0}</div></div>
            </div>
          )}
          {perf && perf.per_student.length > 0 && (
            <div className="section">
              <h3 className="section-title">👥 Student Performance</h3>
              <div className="table-container">
                <table className="data-table">
                  <thead><tr><th>ID</th><th>Name</th><th>Score</th><th>Attendance</th><th>Trend</th></tr></thead>
                  <tbody>
                    {perf.per_student.map(s => {
                      const st = trends?.student_trends?.find(t => t.id === s.id);
                      return (
                        <tr key={s.id}>
                          <td>{s.id}</td>
                          <td style={{ color: 'var(--text)' }}><strong>{s.name}</strong></td>
                          <td style={{ color: s.overall_score >= 70 ? '#34D399' : s.overall_score >= 50 ? '#FB923C' : '#F87171', fontWeight: 700 }}>{s.overall_score}%</td>
                          <td style={{ color: s.attendance_rate >= 75 ? '#34D399' : '#FB923C', fontWeight: 600 }}>{s.attendance_rate}%</td>
                          <td>{st ? <span style={{ color: trendColor(st.trend), fontWeight: 600, fontSize: '0.82rem' }}>{trendIcon(st.trend)} {st.trend}</span> : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ──── QUIZ TRENDS ──── */}
      {activeTab === 'trends' && trends && (
        <>
          {trends.quizzes_over_time.length > 0 ? (
            <>
              <div className="section">
                <h3 className="section-title">📈 Quiz Scores Over Time</h3>
                <div className="card" style={{ padding: '1.2rem' }}>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={trends.quizzes_over_time}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="topic" tick={{ fontSize: 11, fill: '#94A3B8' }} interval={0} angle={-25} textAnchor="end" height={60} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <Tooltip formatter={(v) => `${v}%`} contentStyle={chartTooltipStyle} />
                      <Line type="monotone" dataKey="class_avg" name="Class Avg" stroke="#34D399" strokeWidth={3} dot={{ r: 5, fill: '#34D399' }} activeDot={{ r: 7, fill: '#22B07D' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="section">
                <h3 className="section-title">📋 Quiz History</h3>
                <div className="table-container">
                  <table className="data-table">
                    <thead><tr><th>Topic</th><th>Class Avg</th><th>Students</th><th>Date</th></tr></thead>
                    <tbody>
                      {trends.quizzes_over_time.map((q, i) => (
                        <tr key={i}>
                          <td style={{ color: 'var(--text)' }}><strong>{q.topic}</strong></td>
                          <td style={{ color: scoreBarColor(q.class_avg), fontWeight: 700 }}>{q.class_avg}%</td>
                          <td>{q.students_attempted}</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{q.date?.split('T')[0] || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="alert alert-info">No quizzes recorded yet. Generate and share a quiz to see trends.</div>
          )}

          {Object.keys(trends.topic_averages).length > 0 && (
            <div className="section">
              <h3 className="section-title">📊 Topic Performance</h3>
              <div className="card" style={{ padding: '1.2rem' }}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={Object.entries(trends.topic_averages).map(([t, d]) => ({ topic: t, average: d.average }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="topic" tick={{ fontSize: 11, fill: '#94A3B8' }} interval={0} angle={-25} textAnchor="end" height={70} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => `${v}%`} />
                    <Bar dataKey="average" name="Avg Score" radius={[6, 6, 0, 0]}>
                      {Object.entries(trends.topic_averages).map(([, d], i) => (
                        <Cell key={i} fill={scoreBarColor(d.average)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {trends.student_trends.length > 0 && (
            <div className="section">
              <h3 className="section-title">👥 Per-Student Trends</h3>
              <div className="card-grid">
                {trends.student_trends.map(s => (
                  <div key={s.id} className="card" style={{ borderTop: `2px solid ${trendColor(s.trend)}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <strong style={{ color: 'var(--text)' }}>{s.name}</strong>
                      <span className="badge" style={{ background: `${trendColor(s.trend)}15`, color: trendColor(s.trend), border: `1px solid ${trendColor(s.trend)}30` }}>
                        {trendIcon(s.trend)} {s.trend}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      Overall: <strong style={{ color: 'var(--text)' }}>{s.overall}%</strong> · {s.recent_scores.length} quizzes
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 32 }}>
                      {s.recent_scores.map((sc, i) => (
                        <div key={i} title={`${sc.topic}: ${sc.percentage}%`}
                          style={{ width: 14, height: Math.max(4, (sc.percentage / 100) * 30), background: scoreBarColor(sc.percentage), borderRadius: '4px 4px 0 0', transition: 'all 0.3s', opacity: 0.85 }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ──── RISK & WEAK ──── */}
      {activeTab === 'risk' && (
        <>
          {risk.length > 0 && (
            <div className="section">
              <h3 className="section-title">🔥 Student Risk Levels</h3>
              <div className="card-grid">
                {risk.map(r => (
                  <div key={r.id} className="card" style={{ borderLeft: `3px solid ${riskColor(r.risk_level)}` }}>
                    <strong style={{ color: 'var(--text)' }}>{r.name}</strong><br />
                    <span className="badge" style={{ background: `${riskColor(r.risk_level)}12`, color: riskColor(r.risk_level), border: `1px solid ${riskColor(r.risk_level)}30`, marginTop: 4 }}>
                      {r.risk_level.toUpperCase()} · {r.risk_score}%
                    </span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>Score: {r.overall_score}% · Att: {r.attendance}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {weakTopics.length > 0 && (
            <div className="section">
              <h3 className="section-title">📝 Class Weak Topics</h3>
              {weakTopics.map((w, i) => {
                const c = w.class_avg < 30 ? '#F87171' : w.class_avg < 50 ? '#FB923C' : '#FBBF24';
                return (
                  <div key={i} className="card" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', padding: '0.6rem 1.1rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}><strong style={{ color: c }}>#{i + 1}</strong> {w.topic} <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>— {w.students_struggling}/{w.total_students} struggling</span></span>
                    <strong style={{ color: c }}>{w.class_avg}%</strong>
                  </div>
                );
              })}
              <button className="btn btn-primary" onClick={genDoubtSheet} disabled={loadingDoubt} style={{ marginTop: '0.5rem' }}>
                {loadingDoubt ? '⏳ Generating...' : '📋 Generate Doubt Sheet'}
              </button>
              {doubtSheet && <div className="card markdown-content" style={{ marginTop: '1rem' }}><ReactMarkdown>{doubtSheet}</ReactMarkdown></div>}
            </div>
          )}
        </>
      )}

      {/* ──── AI ──── */}
      {activeTab === 'ai' && (
        <div className="section">
          <h3 className="section-title">🧠 AI Teaching Suggestions</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            AI analyses class performance, weather, and preferences to generate tailored advice.
          </p>
          <button className="btn btn-primary" onClick={genSuggestions} disabled={loadingSugg}>
            {loadingSugg ? '⏳ Analyzing (30-60s)...' : '💡 Generate Suggestions'}
          </button>
          {suggestions && <div className="card markdown-content" style={{ marginTop: '1rem' }}><ReactMarkdown>{suggestions}</ReactMarkdown></div>}
        </div>
      )}
    </div>
  );
}
