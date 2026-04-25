import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const FEATURES = [
  {
    icon: '📄',
    title: 'Smart PDF Processing',
    desc: 'Upload curriculum PDFs and our AI extracts, cleans, and vectorizes content into study-ready units using advanced RAG pipelines.',
    color: '#34D399',
    tag: 'Curriculum Engine',
  },
  {
    icon: '📝',
    title: 'AI Quiz Generator',
    desc: 'Generate editable MCQ quizzes from any topic. Review answers, edit questions, and share instantly with your entire class.',
    color: '#60A5FA',
    tag: 'Assessment',
  },
  {
    icon: '🖥️',
    title: 'Lesson Slide Maker',
    desc: 'Auto-generate rich PowerPoint presentations with preview, inline editing, and one-click PPTX download.',
    color: '#A78BFA',
    tag: 'Presentations',
  },
  {
    icon: '📊',
    title: 'Teacher Analytics',
    desc: 'Comprehensive class dashboard with performance trends, risk heatmaps, weak topic detection, and AI-powered teaching suggestions.',
    color: '#FB923C',
    tag: 'Analytics',
  },
  {
    icon: '🎯',
    title: 'Personalized Learning',
    desc: 'AI generates custom study paths per student by analyzing weak spots, attendance patterns, and quiz performance.',
    color: '#FBBF24',
    tag: 'Student AI',
  },
  {
    icon: '🤖',
    title: 'Multi-Step AI Agent',
    desc: 'Chain-of-thought reasoning engine that researches, analyzes, and synthesizes comprehensive student intervention plans.',
    color: '#F472B6',
    tag: 'Advanced AI',
  },
  {
    icon: '📋',
    title: 'Smart Attendance',
    desc: 'Interactive grid-based attendance with click-to-toggle, holiday awareness, monthly summaries, and trend tracking.',
    color: '#22C55E',
    tag: 'Tracking',
  },
  {
    icon: '🌤️',
    title: 'Weather-Aware Teaching',
    desc: 'Real-time weather integration adjusts lesson recommendations and adapts teaching strategies automatically.',
    color: '#38BDF8',
    tag: 'Intelligence',
  },
];

const STATS = [
  { value: '10+', label: 'AI Features' },
  { value: '100%', label: 'Local & Private' },
  { value: '∞', label: 'Quiz Generation' },
  { value: '<60s', label: 'Slide Creation' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const featuresRef = useRef(null);
  const statsRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Scroll-triggered animations using IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );

    document.querySelectorAll('.land-animate').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Interactive mouse-follow gradient
  useEffect(() => {
    const hero = document.querySelector('.land-hero');
    if (!hero) return;
    const handleMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      hero.style.setProperty('--mx', `${x}%`);
      hero.style.setProperty('--my', `${y}%`);
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <div className="land-root">
      {/* ─── Interactive Background ─── */}
      <div className="land-bg">
        <div className="land-orb land-orb-1" />
        <div className="land-orb land-orb-2" />
        <div className="land-orb land-orb-3" />
        <div className="land-grid" />
      </div>

      {/* ─── Hero Section ─── */}
      <section className="land-hero">
        {/* Login/Signup CTA at top-right */}
        <div className="land-hero-actions">
          <button className="land-btn land-btn-ghost" onClick={() => navigate('/auth')}>
            Log in
          </button>
          <button className="land-btn land-btn-primary" onClick={() => navigate('/auth')}>
            Get Started →
          </button>
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
              ▶ Explore Features
            </button>
          </div>

          <div className="land-social-proof">
            <div className="land-avatars">
              {['🧑‍🏫', '👩‍🏫', '👨‍🏫', '🧑‍🎓'].map((e, i) => (
                <div key={i} className="land-avatar">{e}</div>
              ))}
            </div>
            <div>
              <div className="land-stars">★★★★★</div>
              <span className="land-proof-text">Trusted by educators everywhere</span>
            </div>
          </div>
        </div>

        {/* Floating Dashboard Preview Card */}
        <div className="land-hero-card land-animate">
          <div className="land-card-header">
            <span>Class Overview</span>
            <span className="land-card-dots">•••</span>
          </div>
          <div className="land-card-stat-big">
            <span className="land-card-number">92.4%</span>
            <span className="land-card-badge-green">↑ +8%</span>
          </div>
          <div className="land-card-chart">
            {[35, 50, 45, 70, 65, 80, 75, 92].map((h, i) => (
              <div key={i} className="land-chart-bar" style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          <div className="land-card-row">
            <div><span className="land-card-label">📊 Avg Score</span><strong>85.2%</strong></div>
            <div><span className="land-card-label">📅 Attendance</span><strong>94.1%</strong></div>
          </div>
          <div className="land-card-notif">
            <span>🎉</span>
            <div>
              <strong>New Milestone!</strong>
              <small>Class performance up 12% this month</small>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="land-stats" ref={statsRef}>
        {STATS.map((s, i) => (
          <div key={i} className="land-stat land-animate" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="land-stat-value">{s.value}</div>
            <div className="land-stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      {/* ─── Features Section ─── */}
      <section className="land-features" ref={featuresRef}>
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
              <div className="land-feature-icon">{f.icon}</div>
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

      {/* ─── Architecture Section ─── */}
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
              {['🧠 Gemma 4 E4B', '🔗 LangChain', '🗄️ FAISS', '💾 SQLite', '⚡ FastAPI', '⚛️ React'].map((b) => (
                <span key={b} className="land-arch-badge">{b}</span>
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

      {/* ─── CTA Section ─── */}
      <section className="land-cta land-animate" ref={ctaRef}>
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
          <span>🎓</span> MTRX-TriAxis
        </div>
        <div className="land-footer-text">
          © 2026 MTRX-TriAxis. AI-Powered Classroom Assistant.
        </div>
        <div className="land-footer-links">
          <span>Built with ❤️</span>
          <span>•</span>
          <span>Privacy First</span>
          <span>•</span>
          <span>100% Local</span>
        </div>
      </footer>

      {/* ─── Floating Theme Toggle ─── */}
      <button className="land-theme-toggle" onClick={toggleTheme} title="Toggle theme">
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </div>
  );
}
