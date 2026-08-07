import React from 'react';
import { ArrowLeft, Save, RefreshCw, BookOpen, Layers, Users, Calendar } from 'lucide-react';

interface CourseOverviewHeaderProps {
    course: any;
    isRefreshing: boolean;
    onBack: () => void;
    onRefresh: () => void;
}

export const CourseOverviewHeader: React.FC<CourseOverviewHeaderProps> = ({
    course,
    isRefreshing,
    onBack,
    onRefresh,
}) => {
    return (
        <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <button
                    onClick={onBack}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        background: '#FFFFFF',
                        color: '#475569',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    <ArrowLeft size={18} /> Back to Courses
                </button>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            background: '#F8FAFC',
                            color: '#334155',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} /> {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {course && (
                <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#2563EB', background: '#EFF6FF', padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase' }}>
                                {course.code} • {course.level}
                            </span>
                            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1E293B', marginTop: '8px', marginBottom: '4px' }}>
                                {course.title}
                            </h1>
                            <p style={{ color: '#64748B', fontSize: '14px' }}>
                                Department of {course.department} • Duration: {course.duration}
                            </p>
                        </div>
                        <span style={{
                            padding: '6px 14px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: 700,
                            background: course.intakeStatus === 'Open' ? '#DCFCE7' : '#FEE2E2',
                            color: course.intakeStatus === 'Open' ? '#166534' : '#991B1B'
                        }}>
                            Intake {course.intakeStatus}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};
