import { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ContentLoader } from './components/common/ContentLoader';
import { Monitor, MapPin, Phone, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

import { Sidebar } from './components/student-portal/Sidebar';
import { SupportBubble } from './components/student-portal/SupportBubble';
import { AdminSidebar } from './components/admin-portal/AdminSidebar';
import './components/auth/LoginPortal.css';

// Eagerly load core student pages & auth views
import { LoginPortal } from './components/auth/LoginPortal';
import { ForgotPassword } from './components/auth/ForgotPassword';
import { ResetPassword } from './components/auth/ResetPassword';
import { Dashboard } from './components/student-portal/Dashboard';
import { CourseDetailsWrapper } from './components/student-portal/CourseDetailsWrapper';
import { CourseDetails } from './components/student-portal/CourseDetails';
import { CourseExaminations } from './components/student-portal/CourseExaminations';
import { CourseResults } from './components/student-portal/CourseResults';
import { CourseMaterials } from './components/student-portal/CourseMaterials';
import { CourseAnnouncements } from './components/student-portal/CourseAnnouncements';
import { Profile } from './components/student-portal/Profile';
import { LetterRequest } from './components/student-portal/LetterRequest';
import { Settings } from './components/student-portal/Settings';

// Keep student auxiliary pages lazy-loaded
const ResultSheet = lazy(() => import('./components/student-portal/ResultSheet').then(m => ({ default: m.ResultSheet })));
const ExamApplicationForm = lazy(() => import('./components/student-portal/ExamApplicationForm').then(m => ({ default: m.ExamApplicationForm })));
const ExamApplicationSuccess = lazy(() => import('./components/student-portal/ExamApplicationSuccess').then(m => ({ default: m.ExamApplicationSuccess })));
const GradingScale = lazy(() => import('./components/student-portal/GradingScale').then(m => ({ default: m.GradingScale })));
const ApplicantDashboard = lazy(() => import('./components/student-portal/ApplicantDashboard').then(m => ({ default: m.ApplicantDashboard })));
const ApplicantTrackStatus = lazy(() => import('./components/student-portal/ApplicantTrackStatus').then(m => ({ default: m.ApplicantTrackStatus })));
const NewCourseApplication = lazy(() => import('./components/student-portal/NewCourseApplication').then(m => ({ default: m.NewCourseApplication })));
const ExaminationResults = lazy(() => import('./components/student-portal/ExaminationResults'));

// Lazy load public forms
const StudentInterestForm = lazy(() => import('./components/public/StudentInterestForm').then(m => ({ default: m.StudentInterestForm })));
const IndustryAnalysisForm = lazy(() => import('./components/public/IndustryAnalysisForm').then(m => ({ default: m.IndustryAnalysisForm })));
const HelpCenter = lazy(() => import('./components/public/HelpCenter').then(m => ({ default: m.HelpCenter })));

// Eagerly load core admin pages & auth
import { AdminLogin } from './components/auth/AdminLogin';
import { AdminDashboard } from './components/admin-portal/AdminDashboard';
import { UserManagement } from './components/admin-portal/UserManagement';
import { CourseManagement } from './components/admin-portal/CourseManagement';
import { CreateCourse } from './components/admin-portal/CreateCourse';
import { ManageCourse } from './components/admin-portal/ManageCourse';
import { Applications } from './components/admin-portal/Applications';
import { LetterRequests } from './components/admin-portal/LetterRequests';
import { AdminSettings } from './components/admin-portal/AdminSettings';
import { TrackStudent } from './components/admin-portal/TrackStudent';

// Keep admin auxiliary pages lazy-loaded
const CreateExam = lazy(() => import('./components/admin-portal/CreateExam').then(m => ({ default: m.CreateExam })));
const ManageExamStudents = lazy(() => import('./components/admin-portal/ManageExamStudents').then(m => ({ default: m.ManageExamStudents })));
const AIAnalytics = lazy(() => import('./components/admin-portal/AIAnalytics').then(m => ({ default: m.AIAnalytics })));
const ManageForms = lazy(() => import('./components/admin-portal/ManageForms').then(m => ({ default: m.ManageForms })));
const AdminAnnouncements = lazy(() => import('./components/admin-portal/AdminAnnouncements').then(m => ({ default: m.AdminAnnouncements })));
const ActivityLogs = lazy(() => import('./components/admin-portal/ActivityLogs').then(m => ({ default: m.ActivityLogs })));

import { systemSettingService } from './services/apiService';
const MaintenancePage = lazy(() => import('./components/common/MaintenancePage').then(m => ({ default: m.MaintenancePage })));

import './App.css';

const PageLoader = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#F8FAFC',
    gap: '16px',
    fontFamily: "'Poppins', sans-serif"
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      border: '3px solid #E2E8F0',
      borderTopColor: '#7C3AED',
      animation: 'spin 1s linear infinite'
    }} />
    <div style={{
      color: '#64748B',
      fontSize: '14px',
      fontWeight: 500
    }}>Loading...</div>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);





const LayoutWithSidebar = () => {
  const location = useLocation();
  const isDashboard =
    location.pathname === '/' || location.pathname === '/dashboard';

  const token = sessionStorage.getItem('token');
  const userStr = sessionStorage.getItem('user');

  if (!token || !userStr) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const user = JSON.parse(userStr);

  if (user.role !== 'student') {
    return <Navigate to="/applicant-dashboard" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Suspense fallback={<ContentLoader />}>
          <motion.div 
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100%' }}
          >
            <Outlet context={{}} />
          </motion.div>
        </Suspense>
      </div>
      {isDashboard && <SupportBubble />}
    </div>
  );
};

const AdminLayout = () => {
  const location = useLocation();
  const token = sessionStorage.getItem('token');
  const adminRole = sessionStorage.getItem('adminRole');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!token || !adminRole) {
    return <Navigate to="/staff/login" replace state={{ from: location }} />;
  }

  return (
    <>
      {isMobile && (
        <div className="admin-mobile-block">
          <div className="admin-mobile-block-card">
            <div className="admin-mobile-block-icon">
              <Monitor size={36} />
            </div>
            <h2>Desktop Screen Required</h2>
            <p>
              The CODL SUSL Admin Portal is optimized for desktop computers and larger screens to manage courses, applications, and analytics securely.
            </p>
            <div className="admin-mobile-block-footer">
              Please open this portal on a device with a screen width of at least 1024px.
            </div>
          </div>
        </div>
      )}
      <div className="admin-app-container">
        <AdminSidebar />
        <div className="admin-main-content">
          <Suspense fallback={<ContentLoader />}>
            <motion.div 
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100%' }}
            >
              <Outlet />
            </motion.div>
          </Suspense>
        </div>
      </div>
    </>
  );
};

const AuthLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const getBranding = () => {
    const cached = localStorage.getItem('systemSettings');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return {
          logo: parsed.logo || '/images/logo.png',
          institution: parsed.institution_name || 'Centre for Open & Distance Learning',
          university: parsed.university_name || 'Sabaragamuwa University of Sri Lanka',
          email: parsed.contact_email || 'info@codl.sab.ac.lk',
          phone: parsed.contact_phone || '045-2280179',
          address: parsed.address || 'Sabaragamuwa University of Sri Lanka, P.O. Box 02, Belihuloya, 70140, Sri Lanka.',
        };
      } catch (e) { }
    }
    return {
      logo: '/images/logo.png',
      institution: 'Centre for Open & Distance Learning',
      university: 'Sabaragamuwa University of Sri Lanka',
      email: 'info@codl.sab.ac.lk',
      phone: '045-2280179',
      address: 'Sabaragamuwa University of Sri Lanka, P.O. Box 02, Belihuloya, 70140, Sri Lanka.',
    };
  };

  const branding = getBranding();

  return (
    <div className="login-portal-wrapper">
      <div className="login-left-pane">
        <div className="branding-container">
          <div className="branding-header-group">
            <img 
              src={branding.logo} 
              alt="Logo" 
              className="branding-logo" 
              style={{ width: '130px', height: '130px', objectFit: 'contain' }}
            />
            <div className="branding-title-group">
              <h1 style={{ textTransform: 'uppercase' }}>{branding.institution}</h1>
              <p className="university-name">{branding.university}</p>
            </div>
          </div>
        </div>

        <div className="contact-info-container">
          <div className="contact-item">
            <div className="contact-icon-wrapper"><MapPin size={20} /></div>
            <div>
              <h3>Address</h3>
              <p style={{ whiteSpace: 'pre-line' }}>{branding.address}</p>
            </div>
          </div>
          <div className="contact-horizontal-group">
            <div className="contact-item">
              <div className="contact-icon-wrapper"><Phone size={20} /></div>
              <div>
                <h3>Phone Number</h3>
                <p>{branding.phone}</p>
              </div>
            </div>
            <div className="contact-item">
              <div className="contact-icon-wrapper"><Mail size={20} /></div>
              <div>
                <h3>E-mail</h3>
                <p>{branding.email}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pane-footer">
          <div className="pane-footer-content">
            <p style={{ margin: 0 }}>© {new Date().getFullYear()} CODL. All rights reserved.</p>
            <div className="pane-footer-links">
              {location.pathname.startsWith('/staff') ? (
                <span onClick={() => navigate('/login')} className="pane-footer-link" style={{ cursor: 'pointer' }}>Student Login</span>
              ) : (
                <span onClick={() => navigate('/staff/login')} className="pane-footer-link" style={{ cursor: 'pointer' }}>Staff Login</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="login-right-pane">
        {location.pathname !== '/login' && (
          <div className="mobile-header-banner">
            <div className="mobile-branding-header">
              <img 
                src={branding.logo} 
                alt="Logo" 
                className="mobile-branding-logo" 
                style={{ width: '48px', height: '48px', objectFit: 'contain' }}
              />
              <div className="mobile-branding-title-group">
                <h1 className="mobile-branding-institution">{branding.institution}</h1>
                <p className="mobile-branding-university">{branding.university}</p>
              </div>
            </div>
          </div>
        )}

        <Suspense fallback={<ContentLoader />}>
          <Outlet context={{ branding }} />
        </Suspense>
      </div>
    </div>
  );
};

const TitleUpdater = () => {
  const location = useLocation();

  useEffect(() => {
    if (
      location.pathname.startsWith('/admin') ||
      location.pathname.startsWith('/staff')
    ) {
      document.title = 'CODL | SUSL - Staff';
    } else if (location.pathname.startsWith('/student-interests')) {
      document.title = 'Student Academic Interest';
    } else if (location.pathname.startsWith('/industry-analysis')) {
      document.title = 'Industry Requirements Survey';
    } else {
      document.title = 'CODL | SUSL - Student';
    }
  }, [location.pathname]);

  return null;
};


function App() {
  const [settings, setSettings] = useState(() => {
    const cached = localStorage.getItem('systemSettings');
    return cached ? JSON.parse(cached) : null;
  });

  useEffect(() => {
    if (settings && settings.primary_color) {
      document.documentElement.style.setProperty('--primary-color', settings.primary_color);
      document.documentElement.style.setProperty('--primary-hover', settings.primary_color + 'e0');
      document.documentElement.style.setProperty('--border-focus', settings.primary_color);
      document.documentElement.style.setProperty('--sidebar-bg', settings.primary_color);
    } else {
      document.documentElement.style.setProperty('--primary-color', '#7C3AED');
      document.documentElement.style.setProperty('--primary-hover', '#6D28D9');
      document.documentElement.style.setProperty('--border-focus', '#7C3AED');
      document.documentElement.style.setProperty('--sidebar-bg', '#7C3AED');
    }
  }, [settings]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await systemSettingService.getSettings();
        localStorage.setItem('systemSettings', JSON.stringify(data));
        setSettings(data);
      } catch (err) {
        console.error('Failed to preload system settings:', err);
      }
    };

    loadSettings();
  }, []);

  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isSuperAdmin = user && user.role === 'super_admin';
  const isStaffLoginPath = window.location.pathname === '/staff/login';

  if (
    settings?.maintenance_mode &&
    !isSuperAdmin &&
    !isStaffLoginPath
  ) {
    return (
      <Suspense fallback={<PageLoader />}>
        <BrowserRouter>
          <MaintenancePage settings={settings} />
        </BrowserRouter>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <BrowserRouter>
        <TitleUpdater />

        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Auth portal routes sharing AuthLayout */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPortal />} />
            <Route path="/staff/login" element={<AdminLogin />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          <Route path="/student-interests" element={<StudentInterestForm />} />
          <Route path="/industry-analysis" element={<IndustryAnalysisForm />} />
          <Route path="/help-center" element={<HelpCenter />} />
          <Route path="/help-center/:guideId" element={<HelpCenter />} />

          { }
          <Route
            path="/applicant-dashboard"
            element={<ApplicantDashboard />}
          >
            <Route
              path="track-status"
              element={
                <div className="applicant-app-container">
                  <ApplicantTrackStatus />
                </div>
              }
            />

            <Route
              path="new-course"
              element={<NewCourseApplication />}
            />
          </Route>

          { }
          <Route path="/admin" element={<AdminLayout />}>
            <Route
              index
              element={<Navigate to="/admin/dashboard" replace />}
            />

            <Route
              path="dashboard"
              element={<AdminDashboard />}
            />

            <Route
              path="users"
              element={<UserManagement />}
            />

            <Route path="track-student" element={<TrackStudent />} />

            <Route
              path="courses"
              element={<CourseManagement />}
            />

            <Route
              path="courses/create"
              element={<CreateCourse />}
            />

            <Route
              path="courses/edit/:id"
              element={<CreateCourse />}
            />

            <Route
              path="courses/manage/:id"
              element={<ManageCourse />}
            />


            <Route
              path="courses/manage/:id/exams/create"
              element={<CreateExam />}
            />
            <Route
              path="courses/manage/:id/exams/edit/:examId"
              element={<CreateExam />}
            />
            <Route
              path="courses/manage/:id/exams/:examId/students"
              element={<ManageExamStudents />}
            />


            <Route
              path="approvals/*"
              element={<Applications />}
            />


            <Route
              path="letters"
              element={<LetterRequests />}
            />

            <Route
              path="announcements"
              element={<AdminAnnouncements />}
            />

            <Route path="activity-logs" element={<ActivityLogs />} />
            <Route path="ai-analytics" element={<AIAnalytics />} />
            <Route path="ai-analytics/manage-forms" element={<ManageForms />} />

            <Route
              path="settings"
              element={<AdminSettings />}
            />
          </Route>

          { }
          <Route element={<LayoutWithSidebar />}>
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/profile"
              element={<Profile />}
            />

            <Route
              path="/settings"
              element={<Settings />}
            />

            <Route
              path="/letter-request"
              element={<LetterRequest />}
            />

            <Route
              path="/new-course"
              element={<NewCourseApplication />}
            />

            <Route
              path="/course/:id"
              element={<CourseDetailsWrapper />}
            >
              <Route
                index
                element={<CourseDetails />}
              />


              <Route
                path="examinations"
                element={<CourseExaminations />}
              />

              <Route
                path="examinations/:examId/results"
                element={<ExaminationResults />}
              />



              <Route
                path="results"
                element={<CourseResults />}
              />

              <Route
                path="results/:resultId"
                element={<ResultSheet />}
              />

              <Route
                path="grading-scale"
                element={<GradingScale />}
              />


              <Route
                path="materials"
                element={<CourseMaterials />}
              />

              <Route
                path="announcements"
                element={<CourseAnnouncements />}
              />

              <Route
                path="examinations/apply"
                element={<ExamApplicationForm />}
              />

              <Route
                path="examinations/success"
                element={<ExamApplicationSuccess />}
              />

            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </Suspense>
  );
}

export default App;