import React, { useState, useEffect } from 'react';
import {
    BookOpen, Search, Plus, Users as UsersIcon,
    X, Calendar, Award,
    ArrowUpRight, UserCheck, FileText, CheckCircle2, Layers,
    ArrowLeft, Eye, Check, XCircle, Edit3, Save, User, ShieldCheck, Clock, Trash2,
    MapPin, CheckSquare
} from 'lucide-react';
import { mockAdminCourses } from '../../data/mockAdminData';
import type {
    AdminCourse, CourseApplication,
    ExamApplicationAdmin, PostponementRequestAdmin, ReattemptRequestAdmin
} from '../../data/mockAdminData';
import { toast } from '../../utils/toast';
import { courseApplicationService, examApplicationService } from '../../services/apiService';
import { VerificationStages } from '../common/VerificationStages';
import './CourseManagement.css';
import './ApplicationApprovals.css';

export const Applications: React.FC = () => {
    const [viewMode, setViewMode] = useState<'list' | 'enrollments' | 'approvals'>('list');
    const [selectedCourse, setSelectedCourse] = useState<AdminCourse | null>(null);
    const [selectedApplication, setSelectedApplication] = useState<any | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const currentAdminRole = sessionStorage.getItem('adminRole');

    // Filter states
    const [typeFilter, setTypeFilter] = useState<'all' | 'new' | 'existing'>('all');
    const [applicantSearchTerm, setApplicantSearchTerm] = useState('');

    // Form state for editing
    const [editForm, setEditForm] = useState<any>({});

    const [searchTerm, setSearchTerm] = useState('');
    const [levelFilter, setLevelFilter] = useState<string>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Local state for applications to allow functional updates
    const [enrollmentApps, setEnrollmentApps] = useState<CourseApplication[]>([]);
    const [realEnrollmentApps, setRealEnrollmentApps] = useState<any[]>([]);
    const [isLoadingApps, setIsLoadingApps] = useState(true);

    const fetchRealExamApplications = async () => {
        try {
            const data = await examApplicationService.getAll();
            const mapped = data.map((app: any) => {
                const currentStep = app.current_step || 1;
                const rawStages = app.stages || [];
                const defaultStages = [
                    {
                        level: 1 as const,
                        role: 'Secretary',
                        status: app.status === 'rejected' && currentStep === 1 ? 'rejected' as const : (currentStep > 1 ? 'approved' as const : 'pending' as const),
                        approvedBy: rawStages[0]?.approvedBy || rawStages[0]?.approved_by || null,
                        approvedAt: rawStages[0]?.approvedAt || rawStages[0]?.approved_at || null,
                        comment: rawStages[0]?.comment || null
                    },
                    {
                        level: 2 as const,
                        role: 'Coordinator',
                        status: app.status === 'rejected' && currentStep === 2 ? 'rejected' as const : (currentStep > 2 ? 'approved' as const : 'pending' as const),
                        approvedBy: rawStages[1]?.approvedBy || rawStages[1]?.approved_by || null,
                        approvedAt: rawStages[1]?.approvedAt || rawStages[1]?.approved_at || null,
                        comment: rawStages[1]?.comment || null
                    },
                    {
                        level: 3 as const,
                        role: 'Director',
                        status: app.status === 'rejected' && currentStep === 3 ? 'rejected' as const : (app.status === 'approved' ? 'approved' : 'pending' as const),
                        approvedBy: rawStages[2]?.approvedBy || rawStages[2]?.approved_by || null,
                        approvedAt: rawStages[2]?.approvedAt || rawStages[2]?.approved_at || null,
                        comment: rawStages[2]?.comment || null
                    }
                ];

                return {
                    id: app.id.toString(),
                    studentName: app.user?.full_name || 'Unknown Student',
                    studentNumber: app.user?.student_number || 'N/A',
                    course: app.course?.title || 'Unknown Course',
                    examTitle: app.exam_title || 'N/A',
                    semester: app.semester ? `Semester ${app.semester}` : 'N/A',
                    applicationDate: app.created_at ? app.created_at.split('T')[0] : '',
                    status: app.status || 'pending',
                    approvalStages: defaultStages,
                    currentStep: currentStep,
                    phone: app.contact_number || app.user?.phone || 'N/A',
                    feePaid: app.fee_paid || 0,
                    paymentDate: app.payment_date ? app.payment_date.split('T')[0] : 'N/A',
                    subjects: app.subjects || [],
                    rejectionReason: app.rejection_reason || '',
                    isReal: true,
                    statusPrefix: app.salutation || '',
                    nameWithInitials: app.name_with_initials || '',
                    nameDenotedByInitials: app.name_denoted_by_initials || '',
                    permanentAddress: app.permanent_address || '',
                    examPeriodAddress: app.address_during_exam || '',
                    medium: app.medium || '',
                    registrationDate: app.registration_date ? app.registration_date.split('T')[0] : '',
                    previousPostponements: app.postponement_details || '',
                    isExamApplication: true
                };
            });
            setExamApps(mapped);
        } catch (err) {
            console.error('Failed to fetch real exam applications:', err);
        }
    };

    const fetchRealApplications = async () => {
        try {
            setIsLoadingApps(true);
            const data = await courseApplicationService.getAll();
            const mapped = data.map((app: any) => ({
                id: app.id.toString(),
                courseTitle: app.course?.title || 'Unknown Course',
                applicantName: app.applicant_name,
                displayName: app.display_name,
                applicantEmail: app.applicant_email,
                applicantNic: app.applicant_nic,
                phone: app.phone,
                whatsapp: app.whatsapp,
                homePhone: app.home_phone,
                guardianPhone: app.guardian_phone,
                district: app.district,
                dob: app.dob ? app.dob.split('T')[0] : '',
                sex: app.sex,
                civilStatus: app.civil_status,
                address: app.address,
                employmentTitle: app.employment_title,
                officialAddress: app.official_address,
                olSubjects: app.ol_subjects || [],
                olYear: app.ol_year,
                olIndex: app.ol_index,
                alSubjects: app.al_subjects || [],
                alYear: app.al_year,
                alIndex: app.al_index,
                otherQualifications: app.other_qualifications,
                isNewApplicant: app.is_new_applicant,
                isReal: true,
                studentNumber: app.user?.student_number || app.generated_student_number || '',
                documents: app.documents || {},
                documentsVerified: app.documents_verified || { personal: false, educational: false },
                status: app.status,
                applicationDate: app.created_at ? app.created_at.split('T')[0] : '',
                approvalStages: [
                    {
                        level: 1 as const,
                        role: 'Secretary',
                        status: app.approved_by_secretary ? 'approved' as const : (app.status === 'rejected' && app.approval_level === 0 ? 'rejected' as const : 'pending' as const),
                        approvedBy: app.secretary_approver?.full_name,
                        approvedAt: app.secretary_approved_at ? app.secretary_approved_at.split('T')[0] : null,
                        comment: app.secretary_comment
                    },
                    {
                        level: 2 as const,
                        role: 'Coordinator',
                        status: app.approved_by_coordinator ? 'approved' as const : (app.status === 'rejected' && app.approval_level === 1 ? 'rejected' as const : 'pending' as const),
                        approvedBy: app.coordinator_approver?.full_name,
                        approvedAt: app.coordinator_approved_at ? app.coordinator_approved_at.split('T')[0] : null,
                        comment: app.coordinator_comment
                    },
                    {
                        level: 3 as const,
                        role: 'Director',
                        status: app.approved_by_director ? 'approved' as const : (app.status === 'rejected' && app.approval_level === 2 ? 'rejected' as const : 'pending' as const),
                        approvedBy: app.director_approver?.full_name,
                        approvedAt: app.director_approved_at ? app.director_approved_at.split('T')[0] : null,
                        comment: app.director_comment
                    }
                ]
            }));
            setRealEnrollmentApps(mapped);
            await fetchRealExamApplications();
        } catch (err) {
            console.error('Failed to fetch real applications:', err);
        } finally {
            setIsLoadingApps(false);
        }
    };

    useEffect(() => {
        fetchRealApplications();
    }, []);

    const allEnrollmentApps = realEnrollmentApps;

    const [examApps, setExamApps] = useState<ExamApplicationAdmin[]>([]);
    const [postponementReqs, setPostponementReqs] = useState<PostponementRequestAdmin[]>([]);
    const [reattemptReqs, setReattemptReqs] = useState<ReattemptRequestAdmin[]>([]);

    // Rejection Modal State
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [pendingAction, setPendingAction] = useState<{ id: string, type: string } | null>(null);

    const handleAction = async (id: string, action: 'approved' | 'rejected', type: string, reason?: string) => {
        // Check if it's a real application
        const isReal = realEnrollmentApps.some(app => app.id === id);

        if (type === 'exam') {
            const app = examApps.find(a => a.id === id);
            if (app && app.isReal) {
                try {
                    const userStr = sessionStorage.getItem('user');
                    const loggedInUser = userStr ? JSON.parse(userStr) : null;
                    const approvedBy = loggedInUser?.full_name || loggedInUser?.displayName || 'Admin';
                    const approvedAt = new Date().toLocaleDateString();

                    const currentStep = app.currentStep || 1;
                    const stages = [...app.approvalStages];
                    const stageIndex = currentStep - 1;

                    if (stages[stageIndex]) {
                        stages[stageIndex] = {
                            ...stages[stageIndex],
                            status: action,
                            approvedBy: action === 'approved' ? approvedBy : undefined,
                            approvedAt: action === 'approved' ? approvedAt : undefined,
                            comment: reason || (action === 'approved' ? 'Approved' : 'Rejected')
                        };
                    }

                    let nextStep = currentStep;
                    let status = 'pending';

                    if (action === 'approved') {
                        nextStep = currentStep + 1;
                        if (nextStep > 3) {
                            status = 'approved';
                        } else {
                            status = 'pending';
                        }
                    } else {
                        status = 'rejected';
                    }

                    await examApplicationService.update(id, {
                        status: status,
                        stages: stages,
                        current_step: nextStep,
                        rejection_reason: action === 'rejected' ? (reason || 'Rejected') : null
                    });

                    toast.success(`Exam application ${action} successfully!`);
                    await fetchRealApplications();
                    setSelectedApplication(null);
                    return;
                } catch (err: any) {
                    console.error('Failed to update exam application:', err);
                    toast.error(err.response?.data?.message || 'Failed to update exam application.');
                    return;
                }
            }
        }

        if (isReal && type === 'enrollment') {
            try {
                if (action === 'approved') {
                    const app = realEnrollmentApps.find(a => a.id === id);
                    const docsVerified = app?.documentsVerified || { personal: false, educational: false };

                    if (!docsVerified.personal || !docsVerified.educational) {
                        toast.error("Please verify all handed over documents by ticking them in the details modal before approving.");
                        return;
                    }

                    const response = await courseApplicationService.approve(id, {
                        comment: reason || 'Approved',
                        documents_verified: docsVerified
                    });

                    // If application fully approved, the backend automatically enrolls the student
                    // No need to manually update localStorage

                    toast.success('Application approved successfully!');
                } else {
                    await courseApplicationService.reject(id, {
                        comment: reason || 'Rejected'
                    });
                    toast.success('Application rejected successfully!');
                }
                fetchRealApplications();
                setSelectedApplication(null);
                return;
            } catch (err: any) {
                console.error('Failed to update application:', err);
                toast.error(err.response?.data?.message || 'Failed to update application.');
                return;
            }
        }

        const updateStatus = (list: any[]) => list.map(app => {
            if (app.id === id) {
                return {
                    ...app,
                    status: action,
                    rejectionReason: reason || app.rejectionReason,
                    approvalStages: app.approvalStages.map((stage: any, i: number) =>
                        i === 0 ? { ...stage, status: action, approvedAt: new Date().toLocaleDateString(), comment: reason } : stage
                    )
                };
            }
            return app;
        });

        if (type === 'enrollment') {
            if (action === 'approved') {
                const app = enrollmentApps.find(a => a.id === id);
                const docsVerified = app?.documentsVerified || { personal: false, educational: false };
                if (!docsVerified.personal || !docsVerified.educational) {
                    toast.error("Please verify all handed over documents by ticking them in the details modal before approving.");
                    return;
                }
            }
            setEnrollmentApps(updateStatus);
        }
        else if (type === 'exam') setExamApps(updateStatus);
        else if (type === 'postponement') setPostponementReqs(updateStatus);
        else if (type === 'reattempt') setReattemptReqs(updateStatus);

        if (selectedApplication && selectedApplication.id === id) {
            setSelectedApplication((prev: any) => ({
                ...prev,
                status: action,
                rejectionReason: reason || prev.rejectionReason,
                approvalStages: prev.approvalStages.map((stage: any, i: number) =>
                    i === 0 ? { ...stage, status: action, approvedAt: new Date().toLocaleDateString(), comment: reason } : stage
                )
            }));
        }
    };

    const handleRejectClick = (id: string, type: string) => {
        setPendingAction({ id, type });
        setRejectionReason('');
        setShowRejectModal(true);
    };

    const handleRejectConfirm = () => {
        if (pendingAction) {
            handleAction(pendingAction.id, 'rejected', pendingAction.type, rejectionReason);
            setShowRejectModal(false);
            setPendingAction(null);
        }
    };

    const handleDeleteApplication = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this application request completely? This action cannot be undone.")) {
            return;
        }

        const isReal = realEnrollmentApps.some(app => app.id === id);
        if (isReal) {
            try {
                await courseApplicationService.delete(id);
                toast.success("Application deleted successfully!");
                fetchRealApplications();
                setSelectedApplication(null);
            } catch (err: any) {
                console.error("Failed to delete application:", err);
                toast.error(err.response?.data?.message || "Failed to delete application.");
            }
        } else {
            setEnrollmentApps(prev => prev.filter(app => app.id !== id));
            setExamApps(prev => prev.filter(app => app.id !== id));
            setPostponementReqs(prev => prev.filter(app => app.id !== id));
            setReattemptReqs(prev => prev.filter(app => app.id !== id));
            toast.success("Application deleted successfully!");
            setSelectedApplication(null);
        }
    };

    const filteredCourses = mockAdminCourses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLevel = levelFilter === 'all' || course.level === levelFilter;
        return matchesSearch && matchesLevel;
    });

    const getIntakeColor = (status: string) => {
        switch (status) {
            case 'Open': return { bg: '#D1FAE5', text: '#059669' };
            case 'Closing Soon': return { bg: '#FEF3C7', text: '#D97706' };
            case 'Closed': return { bg: '#FEE2E2', text: '#DC2626' };
            default: return { bg: '#F1F5F9', text: '#475569' };
        }
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'Degree': return { bg: '#EDE9FE', text: '#7C3AED' };
            case 'Diploma': return { bg: '#DBEAFE', text: '#2563EB' };
            case 'Certificate': return { bg: '#CCFBF1', text: '#0D9488' };
            default: return { bg: '#F1F5F9', text: '#475569' };
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return { bg: '#D1FAE5', text: '#059669' };
            case 'rejected': return { bg: '#FEE2E2', text: '#DC2626' };
            case 'pending': return { bg: '#FEF3C7', text: '#D97706' };
            default: return { bg: '#F1F5F9', text: '#475569' };
        }
    };

    const handleViewEnrollments = (course: AdminCourse) => {
        setSelectedCourse(course);
        setViewMode('enrollments');
    };

    const handleViewApprovals = (course: AdminCourse) => {
        setSelectedCourse(course);
        setViewMode('approvals');
    };

    const handleViewDetails = (app: any) => {
        setSelectedApplication(app);
        setEditForm({ ...app });
        setIsEditMode(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditForm((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        setSelectedApplication(editForm);
        setRealEnrollmentApps(prev => prev.map(a => a.id === editForm.id ? editForm : a));
        setEnrollmentApps(prev => prev.map(a => a.id === editForm.id ? editForm : a));
        toast.success('Application updated successfully!');
        setIsEditMode(false);
    };

    const renderApplicationModal = () => {
        if (!selectedApplication) return null;

        // Determine request type
        const isEnrollment = 'applicantName' in selectedApplication;
        const displayName = isEnrollment ? (selectedApplication.displayName || selectedApplication.applicantName) : selectedApplication.studentName;
        const displayId = isEnrollment ? selectedApplication.applicantNic : selectedApplication.studentNumber;
        const displayEmail = isEnrollment ? selectedApplication.applicantEmail : (selectedApplication.studentNumber + '@example.com');

        return (
            <div className="approval-modal-overlay" onClick={() => setSelectedApplication(null)}>
                <div className="approval-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '850px' }}>
                    <div className="am-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div>
                                <h2>{isEnrollment ? 'Application Details' : 'Request Details'}</h2>
                                <p className="at-email">Ref: {selectedApplication.id}</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {isEnrollment && (!isEditMode ? (
                                <button className="at-action-btn view" onClick={() => setIsEditMode(true)} title="Edit Details">
                                    <Edit3 size={18} />
                                </button>
                            ) : (
                                <button className="at-action-btn approve" onClick={handleSave} title="Save Changes">
                                    <Save size={18} />
                                </button>
                            ))}
                            <button className="am-close" onClick={() => setSelectedApplication(null)}><X size={20} /></button>
                        </div>
                    </div>

                    <div className="am-body">
                        {isEnrollment && selectedApplication.isNewApplicant && (
                            <div className="am-new-user-alert">
                                <div className="am-alert-icon"><UserCheck size={20} /></div>
                                <div className="am-alert-text">
                                    <strong>New Applicant Verification</strong>
                                    <p>This applicant is new to the system. Please verify identity documents carefully before first-level approval.</p>
                                </div>
                            </div>
                        )}

                        {isEnrollment ? (
                            <>
                                <div className="am-section-divider">
                                    <h4><User size={16} /> Personal Information</h4>
                                </div>

                                <div className="am-details-grid">
                                    <div className="am-detail-item">
                                        <span className="am-label">Full Name</span>
                                        {isEditMode ? (
                                            <input type="text" name="applicantName" value={editForm.applicantName} onChange={handleInputChange} className="cm-modal-input" />
                                        ) : (
                                            <span className="am-value">{selectedApplication.applicantName}</span>
                                        )}
                                    </div>
                                    <div className="am-detail-item">
                                        <span className="am-label">Display Name</span>
                                        {isEditMode ? (
                                            <input type="text" name="displayName" value={editForm.displayName} onChange={handleInputChange} className="cm-modal-input" />
                                        ) : (
                                            <span className="am-value">{selectedApplication.displayName || 'N/A'}</span>
                                        )}
                                    </div>
                                    <div className="am-detail-item">
                                        <span className="am-label">NIC Number</span>
                                        {isEditMode ? (
                                            <input type="text" name="applicantNic" value={editForm.applicantNic} onChange={handleInputChange} className="cm-modal-input" />
                                        ) : (
                                            <span className="am-value">{selectedApplication.applicantNic}</span>
                                        )}
                                    </div>
                                    <div className="am-detail-item">
                                        <span className="am-label">Email Address</span>
                                        {isEditMode ? (
                                            <input type="email" name="applicantEmail" value={editForm.applicantEmail} onChange={handleInputChange} className="cm-modal-input" />
                                        ) : (
                                            <span className="am-value">{selectedApplication.applicantEmail}</span>
                                        )}
                                    </div>
                                    <div className="am-detail-item">
                                        <span className="am-label">Phone Number</span>
                                        {isEditMode ? (
                                            <input type="text" name="phone" value={editForm.phone} onChange={handleInputChange} className="cm-modal-input" />
                                        ) : (
                                            <span className="am-value">{selectedApplication.phone || 'N/A'}</span>
                                        )}
                                    </div>
                                    <div className="am-detail-item">
                                        <span className="am-label">WhatsApp Number</span>
                                        {isEditMode ? (
                                            <input type="text" name="whatsapp" value={editForm.whatsapp} onChange={handleInputChange} className="cm-modal-input" />
                                        ) : (
                                            <span className="am-value">{selectedApplication.whatsapp || 'N/A'}</span>
                                        )}
                                    </div>
                                    <div className="am-detail-item">
                                        <span className="am-label">Home Phone</span>
                                        {isEditMode ? (
                                            <input type="text" name="homePhone" value={editForm.homePhone || ''} onChange={handleInputChange} className="cm-modal-input" />
                                        ) : (
                                            <span className="am-value">{selectedApplication.homePhone || 'N/A'}</span>
                                        )}
                                    </div>
                                    <div className="am-detail-item">
                                        <span className="am-label">Guardian Phone</span>
                                        {isEditMode ? (
                                            <input type="text" name="guardianPhone" value={editForm.guardianPhone || ''} onChange={handleInputChange} className="cm-modal-input" />
                                        ) : (
                                            <span className="am-value">{selectedApplication.guardianPhone || 'N/A'}</span>
                                        )}
                                    </div>
                                    <div className="am-detail-item">
                                        <span className="am-label">Date of Birth</span>
                                        {isEditMode ? (
                                            <input type="date" name="dob" value={editForm.dob} onChange={handleInputChange} className="cm-modal-input" />
                                        ) : (
                                            <span className="am-value">{selectedApplication.dob || 'N/A'}</span>
                                        )}
                                    </div>
                                    <div className="am-detail-item">
                                        <span className="am-label">Sex / Gender</span>
                                        {isEditMode ? (
                                            <select name="sex" value={editForm.sex} onChange={handleInputChange} className="cm-modal-input">
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        ) : (
                                            <span className="am-value">{selectedApplication.sex || 'N/A'}</span>
                                        )}
                                    </div>
                                    <div className="am-detail-item">
                                        <span className="am-label">Civil Status</span>
                                        {isEditMode ? (
                                            <input type="text" name="civilStatus" value={editForm.civilStatus} onChange={handleInputChange} className="cm-modal-input" />
                                        ) : (
                                            <span className="am-value">{selectedApplication.civilStatus || 'N/A'}</span>
                                        )}
                                    </div>
                                    <div className="am-detail-item">
                                        <span className="am-label">District</span>
                                        {isEditMode ? (
                                            <input type="text" name="district" value={editForm.district} onChange={handleInputChange} className="cm-modal-input" />
                                        ) : (
                                            <span className="am-value">{selectedApplication.district || 'N/A'}</span>
                                        )}
                                    </div>
                                    <div className="am-detail-item full-width">
                                        <span className="am-label">Home Address</span>
                                        {isEditMode ? (
                                            <textarea name="address" value={editForm.address} onChange={handleInputChange} className="cm-modal-input" style={{ width: '100%', minHeight: '60px', padding: '8px' }} />
                                        ) : (
                                            <span className="am-value">{selectedApplication.address || 'N/A'}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="am-section-divider">
                                    <h4><FileText size={16} /> Employee Information</h4>
                                </div>

                                <div className="am-details-grid">
                                    <div className="am-detail-item">
                                        <span className="am-label">Employment Title / Designation</span>
                                        {isEditMode ? (
                                            <input type="text" name="employmentTitle" value={editForm.employmentTitle} onChange={handleInputChange} className="cm-modal-input" />
                                        ) : (
                                            <span className="am-value">{selectedApplication.employmentTitle || 'Not Employed'}</span>
                                        )}
                                    </div>
                                    <div className="am-detail-item">
                                        <span className="am-label">Official Address</span>
                                        {isEditMode ? (
                                            <input type="text" name="officialAddress" value={editForm.officialAddress} onChange={handleInputChange} className="cm-modal-input" />
                                        ) : (
                                            <span className="am-value">{selectedApplication.officialAddress || 'N/A'}</span>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : selectedApplication.isExamApplication ? (
                            <>
                                <div className="am-section-divider">
                                    <h4><User size={16} /> Student Information</h4>
                                </div>

                                <div className="am-details-grid">
                                    <div className="am-detail-item">
                                        <span className="am-label">Salutation / Title</span>
                                        <span className="am-value">{selectedApplication.statusPrefix || 'Mr.'}</span>
                                    </div>
                                    <div className="am-detail-item">
                                        <span className="am-label">Name with Initials</span>
                                        <span className="am-value">{selectedApplication.nameWithInitials || selectedApplication.studentName}</span>
                                    </div>
                                    <div className="am-detail-item full-width">
                                        <span className="am-label">Name Denoted by Initials</span>
                                        <span className="am-value">{selectedApplication.nameDenotedByInitials || 'N/A'}</span>
                                    </div>
                                    <div className="am-detail-item">
                                        <span className="am-label">Student Number</span>
                                        <span className="am-value">{displayId}</span>
                                    </div>
                                    <div className="am-detail-item">
                                        <span className="am-label">Email Address</span>
                                        <span className="am-value">{displayEmail}</span>
                                    </div>
                                    <div className="am-detail-item">
                                        <span className="am-label">Contact Number</span>
                                        <span className="am-value">{selectedApplication.phone || 'N/A'}</span>
                                    </div>
                                    <div className="am-detail-item">
                                        <span className="am-label">Registration Date</span>
                                        <span className="am-value">{selectedApplication.registrationDate || 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="am-section-divider">
                                    <h4><MapPin size={16} /> Address Details</h4>
                                </div>
                                <div className="am-details-grid">
                                    <div className="am-detail-item full-width">
                                        <span className="am-label">Permanent Address</span>
                                        <span className="am-value">{selectedApplication.permanentAddress || 'N/A'}</span>
                                    </div>
                                    <div className="am-detail-item full-width">
                                        <span className="am-label">Address During Examination</span>
                                        <span className="am-value">{selectedApplication.examPeriodAddress || 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="am-section-divider">
                                    <h4><FileText size={16} /> Examination Details & Payment</h4>
                                </div>
                                <div className="am-details-grid">
                                    <div className="am-detail-item">
                                        <span className="am-label">Exam Title</span>
                                        <span className="am-value" style={{ color: '#7C3AED', fontWeight: 600 }}>{selectedApplication.examTitle}</span>
                                    </div>
                                    <div className="am-detail-item">
                                        <span className="am-label">Semester</span>
                                        <span className="am-value">{selectedApplication.semester}</span>
                                    </div>
                                    <div className="am-detail-item">
                                        <span className="am-label">Medium</span>
                                        <span className="am-value">{selectedApplication.medium || 'N/A'}</span>
                                    </div>
                                    <div className="am-detail-item">
                                        <span className="am-label">Submission Date</span>
                                        <span className="am-value">{selectedApplication.applicationDate}</span>
                                    </div>
                                    <div className="am-detail-item">
                                        <span className="am-label">Fee Amount Paid</span>
                                        <span className="am-value" style={{ fontWeight: 600, color: '#059669' }}>LKR {selectedApplication.feePaid ? parseFloat(selectedApplication.feePaid.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</span>
                                    </div>
                                    <div className="am-detail-item">
                                        <span className="am-label">Date of Payment</span>
                                        <span className="am-value">{selectedApplication.paymentDate || 'N/A'}</span>
                                    </div>
                                    {selectedApplication.previousPostponements && (
                                        <div className="am-detail-item full-width">
                                            <span className="am-label">Previous Postponement Details</span>
                                            <span className="am-value">{selectedApplication.previousPostponements}</span>
                                        </div>
                                    )}
                                    {selectedApplication.rejectionReason && (
                                        <div className="am-detail-item full-width" style={{ background: '#FFF1F2', padding: '12px', borderRadius: '8px', border: '1px solid #FECDD3' }}>
                                            <span className="am-label" style={{ color: '#E11D48', fontWeight: 800 }}>REJECTION REMARK</span>
                                            <span className="am-value" style={{ color: '#9F1239' }}>{selectedApplication.rejectionReason}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="am-section-divider">
                                    <h4><CheckSquare size={16} /> Applied Subjects</h4>
                                </div>
                                <div className="am-qual-blocks" style={{ gridTemplateColumns: '1fr', marginTop: '12px' }}>
                                    <div className="am-qual-card">
                                        <table className="am-qual-table">
                                            <thead>
                                                <tr>
                                                    <th>Subject Code</th>
                                                    <th>Subject Name</th>
                                                    <th style={{ textAlign: 'center' }}>Attempt</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedApplication.subjects && selectedApplication.subjects.length > 0 ? (
                                                    selectedApplication.subjects.map((sub: any, i: number) => (
                                                        <tr key={i}>
                                                            <td style={{ fontWeight: 600, color: '#475569' }}>{sub.code}</td>
                                                            <td style={{ fontWeight: 600, color: '#1E293B' }}>{sub.name}</td>
                                                            <td style={{ textAlign: 'center' }}>
                                                                <span className="am-grade-sm" style={{ background: '#EDE9FE', color: '#7C3AED', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
                                                                    {sub.attempt === '1' ? '1st Attempt' :
                                                                        sub.attempt === '2' ? '2nd Attempt' :
                                                                            sub.attempt === '3' ? '3rd Attempt' :
                                                                                `${sub.attempt}th Attempt`}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={3} style={{ textAlign: 'center', color: '#94A3B8' }}>No subjects selected</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="am-section-divider">
                                    <h4><User size={16} /> Student Information</h4>
                                </div>

                                <div className="am-details-grid">
                                    <div className="am-detail-item">
                                        <span className="am-label">Full Name</span>
                                        <span className="am-value">{displayName}</span>
                                    </div>
                                    <div className="am-detail-item">
                                        <span className="am-label">Student Number</span>
                                        <span className="am-value">{displayId}</span>
                                    </div>
                                    <div className="am-detail-item">
                                        <span className="am-label">Email Address</span>
                                        <span className="am-value">{displayEmail}</span>
                                    </div>
                                    <div className="am-detail-item">
                                        <span className="am-label">Phone Number</span>
                                        <span className="am-value">{selectedApplication.phone || '0712345678'}</span>
                                    </div>
                                </div>

                                <div className="am-section-divider">
                                    <h4><FileText size={16} /> Request Specifics</h4>
                                </div>
                                <div className="am-details-grid">
                                    <div className="am-detail-item full-width">
                                        <span className="am-label">Request For</span>
                                        <span className="am-value" style={{ color: '#7C3AED', fontWeight: 600 }}>
                                            {selectedApplication.examTitle || selectedApplication.subject || 'Administrative Request'}
                                        </span>
                                    </div>
                                    {selectedApplication.reason && (
                                        <div className="am-detail-item full-width">
                                            <span className="am-label">Reason / Remark</span>
                                            <span className="am-value">{selectedApplication.reason}</span>
                                        </div>
                                    )}
                                    {selectedApplication.semester && (
                                        <div className="am-detail-item">
                                            <span className="am-label">Semester</span>
                                            <span className="am-value">{selectedApplication.semester}</span>
                                        </div>
                                    )}
                                    {selectedApplication.previousGrade && (
                                        <div className="am-detail-item">
                                            <span className="am-label">Previous Grade</span>
                                            <span className="am-value">{selectedApplication.previousGrade}</span>
                                        </div>
                                    )}
                                    <div className="am-detail-item">
                                        <span className="am-label">Submission Date</span>
                                        <span className="am-value">{selectedApplication.applicationDate || selectedApplication.requestDate}</span>
                                    </div>
                                    {selectedApplication.rejectionReason && (
                                        <div className="am-detail-item full-width" style={{ background: '#FFF1F2', padding: '12px', borderRadius: '8px', border: '1px solid #FECDD3' }}>
                                            <span className="am-label" style={{ color: '#E11D48', fontWeight: 800 }}>REJECTION REMARK</span>
                                            <span className="am-value" style={{ color: '#9F1239' }}>{selectedApplication.rejectionReason}</span>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {isEnrollment && (
                            <>
                                <div className="am-section-divider">
                                    <h4><Award size={16} /> Academic Qualifications</h4>
                                </div>

                                <div className="am-qual-blocks">
                                    <div className="am-qual-card">
                                        <div className="am-qual-header">
                                            <h5>G.C.E. O/L Results</h5>
                                            <span>Year: {selectedApplication.isReal ? (selectedApplication.olYear || 'N/A') : (selectedApplication.olYear || '2019')} • Index: {selectedApplication.isReal ? (selectedApplication.olIndex || 'N/A') : (selectedApplication.olIndex || '12345678')}</span>
                                        </div>
                                        <table className="am-qual-table">
                                            <thead>
                                                <tr>
                                                    <th>Subject</th>
                                                    <th style={{ textAlign: 'center' }}>Grade</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedApplication.isReal ? (
                                                    (selectedApplication.olSubjects && selectedApplication.olSubjects.length > 0) ? (
                                                        selectedApplication.olSubjects.map((sub: any, i: number) => (
                                                            <tr key={i}>
                                                                <td>{sub.subject}</td>
                                                                <td style={{ textAlign: 'center' }}><span className="am-grade-sm">{sub.grade}</span></td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={2} style={{ textAlign: 'center', color: '#94A3B8' }}>No O/L subjects recorded</td>
                                                        </tr>
                                                    )
                                                ) : (
                                                    (selectedApplication.olSubjects || [
                                                        { subject: 'Mathematics', grade: 'A' },
                                                        { subject: 'Science', grade: 'A' },
                                                        { subject: 'English', grade: 'A' },
                                                        { subject: 'Sinhala', grade: 'A' }
                                                    ]).map((sub: any, i: number) => (
                                                        <tr key={i}>
                                                            <td>{sub.subject}</td>
                                                            <td style={{ textAlign: 'center' }}><span className="am-grade-sm">{sub.grade}</span></td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="am-qual-card">
                                        <div className="am-qual-header">
                                            <h5>G.C.E. A/L Results</h5>
                                            <span>Year: {selectedApplication.isReal ? (selectedApplication.alYear || 'N/A') : (selectedApplication.alYear || '2022')} • Index: {selectedApplication.isReal ? (selectedApplication.alIndex || 'N/A') : (selectedApplication.alIndex || '9876543')}</span>
                                        </div>
                                        <table className="am-qual-table">
                                            <thead>
                                                <tr>
                                                    <th>Subject</th>
                                                    <th style={{ textAlign: 'center' }}>Grade</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedApplication.isReal ? (
                                                    (selectedApplication.alSubjects && selectedApplication.alSubjects.length > 0) ? (
                                                        selectedApplication.alSubjects.map((sub: any, i: number) => (
                                                            <tr key={i}>
                                                                <td>{sub.subject}</td>
                                                                <td style={{ textAlign: 'center' }}><span className="am-grade-sm">{sub.grade}</span></td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={2} style={{ textAlign: 'center', color: '#94A3B8' }}>No A/L subjects recorded</td>
                                                        </tr>
                                                    )
                                                ) : (
                                                    (selectedApplication.alSubjects || [
                                                        { subject: 'Combined Maths', grade: 'A' },
                                                        { subject: 'Physics', grade: 'B' },
                                                        { subject: 'Chemistry', grade: 'C' }
                                                    ]).map((sub: any, i: number) => (
                                                        <tr key={i}>
                                                            <td>{sub.subject}</td>
                                                            <td style={{ textAlign: 'center' }}><span className="am-grade-sm">{sub.grade}</span></td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {selectedApplication.otherQualifications && (
                                    <div style={{ marginTop: '16px', background: '#F8FAFC', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                        <h5 style={{ fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Other Qualifications</h5>
                                        <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>{selectedApplication.otherQualifications}</p>
                                    </div>
                                )}

                                <div className="am-section-divider">
                                    <h4><ShieldCheck size={16} /> Handed Over Documents Verification</h4>
                                </div>
                                <div className="am-verification-section" style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', background: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600, color: '#334155', cursor: 'pointer', userSelect: 'none' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedApplication.documentsVerified?.personal || false}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                const newDocs = {
                                                    ...(selectedApplication.documentsVerified || {}),
                                                    personal: checked
                                                };
                                                setSelectedApplication((prev: any) => ({
                                                    ...prev,
                                                    documentsVerified: newDocs
                                                }));
                                                setRealEnrollmentApps(prev => prev.map(a => a.id === selectedApplication.id ? { ...a, documentsVerified: newDocs } : a));
                                                setEnrollmentApps(prev => prev.map(a => a.id === selectedApplication.id ? { ...a, documentsVerified: newDocs } : a));
                                            }}
                                            disabled={selectedApplication.status !== 'pending'}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                        Personal Documents Handed Over (NIC, Birth Certificate)
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600, color: '#334155', cursor: 'pointer', userSelect: 'none' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedApplication.documentsVerified?.educational || false}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                const newDocs = {
                                                    ...(selectedApplication.documentsVerified || {}),
                                                    educational: checked
                                                };
                                                setSelectedApplication((prev: any) => ({
                                                    ...prev,
                                                    documentsVerified: newDocs
                                                }));
                                                setRealEnrollmentApps(prev => prev.map(a => a.id === selectedApplication.id ? { ...a, documentsVerified: newDocs } : a));
                                                setEnrollmentApps(prev => prev.map(a => a.id === selectedApplication.id ? { ...a, documentsVerified: newDocs } : a));
                                            }}
                                            disabled={selectedApplication.status !== 'pending'}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                        Educational Documents Handed Over (O/L, A/L Certificates)
                                    </label>
                                </div>
                            </>
                        )}

                        <div className="am-section-divider">
                            <h4><ShieldCheck size={16} /> Approval Stages</h4>
                        </div>

                        <div className="am-approval-flow">
                            <div className="am-flow-steps">
                                {selectedApplication.approvalStages.map((stage: any, idx: number) => (
                                    <div key={idx} className={`am-flow-step ${stage.status}`}>
                                        <div className="am-step-marker">
                                            {stage.status === 'approved' ? <Check size={10} /> :
                                                stage.status === 'rejected' ? <XCircle size={10} /> : <Clock size={10} />}
                                        </div>
                                        <div className="am-step-content">
                                            <div className="am-step-header">
                                                <span className="am-step-role">{stage.role}</span>
                                                <span className={`at-status-badge ${stage.status}`} style={{
                                                    background: stage.status === 'approved' ? '#D1FAE5' : stage.status === 'rejected' ? '#FEE2E2' : '#FEF3C7',
                                                    color: stage.status === 'approved' ? '#059669' : stage.status === 'rejected' ? '#DC2626' : '#D97706',
                                                    fontSize: '10px', padding: '2px 8px'
                                                }}>
                                                    {stage.status}
                                                </span>
                                            </div>
                                            {stage.approvedBy && (
                                                <div className="am-step-info">
                                                    <span>By {stage.approvedBy}</span>
                                                    <span>•</span>
                                                    <span>{stage.approvedAt}</span>
                                                </div>
                                            )}
                                            {stage.comment && <div className="am-step-comment">"{stage.comment}"</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="am-footer">
                        {currentAdminRole === 'super_admin' && (
                            <button
                                className="am-reject-btn"
                                style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECDD3', marginRight: 'auto' }}
                                onClick={() => handleDeleteApplication(selectedApplication.id)}
                            >
                                <Trash2 size={18} /> Delete Application
                            </button>
                        )}
                        {currentAdminRole !== 'super_admin' && selectedApplication.status === 'pending' && (
                            isEnrollment ? (
                                <>
                                    <button className="am-reject-btn" style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FEE2E2' }} onClick={() => handleRejectClick(selectedApplication.id, 'enrollment')}>
                                        <XCircle size={18} /> Reject
                                    </button>
                                    <button className="am-approve-btn" onClick={() => handleAction(selectedApplication.id, 'approved', 'enrollment')}>
                                        <Check size={18} /> Approve
                                    </button>
                                </>
                            ) : (
                                (
                                    (selectedApplication.currentStep === 1 && currentAdminRole === 'secretary') ||
                                    (selectedApplication.currentStep === 2 && currentAdminRole === 'coordinator') ||
                                    (selectedApplication.currentStep === 3 && currentAdminRole === 'director')
                                ) ? (
                                    <>
                                        <button className="am-reject-btn" style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FEE2E2' }} onClick={() => handleRejectClick(selectedApplication.id, 'exam')}>
                                            <XCircle size={18} /> Reject
                                        </button>
                                        <button className="am-approve-btn" onClick={() => handleAction(selectedApplication.id, 'approved', 'exam')}>
                                            <Check size={18} /> Approve
                                        </button>
                                    </>
                                ) : (
                                    <div className="am-waiting-badge" style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        background: '#FEF3C7',
                                        color: '#D97706',
                                        padding: '10px 20px',
                                        borderRadius: '8px',
                                        border: '1px solid #FDE68A',
                                        fontWeight: 700,
                                        fontSize: '13px',
                                        width: '100%',
                                        justifyContent: 'center'
                                    }}>
                                        <Clock size={16} />
                                        Waiting for {selectedApplication.currentStep === 1 ? 'Secretary' : selectedApplication.currentStep === 2 ? 'Coordinator' : 'Director'} approval
                                    </div>
                                )
                            )
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderEnrollmentTable = () => {
        if (!selectedCourse) return null;

        const applications = allEnrollmentApps.filter(app => {
            const matchesCourse = app.courseTitle === selectedCourse.title;
            const matchesType = typeFilter === 'all' ||
                (typeFilter === 'new' && app.isNewApplicant) ||
                (typeFilter === 'existing' && !app.isNewApplicant);

            // Search query (name or ID / reg no)
            let matchesSearch = true;
            if (applicantSearchTerm.trim()) {
                const query = applicantSearchTerm.toLowerCase();
                const nameMatch = (app.displayName || app.applicantName || '').toLowerCase().includes(query);
                const emailMatch = (app.applicantEmail || '').toLowerCase().includes(query);
                const regNo = app.isNewApplicant ? '' : `CODL/ST/2024/${app.id.split('-')[1]}`;
                const regMatch = regNo.toLowerCase().includes(query);
                const idMatch = String(app.id || '').toLowerCase().includes(query);
                matchesSearch = nameMatch || emailMatch || regMatch || idMatch;
            }

            return matchesCourse && matchesType && matchesSearch;
        });

        const sortedApplications = [...applications].sort((a, b) => {
            const aPending = (a.status || '').toLowerCase() === 'pending';
            const bPending = (b.status || '').toLowerCase() === 'pending';
            if (aPending && !bPending) return -1;
            if (!aPending && bPending) return 1;

            const aTime = a.created_at ? new Date(a.created_at).getTime() : (a.applicationDate ? new Date(a.applicationDate).getTime() : 0);
            const bTime = b.created_at ? new Date(b.created_at).getTime() : (b.applicationDate ? new Date(b.applicationDate).getTime() : 0);
            return bTime - aTime;
        });

        return (
            <div className="approvals-detail-view">
                <div style={{ marginBottom: '24px' }}>
                    <button className="am-back-btn" onClick={() => setViewMode('list')}>
                        <ArrowLeft size={18} /> Back
                    </button>
                </div>

                <div className="adv-breadcrumb" style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <div>
                            <h2 className="as-card-title">Enrollment Requests</h2>
                            <p className="as-card-desc">{selectedCourse.title} ({selectedCourse.code})</p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div className="search-box-wrapper" style={{ position: 'relative' }}>
                                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                                <input
                                    type="text"
                                    placeholder="Search by name or reg no..."
                                    className="admin-input"
                                    style={{ paddingLeft: '36px', width: '320px', height: '40px', margin: 0 }}
                                    value={applicantSearchTerm}
                                    onChange={(e) => setApplicantSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* Type Filter Pills */}
                            <div className="cm-filter-pills" style={{ margin: 0 }}>
                                {[
                                    { id: 'all', label: 'All' },
                                    { id: 'new', label: 'New' },
                                    { id: 'existing', label: 'Existing' }
                                ].map(filter => (
                                    <button
                                        key={filter.id}
                                        className={`cm-pill ${typeFilter === filter.id ? 'active' : ''}`}
                                        onClick={() => setTypeFilter(filter.id as any)}
                                        style={{ fontSize: '12px', padding: '6px 16px' }}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="approvals-content">
                    <div className="approval-table-wrapper">
                        <table className="approval-table">
                            <thead>
                                <tr>
                                    <th>Applicant Details</th>
                                    <th>Type</th>
                                    <th>Reg. No</th>
                                    <th>Received At</th>
                                    <th>Status</th>
                                    <th>Verification</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedApplications.map((app) => (
                                    <tr key={app.id}>
                                        <td>
                                            <div className="at-applicant">
                                                <div>
                                                    <span className="at-name">{app.displayName || app.applicantName}</span>
                                                    <span className="at-email">{app.applicantEmail}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={`at-type-badge ${app.isNewApplicant ? 'new' : 'existing'}`}>
                                                {app.isNewApplicant ? 'New' : 'Existing'}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '13px', fontWeight: 500, color: app.isNewApplicant ? '#94A3B8' : '#7C3AED' }}>
                                                {app.studentNumber || '-'}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '13px', color: '#64748B' }}>
                                                {app.applicationDate}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`at-status-badge ${app.status}`} style={{
                                                background: getStatusColor(app.status).bg,
                                                color: getStatusColor(app.status).text
                                            }}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <VerificationStages stages={app.approvalStages} />
                                        </td>
                                        <td>
                                            <div className="at-actions">
                                                <button
                                                    className="at-action-btn view"
                                                    title="View Details"
                                                    onClick={() => handleViewDetails(app)}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                {app.status === 'pending' && (currentAdminRole === 'coordinator' || currentAdminRole === 'director') && (
                                                    <button className="at-action-btn approve" title="Approve" onClick={() => handleAction(app.id, 'approved', 'enrollment')}>
                                                        <Check size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {applications.length === 0 && (
                            <div className="at-empty">
                                <FileText size={48} />
                                <p>No enrollment requests found for this course.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderApprovalsView = () => {
        if (!selectedCourse) return null;

        return (
            <div className="approvals-detail-view">
                <div style={{ marginBottom: '24px' }}>
                    <button className="am-back-btn" onClick={() => setViewMode('list')}>
                        <ArrowLeft size={18} /> Back
                    </button>
                </div>

                <div className="adv-breadcrumb" style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <div>
                            <h2 className="as-card-title">Exam Approvals</h2>
                            <p className="as-card-desc">{selectedCourse.title} ({selectedCourse.code})</p>
                        </div>
                    </div>
                </div>

                <div className="approvals-content">
                    <div className="approval-table-wrapper">
                        <table className="approval-table">
                            <thead>
                                <tr>
                                    <th>Student Details</th>
                                    <th>Type / Subject</th>
                                    <th>Received At</th>
                                    <th>Status</th>
                                    <th>Verification</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {examApps
                                    .filter(app => app.course === selectedCourse.title)
                                    .map(app => (
                                        <tr key={app.id}>
                                            <td>
                                                <div className="at-applicant">
                                                    <div>
                                                        <span className="at-name">{app.studentName}</span>
                                                        <span className="at-email">{app.studentNumber}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: '13px', fontWeight: 500 }}>{app.examTitle}</div>
                                                <div style={{ fontSize: '11px', color: '#64748B' }}>{app.semester}</div>
                                            </td>
                                            <td style={{ fontSize: '13px' }}>{app.applicationDate}</td>
                                            <td>
                                                <span className={`at-status-badge ${app.status}`} style={{
                                                    background: getStatusColor(app.status).bg,
                                                    color: getStatusColor(app.status).text
                                                }}>
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <VerificationStages stages={app.approvalStages} />
                                            </td>
                                            <td>
                                                <div className="at-actions">
                                                    <button className="at-action-btn view" onClick={() => handleViewDetails(app)}><Eye size={16} /></button>
                                                    {app.status === 'pending' && (
                                                        (app.currentStep === 1 && currentAdminRole === 'secretary') ||
                                                        (app.currentStep === 2 && currentAdminRole === 'coordinator') ||
                                                        (app.currentStep === 3 && currentAdminRole === 'director')
                                                    ) && (
                                                            <button className="at-action-btn approve" onClick={() => handleAction(app.id, 'approved', 'exam')}><Check size={16} /></button>
                                                        )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    if (viewMode === 'enrollments') {
        return (
            <div className="cm-container">
                {renderEnrollmentTable()}
                {renderApplicationModal()}
            </div>
        );
    }

    if (viewMode === 'approvals') {
        return (
            <div className="cm-container">
                {renderApprovalsView()}
                {renderApplicationModal()}
            </div>
        );
    }

    return (
        <div className="cm-container">
            {levelFilter === 'all' && !searchTerm && (
                <div className="admin-page-header">
                    <div>
                        <h1 className="admin-page-title">Applications</h1>
                        <p className="admin-page-subtitle">Manage and monitor student course applications and enrollment requests.</p>
                    </div>
                    <div className="admin-header-actions">
                    </div>
                </div>
            )}

            {/* Stats (Shown when no search/filter) */}
            {levelFilter === 'all' && !searchTerm && (
                <div className="cm-stats-row">
                    <div className="cm-stat-card">
                        <div className="cm-stat-icon" style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}><BookOpen size={20} /></div>
                        <div className="cm-stat-info">
                            <span className="cm-stat-val">{mockAdminCourses.length}</span>
                            <span className="cm-stat-label">Total Items</span>
                        </div>
                    </div>
                    <div className="cm-stat-card">
                        <div className="cm-stat-icon" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}><ArrowUpRight size={20} /></div>
                        <div className="cm-stat-info">
                            <span className="cm-stat-val">{mockAdminCourses.filter(c => c.intakeStatus === 'Open').length}</span>
                            <span className="cm-stat-label">Active Items</span>
                        </div>
                    </div>
                    <div className="cm-stat-card">
                        <div className="cm-stat-icon" style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}><UsersIcon size={20} /></div>
                        <div className="cm-stat-info">
                            <span className="cm-stat-val">{mockAdminCourses.reduce((s, c) => s + c.totalStudents, 0)}</span>
                            <span className="cm-stat-label">Subscribers</span>
                        </div>
                    </div>
                    <div className="cm-stat-card">
                        <div className="cm-stat-icon" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}><UserCheck size={20} /></div>
                        <div className="cm-stat-info">
                            <span className="cm-stat-val">{mockAdminCourses.filter(c => c.secretary).length}</span>
                            <span className="cm-stat-label">Verified</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Search Filters */}
            {levelFilter === 'all' && !searchTerm && (
                <div className="cm-filters" style={{ marginBottom: '24px', marginTop: '8px' }}>
                    <div className="cm-search" style={{ maxWidth: '100%' }}>
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search for any course, degree or code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            )}

            {/* Categories (Shown when no search/filter) */}
            {levelFilter === 'all' && !searchTerm && (
                <div className="cm-categories-grid">
                    {[
                        { name: 'Degree', desc: '4-Year Academic Programs', icon: BookOpen, color: '#7C3AED', count: mockAdminCourses.filter(c => c.level === 'Degree').length },
                        { name: 'Higher National Diploma', desc: 'Advanced Professional Diplomas', icon: Layers, color: '#F59E0B', count: mockAdminCourses.filter(c => c.level === 'Higher National Diploma').length },
                        { name: 'Diploma', desc: '1-2 Year Specialized Courses', icon: BookOpen, color: '#3B82F6', count: mockAdminCourses.filter(c => c.level === 'Diploma').length },
                        { name: 'Advance Certificate', desc: 'Intermediate Level Certifications', icon: Award, color: '#EC4899', count: mockAdminCourses.filter(c => c.level === 'Advance Certificate').length },
                        { name: 'Certificate', desc: 'Short-term Skill Programs', icon: Award, color: '#10B981', count: mockAdminCourses.filter(c => c.level === 'Certificate').length },
                    ].map(type => (
                        <div key={type.name} className="cm-category-card" onClick={() => setLevelFilter(type.name)}>
                            <div className="cm-category-icon" style={{ background: `${type.color}15`, color: type.color }}>
                                <type.icon size={28} />
                            </div>
                            <h3>{type.name}</h3>
                            <p>{type.desc}</p>
                            <div className="cm-category-stats">
                                <span>{type.count} Course{type.count !== 1 ? 's' : ''}</span>
                                <ArrowUpRight size={14} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Course Content Grid */}
            {(levelFilter !== 'all' || searchTerm !== '') && (
                <>
                    <div className="admin-page-header" style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <button
                                className="cm-back-text-btn"
                                style={{ marginBottom: '16px', marginLeft: '-16px' }}
                                onClick={() => { setLevelFilter('all'); setSearchTerm(''); }}
                            >
                                <ArrowLeft size={18} /> Back
                            </button>
                            <h1 className="admin-page-title">
                                {searchTerm ? `Search Results for "${searchTerm}"` : `${levelFilter} Programs`}
                            </h1>
                            <p className="admin-page-subtitle">
                                {`Explore and manage enrollments for ${searchTerm ? 'matching' : levelFilter} programs.`}
                            </p>
                        </div>
                    </div>

                    <div className="cm-grid">
                        {filteredCourses.map(course => {
                            const intakeStyle = getIntakeColor(course.intakeStatus);
                            const levelStyle = getLevelColor(course.level);
                            return (
                                <div className="cm-course-card" key={course.id}>
                                    <div className="cmc-header">
                                        <span className="cmc-level" style={{ background: levelStyle.bg, color: levelStyle.text }}>
                                            {course.level}
                                        </span>
                                        <span className="cmc-intake" style={{ background: intakeStyle.bg, color: intakeStyle.text }}>
                                            {course.intakeStatus}
                                        </span>
                                    </div>

                                    <h3 className="cmc-title">{course.title}</h3>
                                    <p className="cmc-code">{course.code} • {course.department}</p>

                                    <div className="cmc-stats">
                                        <div className="cmc-stat">
                                            <UsersIcon size={14} />
                                            <span><strong>{course.activeStudents}</strong> / {course.totalStudents}</span>
                                        </div>
                                        <div className="cmc-stat">
                                            <Calendar size={14} />
                                            <span>{course.duration}</span>
                                        </div>
                                        <div className="cmc-stat">
                                            <Award size={14} />
                                            <span>{course.batches.length} batch{course.batches.length > 1 ? 'es' : ''}</span>
                                        </div>
                                    </div>

                                    <div className="cmc-faculty-info">
                                        <div className="cmc-faculty-item">
                                            <UserCheck size={13} />
                                            <span>Secretary: <strong>{course.secretary || 'Not Assigned'}</strong></span>
                                        </div>
                                        <div className="cmc-faculty-item">
                                            <ShieldCheck size={13} />
                                            <span>Coordinator: <strong>{course.coordinator || 'Not Assigned'}</strong></span>
                                        </div>
                                    </div>

                                    <div className="cmc-grid-actions">
                                        <button
                                            className="cmc-btn-manage big"
                                            title="View Enrollments"
                                            onClick={() => handleViewEnrollments(course)}
                                        >
                                            <FileText size={15} /> Enrollments
                                        </button>
                                        <button
                                            className="cmc-btn-approvals big"
                                            title="Manage Approvals"
                                            onClick={() => handleViewApprovals(course)}
                                        >
                                            <CheckCircle2 size={15} /> Approvals
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {filteredCourses.length === 0 && (
                        <div className="cm-empty">
                            <BookOpen size={48} />
                            <p>No items match your criteria</p>
                        </div>
                    )}
                </>
            )}

            {/* Create Item Modal */}
            {showCreateModal && (
                <div className="cm-modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="cm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="cm-modal-header">
                            <h2>Add New Item</h2>
                            <button className="cm-modal-close" onClick={() => setShowCreateModal(false)}><X size={20} /></button>
                        </div>
                        <div className="cm-modal-body">
                            <form onSubmit={(e) => { e.preventDefault(); toast.success('Item added!'); setShowCreateModal(false); }}>
                                <div className="cm-form-grid">
                                    <div className="cm-form-group full-width">
                                        <label>Title</label>
                                        <input type="text" placeholder="e.g. New Application Item" required />
                                    </div>
                                    <div className="cm-form-group">
                                        <label>Code</label>
                                        <input type="text" placeholder="e.g. NSC-01" required />
                                    </div>
                                    <div className="cm-form-group">
                                        <label>Category</label>
                                        <select required>
                                            <option value="Degree">Type A</option>
                                            <option value="Diploma">Type B</option>
                                            <option value="Certificate">Type C</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="cm-modal-footer">
                                    <button type="button" className="um-btn-cancel" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                    <button type="submit" className="admin-btn-primary"><Plus size={16} /> Save Item</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {renderApplicationModal()}

            {/* Rejection Modal */}
            <RejectionModal
                isOpen={showRejectModal}
                onClose={() => setShowRejectModal(false)}
                onConfirm={handleRejectConfirm}
                reason={rejectionReason}
                setReason={setRejectionReason}
            />
        </div>
    );
};

// Rejection Modal Helper Component
const RejectionModal: React.FC<{ isOpen: boolean, onClose: () => void, onConfirm: () => void, reason: string, setReason: (v: string) => void }> = ({ isOpen, onClose, onConfirm, reason, setReason }) => {
    if (!isOpen) return null;
    return (
        <div className="cm-modal-overlay" style={{ zIndex: 3000 }}>
            <div className="cm-modal" style={{ maxWidth: '450px' }}>
                <div className="cm-modal-header" style={{ borderBottom: '1px solid #F1F5F9', padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '40px', height: '40px', background: '#FFF1F2', color: '#E11D48', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <XCircle size={20} />
                        </div>
                        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>Reject</h2>
                    </div>
                </div>
                <div className="cm-modal-body" style={{ padding: '24px' }}>
                    <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '20px' }}>Please provide a reason for rejecting this request. This will be visible to the applicant.</p>
                    <div className="cm-form-group">
                        <label style={{ color: '#475569', fontWeight: 600, marginBottom: '8px', display: 'block', fontSize: '14px' }}>Rejection Reason</label>
                        <textarea
                            className="admin-input"
                            placeholder="e.g. Incomplete documentation, prerequisite not met..."
                            rows={4}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            style={{ width: '100%', resize: 'vertical', minHeight: '100px', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                        ></textarea>
                    </div>
                </div>
                <div className="cm-modal-footer" style={{ padding: '24px', borderTop: 'none', justifyContent: 'flex-end', display: 'flex', gap: '12px' }}>
                    <button className="admin-btn-outline" onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', background: 'white' }}>Cancel</button>
                    <button className="admin-btn-primary" style={{ background: '#E11D48', padding: '10px 20px', borderRadius: '8px', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }} onClick={onConfirm} disabled={!reason.trim()}>Confirm Rejection</button>
                </div>
            </div>
        </div>
    );
};
