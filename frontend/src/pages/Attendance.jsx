import { useState, useEffect, useMemo } from 'react';
import API from '../api/client';
import toast from 'react-hot-toast';

/* ─── tiny SVG ring component ─── */
function ProgressRing({ radius = 28, stroke = 5, percent = 0, color = '#34D399' }) {
  const norm = Math.min(Math.max(percent, 0), 100);
  const circ = 2 * Math.PI * radius;
  const offset = circ - (norm / 100) * circ;
  const size = (radius + stroke) * 2;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={radius + stroke} cy={radius + stroke} r={radius}
        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle cx={radius + stroke} cy={radius + stroke} r={radius}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)' }} />
      <text x={radius + stroke} y={radius + stroke}
        textAnchor="middle" dominantBaseline="central"
        fill="var(--text)" fontSize="0.72rem" fontWeight="800"
        style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>
        {norm}%
      </text>
    </svg>
  );
}

/* ─── donut chart for today's snapshot ─── */
function DonutChart({ present, absent, unmarked }) {
  const total = present + absent + unmarked || 1;
  const r = 54, sw = 14;
  const circ = 2 * Math.PI * r;
  const pLen = (present / total) * circ;
  const aLen = (absent / total) * circ;
  const uLen = (unmarked / total) * circ;
  const size = (r + sw) * 2;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={r + sw} cy={r + sw} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={sw} />
        {/* present arc */}
        <circle cx={r + sw} cy={r + sw} r={r} fill="none" stroke="#34D399" strokeWidth={sw}
          strokeDasharray={`${pLen} ${circ - pLen}`} strokeDashoffset={0}
          strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.8s ease' }} />
        {/* absent arc */}
        <circle cx={r + sw} cy={r + sw} r={r} fill="none" stroke="#F87171" strokeWidth={sw}
          strokeDasharray={`${aLen} ${circ - aLen}`} strokeDashoffset={-pLen}
          strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.8s ease' }} />
        {/* unmarked arc */}
        <circle cx={r + sw} cy={r + sw} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={sw}
          strokeDasharray={`${uLen} ${circ - uLen}`} strokeDashoffset={-(pLen + aLen)}
          style={{ transition: 'stroke-dasharray 0.8s ease' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', pointerEvents: 'none'
      }}>
        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)' }}>{present + absent}</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>MARKED</span>
      </div>
    </div>
  );
}

/* ─── helper: attendance color ─── */
const pctColor = p => p >= 85 ? '#34D399' : p >= 70 ? '#FBBF24' : p >= 50 ? '#FB923C' : '#F87171';
const riskLabel = p => p >= 85 ? 'On Track' : p >= 70 ? 'Monitor' : p >= 50 ? 'At Risk' : 'Critical';
const riskBadge = p => p >= 85 ? 'badge-green' : p >= 70 ? 'badge-yellow' : p >= 50 ? 'badge-yellow' : 'badge-red';

export default function Attendance() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [grid, setGrid] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState('grid');          // 'grid' | 'cards'

  const fetchGrid = async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/attendance/grid?year=${year}&month=${month}`);
      setGrid(data);
      const { data: s } = await API.get(`/attendance/summary?year=${year}&month=${month}`);
      setSummary(s);
    } catch { toast.error('Failed to load attendance'); }
    setLoading(false);
  };

  useEffect(() => { fetchGrid(); }, [year, month]);

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const toggleCell = (studentIdx, dateStr) => {
    if (!grid) return;
    const updated = { ...grid };
    const student = updated.students[studentIdx];
    const current = student.cells[dateStr];
    if (current === 'W') return;
    student.cells[dateStr] = current === 'P' ? 'A' : 'P';
    setGrid({ ...updated });
  };

  const saveAll = async () => {
    if (!grid) return;
    setSaving(true);
    const records = [];
    grid.students.forEach(s => {
      Object.entries(s.cells).forEach(([dateStr, val]) => {
        if (val === 'P' || val === 'A') {
          records.push({ student_id: s.id, date: dateStr, present: val === 'P' });
        }
      });
    });
    try {
      const { data } = await API.post('/attendance/save', { records });
      toast.success(`Saved! ${data.present} present, ${data.absent} absent`);
      fetchGrid();
    } catch { toast.error('Failed to save'); }
    setSaving(false);
  };

  const markAllToday = async (present) => {
    const today = new Date().toISOString().split('T')[0];
    if (!grid) return;
    const records = grid.students.map(s => ({ student_id: s.id, date: today, present }));
    await API.post('/attendance/save', { records });
    toast.success(present ? 'All marked present' : 'All marked absent');
    fetchGrid();
  };

  const cellClass = (val) => {
    if (val === 'P') return 'att-cell att-present';
    if (val === 'A') return 'att-cell att-absent';
    if (val === 'W') return 'att-cell att-weekend';
    return 'att-cell att-empty';
  };

  /* ── computed stats ── */
  const stats = useMemo(() => {
    if (!grid || !summary) return null;
    const todayStr = new Date().toISOString().split('T')[0];
    let todayP = 0, todayA = 0, todayU = 0;
    grid.students.forEach(s => {
      const v = s.cells[todayStr];
      if (v === 'P') todayP++;
      else if (v === 'A') todayA++;
      else if (v !== 'W') todayU++;
    });
    const totalStudents = grid.students.length;
    const avgPct = summary.students.length > 0
      ? Math.round(summary.students.reduce((a, s) => a + s.percentage, 0) / summary.students.length)
      : 0;
    return { todayP, todayA, todayU, totalStudents, avgPct };
  }, [grid, summary]);

  return (
    <div>
      {/* ── Page header ── */}
      <div className="page-header">
        <h2>📋 Attendance Register</h2>
        <p>Click any cell to toggle P/A • Switch views for detailed analytics</p>
      </div>

      {/* ── Month navigation ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.4rem' }}>
        <button className="btn btn-secondary" onClick={prevMonth}>◀ Prev</button>
        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)' }}>
          📅 {grid?.month_name || ''} {year}
        </h3>
        <button className="btn btn-secondary" onClick={nextMonth}>Next ▶</button>
      </div>

      {loading ? (
        <div className="loading-overlay"><div className="spinner" /> Loading attendance...</div>
      ) : grid ? (
        <>
          {/* ── Top Metric Cards + Donut ── */}
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', marginBottom: '1.6rem', alignItems: 'stretch' }}>
              <div className="metric-card" style={{ '--accent-c': '#34D399' }}>
                <div className="label">Total Students</div>
                <div className="value">{stats.totalStudents}</div>
                <div className="delta delta-positive">enrolled this month</div>
              </div>
              <div className="metric-card">
                <div className="label">Present Today</div>
                <div className="value" style={{ color: '#34D399' }}>{stats.todayP}</div>
                <div className="delta" style={{ color: 'var(--text-muted)' }}>
                  {stats.totalStudents > 0 ? Math.round((stats.todayP / stats.totalStudents) * 100) : 0}% of class
                </div>
              </div>
              <div className="metric-card">
                <div className="label">Monthly Avg</div>
                <div className="value" style={{ color: pctColor(stats.avgPct) }}>{stats.avgPct}%</div>
                <div className="delta" style={{ color: 'var(--text-muted)' }}>{summary.working_days} working days</div>
              </div>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem 1.4rem', gap: '0.5rem' }}>
                <DonutChart present={stats.todayP} absent={stats.todayA} unmarked={stats.todayU} />
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.7rem', fontWeight: 600 }}>
                  <span style={{ color: '#34D399' }}>● Present {stats.todayP}</span>
                  <span style={{ color: '#F87171' }}>● Absent {stats.todayA}</span>
                  <span style={{ color: 'var(--text-muted)' }}>● Unmarked {stats.todayU}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── View Toggle ── */}
          <div className="tabs" style={{ marginBottom: '1rem' }}>
            <button className={`tab ${view === 'grid' ? 'active' : ''}`} onClick={() => setView('grid')}>📊 Calendar Grid</button>
            <button className={`tab ${view === 'cards' ? 'active' : ''}`} onClick={() => setView('cards')}>👤 Student Cards</button>
          </div>

          {/* ═══ GRID VIEW ═══ */}
          {view === 'grid' && (
            <>
              <div className="table-container" style={{ marginBottom: '1rem' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: 170, position: 'sticky', left: 0, background: 'var(--surface-solid)', zIndex: 2 }}>Student</th>
                      {grid.days.map(d => (
                        <th key={d.date} style={{ textAlign: 'center', minWidth: 48, fontSize: '0.72rem', background: d.is_weekend ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.01)' }}>
                          <div style={{ fontWeight: 700 }}>{d.day}</div>
                          <div style={{ color: d.is_weekend ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 400 }}>{d.day_abbr}</div>
                        </th>
                      ))}
                      <th style={{ textAlign: 'center', minWidth: 60, position: 'sticky', right: 0, background: 'var(--surface-solid)', zIndex: 2 }}>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grid.students.map((s, si) => {
                      const stu = summary?.students?.find(x => x.id === s.id);
                      const pct = stu?.percentage ?? 0;
                      return (
                        <tr key={s.id}>
                          <td style={{ position: 'sticky', left: 0, background: 'var(--surface-solid)', zIndex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className="att-avatar">{s.name[0]}</div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text)' }}>{s.name}</div>
                                {s.login_id && <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>{s.login_id}</div>}
                              </div>
                            </div>
                          </td>
                          {grid.days.map(d => (
                            <td key={d.date} style={{ textAlign: 'center', padding: '4px 2px' }}>
                              <span className={cellClass(s.cells[d.date])} onClick={() => toggleCell(si, d.date)}>
                                {s.cells[d.date]}
                              </span>
                            </td>
                          ))}
                          <td style={{ textAlign: 'center', position: 'sticky', right: 0, background: 'var(--surface-solid)', zIndex: 1 }}>
                            <span style={{
                              display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: 20,
                              fontSize: '0.72rem', fontWeight: 700, color: pctColor(pct),
                              background: `${pctColor(pct)}18`
                            }}>{pct}%</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: '1.2rem', marginBottom: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span className="att-cell att-present" style={{ width: 22, height: 18, fontSize: '0.62rem' }}>P</span> Present</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span className="att-cell att-absent" style={{ width: 22, height: 18, fontSize: '0.62rem' }}>A</span> Absent</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span className="att-cell att-weekend" style={{ width: 22, height: 18, fontSize: '0.62rem' }}>W</span> Weekend</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span className="att-cell att-empty" style={{ width: 22, height: 18, fontSize: '0.62rem' }}>-</span> Not marked</span>
              </div>
            </>
          )}

          {/* ═══ STUDENT CARDS VIEW ═══ */}
          {view === 'cards' && summary && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              {summary.students.map(s => {
                const gridStu = grid.students.find(x => x.id === s.id);
                const col = pctColor(s.percentage);
                /* compute recent 5-day streak */
                let streak = 0;
                if (gridStu) {
                  const sortedDays = [...grid.days].filter(d => !d.is_weekend).reverse();
                  for (const d of sortedDays) {
                    if (gridStu.cells[d.date] === 'P') streak++;
                    else break;
                  }
                }
                return (
                  <div key={s.id} className="card" style={{
                    display: 'flex', gap: '1rem', alignItems: 'center', padding: '1.2rem 1.4rem',
                    borderLeft: `3px solid ${col}`,
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 30px ${col}22`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                  >
                    <ProgressRing radius={28} stroke={5} percent={s.percentage} color={col} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                        <span className={`badge ${riskBadge(s.percentage)}`} style={{ fontSize: '0.6rem', padding: '0.1rem 0.5rem' }}>
                          {riskLabel(s.percentage)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.8rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        <span>✅ {s.present}/{s.total}</span>
                        <span>❌ {s.total - s.present}/{s.total}</span>
                      </div>
                      {/* mini bar */}
                      <div style={{ marginTop: 6 }}>
                        <div className="progress-bar" style={{ height: 5 }}>
                          <div className="progress-fill" style={{ width: `${s.percentage}%`, background: col }} />
                        </div>
                      </div>
                      {/* streak */}
                      {streak > 0 && (
                        <div style={{ marginTop: 5, fontSize: '0.68rem', color: '#34D399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          🔥 {streak}-day streak
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Quick Actions ── */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <button className="btn btn-secondary" onClick={() => markAllToday(true)}>✅ All Present Today</button>
            <button className="btn btn-danger" onClick={() => markAllToday(false)}>❌ All Absent Today</button>
            <button className="btn btn-primary" onClick={saveAll} disabled={saving}>
              {saving ? '⏳ Saving...' : '💾 Save All Changes'}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
