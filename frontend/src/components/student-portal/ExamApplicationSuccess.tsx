import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock } from 'lucide-react';

import './ExamApplicationSuccess.css';

export const ExamApplicationSuccess: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    // Using placeholder data for consistency
    const examName = 'Semester 3 End Semester Examination';
    const refNumber = 'REQ-EX-2026-0428';

    const handleBack = () => {
        navigate(`/course/${id}/examinations`);
    };

    return (
        <div className="exam-success-wrapper">
            <button className="portal-back-btn" onClick={handleBack} style={{ marginBottom: '24px' }}>
                <ArrowLeft size={18} /> Back
            </button>

            <div className="success-alerts-container">
                {/* Main Success Banner */}
                <div className="success-alert-banner primary">
                    <div className="alert-icon-wrapper">
                        <CheckCircle2 size={32} strokeWidth={2.5} />
                    </div>
                    <h2 className="success-title">Application Submitted Successfully!</h2>
                </div>
            </div>

            {/* Simplified Status Card */}
            <div className="success-status-card">
                <div className="status-visual">
                    <div className="pulse-ring"></div>
                    <Clock size={40} color="#0EA5E9" />
                </div>

                <div className="status-info-text">
                    <h3>Application Pending</h3>
                    <p>
                        Your application for <strong>{examName}</strong> is currently being processed. 
                        You will be notified once the application is approved and examination details are available.
                    </p>
                </div>

                <div className="status-ref-badge">
                    <label>Application Reference</label>
                    <strong>{refNumber}</strong>
                </div>

                <div className="success-actions">
                    <button type="button" className="btn-primary" onClick={handleBack}>
                        Return to Examination Hub
                    </button>
                </div>
            </div>
        </div>
    );
};
