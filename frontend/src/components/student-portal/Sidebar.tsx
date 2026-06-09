import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FilePlus, FileText, User, Settings, Power, Menu, X } from 'lucide-react';
import { SignOutModal } from '../auth/SignOutModal';
import { authService } from '../../services/apiService';
import { getInitials, getAvatarColor, getFullAvatarUrl } from '../../data/mockAdminData';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSignOutOpen, setIsSignOutOpen] = useState(false);

    const handleSignOutConfirm = () => {
        setIsSignOutOpen(false);
        
        // Clear local storage first to guarantee UI updates instantly
        sessionStorage.clear();
        
        // Call API in background
        authService.logout().catch(() => {});
        
        navigate('/login', { replace: true });
    };

    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Close sidebar on route change for mobile
    useEffect(() => {
        setIsMobileOpen(false);
    }, [location.pathname]);

    const getStudentUser = () => {
        if (typeof window !== 'undefined') {
            const userStr = sessionStorage.getItem('user');
            if (userStr) {
                try {
                    return JSON.parse(userStr);
                } catch (e) {
                    console.error("Failed to parse stored student user", e);
                }
            }
        }
        return null;
    };

    const user = getStudentUser();
    const fullName = user ? (user.display_name || user.displayName || user.full_name || user.fullName) : 'Haleema Sultan';
    const role = user ? user.role : 'student';
    const avatar = user && user.avatar ? user.avatar : '';

    const getBranding = () => {
        const cached = localStorage.getItem('systemSettings');
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                return {
                    logo: parsed.logo || '/images/logo.png',
                    institution: parsed.institution_name || 'Centre for Open & Distance Learning',
                    university: parsed.university_name || 'Sabaragamuwa University of Sri Lanka',
                };
            } catch (e) {}
        }
        return {
            logo: '/images/logo.png',
            institution: 'Centre for Open & Distance Learning',
            university: 'Sabaragamuwa University of Sri Lanka',
        };
    };
    
    const branding = getBranding();

    const getRoleLabel = (roleStr: string) => {
        if (roleStr === 'super_admin') return 'Super Admin';
        if (roleStr === 'student') return 'Student';
        if (roleStr === 'applicant') return 'Applicant';
        return roleStr.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <>
            {/* Mobile Header Toggle */}
            <div className="mobile-header">
                <div className="logo-mobile">
                    <img src={branding.logo} alt="Logo" />
                    <h1>
                        {branding.institution === 'Centre for Open & Distance Learning' || branding.institution === 'Centre for Open and Distance Learning' ? 'CODL' : (branding.institution.length > 15 ? branding.institution.substring(0, 15) + '...' : branding.institution)}
                    </h1>
                </div>
                <button className="mobile-toggle" onClick={() => setIsMobileOpen(!isMobileOpen)}>
                    {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div className="sidebar-overlay" onClick={() => setIsMobileOpen(false)}></div>
            )}

            <div className={`sidebar ${isMobileOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <img src={branding.logo} alt="Logo" />
                        <div className="sidebar-logo-text">
                            <h1 className="sidebar-brand-title" style={{ fontSize: (branding.institution === 'Centre for Open & Distance Learning' || branding.institution === 'Centre for Open and Distance Learning' ? 'CODL' : branding.institution).length > 15 ? '16px' : '28px' }}>
                                {branding.institution === 'Centre for Open & Distance Learning' || branding.institution === 'Centre for Open and Distance Learning' ? 'CODL' : branding.institution}
                            </h1>
                            <span className="sidebar-brand-subtitle" style={{ fontSize: '10px', whiteSpace: 'normal', display: 'block', lineHeight: '1.2' }}>
                                {branding.university}
                            </span>
                        </div>
                    </div>

                    <div className="sidebar-header-divider"></div>

                    <div className="sidebar-profile-card">
                        <div className="sidebar-profile-content">
                            <div className="sidebar-profile-avatar-wrapper">
                                {avatar ? (
                                    <img src={getFullAvatarUrl(avatar)} alt="Profile" className="sidebar-profile-image" />
                                ) : (
                                    <div 
                                        className="sidebar-profile-initials"
                                        style={{ backgroundColor: getAvatarColor(fullName) }}
                                    >
                                        {getInitials(fullName)}
                                    </div>
                                )}
                                <div className="status-indicator"></div>
                            </div>
                            <div className="sidebar-profile-info">
                                <h3 className="sidebar-profile-name">{fullName}</h3>
                                <p className="sidebar-profile-role">{getRoleLabel(role)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="sidebar-nav-container">
                    <nav className="sidebar-nav">
                        <div className="nav-group">
                            <a href="#" className={`nav-item ${location.pathname === '/dashboard' || location.pathname === '/' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}>
                                <span className="nav-item-icon"><LayoutDashboard size={18} /></span>
                                <span className="nav-item-text">Dashboard</span>
                            </a>
                            <a href="#" className={`nav-item ${location.pathname === '/letter-request' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); navigate('/letter-request'); }}>
                                <span className="nav-item-icon"><FileText size={18} /></span>
                                <span className="nav-item-text">Letter Requests</span>
                            </a>

                            <a href="#" className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); navigate('/profile'); }}>
                                <span className="nav-item-icon"><User size={18} /></span>
                                <span className="nav-item-text">Profile</span>
                            </a>
                            <a href="#" className={`nav-item ${location.pathname === '/settings' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); navigate('/settings'); }}>
                                <span className="nav-item-icon"><Settings size={18} /></span>
                                <span className="nav-item-text">Settings</span>
                            </a>

                            <div className="nav-divider"></div>

                            <button
                                className="nav-item-highlight"
                                onClick={(e) => { e.preventDefault(); navigate('/new-course'); }}
                            >
                                <span className="nav-item-icon-highlight"><FilePlus size={16} /></span>
                                <span className="nav-item-text">Explore Courses</span>
                            </button>
                        </div>
                    </nav>

                    <div className="sidebar-bottom-actions">
                        <button className="sidebar-logout-btn" onClick={() => setIsSignOutOpen(true)}>
                            <Power size={18} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>

                <SignOutModal
                    isOpen={isSignOutOpen}
                    onClose={() => setIsSignOutOpen(false)}
                    onConfirm={handleSignOutConfirm}
                />
            </div>
        </>
    );
};
