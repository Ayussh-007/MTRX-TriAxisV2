import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';

/* ── Color palettes per role ── */
const PALETTES = {
  student: {
    gradient: 'linear-gradient(165deg, #7dd3c0 0%, #5bbfad 30%, #3aafa9 60%, #2b8a82 100%)',
    btn: 'linear-gradient(135deg, #5bbfad 0%, #3aafa9 100%)',
    accent: '#3aafa9',
    accentDk: '#2b8a82',
    glow: 'rgba(58,175,169,0.25)',
    inputIcon: '#3aafa9',
    shape1: 'radial-gradient(circle, rgba(255,220,210,0.7), rgba(255,180,170,0.3))',
    shape2: 'radial-gradient(circle, rgba(255,255,255,0.4), rgba(200,230,240,0.3))',
    shape3: 'radial-gradient(circle, rgba(230,200,240,0.5), rgba(200,180,220,0.2))',
  },
  teacher: {
    gradient: 'linear-gradient(165deg, #93b5f5 0%, #6b9cf0 30%, #4a80e8 60%, #2f5ec4 100%)',
    btn: 'linear-gradient(135deg, #6b9cf0 0%, #4a80e8 100%)',
    accent: '#4a80e8',
    accentDk: '#2f5ec4',
    glow: 'rgba(74,128,232,0.25)',
    inputIcon: '#4a80e8',
    shape1: 'radial-gradient(circle, rgba(255,200,220,0.6), rgba(240,170,190,0.3))',
    shape2: 'radial-gradient(circle, rgba(220,235,255,0.5), rgba(180,210,250,0.3))',
    shape3: 'radial-gradient(circle, rgba(255,220,180,0.5), rgba(240,200,160,0.2))',
  },
};

/* ── SVG icons ── */
const Icons = {
  user: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  mail: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/>
    </svg>
  ),
  lock: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  ),
  eyeOff: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ),
  eye: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  google: (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  ),
  // Favicon-style role icons
  studentIcon: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" fill={active ? '#3aafa9' : '#CBD5E1'}/>
      <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" fill={active ? '#2b8a82' : '#94A3B8'}/>
    </svg>
  ),
  teacherIcon: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="3" width="20" height="14" rx="2" fill={active ? '#4a80e8' : '#CBD5E1'}/>
      <path d="M8 21h8M12 17v4" stroke={active ? '#2f5ec4' : '#94A3B8'} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="10" r="3" fill={active ? '#fff' : '#E2E8F0'}/>
    </svg>
  ),
};

export default function AuthPage() {
  const { login } = useAuth();
  const [role, setRole] = useState('student');
  const [mode, setMode] = useState('signup');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const P = PALETTES[role];

  /* ── Google OAuth ── */
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true); setError('');
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const profile = await res.json();
        const { data } = await API.post('/auth/google', {
          email: profile.email, name: profile.name,
          picture: profile.picture, google_id: profile.sub, role,
        });
        login({ id: data.user.id, name: data.user.name, email: data.user.email,
          picture: data.user.picture || profile.picture, role: data.user.role });
      } catch { setError('Google sign-in failed. Please try again.'); }
      setLoading(false);
    },
    onError: () => setError('Google sign-in was cancelled.'),
  });

  /* ── Manual submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (mode === 'signup' && !form.name.trim()) { setError('Full Name is required'); return; }
    if (!form.email.trim()) { setError('Email is required'); return; }
    if (!form.password.trim()) { setError('Password is required'); return; }
    if (mode === 'signup' && form.password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    try {
      const endpoint = mode === 'signup' ? '/auth/register' : '/auth/login-email';
      const payload = mode === 'signup'
        ? { name: form.name, email: form.email, password: form.password, role }
        : { email: form.email, password: form.password, role };
      const { data } = await API.post(endpoint, payload);
      login({ id: data.user.id, name: data.user.name, email: data.user.email,
        picture: data.user.picture, role: data.user.role });
    } catch (err) {
      setError(err?.response?.data?.detail || (mode === 'signup' ? 'Registration failed' : 'Invalid credentials'));
    }
    setLoading(false);
  };

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm(f => ({ ...f, [key]: e.target.value })),
  });

  return (
    <div className="auth-bg">
      {/* Background animated blobs */}
      <div className="auth-bg-blob auth-bg-blob-1" style={{ background: P.glow }} />
      <div className="auth-bg-blob auth-bg-blob-2" style={{ background: P.glow }} />
      <div className="auth-bg-blob auth-bg-blob-3" />

      {/* ─── Glassmorphism Card ─── */}
      <div className="auth-card">

        {/* ── LEFT — Hero Panel ── */}
        <div className="auth-card-hero" style={{ background: P.gradient }}>
          <div className="auth-card-hero-inner">
            <p className="auth-card-brand" style={{ color: 'rgba(255,255,255,0.85)' }}>MTRX-TriAxis</p>
            <h1 className="auth-card-headline">
              {role === 'student' ? (
                <>Step into<br/>Learning</>
              ) : (
                <>Empower<br/>Teaching</>
              )}
            </h1>
            <p className="auth-card-subtitle">
              {role === 'student'
                ? 'Join MTRX-TriAxis to track progress, take quizzes, and get AI-powered study plans. Your journey starts here.'
                : 'Join MTRX-TriAxis to manage your classroom with AI-powered analytics, quizzes, and personalised learning. Your journey starts here.'}
            </p>
          </div>
          {/* Decorative shapes */}
          <div className="auth-shape auth-shape-1" style={{ background: P.shape1 }} />
          <div className="auth-shape auth-shape-2" style={{ background: P.shape2 }} />
          <div className="auth-shape auth-shape-3" style={{ background: P.shape3 }} />
        </div>

        {/* ── RIGHT — Form Panel ── */}
        <div className="auth-card-form">
          <div className="auth-card-form-inner">

            <h2 className="auth-form-title">
              {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="auth-form-subtitle">
              {mode === 'signup' ? 'Sign up to get started' : 'Log in to your account'}
            </p>

            {/* ── Role Selector (favicon cards) ── */}
            <div className="auth-role-cards">
              <button
                type="button"
                className={`auth-role-card ${role === 'student' ? 'active' : ''}`}
                onClick={() => { setRole('student'); setError(''); }}
                style={role === 'student' ? { borderColor: PALETTES.student.accent, background: `${PALETTES.student.accent}0A` } : {}}
              >
                {Icons.studentIcon(role === 'student')}
                <span style={role === 'student' ? { color: PALETTES.student.accent } : {}}>Student</span>
              </button>
              <button
                type="button"
                className={`auth-role-card ${role === 'teacher' ? 'active' : ''}`}
                onClick={() => { setRole('teacher'); setError(''); }}
                style={role === 'teacher' ? { borderColor: PALETTES.teacher.accent, background: `${PALETTES.teacher.accent}0A` } : {}}
              >
                {Icons.teacherIcon(role === 'teacher')}
                <span style={role === 'teacher' ? { color: PALETTES.teacher.accent } : {}}>Teacher</span>
              </button>
            </div>

            {/* ── Google button ── */}
            <button className="auth-social-btn" onClick={() => googleLogin()} disabled={loading} type="button">
              {Icons.google}
              <span>Google</span>
            </button>

            {/* ── Divider ── */}
            <div className="auth-divider"><span>OR EMAIL</span></div>

            {/* ── Form ── */}
            <form onSubmit={handleSubmit} className="auth-form-fields">
              {mode === 'signup' && (
                <div className="auth-fg">
                  <label className="auth-label">Full Name</label>
                  <div className="auth-input-wrap" style={{ '--auth-focus': P.accent }}>
                    <span className="auth-input-icon">{Icons.user(P.inputIcon)}</span>
                    <input type="text" placeholder="Jane Doe" autoComplete="name" {...field('name')} />
                  </div>
                </div>
              )}
              <div className="auth-fg">
                <label className="auth-label">Email Address</label>
                <div className="auth-input-wrap" style={{ '--auth-focus': P.accent }}>
                  <span className="auth-input-icon">{Icons.mail(P.inputIcon)}</span>
                  <input type="email" placeholder="jane@example.com" autoComplete="email" {...field('email')} />
                </div>
              </div>
              <div className="auth-fg">
                <label className="auth-label">Password</label>
                <div className="auth-input-wrap" style={{ '--auth-focus': P.accent }}>
                  <span className="auth-input-icon">{Icons.lock(P.inputIcon)}</span>
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    {...field('password')}
                  />
                  <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(p => !p)} tabIndex={-1}>
                    {showPw ? Icons.eyeOff : Icons.eye}
                  </button>
                </div>
              </div>

              {error && <div className="auth-error">{error}</div>}

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
                style={{ background: P.btn, '--auth-glow': P.glow }}
              >
                {loading ? <span className="auth-spinner" /> : mode === 'signup' ? 'Create Account' : 'Log In'}
              </button>
            </form>

            {/* ── Toggle ── */}
            <p className="auth-toggle">
              {mode === 'signup' ? (
                <>Already have an account? <button type="button" onClick={() => { setMode('login'); setError(''); }} style={{ color: P.accent }}>Log in</button></>
              ) : (
                <>Don't have an account? <button type="button" onClick={() => { setMode('signup'); setError(''); }} style={{ color: P.accent }}>Sign Up</button></>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
