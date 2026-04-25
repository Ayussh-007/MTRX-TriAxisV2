import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api/client';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

export default function AIAgent() {
  const { classroomId } = useParams();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ep = classroomId ? `/classrooms/${classroomId}/students` : '/students';
    API.get(ep).then(r => setStudents(r.data.students || r.data));
  }, []);

  const run = async () => {
    if (!selectedStudent) return toast.error('Select a student');
    setLoading(true); setResult(null);
    try {
      const { data } = await API.post('/agent/run', { student_id: parseInt(selectedStudent) });
      setResult(data);
      toast.success('Analysis complete!');
    } catch { toast.error('Agent failed'); }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <h2>🤖 AI Agent</h2>
        <p>Multi-step reasoning agent — analyses a student across all dimensions and generates a comprehensive report.</p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="form-group" style={{ maxWidth: 340 }}>
          <label className="form-label">🎒 Select Student to Analyze</label>
          <select className="form-select" value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
            <option value="">-- Choose a student --</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name} (ID: {s.id})</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={run} disabled={loading || !selectedStudent}>
          {loading ? '⏳ Analyzing (30-90s)...' : '🧠 Run Multi-Step Analysis'}
        </button>
      </div>

      {/* Pipeline Steps */}
      {result && result.steps && (
        <div className="section">
          <h3 className="section-title">📋 Pipeline Steps</h3>
          {result.steps.map((step, i) => (
            <div key={i} className="card" style={{ marginBottom: '0.6rem', borderLeft: `3px solid ${step.status === 'complete' ? '#22C55E' : '#F59E0B'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{step.name}</strong>
                <span className={`badge ${step.status === 'complete' ? 'badge-green' : 'badge-yellow'}`}>{step.status}</span>
              </div>
              {step.findings && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: 'var(--text-light)' }}>
                  {Object.entries(step.findings).map(([key, val]) => (
                    <div key={key}>
                      <strong>{key}:</strong> {Array.isArray(val) ? val.join(', ') || 'None' : String(val)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Final Report */}
      {result && result.final_recommendation && (
        <div className="section">
          <h3 className="section-title">📝 AI Report for {result.student_name}</h3>
          <div className="metric-row" style={{ marginBottom: '1rem' }}>
            <div className="metric-card"><div className="label">⚠️ Risks</div><div className="value">{result.metadata?.risks_count || 0}</div></div>
            <div className="metric-card"><div className="label">📉 Weak Topics</div><div className="value">{result.metadata?.weak_topics_count || 0}</div></div>
            <div className="metric-card"><div className="label">📈 Trend</div><div className="value">{result.metadata?.trend || '-'}</div></div>
            <div className="metric-card"><div className="label">📅 Att. Risk</div><div className="value">{result.metadata?.attendance_risk || '-'}</div></div>
          </div>
          <div className="card markdown-content">
            <ReactMarkdown>{result.final_recommendation}</ReactMarkdown>
          </div>
        </div>
      )}

      {result && result.error && (
        <div className="alert alert-danger">{result.error}</div>
      )}
    </div>
  );
}
