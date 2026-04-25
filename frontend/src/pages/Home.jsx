import { useEffect, useState } from 'react';
import API from '../api/client';

const FEATURES = [
  { icon: '📄', title: 'Smart PDF Processing', color: '#2AD699', desc: 'Upload curriculum PDFs — AI extracts, cleans and chunks content into study-ready units.' },
  { icon: '🧠', title: 'RAG-Powered Q&A', color: '#22B07D', desc: 'Ask any doubt and get curriculum-grounded answers via Retrieval Augmented Generation.' },
  { icon: '📝', title: 'Auto Quiz Generator', color: '#38BDF8', desc: 'Generate MCQ quizzes from any topic. Scores tracked automatically per student.' },
  { icon: '🎯', title: 'Personalised Paths', color: '#F59E0B', desc: 'AI analyses weak spots to build a custom step-by-step study plan per student.' },
  { icon: '👩‍🏫', title: 'Teacher Insights', color: '#FB923C', desc: 'Class analytics, weak topic detection, and AI teaching suggestions in one dashboard.' },
  { icon: '🌤️', title: 'Weather-Aware Teaching', color: '#38BDF8', desc: 'Real-time weather integration adjusts lesson recommendations.' },
  { icon: '🤖', title: 'Multi-Step AI Agent', color: '#A78BFA', desc: 'Chain-of-thought reasoning agent that plans, researches, and synthesises insights.' },
  { icon: '📅', title: 'Smart Calendar', color: '#22C55E', desc: 'Holiday awareness with AI-powered planning suggestions.' },
];

export default function Home() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    API.get('/system/health').then(r => setHealth(r.data)).catch(() => {});
  }, []);

  const statusCard = (label, ok, okText, failText) => {
    const color = ok ? '#22C55E' : '#F59E0B';
    const bg = ok ? 'rgba(34,197,94,0.06)' : 'rgba(245,158,11,0.06)';
    return (
      <div style={{ flex: 1, minWidth: 160, background: bg, border: `1px solid ${color}30`, borderRadius: 12, padding: '0.7rem 1rem', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
        <div style={{ color, fontWeight: 600, fontSize: '0.9rem', marginTop: 2 }}>
          {ok ? '✅' : '⚠️'} {ok ? okText : failText}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Hero */}
      <div className="hero">
        <div className="hero-icon">🎓</div>
        <h1>MTRX-TriAxis</h1>
        <p>AI-Powered Classroom Assistant — smarter teaching, personalised learning.</p>
        <div className="hero-badges">
          {['🧠 LLM-Powered', '📚 RAG Curriculum', '📊 Real-time Analytics', '🌤️ Weather-Aware', '🤖 Multi-Step Agent'].map(b => (
            <span key={b} className="hero-badge">{b}</span>
          ))}
        </div>
      </div>

      {/* Status Banner */}
      {health && (
        <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {statusCard('LLM Engine', health.ollama, 'Ollama Online', 'Ollama Offline')}
          {statusCard('Curriculum', health.vectorstore, 'Content Ready', 'Not Uploaded')}
          {statusCard('Roster', health.students_count > 0, `${health.students_count} Students`, '0 Students')}
        </div>
      )}

      {/* Features */}
      <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem' }}>✨ Features</h2>
      <div className="feature-grid">
        {FEATURES.map(f => (
          <div key={f.title} className="feature-card">
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${f.color}80, ${f.color}20)`, borderRadius: '16px 16px 0 0' }} />
            <div className="icon">{f.icon}</div>
            <div className="title" style={{ color: f.color }}>{f.title}</div>
            <div className="desc">{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
