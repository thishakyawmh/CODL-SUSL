import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Users, Search, Check, X, Loader, Eye,
    ChevronRight, RefreshCw, AlertCircle, Clock, CheckCircle2, XCircle, ArrowRight
} from 'lucide-react';
import { courseService, batchService } from '../../services/apiService';
import { toast } from '../../utils/toast';
import './CourseManagement.css';

interface HistoryItem {
    id: number;
    date: string;
    datetime: string;
    from_group?: string | null;
    to_group: string;
    method?: string;
    text: string;
}

interface GroupRequest {
    id: number;
    user_id: number;
    course_id: number;
    batch_id: number | null;
    batch_name: string | null;
    current_group: string | null;
    requested_group: string;
    reason: string | null;
    status: 'pending' | 'approved' | 'rejected';
    action_by: number | null;
    action_at: string | null;
    action_comment: string | null;
    created_at: string;
    user?: {
        id: number;
        student_number?: string;
        full_name: string;
        display_name?: string;
        email: string;
    };
    actionUser?: {
        id: number;
        full_name: string;
    };
    exchange_history?: HistoryItem[];
}

export const BatchGroupExchangeRequests: React.FC = () => {
    const { id, batchId } = useParams<{ id: string; batchId: string }>();
    const navigate = useNavigate();

    const [courseTitle, setCourseTitle] = useState<string>('');
    const [batchName, setBatchName] = useState<string>('');
    const [requests, setRequests] = useState<GroupRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state for viewing/reviewing a request
    const [selectedRequest, setSelectedRequest] = useState<GroupRequest | null>(null);
    const [actionComment, setActionComment] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const loadData = async () => {
        if (!id || !batchId) return;
        try {
            setIsLoading(true);
            const courseData = await courseService.getManageCourseData(id, { refresh: true });
            if (courseData?.course) {
                setCourseTitle(courseData.course.title || 'Course');
            }

            const currentBatch = (courseData?.batches || []).find((b: any) =>
                b.id.toString() === batchId.toString() || b.name === batchId
            );
            if (currentBatch) {
                setBatchName(currentBatch.name);
            }

            const res = await batchService.getGroupRequests(id, batchId);
            setRequests(res.requests || []);
            if (res.batch?.name) {
                setBatchName(res.batch.name);
            }
        } catch (err: any) {
            console.error('Failed to load group exchange requests:', err);
            toast.error(err.response?.data?.message || 'Failed to load group exchange requests.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [id, batchId]);

    const handleResolve = async (action: 'approve' | 'reject') => {
        if (!selectedRequest || !id || !batchId) return;
        try {
            setIsProcessing(true);
            const res = await batchService.resolveGroupRequest(id, batchId, selectedRequest.id, {
                action,
                comment: actionComment.trim() || undefined
            });

            toast.success(res.message || `Request ${action}d successfully!`);
            setSelectedRequest(null);
            setActionComment('');
            await loadData();
        } catch (err: any) {
            console.error(`Failed to ${action} request:`, err);
            toast.error(err.response?.data?.message || `Failed to ${action} request.`);
        } finally {
            setIsProcessing(false);
        }
    };

    const counts = useMemo(() => {
        const pending = requests.filter(r => r.status === 'pending').length;
        const approved = requests.filter(r => r.status === 'approved').length;
        const rejected = requests.filter(r => r.status === 'rejected').length;
        return { total: requests.length, pending, approved, rejected };
    }, [requests]);

    const filteredRequests = useMemo(() => {
        return requests.filter(r => {
            const matchesStatus = statusFilter === 'all' || r.status === statusFilter;

            const uName = r.user?.display_name || r.user?.full_name || '';
            const uId = r.user?.student_number || r.user?.id?.toString() || '';
            const uEmail = r.user?.email || '';
            const q = searchQuery.toLowerCase().trim();

            const matchesSearch = !q ||
                uName.toLowerCase().includes(q) ||
                uId.toLowerCase().includes(q) ||
                uEmail.toLowerCase().includes(q) ||
                r.requested_group.toLowerCase().includes(q) ||
                (r.current_group && r.current_group.toLowerCase().includes(q));

            return matchesStatus && matchesSearch;
        });
    }, [requests, statusFilter, searchQuery]);

    if (isLoading) {
        return (
            <div className="cm-container" style={{ padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                <Loader size={36} style={{ animation: 'spin 0.7s linear infinite', color: 'var(--primary-color)' }} />
                <p style={{ color: '#64748B', fontSize: '15px', fontWeight: 600 }}>Loading Group Exchange Requests...</p>
            </div>
        );
    }

    return (
        <div className="cm-container" style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '60px' }}>
            {/* Breadcrumb Navigation */}
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <button
                    className="am-back-btn"
                    onClick={() => navigate(`/admin/courses/manage/${id}/batches/${batchId}/groups`)}
                    title="Back to Batch Groups"
                >
                    <ArrowLeft size={18} />
                </button>
                <div className="admin-breadcrumb">
                    <span onClick={() => navigate('/admin/courses')}>Course Management</span>
                    <ChevronRight size={14} />
                    <span onClick={() => navigate(`/admin/courses/manage/${id}`)}>{courseTitle}</span>
                    <ChevronRight size={14} />
                    <span onClick={() => navigate(`/admin/courses/manage/${id}?batch=${encodeURIComponent(batchName)}`)}>{batchName}</span>
                    <ChevronRight size={14} />
                    <span onClick={() => navigate(`/admin/courses/manage/${id}/batches/${batchId}/groups`)}>Batch Groups</span>
                    <ChevronRight size={14} />
                    <span className="current">Exchange Requests</span>
                </div>
            </div>

            {/* Page Header */}
            <div style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                padding: '28px 32px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                marginBottom: '24px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: '#F5F3FF', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users size={28} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                                {batchName} — Group Exchange Requests
                            </h1>
                            <p style={{ color: '#64748B', fontSize: '14px', margin: '4px 0 0 0' }}>
                                Review student requests to change groups, inspect their exchange history, and approve or reject requests.
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                            type="button"
                            className="admin-btn-outline"
                            onClick={() => loadData()}
                            title="Refresh Data"
                            style={{ height: '42px', padding: '0 16px', borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <RefreshCw size={15} />
                            <span>Refresh</span>
                        </button>
                        <button
                            type="button"
                            className="admin-btn-secondary"
                            style={{ height: '42px', padding: '0 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 700 }}
                            onClick={() => navigate(`/admin/courses/manage/${id}/batches/${batchId}/groups`)}
                        >
                            ← Back to Group Allocation
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginTop: '24px' }}>
                    <div style={{ background: '#FFFBEB', borderRadius: '14px', padding: '16px', border: '1px solid #FDE68A' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending Requests</span>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#B45309', marginTop: '4px' }}>{counts.pending}</div>
                    </div>
                    <div style={{ background: '#ECFDF5', borderRadius: '14px', padding: '16px', border: '1px solid #A7F3D0' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Approved</span>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#047857', marginTop: '4px' }}>{counts.approved}</div>
                    </div>
                    <div style={{ background: '#FEF2F2', borderRadius: '14px', padding: '16px', border: '1px solid #FECACA' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rejected</span>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#B91C1C', marginTop: '4px' }}>{counts.rejected}</div>
                    </div>
                    <div style={{ background: '#F8FAFC', borderRadius: '14px', padding: '16px', border: '1px solid #E2E8F0' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Requests</span>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>{counts.total}</div>
                    </div>
                </div>
            </div>

            {/* Filter and Content Card */}
            <div style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                padding: '24px 28px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
            }}>
                {/* Status Tabs and Search */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                    <div style={{ display: 'inline-flex', background: '#F1F5F9', borderRadius: '12px', padding: '4px', gap: '4px' }}>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('pending')}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: 700,
                                border: 'none',
                                cursor: 'pointer',
                                background: statusFilter === 'pending' ? '#FFFFFF' : 'transparent',
                                color: statusFilter === 'pending' ? '#D97706' : '#64748B',
                                boxShadow: statusFilter === 'pending' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <Clock size={14} />
                            <span>Pending ({counts.pending})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('approved')}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: 700,
                                border: 'none',
                                cursor: 'pointer',
                                background: statusFilter === 'approved' ? '#FFFFFF' : 'transparent',
                                color: statusFilter === 'approved' ? '#059669' : '#64748B',
                                boxShadow: statusFilter === 'approved' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <CheckCircle2 size={14} />
                            <span>Approved ({counts.approved})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('rejected')}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: 700,
                                border: 'none',
                                cursor: 'pointer',
                                background: statusFilter === 'rejected' ? '#FFFFFF' : 'transparent',
                                color: statusFilter === 'rejected' ? '#DC2626' : '#64748B',
                                boxShadow: statusFilter === 'rejected' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <XCircle size={14} />
                            <span>Rejected ({counts.rejected})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('all')}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: 700,
                                border: 'none',
                                cursor: 'pointer',
                                background: statusFilter === 'all' ? '#FFFFFF' : 'transparent',
                                color: statusFilter === 'all' ? 'var(--primary-color)' : '#64748B',
                                boxShadow: statusFilter === 'all' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
                            }}
                        >
                            All ({counts.total})
                        </button>
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                        <input
                            type="text"
                            placeholder="Search by student, ID, group..."
                            className="admin-input"
                            style={{
                                paddingLeft: '36px',
                                paddingRight: '14px',
                                height: '42px',
                                width: '280px',
                                fontSize: '13px',
                                borderRadius: '10px',
                                boxSizing: 'border-box'
                            }}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Requests Table */}
                <div className="cm-table-container premium-table-wrapper" style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
                    <table className="cm-table interactive-table">
                        <thead>
                            <tr>
                                <th style={{ width: '25%' }}>Student Details</th>
                                <th style={{ width: '16%' }}>Student ID / Reg No</th>
                                <th style={{ width: '15%' }}>Existing Group</th>
                                <th style={{ width: '15%' }}>Requested Group</th>
                                <th style={{ width: '12%' }}>Requested Date</th>
                                <th style={{ width: '10%' }}>Status</th>
                                <th style={{ width: '7%', textAlign: 'center' }}>Review</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.map(req => {
                                const u = req.user;
                                const studentName = u?.display_name || u?.full_name || `Student #${req.user_id}`;
                                const studentId = u?.student_number || `ID ${req.user_id}`;
                                const dateFormatted = req.created_at ? new Date(req.created_at).toLocaleDateString() : 'N/A';

                                return (
                                    <tr key={req.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#F1F5F9', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px' }}>
                                                    {studentName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="student-name-bold">{studentName}</div>
                                                    <div className="student-email-muted">{u?.email || 'No email'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="id-badge-minimal">{studentId}</span>
                                        </td>
                                        <td>
                                            {req.current_group ? (
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '3px 10px',
                                                    borderRadius: '10px',
                                                    fontSize: '12px',
                                                    fontWeight: 700,
                                                    background: '#F1F5F9',
                                                    color: '#475569',
                                                    border: '1px solid #E2E8F0'
                                                }}>
                                                    {req.current_group}
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600 }}>Unassigned</span>
                                            )}
                                        </td>
                                        <td>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '3px 10px',
                                                borderRadius: '10px',
                                                fontSize: '12px',
                                                fontWeight: 700,
                                                background: '#F5F3FF',
                                                color: 'var(--primary-color)',
                                                border: '1px solid #DDD6FE'
                                            }}>
                                                {req.requested_group}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '13px', color: '#64748B' }}>
                                            {dateFormatted}
                                        </td>
                                        <td>
                                            {req.status === 'pending' && (
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                    padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 800,
                                                    background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A'
                                                }}>
                                                    <Clock size={12} /> Pending
                                                </span>
                                            )}
                                            {req.status === 'approved' && (
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                    padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 800,
                                                    background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0'
                                                }}>
                                                    <Check size={12} /> Approved
                                                </span>
                                            )}
                                            {req.status === 'rejected' && (
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                    padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 800,
                                                    background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA'
                                                }}>
                                                    <X size={12} /> Rejected
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedRequest(req);
                                                    setActionComment(req.action_comment || '');
                                                }}
                                                title="View & Review Request Details"
                                                style={{
                                                    width: '34px',
                                                    height: '34px',
                                                    borderRadius: '8px',
                                                    background: '#F8FAFC',
                                                    border: '1px solid #E2E8F0',
                                                    color: 'var(--primary-color)',
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.background = '#F5F3FF';
                                                    e.currentTarget.style.borderColor = 'var(--primary-color)';
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.background = '#F8FAFC';
                                                    e.currentTarget.style.borderColor = '#E2E8F0';
                                                }}
                                            >
                                                <Eye size={17} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredRequests.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                        <Users size={44} style={{ opacity: 0.25, marginBottom: '12px' }} />
                        <p style={{ fontWeight: 600, margin: 0 }}>No group exchange requests found for the selected filter.</p>
                    </div>
                )}
            </div>

            {/* Request Detail & Review Modal */}
            {selectedRequest && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '20px'
                }}>
                    <div style={{
                        background: '#FFFFFF',
                        borderRadius: '20px',
                        width: '100%',
                        maxWidth: '560px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        maxHeight: '90vh'
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            padding: '20px 24px',
                            borderBottom: '1px solid #E2E8F0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#F8FAFC'
                        }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                                    Review Group Exchange Request
                                </h3>
                                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>
                                    Submitted on {selectedRequest.created_at ? new Date(selectedRequest.created_at).toLocaleString() : 'N/A'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedRequest(null)}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4 }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Student Info Card */}
                            <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#EDE9FE', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '16px' }}>
                                    {(selectedRequest.user?.display_name || selectedRequest.user?.full_name || 'S').charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '15px' }}>
                                        {selectedRequest.user?.display_name || selectedRequest.user?.full_name}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                                        <span><strong>Reg No:</strong> {selectedRequest.user?.student_number || `ID ${selectedRequest.user_id}`}</span>
                                        <span>•</span>
                                        <span><strong>Email:</strong> {selectedRequest.user?.email}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Group Transition Card */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr auto 1fr',
                                alignItems: 'center',
                                gap: '12px',
                                background: '#FFFFFF',
                                border: '1px solid #E2E8F0',
                                borderRadius: '14px',
                                padding: '16px',
                                textAlign: 'center'
                            }}>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '6px' }}>Current Group</div>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '4px 14px',
                                        borderRadius: '10px',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        background: '#F1F5F9',
                                        color: '#475569',
                                        border: '1px solid #CBD5E1'
                                    }}>
                                        {selectedRequest.current_group || 'Unassigned'}
                                    </span>
                                </div>

                                <div style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ArrowRight size={22} />
                                </div>

                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary-color)', textTransform: 'uppercase', marginBottom: '6px' }}>Requested Group</div>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '4px 14px',
                                        borderRadius: '10px',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        background: '#F5F3FF',
                                        color: 'var(--primary-color)',
                                        border: '1px solid #DDD6FE'
                                    }}>
                                        {selectedRequest.requested_group}
                                    </span>
                                </div>
                            </div>

                            {/* Reason for Exchange */}
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                                    Reason for Exchange:
                                </label>
                                <div style={{
                                    background: '#F8FAFC',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: '10px',
                                    padding: '12px 14px',
                                    fontSize: '13px',
                                    color: selectedRequest.reason ? '#1E293B' : '#94A3B8',
                                    lineHeight: 1.5,
                                    fontStyle: selectedRequest.reason ? 'normal' : 'italic'
                                }}>
                                    {selectedRequest.reason ? `"${selectedRequest.reason}"` : 'No specific reason provided by student.'}
                                </div>
                            </div>

                            {/* Previous Group Exchanges History */}
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                                    Previous Group Exchanges History:
                                </label>
                                <div style={{
                                    background: '#F8FAFC',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: '10px',
                                    padding: '12px 14px',
                                    maxHeight: '130px',
                                    overflowY: 'auto'
                                }}>
                                    {selectedRequest.exchange_history && selectedRequest.exchange_history.length > 0 ? (
                                        <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {selectedRequest.exchange_history.map(h => (
                                                <li key={h.id} style={{ fontSize: '12px', color: '#334155', lineHeight: 1.4 }}>
                                                    <strong>{h.date}</strong> exchanged into group <strong>{h.to_group}</strong>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <span style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>
                                            No previous group exchanges available for this student.
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Status Banner or Action Comment */}
                            {selectedRequest.status !== 'pending' ? (
                                <div style={{
                                    background: selectedRequest.status === 'approved' ? '#ECFDF5' : '#FEF2F2',
                                    border: `1px solid ${selectedRequest.status === 'approved' ? '#A7F3D0' : '#FECACA'}`,
                                    borderRadius: '10px',
                                    padding: '12px 14px',
                                    fontSize: '13px',
                                    color: selectedRequest.status === 'approved' ? '#065F46' : '#991B1B'
                                }}>
                                    <strong>Status: {selectedRequest.status.toUpperCase()}</strong>
                                    {selectedRequest.action_at && (
                                        <span> on {new Date(selectedRequest.action_at).toLocaleString()}</span>
                                    )}
                                    {selectedRequest.actionUser?.full_name && (
                                        <span> by {selectedRequest.actionUser.full_name}</span>
                                    )}
                                    {selectedRequest.action_comment && (
                                        <div style={{ marginTop: '4px', fontSize: '12px' }}>
                                            Note: {selectedRequest.action_comment}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                                        Staff Comment / Rejection Note (Optional):
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Add an optional review note..."
                                        className="admin-input"
                                        style={{ height: '42px', width: '100%', fontSize: '13px', borderRadius: '10px', padding: '0 14px', boxSizing: 'border-box' }}
                                        value={actionComment}
                                        onChange={e => setActionComment(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div style={{
                            padding: '16px 24px',
                            borderTop: '1px solid #E2E8F0',
                            background: '#F8FAFC',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '10px'
                        }}>
                            <button
                                type="button"
                                className="admin-btn-outline"
                                style={{ height: '40px', padding: '0 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600 }}
                                onClick={() => setSelectedRequest(null)}
                                disabled={isProcessing}
                            >
                                Close
                            </button>

                            {selectedRequest.status === 'pending' && (
                                <>
                                    <button
                                        type="button"
                                        style={{
                                            height: '40px',
                                            padding: '0 18px',
                                            borderRadius: '10px',
                                            fontSize: '13px',
                                            fontWeight: 700,
                                            background: '#FEF2F2',
                                            color: '#DC2626',
                                            border: '1px solid #FECACA',
                                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                        onClick={() => handleResolve('reject')}
                                        disabled={isProcessing}
                                    >
                                        <X size={16} /> Reject
                                    </button>

                                    <button
                                        type="button"
                                        className="admin-btn-primary"
                                        style={{
                                            height: '40px',
                                            padding: '0 20px',
                                            borderRadius: '10px',
                                            fontSize: '13px',
                                            fontWeight: 700,
                                            background: 'var(--primary-color)',
                                            color: '#FFFFFF',
                                            border: 'none',
                                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                        onClick={() => handleResolve('approve')}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader size={15} style={{ animation: 'spin 0.7s linear infinite' }} />
                                                <span>Processing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Check size={16} /> Approve & Exchange
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
