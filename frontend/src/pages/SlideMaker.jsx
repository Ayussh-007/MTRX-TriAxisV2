import { useState, useEffect } from 'react';
import API from '../api/client';
import toast from 'react-hot-toast';

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

  useEffect(() => {
    API.get('/curriculum/topics').then(r => { setTopics(r.data.topics || []); if (r.data.topics?.length) setTopic(r.data.topics[0]); });
  }, []);

  const generate = async () => {
    const finalTopic = custom.trim() || topic;
    if (!finalTopic) return toast.error('Select a topic');
    setGenerating(true);
    try {
      const response = await API.post('/slides/generate', {
        topic: finalTopic, num_slides: numSlides, teaching_style: style,
        difficulty, include_examples: examples, include_key_terms: keyTerms,
        include_quiz: quiz, teacher_name: teacher,
      }, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `MTRX_${finalTopic.replace(/\s+/g, '_').slice(0, 30)}.pptx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Presentation downloaded!');
    } catch { toast.error('Generation failed'); }
    setGenerating(false);
  };

  return (
    <div>
      <div className="page-header">
        <h2>🖥️ Lesson Slide Maker</h2>
        <p>Generate ready-to-present PowerPoint from your curriculum.</p>
      </div>

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
      </div>

      <button className="btn btn-primary" onClick={generate} disabled={generating} style={{ minWidth: 250 }}>
        {generating ? '⏳ Generating (30-60s)...' : '✨ Generate Presentation'}
      </button>
    </div>
  );
}
