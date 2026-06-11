import React from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { ArrowLeft, Download, AlertCircle, Clock, Info } from 'lucide-react';
import { type Course } from './CourseDetails';
import './ResultSheet.css';

interface ResultSheetProps {
    isEmbedded?: boolean;
    onViewGrading?: () => void;
}

export const ResultSheet: React.FC<ResultSheetProps> = ({ isEmbedded, onViewGrading }) => {
    const navigate = useNavigate();
    const { id, resultId: paramResultId, examId } = useParams();
    const resultId = paramResultId || examId;
    
    // Handle context gracefully if results are embedded
    let context;
    try {
        context = useOutletContext<{ course: Course }>();
    } catch (e) {
        context = { course: { title: 'Course Details' } as any };
    }
    const { course } = context;

    // Mock data based on resultId to simulate different states
    const isCompleted = resultId === '1' || resultId === '2';

    const examData = {
        title: isCompleted ? 'First Semester Examination - 2025' : 'Third Semester Examination - 2026',
        course: 'Bachelor of Science in Computer Science',
        student: {
            name: 'Sarah M. Fernando',
            indexNumber: 'CODL/CS/2023/0456',
            nic: '200112345678',
            degree: 'Bachelor of Science in Computer Science'
        },
        subjects: (isCompleted || examId === 'E2') ? [
            { name: 'Algorithms and Complexity', code: 'CS3011', credits: 4, grade: 'A' },
            { name: 'Software Engineering', code: 'CS3012', credits: 3, grade: 'A-' },
            { name: 'Computer Networks', code: 'CS3013', credits: 3, grade: 'C+' },
            { name: 'Operating Systems', code: 'CS3014', credits: 3, grade: 'B' }
        ] : [
            { name: 'Algorithms and Complexity', code: 'CS3011', credits: 4, grade: 'A' },
            { name: 'Software Engineering', code: 'CS3012', credits: 3, grade: 'B+' },
            { name: 'Computer Networks', code: 'CS3013', credits: 3, grade: 'Not Released' },
            { name: 'Operating Systems', code: 'CS3014', credits: 3, grade: 'Not Released' },
            { name: 'Human Computer Interaction', code: 'CS3015', credits: 2, grade: 'Not Released' }
        ],
        summary: (isCompleted || examId === 'E2') ? {
            gpa: '3.42',
            creditsEarned: '13',
            totalCredits: '13',
            subjectsReleased: '4',
            totalSubjects: '4'
        } : {
            gpa: '3.65',
            creditsEarned: '7',
            totalCredits: '15',
            subjectsReleased: '2',
            totalSubjects: '5'
        }
    };


    const allReleased = examData.summary.subjectsReleased === examData.summary.totalSubjects;

    const renderGradePill = (grade: string) => {
        if (grade === 'Not Released') {
            return <div className="grade-pill-container"><Clock size={14} /> Pending</div>;
        }
        if (grade.startsWith('A')) return <div className="grade-pill excellent">{grade}</div>;
        if (grade.startsWith('B')) return <div className="grade-pill good">{grade}</div>;
        if (grade.startsWith('C')) return <div className="grade-pill average">{grade}</div>;
        return <div className="grade-pill poor">{grade}</div>;
    };

    return (
        <div className={`modern-result-wrapper ${isEmbedded ? 'embedded' : ''}`}>
            {!isEmbedded && (
                <button className="back-btn" onClick={() => navigate(`/course/${id}/examinations/${resultId}`)}>
                    <ArrowLeft size={18} /> Back
                </button>
            )}
            


            {!isEmbedded && (
                <div className="result-page-header">
                    <div className="header-content">
                        <h1 className="page-title">{course.title}</h1>
                        <p className="page-subtitle">{examData.title}</p>
                    </div>
                    <div className="header-actions" style={{ display: 'flex', gap: '12px' }}>
                        <button
                            className="btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0', padding: '10px 20px', borderRadius: '10px', fontWeight: 600 }}
                            onClick={() => navigate(`/course/${id}/grading-scale`)}
                        >
                            <Info size={18} /> Grading System
                        </button>
                        <button
                            className={`btn-primary download-btn ${!allReleased ? 'disabled' : ''}`}
                            disabled={!allReleased}
                            title={!allReleased ? "Downloads are only available once all subject results are released." : "Download Result Sheet"}
                        >
                            <Download size={18} /> {allReleased ? 'Download Results' : 'Results Pending'}
                        </button>
                    </div>
                </div>
            )}


            {!allReleased && (
                <div className="pending-results-alert">
                    <AlertCircle size={20} />
                    <div>
                        <h4>Some results are still pending</h4>
                        <p>You cannot download your official result sheet until all subjects for this semester have been released and verified.</p>
                    </div>
                </div>
            )}

            <div className="full-content-layout">
                <div className="section-card card">
                    <div className="result-sheet-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row' }}>
                        <div>
                            <h2>Examination Results</h2>
                            <p>Detailed performance breakdown for individual course modules.</p>
                        </div>
                        {isEmbedded && (
                            <div className="embedded-header-actions" style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    className="btn-secondary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0', padding: '8px 16px', borderRadius: '10px', fontWeight: 600, fontSize: '13px' }}
                                    onClick={() => {
                                        if (isEmbedded && onViewGrading) {
                                            onViewGrading();
                                        } else {
                                            navigate(`/course/${id}/grading-scale`);
                                        }
                                    }}
                                >
                                    <Info size={16} /> Grading System
                                </button>
                                <button
                                    className={`btn-primary download-btn ${!allReleased ? 'disabled' : ''}`}
                                    style={{ padding: '8px 16px', fontSize: '13px' }}
                                    disabled={!allReleased}
                                >
                                    <Download size={16} /> {allReleased ? 'Download' : 'Pending'}
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="modern-table-container">
                        <table className="modern-table stylish-rows">
                            <thead>
                                <tr>
                                    <th style={{ paddingLeft: '24px' }}>Subject Name</th>
                                    <th className="center-col">Code</th>
                                    <th className="center-col">Credits</th>
                                    <th className="right-col" style={{ paddingRight: '24px' }}>Grade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {examData.subjects.map((sub, idx) => {
                                    return (
                                        <tr key={idx} className="result-row-hover">
                                            <td style={{ paddingLeft: '24px' }}>
                                                <div className="subject-info-cell">
                                                    <span className="subject-name">{sub.name}</span>
                                                </div>
                                            </td>
                                            <td className="center-col code-cell">{sub.code}</td>
                                            <td className="center-col credits-cell">{sub.credits}</td>
                                            <td className="right-col" style={{ paddingRight: '24px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                                    {renderGradePill(sub.grade)}
                                                    {['C+', 'C', 'D', 'E', 'F', 'C-'].includes(sub.grade) && (
                                                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#E11D48', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                            REATTEMPT REQUIRED
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
