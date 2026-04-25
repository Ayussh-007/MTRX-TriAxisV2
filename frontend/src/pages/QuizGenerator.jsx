import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api/client';
import toast from 'react-hot-toast';

export default function QuizGenerator() {
  const { classroomId } = useParams();
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
    API.get('/curriculum/topics').then(r => { setTopics(r.data.topics || []); if (r.data.topics?.length) setTopic(r.data.topics[0]); }).catch(() => {});
    // Fetch students from classroom if scoped, otherwise global
    const studentsEndpoint = classroomId ? `/classrooms/${classroomId}/students` : '/students';
    API.get(studentsEndpoint).then(r => setStudents(r.data.students || r.data)).catch(() => {});
  }, [classroomId]);

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
      setResult(data); toast.success(`Score: ${data.percentage}%`);
    } catch { toast.error('Failed to evaluate'); }
    setEvaluating(false);
  };

  const shareQuiz = async () => {
    if (!quiz) return;
    setSharing(true);
    try {
      const { data } = await API.post('/quiz/share', { quiz_data: quiz, student_ids: shareAll ? [] : shareStudents.map(Number) });
      toast.success(`🎉 Quiz shared with ${data.assigned_to} students!`);
    } catch { toast.error('Failed to share quiz'); }
    setSharing(false);
  };

  const toggleShareStudent = (id) => setShareStudents(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id]);

  const updateQuestion = (qi, field, value) => setQuiz(p => ({ ...p, questions: p.questions.map((q, i) => i === qi ? { ...q, [field]: value } : q) }));
  const updateOption = (qi, k, v) => setQuiz(p => ({ ...p, questions: p.questions.map((q, i) => i === qi ? { ...q, options: { ...q.options, [k]: v } } : q) }));
  const removeQuestion = (qi) => { setQuiz(p => ({ ...p, questions: p.questions.filter((_, i) => i !== qi) })); toast.success('Removed'); };
  const addQuestion = () => setQuiz(p => ({
    ...p, questions: [...p.questions, { question: 'New question — edit this', options: { A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D' }, correct: 'A', explanation: '' }],
  }));

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
            <label className="form-label">✏️ Custom Topic</label>
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
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className={`btn btn-sm ${showAnswers ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setShowAnswers(!showAnswers)}>
                {showAnswers ? '👁️ Answers Shown' : '🙈 Answers Hidden'}
              </button>
              <button className={`btn btn-sm ${editMode ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setEditMode(!editMode)}>
                {editMode ? '✅ Done Editing' : '✏️ Edit Quiz'}
              </button>
            </div>
          </div>

          {/* Share Panel */}
          <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '3px solid var(--info)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h4 style={{ marginBottom: '0.4rem', fontSize: '0.95rem', color: 'var(--text)' }}>📤 Share with Students</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>Students will see this in their portal.</p>
                <div style={{ marginTop: '0.6rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>
                    <input type="radio" name="shareTarget" checked={shareAll} onChange={() => setShareAll(true)} /> All students ({students.length})
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                    <input type="radio" name="shareTarget" checked={!shareAll} onChange={() => setShareAll(false)} /> Selected students
                  </label>
                </div>
                {!shareAll && (
                  <div style={{ marginTop: '0.5rem', maxHeight: 140, overflowY: 'auto', padding: '0.5rem', border: '1px solid var(--glass-border)', borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                    {students.map(s => (
                      <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', padding: '2px 0', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <input type="checkbox" checked={shareStudents.includes(s.id)} onChange={() => toggleShareStudent(s.id)} /> {s.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <button className="btn btn-primary" onClick={shareQuiz} disabled={sharing || (!shareAll && shareStudents.length === 0)}>
                {sharing ? '⏳...' : '📤 Share Quiz'}
              </button>
            </div>
          </div>

          {/* Teacher Quick Eval */}
          <div className="form-group" style={{ maxWidth: 300, marginBottom: '1rem' }}>
            <label className="form-label">🎒 Answer as Student (Teacher Eval)</label>
            <select className="form-select" value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
              <option value="">-- Choose --</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Questions */}
          {quiz.questions.map((q, qi) => (
            <div key={qi} className="card" style={{ marginBottom: '1rem', borderLeft: showAnswers ? '3px solid #34D399' : '3px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  {editMode ? (
                    <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                      <label className="form-label" style={{ fontSize: '0.72rem' }}>Question {qi + 1}</label>
                      <textarea className="form-textarea" value={q.question} onChange={e => updateQuestion(qi, 'question', e.target.value)} rows={2} style={{ fontWeight: 600 }} />
                    </div>
                  ) : (
                    <p style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text)' }}>Q{qi + 1}. {q.question}</p>
                  )}
                </div>
                {editMode && <button className="btn btn-danger btn-sm" onClick={() => removeQuestion(qi)}>🗑️</button>}
              </div>

              {Object.entries(q.options).map(([key, val]) => {
                const isCorrect = key === q.correct;
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0' }}>
                    <input type="radio" name={`q${qi}`} value={key} checked={answers[qi] === key} onChange={() => setAnswers(p => ({ ...p, [qi]: key }))} />
                    {editMode ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1 }}>
                        <strong style={{ color: isCorrect && showAnswers ? '#34D399' : 'var(--text-muted)', width: 20 }}>{key}.</strong>
                        <input className="form-input" value={val} onChange={e => updateOption(qi, key, e.target.value)} style={{ flex: 1 }} />
                      </div>
                    ) : (
                      <label style={{ cursor: 'pointer', fontSize: '0.88rem', flex: 1, display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)' }}>
                        <strong style={{ color: isCorrect && showAnswers ? '#34D399' : 'var(--text-muted)' }}>{key}.</strong>
                        <span style={{ color: isCorrect && showAnswers ? '#34D399' : 'var(--text-secondary)', fontWeight: isCorrect && showAnswers ? 600 : 400 }}>{val}</span>
                        {isCorrect && showAnswers && <span style={{ color: '#34D399', fontSize: '0.72rem', fontWeight: 700 }}>✓ CORRECT</span>}
                      </label>
                    )}
                  </div>
                );
              })}

              {editMode && (
                <>
                  <div className="form-group" style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ fontSize: '0.72rem' }}>Correct Answer</label>
                    <select className="form-select" value={q.correct || ''} onChange={e => updateQuestion(qi, 'correct', e.target.value)} style={{ maxWidth: 100 }}>
                      {Object.keys(q.options).map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.72rem' }}>Explanation</label>
                    <textarea className="form-textarea" value={q.explanation || ''} onChange={e => updateQuestion(qi, 'explanation', e.target.value)} rows={2} />
                  </div>
                </>
              )}

              {!editMode && showAnswers && (
                <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.7rem', borderRadius: 8, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.12)' }}>
                  <div style={{ fontSize: '0.82rem', color: '#34D399' }}>
                    <strong>✅ Answer: {q.correct}</strong>{q.explanation && <span style={{ color: 'var(--text-muted)' }}> — {q.explanation}</span>}
                  </div>
                </div>
              )}

              {result && result.results && result.results[qi] && (
                <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.7rem', borderRadius: 8, background: result.results[qi].is_correct ? 'rgba(52,211,153,0.06)' : 'rgba(248,113,113,0.06)', color: result.results[qi].is_correct ? '#34D399' : '#F87171', fontSize: '0.85rem' }}>
                  {result.results[qi].is_correct ? '✅ Correct' : `❌ Wrong — Answer: ${result.results[qi].correct_answer}`}
                </div>
              )}
            </div>
          ))}

          {editMode && (
            <button className="btn btn-secondary btn-block" onClick={addQuestion} style={{ marginBottom: '1rem' }}>+ Add Question</button>
          )}

          {!result && (
            <button className="btn btn-primary btn-block" onClick={evaluate} disabled={evaluating || !selectedStudent}>
              {evaluating ? '⏳ Evaluating...' : '✅ Submit Answers'}
            </button>
          )}

          {result && (
            <div className="card" style={{ borderLeft: '3px solid var(--primary)', marginTop: '1rem' }}>
              <h3 style={{ color: 'var(--primary-light)' }}>🏆 Result: {result.score}/{result.max_score} ({result.percentage}%)</h3>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
