import { useState, useEffect } from 'react';
import API from '../api/client';
import toast from 'react-hot-toast';

export default function Attendance() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [grid, setGrid] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  return (
    <div>
      <div className="page-header">
        <h2>📋 Attendance Register</h2>
        <p>Click any cell to toggle P/A. Save when done.</p>
      </div>

      {/* Month Nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <button className="btn btn-secondary" onClick={prevMonth}>◀ Prev</button>
        <h3 style={{ margin: 0 }}>📅 {grid?.month_name || ''} {year}</h3>
        <button className="btn btn-secondary" onClick={nextMonth}>Next ▶</button>
      </div>

      {loading ? (
        <div className="loading-overlay"><div className="spinner" /> Loading attendance...</div>
      ) : grid ? (
        <>
          {/* Grid Table */}
          <div className="table-container" style={{ marginBottom: '1rem' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ minWidth: 160, position: 'sticky', left: 0, background: '#F8F9FB', zIndex: 2 }}>Student</th>
                  {grid.days.map(d => (
                    <th key={d.date} style={{ textAlign: 'center', minWidth: 48, fontSize: '0.72rem', background: d.is_weekend ? '#F3F4F6' : '#F8F9FB' }}>
                      <div style={{ fontWeight: 700 }}>{d.day}</div>
                      <div style={{ color: '#9CA3AF', fontWeight: 400 }}>{d.day_abbr}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.students.map((s, si) => (
                  <tr key={s.id}>
                    <td style={{ position: 'sticky', left: 0, background: '#fff', zIndex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="att-avatar">{s.name[0]}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{s.name}</div>
                          {s.login_id && <div style={{ color: '#9CA3AF', fontSize: '0.7rem' }}>{s.login_id}</div>}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: '0.78rem', color: '#4B5563' }}>
            <span><span className="att-cell att-present" style={{ width: 20, height: 18, fontSize: '0.65rem' }}>P</span> Present</span>
            <span><span className="att-cell att-absent" style={{ width: 20, height: 18, fontSize: '0.65rem' }}>A</span> Absent</span>
            <span><span className="att-cell att-weekend" style={{ width: 20, height: 18, fontSize: '0.65rem' }}>W</span> Weekend</span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
            <button className="btn btn-secondary" onClick={() => markAllToday(true)}>✅ All Present Today</button>
            <button className="btn btn-danger" onClick={() => markAllToday(false)}>❌ All Absent Today</button>
            <button className="btn btn-primary" onClick={saveAll} disabled={saving}>
              {saving ? '⏳ Saving...' : '💾 Save All Changes'}
            </button>
          </div>

          {/* Summary */}
          {summary && summary.working_days > 0 && (
            <div className="section">
              <h3 className="section-title">📊 Monthly Summary ({summary.working_days} working days)</h3>
              {summary.students.map(s => {
                const color = s.percentage >= 85 ? '#22C55E' : s.percentage >= 70 ? '#F59E0B' : s.percentage >= 50 ? '#F97316' : '#EF4444';
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                    <div style={{ minWidth: 140, fontWeight: 600, fontSize: '0.82rem' }}>{s.name}</div>
                    <div className="progress-bar" style={{ flex: 1 }}>
                      <div className="progress-fill" style={{ width: `${s.percentage}%`, background: color }} />
                    </div>
                    <div style={{ minWidth: 90, textAlign: 'right', fontSize: '0.78rem', color: '#4B5563' }}>
                      {s.present}/{s.total} ({s.percentage}%)
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
