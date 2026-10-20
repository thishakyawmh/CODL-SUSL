import React from 'react';
import { BookOpen, GraduationCap, Award, ChevronDown, ChevronRight, CheckCircle2, Clock } from 'lucide-react';

interface AcademicProgressTabProps {
    student: any;
    studentData: any;
    realCourses: any[];
    expandedCourses: Record<string, boolean>;
    onToggleCourse: (courseName: string) => void;
}

export const AcademicProgressTab: React.FC<AcademicProgressTabProps> = ({
    student,
    studentData,
    realCourses,
    expandedCourses,
    onToggleCourse,
}) => {
    const getGradeColor = (grade: string) => {
        if (grade.startsWith('A')) return '#10B981';
        if (grade.startsWith('B')) return '#3B82F6';
        if (grade.startsWith('C')) return '#F59E0B';
        return '#EF4444';
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {student.courses && student.courses.length > 0 ? (
                student.courses.map((courseName: string, idx: number) => {
                    const isExpanded = !!expandedCourses[courseName];
                    const courseData = realCourses.find(c => c.title === courseName);
                    const courseResults = studentData?.results.filter((r: any) => r.course === courseName) || [];

                    return (
                        <div key={idx} style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                            { }
                            <button
                                onClick={() => onToggleCourse(courseName)}
                                style={{
                                    width: '100%',
                                    padding: '18px 24px',
                                    background: '#F8FAFC',
                                    border: 'none',
                                    borderBottom: isExpanded ? '1px solid #E2E8F0' : 'none',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    textAlign: 'left'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {isExpanded ? <ChevronDown size={20} color="#2563EB" /> : <ChevronRight size={20} color="#64748B" />}
                                    <div>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase' }}>
                                            {courseData?.code || 'CODL'} • {courseData?.level || 'Program'}
                                        </span>
                                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                                            {courseName}
                                        </h3>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
                                        {courseResults.length} Grade Records
                                    </span>
                                </div>
                            </button>

                            { }
                            {isExpanded && (
                                <div style={{ padding: '24px' }}>
                                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#334155', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <GraduationCap size={18} color="#2563EB" /> Released Subject Grades & Performance
                                    </h4>

                                    {courseResults.length === 0 ? (
                                        <p style={{ color: '#94A3B8', fontSize: '14px' }}>No examination results published for this program yet.</p>
                                    ) : (
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                                <thead>
                                                    <tr style={{ background: '#F1F5F9', color: '#475569', textAlign: 'left', fontWeight: 700 }}>
                                                        <th style={{ padding: '10px 14px', borderRadius: '6px 0 0 6px' }}>Subject Code</th>
                                                        <th style={{ padding: '10px 14px' }}>Subject Name</th>
                                                        <th style={{ padding: '10px 14px' }}>Semester / Batch</th>
                                                        <th style={{ padding: '10px 14px' }}>Grade</th>
                                                        <th style={{ padding: '10px 14px', borderRadius: '0 6px 6px 0' }}>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {courseResults.map((r: any, rIdx: number) => (
                                                        <tr key={rIdx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                                            <td style={{ padding: '12px 14px', fontWeight: 700, color: '#2563EB' }}>{r.subjectCode || 'SUB-01'}</td>
                                                            <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0F172A' }}>{r.subject}</td>
                                                            <td style={{ padding: '12px 14px', color: '#64748B' }}>{r.semester || 'Semester 1'} ({r.batch || 'Batch 01'})</td>
                                                            <td style={{ padding: '12px 14px' }}>
                                                                <span style={{ fontWeight: 800, color: getGradeColor(r.grade), background: `${getGradeColor(r.grade)}15`, padding: '4px 10px', borderRadius: '6px' }}>
                                                                    {r.grade}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '12px 14px' }}>
                                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, color: '#166534', background: '#DCFCE7', padding: '2px 8px', borderRadius: '12px' }}>
                                                                    <CheckCircle2 size={12} /> Approved
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })
            ) : (
                <div style={{ background: '#FFFFFF', padding: '32px', borderRadius: '12px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                    <p style={{ color: '#94A3B8', fontSize: '15px' }}>Student is not currently enrolled in any academic programs.</p>
                </div>
            )}
        </div>
    );
};
