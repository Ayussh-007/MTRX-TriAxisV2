import { useState, useEffect } from 'react';
import API from '../api/client';
import toast from 'react-hot-toast';

export default function CurriculumUpload() {
  const [status, setStatus] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');

  const refresh = () => {
    API.get('/curriculum/status').then(r => setStatus(r.data.loaded));
    API.get('/curriculum/files').then(r => setFiles(r.data.files));
  };

  useEffect(() => { refresh(); }, []);

  const upload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setProgress(`Uploading ${file.name}...`);
    const form = new FormData();
    form.append('file', file);
    try {
      const { data } = await API.post('/curriculum/upload', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 300000 });
      if (data.status === 'success') {
        toast.success(`Processed ${data.chunks} chunks from ${data.filename}`);
      } else {
        toast.error(data.message || 'Warning during processing');
      }
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed');
    }
    setUploading(false);
    setProgress('');
  };

  const deleteFile = async (name) => {
    await API.delete(`/curriculum/files/${name}`);
    toast.success(`Deleted ${name}`);
    refresh();
  };

  return (
    <div>
      <div className="page-header">
        <h2>📄 Upload Curriculum</h2>
        <p>Upload PDF textbooks — AI extracts and vectorizes content for RAG.</p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <span className={`badge ${status ? 'badge-green' : 'badge-yellow'}`}>
            {status ? '✅ Curriculum Loaded' : '⚠️ No Curriculum Yet'}
          </span>
        </div>

        <label className="btn btn-primary" style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}>
          {uploading ? '⏳ Processing...' : '📤 Choose PDF File'}
          <input type="file" accept=".pdf" onChange={upload} disabled={uploading} style={{ display: 'none' }} />
        </label>
        {progress && <p style={{ marginTop: '0.5rem', color: 'var(--text-light)', fontSize: '0.85rem' }}>{progress}</p>}
      </div>

      <div className="section">
        <h3 className="section-title">📁 Uploaded Files</h3>
        {files.length === 0 ? (
          <div className="alert alert-info">No files uploaded yet.</div>
        ) : (
          files.map(f => (
            <div key={f} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', padding: '0.6rem 1rem' }}>
              <span>📄 {f}</span>
              <button className="btn btn-danger btn-sm" onClick={() => deleteFile(f)}>🗑️</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
