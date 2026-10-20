import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, Phone, Mail, ShieldCheck, Eye, EyeOff, Monitor } from 'lucide-react';
import { authService } from '../../services/apiService';
import './LoginPortal.css'; 

export const AdminLogin: React.FC = () => {
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
        const adminRole = sessionStorage.getItem('adminRole');
        if (token && adminRole) {
            if (['secretary', 'coordinator', 'lecturer'].includes(adminRole)) {
                navigate('/admin/courses', { replace: true });
            } else {
                navigate('/admin/dashboard', { replace: true });
            }
        }
    }, [navigate]);

    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const data = await authService.login({ login: loginId, password });

            const studentRoles = ['student', 'applicant'];
            if (studentRoles.includes(data.user.role)) {
                try { await authService.logout(); } catch (_) { }
                setError('This portal is for staff only. Please use the Student Portal to sign in.');
                setIsLoading(false);
                return;
            }

            sessionStorage.setItem('token', data.access_token);
            sessionStorage.setItem('user', JSON.stringify(data.user));
            sessionStorage.setItem('adminRole', data.user.role);
            if (['secretary', 'coordinator', 'lecturer'].includes(data.user.role)) {
                navigate('/admin/courses');
            } else {
                navigate('/admin/dashboard');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid login credentials. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

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
                            The CODL SUSL Admin Portal is optimized for desktop computers and larger screens. Please log in to the staff workspace using a desktop screen.
                        </p>
                        <div className="admin-mobile-block-footer">
                            Please open this page on a device with a screen width of at least 1024px.
                        </div>
                    </div>
                </div>
            )}
            <div className="login-form-container">
                    <div className="welcome-header desktop-only">
                        <h2 className="welcome-title">Welcome to CODL</h2>
                        <p className="welcome-subtitle">Administrative & Staff Workspace Login</p>
                    </div>

                    <div className="auth-view-container fade-in-up" style={{ marginTop: '20px' }}>
                        <div className="auth-card existing-student-card">
                            <div className="card-top-indicator"></div>
                            <div className="auth-card-header">
                                <div className="icon-wrapper purple-icon">
                                    <ShieldCheck size={20} />
                                </div>
                                <div className="header-text">
                                    <h3>Staff Portal Login</h3>
                                    <p>Administrative & Staff Workspace Access</p>
                                </div>
                            </div>

                            <form className="auth-form" onSubmit={handleLogin}>
                                {error && (
                                    <div className="error-banner" style={{
                                        padding: '12px',
                                        background: '#FEF2F2',
                                        color: '#DC2626',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        marginBottom: '20px',
                                        border: '1px solid #FEE2E2'
                                    }}>
                                        {error}
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>Registration Number</label>
                                    <input
                                        type="text"
                                        value={loginId}
                                        onChange={(e) => setLoginId(e.target.value)}
                                        required
                                        disabled={isLoading}
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
                                            disabled={isLoading}
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
                                </div>

                                <button type="submit" className="btn-primary auth-submit-btn" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <span className="btn-spinner"></span>
                                            <span>Authenticating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Sign In</span>
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </>
        );
};
