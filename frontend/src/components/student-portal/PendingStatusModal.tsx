import React from 'react';
import { X, CheckCircle2, Clock, FileText } from 'lucide-react';
import './PendingStatusModal.css';

interface PendingStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    course: any;
    onApprove: (course: any) => void;
}

export const PendingStatusModal: React.FC<PendingStatusModalProps> = ({ isOpen, onClose, course, onApprove }) => {
    if (!isOpen || !course) return null;

    const courseDetails = course.course || course;
    const approvalLevel = course.approval_level ?? 0;
    const isRejected = course.status === 'rejected';

    const steps = [
        {
            id: 1,
            title: 'Application Submitted',
            description: 'Your application has been received successfully.',
            date: course.created_at ? new Date(course.created_at).toLocaleDateString() : 'Today',
            status: 'completed',
            icon: <FileText size={20} />
        },
        {
            id: 2,
            title: 'Stage 1: Course Secretary Review',
            description: approvalLevel >= 1
                ? 'Approved by Course Secretary.'
                : (isRejected && approvalLevel === 0
                    ? `Rejected by Course Secretary: ${course.secretary_comment || 'No reason provided'}`
                    : 'Awaiting review by Course Secretary.'),
            date: course.secretary_approved_at ? new Date(course.secretary_approved_at).toLocaleDateString() : (approvalLevel >= 1 ? 'Approved' : 'Pending'),
            status: approvalLevel >= 1
                ? 'completed'
                : (isRejected && approvalLevel === 0 ? 'failed' : 'active'),
            icon: <Clock size={20} />
        },
        {
            id: 3,
            title: 'Stage 2: Course Coordinator Review',
            description: approvalLevel >= 2
                ? 'Approved by Course Coordinator.'
                : (isRejected && approvalLevel === 1
                    ? `Rejected by Course Coordinator: ${course.coordinator_comment || 'No reason provided'}`
                    : (approvalLevel >= 1 ? 'Awaiting review by Course Coordinator.' : 'Pending Stage 1 Approval.')),
            date: course.coordinator_approved_at ? new Date(course.coordinator_approved_at).toLocaleDateString() : (approvalLevel >= 2 ? 'Approved' : 'Pending'),
            status: approvalLevel >= 2
                ? 'completed'
                : (isRejected && approvalLevel === 1
                    ? 'failed'
                    : (approvalLevel >= 1 ? 'active' : 'pending')),
            icon: <Clock size={20} />
        },
        {
            id: 4,
            title: 'Stage 3: Director Final Approval',
            description: approvalLevel >= 3
                ? 'Approved by Director. Enrollment completed.'
                : (isRejected && approvalLevel === 2
                    ? `Rejected by Director: ${course.director_comment || 'No reason provided'}`
                    : (approvalLevel >= 2 ? 'Awaiting final approval by Director.' : 'Pending Stage 2 Approval.')),
            date: course.director_approved_at ? new Date(course.director_approved_at).toLocaleDateString() : (approvalLevel >= 3 ? 'Approved' : 'Pending'),
            status: approvalLevel >= 3
                ? 'completed'
                : (isRejected && approvalLevel === 2
                    ? 'failed'
                    : (approvalLevel >= 2 ? 'active' : 'pending')),
            icon: <CheckCircle2 size={20} />
        }
    ];

    return (
        <div className="pending-status-overlay" onClick={onClose}>
            <div className="pending-status-modal" onClick={e => e.stopPropagation()}>
                <div className="pending-modal-header">
                    <div>
                        <h2 className="pending-modal-title">Track Application Status</h2>
                        <p className="pending-modal-subtitle">{courseDetails.title}</p>
                    </div>
                    <button className="close-modal-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="pending-modal-body">
                    <div className="status-timeline">
                        {steps.map((step, index) => (
                            <div className={`timeline-item ${step.status}`} key={step.id}>
                                <div className="timeline-icon-wrapper">
                                    <div className={`timeline-icon ${step.status}`}>
                                        {step.status === 'completed' ? <CheckCircle2 size={20} /> : step.icon}
                                    </div>
                                    {index < steps.length - 1 && <div className={`timeline-connector ${step.status === 'completed' ? 'completed' : ''}`}></div>}
                                </div>
                                <div className="timeline-content">
                                    <h4 className="timeline-title">{step.title}</h4>
                                    <p className="timeline-desc">{step.description}</p>
                                    <span className="timeline-date">{step.date}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
};
