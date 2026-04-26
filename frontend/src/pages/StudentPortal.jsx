import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';
import toast from 'react-hot-toast';

const COLORS = ['#6366F1', '#34D399', '#FB923C', '#60A5FA', '#F472B6', '#FBBF24', '#A78BFA', '#38BDF8'];

export default function StudentPortal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchClassrooms = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await API.get(`/classrooms/student/${user.id}`);
      setClassrooms(data.classrooms || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchClassrooms(); }, [user]);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) { toast.error('Enter a classroom code'); return; }
    setJoining(true);
    try {
      const { data } = await API.post('/classrooms/join', {
        code: joinCode.trim().toUpperCase(),
        user_id: user.id,
        user_name: user.name,
        user_email: user.email,
      });
      toast.success(data.message || 'Joined classroom!');
      setJoinCode('');
      fetchClassrooms();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Invalid code');
    }
    setJoining(false);
  };

  if (!user) return null;

  return (
    <div>
      {/* Hero */}
      <div style={{
        padding: '2rem', borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, rgba(52,211,153,0.08), rgba(96,165,250,0.06))',
        border: '1px solid rgba(52,211,153,0.12)',
        marginBottom: '1.5rem',
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          Welcome, {user.name?.split(' ')[0]}!
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.3rem 0 0' }}>
          Open a classroom to view quizzes, scores, and your learning path.
        </p>
      </div>

      {/* Join Classroom */}
      <div style={{
        padding: '1.2rem', borderRadius: 'var(--radius-lg)',
        background: 'var(--glass)', border: '1px solid var(--glass-border)',
        marginBottom: '1.5rem',
      }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.6rem' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline',verticalAlign:'middle'}}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Join a Classroom
        </div>
        <form onSubmit={handleJoin} style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <input
            className="form-input"
            placeholder="Enter code (e.g. A3X7K2)"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            style={{ flex: '1 1 200px', fontFamily: 'monospace', letterSpacing: '2px', fontSize: '1rem', textTransform: 'uppercase' }}
            maxLength={6}
          />
          <button type="submit" className="btn btn-primary" disabled={joining} style={{ height: '42px' }}>
            {joining ? 'Joining...' : 'Join'}
          </button>
        </form>
      </div>

      {/* Classroom Grid */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        My Classrooms
      </h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading...</div>
      ) : classrooms.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '3rem', borderRadius: 'var(--radius-lg)',
          background: 'var(--glass)', border: '1px solid var(--glass-border)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.8rem', display: 'flex', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            You haven't joined any classrooms yet. Ask your teacher for a join code!
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {classrooms.map((room, i) => (
            <div
              key={room.id}
              onClick={() => navigate(`/classroom/${room.id}/student`)}
              style={{
                padding: '1.3rem', borderRadius: 'var(--radius-lg)',
                background: 'var(--glass)', backdropFilter: 'blur(12px)',
                border: '1px solid var(--glass-border)',
                cursor: 'pointer', transition: 'all 0.25s ease',
                position: 'relative', overflow: 'hidden',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 32px ${COLORS[i % COLORS.length]}15`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
            >
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i + 2) % COLORS.length]})`,
              }} />
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>{room.name}</div>
              {room.subject && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{room.subject}</div>}
              <div style={{
                marginTop: '0.6rem', fontSize: '0.72rem', color: COLORS[i % COLORS.length], fontWeight: 600,
              }}>
                Open Classroom →
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
