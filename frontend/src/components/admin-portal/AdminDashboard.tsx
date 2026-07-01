import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, ClipboardCheck, BookOpen, TrendingUp,
    ArrowUpRight, ArrowDownRight, Clock, Activity,
    CheckCircle2, XCircle, UserPlus, GraduationCap,
    FileText, AlertTriangle, MapPin, Globe, Sparkles
} from 'lucide-react';
import {
    mockActivityLogs, getCurrentAdminUser
} from '../../data/mockAdminData';
import {
    userService,
    courseService,
    courseApplicationService,
    letterRequestService,
    postponementRequestService,
    examApplicationService,
    reattemptRequestService,
    activityLogService
} from '../../services/apiService';
import './AdminDashboard.css';

const getRoleLabel = (role: string) => {
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const user = getCurrentAdminUser();

    const [realUsers, setRealUsers] = useState<any[]>([]);
    const [realCourses, setRealCourses] = useState<any[]>([]);
    const [courseApplications, setCourseApplications] = useState<any[]>([]);
    const [pendingCount, setPendingCount] = useState<number>(0);
    const [activityLogs, setActivityLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const userRole = user?.role;
    const userId = user?.id;

    useEffect(() => {
        if (userRole && ['secretary', 'coordinator', 'lecturer'].includes(userRole)) {
            navigate('/admin/courses', { replace: true });
        }
    }, [userRole, navigate]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [
                    usersData,
                    coursesData,
                    courseApps,
                    letterReqs,
                    postponementReqs,
                    examApps,
                    reattemptReqs,
                    logsData
                ] = await Promise.all([
                    userService.getAll().catch(() => []),
                    courseService.getAll().catch(() => []),
                    courseApplicationService.getAll().catch(() => []),
                    letterRequestService.getAll().catch(() => []),
                    postponementRequestService.getAll().catch(() => []),
                    examApplicationService.getAll().catch(() => []),
                    reattemptRequestService.getAll().catch(() => []),
                    activityLogService.getAll().catch(() => [])
                ]);

                setRealUsers(usersData);
                setCourseApplications(courseApps);

                const mappedLogs = logsData.map((log: any) => ({
                    id: log.id,
                    user: log.user ? log.user.full_name : 'Unknown User',
                    role: log.user ? getRoleLabel(log.user.role) : 'N/A',
                    action: log.action,
                    target: log.target,
                    type: log.type || 'system',
                    timestamp: log.created_at
                }));
                setActivityLogs(mappedLogs);
                
                const mappedCourses = coursesData.map((c: any) => ({
                    id: c.id.toString(),
                    title: c.title,
                    code: c.code,
                    level: c.level,
                    department: c.department || 'Computing',
                    intakeStatus: c.intake_status,
                    activeStudents: c.students_count || 0,
                    totalStudents: c.max_students || 0,
                    duration: c.duration || '6 Months',
                    batches: c.batches || [],
                    batchesCount: c.batches_count || 0,
                    secretary: c.secretary?.full_name || 'Not Assigned',
                    coordinator: c.coordinator?.full_name || 'Not Assigned'
                }));
                setRealCourses(mappedCourses);

                let pCourses = 0;
                let pLetters = 0;
                let pPostponements = 0;
                let pExams = 0;
                let pReattempts = 0;

                if (userRole === 'director') {
                    pCourses = courseApps.filter((app: any) => app.status === 'pending' && app.approval_level === 2).length;
                    pLetters = letterReqs.filter((req: any) => req.status === 'pending' && req.approval_level === 2).length;
                    pPostponements = postponementReqs.filter((req: any) => req.status === 'pending' && req.current_step === 3).length;
                    pExams = examApps.filter((req: any) => req.status === 'pending' && req.current_step === 3).length;
                    pReattempts = reattemptReqs.filter((req: any) => req.status === 'pending' && req.current_step === 3).length;
                } else if (userRole === 'super_admin') {
                    pCourses = courseApps.filter((app: any) => app.status === 'pending').length;
                    pLetters = letterReqs.filter((req: any) => req.status === 'pending').length;
                    pPostponements = postponementReqs.filter((req: any) => req.status === 'pending').length;
                    pExams = examApps.filter((req: any) => req.status === 'pending').length;
                    pReattempts = reattemptReqs.filter((req: any) => req.status === 'pending').length;
                }

                setPendingCount(pCourses + pLetters + pPostponements + pExams + pReattempts);

            } catch (err) {
                console.error('Failed to load dashboard statistics:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [userRole, userId]);

    // Geographic analysis
    const districtMap: Record<string, number> = {};
    courseApplications.forEach(a => {
        if (a.district) districtMap[a.district] = (districtMap[a.district] || 0) + 1;
    });
    const topDistricts = Object.entries(districtMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxDistrictCount = topDistricts.length > 0 ? topDistricts[0][1] : 1;

    // Course Enrollment Analysis
    const courseEnrollments = realCourses
        .map(c => ({ title: c.title, count: c.activeStudents }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    const maxCourseEnrollment = courseEnrollments.length > 0 ? courseEnrollments[0].count : 1;

    const totalStudentsVal = realUsers.filter(u => u.role === 'student').length;
    const activeStudentsVal = realUsers.filter(u => u.role === 'student' && (u.status === 'active' || !u.status)).length;
    const activeCoursesVal = realCourses.filter(c => c.intakeStatus !== 'Closed').length;
    const totalEnrolledVal = realCourses.reduce((sum, c) => sum + c.activeStudents, 0);

    const kpiCards = [
        {
            label: 'Total Students',
            value: totalStudentsVal,
            subtitle: `${activeStudentsVal} active`,
            icon: <Users size={22} />,
            trend: '+12%',
            trendUp: true,
            type: 'students'
        },
        {
            label: 'Pending Approvals',
            value: pendingCount,
            subtitle: 'Requires attention',
            icon: <ClipboardCheck size={22} />,
            trend: pendingCount > 0 ? 'Action needed' : 'All clear',
            trendUp: false,
            type: 'approvals'
        },
        {
            label: 'Active Courses',
            value: activeCoursesVal,
            subtitle: `${totalEnrolledVal} enrolled`,
            icon: <BookOpen size={22} />,
            trend: '+3%',
            trendUp: true,
            type: 'courses'
        },
        {
            label: 'Total Users',
            value: realUsers.length,
            subtitle: '6 roles configured',
            icon: <TrendingUp size={22} />,
            trend: '+8%',
            trendUp: true,
            type: 'users'
        },
    ];



    if (isLoading) {
        return (
            <div className="admin-dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '450px' }}>
                <div style={{ textAlign: 'center', color: '#64748B' }}>
                    <div style={{ width: '48px', height: '48px', border: '3px solid #E2E8F0', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                    <p style={{ fontWeight: 600 }}>Loading dashboard statistics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            {/* Page Header */}
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Dashboard</h1>
                    <p className="admin-page-subtitle">Welcome back, {user.fullName.split(' ')[0]}. Here's what's happening today.</p>
                </div>
                <div className="admin-header-actions">
                    {/* Add User button removed per user request */}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="admin-kpi-grid">
                {kpiCards.map((card, idx) => (
                    <div className="admin-kpi-card" key={idx}>
                        <div className="kpi-card-top">
                            <div className={`kpi-icon-wrapper ${card.type}`}>
                                {card.icon}
                            </div>
                            <div className={`kpi-trend ${card.trendUp ? 'up' : 'down'}`}>
                                {card.trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                <span>{card.trend}</span>
                            </div>
                        </div>
                        <div className="kpi-card-value">{card.value}</div>
                        <div className="kpi-card-label">{card.label}</div>
                        <div className="kpi-card-subtitle">{card.subtitle}</div>
                    </div>
                ))}
            </div>
            {/* Two-column layout */}
            <div className="admin-dashboard-grid">
                {/* Full Width Column: Activity Feed */}
                <div className="admin-card" style={{ gridColumn: 'span 2' }}>
                    <div className="admin-card-header">
                        <h2><Activity size={20} /> Recent Activity</h2>
                        <button className="admin-link-btn" onClick={() => navigate('/admin/activity-logs')}>View All</button>
                    </div>

                    <div className="activity-feed">
                        {activityLogs.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#64748B' }}>
                                <Activity size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                                <p style={{ fontWeight: 600, fontSize: '14px' }}>No recent admin activities recorded.</p>
                            </div>
                        ) : (
                            activityLogs.slice(0, 5).map(log => (
                                <div className="activity-item" key={log.id}>
                                    <div className={`activity-icon ${log.type}`}>
                                        <Activity size={16} />
                                    </div>
                                    <div className="activity-content">
                                        <div className="activity-action">
                                            <strong>{log.user}</strong> <span style={{ fontSize: '11px', fontWeight: 600, color: '#7C3AED', background: '#F5F3FF', border: '1px solid #DDD6FE', padding: '2px 8px', borderRadius: '12px', marginLeft: '4px', marginRight: '4px' }}>{log.role}</span> {log.action}
                                        </div>
                                        <div className="activity-target">{log.target}</div>
                                        <div className="activity-time">
                                            <Clock size={12} /> {new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
            <div className="admin-dashboard-grid">
                {/* Enrollment by Program */}
                <div className="admin-card">
                    <div className="admin-card-header">
                        <h2><BookOpen size={20} /> Program Distribution</h2>
                        <span className="admin-count-badge">Top 5 Programs</span>
                    </div>
                    <div className="dashboard-stat-grid">
                        {courseEnrollments.map((course, idx) => (
                            <div key={idx} className="dashboard-stat-row">
                                <div className="dashboard-stat-info">
                                    <span className="dashboard-stat-name">{course.title}</span>
                                    <span className="dashboard-stat-value">{course.count}</span>
                                </div>
                                <div className="dashboard-stat-bar-track">
                                    <div 
                                        className="dashboard-stat-bar fill-purple" 
                                        style={{ width: `${(course.count / (maxCourseEnrollment || 1)) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Geographic Outreach */}
                <div className="admin-card">
                    <div className="admin-card-header">
                        <h2><MapPin size={20} /> Regional Outreach</h2>
                        <span className="admin-count-badge">Active Districts</span>
                    </div>
                    <div className="dashboard-stat-grid">
                        {topDistricts.map(([district, count], idx) => (
                            <div key={idx} className="dashboard-stat-row">
                                <div className="dashboard-stat-info">
                                    <span className="dashboard-stat-name">{district} District</span>
                                    <span className="dashboard-stat-value">{count} Applicants</span>
                                </div>
                                <div className="dashboard-stat-bar-track">
                                    <div 
                                        className="dashboard-stat-bar fill-blue" 
                                        style={{ width: `${(count / (maxDistrictCount || 1)) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>

            {/* Course Overview and User Overview side by side */}
            <div className="admin-dashboard-grid">
                {/* Course Stats */}
                <div className="admin-card">
                    <div className="admin-card-header">
                        <h2><BookOpen size={20} /> Course Overview</h2>
                        <button className="admin-link-btn" onClick={() => navigate('/admin/courses')}>Manage</button>
                    </div>

                    <div className="course-overview-list">
                        {realCourses.slice(0, 4).map(course => (
                            <div className="course-overview-item" key={course.id}>
                                <div className="co-info">
                                    <h4>{course.title}</h4>
                                    <div className="co-meta">
                                        <span className="co-level">{course.level}</span>
                                        <span className="co-dot">•</span>
                                        <span>{course.department}</span>
                                    </div>
                                </div>
                                <div className="co-stats">
                                    <div className="co-stat">
                                        <span className="co-stat-val">{course.activeStudents}</span>
                                        <span className="co-stat-label">Active</span>
                                    </div>
                                    <div className="co-stat">
                                        <span className="co-stat-val">{course.totalStudents}</span>
                                        <span className="co-stat-label">Total</span>
                                    </div>
                                    <span className={`co-intake-badge ${(course.intakeStatus || 'Open').toLowerCase().replace(' ', '-')}`}>
                                        {course.intakeStatus}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Users */}
                <div className="admin-card">
                    <div className="admin-card-header">
                        <h2><Users size={20} /> Recent Users</h2>
                        <button className="admin-link-btn" onClick={() => navigate('/admin/users')}>View All</button>
                    </div>

                    <div className="recent-users-list">
                        {realUsers.slice(0, 5).map(user => {
                            return (
                                <div className="recent-user-item" key={user.id}>
                                    <img src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150'} alt={user.fullName || user.full_name} className="ru-avatar" />
                                    <div className="ru-info">
                                        <h4>{user.fullName || user.full_name}</h4>
                                        <span className="ru-id">{user.studentNumber || user.student_number || 'N/A'}</span>
                                    </div>
                                    <span className={`ru-role-badge ${user.role}`}>
                                        {getRoleLabel(user.role)}
                                    </span>
                                    <span className={`ru-status ${user.status || 'active'}`}>
                                        <span className="ru-status-dot"></span>
                                        {user.status || 'active'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

        </div>
    );
};
