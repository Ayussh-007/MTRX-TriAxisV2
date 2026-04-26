import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useClassroom } from '../context/ClassroomContext';
import API from '../api/client';

const COLORS = ['#6366F1', '#34D399', '#FB923C', '#60A5FA', '#F472B6', '#FBBF24', '#A78BFA', '#38BDF8'];

export default function Home() {
  const { user } = useAuth();
  const { setClassroom } = useClassroom();
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    API.get(`/classrooms?teacher_id=${user.id}`)
      .then(r => setClassrooms(r.data.classrooms || []))
      .catch(() => {})
      .finally(() => setLoading(false));
    API.get('/system/health').then(r => setHealth(r.data)).catch(() => {});
  }, [user]);

  const openClassroom = (room) => {
    setClassroom(room);
    navigate(`/classroom/${room.id}`);
  };

  return (
    <div>
      {/* Hero */}
      <div style={{
        padding: '2rem', borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(34,211,153,0.06))',
        border: '1px solid rgba(99,102,241,0.12)',
        marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', color: 'var(--primary-light)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </span>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
              Welcome, {user?.name?.split(' ')[0]}!
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              Select a classroom to manage, or create a new one.
            </p>
          </div>
        </div>

        {/* Status badges */}
        {health && (
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.8rem' }}>
            {[
              { ok: health.ollama, text: health.ollama ? 'Ollama Online' : 'Ollama Offline', color: health.ollama ? '#34D399' : '#F87171' },
              { ok: true, text: `${classrooms.length} Classroom${classrooms.length !== 1 ? 's' : ''}`, color: '#6366F1' },
            ].map((b, i) => (
              <span key={i} style={{
                padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600,
                background: `${b.color}12`, color: b.color, border: `1px solid ${b.color}25`,
              }}>{b.ok ? '●' : '○'} {b.text}</span>
            ))}
          </div>
        )}
      </div>

      {/* Classrooms Grid */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          My Classrooms
        </h2>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/classrooms')}>
          + Create Classroom
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading...</div>
      ) : classrooms.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '3rem', borderRadius: 'var(--radius-lg)',
          background: 'var(--glass)', border: '1px solid var(--glass-border)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.8rem', display: 'flex', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            You haven't created any classrooms yet.
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/classrooms')}>
            Create Your First Classroom
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {classrooms.map((room, i) => (
            <div
              key={room.id}
              onClick={() => openClassroom(room)}
              style={{
                padding: '1.3rem', borderRadius: 'var(--radius-lg)',
                background: 'var(--glass)', backdropFilter: 'blur(12px)',
                border: '1px solid var(--glass-border)',
                cursor: 'pointer', transition: 'all 0.25s ease',
                position: 'relative', overflow: 'hidden',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 32px ${COLORS[i % COLORS.length]}15`; e.currentTarget.style.borderColor = `${COLORS[i % COLORS.length]}40`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = ''; }}
            >
              {/* Top accent */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i + 2) % COLORS.length]})`,
              }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>{room.name}</div>
                  {room.subject && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{room.subject}</div>
                  )}
                </div>
                <span style={{
                  padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700,
                  background: 'rgba(34,211,153,0.1)', color: '#34D399', border: '1px solid rgba(34,211,153,0.2)',
                  fontFamily: 'monospace', letterSpacing: '1px',
                }}>{room.code}</span>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.8rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <strong style={{ color: 'var(--text)', fontSize: '1rem' }}>{room.member_count}</strong> students
                </div>
              </div>

              <div style={{
                marginTop: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem',
                fontSize: '0.72rem', color: COLORS[i % COLORS.length], fontWeight: 600,
              }}>
                Open Dashboard →
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
