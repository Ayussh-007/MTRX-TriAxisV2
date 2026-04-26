import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import InteractiveBg from '../components/InteractiveBg';

/* ── SVG Icon primitives ──────────────────────────────────── */
const Ic = ({ d, size = 22, stroke = 'currentColor', fill = 'none', strokeWidth = 1.8, viewBox = '0 0 24 24', children }) => (
  <svg width={size} height={size} viewBox={viewBox} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {d ? <path d={d} /> : children}
  </svg>
);

const Icons = {
  // Feature cards
  pdf:        <Ic size={22}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></Ic>,
  quiz:       <Ic size={22}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></Ic>,
  slides:     <Ic size={22}><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></Ic>,
  analytics:  <Ic size={22}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></Ic>,
  learning:   <Ic size={22}><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></Ic>,
  ai:         <Ic size={22}><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 8v4M12 16h.01"/></Ic>,
  attendance: <Ic size={22}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></Ic>,
  weather:    <Ic size={22}><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></Ic>,
  // Arch badges
  brain:      <Ic size={14}><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.14z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.14z"/></Ic>,
  link:       <Ic size={14}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></Ic>,
  db:         <Ic size={14}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></Ic>,
  sqlite:     <Ic size={14}><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2z"/></Ic>,
  zap:        <Ic size={14}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Ic>,
  react:      <Ic size={14}><circle cx="12" cy="12" r="2"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></Ic>,
  // UI
  sun:        <Ic size={18}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></Ic>,
  moon:       <Ic size={18}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></Ic>,
  mortarBoard:<Ic size={20}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></Ic>,
  star:       <Ic size={13} fill="#FBBF24" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Ic>,
  trophy:     <Ic size={18}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></Ic>,
  teacher:    <Ic size={36}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Ic>,
  student:    <Ic size={36}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></Ic>,
};

/* ── Feature data ─────────────────────────────────────────── */
const FEATURES = [
  { icon: Icons.pdf,        title: 'Smart PDF Processing',    desc: 'Upload curriculum PDFs and our AI extracts, cleans, and vectorizes content into study-ready units using advanced RAG pipelines.', color: '#34D399', tag: 'Curriculum Engine' },
  { icon: Icons.quiz,       title: 'AI Quiz Generator',       desc: 'Generate editable MCQ quizzes from any topic. Review answers, edit questions, and share instantly with your entire class.',         color: '#60A5FA', tag: 'Assessment' },
  { icon: Icons.slides,     title: 'Lesson Slide Maker',      desc: 'Auto-generate rich PowerPoint presentations with preview, inline editing, and one-click PPTX download.',                             color: '#A78BFA', tag: 'Presentations' },
  { icon: Icons.analytics,  title: 'Teacher Analytics',       desc: 'Comprehensive class dashboard with performance trends, risk heatmaps, weak topic detection, and AI-powered teaching suggestions.',  color: '#FB923C', tag: 'Analytics' },
  { icon: Icons.learning,   title: 'Personalized Learning',   desc: 'AI generates custom study paths per student by analyzing weak spots, attendance patterns, and quiz performance.',                   color: '#FBBF24', tag: 'Student AI' },
  { icon: Icons.ai,         title: 'Multi-Step AI Agent',     desc: 'Chain-of-thought reasoning engine that researches, analyzes, and synthesizes comprehensive student intervention plans.',             color: '#F472B6', tag: 'Advanced AI' },
  { icon: Icons.attendance, title: 'Smart Attendance',        desc: 'Interactive grid-based attendance with click-to-toggle, holiday awareness, monthly summaries, and trend tracking.',                  color: '#22C55E', tag: 'Tracking' },
  { icon: Icons.weather,    title: 'Weather-Aware Teaching',  desc: 'Real-time weather integration adjusts lesson recommendations and adapts teaching strategies automatically.',                          color: '#38BDF8', tag: 'Intelligence' },
];

const STATS = [
  { value: '10+',  label: 'AI Features' },
  { value: '100%', label: 'Local & Private' },
  { value: '∞',    label: 'Quiz Generation' },
  { value: '<60s', label: 'Slide Creation' },
];

const ARCH_BADGES = [
  { icon: Icons.brain,  label: 'Gemma 4 E4B' },
  { icon: Icons.link,   label: 'LangChain' },
  { icon: Icons.db,     label: 'FAISS' },
  { icon: Icons.sqlite, label: 'SQLite' },
  { icon: Icons.zap,    label: 'FastAPI' },
  { icon: Icons.react,  label: 'React' },
];

/* ── Avatar SVGs (teacher/student silhouettes) ─────────────── */
const AVATAR_SVGS = [
  <svg key={0} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  <svg key={1} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
  <svg key={2} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  <svg key={3} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
];

/* ── Component ────────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Scroll-triggered animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('animate-in'); }),
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );
    document.querySelectorAll('.land-animate').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Mouse-follow gradient on hero
  useEffect(() => {
    const hero = document.querySelector('.land-hero');
    if (!hero) return;
    const handleMove = (e) => {
      hero.style.setProperty('--mx', `${(e.clientX / window.innerWidth) * 100}%`);
      hero.style.setProperty('--my', `${(e.clientY / window.innerHeight) * 100}%`);
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <div className="land-root">
      {/* ─── Interactive Particle Canvas ─── */}
      <InteractiveBg />

      {/* ─── Floating orbs (color mood) ─── */}
      <div className="land-bg">
        <div className="land-orb land-orb-1" />
        <div className="land-orb land-orb-2" />
        <div className="land-orb land-orb-3" />
        <div className="land-grid" />
      </div>

      {/* ─── Hero ─── */}
      <section className="land-hero">
        <div className="land-hero-actions">
          <button className="land-btn land-btn-ghost" onClick={() => navigate('/auth')}>Log in</button>
          <button className="land-btn land-btn-primary" onClick={() => navigate('/auth')}>Get Started →</button>
        </div>

        <div className="land-hero-content">
          <div className="land-badge land-animate">
            <span className="land-badge-dot" />
            AI-Powered Classroom · v2.0
          </div>

          <h1 className="land-title">
            <span className="land-title-line">Transform Your</span>
            <span className="land-title-accent">
              <span className="land-gradient-text">Classroom Experience</span>
            </span>
          </h1>

          <p className="land-subtitle">
            MTRX-TriAxis harnesses the power of local AI and deep analytics to
            elevate teaching &amp; learning. Precision-engineered tools for the
            modern educator.
          </p>

          <div className="land-hero-cta">
            <button className="land-btn land-btn-primary land-btn-lg" onClick={() => navigate('/auth')}>
              Start Teaching Smarter →
            </button>
            <button className="land-btn land-btn-outline land-btn-lg" onClick={() => document.querySelector('.land-features')?.scrollIntoView({ behavior: 'smooth' })}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Explore Features
            </button>
          </div>

          <div className="land-social-proof">
            <div className="land-avatars">
              {AVATAR_SVGS.map((svg, i) => (
                <div key={i} className="land-avatar">{svg}</div>
              ))}
            </div>
            <div>
              <div className="land-stars">
                {[...Array(5)].map((_, i) => <span key={i}>{Icons.star}</span>)}
              </div>
              <span className="land-proof-text">Trusted by educators everywhere</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="land-stats">
        {STATS.map((s, i) => (
          <div key={i} className="land-stat land-animate" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="land-stat-value">{s.value}</div>
            <div className="land-stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      {/* ─── Features ─── */}
      <section className="land-features">
        <div className="land-section-header land-animate">
          <h2 className="land-section-title">Tools for Modern Educators</h2>
          <p className="land-section-sub">
            Everything you need to teach, track, and transform student outcomes in
            one unified AI-powered platform.
          </p>
        </div>

        <div className="land-feature-grid">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="land-feature-card land-animate"
              style={{ '--accent': f.color, animationDelay: `${i * 0.08}s` }}
            >
              <div className="land-feature-icon" style={{ color: f.color }}>{f.icon}</div>
              <span className="land-feature-tag" style={{ color: f.color, borderColor: `${f.color}30` }}>
                {f.tag}
              </span>
              <h3 className="land-feature-title">{f.title}</h3>
              <p className="land-feature-desc">{f.desc}</p>
              <div className="land-feature-glow" />
            </div>
          ))}
        </div>
      </section>

      {/* ─── Architecture ─── */}
      <section className="land-arch land-animate">
        <div className="land-arch-inner">
          <div className="land-arch-text">
            <h2>Built for Privacy &amp; Performance</h2>
            <p>
              MTRX-TriAxis runs 100% locally — your student data never leaves your
              machine. Powered by Ollama LLMs, LangChain RAG pipelines, FAISS
              vector search, and SQLite.
            </p>
            <div className="land-arch-badges">
              {ARCH_BADGES.map((b) => (
                <span key={b.label} className="land-arch-badge">
                  <span className="land-arch-badge-icon">{b.icon}</span>
                  {b.label}
                </span>
              ))}
            </div>
          </div>
          <div className="land-arch-layers">
            {['UI Layer', 'API Layer', 'AI Engine', 'Data Layer'].map((label, i) => (
              <div key={i} className="land-layer" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="land-layer-inner">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="land-cta land-animate">
        <div className="land-cta-inner">
          <h2>Ready to transform your classroom?</h2>
          <p>Join the future of AI-powered education. Set up in minutes.</p>
          <button className="land-btn land-btn-primary land-btn-lg" onClick={() => navigate('/auth')}>
            Get Started Free →
          </button>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="land-footer">
        <div className="land-footer-brand">
          {Icons.mortarBoard}
          MTRX-TriAxis
        </div>
        <div className="land-footer-text">
          © 2026 MTRX-TriAxis. AI-Powered Classroom Assistant.
        </div>
        <div className="land-footer-links">
          <span>Built with
            <svg style={{ marginLeft: 4, verticalAlign: 'middle' }} width="12" height="12" viewBox="0 0 24 24" fill="#F472B6" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </span>
          <span>•</span>
          <span>Privacy First</span>
          <span>•</span>
          <span>100% Local</span>
        </div>
      </footer>

      {/* ─── Floating Theme Toggle ─── */}
      <button className="land-theme-toggle" onClick={toggleTheme} title="Toggle theme">
        {theme === 'dark' ? Icons.sun : Icons.moon}
      </button>
    </div>
  );
}
