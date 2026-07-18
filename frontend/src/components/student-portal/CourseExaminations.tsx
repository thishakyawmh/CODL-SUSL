import React from 'react';
import { useNavigate, useOutletContext, useLocation } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, Clock, Download, Plus, ChevronRight } from 'lucide-react';
import { type Course } from './CourseDetails';
import { toast } from '../../utils/toast';
import { courseService, postponementRequestService, reattemptRequestService, examApplicationService } from '../../services/apiService';
import './CourseExaminations.css';

const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch (e) {
        return dateStr;
    }
};

export const CourseExaminations: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { course } = useOutletContext<{ course: Course }>();

    const courseSubjects = React.useMemo(() => {
        if (course.subjects && course.subjects.length > 0) {
            return course.subjects;
        }
        if (course.semesters && course.semesters.length > 0) {
            const list: { id: number; name: string; code: string; credits: number | string }[] = [];
            course.semesters.forEach(sem => {
                if (sem.subjects && sem.subjects.length > 0) {
                    list.push(...sem.subjects);
                }
            });
            return list;
        }
        return [];
    }, [course]);

    const [scheduledExams, setScheduledExams] = React.useState<any[]>([]);
    const [showStatusModal, setShowStatusModal] = React.useState<any | null>(null);
    const [showDetailsModal, setShowDetailsModal] = React.useState<any | null>(null);
    const [myApplications, setMyApplications] = React.useState<Record<string, any>>({});
    const [activeTab, setActiveTab] = React.useState<'regular' | 'postponements'>('regular');
    const [showToast, setShowToast] = React.useState(false);

    // Postponements & Reattempts state
    const [showApplyDropdown, setShowApplyDropdown] = React.useState(false);
    const [selectedAppType, setSelectedAppType] = React.useState<'postponement' | 'reattempt' | null>(null);
    const [postponeForm, setPostponeForm] = React.useState({
        examId: '',
        salutation: 'Ms.',
        nameWithInitials: '',
        courseOffered: '',
        year: '',
        batch: '',
        registrationNumber: '',
        examUnableToTake: '',
        examScheduledDate: '',
        unableDatesDetails: '',
        address: '',
        mobileNumber: '',
        nic: ''
    });
    const [reattemptForm, setReattemptForm] = React.useState({ examId: '', subject: '', reason: '' });

    React.useEffect(() => {
        if (selectedAppType === 'postponement') {
            let currentStudentName = 'Hiruni Thishakya';
            let currentStudentNumber = 'CODL/2404';
            let currentStudentPhone = '0721234567';
            let currentStudentNic = '199912345678';
            let currentStudentAddress = '123, Central Avenue, Colombo 03';
            try {
                const userStr = sessionStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    currentStudentName = user.display_name || user.displayName || user.full_name || user.fullName || currentStudentName;
                    currentStudentNumber = user.student_number || user.studentNumber || currentStudentNumber;
                    currentStudentPhone = user.phone || user.mobilePhone || user.mobile || currentStudentPhone;
                    currentStudentNic = user.nic || currentStudentNic;
                    currentStudentAddress = user.address || currentStudentAddress;
                }
            } catch (e) { }

            setPostponeForm({
                examId: '',
                salutation: 'Ms.',
                nameWithInitials: currentStudentName,
                courseOffered: course.title || '',
                year: new Date().getFullYear().toString(),
                batch: course.code || 'Batch 01',
                registrationNumber: currentStudentNumber,
                examUnableToTake: '',
                examScheduledDate: '',
                unableDatesDetails: '',
                address: currentStudentAddress,
                mobileNumber: currentStudentPhone,
                nic: currentStudentNic
            });
        }
    }, [selectedAppType, course]);
    const [studentBatch, setStudentBatch] = React.useState<string>('Batch 01');
    const [postApplications, setPostApplications] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState<boolean>(true);
    const [isSubmittingRequest, setIsSubmittingRequest] = React.useState<boolean>(false);

    const fetchAllData = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await courseService.getStudentExaminationsData(course.id);

            const dbExams = data.exams || [];
            localStorage.setItem(`exams_lastVisited_${course.id}`, Date.now().toString());
            localStorage.setItem(`exams_count_${course.id}`, dbExams.length.toString());

            const activeBatch = data.student_batch || 'Batch 01';
            setStudentBatch(activeBatch);

            const currentUserId = (() => {
                try {
                    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
                    return user.id?.toString() || '';
                } catch (e) {
                    return '';
                }
            })();

            const apps = data.my_applications || [];

            const filteredExams = dbExams.filter((exam: any) => {
                const isBatchMatch = exam.batch === activeBatch || exam.batch_name === activeBatch;
                if (!isBatchMatch) return false;

                // Check if student is assigned to this exam
                let isAssigned = false;
                if (exam.regulars && Array.isArray(exam.regulars)) {
                    isAssigned = exam.regulars.map((uid: any) => uid.toString()).includes(currentUserId);
                }

                // Check if student already has an application
                const hasApp = apps.some((app: any) =>
                    app.exam_id?.toString() === exam.id?.toString() ||
                    (app.exam_title && exam.title && app.exam_title.trim().toLowerCase() === exam.title.trim().toLowerCase())
                );

                return isAssigned || hasApp;
            });
            setScheduledExams(filteredExams);

            const appsMapped: Record<string, any> = {};
            apps.forEach((app: any) => {
                const matchingExam = dbExams.find((ex: any) =>
                    (app.exam_id && ex.id.toString() === app.exam_id.toString()) ||
                    (ex.title && app.exam_title && ex.title.trim().toLowerCase() === app.exam_title.trim().toLowerCase())
                );
                const examId = matchingExam ? matchingExam.id.toString() : (app.exam_id ? app.exam_id.toString() : app.exam_title);
                const statusFormatted = app.status ? (app.status.charAt(0).toUpperCase() + app.status.slice(1).toLowerCase()) : 'Pending';

                const mappedObj = {
                    id: app.id,
                    examId: examId,
                    status: statusFormatted,
                    appliedDate: app.created_at || app.updated_at || new Date().toISOString(),
                    refLabel: `REQ-${examId}-${app.id}`,
                    subjects: app.subjects || [],
                    studentName: app.user?.full_name || 'Student',
                    currentStep: app.current_step || (app.status === 'approved' ? 3 : 1),
                    stages: app.stages || { secretary: 'pending', coordinator: 'pending', director: 'pending' },
                    rejectionReason: app.rejection_reason
                };

                // Map to matched exam ID, stringified exam_id, and raw title for maximum robustness
                appsMapped[examId] = mappedObj;
                if (matchingExam) {
                    appsMapped[matchingExam.id.toString()] = mappedObj;
                }
                if (app.exam_id) {
                    appsMapped[app.exam_id.toString()] = mappedObj;
                }
                if (app.exam_title) {
                    appsMapped[app.exam_title] = mappedObj;
                }
            });
            setMyApplications(appsMapped);

            const mappedPostponements = (data.postponement_requests || []).map((p: any) => ({
                id: p.id,
                type: 'postponement',
                examTitle: p.exam_title,
                examId: p.exams && p.exams[0] && !p.exams[0].includes(' - ') ? p.exams[0] : '',
                subjectsList: p.exams || [],
                subject: p.exams && p.exams.length > 0 && p.exams[0].includes(' - ') ? p.exams.join(', ') : 'All Subjects',
                status: p.status === 'assigned' ? 'Assigned' : (p.status === 'approved' ? 'Approved' : (p.status === 'rejected' ? 'Rejected' : 'Pending')),
                assignedExam: p.assigned_exam || null,
                appNumber: p.application_id || `PST-${p.id}`,
                currentStep: p.current_step || 1,
                createdDate: p.created_at,
                reason: p.reason,
                newDate: p.exams && p.exams[1] && !p.exams[1].includes(' - ') ? p.exams[1] || '' : '',
                studentName: p.user?.full_name || 'Student',
                studentNumber: p.user?.student_number || '',
                studentEmail: p.user?.email || '',
                phone: p.phone,
                nic: p.nic,
                address: p.address,
                stages: p.stages || { secretary: 'pending', coordinator: 'pending', director: 'pending' },
                rejectionReason: p.rejection_reason
            }));

            const mappedReattempts = (data.reattempt_requests || []).map((r: any) => ({
                id: r.id,
                type: 'reattempt',
                examTitle: r.exam_title || (r.subject ? r.subject.name : 'Reattempt'),
                examId: r.exam_id || '',
                subject: r.subject ? `${r.subject.code} – ${r.subject.name}` : 'Subject',
                status: r.status === 'assigned' ? 'Assigned' : (r.status === 'approved' ? 'Approved' : (r.status === 'rejected' ? 'Rejected' : 'Pending')),
                assignedExam: r.assigned_exam || null,
                appNumber: r.application_id || `RTT-${r.id}`,
                currentStep: r.current_step || 1,
                createdDate: r.created_at,
                reason: r.reason,
                studentName: r.user?.full_name || 'Student',
                studentNumber: r.user?.student_number || '',
                studentEmail: r.user?.email || '',
                stages: r.stages || { secretary: 'pending', coordinator: 'pending', director: 'pending' },
                rejectionReason: r.rejection_reason
            }));

            setPostApplications([...mappedPostponements, ...mappedReattempts]);
        } catch (err) {
            console.error("Failed to fetch examinations data:", err);
            toast.error("Failed to load examinations data. Please refresh.");
        } finally {
            setIsLoading(false);
        }
    }, [course.id]);

    React.useEffect(() => {
        // Update last visited timestamp to clear notification badges
        localStorage.setItem(`exams_lastVisited_${course.id}`, Date.now().toString());
        fetchAllData();
    }, [course.id, fetchAllData]);

    React.useEffect(() => {
        if (location.state?.toastSuccess) {
            setShowToast(true);
            // Clear location state to prevent double trigger
            navigate(location.pathname, { replace: true });

            const timer = setTimeout(() => {
                setShowToast(false);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [location, navigate]);


    // Available static exams for demo (could be replaced by DB)
    /* const availableStaticExams = [
        {
            id: 1,
            title: 'Semester 3 End Semester Examination',
            deadline: 'Saturday, March 7, 2026'
        },
        {
            id: 2,
            title: 'Semester 4 Mid Semester Examination',
            deadline: 'Saturday, March 7, 2026'
        }
    ]; */

    const userStr = sessionStorage.getItem('user');
    let studentRegNo = 'CODL/2404';
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            studentRegNo = user.student_number || user.studentNumber || studentRegNo;
        } catch (e) { }
    }

    if (isLoading) {
        return (
            <div className="course-examinations-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                <div style={{ textAlign: 'center', color: '#64748B' }}>
                    <div style={{ width: '48px', height: '48px', border: '3px solid #E2E8F0', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                    <p style={{ fontWeight: 600, color: '#64748B' }}>Loading examinations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="course-examinations-container">
            <style>{`
                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
            `}</style>
            {showToast && (
                <div className="premium-toast-container">
                    <div className="premium-toast success">
                        <div className="toast-icon-wrapper">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <div className="toast-content">
                            <span className="toast-title">Success</span>
                            <span className="toast-message">Application submitted successfully!</span>
                        </div>
                        <button className="toast-close-btn" onClick={() => setShowToast(false)}>&times;</button>
                    </div>
                </div>
            )}
            <div className="portal-navigation-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                    <button className="back-btn portal-nav-back-btn" onClick={() => navigate(`/course/${course.id}`)}>
                        <ArrowLeft size={18} /> Back
                    </button>
                    <div className="portal-breadcrumbs">
                        <span className="breadcrumb-link" onClick={() => navigate('/dashboard')}>Registered Courses</span>
                        <ChevronRight size={14} className="breadcrumb-separator" />
                        <span className="breadcrumb-link" onClick={() => navigate(`/course/${course.id}`)}>{course.title}</span>
                        <ChevronRight size={14} className="breadcrumb-separator" />
                        <span className="breadcrumb-current">My Examinations</span>
                    </div>
                </div>

                {activeTab === 'postponements' && selectedAppType === null && (
                    <div className="nav-apply-container" style={{ position: 'relative' }}>
                        <button
                            className="apply-nav-btn"
                            onClick={() => setShowApplyDropdown(v => !v)}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'scale(1.04) translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(79, 70, 229, 0.3)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.2)';
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 22px',
                                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50px',
                                fontSize: '14px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)',
                                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                height: '38px'
                            }}
                        >
                            <Plus size={16} />
                            <span>Apply</span>
                        </button>

                        {showApplyDropdown && (
                            <div className="apply-nav-dropdown" style={{
                                position: 'absolute',
                                top: 'calc(100% + 8px)',
                                right: 0,
                                background: '#FFFFFF',
                                border: '1px solid #E2E8F0',
                                borderRadius: '20px',
                                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
                                padding: '8px',
                                minWidth: '260px',
                                zIndex: 1000,
                                transformOrigin: 'top right',
                                animation: 'fabSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                            }}>
                                <button className="post-apply-option" onClick={() => { setSelectedAppType('postponement'); setShowApplyDropdown(false); }}>
                                    <span className="post-option-icon">📅</span>
                                    <div>
                                        <div className="post-option-title">Postponement</div>
                                        <div className="post-option-desc">Request to delay an exam</div>
                                    </div>
                                </button>
                                <button className="post-apply-option" onClick={() => { setSelectedAppType('reattempt'); setShowApplyDropdown(false); }}>
                                    <span className="post-option-icon">🔁</span>
                                    <div>
                                        <div className="post-option-title">Reattempt</div>
                                        <div className="post-option-desc">Apply to retake a subject</div>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>


            {selectedAppType === null && (
                <div className="exam-tabs-container">
                    <button
                        className={`exam-tab ${activeTab === 'regular' ? 'active' : ''}`}
                        onClick={() => setActiveTab('regular')}
                    >
                        Regular
                    </button>
                    <button
                        className={`exam-tab ${activeTab === 'postponements' ? 'active' : ''}`}
                        onClick={() => setActiveTab('postponements')}
                    >
                        Postponements & Reattempts
                    </button>
                </div>
            )}

            <div className="exam-section">
                {activeTab === 'regular' ? (
                    <div className="exam-strips-list">
                        {scheduledExams.length === 0 && (
                            <div style={{ padding: '40px', textAlign: 'center', background: 'white', borderRadius: '16px', border: '1px dashed #E2E8F0' }}>
                                <p style={{ color: '#94A3B8', fontSize: '14px', margin: 0 }}>No administrative examinations scheduled for this period.</p>
                            </div>
                        )}

                        {scheduledExams
                            .filter(exam => exam.title !== 'gdfg')
                            .map(exam => {
                                const application = myApplications[exam.id];
                                const appStatus = application?.status || 'Not Applied';
                                const appStatusLower = appStatus.toLowerCase();

                                // Check if the application deadline has been reached/passed
                                const isDeadlinePassed = (() => {
                                    if (!exam.deadline) return false;
                                    try {
                                        const dDate = new Date(exam.deadline);
                                        if (isNaN(dDate.getTime())) return false;
                                        return dDate.getTime() < new Date().setHours(0, 0, 0, 0);
                                    } catch (e) {
                                        return false;
                                    }
                                })();

                                // If deadline has passed and exam status is open, automatically treat as closed
                                const baseStatus = (isDeadlinePassed && (exam.status === 'Registration Open' || exam.status === 'Registrations are Open' || exam.status === 'Open'))
                                    ? 'Registrations are Closed'
                                    : exam.status;

                                // Determine display status based on the specific 5 levels requested
                                let effectiveStatus = 'Yet to release results'; // Default fallback

                                if (baseStatus === 'Results Released') {
                                    effectiveStatus = 'Result Released';
                                } else if (baseStatus === 'Result Updated') {
                                    effectiveStatus = 'Result Updated';
                                } else if (appStatusLower === 'pending') {
                                    effectiveStatus = 'Pending approvals';
                                } else if (appStatusLower === 'approved') {
                                    effectiveStatus = 'Application approved';
                                } else if (appStatusLower === 'rejected') {
                                    effectiveStatus = 'Application rejected';
                                } else if (appStatusLower === 'not applied' && (baseStatus === 'Closed' || baseStatus === 'Registrations are Closed' || baseStatus === 'Registration Closed' || baseStatus === 'Exam Closed')) {
                                    effectiveStatus = 'Registrations are closed';
                                } else if (baseStatus === 'Ended' || baseStatus === 'Closed' || baseStatus === 'Yet to release results' || baseStatus === 'Registrations are Closed' || baseStatus === 'Registration Closed' || baseStatus === 'Exam Closed') {
                                    effectiveStatus = 'Yet to release results';
                                } else if (baseStatus === 'Ongoing' || baseStatus === 'Exam in Progress') {
                                    effectiveStatus = 'Exam in progress';
                                } else if (baseStatus === 'Registration Open' || baseStatus === 'Registrations are Open') {
                                    effectiveStatus = 'Registrations are open';
                                }

                                const isRegistrationOpen = effectiveStatus === 'Registrations are open';
                                const isResultsReleased = effectiveStatus === 'Result Released' || effectiveStatus === 'Results released' || effectiveStatus === 'Result Updated';
                                const isPending = effectiveStatus === 'Pending approvals';
                                const isApproved = effectiveStatus === 'Application approved';
                                const isUnreadResult = (baseStatus === 'Results Released' || baseStatus === 'Result Updated') && localStorage.getItem(`viewed_results_${studentRegNo}_${exam.id}`) !== 'true';

                                return (
                                    <div
                                        className="exam-pro-card horizontal"
                                        data-status={effectiveStatus}
                                        key={exam.id}
                                    >
                                        <div className="pro-icon-hub" style={{ position: 'relative' }}>
                                            {isResultsReleased ? <FileText size={20} /> : <Calendar size={20} />}
                                            {isUnreadResult && (
                                                <span style={{
                                                    position: 'absolute',
                                                    top: '-2px',
                                                    right: '-2px',
                                                    width: '10px',
                                                    height: '10px',
                                                    background: '#EF4444',
                                                    borderRadius: '50%',
                                                    boxShadow: '0 0 0 2px #FFFFFF, 0 0 8px #EF4444',
                                                    animation: 'pulse 1.5s infinite'
                                                }}></span>
                                            )}
                                        </div>

                                        <div className="pro-card-main">
                                            <div className="pro-top-meta">
                                                <span className="created-at-label">Created on {exam.createdDate || 'Mar 10, 2026'}</span>
                                            </div>
                                            <h3 className="pro-exam-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                {exam.title}
                                                {isUnreadResult && (
                                                    <span style={{
                                                        background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                                                        color: '#FFFFFF',
                                                        fontSize: '10px',
                                                        fontWeight: 800,
                                                        padding: '3px 8px',
                                                        borderRadius: '6px',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em',
                                                        boxShadow: '0 2px 6px rgba(239, 68, 68, 0.3)',
                                                        display: 'inline-flex',
                                                        alignItems: 'center'
                                                    }}>
                                                        NEW RESULT
                                                    </span>
                                                )}
                                            </h3>

                                            <div className="pro-meta-horizontal">
                                                <div className="pro-meta-item">
                                                    <span className="pro-meta-label">Type:</span>
                                                    <span className="pro-meta-val">{exam.type}</span>
                                                </div>
                                                <div className="pro-sep"></div>
                                                <div className="pro-meta-item">
                                                    <span className="pro-meta-label">Deadline:</span>
                                                    <span className="pro-meta-val">{exam.deadline || 'TBA'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pro-status-center">
                                            <div className="pro-status-tag">
                                                <div className="status-indicator-dot"></div>
                                                {effectiveStatus}
                                            </div>
                                        </div>

                                        <div className="pro-card-actions">
                                            {isRegistrationOpen && appStatusLower === 'not applied' ? (
                                                <button
                                                    className="pro-action-btn primary"
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/course/${course.id}/examinations/apply?examId=${exam.id}`); }}
                                                >
                                                    Apply
                                                </button>
                                            ) : isResultsReleased ? (
                                                <button
                                                    className="pro-action-btn secondary"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        localStorage.setItem(`viewed_results_${studentRegNo}_${exam.id}`, 'true');
                                                        navigate(`/course/${course.id}/examinations/${exam.id}/results`, { state: { exam } });
                                                    }}
                                                >
                                                    View Results
                                                </button>
                                            ) : isPending ? (
                                                <button
                                                    className="pro-action-btn secondary"
                                                    onClick={(e) => { e.stopPropagation(); setShowStatusModal({ exam, application }); }}
                                                >
                                                    View Status
                                                </button>
                                            ) : isApproved ? (
                                                <button
                                                    className="pro-action-btn secondary"
                                                    onClick={(e) => { e.stopPropagation(); setShowDetailsModal({ exam, application }); }}
                                                >
                                                    View Details
                                                </button>
                                            ) : (
                                                <div className="status-placeholder-strip">
                                                    {effectiveStatus}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                ) : (
                    <div className="animate-fade-in">
                        {/* Apply FAB is rendered outside below */}

                        {/* Postponement Instructions */}
                        {selectedAppType === 'postponement' && (
                            <div className="animate-fade-in" style={{ width: '100%', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)', boxSizing: 'border-box' }}>
                                <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>Postponement Application Instructions</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '14px', background: '#EEF2FF', color: '#4F46E5',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: '16px'
                                        }}>
                                            1
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h5 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 700, color: '#1E293B' }}>Fill out the Application Form</h5>
                                            <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>
                                                Fill out the postponement application from CODL Branch at Sabaragamuwa University of Sri Lanka by filling with relevant course and examination information.
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '14px', background: '#F0FDF4', color: '#16A34A',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: '16px'
                                        }}>
                                            2
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h5 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 700, color: '#1E293B' }}>Hand over to CODL Branch</h5>
                                            <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>
                                                Hand it over to CODL Branch with proof of medical or any other document.
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', borderTop: '1px solid #E2E8F0', paddingTop: '20px' }}>
                                        <button
                                            className="pro-action-btn primary"
                                            onClick={() => setSelectedAppType(null)}
                                            style={{ width: 'auto', padding: '12px 32px', background: '#4F46E5', color: '#FFFFFF', fontWeight: 700, borderRadius: '12px' }}
                                        >
                                            Got it
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Reattempt Instructions */}
                        {selectedAppType === 'reattempt' && (
                            <div className="animate-fade-in" style={{ width: '100%', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)', boxSizing: 'border-box' }}>
                                <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>Reattempt Application Instructions</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '14px', background: '#EEF2FF', color: '#4F46E5',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: '16px'
                                        }}>
                                            1
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h5 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 700, color: '#1E293B' }}>Fill out the Application Form</h5>
                                            <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>
                                                Fill out the reattempt application from CODL Branch at Sabaragamuwa University of Sri Lanka by filling with relevant course and examination information.
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '14px', background: '#F0FDF4', color: '#16A34A',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: '16px'
                                        }}>
                                            2
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h5 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 700, color: '#1E293B' }}>Hand over to CODL Branch</h5>
                                            <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>
                                                Hand it over to CODL Branch with proof of payment or any other document.
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', borderTop: '1px solid #E2E8F0', paddingTop: '20px' }}>
                                        <button
                                            className="pro-action-btn primary"
                                            onClick={() => setSelectedAppType(null)}
                                            style={{ width: 'auto', padding: '12px 32px', background: '#4F46E5', color: '#FFFFFF', fontWeight: 700, borderRadius: '12px' }}
                                        >
                                            Got it
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Applications Cards */}
                        {selectedAppType === null && (
                            <div className="exam-strips-list">
                                {postApplications.map(app => {
                                    const isAssigned = app.status === 'Assigned';
                                    const isResultsReleased = isAssigned && app.assignedExam &&
                                        (app.assignedExam.status === 'Results Released' || app.assignedExam.status === 'Result Updated');
                                    const isRejected = app.status === 'Rejected';
                                    const isApproved = app.status === 'Approved';

                                    const displayStatus = isResultsReleased
                                        ? 'Result Released'
                                        : (isAssigned
                                            ? 'Assigned'
                                            : (isRejected
                                                ? 'Rejected'
                                                : (isApproved
                                                    ? 'Approved (Waiting)'
                                                    : 'Pending')));

                                    const cardStatus = isResultsReleased
                                        ? 'Result Released'
                                        : (isAssigned || isApproved
                                            ? 'Application approved'
                                            : (isRejected
                                                ? 'Application rejected'
                                                : 'Application pending'));

                                    return (
                                        <div
                                            className="exam-pro-card horizontal"
                                            data-status={cardStatus}
                                            key={app.id}
                                        >
                                            <div className="pro-icon-hub" style={{ position: 'relative' }}>
                                                {app.type === 'postponement' ? <Calendar size={20} /> : <Clock size={20} />}
                                            </div>

                                            <div className="pro-card-main">
                                                <div className="pro-top-meta">
                                                    <span className="created-at-label">
                                                        Created on {app.createdDate ? new Date(app.createdDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase() : 'MAR 10, 2026'}
                                                    </span>
                                                </div>
                                                <h3 className="pro-exam-title">
                                                    {app.examTitle || (app.type === 'postponement' ? 'Postponement Request' : 'Reattempt Request')}
                                                </h3>

                                                <div className="pro-meta-horizontal">
                                                    <div className="pro-meta-item">
                                                        <span className="pro-meta-label">Type:</span>
                                                        <span className="pro-meta-val" style={{ textTransform: 'capitalize' }}>{app.type}</span>
                                                    </div>
                                                    <div className="pro-sep"></div>
                                                    <div className="pro-meta-item">
                                                        <span className="pro-meta-label">Reference:</span>
                                                        <span className="pro-meta-val">{app.appNumber}</span>
                                                    </div>
                                                </div>

                                                {isAssigned && app.assignedExam && (
                                                    <div className="pro-card-footer-text" style={{ fontSize: '13px', color: '#64748B', fontWeight: 500, marginTop: '8px' }}>
                                                        {`Assigned to: ${app.assignedExam.title} (${app.assignedExam.batch_name || 'All Batches'})`}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pro-status-center">
                                                <div className="pro-status-tag">
                                                    <div className="status-indicator-dot"></div>
                                                    {displayStatus}
                                                </div>
                                            </div>

                                            <div className="pro-card-actions" style={{ display: 'flex', gap: '8px', width: isResultsReleased ? 'auto' : '100%' }}>
                                                {isResultsReleased ? (
                                                    <button
                                                        className="pro-action-btn secondary"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const originalExam = scheduledExams.find(ex =>
                                                                ex.id.toString() === app.examId?.toString() ||
                                                                ex.title.trim().toLowerCase() === app.examTitle?.trim().toLowerCase()
                                                            );
                                                            const originalExamId = originalExam ? originalExam.id : app.examId;
                                                            if (originalExamId) {
                                                                navigate(`/course/${course.id}/examinations/${originalExamId}/results`);
                                                            } else {
                                                                navigate(`/course/${course.id}/examinations/${app.assignedExam.id}/results`);
                                                            }
                                                        }}
                                                        style={{ width: '100%' }}
                                                    >
                                                        View Results
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="pro-action-btn primary"
                                                        onClick={() => setShowDetailsModal(app)}
                                                        style={{ width: '100%' }}
                                                    >
                                                        View Details
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Application Status Modal */}
            {showStatusModal && (
                <div className="status-tracker-overlay" onClick={() => setShowStatusModal(null)}>
                    <div className="status-tracker-modal" onClick={e => e.stopPropagation()}>
                        <div className="tracker-modal-header">
                            <div className="header-text-group">
                                <h3>Application Progress</h3>
                                <p className="tracker-app-number">Application Reference: <strong>{showStatusModal.application?.appNumber || 'EXM-2026-0001'}</strong></p>
                            </div>
                            <button className="tracker-close-btn" onClick={() => setShowStatusModal(null)}>×</button>
                        </div>

                        <div className="tracker-content">
                            <div className="tracker-exam-meta">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span className="meta-label">Examination:</span>
                                    <span className="meta-value">{showStatusModal.exam.title}</span>
                                </div>
                                {showStatusModal.application?.subject && (
                                    <>
                                        <div style={{ width: '1px', height: '36px', background: '#E2E8F0', margin: '0 8px' }}></div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span className="meta-label">Subject:</span>
                                            <span className="meta-value">{showStatusModal.application.subject}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="status-flow-container">
                                {[
                                    { label: 'Submit for Review', date: formatDate(showStatusModal.application?.appliedDate || showStatusModal.application?.createdDate) },
                                    { label: 'Approved by Course Secretary and Coordinator', date: showStatusModal.application?.currentStep >= 2 ? formatDate(showStatusModal.application?.lastModifiedAt || new Date().toISOString()) : 'Pending' },
                                    { label: 'Finished', date: showStatusModal.application?.currentStep >= 3 ? formatDate(showStatusModal.application?.lastModifiedAt || new Date().toISOString()) : 'Pending' }
                                ].map((stepData, index, arr) => {
                                    const stepNum = index + 1;
                                    const isCompleted = stepNum < (showStatusModal.application?.currentStep || 1);
                                    const isActive = stepNum === (showStatusModal.application?.currentStep || 1);
                                    const showDate = stepNum <= (showStatusModal.application?.currentStep || 1);

                                    return (
                                        <div key={index} className={`flow-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                                            <div className="step-point-container">
                                                <div className="step-point">
                                                    {isCompleted ? '✓' : stepNum}
                                                </div>
                                                {index < arr.length - 1 && <div className="step-connector"></div>}
                                            </div>
                                            <div className="step-labels-stack">
                                                <span className="step-label">{stepData.label}</span>
                                                {showDate && <span className="step-date">{stepData.date}</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="tracker-legend">
                                <div className="legend-item">
                                    <div className="legend-dot completed"></div>
                                    <span>Completed</span>
                                </div>
                                <div className="legend-item">
                                    <div className="legend-dot active"></div>
                                    <span>In Progress</span>
                                </div>
                                <div className="legend-item">
                                    <div className="legend-dot"></div>
                                    <span>Pending</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Exam Details Modal */}
            {showDetailsModal && (
                <div className="status-tracker-overlay" onClick={() => setShowDetailsModal(null)}>
                    <div className="status-tracker-modal details" onClick={e => e.stopPropagation()}>
                        <div className="tracker-modal-header">
                            <div className="header-text-group">
                                <h3>
                                    {showDetailsModal.type === 'postponement' || showDetailsModal.type === 'reattempt'
                                        ? `${showDetailsModal.type === 'postponement' ? 'Postponement' : 'Reattempt'} Details`
                                        : `${showDetailsModal.exam?.title || 'Exam'} Details`
                                    }
                                </h3>
                                <p className="tracker-app-number">Registration ID: <strong>{showDetailsModal.appNumber || showDetailsModal.application?.appNumber || 'REG-2026-X1'}</strong></p>
                            </div>
                            <button className="tracker-close-btn" onClick={() => setShowDetailsModal(null)}>×</button>
                        </div>

                        <div className="tracker-content">
                            {showDetailsModal.type === 'postponement' || showDetailsModal.type === 'reattempt' ? (
                                <div>
                                    {/* Request Summary - compact header */}
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '14px 18px', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', marginBottom: '10px' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' as const }}>Application</span>
                                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>{showDetailsModal.appNumber}</span>
                                                <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'capitalize' as const, background: showDetailsModal.type === 'postponement' ? '#DBEAFE' : '#FEF3C7', color: showDetailsModal.type === 'postponement' ? '#1E40AF' : '#D97706' }}>{showDetailsModal.type}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <span style={{
                                                display: 'inline-block', fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '8px',
                                                background: showDetailsModal.status === 'Assigned' ? '#DCFCE7' : showDetailsModal.status === 'Approved' ? '#DCFCE7' : showDetailsModal.status === 'Rejected' ? '#FEE2E2' : '#FEF3C7',
                                                color: showDetailsModal.status === 'Assigned' ? '#10B981' : showDetailsModal.status === 'Approved' ? '#10B981' : showDetailsModal.status === 'Rejected' ? '#EF4444' : '#D97706'
                                            }}>
                                                {showDetailsModal.status}
                                            </span>
                                        </div>
                                    </div>

                                    {showDetailsModal.status === 'Assigned' && showDetailsModal.assignedExam ? (
                                        /* Full Assigned Exam Details — matches regular exam view */
                                        <div>
                                            <div className="exam-details-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                                <div className="detail-box" style={{ gridColumn: '1 / -1' }}>
                                                    <span className="detail-label" style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px', whiteSpace: 'nowrap' }}>Assigned Examination</span>
                                                    <span className="detail-value" style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B' }}>{showDetailsModal.assignedExam.title}</span>
                                                </div>
                                                <div className="detail-box">
                                                    <span className="detail-label" style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>Batch</span>
                                                    <span className="detail-value" style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B' }}>{showDetailsModal.assignedExam.batch_name || 'All Batches'}</span>
                                                </div>
                                                <div className="detail-box simple-download">
                                                    <span className="detail-label" style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>Time Table</span>
                                                    {showDetailsModal.assignedExam.timetable_path ? (
                                                        <button className="simple-download-link" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', fontWeight: 600, fontSize: '14px', padding: 0 }}>
                                                            <Download size={14} /> Download Time Table
                                                        </button>
                                                    ) : (
                                                        <span className="detail-value" style={{ fontSize: '14px', fontWeight: 600, color: '#94A3B8' }}>Not yet uploaded</span>
                                                    )}
                                                </div>
                                            </div>
                                            {(showDetailsModal.assignedExam.status === 'Results Released' || showDetailsModal.assignedExam.status === 'Result Updated') && (
                                                <div style={{ marginTop: '20px', background: '#F5F3FF', border: '1px solid #EDE9FE', padding: '16px 20px', borderRadius: '12px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{ fontSize: '14px', color: '#5B21B6', fontWeight: 700 }}>🎉 Results are released for this assigned exam! Your grade has been updated in your original results sheet.</span>
                                                    <button
                                                        className="pro-action-btn primary small"
                                                        style={{ width: 'auto', background: '#8B5CF6', color: '#FFFFFF', padding: '8px 24px', borderRadius: '8px' }}
                                                        onClick={() => {
                                                            setShowDetailsModal(null);
                                                            const originalExam = scheduledExams.find(ex =>
                                                                ex.id.toString() === showDetailsModal.examId?.toString() ||
                                                                ex.title.trim().toLowerCase() === showDetailsModal.examTitle?.trim().toLowerCase()
                                                            );
                                                            const originalExamId = originalExam ? originalExam.id : showDetailsModal.examId;
                                                            if (originalExamId) {
                                                                navigate(`/course/${course.id}/examinations/${originalExamId}/results`);
                                                            } else {
                                                                navigate(`/course/${course.id}/examinations/${showDetailsModal.assignedExam.id}/results`);
                                                            }
                                                        }}
                                                    >
                                                        View Results
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        /* Non-assigned request — show basic details */
                                        <div>
                                            <div style={{ overflow: 'hidden', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                                                    <tbody>
                                                        <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                                                            <th style={{ padding: '16px', background: '#F8FAFC', color: '#64748B', fontWeight: 600, width: '35%', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                                                                {showDetailsModal.type === 'postponement' ? 'Examination unable to take' : 'Examination to reattempt'}
                                                            </th>
                                                            <td style={{ padding: '16px', color: '#1E293B', fontWeight: 600 }}>
                                                                {showDetailsModal.examTitle || 'N/A'}
                                                            </td>
                                                        </tr>
                                                        {showDetailsModal.type === 'postponement' && showDetailsModal.subjectsList && showDetailsModal.subjectsList.length > 0 && showDetailsModal.subjectsList[0].includes(' - ') && (
                                                            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                                                                <th style={{ padding: '16px', background: '#F8FAFC', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px', verticalAlign: 'top' }}>
                                                                    Selected Subjects
                                                                </th>
                                                                <td style={{ padding: '16px', color: '#1E293B', fontWeight: 600 }}>
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                                        {showDetailsModal.subjectsList.map((sub: string, index: number) => (
                                                                            <div key={index} style={{ display: 'inline-block', padding: '4px 10px', background: '#EEF2FF', color: '#4F46E5', borderRadius: '6px', fontSize: '13px', width: 'fit-content', fontWeight: 600 }}>
                                                                                {sub}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                        {showDetailsModal.type === 'reattempt' && showDetailsModal.subject && (
                                                            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                                                                <th style={{ padding: '16px', background: '#F8FAFC', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px', verticalAlign: 'top' }}>
                                                                    Selected Subject
                                                                </th>
                                                                <td style={{ padding: '16px', color: '#1E293B', fontWeight: 600 }}>
                                                                    <div style={{ display: 'inline-block', padding: '4px 10px', background: '#FFF7ED', color: '#D97706', borderRadius: '6px', fontSize: '13px', width: 'fit-content', fontWeight: 600 }}>
                                                                        {showDetailsModal.subject}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                        <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                                                            <th style={{ padding: '16px', background: '#F8FAFC', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px', verticalAlign: 'top' }}>
                                                                Details / Reason
                                                            </th>
                                                            <td style={{ padding: '16px', color: '#475569', whiteSpace: 'pre-line', lineHeight: '1.5' }}>
                                                                {showDetailsModal.reason || 'No details provided'}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <th style={{ padding: '16px', background: '#F8FAFC', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                                                                Created Date
                                                            </th>
                                                            <td style={{ padding: '16px', color: '#475569', fontWeight: 500 }}>
                                                                {showDetailsModal.createdDate ? new Date(showDetailsModal.createdDate).toLocaleDateString() : 'N/A'}
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="detail-box" style={{ marginTop: '20px', background: '#FFF7ED', border: '1px solid #FED7AA', padding: '16px 20px', borderRadius: '12px', textAlign: 'center' }}>
                                                <span style={{ fontSize: '14px', color: '#9A3412', fontWeight: 600 }}>⏳ You will be assigned to the next available examination</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : showDetailsModal.isResultsInfo ? (
                                <div className="results-info-container">
                                    <div className="results-info-icon-box">
                                        <FileText size={32} />
                                    </div>
                                    <h3 className="results-info-title">Results Available</h3>
                                    <p className="results-info-message">
                                        Results for this examination have been updated in the <strong>Regular Exam Result Sheet</strong>. You can view your results from the Regular examinations section.
                                    </p>
                                    <button
                                        className="pro-action-btn primary"
                                        style={{ marginTop: '8px', width: 'auto', padding: '14px 28px' }}
                                        onClick={() => {
                                            setShowDetailsModal(null);
                                            setActiveTab('regular');
                                            // Find the linked exam and navigate to its results
                                            const linkedExam = scheduledExams.find(e => e.id === showDetailsModal.linkedExamId);
                                            if (linkedExam) {
                                                localStorage.setItem(`viewed_results_${studentRegNo}_${showDetailsModal.linkedExamId}`, 'true');
                                                navigate(`/course/${course.id}/examinations/${showDetailsModal.linkedExamId}/results`, { state: { exam: linkedExam } });
                                            }
                                        }}
                                    >
                                        View Results
                                    </button>
                                </div>
                            ) : (() => {
                                const modalSubjects = showDetailsModal.application?.subjects || showDetailsModal.exam?.subjects || [];
                                const hasSubjects = modalSubjects && modalSubjects.length > 0;
                                return (
                                    <div className="exam-details-grid">
                                        <div className="detail-box">
                                            <span className="detail-label">Examination Type</span>
                                            <span className="detail-value" style={{ textTransform: 'capitalize' }}>{showDetailsModal.exam.type}</span>
                                        </div>
                                        {!hasSubjects ? (
                                            <div className="detail-box">
                                                <span className="detail-label">Examination Date</span>
                                                <span className="detail-value">{showDetailsModal.exam.date || 'TBA'}</span>
                                            </div>
                                        ) : (
                                            <div className="detail-box">
                                                <span className="detail-label">Admission Slip</span>
                                                <span className="detail-value text-success">Verified & Ready</span>
                                            </div>
                                        )}
                                        {hasSubjects && (
                                            <div className="detail-box" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <span className="detail-label" style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>Selected Subjects</span>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: '#F8FAFC', padding: '10px 14px', borderRadius: '12px', border: '1px solid #E2E8F0', maxHeight: '120px', overflowY: 'auto' }}>
                                                    {modalSubjects.map((sub: any, index: number) => (
                                                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', borderBottom: index < modalSubjects.length - 1 ? '1px solid #F1F5F9' : 'none', paddingBottom: index < modalSubjects.length - 1 ? '6px' : '0', paddingTop: index > 0 ? '6px' : '0' }}>
                                                            <span style={{ fontWeight: 700, color: '#475569', minWidth: '70px' }}>{sub.code || 'N/A'}</span>
                                                            <span style={{ fontWeight: 600, color: '#1E293B', flex: 1, paddingLeft: '8px' }}>{sub.name}</span>
                                                            {sub.attempt && (
                                                                <span style={{ fontSize: '11px', fontWeight: 800, color: '#6366F1', background: '#EEF2FF', padding: '2px 8px', borderRadius: '6px' }}>
                                                                    {sub.attempt === '1' ? '1st' : sub.attempt === '2' ? '2nd' : sub.attempt === '3' ? '3rd' : `${sub.attempt}th`} Attempt
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {showDetailsModal.exam.subject && (
                                            <div className="detail-box" style={{ gridColumn: '1 / -1' }}>
                                                <span className="detail-label">Subject</span>
                                                <span className="detail-value">{showDetailsModal.exam.subject}</span>
                                            </div>
                                        )}
                                        {!hasSubjects && (
                                            <div className="detail-box">
                                                <span className="detail-label">Admission Slip</span>
                                                <span className="detail-value text-success">Verified & Ready</span>
                                            </div>
                                        )}
                                        <div className="detail-box simple-download" style={{ gridColumn: hasSubjects ? 'span 2' : 'span 1' }}>
                                            <span className="detail-label">Time Table</span>
                                            <button className="simple-download-link">
                                                <Download size={14} /> Download Time Table
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                    </div>
                </div>
            )}



        </div>
    );
};
