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
  const [showAnswers, setShowAnswers] = useState(true);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    API.get('/curriculum/topics').then(r => { setTopics(r.data.topics || []); if (r.data.topics?.length) setTopic(r.data.topics[0]); });
    API.get('/students').then(r => setStudents(r.data));
  }, []);

  const generate = async () => {
    const finalTopic = customTopic.trim() || topic;
    if (!finalTopic) return toast.error('Select a topic');
    setGenerating(true); setQuiz(null); setResult(null); setAnswers({}); setEditMode(false);
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
    setShareStudents(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  // ── Edit functions ──
  const updateQuestion = (qi, field, value) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => i === qi ? { ...q, [field]: value } : q),
    }));
  };

  const updateOption = (qi, optKey, value) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === qi ? { ...q, options: { ...q.options, [optKey]: value } } : q
      ),
    }));
  };

  const removeQuestion = (qi) => {
    setQuiz(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== qi) }));
    toast.success('Question removed');
  };

  const addQuestion = () => {
    setQuiz(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        { question: 'New question — edit this', options: { A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D' }, correct: 'A', explanation: 'Explanation here.' },
      ],
    }));
  };

  return (
    <div>
      <div className="page-header">
        <h2>📝 Quiz Generator</h2>
        <p>Generate MCQ quizzes, review and edit, then share with students.</p>
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
          {/* Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 className="section-title" style={{ margin: 0 }}>📝 {quiz.topic} — {quiz.questions.length} Questions</h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button className={`btn btn-sm ${showAnswers ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setShowAnswers(!showAnswers)}>
                {showAnswers ? '👁️ Answers Shown' : '🙈 Answers Hidden'}
              </button>
              <button className={`btn btn-sm ${editMode ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setEditMode(!editMode)}>
                {editMode ? '✅ Done Editing' : '✏️ Edit Quiz'}
              </button>
            </div>
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

          {/* Evaluate Form (Teacher quick-eval) */}
          <div className="form-group" style={{ maxWidth: 300, marginBottom: '1rem' }}>
            <label className="form-label">🎒 Answer as Student (Teacher Quick-Eval)</label>
            <select className="form-select" value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
              <option value="">-- Choose --</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} (ID: {s.id})</option>)}
            </select>
          </div>

          {/* Questions */}
          {quiz.questions.map((q, qi) => (
            <div key={qi} className="card" style={{ marginBottom: '1rem', borderLeft: showAnswers ? `3px solid ${q.correct ? '#22C55E' : 'var(--primary)'}` : '3px solid var(--border)' }}>
              {/* Question */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  {editMode ? (
                    <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Question {qi + 1}</label>
                      <textarea className="form-textarea" value={q.question} onChange={e => updateQuestion(qi, 'question', e.target.value)} rows={2} style={{ fontWeight: 600 }} />
                    </div>
                  ) : (
                    <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Q{qi + 1}. {q.question}</p>
                  )}
                </div>
                {editMode && (
                  <button className="btn btn-danger btn-sm" onClick={() => removeQuestion(qi)} title="Remove question" style={{ flexShrink: 0 }}>🗑️</button>
                )}
              </div>

              {/* Options */}
              {Object.entries(q.options).map(([key, val]) => {
                const isCorrect = key === q.correct;
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0' }}>
                    {/* Radio for answering */}
                    <input type="radio" name={`q${qi}`} value={key} checked={answers[qi] === key}
                      onChange={() => setAnswers(prev => ({ ...prev, [qi]: key }))}
                      style={{ accentColor: 'var(--primary)', flexShrink: 0 }} />

                    {editMode ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1 }}>
                        <strong style={{ color: isCorrect && showAnswers ? '#22C55E' : '#374151', width: 20 }}>{key}.</strong>
                        <input className="form-input" value={val} onChange={e => updateOption(qi, key, e.target.value)} style={{ flex: 1 }} />
                      </div>
                    ) : (
                      <label style={{ cursor: 'pointer', fontSize: '0.88rem', flex: 1, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <strong style={{ color: isCorrect && showAnswers ? '#22C55E' : '#374151' }}>{key}.</strong>
                        <span style={{ color: isCorrect && showAnswers ? '#22C55E' : undefined, fontWeight: isCorrect && showAnswers ? 600 : 400 }}>
                          {val}
                        </span>
                        {isCorrect && showAnswers && <span style={{ color: '#22C55E', fontSize: '0.75rem', fontWeight: 700 }}>✓ CORRECT</span>}
                      </label>
                    )}
                  </div>
                );
              })}

              {/* Correct answer selector in edit mode */}
              {editMode && (
                <div className="form-group" style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Correct Answer</label>
                  <select className="form-select" value={q.correct || ''} onChange={e => updateQuestion(qi, 'correct', e.target.value)} style={{ maxWidth: 100 }}>
                    {Object.keys(q.options).map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
              )}

              {/* Explanation in edit mode */}
              {editMode && (
                <div className="form-group" style={{ marginTop: '0.3rem' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Explanation</label>
                  <textarea className="form-textarea" value={q.explanation || ''} onChange={e => updateQuestion(qi, 'explanation', e.target.value)} rows={2} />
                </div>
              )}

              {/* Answer key (read-only view) */}
              {!editMode && showAnswers && (
                <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.7rem', borderRadius: 8, background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                  <div style={{ fontSize: '0.82rem', color: '#166534' }}>
                    <strong>✅ Answer: {q.correct}</strong>{q.explanation && ` — ${q.explanation}`}
                  </div>
                </div>
              )}

              {/* Evaluation result */}
              {result && result.results && result.results[qi] && (
                <div style={{ marginTop: '0.5rem', padding: '0.5rem', borderRadius: 8, background: result.results[qi].is_correct ? '#F0FDF4' : '#FEF2F2' }}>
                  {result.results[qi].is_correct ? '✅ Correct' : `❌ Wrong — Answer: ${result.results[qi].correct_answer}`}
                </div>
              )}
            </div>
          ))}

          {/* Add question button in edit mode */}
          {editMode && (
            <button className="btn btn-secondary btn-block" onClick={addQuestion} style={{ marginBottom: '1rem' }}>
              + Add New Question
            </button>
          )}

          {!result && (
            <button className="btn btn-primary btn-block" onClick={evaluate} disabled={evaluating || !selectedStudent}>
              {evaluating ? '⏳ Evaluating...' : '✅ Submit Answers (Teacher Quick-Eval)'}
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
