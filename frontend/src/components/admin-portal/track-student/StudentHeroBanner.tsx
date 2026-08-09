import React from 'react';
import { Calendar, Clock, ArrowLeft, Edit3 } from 'lucide-react';

interface StudentHeroBannerProps {
    student: any;
    profile: any;
    studentData: any;
    onBack: () => void;
    onEdit: () => void;
}

const formatLastAccessed = (lastLoginVal: any) => {
    if (!lastLoginVal) return 'N/A';
    try {
        const d = new Date(lastLoginVal);
        if (isNaN(d.getTime())) return 'N/A';
        return d.toISOString().split('T')[0];
    } catch {
        return 'N/A';
    }
};

export const StudentHeroBanner: React.FC<StudentHeroBannerProps> = ({
    student,
    profile,
    studentData,
    onBack,
    onEdit,
}) => {
    const pendingCount = (studentData?.examApps.filter((e: any) => e.status === 'pending').length || 0) +
        (studentData?.letterReqs.filter((l: any) => l.status === 'pending').length || 0) +
        (studentData?.postponements.filter((p: any) => p.status === 'pending').length || 0) +
        (studentData?.reattempts.filter((r: any) => r.status === 'pending').length || 0);

    return (
        <div style={{ marginBottom: '24px' }}>
            {/* Top Navigation Bar: Back button on top of the section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <button
                    onClick={onBack}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 18px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        color: '#334155',
                        fontWeight: 600,
                        fontSize: '14px',
                        cursor: 'pointer',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <ArrowLeft size={16} /> Back
                </button>

                <button
                    onClick={onEdit}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 18px',
                        borderRadius: '8px',
                        background: '#2563EB',
                        border: 'none',
                        color: '#FFFFFF',
                        fontWeight: 600,
                        fontSize: '14px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                    }}
                >
                    <Edit3 size={16} /> Edit Student Profile
                </button>
            </div>

            {/* Light Colored Student Header Card Matching Web Color Theme */}
            <div style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '24px',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ position: 'relative' }}>
                        <img
                            src={student.avatar}
                            alt={student.displayName || student.fullName}
                            style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                border: '3px solid #E2E8F0',
                                objectFit: 'cover'
                            }}
                        />
                        <span style={{
                            position: 'absolute',
                            bottom: '2px',
                            right: '2px',
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            background: student.status === 'active' ? '#10B981' : '#EF4444',
                            border: '2px solid #FFFFFF'
                        }}></span>
                    </div>

                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                                {student.displayName || student.fullName}
                            </h2>
                            <span style={{
                                padding: '3px 10px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 700,
                                background: '#EFF6FF',
                                color: '#2563EB',
                                border: '1px solid #BFDBFE'
                            }}>
                                {student.studentNumber || 'No ID assigned'}
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '13px', color: '#475569' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Calendar size={14} color="#2563EB" /> Enrolled: {student.joinDate || 'N/A'}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Clock size={14} color="#2563EB" /> Last Accessed: {formatLastAccessed(student.lastLogin)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Stat Metrics: Exactly No. of Courses & Pending Requests */}
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        padding: '12px 20px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        minWidth: '110px'
                    }}>
                        <span style={{ display: 'block', fontSize: '22px', fontWeight: 800, color: '#2563EB' }}>
                            {student.courses?.length || 0}
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                            No. of Courses
                        </span>
                    </div>

                    <div style={{
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        padding: '12px 20px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        minWidth: '110px'
                    }}>
                        <span style={{ display: 'block', fontSize: '22px', fontWeight: 800, color: pendingCount > 0 ? '#EF4444' : '#64748B' }}>
                            {pendingCount}
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                            Pending Requests
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
