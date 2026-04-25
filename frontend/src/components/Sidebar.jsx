import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import API from '../api/client';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { section: 'Main', items: [
    { to: '/home', icon: '🏠', label: 'Home' },
  ]},
  { section: 'Teacher', items: [
    { to: '/curriculum', icon: '📄', label: 'Upload Curriculum' },
    { to: '/students', icon: '🎒', label: 'Student Manager' },
    { to: '/attendance', icon: '📋', label: 'Attendance' },
    { to: '/quiz', icon: '📝', label: 'Quiz Generator' },
    { to: '/dashboard', icon: '👩‍🏫', label: 'Teacher Dashboard' },
    { to: '/slides', icon: '🖥️', label: 'Slide Maker' },
  ]},
  { section: 'AI Tools', items: [
    { to: '/agent', icon: '🤖', label: 'AI Agent' },
  ]},
  { section: 'Student', items: [
    { to: '/login', icon: '🔐', label: 'Student Login' },
    { to: '/portal', icon: '🎒', label: 'Student Portal' },
  ]},
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [health, setHealth] = useState({ ollama: false, vectorstore: false, students_count: 0 });
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  // Apply theme to <html> on mount and whenever it changes
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

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">🎓</div>
        <div className="sidebar-brand-text">
          <h1>MTRX-TriAxis</h1>
          <span>AI Classroom</span>
        </div>
      </div>
      <hr className="sidebar-divider" />

      <nav className="sidebar-nav">
        {NAV.map(group => (
          <div key={group.section}>
            <div className="sidebar-section-label">{group.section}</div>
            {group.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
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
      <div className="sidebar-status">
        <div className="status-dot">
          <span className={`dot ${health.ollama ? 'dot-green' : 'dot-red'}`} />
          <span>{health.ollama ? 'Ollama Online' : 'Ollama Offline'}</span>
        </div>
        <div className="status-dot">
          <span className={`dot ${health.vectorstore ? 'dot-green' : 'dot-yellow'}`} />
          <span>{health.vectorstore ? 'Curriculum Loaded' : 'No Curriculum'}</span>
        </div>
        <div className="status-dot">
          <span className="dot dot-green" />
          <span>{health.students_count} Students</span>
        </div>
      </div>

      <div style={{ padding: '0.6rem 1.3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.65rem', borderTop: '1px solid var(--border)' }}>
        MTRX-TriAxis v2.0 · Built with ❤️
      </div>

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
            onClick={logout}
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
    </aside>
  );
}
