import { useState, useEffect } from 'react';
import API from '../api/client';
import toast from 'react-hot-toast';

const SLIDE_ICONS = { title: '🎬', objectives: '🎯', content: '📖', summary: '✅', key_terms: '📚', quiz: '🧠' };

export default function SlideMaker() {
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
    API.get('/curriculum/topics').then(r => { setTopics(r.data.topics || []); if (r.data.topics?.length) setTopic(r.data.topics[0]); });
  }, []);

  const generate = async () => {
    const finalTopic = custom.trim() || topic;
    if (!finalTopic) return toast.error('Select a topic');
    setGenerating(true); setSlides(null); setEditIdx(null);
    try {
      const { data } = await API.post('/slides/preview', {
        topic: finalTopic, num_slides: numSlides, teaching_style: style,
        difficulty, include_examples: examples, include_key_terms: keyTerms,
        include_quiz: quiz, teacher_name: teacher,
      });
      setSlides(data.slides);
      toast.success(`Generated ${data.slides.length} slides! Edit below, then download.`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Generation failed');
    }
    setGenerating(false);
  };

  const download = async () => {
    if (!slides) return;
    setDownloading(true);
    try {
      const response = await API.post('/slides/build', {
        slides, topic: custom.trim() || topic, teacher_name: teacher,
      }, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `MTRX_${(custom.trim() || topic).replace(/\s+/g, '_').slice(0, 30)}.pptx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Presentation downloaded!');
    } catch { toast.error('Download failed'); }
    setDownloading(false);
  };

  const updateSlide = (idx, field, value) => {
    setSlides(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const updateBullet = (slideIdx, bulletIdx, value) => {
    setSlides(prev => prev.map((s, i) => {
      if (i !== slideIdx) return s;
      const bullets = [...(s.bullets || [])];
      bullets[bulletIdx] = value;
      return { ...s, bullets };
    }));
  };

  const addBullet = (slideIdx) => {
    setSlides(prev => prev.map((s, i) => {
      if (i !== slideIdx) return s;
      return { ...s, bullets: [...(s.bullets || []), 'New bullet point — edit this with your content.'] };
    }));
  };

  const removeBullet = (slideIdx, bulletIdx) => {
    setSlides(prev => prev.map((s, i) => {
      if (i !== slideIdx) return s;
      return { ...s, bullets: (s.bullets || []).filter((_, bi) => bi !== bulletIdx) };
    }));
  };

  const deleteSlide = (idx) => {
    setSlides(prev => prev.filter((_, i) => i !== idx));
    if (editIdx === idx) setEditIdx(null);
    toast.success('Slide removed');
  };

  const moveSlide = (idx, dir) => {
    const ni = idx + dir;
    if (ni < 0 || ni >= slides.length) return;
    setSlides(prev => {
      const copy = [...prev];
      [copy[idx], copy[ni]] = [copy[ni], copy[idx]];
      return copy;
    });
    setEditIdx(ni);
  };

  return (
    <div>
      <div className="page-header">
        <h2>🖥️ Lesson Slide Maker</h2>
        <p>Generate → Preview & Edit → Download polished PowerPoint presentations.</p>
      </div>

      {/* Config */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--primary-dark)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.8rem' }}>⚙️ Presentation Settings</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">📚 Topic</label>
            <select className="form-select" value={topic} onChange={e => setTopic(e.target.value)}>
              {topics.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">✏️ Custom Topic</label>
            <input className="form-input" value={custom} onChange={e => setCustom(e.target.value)} placeholder="Newton's Laws" />
          </div>
          <div className="form-group">
            <label className="form-label">👩‍🏫 Teacher Name</label>
            <input className="form-input" value={teacher} onChange={e => setTeacher(e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">🗂️ Slides ({numSlides})</label>
            <input type="range" min={4} max={15} value={numSlides} onChange={e => setNumSlides(parseInt(e.target.value))} style={{ width: '100%' }} />
          </div>
          <div className="form-group">
            <label className="form-label">🎨 Teaching Style</label>
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
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={examples} onChange={e => setExamples(e.target.checked)} style={{ accentColor: 'var(--primary)' }} /> 💡 Examples
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={keyTerms} onChange={e => setKeyTerms(e.target.checked)} style={{ accentColor: 'var(--primary)' }} /> 📚 Key Terms
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={quiz} onChange={e => setQuiz(e.target.checked)} style={{ accentColor: 'var(--primary)' }} /> 🧠 Quiz Slide
          </label>
        </div>
        <button className="btn btn-primary" onClick={generate} disabled={generating} style={{ minWidth: 250 }}>
          {generating ? '⏳ Generating (30-60s)...' : '✨ Generate & Preview Slides'}
        </button>
      </div>

      {/* Preview & Edit */}
      {slides && slides.length > 0 && (
        <div className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="section-title" style={{ margin: 0 }}>📑 Slide Preview ({slides.length} slides) — Click to edit</h3>
            <button className="btn btn-primary" onClick={download} disabled={downloading}>
              {downloading ? '⏳ Building PPTX...' : '📥 Download PPTX'}
            </button>
          </div>

          {slides.map((s, idx) => (
            <div key={idx} className="card" style={{
              marginBottom: '0.6rem',
              borderLeft: `4px solid ${s.type === 'title' ? '#7C6FFF' : s.type === 'summary' ? '#22C55E' : s.type === 'key_terms' ? '#60A5FA' : '#22B07D'}`,
              background: editIdx === idx ? '#FAFBFC' : '#fff',
            }}>
              {/* Slide Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: editIdx === idx ? '0.8rem' : 0 }}>
                <div onClick={() => setEditIdx(editIdx === idx ? null : idx)} style={{ cursor: 'pointer', flex: 1 }}>
                  <span style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase' }}>
                    {SLIDE_ICONS[s.type] || '📖'} SLIDE {idx + 1} · {s.type}
                  </span>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: 2 }}>{s.title}</div>
                  {!editIdx && s.bullets && (
                    <div style={{ color: '#6B7280', fontSize: '0.78rem', marginTop: 2 }}>
                      {s.bullets.length} bullets · {s.explanation ? '✓ explanation' : ''} · {s.speaker_notes ? '✓ notes' : ''}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => moveSlide(idx, -1)} disabled={idx === 0} title="Move up">↑</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => moveSlide(idx, 1)} disabled={idx === slides.length - 1} title="Move down">↓</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditIdx(editIdx === idx ? null : idx)}>
                    {editIdx === idx ? '✕' : '✏️'}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteSlide(idx)} title="Delete slide">🗑️</button>
                </div>
              </div>

              {/* Expanded Edit */}
              {editIdx === idx && (
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
                        <div key={bi} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.3rem' }}>
                          <span style={{ color: '#22B07D', fontWeight: 700, fontSize: '0.85rem', width: 20 }}>▸</span>
                          <input className="form-input" value={b} onChange={e => updateBullet(idx, bi, e.target.value)} style={{ flex: 1 }} />
                          <button className="btn btn-danger btn-sm" onClick={() => removeBullet(idx, bi)} style={{ padding: '0.25rem 0.5rem' }}>✕</button>
                        </div>
                      ))}
                      <button className="btn btn-secondary btn-sm" onClick={() => addBullet(idx)} style={{ marginTop: '0.3rem' }}>+ Add Bullet</button>
                    </div>
                  )}

                  {(s.type !== 'title') && (
                    <div className="form-group">
                      <label className="form-label">Explanation (right panel)</label>
                      <textarea className="form-textarea" value={s.explanation || ''} onChange={e => updateSlide(idx, 'explanation', e.target.value)} rows={3} />
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Speaker Notes</label>
                    <textarea className="form-textarea" value={s.speaker_notes || ''} onChange={e => updateSlide(idx, 'speaker_notes', e.target.value)} rows={3}
                      style={{ fontStyle: 'italic', color: '#4B5563' }} />
                  </div>
                </div>
              )}
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={download} disabled={downloading} style={{ minWidth: 300 }}>
              {downloading ? '⏳ Building PPTX...' : '📥 Download Edited Presentation'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
