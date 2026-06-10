import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';

// --- Student Portal Imports ---
import { Sidebar } from './components/student-portal/Sidebar';
import { Dashboard } from './components/student-portal/Dashboard';
import { CourseDetailsWrapper } from './components/student-portal/CourseDetailsWrapper';
// [M3] import { CourseDetails } from './components/student-portal/CourseDetails';
// [M3] import { CourseExaminations } from './components/student-portal/CourseExaminations';
// [M3] import { CourseResults } from './components/student-portal/CourseResults';
// [M3] import { CourseMaterials } from './components/student-portal/CourseMaterials';
// [M4] import { ResultSheet } from './components/student-portal/ResultSheet';
// [M4] import { ExamApplicationForm } from './components/student-portal/ExamApplicationForm';
// [M4] import { ExamApplicationSuccess } from './components/student-portal/ExamApplicationSuccess';
// [M3] import { CourseAnnouncements } from './components/student-portal/CourseAnnouncements';
import { LoginPortal } from './components/auth/LoginPortal';
import { Profile } from './components/student-portal/Profile';
// [M3] import { LetterRequest } from './components/student-portal/LetterRequest';
import { Settings } from './components/student-portal/Settings';
// [M3] import { SupportBubble } from './components/student-portal/SupportBubble';
// [M4] import { GradingScale } from './components/student-portal/GradingScale';
import { ApplicantDashboard } from './components/student-portal/ApplicantDashboard';
import { ApplicantTrackStatus } from './components/student-portal/ApplicantTrackStatus';
import { NewCourseApplication } from './components/student-portal/NewCourseApplication';
// [M4] import ExaminationResults from './components/student-portal/ExaminationResults';

// --- Admin Portal Imports ---
import { AdminSidebar } from './components/admin-portal/AdminSidebar';
import { AdminDashboard } from './components/admin-portal/AdminDashboard';
import { AdminLogin } from './components/auth/AdminLogin';
import { UserManagement } from './components/admin-portal/UserManagement';
import { CourseManagement } from './components/admin-portal/CourseManagement';
import { CreateCourse } from './components/admin-portal/CreateCourse';
import { ManageCourse } from './components/admin-portal/ManageCourse';
import { Applications } from './components/admin-portal/Applications';
// [M3] import { LetterRequests } from './components/admin-portal/LetterRequests';
import { AdminSettings } from './components/admin-portal/AdminSettings';
// [M4] import { CreateExam } from './components/admin-portal/CreateExam';
// [M4] import { ManageExamStudents } from './components/admin-portal/ManageExamStudents';
// [M5] import { AIAnalytics } from './components/admin-portal/AIAnalytics';
// [M5] import { TrackStudent } from './components/admin-portal/TrackStudent';
// [M3] import { AdminAnnouncements } from './components/admin-portal/AdminAnnouncements';
// [M5] import { ActivityLogs } from './components/admin-portal/ActivityLogs';

// --- Common/Services Imports ---
import { systemSettingService } from './services/apiService';
import { MaintenancePage } from './components/common/MaintenancePage';
import './App.css';

// --- Helper Components ---
const LayoutWithSidebar = () => {
  const location = useLocation();
  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';

  const token = sessionStorage.getItem('token');
  const userStr = sessionStorage.getItem('user');

  if (!token || !userStr) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const user = JSON.parse(userStr);
  if (user.role !== 'student' && user.role !== 'pro_student') {
    return <Navigate to="/applicant-dashboard" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Outlet context={{}} />
      </div>
      {/* [M3] {isDashboard && <SupportBubble />} */}
    </div>
  );
};

const AdminLayout = () => {
  const location = useLocation();
  const token = sessionStorage.getItem('token');
  const adminRole = sessionStorage.getItem('adminRole');

  if (!token || !adminRole) {
    return <Navigate to="/staff/login" replace state={{ from: location }} />;
  }

  return (
    <div className="admin-app-container">
      <AdminSidebar />
      <div className="admin-main-content">
        <Outlet />
      </div>
    </div>
  );
};

const TitleUpdater = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/staff')) {
      document.title = 'CODL | SUSL - Staff';
    } else {
      document.title = 'CODL | SUSL - Student';
    }
  }, [location.pathname]);

  return null;
};

// --- Main App Component ---
function App() {
  const [settings, setSettings] = useState(() => {
    const cached = localStorage.getItem('systemSettings');
    return cached ? JSON.parse(cached) : null;
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await systemSettingService.getSettings();
        localStorage.setItem('systemSettings', JSON.stringify(data));
        setSettings(data);
      } catch (err) {
        console.error("Failed to preload system settings:", err);
      }
    };
    loadSettings();
  }, []);

  const token = sessionStorage.getItem('token');
  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isSuperAdmin = user && user.role === 'super_admin';
  const isStaffLoginPath = window.location.pathname === '/staff/login';

  if (settings?.maintenance_mode && !isSuperAdmin && !isStaffLoginPath) {
    return (
      <BrowserRouter>
        <MaintenancePage settings={settings} />
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <TitleUpdater />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPortal />} />
        <Route path="/staff/login" element={<AdminLogin />} />

        {/* Applicant Dashboard Routes */}
        <Route path="/applicant-dashboard" element={<ApplicantDashboard />}>
          <Route path="track-status" element={<div className="applicant-app-container"><ApplicantTrackStatus /></div>} />
          <Route path="new-course" element={<NewCourseApplication />} />
        </Route>

        {/* Super Admin Dashboard Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          {/* [M5] <Route path="track-student" element={<TrackStudent />} /> */}
          <Route path="courses" element={<CourseManagement />} />
          <Route path="courses/create" element={<CreateCourse />} />
          <Route path="courses/edit/:id" element={<CreateCourse />} />
          <Route path="courses/manage/:id" element={<ManageCourse />} />
          {/* [M4]
          <Route path="courses/manage/:id/exams/create" element={<CreateExam />} />
          <Route path="courses/manage/:id/exams/edit/:examId" element={<CreateExam />} />
          <Route path="courses/manage/:id/exams/:examId/students" element={<ManageExamStudents />} />
          */}
          <Route path="approvals/*" element={<Applications />} />
          {/* [M3] <Route path="letters" element={<LetterRequests />} /> */}
          {/* [M3] <Route path="announcements" element={<AdminAnnouncements />} /> */}
          {/* [M5] <Route path="activity-logs" element={<ActivityLogs />} /> */}
          {/* [M5] <Route path="ai-analytics" element={<AIAnalytics />} /> */}
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Registered Student Dashboard Routes */}
        <Route element={<LayoutWithSidebar />}>
          {/* [M3] <Route path="/dashboard" element={<Dashboard />} /> */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          {/* [M3] <Route path="/letter-request" element={<LetterRequest />} /> */}
          <Route path="/new-course" element={<NewCourseApplication />} />
          {/* [M3]
          <Route path="/course/:id" element={<CourseDetailsWrapper />}>
            <Route index element={<CourseDetails />} />
            <Route path="examinations" element={<CourseExaminations />} />
            <Route path="examinations/:examId/results" element={<ExaminationResults />} />
            <Route path="results" element={<CourseResults />} />
            <Route path="results/:resultId" element={<ResultSheet />} />
            <Route path="grading-scale" element={<GradingScale />} />
            <Route path="materials" element={<CourseMaterials />} />
            <Route path="announcements" element={<CourseAnnouncements />} />
            <Route path="examinations/apply" element={<ExamApplicationForm />} />
            <Route path="examinations/success" element={<ExamApplicationSuccess />} />
          </Route>
          */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;