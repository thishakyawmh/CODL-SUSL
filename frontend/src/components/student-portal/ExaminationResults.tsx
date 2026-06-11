import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { courseService, examService, examResultService } from '../../services/apiService';
import './CourseExaminations.css';

const ExaminationResults: React.FC = () => {
    const navigate = useNavigate();
    const { id, examId } = useParams<{ id: string, examId: string }>();
    
    const [loading, setLoading] = useState(true);
    const [courseTitle, setCourseTitle] = useState('Course Details');
    const [exam, setExam] = useState<{ title: string }>({ title: 'Examination Results' });
    const [results, setResults] = useState<any[]>([]);
    
    // Retrieve active student details
    const userStr = sessionStorage.getItem('user');
    let currentUser = null;
    if (userStr) {
        try {
            currentUser = JSON.parse(userStr);
        } catch (e) {}
    }
    
    const studentName = currentUser?.fullName || currentUser?.full_name || currentUser?.name || 'Kasun Perera';
    const studentRegNo = currentUser?.student_number || currentUser?.studentNumber || 'CODL/2401';

    useEffect(() => {
        const fetchResultsData = async () => {
            setLoading(true);
            try {
                // 1. Fetch course details to get the real title
                const courseData = await courseService.getById(id!);
                if (courseData) {
                    setCourseTitle(courseData.title);
                }

                // 2. Fetch exams to get the exam title
                const examsData = await examService.getByCourse(id!);
                const targetExam = examsData.find((e: any) => e.id.toString() === examId?.toString());
                if (targetExam) {
                    setExam({ title: targetExam.title });
                }

                // 3. Fetch student examinations data to get postponement/reattempt requests
                const studentExamsData = await courseService.getStudentExaminationsData(id!);
                const postponements = studentExamsData.postponement_requests || [];
                const reattempts = studentExamsData.reattempt_requests || [];

                // 4. Fetch user grades from backend
                const myGrades = await examResultService.getMyResults();
                
                // Filter direct grades for this course and this exam
                const directGrades = myGrades.filter((g: any) => 
                    g.exam_result?.course?.id?.toString() === id?.toString() &&
                    g.exam_result?.exam?.id?.toString() === examId?.toString()
                );

                // Filter indirect grades (postponed/reattempted to another exam)
                const indirectGrades = myGrades.filter((g: any) => {
                    if (g.exam_result?.course?.id?.toString() !== id?.toString()) return false;
                    const gradeExamId = g.exam_result?.exam?.id?.toString();
                    if (!gradeExamId || gradeExamId === examId?.toString()) return false;

                    // Is there a postponement request from this exam to that grade's exam?
                    const isPostponed = postponements.some((p: any) => {
                        const pOriginalExamId = p.exams && p.exams[0] && !p.exams[0].includes(' - ') ? p.exams[0] : '';
                        const pOriginalTitle = p.exam_title || '';
                        const matchesOriginal = pOriginalExamId.toString() === examId?.toString() ||
                            (targetExam && pOriginalTitle.trim().toLowerCase() === targetExam.title.trim().toLowerCase());
                        const matchesAssigned = p.assigned_exam_id?.toString() === gradeExamId;

                        if (matchesOriginal && matchesAssigned) {
                            if (p.exams && p.exams.length > 0) {
                                const gradeSubjectCode = g.exam_result?.subject?.code;
                                const matchesSubject = p.exams.some((s: string) => s.includes(gradeSubjectCode));
                                if (matchesSubject) return true;
                                if (p.exams.some((s: string) => s.includes(' - '))) return false;
                            }
                            return true;
                        }
                        return false;
                    });

                    if (isPostponed) return true;

                    // Is there a reattempt request from this exam for this subject to that grade's exam?
                    const isReattempted = reattempts.some((r: any) => {
                        const rOriginalExamId = r.exam_id?.toString();
                        const matchesOriginal = rOriginalExamId === examId?.toString() ||
                            (targetExam && r.exam_title?.trim().toLowerCase() === targetExam.title.trim().toLowerCase());
                        const matchesAssigned = r.assigned_exam_id?.toString() === gradeExamId;
                        const matchesSubject = r.subject_id?.toString() === g.exam_result?.subject?.id?.toString();

                        return matchesOriginal && matchesAssigned && matchesSubject;
                    });

                    return isReattempted;
                });

                // Map to UI results shape
                const gradesList = ['F', 'E', 'D', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+'];
                
                const mapGradeRow = (g: any, isIndirect: boolean, typeLabel?: string) => {
                    const threshold = g.exam_result?.min_repeat_grade || 'D';
                    const studentGrade = g.grade || 'Pending';
                    const sIdx = gradesList.indexOf(studentGrade.toUpperCase().trim());
                    const tIdx = gradesList.indexOf(threshold.toUpperCase().trim());
                    const isRepeat = sIdx !== -1 && tIdx !== -1 && sIdx < tIdx;
                    
                    return {
                        code: g.exam_result?.subject?.code || 'SUBJ101',
                        name: g.exam_result?.subject?.name || 'Subject',
                        credits: parseInt(g.exam_result?.subject?.credits) || 3,
                        grade: studentGrade,
                        isRepeat,
                        specialNote: g.special_note || (isIndirect ? typeLabel : '')
                    };
                };

                const mappedDirect = directGrades.map((g: any) => mapGradeRow(g, false));
                const mappedIndirect = indirectGrades.map((g: any) => {
                    const gradeSubjectId = g.exam_result?.subject?.id?.toString();
                    const isReattempt = reattempts.some((r: any) => r.subject_id?.toString() === gradeSubjectId);
                    const label = isReattempt ? 'Reattempt Grade' : 'Postponed Grade';
                    return mapGradeRow(g, true, label);
                });

                // Merge: indirect grades overwrite/update direct grades
                const mergedMap: Record<string, any> = {};
                mappedDirect.forEach((row: any) => {
                    mergedMap[row.code] = row;
                });
                mappedIndirect.forEach((row: any) => {
                    mergedMap[row.code] = row;
                });

                setResults(Object.values(mergedMap));
            } catch (err) {
                console.error("Failed to load results from backend:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchResultsData();
    }, [id, examId]);

    if (loading) {
        return (
            <div className="course-examinations-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                <div style={{ textAlign: 'center', color: '#64748B' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid #E2E8F0', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                    <p style={{ fontWeight: 600 }}>Loading results...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="course-examinations-container animate-fade-in">
            <button className="back-btn" onClick={() => navigate(`/course/${id}/examinations`)}>
                <ArrowLeft size={18} /> Back
            </button>

            <div className="results-scroll-container">
                <div className="official-result-card full-page">

                    <div className="result-card-header">
                        <div className="institute-branding-modern">
                            <h4 className="dept-title-top">Center for Open and Distance Learning</h4>
                            <p className="uni-title-bottom">Sabaragamuwa University Of Sri Lanka</p>
                            <div className="transcript-metadata-left">
                                <span className="mini-meta status">STATUS: VERIFIED</span>
                                <span className="mini-meta">ISSUED: {new Date().toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="action-button-group results-right">
                            <button className="pro-action-btn secondary icon-only" title="Print Transcript">
                                <Printer size={18} />
                            </button>
                            <button className="pro-action-btn primary small" style={{ gap: '8px' }}>
                                <Download size={16} /> Download
                            </button>
                        </div>
                    </div>

                    <div className="student-transcript-meta">
                        <div className="student-info-grid">
                            <div className="info-item">
                                <span className="label">Student Name</span>
                                <span className="value">{studentName}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Registration Number</span>
                                <span className="value">{studentRegNo}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Examination</span>
                                <span className="value">{exam.title}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Course</span>
                                <span className="value">{courseTitle}</span>
                            </div>
                        </div>
                    </div>

                    <div className="result-table-container">
                        <table className="official-result-table">
                            <thead>
                                <tr>
                                    <th>Subject Code</th>
                                    <th>Subject Name</th>
                                    <th style={{ textAlign: 'center' }}>Credits</th>
                                    <th style={{ textAlign: 'center' }}>Grade</th>
                                    <th style={{ textAlign: 'center' }}>Special Note</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#64748B', fontWeight: 600 }}>
                                            No subject results have been released for this examination yet.
                                        </td>
                                    </tr>
                                ) : (
                                    results.map((row: any, idx: number) => (
                                        <tr key={idx}>
                                            <td className="mono">{row.code}</td>
                                            <td>{row.name}</td>
                                            <td style={{ textAlign: 'center' }}>{row.credits}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span className={`grade-pill ${row.grade === 'Pending' ? 'orange' : (row.isRepeat ? 'red' : (row.grade.startsWith('A') ? 'green' : 'blue'))}`}>
                                                    {row.grade} {row.isRepeat && '(Repeat)'}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
                                                {row.specialNote || '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="transcript-footer">
                        <div className="result-disclaimer">
                            <div className="disclaimer-title">Official Recognition and Verification:</div>
                            <p>This transcript reflects the academic performance of the student for the specified examination. All results have been verified by the board of examiners. This document is valid without a physical signature only when verified through the official CODL portal.</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ExaminationResults;
