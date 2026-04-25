import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api/client';
import toast from 'react-hot-toast';

const SLIDE_ICONS = { title: '🎬', objectives: '🎯', content: '📖', summary: '✅', key_terms: '📚', quiz: '🧠' };
const TYPE_COLORS = { title: '#A78BFA', objectives: '#FBBF24', content: '#34D399', summary: '#60A5FA', key_terms: '#F472B6', quiz: '#FB923C' };

export default function SlideMaker() {
  const { classroomId } = useParams();
  const [topics, setTopics] = useState([]);
  const [topic, setTopic] = useState('');
  const [custom, setCustom] = useState('');
  const [numSlides, setNumSlides] = useState(7);
  const [style, setStyle] = useState('Visual');
  const [difficulty, setDifficulty] = useState('medium');
  const [teacher, setTeacher] = useState('Teacher');
  const [examples, setExamples] = useState(true);
  const [keyTerms, setKeyTerms] = useState(true);
  const [quiz, setQuiz] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [slides, setSlides] = useState(null);
  const [editIdx, setEditIdx] = useState(null);

  useEffect(() => {
    API.get('/curriculum/topics').then(r => { setTopics(r.data.topics || []); if (r.data.topics?.length) setTopic(r.data.topics[0]); }).catch(() => {});
  }, []);

  const generate = async () => {
    const finalTopic = custom.trim() || topic;
    if (!finalTopic) return toast.error('Enter a topic');
    setGenerating(true); setSlides(null); setEditIdx(null);
    try {
      const { data } = await API.post('/slides/preview', {
        topic: finalTopic, num_slides: numSlides, teaching_style: style,
        difficulty, include_examples: examples, include_key_terms: keyTerms,
        include_quiz: quiz, teacher_name: teacher,
      });
      setSlides(data.slides);
      toast.success(`Generated ${data.slides.length} slides!`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Generation failed');
    }
    setGenerating(false);
  };

  const download = async () => {
    if (!slides) return;
    setDownloading(true);
    try {
      const response = await fetch('/api/slides/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides, topic: custom.trim() || topic, teacher_name: teacher }),
      });
      if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error(err.detail || 'Build failed'); }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `MTRX_${(custom.trim() || topic).replace(/\s+/g, '_').slice(0, 30)}.pptx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Presentation downloaded!');
    } catch (err) { toast.error(err.message || 'Download failed'); }
    setDownloading(false);
  };

  const updateSlide = (idx, field, value) => setSlides(p => p.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  const updateBullet = (si, bi, v) => setSlides(p => p.map((s, i) => { if (i !== si) return s; const b = [...(s.bullets || [])]; b[bi] = v; return { ...s, bullets: b }; }));
  const addBullet = (si) => setSlides(p => p.map((s, i) => i === si ? { ...s, bullets: [...(s.bullets || []), 'New bullet — edit this.'] } : s));
  const removeBullet = (si, bi) => setSlides(p => p.map((s, i) => i === si ? { ...s, bullets: (s.bullets || []).filter((_, j) => j !== bi) } : s));
  const deleteSlide = (idx) => { setSlides(p => p.filter((_, i) => i !== idx)); if (editIdx === idx) setEditIdx(null); toast.success('Removed'); };
  const moveSlide = (idx, dir) => { const n = idx + dir; if (n < 0 || n >= slides.length) return; setSlides(p => { const c = [...p]; [c[idx], c[n]] = [c[n], c[idx]]; return c; }); setEditIdx(n); };

  return (
    <div>
      <div className="page-header">
        <h2>🖥️ Lesson Slide Maker</h2>
        <p>Generate → Preview & Edit → Download polished PowerPoint presentations.</p>
      </div>

      {/* Config */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--primary-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '0.8rem' }}>⚙️ Presentation Settings</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">📚 Topic</label>
            <select className="form-select" value={topic} onChange={e => setTopic(e.target.value)}>
              {topics.length === 0 && <option value="">No curriculum — use custom topic</option>}
              {topics.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">✏️ Custom Topic</label>
            <input className="form-input" value={custom} onChange={e => setCustom(e.target.value)} placeholder="e.g. Newton's Laws of Motion" />
          </div>
          <div className="form-group">
            <label className="form-label">👩‍🏫 Teacher Name</label>
            <input className="form-input" value={teacher} onChange={e => setTeacher(e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">🗂️ Slides: <strong style={{ color: 'var(--primary-light)' }}>{numSlides}</strong></label>
            <input type="range" min={4} max={15} value={numSlides} onChange={e => setNumSlides(parseInt(e.target.value))} style={{ width: '100%', marginTop: 4 }} />
          </div>
          <div className="form-group">
            <label className="form-label">🎨 Style</label>
            <select className="form-select" value={style} onChange={e => setStyle(e.target.value)}>
              {['Visual', 'Storytelling', 'Socratic', 'Direct Instruction', 'Problem-Based'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">🎯 Difficulty</label>
            <select className="form-select" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
              {['easy', 'medium', 'hard'].map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', margin: '0.8rem 0' }}>
          {[
            { val: examples, set: setExamples, label: '💡 Examples' },
            { val: keyTerms, set: setKeyTerms, label: '📚 Key Terms' },
            { val: quiz, set: setQuiz, label: '🧠 Quiz Slide' },
          ].map(c => (
            <label key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={c.val} onChange={e => c.set(e.target.checked)} /> {c.label}
            </label>
          ))}
        </div>
        <button className="btn btn-primary" onClick={generate} disabled={generating} style={{ minWidth: 250 }}>
          {generating ? '⏳ Generating (30-60s)...' : '✨ Generate & Preview Slides'}
        </button>
      </div>

      {/* Preview & Edit */}
      {slides && slides.length > 0 && (
        <div className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 className="section-title" style={{ margin: 0 }}>📑 {slides.length} Slides — Click to edit, then download</h3>
            <button className="btn btn-primary" onClick={download} disabled={downloading}>
              {downloading ? '⏳ Building...' : '📥 Download PPTX'}
            </button>
          </div>

          {slides.map((s, idx) => {
            const accentColor = TYPE_COLORS[s.type] || '#34D399';
            const isOpen = editIdx === idx;
            return (
              <div key={idx} className="card" style={{
                marginBottom: '0.7rem',
                borderLeft: `3px solid ${accentColor}`,
                background: isOpen ? 'rgba(255,255,255,0.04)' : undefined,
              }}>
                {/* Slide Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isOpen ? '1rem' : 0 }}>
                  <div onClick={() => setEditIdx(isOpen ? null : idx)} style={{ cursor: 'pointer', flex: 1 }}>
                    <span style={{ fontSize: '0.68rem', color: accentColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {SLIDE_ICONS[s.type] || '📖'} Slide {idx + 1} · {s.type}
                    </span>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: 2, color: 'var(--text)' }}>{s.title}</div>
                    {!isOpen && s.bullets && (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.76rem', marginTop: 2 }}>
                        {s.bullets.length} bullets{s.explanation ? ' · ✓ explanation' : ''}{s.speaker_notes ? ' · ✓ notes' : ''}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => moveSlide(idx, -1)} disabled={idx === 0}>↑</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => moveSlide(idx, 1)} disabled={idx === slides.length - 1}>↓</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditIdx(isOpen ? null : idx)}>{isOpen ? '✕' : '✏️'}</button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteSlide(idx)}>🗑️</button>
                  </div>
                </div>

                {/* Expanded Edit */}
                {isOpen && (
                  <div>
                    <div className="form-group">
                      <label className="form-label">Title</label>
                      <input className="form-input" value={s.title || ''} onChange={e => updateSlide(idx, 'title', e.target.value)} />
                    </div>

                    {s.type === 'title' && (
                      <>
                        <div className="form-group">
                          <label className="form-label">Subtitle</label>
                          <input className="form-input" value={s.subtitle || ''} onChange={e => updateSlide(idx, 'subtitle', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Overview</label>
                          <textarea className="form-textarea" value={s.overview || ''} onChange={e => updateSlide(idx, 'overview', e.target.value)} rows={3} />
                        </div>
                      </>
                    )}

                    {s.bullets && (
                      <div className="form-group">
                        <label className="form-label">Bullet Points</label>
                        {s.bullets.map((b, bi) => (
                          <div key={bi} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <span style={{ color: accentColor, fontWeight: 700, fontSize: '0.85rem', width: 18 }}>▸</span>
                            <input className="form-input" value={b} onChange={e => updateBullet(idx, bi, e.target.value)} style={{ flex: 1 }} />
                            <button className="btn btn-danger btn-sm" onClick={() => removeBullet(idx, bi)} style={{ padding: '0.2rem 0.5rem' }}>✕</button>
                          </div>
                        ))}
                        <button className="btn btn-secondary btn-sm" onClick={() => addBullet(idx)} style={{ marginTop: '0.3rem' }}>+ Add Bullet</button>
                      </div>
                    )}

                    {s.type !== 'title' && (
                      <div className="form-group">
                        <label className="form-label">Explanation</label>
                        <textarea className="form-textarea" value={s.explanation || ''} onChange={e => updateSlide(idx, 'explanation', e.target.value)} rows={3} />
                      </div>
                    )}

                    <div className="form-group">
                      <label className="form-label">Speaker Notes</label>
                      <textarea className="form-textarea" value={s.speaker_notes || ''} onChange={e => updateSlide(idx, 'speaker_notes', e.target.value)} rows={3} style={{ fontStyle: 'italic' }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.2rem' }}>
            <button className="btn btn-primary" onClick={download} disabled={downloading} style={{ minWidth: 300, padding: '0.75rem 2rem' }}>
              {downloading ? '⏳ Building PPTX...' : '📥 Download Edited Presentation'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
