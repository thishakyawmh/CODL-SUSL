import React, { useState, useEffect } from 'react';
import {
    Search,
    Eye, CheckCircle2, XCircle,
    Download, X, Clock, Check,
    User, BookOpen, ShieldCheck, RefreshCw
} from 'lucide-react';
import { letterRequestService } from '../../services/apiService';
import { VerificationStages } from '../common/VerificationStages';
import { getCurrentAdminUser } from '../../data/mockAdminData';

import { toast } from '../../utils/toast';
import './CourseManagement.css';
import './ApplicationApprovals.css';

export const LetterRequests: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const currentUser = getCurrentAdminUser();


    const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    const [showApproveModal, setShowApproveModal] = useState(false);
    const [approvalComment, setApprovalComment] = useState('');

    const fetchRequests = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const data = await letterRequestService.getAll();
            setRequests(data);
        } catch (err) {
            console.error("Failed to fetch letter requests", err);
            toast.error("Failed to load letter requests.");
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await fetchRequests(false);
            toast.success("List refreshed successfully!");
        } catch (error) {
            console.error("Refresh failed:", error);
            toast.error("Failed to refresh list.");
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchRequests(true);
    }, []);

    const handleApproveClick = (req: any) => {
        setSelectedRequest(req);
        setApprovalComment('');
        setShowApproveModal(true);
    };

    const handleApproveConfirm = async () => {
        if (!selectedRequest) return;
        try {
            await letterRequestService.approve(selectedRequest.id, { comment: approvalComment });
            toast.success("Request approved successfully.");
            setShowApproveModal(false);
            setShowDetailModal(false);
            setSelectedRequest(null);
            fetchRequests();
        } catch (err: any) {
            console.error("Approve failed", err);
            const msg = err.response?.data?.message || "Failed to approve request.";
            toast.error(msg);
        }
    };

    const handleRejectClick = (req: any) => {
        setSelectedRequest(req);
        setRejectionReason('');
        setShowRejectModal(true);
    };

    const handleRejectConfirm = async () => {
        if (!selectedRequest || !rejectionReason.trim()) return;
        try {
            await letterRequestService.reject(selectedRequest.id, { comment: rejectionReason });
            toast.success("Request rejected successfully.");
            setShowRejectModal(false);
            setShowDetailModal(false);
            setSelectedRequest(null);
            fetchRequests();
        } catch (err: any) {
            console.error("Reject failed", err);
            const msg = err.response?.data?.message || "Failed to reject request.";
            toast.error(msg);
        }
    };

    const handleViewDetail = (req: any) => {
        setSelectedRequest(req);
        setShowDetailModal(true);
    };

    const getRoleBasedStatus = (req: any) => {
        const status = req.status.toLowerCase();
        const level = req.approval_level;

        if (status === 'rejected') {
            if (level === 0) return { label: 'Rejected by Secretary', bg: '#FEE2E2', text: '#DC2626' };
            if (level === 1) return { label: 'Rejected by Coordinator', bg: '#FEE2E2', text: '#DC2626' };
            if (level === 2) return { label: 'Rejected by Director', bg: '#FEE2E2', text: '#DC2626' };
            return { label: 'Rejected', bg: '#FEE2E2', text: '#DC2626' };
        }

        if (currentUser.role === 'secretary') {
            if (level === 0) return { label: 'Pending', bg: '#FEF3C7', text: '#D97706' };
            return { label: 'Approved', bg: '#D1FAE5', text: '#059669' };
        }

        if (currentUser.role === 'coordinator') {
            if (level === 1) return { label: 'Pending', bg: '#FEF3C7', text: '#D97706' };
            return { label: 'Approved', bg: '#D1FAE5', text: '#059669' };
        }

        if (currentUser.role === 'director') {
            if (level === 2) return { label: 'Pending', bg: '#FEF3C7', text: '#D97706' };
            return { label: 'Approved', bg: '#D1FAE5', text: '#059669' };
        }

        // For Super Admin
        if (status === 'approved') return { label: 'Approved', bg: '#D1FAE5', text: '#059669' };
        if (level === 0) return { label: 'Pending Secretary', bg: '#FEF3C7', text: '#D97706' };
        if (level === 1) return { label: 'Pending Coordinator', bg: '#FEF3C7', text: '#D97706' };
        if (level === 2) return { label: 'Pending Director', bg: '#FEF3C7', text: '#D97706' };

        return { label: req.status.toUpperCase(), bg: '#F1F5F9', text: '#475569' };
    };


    const canAction = (req: any) => {
        if (req.status !== 'pending') return false;
        if (currentUser.role === 'super_admin') return false;

        const level = req.approval_level;
        if (level === 0 && currentUser.role === 'secretary' && req.course?.secretary_id?.toString() === currentUser.id?.toString()) return true;
        if (level === 1 && currentUser.role === 'coordinator' && req.course?.coordinator_id?.toString() === currentUser.id?.toString()) return true;
        if (level === 2 && currentUser.role === 'director') return true;

        return false;
    };

    const filteredRequests = requests.filter(req => {
        const studentName = req.user?.display_name || req.user?.displayName || req.name_with_initials || req.user?.full_name || '';
        const regNum = req.registration_number || '';
        const letterType = req.letter_type || '';

        const matchesSearch = studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            letterType.toLowerCase().includes(searchTerm.toLowerCase()) ||
            regNum.toLowerCase().includes(searchTerm.toLowerCase());

        const roleStatus = getRoleBasedStatus(req).label.toLowerCase();

        let matchesStatus = true;
        if (statusFilter !== 'All') {
            if (statusFilter === 'Pending') {
                matchesStatus = roleStatus.includes('pending');
            } else if (statusFilter === 'Approved') {
                matchesStatus = roleStatus.includes('approved');
            } else if (statusFilter === 'Rejected') {
                matchesStatus = roleStatus.includes('rejected');
            }
        }

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="cm-container">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Letter Requests</h1>
                    <p className="admin-page-subtitle">Review and process student requests for official letters and certificates.</p>
                </div>
                <div className="admin-header-actions">
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="admin-btn-outline"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '40px', padding: '0 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#475569' }}
                    >
                        <RefreshCw size={16} style={{ animation: isRefreshing ? 'spin 1.5s linear infinite' : 'none' }} />
                        {isRefreshing ? 'Refreshing...' : 'Refresh List'}
                    </button>
                </div>
            </div>

            <div className="cm-filters">
                <div className="cm-search">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search by student, ID or type..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="cm-filter-pills">
                    {['All', 'Pending', 'Approved', 'Rejected'].map(status => (
                        <button
                            key={status}
                            className={`cm-pill ${statusFilter === status ? 'active' : ''}`}
                            onClick={() => setStatusFilter(status)}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '80px', textAlign: 'center', color: '#94A3B8' }}>
                    <p>Loading letter requests...</p>
                </div>
            ) : (
                <div className="approval-table-wrapper">
                    <table className="approval-table">
                        <thead>
                            <tr>
                                <th>Student Details</th>
                                <th>Course</th>
                                <th>Request Type</th>
                                <th>Received At</th>
                                <th>Status</th>
                                <th>Verification</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.map(req => {
                                const roleStatus = getRoleBasedStatus(req);
                                const isActionable = canAction(req);
                                return (
                                    <tr key={req.id}>
                                        <td>
                                            <div className="at-applicant">
                                                <div>
                                                    <span className="at-name">{req.user?.display_name || req.user?.displayName || req.name_with_initials || req.user?.full_name}</span>
                                                    <span className="at-email">{req.registration_number || req.user?.student_number}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '13px', color: '#475569', fontWeight: 500, maxWidth: '250px' }}>
                                                {req.course ? req.course.title : 'Course'}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '13px', fontWeight: 500 }}>{req.letter_type}</div>
                                            <div style={{ fontSize: '11px', color: '#64748B' }}>Ref ID: LR-{req.id}</div>
                                        </td>
                                        <td style={{ fontSize: '13px' }}>
                                            {new Date(req.created_at).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <span className={`at-status-badge`} style={{
                                                background: roleStatus.bg,
                                                color: roleStatus.text,
                                                fontWeight: 600,
                                                fontSize: '11px',
                                                padding: '4px 8px',
                                                borderRadius: '12px',
                                                display: 'inline-block'
                                            }}>
                                                {roleStatus.label}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <VerificationStages
                                                secretaryStatus={req.approval_level >= 1 ? 'approved' : (req.status === 'rejected' && req.approval_level === 0 ? 'rejected' : 'pending')}
                                                coordinatorStatus={req.approval_level >= 2 ? 'approved' : (req.status === 'rejected' && req.approval_level === 1 ? 'rejected' : 'pending')}
                                                directorStatus={req.approval_level >= 3 ? 'approved' : (req.status === 'rejected' && req.approval_level === 2 ? 'rejected' : 'pending')}
                                            />
                                        </td>
                                        <td>
                                            <div className="at-actions">
                                                <button
                                                    className="at-action-btn view"
                                                    title="View Detail"
                                                    onClick={() => handleViewDetail(req)}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                {isActionable ? (
                                                    <button
                                                        className="at-action-btn approve"
                                                        title="Approve Stage"
                                                        onClick={() => handleApproveClick(req)}
                                                    >
                                                        <CheckCircle2 size={16} />
                                                    </button>
                                                ) : (
                                                    req.status === 'rejected' ? (
                                                        <div title="Rejected" style={{ display: 'inline-flex', padding: '6px', color: '#DC2626', background: '#FEE2E2', borderRadius: '8px', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px' }}>
                                                            <XCircle size={16} />
                                                        </div>
                                                    ) : req.status === 'approved' ? (
                                                        <div title="Fully Approved" style={{ display: 'inline-flex', padding: '6px', color: '#059669', background: '#D1FAE5', borderRadius: '8px', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px' }}>
                                                            <CheckCircle2 size={16} />
                                                        </div>
                                                    ) : (
                                                        // Pending states but not actionable for this user
                                                        (currentUser.role === 'secretary' && req.approval_level >= 1) ||
                                                        (currentUser.role === 'coordinator' && req.approval_level >= 2) ||
                                                        (currentUser.role === 'director' && req.approval_level >= 3) ? (
                                                            <div title="Approved by You" style={{ display: 'inline-flex', padding: '6px', color: '#059669', background: '#D1FAE5', borderRadius: '8px', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px' }}>
                                                                <CheckCircle2 size={16} />
                                                            </div>
                                                        ) : (
                                                            <div title="Pending Stage" style={{ display: 'inline-flex', padding: '6px', color: '#94A3B8', background: '#F1F5F9', borderRadius: '8px', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px' }}>
                                                                <Clock size={16} />
                                                            </div>
                                                        )
                                                    )
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredRequests.length === 0 && (
                        <div style={{ padding: '60px', textAlign: 'center', color: '#94A3B8' }}>
                            <Search size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                            <p>No letter requests found matching criteria.</p>
                        </div>
                    )}
                </div>
            )}


            {showDetailModal && selectedRequest && (
                <div className="approval-modal-overlay" onClick={() => setShowDetailModal(false)}>
                    <div className="approval-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
                        <div className="am-header">
                            <div>
                                <h2>Letter Request Details</h2>
                                <p className="at-email">Ref ID: LR-{selectedRequest.id}</p>
                            </div>
                            <button className="am-close" onClick={() => setShowDetailModal(false)}><X size={20} /></button>
                        </div>
                        <div className="am-body">
                            <div className="am-section-divider" style={{ marginTop: 0 }}>
                                <h4><User size={16} /> Personal Information</h4>
                            </div>
                            <div className="am-details-grid">
                                <div className="am-detail-item">
                                    <span className="am-label">Applicant Name</span>
                                    <span className="am-value">{selectedRequest.user?.display_name || selectedRequest.user?.displayName || selectedRequest.name_with_initials || selectedRequest.user?.full_name}</span>
                                </div>
                                <div className="am-detail-item">
                                    <span className="am-label">Registration Number</span>
                                    <span className="am-value">{selectedRequest.registration_number || selectedRequest.user?.student_number}</span>
                                </div>
                                <div className="am-detail-item">
                                    <span className="am-label">NIC Number</span>
                                    <span className="am-value">{selectedRequest.nic || selectedRequest.user?.nic || 'N/A'}</span>
                                </div>
                                <div className="am-detail-item">
                                    <span className="am-label">Contact Phone</span>
                                    <span className="am-value">{selectedRequest.phone || selectedRequest.user?.phone || 'N/A'}</span>
                                </div>
                                <div className="am-detail-item full-width">
                                    <span className="am-label">Home Address</span>
                                    <span className="am-value">{selectedRequest.address || 'N/A'}</span>
                                </div>
                            </div>

                            <div className="am-section-divider">
                                <h4><BookOpen size={16} /> Course Details</h4>
                            </div>
                            <div className="am-details-grid">
                                <div className="am-detail-item">
                                    <span className="am-label">Course Title</span>
                                    <span className="am-value">{selectedRequest.course?.title}</span>
                                </div>
                                <div className="am-detail-item">
                                    <span className="am-label">Batch & Year</span>
                                    <span className="am-value">{selectedRequest.batch} ({selectedRequest.year})</span>
                                </div>
                                <div className="am-detail-item full-width">
                                    <span className="am-label">Letter Type Required</span>
                                    <span className="am-value" style={{ color: '#7C3AED', fontWeight: 600 }}>{selectedRequest.letter_type}</span>
                                </div>
                                <div className="am-detail-item full-width" style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                    <span className="am-label">Reason for Request</span>
                                    <span className="am-value" style={{ fontStyle: 'italic', color: '#475569' }}>"{selectedRequest.reason}"</span>
                                </div>
                            </div>

                            <div className="am-section-divider">
                                <h4><ShieldCheck size={16} /> Approval Stages</h4>
                            </div>

                            <div className="am-approval-flow">
                                <div className="am-flow-steps">
                                    {/* Stage 1: Secretary */}
                                    <div className={`am-flow-step ${selectedRequest.approval_level >= 1 ? 'approved' : selectedRequest.status === 'rejected' && selectedRequest.approval_level === 0 ? 'rejected' : 'pending'}`}>
                                        <div className="am-step-marker">
                                            {selectedRequest.approval_level >= 1 ? <Check size={10} /> :
                                                selectedRequest.status === 'rejected' && selectedRequest.approval_level === 0 ? <XCircle size={10} /> : <Clock size={10} />}
                                        </div>
                                        <div className="am-step-content">
                                            <div className="am-step-header">
                                                <span className="am-step-role">Course Secretary Approval</span>
                                                <span className={`at-status-badge ${selectedRequest.approval_level >= 1 ? 'approved' : selectedRequest.status === 'rejected' && selectedRequest.approval_level === 0 ? 'rejected' : 'pending'}`} style={{
                                                    background: selectedRequest.approval_level >= 1 ? '#D1FAE5' : selectedRequest.status === 'rejected' && selectedRequest.approval_level === 0 ? '#FEE2E2' : '#FEF3C7',
                                                    color: selectedRequest.approval_level >= 1 ? '#059669' : selectedRequest.status === 'rejected' && selectedRequest.approval_level === 0 ? '#DC2626' : '#D97706',
                                                    fontSize: '10px', padding: '2px 8px'
                                                }}>
                                                    {selectedRequest.approval_level >= 1 ? 'approved' : selectedRequest.status === 'rejected' && selectedRequest.approval_level === 0 ? 'rejected' : 'pending'}
                                                </span>
                                            </div>
                                            {(selectedRequest.approval_level >= 1 || (selectedRequest.status === 'rejected' && selectedRequest.approved_by_secretary)) && (
                                                <div className="am-step-info">
                                                    <span>{selectedRequest.approval_level >= 1 ? 'Approved' : 'Rejected'} by {selectedRequest.secretary_user?.full_name || selectedRequest.secretary_user?.displayName || 'Course Secretary'} on {new Date(selectedRequest.secretary_approved_at).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                            {selectedRequest.secretary_comment && <div className="am-step-comment">"{selectedRequest.secretary_comment}"</div>}
                                        </div>
                                    </div>

                                    {/* Stage 2: Coordinator */}
                                    <div className={`am-flow-step ${selectedRequest.approval_level >= 2 ? 'approved' : selectedRequest.status === 'rejected' && selectedRequest.approval_level === 1 ? 'rejected' : 'pending'}`}>
                                        <div className="am-step-marker">
                                            {selectedRequest.approval_level >= 2 ? <Check size={10} /> :
                                                selectedRequest.status === 'rejected' && selectedRequest.approval_level === 1 ? <XCircle size={10} /> : <Clock size={10} />}
                                        </div>
                                        <div className="am-step-content">
                                            <div className="am-step-header">
                                                <span className="am-step-role">Course Coordinator Approval</span>
                                                <span className={`at-status-badge ${selectedRequest.approval_level >= 2 ? 'approved' : selectedRequest.status === 'rejected' && selectedRequest.approval_level === 1 ? 'rejected' : 'pending'}`} style={{
                                                    background: selectedRequest.approval_level >= 2 ? '#D1FAE5' : selectedRequest.status === 'rejected' && selectedRequest.approval_level === 1 ? '#FEE2E2' : '#FEF3C7',
                                                    color: selectedRequest.approval_level >= 2 ? '#059669' : selectedRequest.status === 'rejected' && selectedRequest.approval_level === 1 ? '#DC2626' : '#D97706',
                                                    fontSize: '10px', padding: '2px 8px'
                                                }}>
                                                    {selectedRequest.approval_level >= 2 ? 'approved' : selectedRequest.status === 'rejected' && selectedRequest.approval_level === 1 ? 'rejected' : 'pending'}
                                                </span>
                                            </div>
                                            {(selectedRequest.approval_level >= 2 || (selectedRequest.status === 'rejected' && selectedRequest.approved_by_coordinator)) && (
                                                <div className="am-step-info">
                                                    <span>{selectedRequest.approval_level >= 2 ? 'Approved' : 'Rejected'} by {selectedRequest.coordinator_user?.full_name || selectedRequest.coordinator_user?.displayName || 'Course Coordinator'} on {new Date(selectedRequest.coordinator_approved_at).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                            {selectedRequest.coordinator_comment && <div className="am-step-comment">"{selectedRequest.coordinator_comment}"</div>}
                                        </div>
                                    </div>

                                    {/* Stage 3: Director */}
                                    <div className={`am-flow-step ${selectedRequest.approval_level >= 3 ? 'approved' : selectedRequest.status === 'rejected' && selectedRequest.approval_level === 2 ? 'rejected' : 'pending'}`}>
                                        <div className="am-step-marker">
                                            {selectedRequest.approval_level >= 3 ? <Check size={10} /> :
                                                selectedRequest.status === 'rejected' && selectedRequest.approval_level === 2 ? <XCircle size={10} /> : <Clock size={10} />}
                                        </div>
                                        <div className="am-step-content">
                                            <div className="am-step-header">
                                                <span className="am-step-role">Director Approval</span>
                                                <span className={`at-status-badge ${selectedRequest.approval_level >= 3 ? 'approved' : selectedRequest.status === 'rejected' && selectedRequest.approval_level === 2 ? 'rejected' : 'pending'}`} style={{
                                                    background: selectedRequest.approval_level >= 3 ? '#D1FAE5' : selectedRequest.status === 'rejected' && selectedRequest.approval_level === 2 ? '#FEE2E2' : '#FEF3C7',
                                                    color: selectedRequest.approval_level >= 3 ? '#059669' : selectedRequest.status === 'rejected' && selectedRequest.approval_level === 2 ? '#DC2626' : '#D97706',
                                                    fontSize: '10px', padding: '2px 8px'
                                                }}>
                                                    {selectedRequest.approval_level >= 3 ? 'approved' : selectedRequest.status === 'rejected' && selectedRequest.approval_level === 2 ? 'rejected' : 'pending'}
                                                </span>
                                            </div>
                                            {(selectedRequest.approval_level >= 3 || (selectedRequest.status === 'rejected' && selectedRequest.approved_by_director)) && (
                                                <div className="am-step-info">
                                                    <span>{selectedRequest.status === 'approved' ? 'Approved' : 'Rejected'} by {selectedRequest.director_user?.full_name || selectedRequest.director_user?.displayName || 'Director'} on {new Date(selectedRequest.director_approved_at).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                            {selectedRequest.director_comment && <div className="am-step-comment">"{selectedRequest.director_comment}"</div>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {canAction(selectedRequest) && (
                            <div className="am-footer">
                                <button className="am-reject-btn" style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FEE2E2' }} onClick={() => handleRejectClick(selectedRequest)}>
                                    <XCircle size={18} /> Reject
                                </button>
                                <button className="am-approve-btn" onClick={() => handleApproveClick(selectedRequest)}>
                                    <Check size={18} /> Approve
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}


            {showApproveModal && selectedRequest && (
                <div className="cm-modal-overlay">
                    <div className="cm-modal" style={{ maxWidth: '500px' }}>
                        <div className="cm-modal-header">
                            <h2>Confirm Approval</h2>
                            <button className="cm-modal-close" onClick={() => setShowApproveModal(false)}><X size={20} /></button>
                        </div>
                        <div className="cm-modal-body">
                            <p>Are you sure you want to approve this request stage? You can add optional comments below.</p>
                            <div className="cm-form-group" style={{ marginTop: '12px' }}>
                                <label>Approval Comments (Optional)</label>
                                <textarea
                                    className="cm-modal-textarea"
                                    placeholder="Enter comments or instructions..."
                                    value={approvalComment}
                                    onChange={(e) => setApprovalComment(e.target.value)}
                                    style={{ minHeight: '100px', width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', marginTop: '8px' }}
                                />
                            </div>
                        </div>
                        <div className="cm-modal-footer">
                            <button className="admin-btn-outline" onClick={() => setShowApproveModal(false)}>Cancel</button>
                            <button
                                className="admin-btn-primary"
                                onClick={handleApproveConfirm}
                            >
                                Confirm Approval
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {showRejectModal && selectedRequest && (
                <div className="cm-modal-overlay">
                    <div className="cm-modal" style={{ maxWidth: '500px' }}>
                        <div className="cm-modal-header">
                            <h2>Confirm Rejection</h2>
                            <button className="cm-modal-close" onClick={() => setShowRejectModal(false)}><X size={20} /></button>
                        </div>
                        <div className="cm-modal-body">
                            <p style={{ color: '#DC2626', fontWeight: 500 }}>Warning: Rejecting this request is final and will notify the student.</p>
                            <div className="cm-form-group" style={{ marginTop: '12px' }}>
                                <label>Reason for rejection (Required)</label>
                                <textarea
                                    className="cm-modal-textarea"
                                    placeholder="Enter detailed reason for student's reference..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    style={{ minHeight: '120px', width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', marginTop: '8px' }}
                                />
                            </div>
                        </div>
                        <div className="cm-modal-footer">
                            <button className="admin-btn-outline" onClick={() => setShowRejectModal(false)}>Cancel</button>
                            <button
                                className="admin-btn-primary"
                                style={{ background: '#EF4444' }}
                                onClick={handleRejectConfirm}
                                disabled={!rejectionReason.trim()}
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
