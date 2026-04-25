import { useState, useEffect } from 'react';
import API from '../api/client';
import toast from 'react-hot-toast';

export default function QuizGenerator() {
  const [topics, setTopics] = useState([]);
  const [topic, setTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [numQ, setNumQ] = useState(5);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareStudents, setShareStudents] = useState([]);
  const [shareAll, setShareAll] = useState(true);

  useEffect(() => {
    API.get('/curriculum/topics').then(r => { setTopics(r.data.topics || []); if (r.data.topics?.length) setTopic(r.data.topics[0]); });
    API.get('/students').then(r => setStudents(r.data));
  }, []);

  const generate = async () => {
    const finalTopic = customTopic.trim() || topic;
    if (!finalTopic) return toast.error('Select a topic');
    setGenerating(true); setQuiz(null); setResult(null); setAnswers({});
    try {
      const { data } = await API.post('/quiz/generate', { topic: finalTopic, num_questions: numQ });
      if (data.error) { toast.error(data.error); } else { setQuiz(data); toast.success(`Generated ${data.questions.length} questions!`); }
    } catch { toast.error('Failed to generate quiz'); }
    setGenerating(false);
  };

  const evaluate = async () => {
    if (!selectedStudent) return toast.error('Select a student');
    setEvaluating(true);
    try {
      const { data } = await API.post('/quiz/evaluate', { student_id: parseInt(selectedStudent), quiz_data: quiz, answers });
      setResult(data);
      toast.success(`Score: ${data.percentage}%`);
    } catch { toast.error('Failed to evaluate'); }
    setEvaluating(false);
  };

  const shareQuiz = async () => {
    if (!quiz) return;
    setSharing(true);
    try {
      const payload = { quiz_data: quiz, student_ids: shareAll ? [] : shareStudents.map(Number) };
      const { data } = await API.post('/quiz/share', payload);
      toast.success(`🎉 Quiz shared with ${data.assigned_to} students!`);
    } catch { toast.error('Failed to share quiz'); }
    setSharing(false);
  };

  const toggleShareStudent = (id) => {
    setShareStudents(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  return (
    <div>
      <div className="page-header">
        <h2>📝 Quiz Generator</h2>
        <p>Generate MCQ quizzes, evaluate student answers, and share with the class.</p>
      </div>

      {/* Config */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">📚 Topic</label>
            <select className="form-select" value={topic} onChange={e => setTopic(e.target.value)}>
              {topics.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">✏️ Custom Topic (overrides)</label>
            <input className="form-input" value={customTopic} onChange={e => setCustomTopic(e.target.value)} placeholder="Newton's Laws" />
          </div>
          <div className="form-group">
            <label className="form-label">🔢 Questions</label>
            <input className="form-input" type="number" min={3} max={15} value={numQ} onChange={e => setNumQ(parseInt(e.target.value))} />
          </div>
        </div>
        <button className="btn btn-primary" onClick={generate} disabled={generating}>
          {generating ? '⏳ Generating...' : '✨ Generate Quiz'}
        </button>
      </div>

      {/* Quiz */}
      {quiz && quiz.questions && quiz.questions.length > 0 && (
        <div className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="section-title" style={{ margin: 0 }}>📝 {quiz.topic} — {quiz.questions.length} Questions</h3>
          </div>

          {/* Share Panel */}
          <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--info)', background: 'rgba(96,165,250,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h4 style={{ marginBottom: '0.4rem', fontSize: '0.95rem' }}>📤 Share Quiz with Students</h4>
                <p style={{ color: 'var(--text-light)', fontSize: '0.82rem', margin: 0 }}>
                  Students will see this quiz in their portal and can submit answers.
                </p>

                <div style={{ marginTop: '0.6rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer', marginBottom: '0.3rem' }}>
                    <input type="radio" name="shareTarget" checked={shareAll} onChange={() => setShareAll(true)} style={{ accentColor: 'var(--primary)' }} />
                    Share with <strong>all students</strong> ({students.length})
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input type="radio" name="shareTarget" checked={!shareAll} onChange={() => setShareAll(false)} style={{ accentColor: 'var(--primary)' }} />
                    Share with <strong>selected students</strong>
                  </label>
                </div>

                {!shareAll && (
                  <div style={{ marginTop: '0.5rem', maxHeight: 150, overflowY: 'auto', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 8, background: '#fff' }}>
                    {students.map(s => (
                      <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', padding: '2px 0', cursor: 'pointer' }}>
                        <input type="checkbox" checked={shareStudents.includes(s.id)} onChange={() => toggleShareStudent(s.id)} style={{ accentColor: 'var(--primary)' }} />
                        {s.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <button className="btn btn-primary" onClick={shareQuiz} disabled={sharing || (!shareAll && shareStudents.length === 0)}>
                {sharing ? '⏳ Sharing...' : '📤 Share Quiz'}
              </button>
            </div>
          </div>

          {/* Evaluate Form */}
          <div className="form-group" style={{ maxWidth: 300, marginBottom: '1rem' }}>
            <label className="form-label">🎒 Answer as Student (Teacher Eval)</label>
            <select className="form-select" value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
              <option value="">-- Choose --</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} (ID: {s.id})</option>)}
            </select>
          </div>

          {quiz.questions.map((q, qi) => (
            <div key={qi} className="card" style={{ marginBottom: '1rem' }}>
              <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Q{qi + 1}. {q.question}</p>
              {Object.entries(q.options).map(([key, val]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0', cursor: 'pointer', fontSize: '0.88rem' }}>
                  <input type="radio" name={`q${qi}`} value={key} checked={answers[qi] === key}
                    onChange={() => setAnswers(prev => ({ ...prev, [qi]: key }))}
                    style={{ accentColor: 'var(--primary)' }} />
                  <strong>{key}.</strong> {val}
                </label>
              ))}
              {result && result.results && result.results[qi] && (
                <div style={{ marginTop: '0.5rem', padding: '0.5rem', borderRadius: 8, background: result.results[qi].is_correct ? '#F0FDF4' : '#FEF2F2' }}>
                  {result.results[qi].is_correct ? '✅ Correct' : `❌ Wrong — Answer: ${result.results[qi].correct_answer}`}
                  {q.explanation && <div style={{ fontSize: '0.82rem', color: '#4B5563', marginTop: '0.3rem' }}>💡 {q.explanation}</div>}
                </div>
              )}
            </div>
          ))}

          {!result && (
            <button className="btn btn-primary btn-block" onClick={evaluate} disabled={evaluating || !selectedStudent}>
              {evaluating ? '⏳ Evaluating...' : '✅ Submit Answers'}
            </button>
          )}

          {result && (
            <div className="card" style={{ borderLeft: '4px solid var(--primary)', marginTop: '1rem' }}>
              <h3>🏆 Result: {result.score}/{result.max_score} ({result.percentage}%)</h3>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
