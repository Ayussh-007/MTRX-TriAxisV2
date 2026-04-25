import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClassroom } from '../context/ClassroomContext';
import API from '../api/client';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts';

const COLORS = ['#6366F1', '#34D399', '#FB923C', '#60A5FA', '#F472B6', '#FBBF24', '#A78BFA', '#38BDF8'];
const scoreColor = (v) => v >= 70 ? '#34D399' : v >= 50 ? '#FB923C' : '#F87171';
const trendBadge = (t) => ({
  improving: { icon: '↑', color: '#34D399', bg: 'rgba(52,211,153,0.1)' },
  declining: { icon: '↓', color: '#F87171', bg: 'rgba(248,113,113,0.1)' },
  stable: { icon: '→', color: '#FBBF24', bg: 'rgba(251,191,36,0.1)' },
  new: { icon: '★', color: '#60A5FA', bg: 'rgba(96,165,250,0.1)' },
}[t] || { icon: '•', color: '#94A3B8', bg: 'rgba(148,163,184,0.1)' });

export default function ClassroomDashboard() {
  const { classroomId } = useParams();
  const { setClassroom } = useClassroom();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    API.get(`/classrooms/${classroomId}/dashboard`)
      .then(r => {
        setData(r.data);
        setClassroom(r.data.classroom);
      })
      .catch(() => toast.error('Failed to load classroom'))
      .finally(() => setLoading(false));
  }, [classroomId]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem', animation: 'pulse 1.5s infinite' }}>📊</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading dashboard...</div>
      </div>
    </div>
  );

  if (!data) return null;

  const { classroom, metrics, topic_averages, students } = data;
  const topicData = Object.entries(topic_averages).map(([name, avg]) => ({ name, avg }));
  const attPieData = [
    { name: 'Attending', value: metrics.avg_attendance },
    { name: 'Absent', value: Math.max(0, 100 - metrics.avg_attendance) },
  ];

  return (
    <div>
      {/* ── Header ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem',
      }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', margin: 0, lineHeight: 1.2 }}>
            {classroom.name}
          </h1>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginTop: '0.4rem', flexWrap: 'wrap' }}>
            {classroom.subject && (
              <span style={{
                padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 600,
                background: 'rgba(99,102,241,0.1)', color: '#6366F1', border: '1px solid rgba(99,102,241,0.2)',
              }}>{classroom.subject}</span>
            )}
            <span style={{
              padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700,
              background: 'rgba(34,211,153,0.1)', color: '#34D399', border: '1px solid rgba(34,211,153,0.2)',
              fontFamily: 'monospace', letterSpacing: '1px',
            }}>Code: {classroom.code}</span>
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { navigator.clipboard.writeText(classroom.code); toast.success('Code copied!'); }}
          style={{ whiteSpace: 'nowrap' }}
        >📋 Copy Code</button>
      </div>

      {/* ── Metric Cards ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem', marginBottom: '1.5rem',
      }}>
        {[
          { label: 'Students', value: metrics.num_students, icon: '👥', color: '#6366F1', suffix: '' },
          { label: 'Avg Score', value: metrics.avg_score, icon: '📈', color: '#34D399', suffix: '%' },
          { label: 'Attendance', value: metrics.avg_attendance, icon: '📅', color: '#60A5FA', suffix: '%' },
          { label: 'Quizzes Taken', value: metrics.total_quizzes, icon: '📝', color: '#FB923C', suffix: '' },
        ].map((m, i) => (
          <div key={i} style={{
            padding: '1.2rem', borderRadius: 'var(--radius-lg)',
            background: 'var(--glass)', backdropFilter: 'blur(12px)',
            border: '1px solid var(--glass-border)',
            position: 'relative', overflow: 'hidden',
            transition: 'transform 0.25s ease, box-shadow 0.25s ease',
            cursor: 'default',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${m.color}15`; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
          >
            <div style={{
              position: 'absolute', top: -8, right: -8, width: 56, height: 56,
              borderRadius: '50%', background: `${m.color}10`, opacity: 0.6,
            }} />
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.3rem' }}>
              {m.icon} {m.label}
            </div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: m.color, lineHeight: 1 }}>
              {m.value}{m.suffix}
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: topicData.length > 0 ? '2fr 1fr' : '1fr',
        gap: '1rem', marginBottom: '1.5rem',
      }}>
        {/* Bar Chart — Topic Performance */}
        {topicData.length > 0 && (
          <div style={{
            padding: '1.2rem', borderRadius: 'var(--radius-lg)',
            background: 'var(--glass)', backdropFilter: 'blur(12px)',
            border: '1px solid var(--glass-border)',
          }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.8rem' }}>
              📊 Topic Performance
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topicData} margin={{ top: 5, right: 10, left: -10, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} interval={0} angle={-20} textAnchor="end" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <Tooltip
                  formatter={(v) => [`${v}%`, 'Avg Score']}
                  contentStyle={{ borderRadius: 10, background: 'var(--surface-solid)', border: '1px solid var(--glass-border)', fontSize: '0.8rem' }}
                />
                <Bar dataKey="avg" name="Avg Score" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  {topicData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Pie Chart — Attendance */}
        <div style={{
          padding: '1.2rem', borderRadius: 'var(--radius-lg)',
          background: 'var(--glass)', backdropFilter: 'blur(12px)',
          border: '1px solid var(--glass-border)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem', alignSelf: 'flex-start' }}>
            📅 Attendance Overview
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={attPieData} innerRadius={55} outerRadius={80} dataKey="value" cx="50%" cy="50%" paddingAngle={3}>
                <Cell fill="#34D399" />
                <Cell fill="rgba(248,113,113,0.3)" />
              </Pie>
              <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
              <Tooltip formatter={(v) => `${v}%`} contentStyle={{ borderRadius: 10, fontSize: '0.8rem' }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ textAlign: 'center', marginTop: '-0.5rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: metrics.avg_attendance >= 75 ? '#34D399' : '#FB923C' }}>
              {metrics.avg_attendance}%
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Class Attendance</div>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '0.8rem', marginBottom: '1.5rem',
      }}>
        {[
          { label: 'Take Attendance', icon: '📋', to: 'attendance', color: '#22C55E' },
          { label: 'Create Quiz', icon: '📝', to: 'quiz', color: '#6366F1' },
          { label: 'Upload Curriculum', icon: '📄', to: 'curriculum', color: '#60A5FA' },
          { label: 'Make Slides', icon: '🖥️', to: 'slides', color: '#A78BFA' },
        ].map((a, i) => (
          <button
            key={i}
            onClick={() => navigate(`/classroom/${classroomId}/${a.to}`)}
            style={{
              padding: '1rem', borderRadius: 'var(--radius-md)',
              background: `${a.color}08`, border: `1px solid ${a.color}20`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
              cursor: 'pointer', transition: 'all 0.25s ease', fontFamily: 'inherit',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${a.color}15`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = `${a.color}08`; e.currentTarget.style.transform = ''; }}
          >
            <span style={{ fontSize: '1.5rem' }}>{a.icon}</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: a.color }}>{a.label}</span>
          </button>
        ))}
      </div>

      {/* ── Student Cards ── */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            👥 Students ({students.length})
          </h3>
        </div>

        {students.length === 0 ? (
          <div style={{
            padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-lg)',
            background: 'var(--glass)', border: '1px solid var(--glass-border)',
            color: 'var(--text-muted)', fontSize: '0.88rem',
          }}>
            No students enrolled yet. Share the classroom code <strong style={{ color: '#34D399', fontFamily: 'monospace' }}>{classroom.code}</strong> with your students.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.8rem' }}>
            {students.map((s, i) => {
              const tb = trendBadge(s.trend);
              return (
                <div key={s.id} style={{
                  padding: '1rem 1.2rem', borderRadius: 'var(--radius-md)',
                  background: 'var(--glass)', backdropFilter: 'blur(10px)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex', alignItems: 'center', gap: '0.8rem',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i + 3) % COLORS.length]})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '0.85rem', fontWeight: 700, flexShrink: 0,
                  }}>{s.name?.[0]?.toUpperCase()}</div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s.name}
                      </div>
                      <span style={{
                        padding: '0.1rem 0.4rem', borderRadius: '999px', fontSize: '0.62rem', fontWeight: 700,
                        background: tb.bg, color: tb.color, border: `1px solid ${tb.color}30`,
                      }}>
                        {tb.icon} {s.trend}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '0.75rem', color: scoreColor(s.score), fontWeight: 600 }}>
                        Score: {s.score}%
                      </span>
                      <span style={{ fontSize: '0.75rem', color: s.attendance >= 75 ? '#34D399' : '#FB923C', fontWeight: 600 }}>
                        Att: {s.attendance}%
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {s.quizzes_taken} quizzes
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
