import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Clock, Search, ArrowLeft, Shield, Calendar, Filter } from 'lucide-react';
import { activityLogService } from '../../services/apiService';
import { getCurrentAdminUser } from '../../data/mockAdminData';
import './RoleManagement.css'; // Reuses the container layout styling
import './AdminDashboard.css'; // Standard Activity styling

export const ActivityLogs: React.FC = () => {
    const navigate = useNavigate();
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [roleFilter, setRoleFilter] = useState<string>('all');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const logsData = await activityLogService.getAll().catch(() => []);
                const mapped = logsData.map((log: any) => ({
                    id: log.id,
                    user: log.user ? log.user.full_name : 'Unknown User',
                    role: log.user ? log.user.role : 'N/A',
                    action: log.action,
                    target: log.target,
                    type: log.type || 'system',
                    timestamp: log.created_at
                }));
                setLogs(mapped);
            } catch (err) {
                console.error('Failed to load activity logs:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLogs();
    }, []);

    const getRoleLabel = (role: string) => {
        return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const getRoleColor = (role: string) => {
        switch (role.toLowerCase()) {
            case 'super_admin': return { bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5' };
            case 'director': return { bg: '#EDE9FE', text: '#7C3AED', border: '#C084FC' };
            case 'coordinator': return { bg: '#FEF3C7', text: '#D97706', border: '#FCD34D' };
            case 'secretary': return { bg: '#DBEAFE', text: '#2563EB', border: '#93C5FD' };
            case 'lecturer': return { bg: '#E0F2FE', text: '#0369A1', border: '#7DD3FC' };
            case 'student': return { bg: '#D1FAE5', text: '#059669', border: '#10B981' };
            case 'pro_student': return { bg: '#FEF3C7', text: '#D97706', border: '#FCD34D' };
            default: return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' };
        }
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch = 
            log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.target.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesRole = roleFilter === 'all' || log.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    if (isLoading) {
        return (
            <div className="rm-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '450px' }}>
                <div style={{ textAlign: 'center', color: '#64748B' }}>
                    <div style={{ width: '48px', height: '48px', border: '3px solid #E2E8F0', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                    <p style={{ fontWeight: 600 }}>Loading activity logs history...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="rm-container">
            {/* Header */}
            <div className="admin-page-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <button 
                    className="cm-back-text-btn" 
                    style={{ marginBottom: '16px', marginLeft: '-16px', display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#7C3AED', fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => navigate('/admin/dashboard')}
                >
                    <ArrowLeft size={18} /> Back to Dashboard
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <div>
                        <h1 className="admin-page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Activity size={28} style={{ color: '#7C3AED' }} /> Activity History
                        </h1>
                        <p className="admin-page-subtitle">Track and monitor all administrative modifications and staff actions over the last 6 months.</p>
                    </div>
                    <span className="admin-count-badge" style={{ fontSize: '12px' }}>
                        Total Logs: {filteredLogs.length}
                    </span>
                </div>
            </div>

            {/* Filters Section */}
            <div style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid rgba(0, 0, 0, 0.04)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                marginBottom: '24px',
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap'
            }}>
                {/* Search */}
                <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input 
                        type="text" 
                        placeholder="Search logs by staff name, action, or target details..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 16px 12px 42px',
                            borderRadius: '12px',
                            border: '1px solid #E2E8F0',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: '#1E293B',
                            outline: 'none',
                            transition: 'border-color 0.2s',
                            boxSizing: 'border-box'
                        }}
                        onFocus={e => e.target.style.borderColor = '#7C3AED'}
                        onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                    />
                </div>

                {/* Filter by Role */}
                <div style={{ minWidth: '200px', position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Filter size={16} style={{ color: '#64748B' }} />
                    <select
                        value={roleFilter}
                        onChange={e => setRoleFilter(e.target.value)}
                        style={{
                            padding: '12px 32px 12px 16px',
                            borderRadius: '12px',
                            border: '1px solid #E2E8F0',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: '#1E293B',
                            outline: 'none',
                            cursor: 'pointer',
                            appearance: 'none',
                            background: '#FFFFFF url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748B\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'/%3E%3C/svg%3E") no-repeat right 12px center',
                            backgroundSize: '16px',
                            minWidth: '160px'
                        }}
                    >
                        <option value="all">All Roles</option>
                        <option value="super_admin">Super Admin</option>
                        <option value="director">Director</option>
                        <option value="coordinator">Course Coordinator</option>
                        <option value="secretary">Course Secretary</option>
                        <option value="lecturer">Lecturer</option>
                        <option value="student">Student</option>
                        <option value="pro_student">Pro Student</option>
                    </select>
                </div>
            </div>

            {/* Logs List Card */}
            <div style={{
                background: '#FFFFFF',
                borderRadius: '18px',
                border: '1px solid rgba(0, 0, 0, 0.04)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                overflow: 'hidden'
            }}>
                {filteredLogs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '64px 20px', color: '#64748B' }}>
                        <Activity size={48} style={{ margin: '0 auto 16px', opacity: 0.3, color: '#7C3AED' }} />
                        <h3 style={{ margin: '0 0 6px 0', color: '#1E293B', fontSize: '16px', fontWeight: 600 }}>No logs found</h3>
                        <p style={{ margin: 0, fontSize: '14px' }}>Try adjusting your search criteria or role filters.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {filteredLogs.map((log, index) => {
                            const badge = getRoleColor(log.role);
                            return (
                                <div 
                                    key={log.id}
                                    style={{
                                        display: 'flex',
                                        gap: '16px',
                                        padding: '16px 24px',
                                        borderBottom: index !== filteredLogs.length - 1 ? '1px solid #F1F5F9' : 'none',
                                        transition: 'background-color 0.2s',
                                        alignItems: 'flex-start'
                                    }}
                                    className="activity-row"
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    {/* Icon */}
                                    <div className={`activity-icon ${log.type}`} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '12px',
                                        flexShrink: 0
                                    }}>
                                        <Activity size={18} />
                                    </div>

                                    {/* Main info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                                            <span style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>{log.user}</span>
                                            <span style={{
                                                fontSize: '10px',
                                                fontWeight: 700,
                                                color: badge.text,
                                                backgroundColor: badge.bg,
                                                border: `1px solid ${badge.border}`,
                                                padding: '2px 8px',
                                                borderRadius: '20px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}>
                                                {getRoleLabel(log.role)}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '14px', color: '#334155', lineHeight: 1.5 }}>
                                            {log.action}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#7C3AED', fontWeight: 600, marginTop: '4px' }}>
                                            {log.target}
                                        </div>
                                    </div>

                                    {/* Date & Time */}
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-end',
                                        gap: '4px',
                                        flexShrink: 0,
                                        fontSize: '12px',
                                        color: '#94A3B8'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                                            <Calendar size={12} /> {new Date(log.timestamp).toLocaleDateString()}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                                            <Clock size={12} /> {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
