import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet, Navigate } from 'react-router-dom';
import { LogOut, LayoutGrid, Clock, Library } from 'lucide-react';
import { SignOutModal } from '../auth/SignOutModal';
import { authService, courseApplicationService } from '../../services/apiService';
import { SupportBubble } from './SupportBubble';
import { getFullAvatarUrl } from '../../data/mockAdminData';
import './ApplicantDashboard.css';

export const ApplicantDashboard: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSignOutOpen, setIsSignOutOpen] = useState(false);
    const [hasApplication, setHasApplication] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const isNestedRoute = location.pathname !== '/applicant-dashboard';
    const token = sessionStorage.getItem('token');
    const userStr = sessionStorage.getItem('user');

    useEffect(() => {
        if (token && userStr) {
            fetchApplications();
        } else {
            setIsLoading(false);
        }
    }, [token, userStr]);

    const fetchApplications = async () => {
        try {
            const apps = await courseApplicationService.getMyApplications();
            setHasApplication(apps && apps.length > 0);
        } catch (error) {
            console.error("Failed to fetch applications", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!token || !userStr) {
        return <Navigate to="/login" replace />;
    }

    const user = JSON.parse(userStr);

    const handleSignOutConfirm = () => {
        setIsSignOutOpen(false);

        // Clear local storage first
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('adminRole');

        // Call API in background
        authService.logout().catch(() => { });

        navigate('/login', { replace: true });
    };

    if (isLoading && !isNestedRoute) {
        return <div className="applicant-workspace-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading workspace...</div>;
    }

    return (
        <div className="applicant-workspace-container">
            {/* Header */}
            <header className="workspace-header">
                <div className="header-brand">
                    <div className="brand-icon">
                        <LayoutGrid size={24} />
                    </div>
                    <h2>Applicant Workspace</h2>
                </div>
                <div className="workspace-header-actions">
                    <div className="user-profile-summary">
                        <img
                            src={user.avatar ? getFullAvatarUrl(user.avatar) : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.display_name || user.displayName || user.full_name)}&background=7C3AED&color=fff`}
                            alt="Profile"
                            className="avatar"
                        />
                        <span className="user-name">{user.display_name || user.displayName || user.full_name}</span>
                    </div>
                    <button className="sign-out-btn" onClick={() => setIsSignOutOpen(true)}>
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="workspace-main">
                {isNestedRoute ? (
                    <Outlet context={{ hasApplication, fetchApplications }} />
                ) : (
                    <>
                        <div className="welcome-banner-applicant">
                            <h1>Welcome, {(user.display_name || user.displayName || user.full_name).split(' ')[0]}!</h1>
                            <p>Track your application status and manage your enrollment details from this temporary workspace.</p>
                        </div>

                        <div className="applicant-massive-actions">
                            <button
                                className={`massive-action-card primary-action ${hasApplication ? 'disabled' : ''}`}
                                onClick={() => !hasApplication ? navigate('/applicant-dashboard/new-course') : null}
                                style={{ opacity: hasApplication ? 0.6 : 1, cursor: hasApplication ? 'not-allowed' : 'pointer' }}
                            >
                                <div className="massive-icon-circle">
                                    <Library size={42} />
                                </div>
                                <h3>Apply Available Courses</h3>
                                <p>Browse our available programs and start your application process to join CODL.</p>
                                {hasApplication && (
                                    <span style={{ display: 'inline-block', marginTop: '12px', fontSize: '12px', padding: '4px 8px', background: '#FEF3C7', color: '#D97706', borderRadius: '4px', fontWeight: 600 }}>APPLICATION PENDING</span>
                                )}
                            </button>

                            <button
                                className={`massive-action-card secondary-action ${!hasApplication ? 'disabled' : ''}`}
                                onClick={() => hasApplication ? navigate('/applicant-dashboard/track-status') : null}
                                style={{ opacity: !hasApplication ? 0.6 : 1, cursor: !hasApplication ? 'not-allowed' : 'pointer' }}
                            >
                                <div className="massive-icon-circle">
                                    <Clock size={42} />
                                </div>
                                <h3>Track Status</h3>
                                <p>Already applied? Check the real-time status of your pending course application.</p>
                                {!hasApplication && (
                                    <span style={{ display: 'inline-block', marginTop: '12px', fontSize: '12px', padding: '4px 8px', background: '#F1F5F9', color: '#64748B', borderRadius: '4px', fontWeight: 600 }}>NO ACTIVE APPLICATION</span>
                                )}
                            </button>
                        </div>


                    </>
                )}
            </main>

            <SignOutModal
                isOpen={isSignOutOpen}
                onClose={() => setIsSignOutOpen(false)}
                onConfirm={handleSignOutConfirm}
            />

            <SupportBubble />
        </div>
    );
};
