import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';
import toast from 'react-hot-toast';

export default function ClassroomManager() {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', subject: '' });
  const [selected, setSelected] = useState(null);
  const [members, setMembers] = useState([]);

  const fetchClassrooms = async () => {
    if (!user) return;
    try {
      const { data } = await API.get(`/classrooms?teacher_id=${user.id}`);
      setClassrooms(data.classrooms || []);
    } catch { toast.error('Failed to load classrooms'); }
    setLoading(false);
  };

  useEffect(() => { fetchClassrooms(); }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Enter a classroom name'); return; }
    setCreating(true);
    try {
      const { data } = await API.post('/classrooms', {
        name: form.name, subject: form.subject, teacher_id: user.id,
      });
      toast.success(`Classroom created! Code: ${data.code}`);
      setForm({ name: '', subject: '' });
      fetchClassrooms();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to create');
    }
    setCreating(false);
  };

  const viewMembers = async (room) => {
    setSelected(room);
    try {
      const { data } = await API.get(`/classrooms/${room.id}`);
      setMembers(data.members || []);
    } catch { toast.error('Failed to load members'); }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Code "${code}" copied!`);
  };

  const deleteRoom = async (id) => {
    if (!confirm('Delete this classroom? All members will be removed.')) return;
    try {
      await API.delete(`/classrooms/${id}`);
      toast.success('Classroom deleted');
      if (selected?.id === id) { setSelected(null); setMembers([]); }
      fetchClassrooms();
    } catch { toast.error('Failed to delete'); }
  };

  if (!user || user.role !== 'teacher') {
    return (
      <div className="page-container">
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--text)' }}>🔒 Teacher Access Only</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Please log in as a teacher to manage classrooms.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">🏫 My Classrooms</h1>
          <p className="page-subtitle">Create classrooms and share join codes with your students</p>
        </div>
      </div>

      {/* ── Create Classroom Form ── */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ color: 'var(--text)', marginBottom: '1rem', fontWeight: 700 }}>
          ✨ Create New Classroom
        </h3>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label className="form-label">Classroom Name *</label>
            <input
              className="form-input"
              placeholder="e.g. Physics 10-A"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label className="form-label">Subject</label>
            <input
              className="form-input"
              placeholder="e.g. Physics, Mathematics"
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={creating} style={{ height: '42px' }}>
            {creating ? '⏳ Creating...' : '➕ Create Classroom'}
          </button>
        </form>
      </div>

      {/* ── Classrooms Grid ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading classrooms...
        </div>
      ) : classrooms.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏫</div>
          <h3 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>No Classrooms Yet</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            Create your first classroom above and share the code with students!
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {classrooms.map(room => (
            <div
              key={room.id}
              className="glass-card"
              style={{
                padding: '1.5rem',
                cursor: 'pointer',
                border: selected?.id === room.id ? '1px solid var(--primary-light)' : undefined,
                transition: 'all 0.3s',
              }}
              onClick={() => viewMembers(room)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                <div>
                  <h3 style={{ color: 'var(--text)', fontWeight: 700, fontSize: '1.05rem' }}>{room.name}</h3>
                  {room.subject && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{room.subject}</span>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteRoom(room.id); }}
                  style={{
                    background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)',
                    color: 'var(--danger)', borderRadius: '8px', padding: '0.3rem 0.5rem',
                    cursor: 'pointer', fontSize: '0.7rem', fontFamily: 'inherit',
                  }}
                >🗑️</button>
              </div>

              {/* Join Code */}
              <div
                onClick={(e) => { e.stopPropagation(); copyCode(room.code); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.6rem 0.8rem', borderRadius: '10px',
                  background: 'rgba(34, 211, 153, 0.06)', border: '1px solid rgba(34, 211, 153, 0.15)',
                  marginBottom: '0.8rem', cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Join Code
                </span>
                <span style={{ fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-light)', letterSpacing: '3px', flex: 1 }}>
                  {room.code}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📋 Copy</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  👥 {room.member_count || 0} student{(room.member_count || 0) !== 1 ? 's' : ''}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  {new Date(room.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Members Panel ── */}
      {selected && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ color: 'var(--text)', fontWeight: 700 }}>
              👥 Students in "{selected.name}"
            </h3>
            <button
              onClick={() => { setSelected(null); setMembers([]); }}
              style={{
                background: 'var(--glass)', border: '1px solid var(--glass-border)',
                color: 'var(--text-secondary)', borderRadius: '8px', padding: '0.3rem 0.8rem',
                cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'inherit',
              }}
            >✕ Close</button>
          </div>

          {members.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <p>No students have joined yet.</p>
              <p style={{ fontSize: '0.82rem', marginTop: '0.5rem' }}>
                Share the code <strong style={{ color: 'var(--primary-light)', fontFamily: 'monospace', letterSpacing: '2px' }}>{selected.code}</strong> with your students!
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {members.map((m, i) => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.8rem',
                    padding: '0.7rem 1rem', borderRadius: '10px',
                    background: 'var(--glass)', border: '1px solid var(--glass-border)',
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
                  }}>
                    {(m.user_name || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)' }}>
                      {m.user_name || `Student #${m.user_id}`}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {m.user_email || 'No email'}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    Joined {new Date(m.joined_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
