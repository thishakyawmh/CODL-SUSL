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
        <>
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
                            <div className="card-top-indicator" style={{ background: 'var(--primary-color)' }}></div>
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
            </>
        );
};
