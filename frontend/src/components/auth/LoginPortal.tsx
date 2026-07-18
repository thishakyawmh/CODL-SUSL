import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, ArrowRight, BookOpen, ArrowLeft, ChevronRight, MapPin, Phone, Mail, Eye, EyeOff } from 'lucide-react';
import { authService } from '../../services/apiService';
import { SupportBubble } from '../student-portal/SupportBubble';
import './LoginPortal.css';

export const LoginPortal: React.FC = () => {
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

    useEffect(() => {
        const token = sessionStorage.getItem('token');
        const userStr = sessionStorage.getItem('user');
        if (token && userStr) {
            const user = JSON.parse(userStr);
            if (user.role === 'student') {
                navigate('/dashboard', { replace: true });
            } else if (user.role === 'applicant') {
                navigate('/applicant-dashboard', { replace: true });
            } else {
                // Staff/admin users shouldn't use the student portal — send them to admin
                navigate('/admin/dashboard', { replace: true });
            }
        }
    }, [navigate]);

    const [activeView, setActiveView] = useState<'selection' | 'existing' | 'new'>('selection');
    const [regNumber, setRegNumber] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [registerFullName, setRegisterFullName] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const data = await authService.login({ login: regNumber, password });

            // Only registered and existing students can log in from the existing portal
            if (data.user.role !== 'student') {
                // Immediately revoke the session
                try { await authService.logout(); } catch (_) { }
                if (data.user.role === 'applicant') {
                    setError('Applicants cannot login through the existing student portal. Please sign in with Google in the New Applicants section.');
                } else {
                    setError('This portal is for students only. Please use the Staff Portal to sign in.');
                }
                setIsLoading(false);
                return;
            }

            sessionStorage.setItem('token', data.access_token);
            sessionStorage.setItem('user', JSON.stringify(data.user));
            sessionStorage.setItem('adminRole', data.user.role);

            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (registerPassword !== registerConfirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        try {
            const data = await authService.register({
                full_name: registerFullName,
                email: registerEmail,
                password: registerPassword,
                password_confirmation: registerConfirmPassword
            });
            sessionStorage.setItem('token', data.access_token);
            sessionStorage.setItem('user', JSON.stringify(data.user));
            sessionStorage.setItem('adminRole', data.user.role);

            navigate('/applicant-dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Google Sign-In Integration
    const handleGoogleCredentialResponse = async (response: any) => {
        setIsLoading(true);
        setError('');
        try {
            const data = await authService.googleLogin(response.credential);

            // Do not force role to 'applicant' if the user is already a student
            const role = data.user.role;
            const sessionUser = { ...data.user, role: role };

            sessionStorage.setItem('token', data.access_token);
            sessionStorage.setItem('user', JSON.stringify(sessionUser));
            sessionStorage.setItem('adminRole', role);

            // Redirect students to their dashboard, otherwise applicants to applicant dashboard
            if (role === 'student') {
                navigate('/dashboard');
            } else {
                navigate('/applicant-dashboard');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Google Sign-In failed.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (activeView === 'new') {
            const initGoogle = () => {
                if ((window as any).google) {
                    const client_id = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1035613398939-5h8l3u0e0h8p515v353u3q18kclh6e3b.apps.googleusercontent.com';
                    (window as any).google.accounts.id.initialize({
                        client_id: client_id,
                        callback: handleGoogleCredentialResponse,
                    });
                    const container = document.getElementById("google-signin-btn-container");
                    if (container) {
                        const wrapperWidth = container.parentElement?.clientWidth || 280;
                        const buttonWidth = Math.max(200, Math.min(280, wrapperWidth));
                        (window as any).google.accounts.id.renderButton(
                            container,
                            { theme: "outline", size: "large", width: buttonWidth }
                        );
                    }
                } else {
                    setTimeout(initGoogle, 300);
                }
            };
            initGoogle();
        }
    }, [activeView]);

    return (
        <div className="login-portal-wrapper">

            {/* Left Side - Branding & Information */}
            <div className="login-left-pane">
                <div className="branding-container">
                    <div className="branding-header-group">
                        <img src={branding.logo} alt="Logo" className="branding-logo" />
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
                    <p>© {new Date().getFullYear()} CODL. All rights reserved.</p>
                </div>
            </div>

            {/* Right Side - Authentication Forms */}
            <div className="login-right-pane">
                {/* Mobile Branding & Welcome Header */}
                <div className="mobile-header-banner">
                    <div className="mobile-branding-header">
                        <img src={branding.logo} alt="Logo" className="mobile-branding-logo" />
                        <div className="mobile-branding-title-group">
                            <h1 className="mobile-branding-institution">{branding.institution}</h1>
                            <p className="mobile-branding-university">{branding.university}</p>
                        </div>
                    </div>

                    <div className="mobile-welcome-header">
                        <h2 className="mobile-welcome-title">Welcome to CODL</h2>
                        <p className="mobile-welcome-subtitle">
                            {activeView === 'selection' ? 'Please select your relevant portal to continue' :
                                activeView === 'existing' ? 'Login to your official student workspace' :
                                    'Create your identity workspace to start enrolling'}
                        </p>
                    </div>
                </div>

                <div className="login-form-container">
                    <div className="welcome-header desktop-only">
                        <h2 className="welcome-title">Welcome to CODL</h2>
                        <p className="welcome-subtitle">
                            {activeView === 'selection' ? 'Please select your relevant portal to continue' :
                                activeView === 'existing' ? 'Login to your official student workspace' :
                                    'Create your identity workspace to start enrolling'}
                        </p>
                    </div>


                    {activeView === 'selection' && (
                        <div className="auth-cards-wrapper fade-in-up">
                            {/* Existing Students Selection Card */}
                            <div className="auth-card selection-card" onClick={() => setActiveView('existing')}>
                                <div className="card-top-indicator"></div>
                                <div className="auth-card-header" style={{ marginBottom: 0 }}>
                                    <div className="icon-wrapper purple-icon">
                                        <GraduationCap size={24} />
                                    </div>
                                    <div className="header-text" style={{ flexGrow: 1 }}>
                                        <h3>Existing Student</h3>
                                        <p>Login to your existing student workspace</p>
                                    </div>
                                    <div className="action-chevron">
                                        <ChevronRight size={20} color="#94A3B8" />
                                    </div>
                                </div>
                            </div>

                            {/* New Applicants Selection Card */}
                            <div className="auth-card selection-card" onClick={() => setActiveView('new')}>
                                <div className="auth-card-header" style={{ marginBottom: 0 }}>
                                    <div className="icon-wrapper green-icon">
                                        <BookOpen size={24} />
                                    </div>
                                    <div className="header-text" style={{ flexGrow: 1 }}>
                                        <h3>New Applicants</h3>
                                        <p>Apply for new degree, diploma & certificate programs</p>
                                    </div>
                                    <div className="action-chevron">
                                        <ChevronRight size={20} color="#94A3B8" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeView === 'existing' && (
                        <div className="auth-view-container fade-in-up">
                            <button className="back-selection-btn" onClick={() => setActiveView('selection')}>
                                <ArrowLeft size={16} /> Back to Selection
                            </button>

                            <div className="auth-card existing-student-card">
                                <div className="card-top-indicator"></div>
                                <div className="auth-card-header">
                                    <div className="icon-wrapper purple-icon">
                                        <GraduationCap size={20} />
                                    </div>
                                    <div className="header-text">
                                        <h3>Existing Student Login</h3>
                                        <p>Access your student workspace</p>
                                    </div>
                                </div>

                                <form className="auth-form" onSubmit={handleLogin}>
                                    {error && (
                                        <div style={{ color: '#DC2626', background: '#FEF2F2', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '14px' }}>
                                            {error}
                                        </div>
                                    )}
                                    <div className="form-group">
                                        <label>Registration Number</label>
                                        <input
                                            type="text"
                                            value={regNumber}
                                            onChange={(e) => setRegNumber(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Password</label>
                                        <div className="password-input-wrapper">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle-btn"
                                                onClick={() => setShowPassword(!showPassword)}
                                                tabIndex={-1}
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>


                                    <div className="form-options">
                                        <label className="remember-me">
                                            <input type="checkbox" />
                                            <span>Remember me</span>
                                        </label>
                                        <a href="#" className="forgot-password">Forgot Password?</a>
                                    </div>

                                    <button type="submit" className="btn-primary auth-submit-btn" disabled={isLoading}>
                                        {isLoading ? 'Signing In...' : 'Sign In'} <ArrowRight size={18} />
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeView === 'new' && (
                        <div className="auth-view-container fade-in-up">
                            <button className="back-selection-btn" onClick={() => setActiveView('selection')}>
                                <ArrowLeft size={16} /> Back to Selection
                            </button>

                            <div className="auth-card new-applicant-card">
                                <div className="card-top-indicator green-gradient-bar"></div>
                                <div className="auth-card-header" style={{ marginBottom: '20px' }}>
                                    <div className="icon-wrapper green-icon">
                                        <BookOpen size={20} />
                                    </div>
                                    <div className="header-text">
                                        <h3>New Applicant Workspace</h3>
                                        <p>Create your identity to start enrolling</p>
                                    </div>
                                </div>

                                <div className="new-applicant-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '180px' }}>
                                    <p className="new-student-desc" style={{ marginBottom: '24px' }}>
                                        Create a secure applicant workspace to submit your details, track your progress, and check enrollment status.
                                    </p>

                                    <div className="google-btn-wrapper">
                                        <button className="google-sign-in-btn">
                                            <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                                            </svg>
                                            Sign in with Google
                                        </button>
                                        <div id="google-signin-btn-container" className="invisible-google-btn"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}



                </div>
            </div>

            <SupportBubble />
        </div>
    );
};
