import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import InteractiveBg from './components/InteractiveBg';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Home from './pages/Home';
import ClassroomManager from './pages/ClassroomManager';
import ClassroomDashboard from './pages/ClassroomDashboard';
import ClassroomStudentView from './pages/ClassroomStudentView';
import StudentManager from './pages/StudentManager';
import Attendance from './pages/Attendance';
import QuizGenerator from './pages/QuizGenerator';
import TeacherDashboard from './pages/TeacherDashboard';
import CurriculumUpload from './pages/CurriculumUpload';
import SlideMaker from './pages/SlideMaker';
import AIAgent from './pages/AIAgent';
import StudentPortal from './pages/StudentPortal';

/* ── Protected Route wrapper ── */
function RequireAuth({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={user.role === 'teacher' ? '/home' : '/portal'} replace />;
  return children;
}

function AppLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const standaloneRoutes = ['/', '/auth'];

  if (standaloneRoutes.includes(location.pathname)) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={user ? <Navigate to={user.role === 'teacher' ? '/home' : '/portal'} replace /> : <AuthPage />} />
      </Routes>
    );
  }

  return (
    <div className="app-layout">
      <InteractiveBg />
      <Sidebar />
      <main className="main-content">
        <Routes>
          {/* ── Teacher: Classroom list ── */}
          <Route path="/home" element={<RequireAuth roles={['teacher']}><Home /></RequireAuth>} />
          <Route path="/classrooms" element={<RequireAuth roles={['teacher']}><ClassroomManager /></RequireAuth>} />

          {/* ── Classroom-scoped (teacher) ── */}
          <Route path="/classroom/:classroomId" element={<RequireAuth roles={['teacher']}><ClassroomDashboard /></RequireAuth>} />
          <Route path="/classroom/:classroomId/curriculum" element={<RequireAuth roles={['teacher']}><CurriculumUpload /></RequireAuth>} />
          <Route path="/classroom/:classroomId/quiz" element={<RequireAuth roles={['teacher']}><QuizGenerator /></RequireAuth>} />
          <Route path="/classroom/:classroomId/attendance" element={<RequireAuth roles={['teacher']}><Attendance /></RequireAuth>} />
          <Route path="/classroom/:classroomId/slides" element={<RequireAuth roles={['teacher']}><SlideMaker /></RequireAuth>} />
          <Route path="/classroom/:classroomId/agent" element={<RequireAuth roles={['teacher']}><AIAgent /></RequireAuth>} />
          <Route path="/classroom/:classroomId/analytics" element={<RequireAuth roles={['teacher']}><TeacherDashboard /></RequireAuth>} />
          <Route path="/classroom/:classroomId/students" element={<RequireAuth roles={['teacher']}><StudentManager /></RequireAuth>} />

          {/* ── Student ── */}
          <Route path="/portal" element={<RequireAuth roles={['student']}><StudentPortal /></RequireAuth>} />
          <Route path="/classroom/:classroomId/student" element={<RequireAuth roles={['student']}><ClassroomStudentView /></RequireAuth>} />

          {/* ── Fallback ── */}
          <Route path="*" element={<Navigate to={user?.role === 'teacher' ? '/home' : user ? '/portal' : '/auth'} replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: '12px', fontFamily: 'Inter', fontSize: '0.84rem', background: 'var(--surface-solid)', color: 'var(--text)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-md)' } }} />
      <AppLayout />
    </BrowserRouter>
  );
}
