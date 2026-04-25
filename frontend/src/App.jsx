import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
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
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: '12px', fontFamily: 'Inter', fontSize: '0.84rem', background: '#1A1F2E', color: '#E8ECF4', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' } }} />
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
