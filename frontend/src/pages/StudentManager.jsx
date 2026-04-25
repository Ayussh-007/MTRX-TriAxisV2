import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api/client';
import toast from 'react-hot-toast';

export default function StudentManager() {
  const { classroomId } = useParams();
  const [students, setStudents] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loginId, setLoginId] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [tab, setTab] = useState('single');
  const [selectedId, setSelectedId] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStudents = () => {
    const endpoint = classroomId ? `/classrooms/${classroomId}/students` : '/students';
    API.get(endpoint).then(r => setStudents(r.data.students || r.data)).catch(() => {});
  };

  useEffect(() => { fetchStudents(); }, [classroomId]);

  const addStudent = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await API.post('/students', { name: name.trim(), email: email.trim() || null, login_id: loginId.trim() || null });
      toast.success(`Added ${name}`);
      setName(''); setEmail(''); setLoginId('');
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error adding student');
    }
  };

  const addBulk = async () => {
    if (!bulkText.trim()) return;
    const parsed = bulkText.trim().split('\n').filter(l => l.trim()).map(line => {
      const parts = line.split(',').map(p => p.trim());
      return { name: parts[0] || '', email: parts[1] || '', login_id: parts[2] || '' };
    });
    const { data } = await API.post('/students/bulk', { students: parsed });
    const added = data.results.filter(r => r.status === 'added');
    if (added.length) toast.success(`Added ${added.length} students`);
    setBulkText('');
    fetchStudents();
  };

  const deleteStudent = async (id, sname) => {
    await API.delete(`/students/${id}`);
    toast.success(`Removed ${sname}`);
    if (selectedId === id) { setSelectedId(null); setDashboard(null); }
    fetchStudents();
  };

  const loadDashboard = async (id) => {
    setSelectedId(id);
    setLoading(true);
    try {
      const { data } = await API.get(`/students/${id}/dashboard`);
      setDashboard(data);
    } catch { toast.error('Failed to load dashboard'); }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <h2>🎒 Student Manager</h2>
        <p>Add, remove, and track individual student performance.</p>
      </div>

      {/* Add Students */}
      <div className="section">
        <h3 className="section-title">➕ Add Students</h3>
        <div className="tabs">
          <button className={`tab${tab === 'single' ? ' active' : ''}`} onClick={() => setTab('single')}>Single Student</button>
          <button className={`tab${tab === 'bulk' ? ' active' : ''}`} onClick={() => setTab('bulk')}>📋 Bulk Add</button>
        </div>

        {tab === 'single' ? (
          <form onSubmit={addStudent}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Ayush Mhatre" />
              </div>
              <div className="form-group">
                <label className="form-label">Email (optional)</label>
                <input className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="ayush@sakec.ac.in" />
              </div>
              <div className="form-group">
                <label className="form-label">Login ID</label>
                <input className="form-input" value={loginId} onChange={e => setLoginId(e.target.value)} placeholder="e.g., AI251030" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Add Student</button>
          </form>
        ) : (
          <div>
            <div className="alert alert-info" style={{ marginBottom: '0.8rem' }}>
              <strong>Format:</strong> One per line — <code>Name, Email, LoginID</code> (Email & LoginID optional)
            </div>
            <textarea className="form-textarea" value={bulkText} onChange={e => setBulkText(e.target.value)} rows={6}
              placeholder={'Ayush Mhatre, ayush@sakec.ac.in, AI251030\nRiya Patel\nKaran Singh, , STU003'} />
            <button className="btn btn-primary" onClick={addBulk} style={{ marginTop: '0.5rem' }}>📋 Add All Students</button>
          </div>
        )}
      </div>

      <hr className="section-divider" />

      {/* Student List */}
      <div className="section">
        <h3 className="section-title">👥 Enrolled Students ({students.length})</h3>
        {students.length === 0 ? (
          <div className="alert alert-info">No students registered yet. Add a student above.</div>
        ) : (
          <div>
            {students.map(s => (
              <div key={s.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', padding: '0.7rem 1rem', borderLeft: '3px solid var(--primary)' }}>
                <div>
                  <strong style={{ color: 'var(--text)' }}>{s.name}</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginLeft: '0.5rem' }}>
                    ID: {s.id} · {s.login_id ? `🔑 ${s.login_id}` : '⚠️ No login ID'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => loadDashboard(s.id)}>📊 View</button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteStudent(s.id, s.name)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dashboard */}
      {selectedId && (
        <>
          <hr className="section-divider" />
          <div className="section">
            <h3 className="section-title">📊 Student Dashboard</h3>
            {loading ? (
              <div className="loading-overlay"><div className="spinner" /> Loading dashboard...</div>
            ) : dashboard ? (
              <div>
                <div className="metric-row">
                  <div className="metric-card"><div className="label">📈 Overall Score</div><div className="value">{dashboard.overall_score}%</div></div>
                  <div className="metric-card"><div className="label">📅 Attendance</div><div className="value">{dashboard.attendance_rate}%</div></div>
                  <div className="metric-card"><div className="label">⚠️ Weak Topics</div><div className="value">{dashboard.weak_topics.length}</div></div>
                  <div className="metric-card"><div className="label">✅ Strong Topics</div><div className="value">{dashboard.strong_topics.length}</div></div>
                  <div className="metric-card"><div className="label">📈 Trend</div><div className="value">{dashboard.performance_trend.overall_trend}</div></div>
                </div>

                {Object.keys(dashboard.topic_scores).length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <h4 style={{ marginBottom: '0.5rem' }}>📊 Topic Scores</h4>
                    {Object.entries(dashboard.topic_scores).sort((a,b) => a[1] - b[1]).map(([topic, score]) => {
                      const color = score >= 70 ? '#34D399' : score >= 50 ? '#FB923C' : '#F87171';
                      return (
                        <div key={topic} className="card" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', padding: '0.5rem 1rem', borderLeft: `3px solid ${color}` }}>
                          <span>{score >= 70 ? '✅' : score >= 50 ? '⚠️' : '❌'} {topic}</span>
                          <strong style={{ color }}>{score}%</strong>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
