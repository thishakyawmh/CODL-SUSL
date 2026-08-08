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
// @ts-ignore
import SriLankaMapData from '@svg-maps/sri-lanka';
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
            <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                No trend data available
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: 200 }}>
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
            <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '6px 0' }}>
            {/* Pie Chart Container */}
            <div style={{ width: 180, height: 180, position: 'relative', flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={52}
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
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>
                        {activeItem ? activeItem.count : total}
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {activeItem ? activeItem.level : 'Students'}
                    </div>
                </div>
            </div>

            {/* Legends at the Bottom */}
            <div className="doughnut-legend-grid" style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '4px' }}>
                {data.map((entry, index) => {
                    const percent = total > 0 ? Math.round((entry.count / total) * 100) : 0;
                    return (
                        <div 
                            className="legend-item" 
                            key={index} 
                            style={{ 
                                opacity: activeIndex !== null && activeIndex !== index ? 0.4 : 1, 
                                transition: 'opacity 0.2s',
                                justifyContent: 'center'
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

// GeographicHotspotsChart using Interactive SVG Sri Lanka District Map
const GeographicHotspotsChart: React.FC<{ data: [string, number][] }> = ({ data }) => {
    const [hoveredLocation, setHoveredLocation] = useState<{ x: number, y: number, name: string, count: number } | null>(null);

    if (!data || data.length === 0) {
        return (
            <div style={{ height: '330px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                No regional outreach data
            </div>
        );
    }

    // Find max count to scale color intensity
    const maxCount = Math.max(...data.map(d => d[1]), 1);

    // Map of district counts (case-insensitive key mapping)
    const districtCounts: Record<string, number> = {};
    data.forEach(([dist, count]) => {
        districtCounts[dist.toLowerCase().trim()] = count;
    });

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0' }}>
            {/* Interactive SVG Map of Sri Lanka */}
            <div className="chart-container" style={{ width: '220px', height: '330px', position: 'relative', flexShrink: 0 }}>
                <svg 
                    viewBox={SriLankaMapData.viewBox} 
                    width="100%" 
                    height="100%"
                    style={{ maxHeight: '100%' }}
                >
                    {SriLankaMapData.locations.map((loc: any) => {
                        const nameLower = loc.name.toLowerCase().trim();
                        const count = districtCounts[nameLower] || 0;
                        
                        // Determine color intensity based on weight
                        let fillColor = '#F1F5F9'; // Default light slate
                        let strokeColor = '#CBD5E1';
                        let strokeWidth = '1';

                        if (count > 0) {
                            const ratio = count / maxCount;
                            const lightness = 85 - (ratio * 40);
                            fillColor = `hsl(262, 80%, ${lightness}%)`;
                            strokeColor = '#7C3AED';
                            strokeWidth = '1.5';
                        }

                        return (
                            <g key={loc.id}>
                                <path
                                    d={loc.path}
                                    fill={fillColor}
                                    stroke={strokeColor}
                                    strokeWidth={strokeWidth}
                                    style={{
                                        transition: 'all 0.2s',
                                        cursor: 'pointer',
                                        outline: 'none'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.setAttribute('fill-opacity', '0.8');
                                        e.currentTarget.setAttribute('stroke-width', '2.5');

                                        const svgEl = e.currentTarget.ownerSVGElement;
                                        if (svgEl) {
                                            const rect = svgEl.getBoundingClientRect();
                                            const box = e.currentTarget.getBBox();
                                            const pctX = ((box.x + box.width / 2) / 357.79) * rect.width;
                                            const pctY = ((box.y + box.height / 2) / 661.12) * rect.height;
                                            setHoveredLocation({ x: pctX, y: pctY, name: loc.name, count });
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.setAttribute('fill-opacity', '1');
                                        e.currentTarget.setAttribute('stroke-width', strokeWidth);
                                        setHoveredLocation(null);
                                    }}
                                />
                            </g>
                        );
                    })}
                </svg>

                {/* Hover Tooltip */}
                {hoveredLocation && (
                    <div 
                        className="chart-tooltip"
                        style={{
                            left: `${hoveredLocation.x}px`,
                            top: `${hoveredLocation.y - 52}px`,
                            transform: 'translateX(-50%)',
                            opacity: 1,
                            zIndex: 200,
                            minWidth: '140px',
                            textAlign: 'center'
                        }}
                    >
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#FFFFFF', marginBottom: '3px' }}>{hoveredLocation.name}</div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#CBD5E1' }}>{hoveredLocation.count} Applicant{hoveredLocation.count !== 1 ? 's' : ''}</div>
                    </div>
                )}
            </div>

            {/* District Legend List */}
            {data.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginLeft: '16px', minWidth: '130px' }}>
                    {data.slice(0, 8).map(([dist, count], idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                            <span style={{
                                width: '10px', height: '10px', borderRadius: '3px', flexShrink: 0,
                                background: `hsl(262, 80%, ${85 - ((count / maxCount) * 40)}%)`
                            }}></span>
                            <span style={{ fontWeight: 600, color: '#334155', flex: 1 }}>{dist}</span>
                            <span style={{ fontWeight: 700, color: '#7C3AED', fontSize: '11px' }}>{count}</span>
                        </div>
                    ))}
                </div>
            )}
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
    const [dailyEnrollments, setDailyEnrollments] = useState<any[]>([]);
    const [levelDistribution, setLevelDistribution] = useState<LevelData[]>([]);
    const [activityFlow, setActivityFlow] = useState<any[]>([]);
    const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1y');
    const [demographics, setDemographics] = useState<any>({
        ageSpread: [
            { range: '18-24', count: 0 },
            { range: '25-34', count: 0 },
            { range: '35+', count: 0 },
        ],
        genderRatio: [
            { name: 'Male', value: 0, fill: '#3B82F6' },
            { name: 'Female', value: 0, fill: '#EC4899' },
        ]
    });
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
                if (data.dailyEnrollments) {
                    setDailyEnrollments(data.dailyEnrollments);
                }
                if (data.levelDistribution) {
                    setLevelDistribution(data.levelDistribution);
                }
                if (data.activityFlow) {
                    setActivityFlow(data.activityFlow);
                }
                if (data.demographics) {
                    setDemographics(data.demographics);
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

    const getFilteredTrendData = () => {
        switch (selectedTimeframe) {
            case '1m':
                return dailyEnrollments.map(d => ({
                    month: d.day,
                    count: d.count
                }));
            case '3m':
                return monthlyEnrollments.slice(-3);
            case '6m':
                return monthlyEnrollments.slice(-6);
            case '1y':
                return monthlyEnrollments.slice(-12);
            case '2y':
                return monthlyEnrollments.slice(-24);
            case '3y':
                return monthlyEnrollments;
            default:
                return monthlyEnrollments.slice(-12);
        }
    };

    const getTimeframeLabel = () => {
        switch (selectedTimeframe) {
            case '1m': return 'Daily Admissions';
            case '3m': return 'Trailing 3 Months';
            case '6m': return 'Trailing 6 Months';
            case '1y': return 'Trailing 12 Months';
            case '2y': return 'Trailing 24 Months';
            case '3y': return 'Trailing 36 Months';
            default: return 'Admissions Trend';
        }
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

            {/* Row 1: Student Enrollment Trend (2fr) & Academic Program Share (1fr) */}
            <div className="admin-dashboard-grid" style={{ gridTemplateColumns: '2.1fr 1fr', marginBottom: '28px' }}>
                <div className="admin-card">
                    <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <h2><TrendingUp size={20} /> Student Enrollment Trend</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                            <span className="admin-count-badge">{getTimeframeLabel()}</span>
                            <div style={{ display: 'flex', background: '#F1F5F9', padding: '4px', borderRadius: '8px', gap: '2px' }}>
                                {['1m', '3m', '6m', '1y', '2y', '3y'].map(tf => {
                                    const labels: Record<string, string> = {
                                        '1m': '1M', '3m': '3M', '6m': '6M', '1y': '1Y', '2y': '2Y', '3y': '3Y'
                                    };
                                    return (
                                        <button
                                            key={tf}
                                            onClick={() => setSelectedTimeframe(tf)}
                                            style={{
                                                border: 'none',
                                                background: selectedTimeframe === tf ? '#7C3AED' : 'transparent',
                                                color: selectedTimeframe === tf ? '#FFFFFF' : '#64748B',
                                                padding: '4px 10px',
                                                borderRadius: '6px',
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease'
                                            }}
                                        >
                                            {labels[tf]}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <EnrollmentTrendChart data={getFilteredTrendData()} />
                </div>

                {/* Program Level Share (Doughnut Chart) */}
                <div className="admin-card">
                    <div className="admin-card-header">
                        <h2><BookOpen size={20} /> Academic Program Share</h2>
                        <span className="admin-count-badge">Level Breakdown</span>
                    </div>
                    <ProgramLevelChart data={levelDistribution} />
                </div>
            </div>

            {/* Row 2: Student Demographics (Full Width Column with Age Curve and Gender Gauge) */}
            <div className="admin-dashboard-grid" style={{ gridTemplateColumns: '1fr', marginBottom: '28px' }}>
                <div className="admin-card">
                    <div className="admin-card-header">
                        <h2><Users size={20} /> Student Demographics</h2>
                        <span className="admin-count-badge">Age & Gender Profiling</span>
                    </div>
                    <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', justifyContent: 'space-around', alignItems: 'center', padding: '10px 0' }}>
                        {/* Age Spread: Smooth Curve Line/Area Chart */}
                        <div style={{ flex: 1, minWidth: '280px', height: '220px' }}>
                            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '16px', textAlign: 'center' }}>Age Distribution (Ranges)</h4>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={demographics.ageSpread} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorAge" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                                    <XAxis dataKey="range" tickLine={false} axisLine={false} style={{ fontSize: '11px', fontWeight: 600, fill: '#64748B' }} />
                                    <YAxis tickLine={false} axisLine={false} style={{ fontSize: '11px', fontWeight: 600, fill: '#64748B' }} />
                                    <ChartTooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="count" name="Students" stroke="#7C3AED" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAge)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Gender Ratio: Clean Gauge */}
                        <div style={{ width: '280px', height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px', textAlign: 'center' }}>Gender Distribution</h4>
                            <div style={{ width: '100%', height: '160px', position: 'relative' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={demographics.genderRatio}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={70}
                                            paddingAngle={3}
                                            dataKey="value"
                                            nameKey="name"
                                        >
                                            {demographics.genderRatio.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Ratio</span>
                                </div>
                            </div>
                            {/* Legend labels */}
                            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                                {demographics.genderRatio.map((g: any, idx: number) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: g.fill }}></span>
                                        <span>{g.name}: {g.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 3: Regional Hotspots & Recent Users */}
            <div className="admin-dashboard-grid" style={{ gridTemplateColumns: 'auto 1fr', marginBottom: '28px' }}>
                {/* Geographic Outreach (Map) */}
                <div className="admin-card">
                    <div className="admin-card-header">
                        <h2><MapPin size={20} /> Regional Hotspots</h2>
                        <span className="admin-count-badge">Active Districts</span>
                    </div>
                    <GeographicHotspotsChart data={topDistricts} />
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

            {/* Row 4: Recent Activity - Full Width */}
            <div className="admin-dashboard-grid" style={{ gridTemplateColumns: '1fr', marginBottom: '28px' }}>
                <div className="admin-card">
                    <div className="admin-card-header">
                        <h2><Activity size={20} /> Recent Activity</h2>
                        <button className="admin-link-btn" onClick={() => navigate('/admin/activity-logs')}>View All</button>
                    </div>

                    <div className="activity-feed" style={{ maxHeight: '350px' }}>
                        {activityLogs.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#64748B' }}>
                                <Activity size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                                <p style={{ fontWeight: 600, fontSize: '14px' }}>No recent admin activities recorded.</p>
                            </div>
                        ) : (
                            activityLogs.slice(0, 8).map(log => (
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
