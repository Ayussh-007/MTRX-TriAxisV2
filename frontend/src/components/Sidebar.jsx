import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import API from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useClassroom } from '../context/ClassroomContext';

/* ── Tiny inline SVG helper ────────────────────────────────── */
const SvgIcon = ({ children, size = 16, color = 'currentColor' }) => (
  <svg
    width={size} height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

/* ── Named sidebar icons ───────────────────────────────────── */
const NAV_ICONS = {
  // Teacher classroom
  dashboard:   <SvgIcon><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></SvgIcon>,
  students:    <SvgIcon><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></SvgIcon>,
  attendance:  <SvgIcon><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></SvgIcon>,
  curriculum:  <SvgIcon><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></SvgIcon>,
  quiz:        <SvgIcon><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></SvgIcon>,
  slides:      <SvgIcon><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></SvgIcon>,
  analytics:   <SvgIcon><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></SvgIcon>,
  agent:       <SvgIcon><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 8v4M12 16h.01"/></SvgIcon>,
  // Teacher home
  classrooms:  <SvgIcon><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></SvgIcon>,
  manage:      <SvgIcon><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 0 0 2.93 19.07M4.93 4.93A10 10 0 0 0 19.07 19.07"/></SvgIcon>,
  // UI
  sun:         <SvgIcon size={14}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></SvgIcon>,
  moon:        <SvgIcon size={14}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></SvgIcon>,
  logout:      <SvgIcon size={13}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></SvgIcon>,
  back:        <SvgIcon size={13}><polyline points="15 18 9 12 15 6"/></SvgIcon>,
  mortarBoard: <SvgIcon size={20}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></SvgIcon>,
};

/* ── Icon key map → icon element ───────────────────────────── */
const ICON_MAP = {
  dashboard:  NAV_ICONS.dashboard,
  students:   NAV_ICONS.students,
  attendance: NAV_ICONS.attendance,
  curriculum: NAV_ICONS.curriculum,
  quiz:       NAV_ICONS.quiz,
  slides:     NAV_ICONS.slides,
  analytics:  NAV_ICONS.analytics,
  agent:      NAV_ICONS.agent,
  home:       NAV_ICONS.classrooms,
  manage:     NAV_ICONS.manage,
  portal:     NAV_ICONS.classrooms,
  studentDash:NAV_ICONS.dashboard,
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { classroom, clearClassroom } = useClassroom();
  const navigate = useNavigate();
  const location = useLocation();
  const [health, setHealth] = useState({ ollama: false, vectorstore: false, students_count: 0 });
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

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

  const handleLogout = () => { clearClassroom(); logout(); navigate('/'); };
  const handleBackToClassrooms = () => {
    clearClassroom();
    navigate(user?.role === 'teacher' ? '/home' : '/portal');
  };

  const TEACHER_CLASSROOM_NAV = classroomId ? [
    { section: 'Classroom', items: [
      { to: `/classroom/${classroomId}`,            iconKey: 'dashboard',  label: 'Dashboard',      end: true },
      { to: `/classroom/${classroomId}/students`,   iconKey: 'students',   label: 'Students' },
      { to: `/classroom/${classroomId}/attendance`, iconKey: 'attendance', label: 'Attendance' },
    ]},
    { section: 'Teaching', items: [
      { to: `/classroom/${classroomId}/curriculum`, iconKey: 'curriculum', label: 'Curriculum' },
      { to: `/classroom/${classroomId}/quiz`,       iconKey: 'quiz',       label: 'Quiz Generator' },
      { to: `/classroom/${classroomId}/slides`,     iconKey: 'slides',     label: 'Slide Maker' },
      { to: `/classroom/${classroomId}/analytics`,  iconKey: 'analytics',  label: 'Analytics' },
    ]},
    { section: 'AI Tools', items: [
      { to: `/classroom/${classroomId}/agent`,      iconKey: 'agent',      label: 'AI Agent' },
    ]},
  ] : [];

  const TEACHER_HOME_NAV = [
    { section: 'Main', items: [
      { to: '/home',       iconKey: 'home',   label: 'My Classrooms' },
      { to: '/classrooms', iconKey: 'manage', label: 'Manage Classrooms' },
    ]},
  ];

  const STUDENT_HOME_NAV = [
    { section: 'Main', items: [
      { to: '/portal', iconKey: 'portal', label: 'My Classrooms' },
    ]},
  ];

  const STUDENT_CLASSROOM_NAV = classroomId ? [
    { section: 'Classroom', items: [
      { to: `/classroom/${classroomId}/student`, iconKey: 'studentDash', label: 'Dashboard', end: true },
    ]},
  ] : [];

  const NAV = user?.role === 'teacher'
    ? (isInClassroom ? TEACHER_CLASSROOM_NAV : TEACHER_HOME_NAV)
    : (isInClassroom ? STUDENT_CLASSROOM_NAV : STUDENT_HOME_NAV);

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">{NAV_ICONS.mortarBoard}</div>
        <div className="sidebar-brand-text">
          <h1>MTRX-TriAxis</h1>
          <span>{user?.role === 'teacher' ? 'Teacher' : 'Student'}</span>
        </div>
      </div>
      <hr className="sidebar-divider" />

      {/* Back button */}
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
          {NAV_ICONS.back} All Classrooms
        </button>
      )}

      {/* Classroom badge */}
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

      {/* Nav links */}
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
                <span className="sidebar-link-icon">{ICON_MAP[item.iconKey]}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Theme toggle */}
      <button className="theme-toggle" onClick={toggleTheme}>
        {theme === 'dark' ? NAV_ICONS.sun : NAV_ICONS.moon}
        {theme === 'dark' ? ' Light Mode' : ' Dark Mode'}
      </button>

      <hr className="sidebar-divider" />

      {/* System status (teacher only) */}
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

      {/* User + logout */}
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
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; }}
          >
            {NAV_ICONS.logout} Sign Out
          </button>
        </div>
      )}

      <div style={{ padding: '0.4rem 1.3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.6rem' }}>
        MTRX-TriAxis v2.0
      </div>
    </aside>
  );
}
