import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, ChevronRight, MapPin, Phone } from 'lucide-react';
import { authService } from '../../services/apiService';
import './LoginPortal.css'; 

export const ForgotPassword: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            const data = await authService.forgotPassword(email);
            setMessage(data.message || 'Password reset link has been sent to your email.');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
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
                            <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>|</span>
                            <span onClick={() => navigate('/staff/login')} className="pane-footer-link">Staff Login</span>
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
                        <h2 className="welcome-title">Forgot Password</h2>
                        <p className="welcome-subtitle">Recover access to your CODL account</p>
                    </div>

                    <div className="auth-view-container fade-in-up" style={{ marginTop: '20px' }}>
                        <button className="back-selection-btn" onClick={() => navigate('/login')} style={{ marginBottom: '20px' }}>
                            <ArrowLeft size={16} /> Back to Sign In
                        </button>

                        <div className="auth-card existing-student-card">
                            <div className="card-top-indicator" style={{ background: '#7C3AED' }}></div>
                            <div className="auth-card-header">
                                <div className="icon-wrapper purple-icon">
                                    <Mail size={20} />
                                </div>
                                <div className="header-text">
                                    <h3>Reset Request</h3>
                                    <p>Enter your email to receive a password reset link</p>
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
                                        {message}
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>Registered Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="student@example.com"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>

                                <button type="submit" className="btn-primary auth-submit-btn" disabled={isLoading} style={{ marginTop: '10px' }}>
                                    {isLoading ? 'Sending Link...' : 'Send Reset Link'} <ChevronRight size={18} />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
