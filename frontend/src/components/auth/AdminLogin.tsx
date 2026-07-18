import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, Phone, Mail, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { authService } from '../../services/apiService';
import './LoginPortal.css'; // Reusing existing styles for consistency

export const AdminLogin: React.FC = () => {
    const navigate = useNavigate();

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

            // Only staff/admin roles can log in from the staff portal
            const studentRoles = ['student', 'applicant'];
            if (studentRoles.includes(data.user.role)) {
                // Immediately revoke the session — this portal is not for students
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

            {/* Right Side - Staff Authentication Form */}
            <div className="login-right-pane">
                <div className="login-form-container">
                    <div className="welcome-header">
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
                                    <a href="#" className="forgot-password">Forgot Password?</a>
                                </div>

                                <button type="submit" className="btn-primary auth-submit-btn" disabled={isLoading}>
                                    {isLoading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={18} />
                                </button>
                            </form>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
