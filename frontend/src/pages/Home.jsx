import { useEffect, useState } from 'react';
import API from '../api/client';

const FEATURES = [
  { icon: '📄', title: 'Smart PDF Processing', color: '#34D399', desc: 'Upload curriculum PDFs — AI extracts, cleans and chunks content into study-ready units.' },
  { icon: '🧠', title: 'RAG-Powered Q&A', color: '#22B07D', desc: 'Ask any doubt and get curriculum-grounded answers via Retrieval Augmented Generation.' },
  { icon: '📝', title: 'Auto Quiz Generator', color: '#60A5FA', desc: 'Generate MCQ quizzes from any topic. Scores tracked automatically per student.' },
  { icon: '🎯', title: 'Personalised Paths', color: '#FBBF24', desc: 'AI analyses weak spots to build a custom step-by-step study plan per student.' },
  { icon: '👩‍🏫', title: 'Teacher Insights', color: '#FB923C', desc: 'Class analytics, weak topic detection, and AI teaching suggestions in one dashboard.' },
  { icon: '🌤️', title: 'Weather-Aware', color: '#38BDF8', desc: 'Real-time weather integration adjusts lesson recommendations automatically.' },
  { icon: '🤖', title: 'Multi-Step AI Agent', color: '#A78BFA', desc: 'Chain-of-thought reasoning agent that plans, researches, and synthesises insights.' },
  { icon: '📅', title: 'Smart Calendar', color: '#34D399', desc: 'Holiday awareness with AI-powered planning suggestions.' },
];

export default function Home() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    API.get('/system/health').then(r => setHealth(r.data)).catch(() => {});
  }, []);

  const statusCard = (label, ok, okText, failText) => {
    const color = ok ? '#34D399' : '#FBBF24';
    return (
      <div style={{ flex: 1, minWidth: 160, background: `${color}08`, border: `1px solid ${color}20`, borderRadius: 14, padding: '0.8rem 1rem', backdropFilter: 'blur(10px)' }}>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</div>
        <div style={{ color, fontWeight: 700, fontSize: '0.88rem', marginTop: 3 }}>
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

      {/* Status */}
      {health && (
        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {statusCard('LLM Engine', health.ollama, 'Ollama Online', 'Ollama Offline')}
          {statusCard('Curriculum', health.vectorstore, 'Content Ready', 'Not Uploaded')}
          {statusCard('Roster', health.students_count > 0, `${health.students_count} Students`, '0 Students')}
        </div>
      )}

      {/* Features */}
      <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text)' }}>✨ Platform Features</h2>
      <div className="feature-grid">
        {FEATURES.map(f => (
          <div key={f.title} className="feature-card">
            <div className="icon">{f.icon}</div>
            <div className="title" style={{ color: f.color }}>{f.title}</div>
            <div className="desc">{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
