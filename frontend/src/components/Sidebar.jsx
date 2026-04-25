import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import API from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useClassroom } from '../context/ClassroomContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { classroom, clearClassroom } = useClassroom();
  const navigate = useNavigate();
  const location = useLocation();
  const [health, setHealth] = useState({ ollama: false, vectorstore: false, students_count: 0 });
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  // Extract classroomId from URL path (e.g., /classroom/5/quiz → 5)
  const pathMatch = location.pathname.match(/^\/classroom\/(\d+)/);
  const classroomId = pathMatch ? pathMatch[1] : null;
  const isInClassroom = !!classroomId;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    API.get('/system/health').then(r => setHealth(r.data)).catch(() => {});
    const interval = setInterval(() => {
      API.get('/system/health').then(r => setHealth(r.data)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const handleLogout = () => {
    clearClassroom();
    logout();
    navigate('/');
  };

  const handleBackToClassrooms = () => {
    clearClassroom();
    navigate(user?.role === 'teacher' ? '/home' : '/portal');
  };

  // ── Teacher nav: classroom-scoped ──
  const TEACHER_CLASSROOM_NAV = classroomId ? [
    { section: 'Classroom', items: [
      { to: `/classroom/${classroomId}`, icon: '📊', label: 'Dashboard', end: true },
      { to: `/classroom/${classroomId}/students`, icon: '🎒', label: 'Students' },
      { to: `/classroom/${classroomId}/attendance`, icon: '📋', label: 'Attendance' },
    ]},
    { section: 'Teaching', items: [
      { to: `/classroom/${classroomId}/curriculum`, icon: '📄', label: 'Curriculum' },
      { to: `/classroom/${classroomId}/quiz`, icon: '📝', label: 'Quiz Generator' },
      { to: `/classroom/${classroomId}/slides`, icon: '🖥️', label: 'Slide Maker' },
      { to: `/classroom/${classroomId}/analytics`, icon: '📈', label: 'Analytics' },
    ]},
    { section: 'AI Tools', items: [
      { to: `/classroom/${classroomId}/agent`, icon: '🤖', label: 'AI Agent' },
    ]},
  ] : [];

  const TEACHER_HOME_NAV = [
    { section: 'Main', items: [
      { to: '/home', icon: '🏠', label: 'My Classrooms' },
      { to: '/classrooms', icon: '⚙️', label: 'Manage Classrooms' },
    ]},
  ];

  const STUDENT_HOME_NAV = [
    { section: 'Main', items: [
      { to: '/portal', icon: '🏠', label: 'My Classrooms' },
    ]},
  ];

  const STUDENT_CLASSROOM_NAV = classroomId ? [
    { section: 'Classroom', items: [
      { to: `/classroom/${classroomId}/student`, icon: '📊', label: 'Dashboard', end: true },
    ]},
  ] : [];

  const NAV = user?.role === 'teacher'
    ? (isInClassroom ? TEACHER_CLASSROOM_NAV : TEACHER_HOME_NAV)
    : (isInClassroom ? STUDENT_CLASSROOM_NAV : STUDENT_HOME_NAV);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">🎓</div>
        <div className="sidebar-brand-text">
          <h1>MTRX-TriAxis</h1>
          <span>{user?.role === 'teacher' ? 'Teacher' : 'Student'}</span>
        </div>
      </div>
      <hr className="sidebar-divider" />

      {/* Back to classrooms button when inside a classroom */}
      {isInClassroom && (
        <button
          onClick={handleBackToClassrooms}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1.1rem', margin: '0 0.6rem 0.3rem',
            background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)',
            borderRadius: 'var(--radius-sm)', color: 'var(--primary-light)',
            fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.15)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; }}
        >
          ← All Classrooms
        </button>
      )}

      {/* Classroom name badge when inside a classroom */}
      {isInClassroom && classroom && (
        <div style={{
          margin: '0 0.8rem 0.5rem', padding: '0.5rem 0.7rem',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(34,211,153,0.08))',
          border: '1px solid rgba(99,102,241,0.18)', borderRadius: 'var(--radius-sm)',
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Active Classroom
          </div>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)', marginTop: '0.1rem' }}>
            {classroom.name}
          </div>
          {classroom.subject && (
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{classroom.subject}</div>
          )}
        </div>
      )}

      <nav className="sidebar-nav">
        {NAV.map(group => (
          <div key={group.section}>
            <div className="sidebar-section-label">{group.section}</div>
            {group.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Theme Toggle */}
      <button className="theme-toggle" onClick={toggleTheme}>
        {theme === 'dark' ? '☀️' : '🌙'} {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
      </button>

      <hr className="sidebar-divider" />

      {/* System status — only for teachers */}
      {user?.role === 'teacher' && (
        <div className="sidebar-status">
          <div className="status-dot">
            <span className={`dot ${health.ollama ? 'dot-green' : 'dot-red'}`} />
            <span>{health.ollama ? 'Ollama Online' : 'Ollama Offline'}</span>
          </div>
          <div className="status-dot">
            <span className={`dot ${health.vectorstore ? 'dot-green' : 'dot-yellow'}`} />
            <span>{health.vectorstore ? 'Curriculum Loaded' : 'No Curriculum'}</span>
          </div>
        </div>
      )}

      {/* Logged-in user & logout */}
      {user && (
        <div style={{ padding: '0.6rem 1.3rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            {user.picture ? (
              <img src={user.picture} alt="" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0
              }}>{user.name?.[0]?.toUpperCase()}</div>
            )}
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user.role}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '0.35rem 0.6rem', borderRadius: 'var(--radius-sm)',
              background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)',
              color: 'var(--danger)', fontSize: '0.72rem', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; }}
          >🚪 Sign Out</button>
        </div>
      )}

      <div style={{ padding: '0.4rem 1.3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.6rem' }}>
        MTRX-TriAxis v2.0
      </div>
    </aside>
  );
}
