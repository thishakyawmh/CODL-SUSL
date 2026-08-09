import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowLeft, BookOpen, FileText, Bell, MessageSquare, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import {
    courseService,
    announcementService
} from '../../services/apiService';
import './CourseDetails.css';

export interface Course {
    id: string;
    title: string;
    code: string;
    type: 'Degree' | 'Diploma' | 'Certification';
    startDate: string;
    endDate: string;
    semesters?: {
        name: string;
        subjects: { id: number; name: string; code: string; credits: number | string }[];
    }[];
    subjects?: { id: number; name: string; code: string; credits: number | string }[];
}

export const CourseDetails: React.FC = () => {
    const navigate = useNavigate();
    const { course } = useOutletContext<{ course: Course }>();
    const [currentAnnIndex, setCurrentAnnIndex] = React.useState(0);
    const [announcements, setAnnouncements] = React.useState<any[]>([]);
    const [newMaterialsCount, setNewMaterialsCount] = React.useState(0);
    const [newExamsCount, setNewExamsCount] = React.useState(0);

    React.useEffect(() => {
        if (!course.id) return;

        const loadData = async () => {
            let activeBatch = 'Batch 01';
            try {
                const response = await courseService.getStudentCourses();
                const matched = response.find((c: any) => c.id.toString() === course.id.toString());
                if (matched && matched.pivot?.batch) {
                    activeBatch = matched.pivot.batch;
                }
            } catch (e) {
                console.error("Failed to fetch student batch for announcements:", e);
            }

            // 1. Fetch course announcements
            try {
                const data = await announcementService.getAll({ course_id: course.id, batch: activeBatch });
                const processed = data.map((ann: any) => {
                    const annType = ann.type || 'Notice';
                    const iconColor = annType === 'Important' ? '#EF4444' : (annType === 'Update' ? '#10B981' : '#3B82F6');
                    const bgColor = annType === 'Important' ? '#FEF2F2' : (annType === 'Update' ? '#F0FDF4' : '#EFF6FF');
                    return {
                        ...ann,
                        type: annType,
                        icon: annType === 'Important' ? <Bell size={18} /> : (annType === 'Update' ? <MessageSquare size={18} /> : <Info size={18} />),
                        iconColor,
                        bgColor,
                        date: new Date(ann.created_at || new Date()).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        })
                    };
                });
                setAnnouncements(processed);
            } catch (err) {
                console.error("Failed to fetch course announcements:", err);
            }

            // 2. Calculate new counts
            const lastVisitedMaterials = localStorage.getItem(`materials_lastVisited_${course.id}`);
            const lastVisitedMaterialsTs = lastVisitedMaterials ? parseInt(lastVisitedMaterials, 10) : 0;

            const lastVisitedExams = localStorage.getItem(`exams_lastVisited_${course.id}`);
            const lastVisitedExamsTs = lastVisitedExams ? parseInt(lastVisitedExams, 10) : 0;

            try {
                const materials = await courseService.getCourseMaterials(course.id);
                let matCount = 0;
                let totalMatCount = 0;
                if (materials && Array.isArray(materials)) {
                    for (const sem of materials) {
                        for (const mod of sem.modules || []) {
                            for (const mat of mod.materials || []) {
                                totalMatCount++;
                                const matTime = mat.addedAt || mat.created_at || mat.createdAt || mat.timestamp || 0;
                                const addedAt = matTime ? new Date(matTime).getTime() : 0;
                                if (addedAt > lastVisitedMaterialsTs) matCount++;
                            }
                        }
                    }
                }

                const previousMatCountStr = localStorage.getItem(`materials_count_${course.id}`);
                const previousMatCount = previousMatCountStr ? parseInt(previousMatCountStr, 10) : 0;

                if (matCount === 0 && totalMatCount > previousMatCount && lastVisitedMaterialsTs > 0) {
                    matCount = totalMatCount - previousMatCount;
                }

                setNewMaterialsCount(matCount);

                const examData = await courseService.getStudentExaminationsData(course.id);
                const exams = examData.exams || [];
                let exCount = 0;
                let totalExamCount = 0;
                if (exams && Array.isArray(exams)) {
                    for (const exam of exams) {
                        totalExamCount++;
                        const createdAt = exam.created_at ? new Date(exam.created_at).getTime() : 0;
                        const updatedAt = exam.updated_at ? new Date(exam.updated_at).getTime() : 0;
                        if (createdAt > lastVisitedExamsTs || updatedAt > lastVisitedExamsTs) {
                            exCount++;
                        }
                    }
                }

                const previousExamCountStr = localStorage.getItem(`exams_count_${course.id}`);
                const previousExamCount = previousExamCountStr ? parseInt(previousExamCountStr, 10) : 0;

                if (exCount === 0 && totalExamCount > previousExamCount && lastVisitedExamsTs > 0) {
                    exCount = totalExamCount - previousExamCount;
                }

                const courseApps = examData.my_applications || [];
                const coursePostponements = examData.postponement_requests || [];
                const courseReattempts = examData.reattempt_requests || [];

                courseApps.forEach((app: any) => {
                    const updatedAt = app.updated_at ? new Date(app.updated_at).getTime() : 0;
                    if (updatedAt > lastVisitedExamsTs) exCount++;
                });

                coursePostponements.forEach((req: any) => {
                    const updatedAt = req.updated_at ? new Date(req.updated_at).getTime() : 0;
                    if (updatedAt > lastVisitedExamsTs) exCount++;
                });

                courseReattempts.forEach((req: any) => {
                    const updatedAt = req.updated_at ? new Date(req.updated_at).getTime() : 0;
                    if (updatedAt > lastVisitedExamsTs) exCount++;
                });

                setNewExamsCount(exCount);


                (window as any)[`totalMatCount_${course.id}`] = totalMatCount;
                (window as any)[`totalExamCount_${course.id}`] = totalExamCount;
            } catch (err) {
                console.error("Failed to calculate counts:", err);
            }
        };

        loadData();
    }, [course.id]);

    const nextAnn = () => setCurrentAnnIndex((prev) => (prev + 1) % (announcements.length || 1));
    const prevAnn = () => setCurrentAnnIndex((prev) => (prev - 1 + (announcements.length || 1)) % (announcements.length || 1));

    const handleCardClick = (cardId: string) => {

        if (cardId === 'materials') {
            const totalMatCount = (window as any)[`totalMatCount_${course.id}`] || 0;
            localStorage.setItem(`materials_lastVisited_${course.id}`, Date.now().toString());
            localStorage.setItem(`materials_count_${course.id}`, totalMatCount.toString());
            setNewMaterialsCount(0);
            navigate(`/course/${course.id}/materials`);
        } else if (cardId === 'exams') {
            const totalExamCount = (window as any)[`totalExamCount_${course.id}`] || 0;
            localStorage.setItem(`exams_lastVisited_${course.id}`, Date.now().toString());
            localStorage.setItem(`exams_count_${course.id}`, totalExamCount.toString());
            setNewExamsCount(0);
            navigate(`/course/${course.id}/examinations`);
        }
    };

    const actionCards = [
        {
            id: 'materials',
            title: 'Course Materials',
            desc: 'Access lecture notes, assignments and other resources',
            icon: <FileText size={28} />,
            badgeCount: newMaterialsCount,
            bgColor: '#F5F3FF',
            iconColor: '#7C3AED'
        },
        {
            id: 'exams',
            title: 'My Examinations',
            desc: 'Apply for exams and view results',
            icon: <BookOpen size={28} />,
            badgeCount: newExamsCount,
            bgColor: '#F0F9FF',
            iconColor: '#0EA5E9'
        }
    ];

    return (
        <div className="course-details-container">
            <div className="portal-navigation-container">
                <button className="back-btn portal-nav-back-btn" onClick={() => navigate('/dashboard')}>
                    <ArrowLeft size={18} /> Back
                </button>
                <div className="portal-breadcrumbs">
                    <span className="breadcrumb-link" onClick={() => navigate('/dashboard')}>Registered Courses</span>
                    <ChevronRight size={14} className="breadcrumb-separator" />
                    <span className="breadcrumb-current">{course.title}</span>
                </div>
            </div>

            <div className="course-details-header">
                <h1 className="course-details-title">{course.title}</h1>
                <div className="course-header-labels">
                    <span className="course-code-label">{course.code}</span>
                    <span className={`course-type-label ${course.type.toLowerCase()}`}>{course.type}</span>
                </div>
            </div>

            <div className="action-cards-grid">
                {actionCards.map((card, idx) => (
                    <div
                        className="square-action-button-card card"
                        key={idx}
                        onClick={() => handleCardClick(card.id)}
                    >
                        {card.badgeCount > 0 && <div className="card-badge">{card.badgeCount}</div>}
                        <div className="card-icon-square" style={{ backgroundColor: card.bgColor, color: card.iconColor }}>
                            {card.icon}
                        </div>
                        <div className="card-content-professional">
                            <h3>{card.title}</h3>
                            <p>{card.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="course-announcements-section">
                <div className="section-header-compact">
                    <div className="section-title-header-wrapper">
                        <h2 className="section-title-small">Course Announcements and Updates</h2>
                        {announcements.length > 1 && (
                            <div className="ann-slider-controls">
                                <button className="ann-nav-btn" onClick={prevAnn}><ChevronLeft size={16} /></button>
                                <button className="ann-nav-btn" onClick={nextAnn}><ChevronRight size={16} /></button>
                            </div>
                        )}
                    </div>
                    {announcements.length > 0 && <span className="view-all-link" onClick={() => navigate(`/course/${course.id}/announcements`)}>View All Announcements</span>}
                </div>

                <div className="announcements-slider-viewport">
                    {announcements.length > 0 ? (
                        <div
                            className="announcements-slider-track"
                            style={{ transform: `translateX(-${currentAnnIndex * 100}%)` }}
                        >
                            {announcements.map((ann, idx) => (
                                <div className="announcements-slider-item" key={idx}>
                                    <div className="announcement-row">
                                        <div className="ann-icon-box" style={{ backgroundColor: ann.bgColor, color: ann.iconColor }}>
                                            {ann.icon}
                                        </div>
                                        <div className="ann-content">
                                            <div className="ann-meta">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span className="ann-tag" style={{ color: ann.iconColor, backgroundColor: `${ann.iconColor}10` }}>{ann.type}</span>
                                                    <span className="ann-date">{ann.date}</span>
                                                </div>
                                            </div>
                                            <h4 className="ann-title">{ann.title}</h4>
                                            <p className="ann-desc">{ann.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="announcements-slider-item" style={{ padding: '30px 20px', border: '2px dashed #E2E8F0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '120px', backgroundColor: '#F8FAFC' }}>
                            <div style={{ textAlign: 'center', color: '#94A3B8' }}>
                                <Info size={28} style={{ margin: '0 auto 8px', display: 'block', color: '#64748B' }} />
                                <p style={{ fontWeight: 600, fontSize: '14px', margin: 0, color: '#64748B' }}>No announcements published for this course yet.</p>
                            </div>
                        </div>
                    )}
                </div>

                {announcements.length > 1 && (
                    <div className="ann-slider-indicators">
                        {announcements.map((_, idx) => (
                            <span
                                key={idx}
                                className={`ann-dot ${idx === currentAnnIndex ? 'active' : ''}`}
                                onClick={() => setCurrentAnnIndex(idx)}
                            ></span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
