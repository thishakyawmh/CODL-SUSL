import { useNavigate } from 'react-router-dom';
import { X, CheckCircle2, Download, AlertCircle, CreditCard, XCircle, Calendar, ArrowRight } from 'lucide-react';
import './ExamStatusModal.css';

interface ExamStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    exam: any; // We'll type this properly later or just use any for now
}

export const ExamStatusModal: React.FC<ExamStatusModalProps> = ({ isOpen, onClose, exam }) => {
    const navigate = useNavigate();
    if (!isOpen || !exam) return null;

    // Prevent clicks inside the modal from closing it
    const handleModalClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container card" onClick={handleModalClick}>
                <div className="modal-header">
                    <h2 className="modal-title">{exam.title}</h2>
                    <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {/* Status Banner */}
                    {exam.status === 'Approved' && (
                        <div className="approved-layout">
                            <div className="status-banner approved">
                                <CheckCircle2 size={24} className="status-icon" />
                                <div className="status-content">
                                    <h3>Application Approved</h3>
                                    <p>Your application has been approved. You are registered for this examination.</p>
                                </div>
                            </div>

                            <div className="modal-action-header">
                                <div className="quick-download-card">
                                    <div className="download-info">
                                        <Calendar size={20} className="download-icon" />
                                        <div>
                                            <h4>Time Table</h4>
                                            <p>Official Schedule v1.2</p>
                                        </div>
                                    </div>
                                    <button className="download-btn-primary">
                                        <Download size={16} /> Download PDF
                                    </button>
                                </div>

                                <div className="postponement-notice">
                                    <div className="notice-text">
                                        <h4>Need to postpone?</h4>
                                        <p>4 Available</p>
                                    </div>
                                    <button 
                                        className="postpone-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onClose();
                                            navigate(`/course/${exam.courseId || '1'}/postponements`);
                                        }}
                                    >
                                        Apply for Postponement <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {exam.status === 'Pending' && (
                        <>
                            <div className="status-banner pending">
                                <AlertCircle size={24} className="status-icon" />
                                <div className="status-content">
                                    <h3>Application in Progress</h3>
                                    <p>Your examination application is being processed. Please check back for updates.</p>
                                </div>
                            </div>

                            <div className="status-banner payment-pending">
                                <CreditCard size={24} className="status-icon" />
                                <div className="status-content">
                                    <h3>Payment Pending</h3>
                                    <p>Please complete your payment at the CODL office to proceed with your application.</p>
                                </div>
                            </div>

                            <div className="application-status-timeline">
                                <h4>Application Status</h4>

                                <div className="timeline-item completed">
                                    <div className="timeline-number">1</div>
                                    <div className="timeline-content">
                                        <h5>Application Submitted</h5>
                                        <p>Your application has been received</p>
                                    </div>
                                </div>
                                <div className="timeline-connector"></div>

                                <div className="timeline-item pending-step">
                                    <div className="timeline-number">2</div>
                                    <div className="timeline-content">
                                        <h5>Initial Review</h5>
                                        <p>Application under review</p>
                                    </div>
                                </div>
                                <div className="timeline-connector"></div>

                                <div className="timeline-item pending-step">
                                    <div className="timeline-number">3</div>
                                    <div className="timeline-content">
                                        <h5>Payment Verification</h5>
                                        <p>Verifying payment status</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {exam.status === 'Rejected' && (
                        <>
                            <div className="status-banner rejected">
                                <XCircle size={24} className="status-icon" />
                                <div className="status-content">
                                    <h3>Application Rejected</h3>
                                    <p>Unfortunately, your application has been rejected. Please review the reason below.</p>
                                </div>
                            </div>

                            <div className="rejection-reason-box">
                                <h4>Rejection Reason:</h4>
                                <p>Incomplete payment verification and missing supporting documents</p>
                            </div>

                            <div className="need-help-box">
                                <h4>Need Help?</h4>
                                <p className="help-desc">Contact the examination support team for assistance.</p>
                                <div className="help-details">
                                    <p><strong>Email:</strong> examination@university.lk</p>
                                    <p><strong>Phone:</strong> +94 11 234 5678 (Ext. 456)</p>
                                    <p><strong>Office Hours:</strong> Monday - Friday, 8:30 AM - 4:00 PM</p>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Important Instructions (Show primarily for Approved) */}
                    {exam.status === 'Approved' && (
                        <div className="instructions-box">
                            <h4>Important Instructions</h4>
                            <ul className="instructions-list">
                                <li>Arrive at the exam venue at least 30 minutes before the start time.</li>
                                <li>Bring your student ID card and admission slip (download from portal).</li>
                                <li>Only blue or black pens are permitted. No pencils allowed.</li>
                                <li>Mobile phones and electronic devices must be switched off.</li>
                                <li>Calculators are permitted only for subjects where explicitly mentioned.</li>
                            </ul>
                        </div>
                    )}

                    {/* Legacy Download Section removed as it's now at the top for Approved */}
                </div>
            </div>
        </div>
    );
};
