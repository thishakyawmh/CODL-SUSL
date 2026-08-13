import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, ChevronRight, MapPin, Phone, Mail } from 'lucide-react';
import { authService } from '../../services/apiService';
import './LoginPortal.css'; 

export const ResetPassword: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const email = searchParams.get('email') || searchParams.get('amp;email') || '';
    const token = searchParams.get('token') || '';

    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

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
        if (!email || !token) {
            setError('Invalid or missing password reset link parameter.');
        }
    }, [email, token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');

        if (password !== passwordConfirmation) {
            setError('Passwords do not match.');
            setIsLoading(false);
            return;
        }

        try {
            const data = await authService.resetPassword({
                email,
                token,
                password,
                password_confirmation: passwordConfirmation
            });
            setMessage(data.message || 'Your password has been successfully reset.');


            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reset password. Link may be expired or invalid.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-portal-wrapper">
            { }
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
                    <div className="pane-footer-content">
                        <p style={{ margin: 0 }}>© {new Date().getFullYear()} CODL. All rights reserved.</p>
                        <div className="pane-footer-links">
                            <span onClick={() => navigate('/login')} className="pane-footer-link">Student Login</span>
                        </div>
                    </div>
                </div>
            </div>

            { }
            <div className="login-right-pane">
                <div className="mobile-header-banner">
                    <div className="mobile-branding-header">
                        <img src={branding.logo} alt="Logo" className="mobile-branding-logo" />
                        <div className="mobile-branding-title-group">
                            <h1 className="mobile-branding-institution">{branding.institution}</h1>
                            <p className="mobile-branding-university">{branding.university}</p>
                        </div>
                    </div>
                </div>

                <div className="login-form-container">
                    <div className="welcome-header">
                        <h2 className="welcome-title">Reset Password</h2>
                        <p className="welcome-subtitle">Set your new password to secure your account</p>
                    </div>

                    <div className="auth-view-container fade-in-up" style={{ marginTop: '20px' }}>
                        <div className="auth-card existing-student-card">
                            <div className="card-top-indicator" style={{ background: '#7C3AED' }}></div>
                            <div className="auth-card-header">
                                <div className="icon-wrapper purple-icon">
                                    <ShieldCheck size={20} />
                                </div>
                                <div className="header-text">
                                    <h3>New Password</h3>
                                    <p>Enter and confirm your new password below</p>
                                </div>
                            </div>

                            <form className="auth-form" onSubmit={handleSubmit}>
                                {error && (
                                    <div style={{ color: '#DC2626', background: '#FEF2F2', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '14px', border: '1px solid #FEE2E2' }}>
                                        {error}
                                    </div>
                                )}

                                {message && (
                                    <div style={{ color: '#16A34A', background: '#DCFCE7', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '14px', border: '1px solid #BBF7D0' }}>
                                        {message} <br />
                                        <span style={{ fontSize: '12px', opacity: 0.8 }}>Redirecting you to the login screen...</span>
                                    </div>
                                )}

                                <div className="form-group" style={{ marginBottom: '10px' }}>
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        disabled
                                        style={{ background: '#F1F5F9', color: '#64748B', cursor: 'not-allowed' }}
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: '15px' }}>
                                    <label>New Password</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Min. 8 characters"
                                            required
                                            minLength={8}
                                            disabled={isLoading || !token}
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

                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                    <label>Confirm Password</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={passwordConfirmation}
                                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                                            placeholder="Confirm your new password"
                                            required
                                            disabled={isLoading || !token}
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle-btn"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            tabIndex={-1}
                                        >
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <button type="submit" className="btn-primary auth-submit-btn" disabled={isLoading || !token} style={{ marginTop: '10px' }}>
                                    {isLoading ? 'Resetting Password...' : 'Save & Continue'} <ChevronRight size={18} />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
