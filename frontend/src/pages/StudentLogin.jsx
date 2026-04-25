import { useState } from 'react';
import API from '../api/client';
import toast from 'react-hot-toast';

export default function StudentLogin() {
  const [name, setName] = useState('');
  const [loginId, setLoginId] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async (e) => {
    e.preventDefault();
    if (!name.trim() || !loginId.trim()) return toast.error('Enter name and Login ID');
    setLoading(true);
    try {
      const { data } = await API.post('/auth/login', { name: name.trim(), login_id: loginId.trim() });
      localStorage.setItem('student', JSON.stringify(data.student));
      toast.success(`Welcome, ${data.student.name}!`);
      window.location.href = '/portal';
    } catch {
      toast.error('Invalid credentials');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 420, margin: '3rem auto' }}>
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '3rem' }}>🎓</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.5rem' }}>Student Login</h2>
          <p style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>Enter your name and Login ID</p>
        </div>

        <form onSubmit={login}>
          <div className="form-group">
            <label className="form-label">👤 Full Name</label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Ayush Mhatre" />
          </div>
          <div className="form-group">
            <label className="form-label">🔑 Login ID</label>
            <input className="form-input" value={loginId} onChange={e => setLoginId(e.target.value)} placeholder="AI251030" />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? '⏳ Logging in...' : '🔐 Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
