import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api/client';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const SI = ({ children, size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
    {children}
  </svg>
);

const Ic = {
  teacher:    <SI size={20}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></SI>,
  overview:   <SI><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></SI>,
  trendUp:    <SI><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></SI>,
  fire:       <SI><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></SI>,
  brain:      <SI><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.14z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.14z"/></SI>,
  users:      <SI><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></SI>,
  bar:        <SI><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></SI>,
  calendar:   <SI><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></SI>,
  warn:       <SI><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></SI>,
  quiz:       <SI><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></SI>,
  sun:        <SI><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></SI>,
  clipboard:  <SI><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></SI>,
  light:      <SI><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><circle cx="12" cy="12" r="4"/></SI>,
  hourglass:  <SI><path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></SI>,
};

export default function TeacherDashboard() {
  const { classroomId } = useParams();
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
  const trendIcon = (t) => t === 'improving'
    ? <SI size={13}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></SI>
    : t === 'declining'
    ? <SI size={13}><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></SI>
    : <SI size={13}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></SI>;
  const scoreBarColor = (val) => val >= 70 ? '#34D399' : val >= 50 ? '#FB923C' : '#F87171';

  const chartTooltipStyle = { borderRadius: 10 };

  return (
    <div>
      <div className="page-header">
        <h2>{Ic.teacher} Teacher Dashboard</h2>
        <p>Class analytics, quiz trends, and AI-powered teaching suggestions.</p>
      </div>

      <div className="tabs">
        {[
          { id: 'overview', icon: Ic.overview,  label: 'Overview' },
          { id: 'trends',   icon: Ic.trendUp,   label: 'Quiz Trends' },
          { id: 'risk',     icon: Ic.fire,       label: 'Risk & Weak Topics' },
          { id: 'ai',       icon: Ic.brain,      label: 'AI Suggestions' },
        ].map(tab => (
          <button key={tab.id} className={`tab${activeTab === tab.id ? ' active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ──── OVERVIEW ──── */}
      {activeTab === 'overview' && (
        <>
          {weather && (
            <div className={`alert ${weather.is_bad ? 'alert-danger' : 'alert-info'}`}>
              {weather.is_bad ? <>{Ic.warn} Bad Weather: </> : <>{Ic.sun} </>}{weather.summary}
            </div>
          )}
          {perf && (
            <div className="metric-row">
              <div className="metric-card"><div className="label">{Ic.users} Students</div><div className="value">{perf.num_students}</div></div>
              <div className="metric-card"><div className="label">{Ic.bar} Class Avg</div><div className="value">{perf.class_avg}%</div></div>
              <div className="metric-card"><div className="label">{Ic.calendar} Attendance</div><div className="value">{perf.avg_attendance}%</div></div>
              <div className="metric-card"><div className="label">{Ic.warn} Weak Topics</div><div className="value">{weakTopics.length}</div></div>
              <div className="metric-card"><div className="label">{Ic.quiz} Quizzes</div><div className="value">{trends?.quizzes_over_time?.length || 0}</div></div>
            </div>
          )}
          {perf && perf.per_student.length > 0 && (
            <div className="section">
              <h3 className="section-title">{Ic.users} Student Performance</h3>
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
                <h3 className="section-title">{Ic.trendUp} Quiz Scores Over Time</h3>
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
                <h3 className="section-title">{Ic.clipboard} Quiz History</h3>
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
              <h3 className="section-title">{Ic.bar} Topic Performance</h3>
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
              <h3 className="section-title">{Ic.users} Per-Student Trends</h3>
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
              <h3 className="section-title">{Ic.fire} Student Risk Levels</h3>
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
              <h3 className="section-title">{Ic.quiz} Class Weak Topics</h3>
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
                {loadingDoubt ? <>{Ic.hourglass} Generating...</> : <>{Ic.clipboard} Generate Doubt Sheet</>}
              </button>
              {doubtSheet && <div className="card markdown-content" style={{ marginTop: '1rem' }}><ReactMarkdown>{doubtSheet}</ReactMarkdown></div>}
            </div>
          )}
        </>
      )}

      {/* ──── AI ──── */}
      {activeTab === 'ai' && (
        <div className="section">
          <h3 className="section-title">{Ic.brain} AI Teaching Suggestions</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            AI analyses class performance, weather, and preferences to generate tailored advice.
          </p>
          <button className="btn btn-primary" onClick={genSuggestions} disabled={loadingSugg}>
            {loadingSugg ? <>{Ic.hourglass} Analyzing (30-60s)...</> : <>{Ic.light} Generate Suggestions</>}
          </button>
          {suggestions && <div className="card markdown-content" style={{ marginTop: '1rem' }}><ReactMarkdown>{suggestions}</ReactMarkdown></div>}
        </div>
      )}
    </div>
  );
}
