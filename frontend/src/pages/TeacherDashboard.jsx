import { useState, useEffect } from 'react';
import API from '../api/client';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

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
    API.get('/teacher/performance').then(r => setPerf(r.data));
    API.get('/teacher/risk-heatmap').then(r => setRisk(r.data));
    API.get('/teacher/weather').then(r => setWeather(r.data));
    API.get('/teacher/weak-topics').then(r => setWeakTopics(r.data));
    API.get('/quiz/trends').then(r => setTrends(r.data));
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
  const trendColor = (t) => t === 'improving' ? '#22C55E' : t === 'declining' ? '#EF4444' : '#F59E0B';
  const trendIcon = (t) => t === 'improving' ? '📈' : t === 'declining' ? '📉' : '➡️';
  const scoreBarColor = (val) => val >= 70 ? '#22C55E' : val >= 50 ? '#FB923C' : '#EF4444';

  return (
    <div>
      <div className="page-header">
        <h2>👩‍🏫 Teacher Dashboard</h2>
        <p>Class analytics, quiz trends, and AI-powered teaching suggestions.</p>
      </div>

      {/* Tabs */}
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

      {/* ──── OVERVIEW TAB ──── */}
      {activeTab === 'overview' && (
        <>
          {weather && (
            <div className={`alert ${weather.is_bad ? 'alert-danger' : 'alert-info'}`}>
              {weather.is_bad ? '⚠️ Bad Weather Alert: ' : '☀️ '}{weather.summary}
            </div>
          )}

          {perf && (
            <div className="metric-row">
              <div className="metric-card"><div className="label">👥 Students</div><div className="value">{perf.num_students}</div></div>
              <div className="metric-card"><div className="label">📈 Class Avg</div><div className="value">{perf.class_avg}%</div></div>
              <div className="metric-card"><div className="label">📅 Avg Attendance</div><div className="value">{perf.avg_attendance}%</div></div>
              <div className="metric-card"><div className="label">⚠️ Weak Topics</div><div className="value">{weakTopics.length}</div></div>
              <div className="metric-card"><div className="label">📝 Quizzes Given</div><div className="value">{trends?.quizzes_over_time?.length || 0}</div></div>
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
                      const studentTrend = trends?.student_trends?.find(t => t.id === s.id);
                      return (
                        <tr key={s.id}>
                          <td>{s.id}</td>
                          <td><strong>{s.name}</strong></td>
                          <td style={{ color: s.overall_score >= 70 ? '#22C55E' : s.overall_score >= 50 ? '#FF9800' : '#EF4444' }}>{s.overall_score}%</td>
                          <td style={{ color: s.attendance_rate >= 75 ? '#22C55E' : '#FF9800' }}>{s.attendance_rate}%</td>
                          <td>
                            {studentTrend ? (
                              <span style={{ color: trendColor(studentTrend.trend), fontWeight: 600, fontSize: '0.82rem' }}>
                                {trendIcon(studentTrend.trend)} {studentTrend.trend}
                              </span>
                            ) : '-'}
                          </td>
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

      {/* ──── QUIZ TRENDS TAB ──── */}
      {activeTab === 'trends' && trends && (
        <>
          {/* Quizzes Over Time */}
          {trends.quizzes_over_time.length > 0 ? (
            <>
              <div className="section">
                <h3 className="section-title">📈 Quiz Scores Over Time</h3>
                <div className="card" style={{ padding: '1rem' }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trends.quizzes_over_time}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="topic" tick={{ fontSize: 12 }} interval={0} angle={-30} textAnchor="end" height={60} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(val) => `${val}%`} labelStyle={{ fontWeight: 700 }} contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB' }} />
                      <Line type="monotone" dataKey="class_avg" name="Class Average" stroke="#22B07D" strokeWidth={3} dot={{ r: 5, fill: '#22B07D' }} activeDot={{ r: 7 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quiz Details Table */}
              <div className="section">
                <h3 className="section-title">📋 Quiz History</h3>
                <div className="table-container">
                  <table className="data-table">
                    <thead><tr><th>Topic</th><th>Class Avg</th><th>Students</th><th>Date</th></tr></thead>
                    <tbody>
                      {trends.quizzes_over_time.map((q, i) => (
                        <tr key={i}>
                          <td><strong>{q.topic}</strong></td>
                          <td style={{ color: scoreBarColor(q.class_avg), fontWeight: 700 }}>{q.class_avg}%</td>
                          <td>{q.students_attempted}</td>
                          <td style={{ color: '#6B7280', fontSize: '0.82rem' }}>{q.date?.split('T')[0] || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="alert alert-info">No quizzes recorded yet. Generate and evaluate a quiz to see trends.</div>
          )}

          {/* Topic Performance Bar Chart */}
          {Object.keys(trends.topic_averages).length > 0 && (
            <div className="section">
              <h3 className="section-title">📊 Topic-Wise Performance</h3>
              <div className="card" style={{ padding: '1rem' }}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(trends.topic_averages).map(([topic, d]) => ({ topic, average: d.average, attempts: d.attempts }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="topic" tick={{ fontSize: 12 }} interval={0} angle={-25} textAnchor="end" height={70} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(val, name) => name === 'average' ? `${val}%` : val} contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB' }} />
                    <Bar dataKey="average" name="Average Score" radius={[6, 6, 0, 0]}>
                      {Object.entries(trends.topic_averages).map(([topic, d], i) => (
                        <Cell key={i} fill={scoreBarColor(d.average)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Student Trends */}
          {trends.student_trends.length > 0 && (
            <div className="section">
              <h3 className="section-title">👥 Per-Student Trends</h3>
              <div className="card-grid">
                {trends.student_trends.map(s => (
                  <div key={s.id} className="card" style={{ borderTop: `3px solid ${trendColor(s.trend)}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <strong>{s.name}</strong>
                      <span className="badge" style={{ background: `${trendColor(s.trend)}15`, color: trendColor(s.trend) }}>
                        {trendIcon(s.trend)} {s.trend}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#4B5563', marginBottom: '0.4rem' }}>
                      Overall: <strong>{s.overall}%</strong> · {s.recent_scores.length} quizzes
                    </div>
                    {/* Mini sparkline of recent scores */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 32 }}>
                      {s.recent_scores.map((sc, i) => {
                        const h = Math.max(4, (sc.percentage / 100) * 30);
                        return (
                          <div key={i} title={`${sc.topic}: ${sc.percentage}%`}
                            style={{ width: 12, height: h, background: scoreBarColor(sc.percentage), borderRadius: '3px 3px 0 0', transition: 'all 0.3s' }} />
                        );
                      })}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#9CA3AF', marginTop: '0.3rem' }}>
                      {s.recent_scores.map(sc => sc.topic).slice(-3).join(' → ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ──── RISK & WEAK TOPICS TAB ──── */}
      {activeTab === 'risk' && (
        <>
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
        </>
      )}

      {/* ──── AI SUGGESTIONS TAB ──── */}
      {activeTab === 'ai' && (
        <div className="section">
          <h3 className="section-title">🧠 AI Teaching Suggestions</h3>
          <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            AI analyses class performance, weather conditions, and teaching preferences to generate tailored advice.
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
