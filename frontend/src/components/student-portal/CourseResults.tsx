import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowLeft, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { type Course } from './CourseDetails';
import './CourseResults.css';

export const CourseResults: React.FC = () => {
    const navigate = useNavigate();
    const { course } = useOutletContext<{ course: Course }>();

    const results = [
        {
            id: 3,
            title: 'Third Semester Examination - 2026',
            status: 'Pending',
            notificationCount: 3
        },
        {
            id: 2,
            title: 'Second Semester Examination - 2025',
            status: 'Completed',
            notificationCount: 2
        },
        {
            id: 1,
            title: 'First Semester Examination - 2025',
            status: 'Completed',
            notificationCount: 0
        }
    ];

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Completed': return { bg: '#ECFDF5', text: '#10B981', icon: <CheckCircle2 size={14} /> };
            case 'Pending': return { bg: '#FEFCE8', text: '#D97706', icon: <Clock size={14} /> };
            default: return { bg: '#F1F5F9', text: '#64748B', icon: null };
        }
    };

    return (
        <div className="course-results-wrapper">
            <button className="back-btn" onClick={() => navigate(`/course/${course.id}`)}>
                <ArrowLeft size={18} /> Back
            </button>

            <div className="course-details-header">
                <h1 className="course-details-title">{course.title}</h1>
                <div className="course-header-labels">
                    <span className="course-code-label">{course.code}</span>
                    <span className={`course-type-label ${course.type.toLowerCase()}`}>{course.type}</span>
                </div>
            </div>

            <div className="results-grid">
                {results.map((result) => {
                    const statusStyle = getStatusStyle(result.status);

                    return (
                        <div className="result-card card" key={result.id}>
                            {result.notificationCount > 0 && (
                                <div className="result-notification-badge">
                                    {result.notificationCount}
                                </div>
                            )}

                            <div className="result-icon-wrapper">
                                <TrendingUp size={28} className="result-trending-icon" />
                            </div>

                            <h3 className="result-card-title">{result.title}</h3>

                            <div className="result-status-badge" style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}>
                                {statusStyle.icon}
                                <span>{result.status}</span>
                            </div>

                            <button
                                className="view-result-btn"
                                onClick={() => navigate(`/course/${course.id}/results/${result.id}`)}
                            >
                                View Result
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
