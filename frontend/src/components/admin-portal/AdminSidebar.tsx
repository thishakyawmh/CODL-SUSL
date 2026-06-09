import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Users, BookOpen, ClipboardCheck,
    FileText, Settings, Power, Menu, X,
    ChevronDown, Sparkles, Search, GraduationCap, Megaphone,
    User
} from 'lucide-react';
import { SignOutModal } from '../auth/SignOutModal';
import { getCurrentAdminUser, getInitials, getAvatarColor, getFullAvatarUrl } from '../../data/mockAdminData';
import { authService } from '../../services/apiService';

import './AdminSidebar.css';

interface NavItemDef {
    label: string;
    icon: React.ReactNode;
    path: string;
    badge?: number;
    children?: { label: string; path: string; badge?: number }[];
}

export const AdminSidebar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSignOutOpen, setIsSignOutOpen] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState<string[]>(['approvals']);



    const handleSignOutConfirm = () => {
        setIsSignOutOpen(false);
        
        // Clear local storage first
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('adminRole');
        
        // Call API in background
        authService.logout().catch(() => {});
        
        navigate('/staff/login', { replace: true });
    };

    useEffect(() => {
        setIsMobileOpen(false);
    }, [location.pathname]);

    const toggleMenu = (key: string) => {
        setExpandedMenus(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const isActive = (path: string) => 
        location.pathname === path || (path !== '/admin' && path !== '/admin/dashboard' && location.pathname.startsWith(path));
    
    const isParentActive = (children: { path: string }[]) =>
        children.some(c => isActive(c.path));

    const user = getCurrentAdminUser();

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

    const getRoleLabel = (role: string) => {
        if (role === 'super_admin') return 'Super Admin';
        if (role === 'coordinator') return 'Course Coordinator';
        if (role === 'secretary') return 'Course Secretary';
        return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const navItems: NavItemDef[] = [
        {
            label: 'Dashboard',
            icon: <LayoutDashboard size={18} />,
            path: '/admin/dashboard',
        },
        {
            label: 'Course Management',
            icon: <BookOpen size={18} />,
            path: '/admin/courses',
        },
        {
            label: 'Announcements',
            icon: <Megaphone size={18} />,
            path: '/admin/announcements',
        },
        {
            label: 'Letter Requests',
            icon: <FileText size={18} />,
            path: '/admin/letters',
        },
        {
            label: 'Track Student',
            icon: <Search size={18} />,
            path: '/admin/track-student',
        },
        {
            label: 'AI Analytics',
            icon: <Sparkles size={18} />,
            path: '/admin/ai-analytics',
        },
        {
            label: 'User Management',
            icon: <Users size={18} />,
            path: '/admin/users',
        },
        {
            label: (user?.role === 'coordinator' || user?.role === 'secretary' || user?.role === 'lecturer') ? 'Profile' : 'Settings',
            icon: (user?.role === 'coordinator' || user?.role === 'secretary' || user?.role === 'lecturer') ? <User size={18} /> : <Settings size={18} />,
            path: '/admin/settings',
        },
    ].filter(item => {
        if (user?.role === 'coordinator' || user?.role === 'secretary') {
            return !['Dashboard', 'Announcements', 'Track Student', 'AI Analytics', 'User Management'].includes(item.label);
        }
        if (user?.role === 'lecturer') {
            return !['Dashboard', 'Announcements', 'Track Student', 'AI Analytics', 'User Management', 'Letter Requests'].includes(item.label);
        }
        return true;
    });

    return (
        <>
            {/* Mobile Header */}
            <div className="admin-mobile-header">
                <div className="admin-logo-mobile">
                    <img src={branding.logo} alt="Logo" />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h1 style={{ fontSize: '20px', margin: 0 }}>
                            {branding.institution === 'Centre for Open & Distance Learning' || branding.institution === 'Centre for Open and Distance Learning' ? 'CODL' : (branding.institution.length > 15 ? branding.institution.substring(0, 15) + '...' : branding.institution)}
                        </h1>
                        <span style={{ fontSize: '10px', color: '#4a5568', fontWeight: 500, lineHeight: 1 }}>{branding.university}</span>
                    </div>
                </div>
                <button className="admin-mobile-toggle" onClick={() => setIsMobileOpen(!isMobileOpen)}>
                    {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {isMobileOpen && (
                <div className="admin-sidebar-overlay" onClick={() => setIsMobileOpen(false)}></div>
            )}

            <div className={`admin-sidebar ${isMobileOpen ? 'open' : ''}`}>
                {/* Header Comp */}
                <div className="admin-sidebar-header">
                    <div className="admin-sidebar-logo">
                        <img src={branding.logo} alt="Logo" />
                        <div className="admin-sidebar-logo-text">
                            <h1 className="admin-brand-title" style={{ fontSize: (branding.institution === 'Centre for Open & Distance Learning' || branding.institution === 'Centre for Open and Distance Learning' ? 'CODL' : branding.institution).length > 15 ? '16px' : '28px' }}>
                                {branding.institution === 'Centre for Open & Distance Learning' || branding.institution === 'Centre for Open and Distance Learning' ? 'CODL' : branding.institution}
                            </h1>
                            <span className="admin-brand-subtitle" style={{ fontSize: '10px', whiteSpace: 'normal', display: 'block', lineHeight: '1.2' }}>
                                {branding.university}
                            </span>
                        </div>
                    </div>

                    <div className="admin-header-divider"></div>

                    <div className="admin-profile-card">
                        <div className="admin-profile-content">
                            <div className="admin-avatar-wrapper">
                                {user.avatar ? (
                                    <img src={getFullAvatarUrl(user.avatar)} alt={user.fullName} className="admin-profile-image" />
                                ) : (
                                    <div 
                                        className="admin-profile-initials"
                                        style={{ backgroundColor: getAvatarColor(user.fullName) }}
                                    >
                                        {getInitials(user.fullName)}
                                    </div>
                                )}
                                <div className="admin-status-dot"></div>
                            </div>
                            <div className="admin-profile-info">
                                <h3 className="admin-profile-name">{user.fullName}</h3>
                                <p className="admin-profile-role">{getRoleLabel(user.role)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="admin-nav-container">
                    <nav className="admin-nav">
                        <div className="admin-nav-group">
                            {navItems.map(item => {
                                if (item.children) {
                                    const key = item.label.toLowerCase().replace(/\s/g, '');
                                    const isExpanded = expandedMenus.includes(key);
                                    const parentActive = isParentActive(item.children);

                                    return (
                                        <div key={item.label} className="admin-nav-submenu-wrapper">
                                            <button
                                                className={`admin-nav-item ${parentActive ? 'active' : ''}`}
                                                onClick={() => toggleMenu(key)}
                                            >
                                                <span className={`admin-nav-icon ${parentActive ? 'icon-active' : ''}`}>{item.icon}</span>
                                                <span className="admin-nav-text">{item.label}</span>
                                                {item.badge && (
                                                    <span className="admin-nav-badge">{item.badge}</span>
                                                )}
                                                <ChevronDown size={14} className={`admin-chevron ${isExpanded ? 'rotated' : ''}`} />
                                            </button>
                                            <div className={`admin-submenu ${isExpanded ? 'expanded' : ''}`}>
                                                {item.children.map(child => (
                                                    <a
                                                        key={child.path}
                                                        href="#"
                                                        className={`admin-submenu-item ${isActive(child.path) ? 'active' : ''}`}
                                                        onClick={(e) => { e.preventDefault(); navigate(child.path); }}
                                                    >
                                                        <span className="admin-submenu-dot"></span>
                                                        {child.label}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <a
                                        key={item.path}
                                        href="#"
                                        className={`admin-nav-item ${isActive(item.path) ? 'active' : ''}`}
                                        onClick={(e) => { e.preventDefault(); navigate(item.path); }}
                                    >
                                        <span className={`admin-nav-icon ${isActive(item.path) ? 'icon-active' : ''}`}>{item.icon}</span>
                                        <span className="admin-nav-text">{item.label}</span>
                                    </a>
                                );
                            })}
                        </div>
                    </nav>

                    <div className="admin-sidebar-bottom">
                        <button className="admin-logout-btn" onClick={() => setIsSignOutOpen(true)}>
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
