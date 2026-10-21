import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowLeft, BookOpen, FileText, Bell, MessageSquare, Info, ChevronLeft, ChevronRight, Pencil, Users, Check, Loader } from 'lucide-react';
import {
    courseService,
    announcementService
} from '../../services/apiService';
import { toast } from '../../utils/toast';
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

    // Group state
    const [studentGroup, setStudentGroup] = React.useState<string | null>(null);
    const [pendingGroupRequest, setPendingGroupRequest] = React.useState<any>(null);
    const [studentBatch, setStudentBatch] = React.useState<string>('');
    const [availableGroups, setAvailableGroups] = React.useState<string[]>([]);
    const [isExchangeModalOpen, setIsExchangeModalOpen] = React.useState(false);
    const [selectedTargetGroup, setSelectedTargetGroup] = React.useState<string>('');
    const [exchangeReason, setExchangeReason] = React.useState<string>('');
    const [isSubmittingExchange, setIsSubmittingExchange] = React.useState(false);

    React.useEffect(() => {
        if (!course.id) return;

        const loadData = async () => {
            let activeBatch = 'Batch 01';
            try {
                const response = await courseService.getStudentCourses({ refresh: true });
                const matched = response.find((c: any) => c.id.toString() === course.id.toString());
                if (matched) {
                    if (matched.pivot?.batch) {
                        activeBatch = matched.pivot.batch;
                        setStudentBatch(matched.pivot.batch);
                    }
                    if (matched.pivot?.group) {
                        setStudentGroup(matched.pivot.group);
                    } else {
                        setStudentGroup(null);
                    }
                    if (matched.pending_group_request) {
                        setPendingGroupRequest(matched.pending_group_request);
                    } else {
                        setPendingGroupRequest(null);
                    }

                    if (matched.batches && Array.isArray(matched.batches)) {
                        const batchObj = matched.batches.find((b: any) => b.name === activeBatch);
                        if (batchObj && batchObj.groups) {
                            let parsed: string[] = [];
                            if (Array.isArray(batchObj.groups)) {
                                parsed = batchObj.groups;
                            } else if (typeof batchObj.groups === 'string') {
                                try { parsed = JSON.parse(batchObj.groups); } catch (e) { parsed = []; }
                            }
                            setAvailableGroups(parsed);
                        }
                    }
                }
            } catch (e) {
                console.error("Failed to fetch student batch for announcements:", e);
            }


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
            iconColor: 'var(--primary-color)'
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

    const handleRequestExchange = async () => {
        if (!selectedTargetGroup || selectedTargetGroup === studentGroup) {
            toast.error('Please select a different group to exchange to.');
            return;
        }
        try {
            setIsSubmittingExchange(true);
            const res = await courseService.exchangeStudentGroup(course.id, {
                target_group: selectedTargetGroup,
                reason: exchangeReason.trim() || undefined
            });
            setPendingGroupRequest(res.pending_request || { requested_group: selectedTargetGroup, status: 'pending' });
            toast.success(res.message || `Exchange request submitted for ${selectedTargetGroup}! Awaiting staff approval.`);
            setIsExchangeModalOpen(false);
        } catch (err: any) {
            console.error('Failed to exchange group:', err);
            toast.error(err.response?.data?.message || 'Failed to exchange group. Please try again.');
        } finally {
            setIsSubmittingExchange(false);
        }
    };

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
                    <div className="course-group-label-wrapper">
                        <span>Group: {studentGroup || 'Unassigned'}</span>
                        {pendingGroupRequest && (
                            <span style={{ fontSize: '11px', background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '8px', fontWeight: 700 }}>
                                Requested: {pendingGroupRequest.requested_group} (Pending)
                            </span>
                        )}
                        <button
                            type="button"
                            className="course-group-pencil-btn"
                            title="Exchange between groups"
                            onClick={() => {
                                const defaultOther = availableGroups.find(g => g !== studentGroup) || '';
                                setSelectedTargetGroup(pendingGroupRequest?.requested_group || defaultOther);
                                setExchangeReason(pendingGroupRequest?.reason || '');
                                setIsExchangeModalOpen(true);
                            }}
                        >
                            <Pencil size={13} />
                        </button>
                    </div>
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

            {/* Student Group Exchange Modal */}
            {isExchangeModalOpen && (
                <div 
                    className="modal-overlay" 
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(15, 23, 42, 0.45)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000
                    }}
                    onClick={() => !isSubmittingExchange && setIsExchangeModalOpen(false)}
                >
                    <div 
                        className="modal-content"
                        onClick={e => e.stopPropagation()}
                        style={{
                            maxWidth: '460px',
                            width: '92%',
                            borderRadius: '20px',
                            background: '#FFFFFF',
                            padding: '28px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#F5F3FF', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Users size={22} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Exchange Group</h3>
                                <p style={{ color: '#64748B', fontSize: '13px', margin: '2px 0 0 0' }}>Request or switch to another group in your batch</p>
                            </div>
                        </div>

                        <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '14px', marginBottom: '20px', border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>Current Batch:</span>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>{studentBatch || 'N/A'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>Existing Group:</span>
                                <span style={{ 
                                    fontSize: '12px', 
                                    fontWeight: 700, 
                                    color: studentGroup ? 'var(--primary-color)' : '#64748B',
                                    background: studentGroup ? '#F5F3FF' : '#E2E8F0',
                                    padding: '2px 10px',
                                    borderRadius: '12px',
                                    border: studentGroup ? '1px solid #DDD6FE' : 'none'
                                }}>
                                    {studentGroup || 'Unassigned'}
                                </span>
                            </div>
                        </div>

                        {pendingGroupRequest && (
                            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', color: '#B45309', marginBottom: '16px' }}>
                                You currently have a pending request to exchange into <strong>{pendingGroupRequest.requested_group}</strong>. Submitting a new selection will update your pending request.
                            </div>
                        )}

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '10px' }}>
                                Change to Group:
                            </label>
                            {availableGroups.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {availableGroups.map(groupName => {
                                        const isCurrent = groupName === studentGroup;
                                        return (
                                            <label
                                                key={groupName}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '10px 14px',
                                                    borderRadius: '10px',
                                                    border: selectedTargetGroup === groupName ? '2px solid var(--primary-color)' : '1px solid #CBD5E1',
                                                    background: selectedTargetGroup === groupName ? '#F5F3FF' : (isCurrent ? '#F8FAFC' : '#FFFFFF'),
                                                    cursor: isCurrent ? 'default' : 'pointer',
                                                    opacity: isCurrent ? 0.65 : 1
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <input
                                                        type="radio"
                                                        name="target_group_choice"
                                                        value={groupName}
                                                        disabled={isCurrent}
                                                        checked={selectedTargetGroup === groupName}
                                                        onChange={() => setSelectedTargetGroup(groupName)}
                                                    />
                                                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>{groupName}</span>
                                                </div>
                                                {isCurrent && (
                                                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, background: '#E2E8F0', padding: '2px 8px', borderRadius: '8px' }}>
                                                        Current Group
                                                    </span>
                                                )}
                                            </label>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '10px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
                                    No other groups are currently configured for this batch.
                                </div>
                            )}
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                                Reason for Exchange (Optional):
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Schedule conflict with project group"
                                style={{
                                    width: '100%',
                                    height: '40px',
                                    padding: '0 12px',
                                    borderRadius: '10px',
                                    border: '1px solid #CBD5E1',
                                    fontSize: '13px'
                                }}
                                value={exchangeReason}
                                onChange={e => setExchangeReason(e.target.value)}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button
                                type="button"
                                style={{
                                    height: '40px',
                                    padding: '0 18px',
                                    borderRadius: '10px',
                                    border: '1px solid #CBD5E1',
                                    background: '#FFFFFF',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: '#475569',
                                    cursor: 'pointer'
                                }}
                                disabled={isSubmittingExchange}
                                onClick={() => setIsExchangeModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                style={{
                                    height: '40px',
                                    padding: '0 20px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: 'var(--primary-color)',
                                    color: '#FFFFFF',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    cursor: isSubmittingExchange || !selectedTargetGroup || selectedTargetGroup === studentGroup ? 'not-allowed' : 'pointer',
                                    opacity: isSubmittingExchange || !selectedTargetGroup || selectedTargetGroup === studentGroup ? 0.6 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                                disabled={isSubmittingExchange || !selectedTargetGroup || selectedTargetGroup === studentGroup}
                                onClick={handleRequestExchange}
                            >
                                {isSubmittingExchange ? (
                                    <>
                                        <Loader size={16} style={{ animation: 'spin 0.7s linear infinite' }} />
                                        <span>Submitting...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check size={16} />
                                        <span>{pendingGroupRequest ? 'Update Request' : 'Request to Exchange'}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
