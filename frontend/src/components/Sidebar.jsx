import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import API from '../api/client';

const NAV = [
  { section: 'Main', items: [
    { to: '/', icon: '🏠', label: 'Home' },
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
  const [health, setHealth] = useState({ ollama: false, vectorstore: false, students_count: 0 });

  useEffect(() => {
    API.get('/system/health').then(r => setHealth(r.data)).catch(() => {});
    const interval = setInterval(() => {
      API.get('/system/health').then(r => setHealth(r.data)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

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
                end={item.to === '/'}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

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

      <div style={{ padding: '0.6rem 1.2rem', textAlign: 'center', color: '#4B5563', fontSize: '0.65rem', borderTop: '1px solid #1F2937' }}>
        MTRX-TriAxis v2.0 · Built with ❤️
      </div>
    </aside>
  );
}
