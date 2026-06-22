import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft, Save,
    History, Clock, UserPlus, X, Users,
    Search, Plus, Trash2, Loader, Check, XCircle,
    ClipboardList, User, FileText, Eye, RefreshCw,
    CreditCard, MapPin
} from 'lucide-react';
import {
    courseService,
    examService,
    postponementRequestService,
    reattemptRequestService,
    examApplicationService
} from '../../services/apiService';
import { toast } from '../../utils/toast';
import { getCurrentAdminUser } from '../../data/mockAdminData';
import { VerificationStages } from '../common/VerificationStages';
import './CourseManagement.css';

export const ManageExamStudents: React.FC = () => {
    const { id, examId } = useParams<{ id: string; examId: string }>();
    const courseId = id ? id.split(':')[0] : '';
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const batchFromUrl = searchParams.get('batch') || '';

    // ─── Loading state ─────────────────────────
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [examName, setExamName] = useState('');
    const [examBatch, setExamBatch] = useState(batchFromUrl);
    const [courseTitle, setCourseTitle] = useState('');

    // ─── Student selection state ───────────────
    const [selectedRegulars, setSelectedRegulars] = useState<string[]>([]);
    const [tempSelectedRegulars, setTempSelectedRegulars] = useState<string[]>([]);
    const [selectedReattempts, setSelectedReattempts] = useState<string[]>([]);
    const [selectedPostponements, setSelectedPostponements] = useState<string[]>([]);
    const [activeModal, setActiveModal] = useState<'regular' | 'postponements' | 'reattempts' | null>(null);
    const [regularSearchQuery, setRegularSearchQuery] = useState('');
    const [modalSearchQuery, setModalSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'regular' | 'postponements' | 'reattempts'>('regular');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Rejection state
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [pendingApp, setPendingApp] = useState<any | null>(null);

    // Details Modal state
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedAppDetails, setSelectedAppDetails] = useState<any | null>(null);

    const currentUser = getCurrentAdminUser();
    const userRole = currentUser?.role || 'super_admin';
    const canManageStudents = userRole === 'secretary' || userRole === 'super_admin';

    const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
    const [studentRequests, setStudentRequests] = useState<any[]>([]);
    const [examApplications, setExamApplications] = useState<any[]>([]);

    const fetchRegulars = React.useCallback(async (isSilent = false) => {
        if (!id || !examId) return;
        if (!isSilent) setIsLoading(true);
        try {
            // Fetch course info
            const courseData = await courseService.getById(courseId);
            setCourseTitle(courseData.title || '');

            // Fetch exam info
            const exams = await examService.getByCourse(courseId);
            const exam = exams.find((e: any) => e.id.toString() === examId.toString());
            if (exam) {
                setExamName(exam.title || '');
                const batch = exam.batch || exam.batch_name || batchFromUrl;
                setExamBatch(batch);

                if (exam.regulars) {
                    setSelectedRegulars(exam.regulars);
                }
            }

            // Fetch enrolled students
            const students = await courseService.getEnrolledStudents(courseId);
            setEnrolledStudents(students);

            // Fetch exam applications
            const courseManageData = await courseService.getManageCourseData(courseId);
            const examApps = (courseManageData.exam_applications || []).filter((app: any) => {
                const titleMatch = app.exam_title?.toLowerCase().trim() === exam?.title?.toLowerCase().trim() ||
                    (app.exam_id && app.exam_id.toString() === examId?.toString());
                return titleMatch;
            });
            setExamApplications(examApps);
        } catch (err) {
            console.error('Failed to load regulars:', err);
            toast.error('Failed to load regular students.');
        } finally {
            if (!isSilent) setIsLoading(false);
        }
    }, [id, examId, courseId, batchFromUrl]);

    const fetchPostponements = React.useCallback(async (isSilent = false) => {
        if (!id || !examId) return;
        if (!isSilent) setIsLoading(true);
        try {
            // Postponements
            const postponements = await postponementRequestService.getAll();
            const filteredPost = (postponements || []).filter((p: any) => {
                if (!p) return false;
                const courseIdMatch = p.course_id?.toString() === courseId.toString();
                const statusMatch = p.status?.toLowerCase() === 'approved' ||
                    p.assigned_exam_id?.toString() === examId?.toString();
                return courseIdMatch && statusMatch;
            });
            const mappedPost = filteredPost.map((p: any) => ({
                id: p.id.toString(),
                application_id: p.application_id || `P-${p.id.toString().padStart(4, '0')}`,
                type: 'postponement',
                studentName: p.user?.full_name || 'Student',
                studentNumber: p.user?.student_number || '',
                examTitle: p.exam_title,
                reason: p.reason,
                batch: p.batch || '',
                status: p.status,
                assigned_exam_id: p.assigned_exam_id?.toString() || null
            }));

            // Merge with existing reattempts
            setStudentRequests(prev => [
                ...mappedPost,
                ...prev.filter(r => r.type !== 'postponement')
            ]);

            const autoPost = mappedPost
                .filter((p: any) => p.assigned_exam_id === examId?.toString())
                .map((p: any) => p.id);
            if (autoPost.length > 0) setSelectedPostponements(autoPost);
        } catch (err) {
            console.error('Failed to load postponements:', err);
            toast.error('Failed to load postponements.');
        } finally {
            if (!isSilent) setIsLoading(false);
        }
    }, [id, examId, courseId]);

    const fetchReattempts = React.useCallback(async (isSilent = false) => {
        if (!id || !examId) return;
        if (!isSilent) setIsLoading(true);
        try {
            // Reattempts
            const reattempts = await reattemptRequestService.getAll();
            const filteredReat = (reattempts || []).filter((r: any) => {
                if (!r) return false;
                const courseIdMatch = r.course_id?.toString() === courseId.toString();
                const statusMatch = r.status?.toLowerCase() === 'approved' ||
                    r.assigned_exam_id?.toString() === examId?.toString();
                return courseIdMatch && statusMatch;
            });
            const mappedReat = filteredReat.map((r: any) => ({
                id: r.id.toString(),
                application_id: r.application_id || `R-${r.id.toString().padStart(4, '0')}`,
                type: 'reattempt',
                studentName: r.user?.full_name || 'Student',
                studentNumber: r.user?.student_number || '',
                subject: r.subject?.name || '',
                reason: r.reason,
                batch: r.batch || '',
                status: r.status,
                assigned_exam_id: r.assigned_exam_id?.toString() || null,
                attempt: r.attempt || 2
            }));

            // Merge with existing postponements
            setStudentRequests(prev => [
                ...prev.filter(r => r.type !== 'reattempt'),
                ...mappedReat
            ]);

            const autoReat = mappedReat
                .filter((r: any) => r.assigned_exam_id === examId?.toString())
                .map((r: any) => r.id);
            if (autoReat.length > 0) setSelectedReattempts(autoReat);
        } catch (err) {
            console.error('Failed to load reattempts:', err);
            toast.error('Failed to load reattempts.');
        } finally {
            if (!isSilent) setIsLoading(false);
        }
    }, [id, examId, courseId]);

    const fetchAll = React.useCallback(async (isSilent = false) => {
        if (!id || !examId) return;
        if (!isSilent) setIsLoading(true);
        try {
            await Promise.all([
                fetchRegulars(true),
                fetchPostponements(true),
                fetchReattempts(true)
            ]);
        } catch (err) {
            console.error('Failed to load exam students:', err);
            toast.error('Failed to load student data.');
        } finally {
            if (!isSilent) setIsLoading(false);
        }
    }, [fetchRegulars, fetchPostponements, fetchReattempts, id, examId]);

    const handleRefresh = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        try {
            if (activeTab === 'regular') {
                await fetchRegulars(true);
            } else if (activeTab === 'postponements') {
                await fetchPostponements(true);
            } else if (activeTab === 'reattempts') {
                await fetchReattempts(true);
            }
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const getStageStatus = (app: any, stageName: 'secretary' | 'coordinator' | 'director') => {
        if (!app) return 'pending';
        if (app.stages && typeof app.stages === 'object' && !Array.isArray(app.stages)) {
            return app.stages[stageName] || 'pending';
        }
        if (Array.isArray(app.stages)) {
            const idx = stageName === 'secretary' ? 0 : (stageName === 'coordinator' ? 1 : 2);
            const stageObj = app.stages[idx];
            if (stageObj) return stageObj.status || 'pending';
        }
        const step = app.current_step || 1;
        if (app.status === 'rejected') {
            if (stageName === 'secretary' && step === 1) return 'rejected';
            if (stageName === 'coordinator' && step === 2) return 'rejected';
            if (stageName === 'director' && step === 3) return 'rejected';
        }
        if (stageName === 'secretary') return step > 1 ? 'approved' : 'pending';
        if (stageName === 'coordinator') return step > 2 ? 'approved' : 'pending';
        if (stageName === 'director') return app.status === 'approved' ? 'approved' : 'pending';
        return 'pending';
    };

    const renderVerificationStages = (app: any) => {
        if (!app) return <span style={{ color: '#94A3B8' }}>-</span>;

        const secStatus = getStageStatus(app, 'secretary');
        const coorStatus = getStageStatus(app, 'coordinator');
        const dirStatus = getStageStatus(app, 'director');

        return (
            <VerificationStages
                secretaryStatus={secStatus}
                coordinatorStatus={coorStatus}
                directorStatus={dirStatus}
            />
        );
    };

    const handleApprove = async (app: any) => {
        const user = getCurrentAdminUser();
        const userRole = user?.role || 'super_admin';

        let nextStages = app.stages && typeof app.stages === 'object' && !Array.isArray(app.stages)
            ? { ...app.stages }
            : { secretary: 'pending', coordinator: 'pending', director: 'pending' };

        if (Array.isArray(app.stages)) {
            nextStages = {
                secretary: app.stages[0]?.status || 'pending',
                coordinator: app.stages[1]?.status || 'pending',
                director: app.stages[2]?.status || 'pending'
            };
        }

        let nextStatus = 'pending';
        let currentStep = app.current_step || 1;

        if (userRole === 'secretary') {
            nextStages.secretary = 'approved';
            nextStatus = 'pending';
            currentStep = 2;
        } else if (userRole === 'coordinator') {
            if (nextStages.secretary !== 'approved') {
                toast.error('Secretary must approve first before Coordinator can act.');
                return;
            }
            nextStages.coordinator = 'approved';
            nextStatus = 'pending';
            currentStep = 3;
        } else if (userRole === 'director') {
            if (nextStages.coordinator !== 'approved') {
                toast.error('Coordinator must approve first before Director can act.');
                return;
            }
            nextStages.director = 'approved';
            nextStatus = 'approved';
            currentStep = 3;
        } else {
            nextStages.secretary = 'approved';
            nextStages.coordinator = 'approved';
            nextStages.director = 'approved';
            nextStatus = 'approved';
            currentStep = 3;
        }

        try {
            await examApplicationService.update(app.id, {
                status: nextStatus,
                stages: nextStages,
                current_step: currentStep,
                rejection_reason: null
            });
            toast.success(nextStatus === 'approved' ? 'Application fully approved!' : 'Application level approved successfully!');
            await fetchAll(true);
        } catch (err: any) {
            console.error('Failed to approve application:', err);
            toast.error(err.response?.data?.message || 'Failed to approve application.');
        }
    };

    const handleReject = async (app: any, reason: string) => {
        const user = getCurrentAdminUser();
        const userRole = user?.role || 'super_admin';

        let nextStages = app.stages && typeof app.stages === 'object' && !Array.isArray(app.stages)
            ? { ...app.stages }
            : { secretary: 'pending', coordinator: 'pending', director: 'pending' };

        if (Array.isArray(app.stages)) {
            nextStages = {
                secretary: app.stages[0]?.status || 'pending',
                coordinator: app.stages[1]?.status || 'pending',
                director: app.stages[2]?.status || 'pending'
            };
        }

        if (userRole === 'secretary') {
            nextStages.secretary = 'rejected';
        } else if (userRole === 'coordinator') {
            nextStages.coordinator = 'rejected';
        } else if (userRole === 'director') {
            nextStages.director = 'rejected';
        } else {
            nextStages.secretary = 'rejected';
            nextStages.coordinator = 'rejected';
            nextStages.director = 'rejected';
        }

        try {
            await examApplicationService.update(app.id, {
                status: 'rejected',
                stages: nextStages,
                current_step: app.current_step || 1,
                rejection_reason: reason || 'Rejected'
            });
            toast.success('Application rejected successfully.');
            await fetchAll(true);
        } catch (err: any) {
            console.error('Failed to reject application:', err);
            toast.error(err.response?.data?.message || 'Failed to reject application.');
        }
    };

    const handleDeleteApplication = async (appId: string | number) => {
        if (!window.confirm("Are you sure you want to delete this application request completely? This action cannot be undone.")) {
            return;
        }
        try {
            await examApplicationService.delete(appId);
            toast.success("Application deleted successfully!");
            setShowDetailsModal(false);
            await fetchAll(true);
        } catch (err: any) {
            console.error("Failed to delete application:", err);
            toast.error(err.response?.data?.message || "Failed to delete application.");
        }
    };

    // ─── Derived lists ─────────────────────────
    const regularEnrolled = useMemo(() => {
        return enrolledStudents
            .filter((s: any) => {
                if (!s || !s.batch) return false;
                return s.batch.toString().trim().toLowerCase() === examBatch?.toString().trim().toLowerCase();
            })
            .map((s: any) => ({
                id: (s.real_id || s.id).toString(),
                fullName: s.name || s.displayName,
                studentNumber: s.student_number || s.id.toString(),
                email: s.email,
                status: s.status || 'Active',
                role: 'student'
            }))
            .sort((a: any, b: any) => a.studentNumber.localeCompare(b.studentNumber, undefined, { numeric: true, sensitivity: 'base' }));
    }, [enrolledStudents, examBatch]);

    const displayedRegulars = useMemo(() => {
        return regularEnrolled.filter(student => {
            const hasApp = examApplications.some(app =>
                app.user_id?.toString() === student.id || app.user?.id?.toString() === student.id
            );
            const isSelected = selectedRegulars.includes(student.id);
            const matchesSearch = student.fullName.toLowerCase().includes(regularSearchQuery.toLowerCase()) ||
                student.studentNumber.toLowerCase().includes(regularSearchQuery.toLowerCase());

            return (isSelected || hasApp) && matchesSearch;
        });
    }, [regularEnrolled, selectedRegulars, examApplications, regularSearchQuery]);

    const filteredModalRegulars = useMemo(() => {
        return regularEnrolled.filter(student =>
            student.fullName.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
            student.studentNumber.toLowerCase().includes(modalSearchQuery.toLowerCase())
        );
    }, [regularEnrolled, modalSearchQuery]);

    const eligiblePostponements = useMemo(() =>
        studentRequests.filter((r: any) => r.type === 'postponement'),
        [studentRequests]);

    const eligibleReattempts = useMemo(() =>
        studentRequests.filter((r: any) => r.type === 'reattempt'),
        [studentRequests]);

    const registeredPostponements = useMemo(() =>
        eligiblePostponements.filter((p: any) => selectedPostponements.includes(p.id)),
        [eligiblePostponements, selectedPostponements]);

    const registeredReattempts = useMemo(() =>
        eligibleReattempts.filter((r: any) => selectedReattempts.includes(r.id)),
        [eligibleReattempts, selectedReattempts]);

    const saveRegulars = async (newRegulars: string[]) => {
        setIsSaving(true);
        try {
            const exams = await examService.getByCourse(courseId);
            const exam = exams.find((e: any) => e.id.toString() === examId?.toString());
            if (!exam) throw new Error('Exam not found');

            await examService.update(examId!, {
                title: exam.title,
                deadline: exam.deadline,
                date: exam.deadline,
                fee: exam.fee,
                type: exam.type,
                status: exam.status,
                batch_name: examBatch,
                regulars: newRegulars,
                reattempts: selectedReattempts,
                postponements: selectedPostponements,
                subjects: exam.subjects || [],
                timetable_path: exam.timetable_path || exam.timetablePath || '',
                semester: exam.semester || 1
            });
            setSelectedRegulars(newRegulars);
            toast.success('Regular students list updated successfully!');
            await fetchAll(true);
        } catch (err: any) {
            console.error('Failed to save regular students:', err);
            toast.error(err.response?.data?.message || 'Failed to save changes.');
        } finally {
            setIsSaving(false);
        }
    };

    // ─── Save ──────────────────────────────────
    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            const exams = await examService.getByCourse(courseId);
            const exam = exams.find((e: any) => e.id.toString() === examId?.toString());
            if (!exam) throw new Error('Exam not found');

            await examService.update(examId!, {
                title: exam.title,
                deadline: exam.deadline,
                date: exam.deadline,
                fee: exam.fee,
                type: exam.type,
                status: exam.status,
                batch_name: examBatch,
                regulars: selectedRegulars,
                reattempts: selectedReattempts,
                postponements: selectedPostponements,
                subjects: exam.subjects || [],
                timetable_path: exam.timetable_path || exam.timetablePath || '',
                semester: exam.semester || 1
            });
            toast.success('Student assignments saved successfully!');
            navigate(`/admin/courses/manage/${id}?batch=${encodeURIComponent(batchFromUrl)}&section=exams`);
        } catch (err: any) {
            console.error('Failed to save student assignments:', err);
            toast.error(err.response?.data?.message || 'Failed to save changes.');
        } finally {
            setIsSaving(false);
        }
    };

    // ─── Loading spinner ───────────────────────
    if (isLoading) {
        return (
            <div className="cm-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{ textAlign: 'center', color: '#64748B' }}>
                    <div style={{ width: '48px', height: '48px', border: '3px solid #E2E8F0', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                    <p style={{ fontWeight: 600, margin: 0 }}>Loading students...</p>
                </div>
            </div>
        );
    }

    const totalRegisteredCount = selectedRegulars.length + registeredPostponements.length + registeredReattempts.length;

    return (
        <>
            <div className="cm-container">
                {/* ─── Page Header ─── */}
                <div className="admin-page-header" style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'flex-start' }}>
                    <button
                        className="cm-back-btn"
                        onClick={() => navigate(`/admin/courses/manage/${id}?batch=${encodeURIComponent(batchFromUrl)}&section=exams`)}
                        style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '10px 18px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div>
                            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Manage Students</h1>
                            <p style={{ color: '#64748B', margin: '6px 0 0 0', fontSize: '15px' }}>
                                {courseTitle} {examBatch && `• ${examBatch}`} • <span style={{ fontWeight: 700, color: '#7C3AED' }}>{examName}</span>
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                className="admin-btn-outline"
                                onClick={() => navigate(`/admin/courses/manage/${id}?batch=${encodeURIComponent(batchFromUrl)}&section=exams`)}
                                style={{ height: '40px', padding: '0 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 600 }}
                            >
                                Cancel
                            </button>
                            {canManageStudents && (
                                <button
                                    className="admin-btn-primary"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: isSaving ? 0.7 : 1, height: '40px', padding: '0 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 600 }}
                                >
                                    {isSaving ? <Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Save size={14} />}
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="create-course-form" style={{ marginTop: '24px' }}>
                    {/* ─── Total Banner ─── */}
                    <div style={{
                        background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                        borderRadius: '20px',
                        padding: '24px 32px',
                        marginBottom: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        color: '#FFFFFF',
                        boxShadow: '0 8px 24px rgba(124, 58, 237, 0.15)'
                    }}>
                        <div>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.75)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Total Registered Students
                            </span>
                            <h2 style={{ fontSize: '38px', fontWeight: 900, margin: '6px 0 0 0', color: '#FFFFFF', lineHeight: 1 }}>
                                {totalRegisteredCount}
                            </h2>
                        </div>
                        <div style={{ width: '56px', height: '56px', background: 'rgba(255, 255, 255, 0.15)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users size={28} />
                        </div>
                    </div>

                    {/* ─── Tabs Selection ─── */}
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        marginBottom: '24px',
                        borderBottom: '1px solid #E2E8F0',
                        paddingBottom: '12px'
                    }}>
                        {[
                            { key: 'regular' as const, label: 'Regular', icon: <UserPlus size={16} />, count: selectedRegulars.length },
                            { key: 'postponements' as const, label: 'Postponements', icon: <Clock size={16} />, count: registeredPostponements.length },
                            { key: 'reattempts' as const, label: 'Reattempts', icon: <History size={16} />, count: registeredReattempts.length }
                        ].map(tab => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: activeTab === tab.key ? '#7C3AED' : 'transparent',
                                    color: activeTab === tab.key ? '#FFFFFF' : '#64748B',
                                    fontWeight: 700,
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s ease',
                                    outline: 'none',
                                    boxShadow: activeTab === tab.key ? '0 4px 12px rgba(124, 58, 237, 0.2)' : 'none'
                                }}
                                onMouseEnter={(e) => {
                                    if (activeTab !== tab.key) {
                                        e.currentTarget.style.background = '#F1F5F9';
                                        e.currentTarget.style.color = '#1E293B';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (activeTab !== tab.key) {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = '#64748B';
                                    }
                                }}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                                <span style={{
                                    background: activeTab === tab.key ? 'rgba(255, 255, 255, 0.25)' : '#E2E8F0',
                                    color: activeTab === tab.key ? '#FFFFFF' : '#475569',
                                    padding: '2px 8px',
                                    borderRadius: '20px',
                                    fontSize: '11px',
                                    fontWeight: 800
                                }}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* ─── SECTION 1: Regular Students ─── */}
                    {activeTab === 'regular' && (
                        <div className="form-section-card" style={{ marginTop: '0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '38px', height: '38px', background: '#F0F9FF', color: '#0EA5E9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <UserPlus size={18} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>Regular Students</h3>
                                        <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>Existing batch students assigned to the exam. You can exclude them if needed.</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button
                                        type="button"
                                        onClick={handleRefresh}
                                        disabled={isRefreshing}
                                        title="Refresh List"
                                        style={{
                                            width: '34px',
                                            height: '34px',
                                            borderRadius: '8px',
                                            border: '1px solid #E2E8F0',
                                            background: '#FFFFFF',
                                            color: '#64748B',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: isRefreshing ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => { if (!isRefreshing) { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#7C3AED'; } }}
                                        onMouseLeave={(e) => { if (!isRefreshing) { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#64748B'; } }}
                                    >
                                        <RefreshCw 
                                            size={14} 
                                            style={{ 
                                                animation: isRefreshing ? 'spin 1s linear infinite' : 'none' 
                                            }} 
                                        />
                                    </button>
                                    <span style={{ background: '#E0F2FE', color: '#0369A1', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                                        {selectedRegulars.length} Assigned / {regularEnrolled.length} Total
                                    </span>
                                    {canManageStudents && (
                                        <button
                                            type="button"
                                            className="admin-btn-primary"
                                            onClick={() => {
                                                setTempSelectedRegulars(selectedRegulars.length > 0 ? selectedRegulars : regularEnrolled.map(s => s.id));
                                                setModalSearchQuery('');
                                                setActiveModal('regular');
                                            }}
                                            style={{ padding: '6px 14px', fontSize: '12px', height: '34px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                        >
                                            <Plus size={14} /> Assign
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Search Input for Regulars */}
                            <div style={{ position: 'relative', marginBottom: '16px' }}>
                                <input
                                    type="text"
                                    placeholder="Search regular students by name or ID..."
                                    className="admin-input"
                                    value={regularSearchQuery}
                                    onChange={(e) => setRegularSearchQuery(e.target.value)}
                                    style={{ paddingLeft: '40px', background: '#F8FAFC' }}
                                />
                                <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                            </div>

                            {/* Regular Students Table */}
                            {displayedRegulars.length > 0 ? (
                                <div style={{ overflowX: 'auto', maxHeight: '350px' }}>
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Reg no</th>
                                                <th>Student Name</th>
                                                <th>Status</th>
                                                <th style={{ textAlign: 'center' }}>Verified</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {displayedRegulars.map(student => {
                                                const isSelected = selectedRegulars.includes(student.id);
                                                // Find student's exam application status
                                                const app = examApplications.find((a: any) =>
                                                    (a.user_id?.toString() === student.id || a.user?.id?.toString() === student.id)
                                                );
                                                const appStatus = app ? app.status : 'No Application';
                                                const appStatusLower = appStatus.toLowerCase();

                                                let badgeBg = '#F1F5F9';
                                                let badgeColor = '#64748B';
                                                if (appStatusLower === 'approved') {
                                                    badgeBg = '#ECFDF5';
                                                    badgeColor = '#059669';
                                                } else if (appStatusLower === 'pending') {
                                                    badgeBg = '#FEF3C7';
                                                    badgeColor = '#D97706';
                                                } else if (appStatusLower === 'rejected') {
                                                    badgeBg = '#FEF2F2';
                                                    badgeColor = '#EF4444';
                                                }

                                                const canAct = app && appStatusLower === 'pending' && (
                                                    (userRole === 'secretary' && getStageStatus(app, 'secretary') === 'pending') ||
                                                    (userRole === 'coordinator' && getStageStatus(app, 'secretary') === 'approved' && getStageStatus(app, 'coordinator') === 'pending') ||
                                                    (userRole === 'director' && getStageStatus(app, 'coordinator') === 'approved' && getStageStatus(app, 'director') === 'pending') ||
                                                    (userRole === 'super_admin')
                                                );

                                                return (
                                                    <tr key={student.id}>
                                                        <td style={{ fontWeight: 700, color: '#1E293B' }}>{student.studentNumber}</td>
                                                        <td style={{ color: '#475569' }}>{student.fullName}</td>
                                                        <td>
                                                            <span style={{
                                                                padding: '4px 10px',
                                                                borderRadius: '12px',
                                                                fontSize: '11px',
                                                                fontWeight: 700,
                                                                textTransform: 'uppercase',
                                                                background: badgeBg,
                                                                color: badgeColor,
                                                                letterSpacing: '0.02em'
                                                            }}>
                                                                {appStatus}
                                                            </span>
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            {renderVerificationStages(app)}
                                                        </td>
                                                        <td>
                                                            {!app ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const updatedRegulars = isSelected
                                                                            ? selectedRegulars.filter(id => id !== student.id)
                                                                            : [...selectedRegulars, student.id];
                                                                        saveRegulars(updatedRegulars);
                                                                    }}
                                                                    disabled={!canManageStudents}
                                                                    style={{
                                                                        padding: '6px 14px',
                                                                        fontSize: '14px',
                                                                        fontWeight: 700,
                                                                        borderRadius: '8px',
                                                                        cursor: canManageStudents ? 'pointer' : 'default',
                                                                        border: 'none',
                                                                        background: isSelected ? '#ECFDF5' : '#FEF2F2',
                                                                        color: isSelected ? '#059669' : '#EF4444',
                                                                        opacity: canManageStudents ? 1 : 0.6,
                                                                        letterSpacing: '0.02em',
                                                                        transition: 'all 0.15s ease',
                                                                        minWidth: '50px',
                                                                        textAlign: 'center'
                                                                    }}
                                                                >
                                                                    {isSelected ? '-' : '+'}
                                                                </button>
                                                            ) : (
                                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setSelectedAppDetails(app);
                                                                            setShowDetailsModal(true);
                                                                        }}
                                                                        title="View Details"
                                                                        style={{
                                                                            width: '32px',
                                                                            height: '32px',
                                                                            borderRadius: '8px',
                                                                            cursor: 'pointer',
                                                                            border: '1.5px solid #7C3AED',
                                                                            background: '#FFFFFF',
                                                                            color: '#7C3AED',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            transition: 'all 0.15s ease'
                                                                        }}
                                                                    >
                                                                        <Eye size={16} />
                                                                    </button>
                                                                    {canAct && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleApprove(app)}
                                                                            title="Approve"
                                                                            style={{
                                                                                width: '32px',
                                                                                height: '32px',
                                                                                borderRadius: '8px',
                                                                                cursor: 'pointer',
                                                                                border: 'none',
                                                                                background: '#D1FAE5',
                                                                                color: '#065F46',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                transition: 'all 0.15s ease'
                                                                            }}
                                                                        >
                                                                            <Check size={16} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center', padding: '24px 0', margin: 0 }}>
                                    No regular students found.
                                </p>
                            )}
                        </div>
                    )}

                    {/* ─── SECTION 2: Postponements ─── */}
                    {activeTab === 'postponements' && (
                        <div className="form-section-card" style={{ marginTop: '0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '38px', height: '38px', background: '#F5F3FF', color: '#8B5CF6', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Clock size={18} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>Postponement Students</h3>
                                        <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>Add approved postponement requests from the waitlist.</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button
                                        type="button"
                                        onClick={handleRefresh}
                                        disabled={isRefreshing}
                                        title="Refresh List"
                                        style={{
                                            width: '34px',
                                            height: '34px',
                                            borderRadius: '8px',
                                            border: '1px solid #E2E8F0',
                                            background: '#FFFFFF',
                                            color: '#64748B',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: isRefreshing ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => { if (!isRefreshing) { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#7C3AED'; } }}
                                        onMouseLeave={(e) => { if (!isRefreshing) { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#64748B'; } }}
                                    >
                                        <RefreshCw 
                                            size={14} 
                                            style={{ 
                                                animation: isRefreshing ? 'spin 1s linear infinite' : 'none' 
                                            }} 
                                        />
                                    </button>
                                    <span style={{ background: '#F3E8FF', color: '#6B21A8', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                                        {registeredPostponements.length} Selected
                                    </span>
                                    {canManageStudents && (
                                        <button
                                            type="button"
                                            className="admin-btn-primary"
                                            onClick={() => setActiveModal('postponements')}
                                            style={{ padding: '6px 14px', fontSize: '12px', height: '34px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                        >
                                            <Plus size={14} /> Add from Waitlist
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Postponements Table */}
                            {registeredPostponements.length > 0 ? (
                                <div style={{ overflowX: 'auto', maxHeight: '300px' }}>
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Student Reg no</th>
                                                <th>Student Name</th>
                                                <th>Original Batch</th>
                                                <th>Application ID</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {registeredPostponements.map(p => (
                                                <tr key={p.id}>
                                                    <td style={{ fontWeight: 700, color: '#1E293B' }}>{p.studentNumber}</td>
                                                    <td style={{ color: '#475569' }}>{p.studentName}</td>
                                                    <td>
                                                        <span style={{
                                                            padding: '4px 8px',
                                                            background: '#F1F5F9',
                                                            color: '#475569',
                                                            borderRadius: '6px',
                                                            fontSize: '12px',
                                                            fontWeight: 600
                                                        }}>
                                                            {p.batch || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {p.application_id && (
                                                            <span style={{
                                                                padding: '4px 8px',
                                                                background: '#F5F3FF',
                                                                color: '#6D28D9',
                                                                borderRadius: '6px',
                                                                fontSize: '11px',
                                                                fontWeight: 700
                                                            }}>
                                                                {p.application_id}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {canManageStudents ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedPostponements(selectedPostponements.filter(id => id !== p.id));
                                                                }}
                                                                style={{
                                                                    background: '#FEF2F2',
                                                                    border: 'none',
                                                                    color: '#EF4444',
                                                                    cursor: 'pointer',
                                                                    padding: '6px 14px',
                                                                    borderRadius: '8px',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px',
                                                                    fontSize: '11px',
                                                                    fontWeight: 700,
                                                                    transition: 'all 0.15s ease',
                                                                    textTransform: 'uppercase'
                                                                }}
                                                                onMouseEnter={(e) => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.color = '#FFFFFF'; }}
                                                                onMouseLeave={(e) => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#EF4444'; }}
                                                                title="Remove Student"
                                                            >
                                                                <Trash2 size={13} /> Remove
                                                            </button>
                                                        ) : (
                                                            <span style={{ color: '#94A3B8', fontSize: '12px' }}>ReadOnly</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div style={{ border: '1px dashed #E2E8F0', borderRadius: '12px', padding: '32px', textAlign: 'center', background: '#F8FAFC' }}>
                                    <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>No postponements assigned. Click "Add from Waitlist" to assign students.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─── SECTION 3: Reattempts ─── */}
                    {activeTab === 'reattempts' && (
                        <div className="form-section-card" style={{ marginTop: '0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '38px', height: '38px', background: '#FFF7ED', color: '#F97316', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <History size={18} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>Reattempt Students</h3>
                                        <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>Add approved reattempt requests from the waitlist.</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button
                                        type="button"
                                        onClick={handleRefresh}
                                        disabled={isRefreshing}
                                        title="Refresh List"
                                        style={{
                                            width: '34px',
                                            height: '34px',
                                            borderRadius: '8px',
                                            border: '1px solid #E2E8F0',
                                            background: '#FFFFFF',
                                            color: '#64748B',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: isRefreshing ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => { if (!isRefreshing) { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#7C3AED'; } }}
                                        onMouseLeave={(e) => { if (!isRefreshing) { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#64748B'; } }}
                                    >
                                        <RefreshCw 
                                            size={14} 
                                            style={{ 
                                                animation: isRefreshing ? 'spin 1s linear infinite' : 'none' 
                                            }} 
                                        />
                                    </button>
                                    <span style={{ background: '#FFE4E6', color: '#9F1239', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                                        {registeredReattempts.length} Selected
                                    </span>
                                    {canManageStudents && (
                                        <button
                                            type="button"
                                            className="admin-btn-primary"
                                            onClick={() => setActiveModal('reattempts')}
                                            style={{ padding: '6px 14px', fontSize: '12px', height: '34px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                        >
                                            <Plus size={14} /> Add from Waitlist
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Reattempts Table */}
                            {registeredReattempts.length > 0 ? (
                                <div style={{ overflowX: 'auto', maxHeight: '300px' }}>
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Student Reg no</th>
                                                <th>Student Name</th>
                                                <th>Original Batch</th>
                                                <th>Application ID</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {registeredReattempts.map(r => (
                                                <tr key={r.id}>
                                                    <td style={{ fontWeight: 700, color: '#1E293B' }}>{r.studentNumber}</td>
                                                    <td style={{ color: '#475569' }}>{r.studentName}</td>
                                                    <td>
                                                        <span style={{
                                                            padding: '4px 8px',
                                                            background: '#F1F5F9',
                                                            color: '#475569',
                                                            borderRadius: '6px',
                                                            fontSize: '12px',
                                                            fontWeight: 600
                                                        }}>
                                                            {r.batch || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {r.application_id && (
                                                            <span style={{
                                                                padding: '4px 8px',
                                                                background: '#FFF7ED',
                                                                color: '#C2410C',
                                                                borderRadius: '6px',
                                                                fontSize: '11px',
                                                                fontWeight: 700
                                                            }}>
                                                                {r.application_id}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {canManageStudents ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedReattempts(selectedReattempts.filter(id => id !== r.id));
                                                                }}
                                                                style={{
                                                                    background: '#FEF2F2',
                                                                    border: 'none',
                                                                    color: '#EF4444',
                                                                    cursor: 'pointer',
                                                                    padding: '6px 14px',
                                                                    borderRadius: '8px',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px',
                                                                    fontSize: '11px',
                                                                    fontWeight: 700,
                                                                    transition: 'all 0.15s ease',
                                                                    textTransform: 'uppercase'
                                                                }}
                                                                onMouseEnter={(e) => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.color = '#FFFFFF'; }}
                                                                onMouseLeave={(e) => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#EF4444'; }}
                                                                title="Remove Student"
                                                            >
                                                                <Trash2 size={13} /> Remove
                                                            </button>
                                                        ) : (
                                                            <span style={{ color: '#94A3B8', fontSize: '12px' }}>ReadOnly</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div style={{ border: '1px dashed #E2E8F0', borderRadius: '12px', padding: '32px', textAlign: 'center', background: '#F8FAFC' }}>
                                    <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>No reattempts assigned. Click "Add from Waitlist" to assign students.</p>
                                </div>
                            )}
                        </div>
                    )}


                </div>
            </div>

            {/* ─── Postponement Modal ─── */}
            {activeModal === 'postponements' && (
                <div className="student-list-overlay" onClick={() => setActiveModal(null)}>
                    <div className="student-list-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 24px 16px 24px', borderBottom: '1px solid #F1F5F9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Clock size={20} style={{ color: '#8B5CF6' }} />
                                <h3 style={{ margin: 0, fontSize: '20px', color: '#0F172A' }}>Postponement Waitlist</h3>
                            </div>
                            <button
                                className="modal-close-btn"
                                onClick={() => setActiveModal(null)}
                                style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B', flexShrink: 0, padding: 0, margin: 0, boxShadow: 'none' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#EF4444'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#64748B'; }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '20px 24px' }}>

                            <div style={{ display: 'grid', gap: '10px' }}>
                                {eligiblePostponements.length > 0
                                    ? eligiblePostponements.map(pp => {
                                        const isChecked = selectedPostponements.includes(pp.id);
                                        return (
                                            <div
                                                key={pp.id}
                                                style={{
                                                    background: '#F8FAFC',
                                                    padding: '12px 16px',
                                                    borderRadius: '12px',
                                                    border: '1px solid #E2E8F0',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between'
                                                }}
                                            >
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 600, color: '#1E293B', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                        <span>{pp.studentNumber}{pp.batch ? ` , ${pp.batch}` : ''}</span>
                                                        {pp.application_id && <span style={{ padding: '2px 6px', background: '#F5F3FF', color: '#6D28D9', borderRadius: '4px', fontSize: '9px', fontWeight: 700 }}>{pp.application_id}</span>}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>{pp.studentName}</div>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#7C3AED' }}
                                                    checked={isChecked}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedPostponements([...selectedPostponements, pp.id]);
                                                        } else {
                                                            setSelectedPostponements(selectedPostponements.filter(id => id !== pp.id));
                                                        }
                                                    }}
                                                />
                                            </div>
                                        );
                                    })
                                    : <p style={{ textAlign: 'center', color: '#94A3B8', padding: '10px 0', margin: 0, fontSize: '13px' }}>No approved postponement requests found.</p>
                                }
                            </div>
                        </div>

                        <div className="modal-footer" style={{ padding: '16px 24px', background: '#F8FAFC', borderTop: '1px solid #F1F5F9', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="admin-btn-primary" onClick={() => setActiveModal(null)} style={{ padding: '8px 24px' }}>Done</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Reattempt Modal ─── */}
            {activeModal === 'reattempts' && (
                <div className="student-list-overlay" onClick={() => setActiveModal(null)}>
                    <div className="student-list-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 24px 16px 24px', borderBottom: '1px solid #F1F5F9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <History size={20} style={{ color: '#F97316' }} />
                                <h3 style={{ margin: 0, fontSize: '20px', color: '#0F172A' }}>Reattempt Waitlist</h3>
                            </div>
                            <button
                                className="modal-close-btn"
                                onClick={() => setActiveModal(null)}
                                style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B', flexShrink: 0, padding: 0, margin: 0, boxShadow: 'none' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#EF4444'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#64748B'; }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '20px 24px' }}>

                            <div style={{ display: 'grid', gap: '10px' }}>
                                {eligibleReattempts.length > 0
                                    ? eligibleReattempts.map(ra => {
                                        const isChecked = selectedReattempts.includes(ra.id);
                                        return (
                                            <div
                                                key={ra.id}
                                                style={{
                                                    background: '#F8FAFC',
                                                    padding: '12px 16px',
                                                    borderRadius: '12px',
                                                    border: '1px solid #E2E8F0',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between'
                                                }}
                                            >
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 600, color: '#1E293B', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                        <span>{ra.studentNumber}{ra.batch ? ` , ${ra.batch}` : ''}</span>
                                                        {ra.application_id && <span style={{ padding: '2px 6px', background: '#FFF7ED', color: '#C2410C', borderRadius: '4px', fontSize: '9px', fontWeight: 700 }}>{ra.application_id}</span>}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>{ra.studentName}</div>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#F97316' }}
                                                    checked={isChecked}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedReattempts([...selectedReattempts, ra.id]);
                                                        } else {
                                                            setSelectedReattempts(selectedReattempts.filter(id => id !== ra.id));
                                                        }
                                                    }}
                                                />
                                            </div>
                                        );
                                    })
                                    : <p style={{ textAlign: 'center', color: '#94A3B8', padding: '10px 0', margin: 0, fontSize: '13px' }}>No approved reattempt requests found.</p>
                                }
                            </div>
                        </div>

                        <div className="modal-footer" style={{ padding: '16px 24px', background: '#F8FAFC', borderTop: '1px solid #F1F5F9', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="admin-btn-primary" onClick={() => setActiveModal(null)} style={{ padding: '8px 24px' }}>Done</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Regular Student Assignment Modal ─── */}
            {activeModal === 'regular' && (
                <div className="student-list-overlay" onClick={() => {
                    setModalSearchQuery('');
                    setActiveModal(null);
                }}>
                    <div className="student-list-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 24px 16px 24px', borderBottom: '1px solid #F1F5F9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <UserPlus size={20} style={{ color: '#0EA5E9' }} />
                                <h3 style={{ margin: 0, fontSize: '20px', color: '#0F172A' }}>Assign Regular Students</h3>
                            </div>
                            <button
                                className="modal-close-btn"
                                onClick={() => {
                                    setModalSearchQuery('');
                                    setActiveModal(null);
                                }}
                                style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B', flexShrink: 0, padding: 0, margin: 0, boxShadow: 'none' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#EF4444'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#64748B'; }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '20px 24px' }}>
                            {/* Search bar inside modal */}
                            <div style={{ position: 'relative', marginBottom: '16px' }}>
                                <input
                                    type="text"
                                    placeholder="Search student by name or ID..."
                                    className="admin-input"
                                    value={modalSearchQuery}
                                    onChange={(e) => setModalSearchQuery(e.target.value)}
                                    style={{ paddingLeft: '40px', paddingRight: '40px', background: '#F8FAFC', width: '100%', boxSizing: 'border-box' }}
                                />
                                <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                                {modalSearchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setModalSearchQuery('')}
                                        style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
                                    {tempSelectedRegulars.length} of {regularEnrolled.length} Selected
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (modalSearchQuery) {
                                            const filteredIds = filteredModalRegulars.map(s => s.id);
                                            const allFilteredSelected = filteredIds.every(id => tempSelectedRegulars.includes(id));
                                            if (allFilteredSelected) {
                                                setTempSelectedRegulars(tempSelectedRegulars.filter(id => !filteredIds.includes(id)));
                                            } else {
                                                setTempSelectedRegulars([...new Set([...tempSelectedRegulars, ...filteredIds])]);
                                            }
                                        } else {
                                            if (tempSelectedRegulars.length === regularEnrolled.length) {
                                                setTempSelectedRegulars([]);
                                            } else {
                                                setTempSelectedRegulars(regularEnrolled.map(s => s.id));
                                            }
                                        }
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#7C3AED',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                    }}
                                >
                                    {modalSearchQuery
                                        ? (filteredModalRegulars.map(s => s.id).every(id => tempSelectedRegulars.includes(id)) ? 'Deselect Filtered' : 'Select Filtered')
                                        : (tempSelectedRegulars.length === regularEnrolled.length ? 'Deselect All' : 'Select All')
                                    }
                                </button>
                            </div>

                            <div style={{ display: 'grid', gap: '10px' }}>
                                {filteredModalRegulars.length > 0
                                    ? filteredModalRegulars.map(student => {
                                        const isChecked = tempSelectedRegulars.includes(student.id);
                                        return (
                                            <div
                                                key={student.id}
                                                style={{
                                                    background: '#F8FAFC',
                                                    padding: '12px 16px',
                                                    borderRadius: '12px',
                                                    border: '1px solid #E2E8F0',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between'
                                                }}
                                            >
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 600, color: '#1E293B', fontSize: '13px' }}>
                                                        {student.studentNumber}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                                                        {student.fullName}
                                                    </div>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#7C3AED' }}
                                                    checked={isChecked}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setTempSelectedRegulars([...tempSelectedRegulars, student.id]);
                                                        } else {
                                                            setTempSelectedRegulars(tempSelectedRegulars.filter(id => id !== student.id));
                                                        }
                                                    }}
                                                />
                                            </div>
                                        );
                                    })
                                    : <p style={{ textAlign: 'center', color: '#94A3B8', padding: '24px 0', margin: 0, fontSize: '13px' }}>No regular students found matching search.</p>
                                }
                            </div>
                        </div>

                        <div className="modal-footer" style={{ padding: '16px 24px', background: '#F8FAFC', borderTop: '1px solid #F1F5F9', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                className="admin-btn-primary"
                                onClick={() => {
                                    saveRegulars(tempSelectedRegulars);
                                    setModalSearchQuery('');
                                    setActiveModal(null);
                                }}
                                style={{ padding: '8px 24px' }}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <RejectionModal
                isOpen={showRejectModal}
                onClose={() => {
                    setShowRejectModal(false);
                    setPendingApp(null);
                }}
                onConfirm={() => {
                    if (pendingApp) {
                        handleReject(pendingApp, rejectionReason);
                        setShowRejectModal(false);
                        setPendingApp(null);
                    }
                }}
                reason={rejectionReason}
                setReason={setRejectionReason}
            />

            {/* ─── Application Details Modal ─── */}
            {showDetailsModal && selectedAppDetails && (() => {
                const app = selectedAppDetails;
                const secStatus = getStageStatus(app, 'secretary');
                const coorStatus = getStageStatus(app, 'coordinator');
                const dirStatus = getStageStatus(app, 'director');
                const appStatusLower = app.status?.toLowerCase() || 'pending';

                const canAct = appStatusLower === 'pending' && (
                    (userRole === 'secretary' && secStatus === 'pending') ||
                    (userRole === 'coordinator' && secStatus === 'approved' && coorStatus === 'pending') ||
                    (userRole === 'director' && coorStatus === 'approved' && dirStatus === 'pending') ||
                    (userRole === 'super_admin')
                );

                return (
                    <div className="student-list-overlay" style={{ zIndex: 2000 }} onClick={() => setShowDetailsModal(false)}>
                        <div className="student-list-modal" style={{ maxWidth: '650px' }} onClick={e => e.stopPropagation()}>
                            <div className="modal-header" style={{ borderBottom: '1px solid #F1F5F9', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '40px', height: '40px', background: '#F0F9FF', color: '#0369A1', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ClipboardList size={20} />
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Application Details</h2>
                                        <p style={{ color: '#64748B', fontSize: '13px', marginTop: '2px', margin: 0 }}>
                                            Ref ID: {app.id}
                                        </p>
                                    </div>
                                </div>
                                <button className="modal-close-btn" onClick={() => setShowDetailsModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B', padding: 0 }}><X size={20} /></button>
                            </div>

                            <div className="modal-body" style={{ padding: '24px', overflowY: 'auto', maxHeight: '60vh' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                                        <User size={16} style={{ color: '#7C3AED' }} />
                                        <span style={{ fontWeight: 700, color: '#1E293B', fontSize: '14px' }}>Personal Information</span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>Registration Number</span>
                                            <span style={{ color: '#1E293B', fontWeight: 700, fontSize: '14px' }}>{app.user?.student_number || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>NIC Number</span>
                                            <span style={{ color: '#1E293B', fontWeight: 700, fontSize: '14px' }}>{app.user?.nic || 'N/A'}</span>
                                        </div>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>Name with Initials</span>
                                            <span style={{ color: '#1E293B', fontWeight: 700, fontSize: '14px' }}>{app.name_with_initials || app.user?.full_name || 'N/A'}</span>
                                        </div>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>Name Denoted by Initials</span>
                                            <span style={{ color: '#1E293B', fontWeight: 700, fontSize: '14px' }}>{app.name_denoted_by_initials || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>Contact Number</span>
                                            <span style={{ color: '#1E293B', fontWeight: 700, fontSize: '14px' }}>{app.contact_number || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>Email Address</span>
                                            <span style={{ color: '#1E293B', fontWeight: 700, fontSize: '14px' }}>{app.user?.email || 'N/A'}</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px', marginTop: '16px' }}>
                                        <MapPin size={16} style={{ color: '#7C3AED' }} />
                                        <span style={{ fontWeight: 700, color: '#1E293B', fontSize: '14px' }}>Address Details</span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>Permanent Address</span>
                                            <span style={{ color: '#1E293B', fontWeight: 600, fontSize: '13px', whiteSpace: 'pre-line' }}>{app.permanent_address || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>Address During Exam Period</span>
                                            <span style={{ color: '#1E293B', fontWeight: 600, fontSize: '13px', whiteSpace: 'pre-line' }}>{app.address_during_exam || 'N/A'}</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px', marginTop: '16px' }}>
                                        <FileText size={16} style={{ color: '#7C3AED' }} />
                                        <span style={{ fontWeight: 700, color: '#1E293B', fontSize: '14px' }}>Application Details</span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>Examination</span>
                                            <span style={{ color: '#1E293B', fontWeight: 700, fontSize: '14px' }}>{app.exam_title || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>Semester</span>
                                            <span style={{ color: '#1E293B', fontWeight: 700, fontSize: '14px' }}>Semester {app.semester || '1'}</span>
                                        </div>
                                        <div>
                                            <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>Medium</span>
                                            <span style={{ color: '#1E293B', fontWeight: 700, fontSize: '14px' }}>{app.medium || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>Date of Registration</span>
                                            <span style={{ color: '#1E293B', fontWeight: 700, fontSize: '14px' }}>{app.registration_date || 'N/A'}</span>
                                        </div>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>Postponement Details</span>
                                            <span style={{ color: '#1E293B', fontWeight: 600, fontSize: '13px', whiteSpace: 'pre-line' }}>{app.postponement_details || 'No previous postponements'}</span>
                                        </div>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>Applied Subjects</span>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                                {app.subjects && app.subjects.length > 0 ? (
                                                    app.subjects.map((sub: any, idx: number) => (
                                                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 100px', fontSize: '13px', borderBottom: idx < app.subjects.length - 1 ? '1px solid #E2E8F0' : 'none', paddingBottom: idx < app.subjects.length - 1 ? '6px' : '0', paddingTop: idx > 0 ? '6px' : '0', alignItems: 'center' }}>
                                                            <span style={{ fontWeight: 700, color: '#475569' }}>{sub.code || 'N/A'}</span>
                                                            <span style={{ fontWeight: 600, color: '#1E293B' }}>{sub.name}</span>
                                                            <span style={{ color: '#0284C7', fontSize: '12px', fontWeight: 800, textAlign: 'right' }}>Attempt: {sub.attempt || 1}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span style={{ color: '#64748B', fontSize: '13px' }}>No subjects specified</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px', marginTop: '16px' }}>
                                        <CreditCard size={16} style={{ color: '#7C3AED' }} />
                                        <span style={{ fontWeight: 700, color: '#1E293B', fontSize: '14px' }}>Payment Details</span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>Fee Paid</span>
                                            <span style={{ color: '#1E293B', fontWeight: 700, fontSize: '14px' }}>{app.fee_paid ? `LKR ${parseFloat(app.fee_paid).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'LKR 0.00'}</span>
                                        </div>
                                        <div>
                                            <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>Payment Date</span>
                                            <span style={{ color: '#1E293B', fontWeight: 700, fontSize: '14px' }}>{app.payment_date || 'N/A'}</span>
                                        </div>
                                    </div>

                                    {app.rejection_reason && (
                                        <div style={{ background: '#FFF1F2', padding: '16px', borderRadius: '12px', border: '1px solid #FECDD3', marginTop: '16px' }}>
                                            <span style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#E11D48', textTransform: 'uppercase', marginBottom: '8px' }}>Rejection Remark</span>
                                            <div style={{ color: '#9F1239', fontSize: '14px', lineHeight: 1.5 }}>{app.rejection_reason}</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="modal-footer" style={{ padding: '16px 24px', background: '#F8FAFC', borderTop: '1px solid #F1F5F9', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <button
                                    className="admin-btn-primary"
                                    style={{ background: '#E11D48', padding: '8px 16px', borderRadius: '8px', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    onClick={() => handleDeleteApplication(app.id)}
                                >
                                    <Trash2 size={16} /> Delete Application
                                </button>

                                {canAct && (
                                    <>
                                        <button
                                            className="admin-btn-primary"
                                            style={{ background: '#E11D48', padding: '8px 16px', borderRadius: '8px', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                                            onClick={() => {
                                                setPendingApp(app);
                                                setRejectionReason('');
                                                setShowRejectModal(true);
                                                setShowDetailsModal(false);
                                            }}
                                        >
                                            Reject
                                        </button>
                                        <button
                                            className="admin-btn-primary"
                                            style={{ background: '#10B981', padding: '8px 16px', borderRadius: '8px', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                                            onClick={async () => {
                                                await handleApprove(app);
                                                setShowDetailsModal(false);
                                            }}
                                        >
                                            Approve
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

            <style>{`
                .student-list-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(15, 23, 42, 0.4);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    animation: fadeIn 0.25s ease-out;
                }
                .student-list-modal {
                    background: #FFFFFF;
                    width: 100%;
                    max-width: 600px;
                    border-radius: 24px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    overflow: hidden;
                    animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </>
    );
};

const RejectionModal: React.FC<{ isOpen: boolean, onClose: () => void, onConfirm: () => void, reason: string, setReason: (v: string) => void }> = ({ isOpen, onClose, onConfirm, reason, setReason }) => {
    if (!isOpen) return null;
    return (
        <div className="student-list-overlay" style={{ zIndex: 3000 }}>
            <div className="student-list-modal" style={{ maxWidth: '450px' }}>
                <div className="modal-header" style={{ borderBottom: '1px solid #F1F5F9', padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '40px', height: '40px', background: '#FFF1F2', color: '#E11D48', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <XCircle size={20} />
                        </div>
                        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Reject Request</h2>
                    </div>
                </div>
                <div className="modal-body" style={{ padding: '24px' }}>
                    <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '20px', margin: 0 }}>Please provide a reason for rejecting this request. This will be visible to the applicant.</p>
                    <div style={{ marginTop: '16px' }}>
                        <label style={{ color: '#475569', fontWeight: 600, marginBottom: '8px', display: 'block', fontSize: '14px' }}>Rejection Reason</label>
                        <textarea
                            placeholder="e.g. Incomplete payment, prerequisite not met..."
                            rows={4}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                resize: 'vertical',
                                minHeight: '100px',
                                padding: '12px',
                                border: '1px solid #E2E8F0',
                                borderRadius: '8px',
                                fontSize: '14px',
                                outline: 'none'
                            }}
                        ></textarea>
                    </div>
                </div>
                <div className="modal-footer" style={{ padding: '16px 24px', background: '#F8FAFC', borderTop: '1px solid #F1F5F9', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button className="admin-btn-outline" onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', background: 'white' }}>Cancel</button>
                    <button className="admin-btn-primary" style={{ background: '#E11D48', padding: '8px 20px', borderRadius: '8px', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }} onClick={onConfirm} disabled={!reason.trim()}>Confirm Rejection</button>
                </div>
            </div>
        </div>
    );
};

export default ManageExamStudents;
