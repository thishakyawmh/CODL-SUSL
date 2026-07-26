import React from 'react';
import { ClipboardCheck, FileText, PauseCircle, RefreshCw, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

interface RequestsApprovalTabProps {
    studentData: any;
}

export const RequestsApprovalTab: React.FC<RequestsApprovalTabProps> = ({ studentData }) => {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, background: '#DCFCE7', color: '#166534' }}>
                        <CheckCircle2 size={12} /> Approved
                    </span>
                );
            case 'rejected':
                return (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, background: '#FEE2E2', color: '#991B1B' }}>
                        <XCircle size={12} /> Rejected
                    </span>
                );
            default:
                return (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, background: '#FEF3C7', color: '#92400E' }}>
                        <Clock size={12} /> Pending Approval
                    </span>
                );
        }
    };

    const renderApprovalStepper = (stages: any) => {
        const stageList = [
            { key: 'secretary', label: 'Course Secretary' },
            { key: 'coordinator', label: 'Course Coordinator' },
            { key: 'director', label: 'Director' }
        ];

        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                {stageList.map((stage, idx) => {
                    const status = stages?.[stage.key] || 'pending';
                    const isApproved = status === 'approved';
                    const isRejected = status === 'rejected';

                    return (
                        <React.Fragment key={stage.key}>
                            {idx > 0 && <div style={{ height: '2px', flex: 1, background: isApproved ? '#10B981' : '#E2E8F0' }}></div>}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: isApproved ? '#166534' : (isRejected ? '#991B1B' : '#64748B') }}>
                                <span style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    background: isApproved ? '#10B981' : (isRejected ? '#EF4444' : '#E2E8F0'),
                                    color: isApproved || isRejected ? '#FFFFFF' : '#475569'
                                }}>
                                    {idx + 1}
                                </span>
                                <span>{stage.label}</span>
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Exam Applications */}
            <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ClipboardCheck size={18} color="#2563EB" /> Exam Admission Applications ({studentData?.examApps.length || 0})
                </h3>

                {studentData?.examApps.length === 0 ? (
                    <p style={{ color: '#94A3B8', fontSize: '14px' }}>No exam applications submitted.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {studentData?.examApps.map((app: any) => (
                            <div key={app.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '16px', borderRadius: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#2563EB' }}>{app.course}</span>
                                        <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{app.examTitle}</h4>
                                        <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>Submitted on: {app.applicationDate}</p>
                                    </div>
                                    {getStatusBadge(app.status)}
                                </div>
                                {renderApprovalStepper(app.approvalStages)}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Letter Requests */}
            <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={18} color="#2563EB" /> Official Letter Requests ({studentData?.letterReqs.length || 0})
                </h3>

                {studentData?.letterReqs.length === 0 ? (
                    <p style={{ color: '#94A3B8', fontSize: '14px' }}>No letter requests submitted.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {studentData?.letterReqs.map((req: any) => (
                            <div key={req.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '16px', borderRadius: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#2563EB' }}>{req.course}</span>
                                        <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{req.letterType}</h4>
                                        <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>Reason: {req.reason}</p>
                                    </div>
                                    {getStatusBadge(req.status)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
