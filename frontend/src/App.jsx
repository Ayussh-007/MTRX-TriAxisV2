import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import AuthPage from './pages/AuthPage';
import Home from './pages/Home';
import StudentManager from './pages/StudentManager';
import Attendance from './pages/Attendance';
import QuizGenerator from './pages/QuizGenerator';
import TeacherDashboard from './pages/TeacherDashboard';
import CurriculumUpload from './pages/CurriculumUpload';
import SlideMaker from './pages/SlideMaker';
import AIAgent from './pages/AIAgent';
import StudentLogin from './pages/StudentLogin';
import StudentPortal from './pages/StudentPortal';

export default function App() {
  const { isAuthenticated } = useAuth();

  /* ── If not logged in, show the auth screen ── */
  if (!isAuthenticated) {
    return (
      <>
        <Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: '12px', fontFamily: 'Inter', fontSize: '0.84rem', background: '#fff', color: '#1A1D2E', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' } }} />
        <AuthPage />
      </>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: '12px', fontFamily: 'Inter', fontSize: '0.84rem', background: 'var(--surface-solid)', color: 'var(--text)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-md)' } }} />
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/students" element={<StudentManager />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/quiz" element={<QuizGenerator />} />
            <Route path="/dashboard" element={<TeacherDashboard />} />
            <Route path="/curriculum" element={<CurriculumUpload />} />
            <Route path="/slides" element={<SlideMaker />} />
            <Route path="/agent" element={<AIAgent />} />
            <Route path="/login" element={<StudentLogin />} />
            <Route path="/portal" element={<StudentPortal />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
