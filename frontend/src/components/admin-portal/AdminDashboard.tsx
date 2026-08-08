import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, ClipboardCheck, BookOpen, TrendingUp,
    ArrowUpRight, ArrowDownRight, Clock, Activity,
    CheckCircle2, XCircle, UserPlus, GraduationCap,
    FileText, AlertTriangle, MapPin, Globe, Sparkles
} from 'lucide-react';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip,
    PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import {
    mockActivityLogs, getCurrentAdminUser
} from '../../data/mockAdminData';
import { statsService } from '../../services/apiService';
import './AdminDashboard.css';

// ============================================================================
// SVG Chart Subcomponents (Option 2: Recharts Library Integration)
// ============================================================================

interface MonthlyData {
    month: string;
    count: number;
}

interface LevelData {
    level: string;
    count: number;
}

// Custom Tooltip component for Recharts Area/Bar charts
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '10px 14px',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                color: '#FFFFFF'
            }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
                <p style={{ margin: '4px 0 0', fontWeight: 800, fontSize: '15px', color: '#FFFFFF' }}>
                    {payload[0].value} <span style={{ fontWeight: 500, fontSize: '12px', color: '#E2E8F0' }}>{payload[0].name === 'count' ? 'Enrolled' : 'Applicants'}</span>
                </p>
            </div>
        );
    }
    return null;
};

// EnrollmentTrendChart using Recharts
const EnrollmentTrendChart: React.FC<{ data: MonthlyData[] }> = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                No trend data available
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorEnrollment" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#7C3AED" stopOpacity="0.3"/>
                            <stop offset="95%" stopColor="#7C3AED" stopOpacity="0.0"/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis 
                        dataKey="month" 
                        tickLine={false} 
                        axisLine={false} 
                        dy={10} 
                        style={{ fontSize: '11px', fontWeight: 500, fill: '#94A3B8' }}
                    />
                    <YAxis 
                        tickLine={false} 
                        axisLine={false} 
                        dx={-5} 
                        style={{ fontSize: '11px', fontWeight: 500, fill: '#94A3B8' }}
                    />
                    <ChartTooltip content={<CustomTooltip />} />
                    <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#7C3AED" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorEnrollment)" 
                        activeDot={{ r: 6, stroke: '#FFFFFF', strokeWidth: 2, fill: '#7C3AED' }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

// ProgramLevelChart using Recharts
const ProgramLevelChart: React.FC<{ data: LevelData[] }> = ({ data }) => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const total = data.reduce((sum, d) => sum + d.count, 0);

    if (total === 0) {
        return (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                No active program distribution data
            </div>
        );
    }

    const COLORS = ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#64748B'];

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index);
    };

    const onPieLeave = () => {
        setActiveIndex(null);
    };

    const activeItem = activeIndex !== null ? data[activeIndex] : null;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', justifyContent: 'center', padding: '10px 0' }}>
            <div style={{ width: 180, height: 180, position: 'relative', flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={4}
                            dataKey="count"
                            nameKey="level"
                            onMouseEnter={onPieEnter}
                            onMouseLeave={onPieLeave}
                        >
                            {data.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={COLORS[index % COLORS.length]} 
                                    style={{
                                        outline: 'none',
                                        transition: 'all 0.2s',
                                        cursor: 'pointer',
                                        transform: activeIndex === index ? 'scale(1.05)' : 'scale(1)',
                                        transformOrigin: 'center'
                                    }}
                                />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    pointerEvents: 'none'
                }}>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>
                        {activeItem ? activeItem.count : total}
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {activeItem ? activeItem.level : 'Students'}
                    </div>
                </div>
            </div>

            <div className="doughnut-legend-grid" style={{ flex: 1, minWidth: '150px' }}>
                {data.map((entry, index) => {
                    const percent = total > 0 ? Math.round((entry.count / total) * 100) : 0;
                    return (
                        <div 
                            className="legend-item" 
                            key={index} 
                            style={{ 
                                opacity: activeIndex !== null && activeIndex !== index ? 0.4 : 1, 
                                transition: 'opacity 0.2s' 
                            }}
                        >
                            <span className="legend-badge" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155', lineHeight: 1.2 }}>{entry.level}</span>
                                <span style={{ fontSize: '11px', color: '#64748B' }}>{entry.count} ({percent}%)</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// GeographicHotspotsChart using Recharts
const GeographicHotspotsChart: React.FC<{ data: [string, number][] }> = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                No regional outreach data
            </div>
        );
    }

    const chartData = data.map(([district, count]) => ({
        district,
        count
    }));

    return (
        <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis 
                        dataKey="district" 
                        tickLine={false} 
                        axisLine={false} 
                        dy={8}
                        style={{ fontSize: '10px', fontWeight: 500, fill: '#94A3B8' }}
                        tickFormatter={(value) => value.length > 8 ? `${value.slice(0, 6)}..` : value}
                    />
                    <YAxis 
                        tickLine={false} 
                        axisLine={false} 
                        dx={-5}
                        style={{ fontSize: '10px', fontWeight: 500, fill: '#94A3B8' }}
                    />
                    <ChartTooltip content={<CustomTooltip />} />
                    <Bar 
                        dataKey="count" 
                        fill="#3B82F6" 
                        radius={[4, 4, 0, 0]}
                        barSize={24}
                    >
                        {chartData.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill="url(#barGradient)" 
                                style={{ cursor: 'pointer' }}
                            />
                        ))}
                    </Bar>
                    <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3B82F6" />
                            <stop offset="100%" stopColor="#60A5FA" />
                        </linearGradient>
                    </defs>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

// ActivityFlowChart using Recharts
const ActivityFlowChart: React.FC<{ data: any[] }> = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                No activity flow data available
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis 
                        dataKey="hour" 
                        tickLine={false} 
                        axisLine={false} 
                        dy={8}
                        style={{ fontSize: '10px', fontWeight: 500, fill: '#94A3B8' }}
                        tickFormatter={(value) => {
                            const hr = parseInt(value.split(':')[0]);
                            return hr % 4 === 0 ? value : '';
                        }}
                    />
                    <YAxis 
                        tickLine={false} 
                        axisLine={false} 
                        dx={-5}
                        style={{ fontSize: '10px', fontWeight: 500, fill: '#94A3B8' }}
                    />
                    <ChartTooltip content={<CustomTooltip />} />
                    <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#10B981" 
                        strokeWidth={2.5} 
                        fillOpacity={1} 
                        fill="url(#colorActivity)" 
                        activeDot={{ r: 5, stroke: '#FFFFFF', strokeWidth: 1.5, fill: '#10B981' }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

// ============================================================================
// Main AdminDashboard Component
// ============================================================================

export const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const user = getCurrentAdminUser();

    const [realUsers, setRealUsers] = useState<any[]>([]);
    const [realCourses, setRealCourses] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({
        totalStudents: 0,
        activeStudents: 0,
        totalUsers: 0,
        activeCourses: 0,
        totalEnrolled: 0,
        totalPendingApprovals: 0
    });
    const [topDistricts, setTopDistricts] = useState<[string, number][]>([]);
    const [courseEnrollments, setCourseEnrollments] = useState<any[]>([]);
    const [monthlyEnrollments, setMonthlyEnrollments] = useState<MonthlyData[]>([]);
    const [levelDistribution, setLevelDistribution] = useState<LevelData[]>([]);
    const [activityFlow, setActivityFlow] = useState<any[]>([]);
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
                const data = await statsService.getFullDashboardData();

                setRealUsers(data.recentUsers || []);
                setStats(data.stats || {});
                setPendingCount(data.stats?.totalPendingApprovals || 0);

                const mappedLogs = (data.recentLogs || []).map((log: any) => ({
                    id: log.id,
                    user: log.user ? log.user.full_name : 'Unknown User',
                    role: log.user ? getRoleLabel(log.user.role) : 'N/A',
                    action: log.action,
                    target: log.target,
                    type: log.type || 'system',
                    timestamp: log.created_at
                }));
                setActivityLogs(mappedLogs);
                
                const mappedCourses = (data.recentCourses || []).map((c: any) => ({
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

                if (data.topDistricts) {
                    setTopDistricts(data.topDistricts.map((d: any) => [d.district, d.count]));
                }
                if (data.courseEnrollments) {
                    setCourseEnrollments(data.courseEnrollments);
                }
                if (data.monthlyEnrollments) {
                    setMonthlyEnrollments(data.monthlyEnrollments);
                }
                if (data.levelDistribution) {
                    setLevelDistribution(data.levelDistribution);
                }
                if (data.activityFlow) {
                    setActivityFlow(data.activityFlow);
                }

            } catch (err) {
                console.error('Failed to load dashboard statistics:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [userRole, userId]);

    const totalStudentsVal = stats.totalStudents || 0;
    const activeStudentsVal = stats.activeStudents || 0;
    const activeCoursesVal = stats.activeCourses || 0;
    const totalEnrolledVal = stats.totalEnrolled || 0;

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
            value: stats.totalUsers || 0,
            subtitle: '6 roles configured',
            icon: <TrendingUp size={22} />,
            trend: '+8%',
            trendUp: true,
            type: 'users'
        },
    ];

    const getRoleLabel = (role: string) => {
        return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

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

            {/* Enrollment Growth Trend (Full Width Column) */}
            <div className="admin-dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="admin-card">
                    <div className="admin-card-header">
                        <h2><TrendingUp size={20} /> Student Enrollment Trend (Trailing 12 Months)</h2>
                        <span className="admin-count-badge">Monthly Admissions</span>
                    </div>
                    <EnrollmentTrendChart data={monthlyEnrollments} />
                </div>
            </div>

            {/* Interactive Slices Grid */}
            <div className="admin-dashboard-grid">
                {/* Program Level Share (Doughnut Chart) */}
                <div className="admin-card">
                    <div className="admin-card-header">
                        <h2><BookOpen size={20} /> Academic Program Share</h2>
                        <span className="admin-count-badge">Level Breakdown</span>
                    </div>
                    <ProgramLevelChart data={levelDistribution} />
                </div>

                {/* Geographic Outreach (Bar Chart) */}
                <div className="admin-card">
                    <div className="admin-card-header">
                        <h2><MapPin size={20} /> Regional Hotspots</h2>
                        <span className="admin-count-badge">Active Districts</span>
                    </div>
                    <GeographicHotspotsChart data={topDistricts} />
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
                        {realCourses.slice(0, 5).map(course => (
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

            {/* Split layout: System Audit and Activity Feed */}
            <div className="admin-dashboard-grid">
                {/* System Activity Flow (Time-Series Area Chart) */}
                <div className="admin-card">
                    <div className="admin-card-header">
                        <h2><Activity size={20} /> System Audit & Activity Flow</h2>
                        <span className="admin-count-badge">24-Hour Logs Volume</span>
                    </div>
                    <ActivityFlowChart data={activityFlow} />
                </div>

                {/* Recent Activity */}
                <div className="admin-card">
                    <div className="admin-card-header">
                        <h2><Activity size={20} /> Recent Activity</h2>
                        <button className="admin-link-btn" onClick={() => navigate('/admin/activity-logs')}>View All</button>
                    </div>

                    <div className="activity-feed" style={{ maxHeight: '220px' }}>
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
        </div>
    );
};
