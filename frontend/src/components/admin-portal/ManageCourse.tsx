import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Save, Plus, Trash2, Edit2, Check,
    BookOpen, Calendar, Layers, FileSpreadsheet,
    AlertCircle, CheckCircle, Download, Upload,
    X, Users, Search, Mail,
    Send, ClipboardList, Eye, XCircle, Clock, MoreVertical,
    ChevronRight, Play, FileArchive, FileText, Video, EyeOff, List,
    Award, ShieldCheck, UserCheck, User, Edit3, RefreshCw, UserPlus, History
} from 'lucide-react';
import { getCurrentAdminUser } from '../../data/mockAdminData';
import type { AdminCourse } from '../../data/mockAdminData';
import {
    courseService,
    userService,
    courseApplicationService,
    batchService,
    examService,
    examApplicationService,
    postponementRequestService,
    reattemptRequestService,
    examResultService,
    announcementService
} from '../../services/apiService';
import { toast } from '../../utils/toast';
import { VerificationStages } from '../common/VerificationStages';
import './CourseManagement.css';
import './ApplicationApprovals.css';

interface Subject {
    id?: string | number;
    code?: string;
    name: string;
    credits: string;
}

interface BatchSubject {
    name: string;
    credits: string;
    lecturer: string;
    lecturerId?: string | number;
    subjectId?: string | number;
}

interface Semester {
    subjects: Subject[];
}

interface Exam {
    id: string;
    title: string;
    deadline: string;
    date: string;
    regCount: number;
    fee: string;
    type: string;
    timetablePath?: string;
    status: string;
    batch?: string;
    batch_name?: string;
    subjects?: any[];
}

interface EnrolledStudent {
    id: string;
    name: string;
    displayName?: string;
    email: string;
    phone: string;
    enrollmentDate: string;
    status: string;
    payment: string;
    batch?: string;
}

export const ManageCourse: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();

    // Parse URL query parameters
    const queryParams = new URLSearchParams(location.search);
    const urlBatch = queryParams.get('batch') || null;
    const urlSection = queryParams.get('section') || null;

    // Helper to push state to URL
    const updateNavigation = (batch: string | null, section: string | null) => {
        let url = `/admin/courses/manage/${id}`;
        const params: string[] = [];
        if (batch) {
            params.push(`batch=${encodeURIComponent(batch)}`);
        }
        if (section) {
            params.push(`section=${encodeURIComponent(section)}`);
        }
        if (params.length > 0) {
            url += `?${params.join('&')}`;
        }
        navigate(url);
    };

    // Find the course
    const [course, setCourse] = useState<AdminCourse | null>(null);
    const [isLoadingCourse, setIsLoadingCourse] = useState(true);
    const [realStudents, setRealStudents] = useState<any[]>([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(true);
    const [realLecturers, setRealLecturers] = useState<any[]>([]);
    const [batches, setBatches] = useState<{ id?: number, name: string, startDate: string, registrationDeadline: string, maxEnrollments: string, subtitle: string, status: string, materials?: any[], subjects?: BatchSubject[], lecturerId?: string | number, lecturerName?: string }[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadAllCourseData = async (showLoading = true) => {
        if (!id) return;
        if (showLoading) setIsLoadingData(true);
        try {
            const data = await courseService.getManageCourseData(id);

            // 1. Course details
            if (data.course) {
                const mapped: AdminCourse = {
                    id: data.course.id.toString(),
                    title: data.course.title,
                    code: data.course.code,
                    level: data.course.level as AdminCourse['level'],
                    department: data.course.department || 'CODL',
                    duration: data.course.duration || '1 Year',
                    intakeStatus: (data.course.intake_status || 'Open') as 'Open' | 'Closed',
                    secretary: data.course.secretary?.full_name || null,
                    coordinator: data.course.coordinator?.full_name || null,
                    totalStudents: data.course.max_students || 0,
                    activeStudents: 0,
                    batches: [],
                    createdDate: data.course.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
                    semesters: data.course.semesters?.map((sem: any) => ({
                        subjects: sem.subjects?.map((sub: any) => ({
                            id: sub.id,
                            code: sub.code || '',
                            name: sub.name,
                            credits: sub.credits?.toString() || '3'
                        })) || []
                    })) || undefined,
                    diplomaSubjects: data.course.subjects?.map((sub: any) => ({
                        id: sub.id,
                        code: sub.code || '',
                        name: sub.name,
                        credits: sub.credits?.toString() || '3'
                    })) || undefined
                };
                setCourse(mapped);
            }

            // 2. Real students
            if (data.student_users) {
                setRealStudents(data.student_users);
            }

            // 3. Enrolled students
            if (data.enrolled_students) {
                setEnrolledStudents(data.enrolled_students);
            }

            // 4. Real lecturers
            if (data.lecturers) {
                setRealLecturers(data.lecturers);
            }

            // 5. Batches
            if (data.batches) {
                const mappedBatches = data.batches.map((b: any) => ({
                    id: b.id,
                    name: b.name,
                    startDate: b.start_date,
                    registrationDeadline: b.registration_deadline || '',
                    maxEnrollments: b.max_enrollments.toString(),
                    subtitle: b.subtitle || 'Academic Intake Phase',
                    status: b.status,
                    materials: b.materials || [],
                    lecturerId: b.instructor_id || undefined,
                    lecturerName: b.instructor?.full_name || '',
                    subjects: (b.subjects || []).map((s: any) => ({
                        name: s.name,
                        credits: s.credits?.toString() || '3',
                        lecturer: s.pivot?.instructor_name || '',
                        lecturerId: s.pivot?.instructor_id || undefined,
                        subjectId: s.id || undefined
                    }))
                }));
                setBatches(mappedBatches);
            }

            // 6. Exams
            if (data.exams) {
                setExams(data.exams);
            }

            // 7. Announcements
            if (data.announcements) {
                const courseAnns = data.announcements.map((ann: any) => ({
                    id: ann.id,
                    title: ann.title,
                    desc: ann.desc,
                    date: new Date(ann.created_at || new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                    type: ann.type || 'Notice',
                    bgColor: ann.type === 'Important' ? '#FEF2F2' : (ann.type === 'Update' ? '#F0FDF4' : '#EFF6FF'),
                    iconColor: ann.type === 'Important' ? '#EF4444' : (ann.type === 'Update' ? '#22C55E' : '#3B82F6'),
                    batch: ann.batch || undefined
                }));
                setAnnouncementsList(courseAnns);
            }

            // 8. Enrollment Requests
            if (data.enrollment_requests) {
                const formattedEnrollments = data.enrollment_requests.map((app: any) => ({
                    id: `APP-${new Date(app.created_at).getFullYear()}-${app.id.toString().padStart(4, '0')}`,
                    studentNumber: app.user?.student_number || app.generated_student_number || '',
                    realId: app.id,
                    name: app.display_name || app.applicant_name,
                    email: app.applicant_email,
                    type: app.is_new_applicant ? 'New' : 'Existing',
                    status: app.status,
                    receivedTime: new Date(app.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }),
                    stages: {
                        secretary: app.approval_level >= 1 || (app.status === 'rejected' && app.approval_level === 0) ? (app.status === 'rejected' && app.approval_level === 0 ? 'rejected' : 'approved') : 'pending',
                        coordinator: app.approval_level >= 2 || (app.status === 'rejected' && app.approval_level === 1) ? (app.status === 'rejected' && app.approval_level === 1 ? 'rejected' : 'approved') : 'pending',
                        director: app.approval_level >= 3 || (app.status === 'rejected' && app.approval_level === 2) ? (app.status === 'rejected' && app.approval_level === 2 ? 'rejected' : 'approved') : 'pending'
                    },
                    rawApp: app
                }));
                setEnrollmentRequests(formattedEnrollments);
            }

            // 9. Approval Requests
            const mappedApps = (data.exam_applications || []).map((app: any) => {
                const name = app.user?.full_name || app.user?.name || 'Student';
                const studentNumber = app.user?.student_number || 'CODL/2404';
                const email = app.user?.email || '';
                const phone = app.user?.phone || '';
                const nic = app.user?.nic || '';
                const address = app.user?.address || '';

                const statusLower = (app.status || 'pending').toLowerCase();
                const currentStep = app.current_step || (statusLower === 'approved' ? 3 : 1);
                const stages = app.stages || (statusLower === 'approved' ? { secretary: 'approved', coordinator: 'approved', director: 'approved' } :
                    (statusLower === 'rejected' ? { secretary: 'rejected', coordinator: 'rejected', director: 'rejected' } :
                        { secretary: 'pending', coordinator: 'pending', director: 'pending' }));

                return {
                    id: app.id.toString(),
                    name,
                    studentNumber,
                    email,
                    phone,
                    nic,
                    address,
                    subject: `${app.exam_title || 'Exam'} - Application`,
                    sem: app.semester ? `Semester ${app.semester}` : 'Semester 1',
                    date: app.created_at ? app.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
                    receivedTime: (() => {
                        const rawDate = app.created_at || new Date().toISOString();
                        const d = new Date(rawDate);
                        const dateStr = d.toISOString().split('T')[0];
                        const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                        return `${dateStr} ${timeStr}`;
                    })(),
                    type: 'regular',
                    status: statusLower,
                    stages,
                    currentStep,
                    isRealApplication: true,
                    examKey: app.exam_id,
                    subjects: app.subjects,
                    raw: app
                };
            });

            const mappedPostponements = (data.postponement_requests || []).map((req: any) => {
                const name = req.user?.full_name || req.user?.name || 'Student';
                const studentNumber = req.user?.student_number || 'CODL/2404';
                const email = req.user?.email || '';
                const phone = req.user?.phone || '';
                const nic = req.user?.nic || '';
                const address = req.user?.address || '';

                const statusLower = (req.status || 'pending').toLowerCase();
                const currentStep = req.current_step || (statusLower === 'approved' ? 3 : 1);
                const stages = req.stages || (statusLower === 'approved' ? { secretary: 'approved', coordinator: 'approved', director: 'approved' } :
                    (statusLower === 'rejected' ? { secretary: 'rejected', coordinator: 'rejected', director: 'rejected' } :
                        { secretary: 'pending', coordinator: 'pending', director: 'pending' }));

                return {
                    id: req.id.toString(),
                    application_id: req.application_id || `P-${req.id.toString().padStart(4, '0')}`,
                    name,
                    studentName: name,
                    studentNumber,
                    email,
                    phone,
                    raw: req,
                    nic,
                    address,
                    subject: `${req.exam_title} - Postponement`,
                    examTitle: req.exam_title,
                    sem: req.exam_title?.toLowerCase().includes('semester 2') ? 'Semester 2' :
                        (req.exam_title?.toLowerCase().includes('semester 3') ? 'Semester 3' :
                            (req.exam_title?.toLowerCase().includes('semester 4') ? 'Semester 4' : 'Semester 1')),
                    date: req.created_at ? req.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
                    receivedTime: (() => {
                        const rawDate = req.created_at || new Date().toISOString();
                        const d = new Date(rawDate);
                        const dateStr = d.toISOString().split('T')[0];
                        const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                        return `${dateStr} ${timeStr}`;
                    })(),
                    type: 'postponements',
                    status: statusLower,
                    stages,
                    currentStep,
                    isRealStudentRequest: true,
                    requestKey: req.id,
                    reason: req.reason,
                    newDate: req.newDate,
                    salutation: req.salutation,
                    courseOffered: req.courseOffered,
                    year: req.year,
                    batch: req.batch,
                    examUnableToTake: req.examUnableToTake,
                    examScheduledDate: req.examScheduledDate,
                    unableDatesDetails: req.unableDatesDetails
                };
            });

            const mappedReattempts = (data.reattempt_requests || []).map((req: any) => {
                const name = req.user?.full_name || req.user?.name || 'Student';
                const studentNumber = req.user?.student_number || 'CODL/2404';
                const email = req.user?.email || '';
                const phone = req.user?.phone || '';
                const nic = req.user?.nic || '';
                const address = req.user?.address || '';

                const statusLower = (req.status || 'pending').toLowerCase();
                const currentStep = req.current_step || (statusLower === 'approved' ? 3 : 1);
                const stages = req.stages || (statusLower === 'approved' ? { secretary: 'approved', coordinator: 'approved', director: 'approved' } :
                    (statusLower === 'rejected' ? { secretary: 'rejected', coordinator: 'rejected', director: 'rejected' } :
                        { secretary: 'pending', coordinator: 'pending', director: 'pending' }));

                return {
                    id: req.id.toString(),
                    application_id: req.application_id || `R-${req.id.toString().padStart(4, '0')}`,
                    name,
                    studentName: name,
                    studentNumber,
                    email,
                    phone,
                    raw: req,
                    nic,
                    address,
                    subject: req.exam_title || (req.subject ? `${req.subject.code} - ${req.subject.name}` : null) || 'Exam',
                    sem: req.exam_title?.toLowerCase().includes('semester 2') ? 'Semester 2' :
                        (req.exam_title?.toLowerCase().includes('semester 3') ? 'Semester 3' :
                            (req.exam_title?.toLowerCase().includes('semester 4') ? 'Semester 4' : 'Semester 1')),
                    date: req.created_at ? req.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
                    receivedTime: (() => {
                        const rawDate = req.created_at || new Date().toISOString();
                        const d = new Date(rawDate);
                        const dateStr = d.toISOString().split('T')[0];
                        const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                        return `${dateStr} ${timeStr}`;
                    })(),
                    type: 'reattempts',
                    status: statusLower,
                    stages,
                    currentStep,
                    isRealStudentRequest: true,
                    requestKey: req.id,
                    reason: req.reason,
                    newDate: req.newDate,
                    subjects: [{ code: '-', name: req.subject?.name || req.subject_id || 'Subject', attempt: '2' }],
                    salutation: req.salutation,
                    courseOffered: req.courseOffered,
                    year: req.year,
                    batch: req.batch,
                    examUnableToTake: req.examUnableToTake,
                    examScheduledDate: req.examScheduledDate,
                    unableDatesDetails: req.unableDatesDetails
                };
            });

            setApprovalRequests(mappedApps);
            setWaitlistPostponements(mappedPostponements);
            setWaitlistReattempts(mappedReattempts);

        } catch (err) {
            console.error("Failed to fetch consolidated course data:", err);
            toast.error("Failed to load course details from database.");
        } finally {
            setIsLoadingData(false);
            setIsLoadingCourse(false);
            setIsLoadingStudents(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await loadAllCourseData(false);
            toast.success("List refreshed successfully!");
        } catch (error) {
            console.error("Refresh failed:", error);
            toast.error("Failed to refresh list.");
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (id) {
            loadAllCourseData(true);
        }
    }, [id]);

    // Form State (Details)
    const [courseType, setCourseType] = useState<'Degree' | 'Higher National Diploma' | 'Diploma' | 'Advanced Certificate' | 'Certificate'>('Degree');
    const [commonData, setCommonData] = useState({
        name: '',
        code: '',
        enrollments: '',
        duration: '',
        secretary: '',
        status: 'Open',
        registrationDeadline: '',
        lecturerId: undefined as string | number | undefined,
        lecturerName: ''
    });
    const currentAdminUser = getCurrentAdminUser();
    const userRole = currentAdminUser.role;
    console.log('ManageCourse component loaded - userRole:', userRole);

    const [openBatchMenu, setOpenBatchMenu] = useState<string | null>(null);
    const [selectedBatch, _setSelectedBatch] = useState<string | null>(urlBatch);

    const [showBatchModal, setShowBatchModal] = useState(false);
    const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);
    const [batchForm, setBatchForm] = useState({
        name: `Batch ${(batches.length + 1).toString().padStart(2, '0')}`,
        startDate: new Date().toISOString().split('T')[0],
        registrationDeadline: '',
        maxEnrollments: '50',
        subtitle: 'Academic Intake Phase',
        status: 'Upcoming'
    });

    const handleAddBatchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmittingBatch) return;
        setIsSubmittingBatch(true);
        try {
            const payload = {
                name: batchForm.name,
                start_date: batchForm.startDate,
                registration_deadline: batchForm.registrationDeadline || null,
                max_enrollments: parseInt(batchForm.maxEnrollments),
                subtitle: batchForm.subtitle,
                status: batchForm.status
            };
            const savedBatch = await batchService.create(id!, payload);
            const mappedNew = {
                id: savedBatch.id,
                name: savedBatch.name,
                startDate: savedBatch.start_date,
                registrationDeadline: savedBatch.registration_deadline || '',
                maxEnrollments: savedBatch.max_enrollments.toString(),
                subtitle: savedBatch.subtitle || 'Academic Intake Phase',
                status: savedBatch.status,
                subjects: []
            };
            const newBatches = [mappedNew, ...batches];
            setBatches(newBatches);
            setShowBatchModal(false);

            // Reset form
            const nextNum = newBatches.length + 1;
            setBatchForm({
                name: `Batch ${nextNum.toString().padStart(2, '0')}`,
                startDate: new Date().toISOString().split('T')[0],
                registrationDeadline: '',
                maxEnrollments: '50',
                subtitle: 'Academic Intake Phase',
                status: 'Upcoming'
            });
            toast.success('Batch created successfully in the database!');
        } catch (err: any) {
            console.error("Failed to create batch:", err);
            toast.error(err.response?.data?.message || 'Failed to save batch to database.');
        } finally {
            setIsSubmittingBatch(false);
        }
    };

    // Specific Fields
    const [semesterCount, setSemesterCount] = useState(1);
    const [semesters, setSemesters] = useState<Semester[]>([{ subjects: [{ code: '', name: '', credits: '' }] }]);
    const [diplomaSubjects, setDiplomaSubjects] = useState<Subject[]>([{ code: '', name: '', credits: '' }]);
    const [batchSubjects, setBatchSubjects] = useState<BatchSubject[]>([]);

    const [exams, setExams] = useState<Exam[]>([]);
    const [openExamDotMenu, setOpenExamDotMenu] = useState<string | null>(null);


    const csvInputRef = useRef<HTMLInputElement>(null);

    const getFilteredApprovalRequests = () => {
        return approvalRequests.filter(req => {
            const matchesBatch = !selectedBatch || req.batch === selectedBatch || (req.examTitle && exams.find(e => e.title === req.examTitle)?.batch === selectedBatch);
            if (!matchesBatch) return false;

            if (userRole === 'coordinator') {
                return req.stages?.secretary === 'approved';
            }
            if (userRole === 'director') {
                return req.stages?.coordinator === 'approved';
            }
            return true;
        });
    };

    const getFilteredEnrollmentRequests = () => {
        return enrollmentRequests.filter(req => {
            // Role level filtering
            if (userRole === 'coordinator') {
                if (req.rawApp && req.rawApp.approval_level < 1) return false;
            }
            if (userRole === 'director') {
                if (req.rawApp && req.rawApp.approval_level < 2) return false;
            }

            // Type filtering (new vs existing)
            if (enrollmentTypeFilter !== 'all') {
                const reqTypeLower = (req.type || '').toLowerCase();
                if (enrollmentTypeFilter === 'new' && reqTypeLower !== 'new') return false;
                if (enrollmentTypeFilter === 'existing' && reqTypeLower !== 'existing') return false;
            }

            // Search query (name or reg no / id)
            if (enrollmentSearchQuery.trim()) {
                const query = enrollmentSearchQuery.toLowerCase();
                const nameMatch = (req.name || '').toLowerCase().includes(query);
                const idMatch = (req.id || '').toLowerCase().includes(query);
                const realIdMatch = String(req.realId || '').toLowerCase().includes(query);
                if (!nameMatch && !idMatch && !realIdMatch) return false;
            }

            return true;
        });
    };

    const getRegisteredStudentCount = (exam: Exam) => {
        const approvedRegularCount = approvalRequests.filter(req =>
            req.type === 'regular' &&
            req.status === 'approved' &&
            req.raw?.exam_title?.toString().toLowerCase().trim() === exam.title?.toString().toLowerCase().trim()
        ).length;

        const postponementCount = waitlistPostponements.filter(p =>
            p.raw?.assigned_exam_id?.toString() === exam.id.toString()
        ).length;

        const reattemptCount = waitlistReattempts.filter(r =>
            r.raw?.assigned_exam_id?.toString() === exam.id.toString()
        ).length;

        return approvedRegularCount + postponementCount + reattemptCount;
    };

    const getSubjectDisplayName = (subjectName: string) => {
        if (!subjectName) return '';
        if (course) {
            if (course.semesters) {
                for (const sem of course.semesters) {
                    const found = sem.subjects.find(s => s.name === subjectName);
                    if (found) {
                        return found.code ? `${found.code} - ${found.name}` : found.name;
                    }
                }
            }
            if (course.diplomaSubjects) {
                const found = course.diplomaSubjects.find(s => s.name === subjectName);
                if (found) {
                    return found.code ? `${found.code} - ${found.name}` : found.name;
                }
            }
        }
        return subjectName;
    };

    // Navigation State
    const [activeSection, _setActiveSection] = useState<'details' | 'exams' | 'results' | 'students' | 'materials' | 'enrollment_req' | 'approvals_req' | 'announcements' | 'waitlist' | null>(urlSection as any);

    // Sync from URL changes (like Back/Forward buttons or refresh)
    useEffect(() => {
        _setSelectedBatch(urlBatch);
        if (urlBatch && !urlSection && userRole === 'lecturer') {
            _setActiveSection('materials');
            updateNavigation(urlBatch, 'materials');
        } else {
            _setActiveSection(urlSection as any);
        }
    }, [urlBatch, urlSection, userRole]);

    // Redefine setter functions to push state to URL and update state synchronously
    function setSelectedBatch(batch: string | null) {
        _setSelectedBatch(batch);
        if (batch && userRole === 'lecturer') {
            _setActiveSection('materials');
            updateNavigation(batch, 'materials');
        } else {
            updateNavigation(batch, null);
        }
    }

    function setActiveSection(section: 'details' | 'exams' | 'results' | 'students' | 'materials' | 'enrollment_req' | 'approvals_req' | 'announcements' | 'waitlist' | null) {
        _setActiveSection(section);
        updateNavigation(selectedBatch, section);
    }

    // Announcement States
    const [annTitle, setAnnTitle] = useState('');
    const [annContent, setAnnContent] = useState('');
    const [annType, setAnnType] = useState('Notice');
    const [announcementsList, setAnnouncementsList] = useState<any[]>([]);

    const handleBroadcastAnnouncement = async () => {
        if (!annTitle.trim() || !annContent.trim()) {
            toast.error('Please fill in both title and content.');
            return;
        }

        const formattedDate = new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        try {
            const response = await announcementService.create({
                title: annTitle,
                desc: annContent,
                type: annType,
                course_id: parseInt(id!),
                batch: selectedBatch || null
            });

            const newAnn = {
                id: response.id,
                title: annTitle,
                desc: annContent,
                date: formattedDate,
                type: annType,
                bgColor: annType === 'Important' ? '#FEF2F2' : (annType === 'Update' ? '#F0FDF4' : '#EFF6FF'),
                iconColor: annType === 'Important' ? '#EF4444' : (annType === 'Update' ? '#22C55E' : '#3B82F6'),
                batch: selectedBatch || undefined
            };

            setAnnouncementsList([newAnn, ...announcementsList]);
            setAnnTitle('');
            setAnnContent('');
            toast.success('Announcement broadcasted successfully to all registered students!');
        } catch (err) {
            console.error('Failed to broadcast announcement:', err);
            toast.error('Failed to broadcast announcement.');
        }
    };

    const [confirmModal, setConfirmModal] = useState<{
        show: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ show: false, title: '', message: '', onConfirm: () => { } });

    const [isConfirmLoading, setIsConfirmLoading] = useState(false);

    const showConfirm = (title: string, message: string, onConfirm: () => void) => {
        setConfirmModal({ show: true, title, message, onConfirm });
    };

    const handleDeleteAnnouncement = async (annToDelete: any) => {
        showConfirm(
            'Confirm Delete',
            'Are you sure you want to delete this announcement? This action is permanent.',
            async () => {
                try {
                    if (annToDelete.id) {
                        await announcementService.delete(annToDelete.id);
                    }
                    setAnnouncementsList(announcementsList.filter(ann => ann !== annToDelete));
                } catch (err) {
                    console.error('Failed to delete announcement:', err);
                    toast.error('Failed to delete announcement.');
                }
            }
        );
    };

    // Course Materials State
    const [materialsViewState, setMaterialsViewState] = useState<'semesters' | 'modules' | 'resources'>('semesters');
    const [materialsSelectedSemesterId, setMaterialsSelectedSemesterId] = useState<number | null>(null);
    const [materialsSelectedModuleId, setMaterialsSelectedModuleId] = useState<string | null>(null);
    const [materialsSemesters, setMaterialsSemesters] = useState<any[]>([]);

    // Filtered materials semesters for lecturer
    const currentLecturerSubjectNames = (selectedBatch && userRole === 'lecturer')
        ? (() => {
            const batch = batches.find(b => b.name === selectedBatch);
            if (!batch) return [];
            const isBatchInstructor = batch.lecturerId?.toString() === currentAdminUser.id?.toString();
            if (isBatchInstructor) {
                const subs = (batch.subjects || []).map(bs => bs.name.toLowerCase());
                subs.push('course materials');
                return subs;
            }
            const subs = (batch.subjects || [])
                .filter(bs => bs.lecturerId?.toString() === currentAdminUser.id?.toString())
                .map(bs => bs.name.toLowerCase());
            subs.push('course materials');
            return subs;
        })()
        : [];

    const filteredMaterialsSemesters = (userRole === 'lecturer')
        ? materialsSemesters
            .map(sem => {
                const filteredModules = (sem.modules || []).filter((m: any) =>
                    currentLecturerSubjectNames.includes(m.title.toLowerCase())
                );
                return {
                    ...sem,
                    modules: filteredModules
                };
            })
            .filter(sem => sem.modules.length > 0)
        : materialsSemesters;

    // Filtered batches for lecturer to show only batches where they teach a subject OR are assigned directly as batch instructor
    const displayedBatches = (userRole === 'lecturer')
        ? batches.filter(b => {
            const isBatchInstructor = (b as any).lecturerId?.toString() === currentAdminUser.id?.toString();
            if (id?.startsWith('CRS-')) {
                return isBatchInstructor || (b.subjects || []).some(sub =>
                    (sub.lecturer?.toLowerCase() || '').includes(currentAdminUser.fullName.toLowerCase())
                );
            } else {
                return isBatchInstructor || (b.subjects || []).some(sub =>
                    sub.lecturerId?.toString() === currentAdminUser.id?.toString()
                );
            }
        })
        : batches;

    // Auto-select semester if the lecturer is assigned to subjects in only one semester
    useEffect(() => {
        if (activeSection === 'materials' && userRole === 'lecturer' && materialsViewState === 'semesters') {
            if (filteredMaterialsSemesters.length === 1) {
                setMaterialsSelectedSemesterId(filteredMaterialsSemesters[0].id);
                setMaterialsViewState('modules');
            }
        }
    }, [activeSection, userRole, materialsViewState, filteredMaterialsSemesters]);

    const saveMaterialsToDatabase = async (updatedMaterials: any[]) => {
        if (!selectedBatch) return;
        const targetBatch = batches.find(b => b.name === selectedBatch);
        if (targetBatch && targetBatch.id) {
            try {
                const payload: any = {
                    name: targetBatch.name,
                    start_date: targetBatch.startDate,
                    registration_deadline: targetBatch.registrationDeadline || null,
                    max_enrollments: parseInt(targetBatch.maxEnrollments) || 50,
                    subtitle: targetBatch.subtitle || 'Academic Intake Phase',
                    status: targetBatch.status,
                    instructor_id: (targetBatch as any).lecturerId || null,
                    materials: updatedMaterials
                };
                if (targetBatch.subjects && targetBatch.subjects.length > 0) {
                    payload.subjects = targetBatch.subjects.map(bs => ({
                        subject_id: bs.subjectId,
                        lecturer_id: bs.lecturerId || null
                    }));
                }
                const updated = await batchService.update(id!, targetBatch.id, payload);

                // Update local batches state
                setBatches(prev => prev.map(b => b.id === targetBatch.id ? {
                    ...b,
                    materials: updated.materials
                } : b));
            } catch (err) {
                console.error("Failed to save materials to database:", err);
                toast.error("Failed to persist materials to database.");
            }
        }
    };

    // Load materials from selected batch
    useEffect(() => {
        if (!selectedBatch || batches.length === 0) return;
        const currentBatch = batches.find(b => b.name === selectedBatch);
        if (!currentBatch) return;

        if (currentBatch.materials && currentBatch.materials.length > 0) {
            if (JSON.stringify(materialsSemesters) !== JSON.stringify(currentBatch.materials)) {
                setMaterialsSemesters(currentBatch.materials);
            }
        } else {
            // Generate empty structure
            let generated: any[] = [];
            if (['Certificate', 'Advanced Certificate'].includes(courseType)) {
                generated = [
                    {
                        id: 1,
                        name: 'Course Materials',
                        visible: true,
                        modules: [
                            {
                                id: 'materials',
                                code: 'MATERIALS',
                                title: 'Course Materials',
                                materials: []
                            }
                        ]
                    }
                ];
            } else if (course?.semesters && course.semesters.length > 0) {
                generated = course.semesters.map((sem, semIdx) => ({
                    id: semIdx + 1,
                    name: `Semester 0${semIdx + 1}`,
                    visible: true,
                    modules: sem.subjects.map((sub, subIdx) => {
                        const prefix = course.code || 'MOD';
                        const code = `${prefix}-${semIdx + 1}-0${subIdx + 1}`;
                        const moduleId = `${course.id}-S${semIdx + 1}-M${subIdx + 1}`;
                        return {
                            id: moduleId,
                            code: code,
                            title: sub.name,
                            materials: []
                        };
                    })
                }));
            } else if (course?.diplomaSubjects && course.diplomaSubjects.length > 0) {
                generated = [
                    {
                        id: 1,
                        name: 'Semester 01',
                        visible: true,
                        modules: course.diplomaSubjects.map((sub, subIdx) => {
                            const prefix = course.code || 'MOD';
                            const code = `${prefix}-0${subIdx + 1}`;
                            const moduleId = `${course.id}-M${subIdx + 1}`;
                            return {
                                id: moduleId,
                                code: code,
                                title: sub.name,
                                materials: []
                            };
                        })
                    }
                ];
            } else {
                generated = [
                    {
                        id: 1, name: 'Semester 01', visible: true,
                        modules: [
                            {
                                id: 'M101', code: 'WD101', title: 'Basics of Web Development',
                                materials: []
                            }
                        ]
                    }
                ];
            }
            setMaterialsSemesters(generated);
            saveMaterialsToDatabase(generated);
        }
    }, [selectedBatch, batches, course, courseType]);

    // Automatically synchronize any materials changes back to Database
    useEffect(() => {
        if (materialsSemesters && materialsSemesters.length > 0 && selectedBatch) {
            const currentBatch = batches.find(b => b.name === selectedBatch);
            if (currentBatch && JSON.stringify(currentBatch.materials) !== JSON.stringify(materialsSemesters)) {
                saveMaterialsToDatabase(materialsSemesters);
            }
        }
    }, [materialsSemesters, id, selectedBatch, batches]);

    // Automatically skip semester/subject view for Certificate and Advanced Certificate courses
    useEffect(() => {
        if (activeSection === 'materials') {
            if (['Certificate', 'Advanced Certificate'].includes(courseType)) {
                setMaterialsSelectedSemesterId(1);
                setMaterialsSelectedModuleId('materials');
                setMaterialsViewState('resources');
            }
        }
    }, [activeSection, courseType]);

    const [showVideoModal, setShowVideoModal] = useState(false);
    const [showFileModal, setShowFileModal] = useState(false);
    const [videoForm, setVideoForm] = useState({ title: '', url: '', duration: '' });
    const [fileForm, setFileForm] = useState({ title: '', type: 'PDF', link: '' });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [editingMaterial, setEditingMaterial] = useState<any | null>(null);
    const [editingMaterialOriginalTitle, setEditingMaterialOriginalTitle] = useState<string>('');

    // Request Management State
    const [enrollmentRequests, setEnrollmentRequests] = useState<any[]>([]);
    const [approvalRequests, setApprovalRequests] = useState<any[]>([]);
    const [isLoadingApprovals, setIsLoadingApprovals] = useState(false);

    useEffect(() => {
        if (realStudents.length > 0 && approvalRequests.length > 0) {
            let updated = false;
            const enriched = approvalRequests.map(req => {
                const matched = realStudents.find((s: any) => {
                    const reqHasNo = req.studentNumber && req.studentNumber !== 'CODL/2404';
                    const sHasNo = s.student_number && s.student_number !== 'CODL/2404';
                    if (reqHasNo && sHasNo) {
                        return s.student_number === req.studentNumber;
                    }
                    if (req.email && s.email) {
                        return s.email === req.email;
                    }
                    return s.full_name?.toLowerCase() === req.name?.toLowerCase() ||
                           s.name?.toLowerCase() === req.name?.toLowerCase();
                });
                if (matched) {
                    const newPhone = matched.phone || matched.mobilePhone || req.phone;
                    const newNic = matched.nic || req.nic;
                    const newAddress = matched.address || req.address;
                    const newEmail = matched.email || req.email;
                    const newName = matched.display_name || matched.displayName || matched.full_name || matched.name || req.name;
                    const newStudentNumber = matched.student_number || req.studentNumber;

                    if (
                        newPhone !== req.phone ||
                        newNic !== req.nic ||
                        newAddress !== req.address ||
                        newEmail !== req.email ||
                        newName !== req.name ||
                        newStudentNumber !== req.studentNumber
                    ) {
                        updated = true;
                        return {
                            ...req,
                            name: newName,
                            studentNumber: newStudentNumber,
                            email: newEmail,
                            phone: newPhone,
                            nic: newNic,
                            address: newAddress
                        };
                    }
                }
                return req;
            });
            if (updated) {
                setApprovalRequests(enriched);
            }
        }
    }, [realStudents]);
    const handleActionRequest = async (requestId: string, action: 'approved' | 'rejected', type: 'approval' | 'enrollment', reason?: string) => {
        if (type === 'enrollment') {
            try {
                if (action === 'approved') {
                    const response = await courseApplicationService.approve(requestId);
                    toast.success('Application approved successfully!');

                    // If application fully approved, add user to enrolled students list
                    if (response.status === 'approved' && response.user) {
                        const newStudent: EnrolledStudent = {
                            id: String(response.user.student_number || response.user.id),
                            name: response.user.full_name || response.user.name,
                            email: response.user.email,
                            phone: response.user.phone || 'N/A',
                            enrollmentDate: new Date().toISOString().split('T')[0],
                            status: 'Active',
                            payment: 'Paid'
                        };

                        setEnrolledStudents(prev => {
                            const exists = prev.some(s => s.id === newStudent.id);
                            if (exists) return prev;
                            return [...prev, newStudent];
                        });
                    }
                } else {
                    await courseApplicationService.reject(requestId, { comment: reason });
                    toast.success('Application rejected.');
                }
                loadAllCourseData(false);
            } catch (err: any) {
                console.error('Error updating application', err);
                toast.error(err.response?.data?.message || 'Failed to update application');
            }
        } else {
            // Find the request
            const req = approvalRequests.find(r => r.id === requestId);
            if (!req) return;

            let nextStages = { ...req.stages };
            let nextStatus = req.status;
            let currentStep = req.currentStep || 1;

            if (action === 'rejected') {
                if (userRole === 'secretary') {
                    nextStages.secretary = 'rejected';
                } else if (userRole === 'coordinator') {
                    nextStages.coordinator = 'rejected';
                } else if (userRole === 'director') {
                    nextStages.director = 'rejected';
                }
                nextStatus = 'rejected';
            } else if (action === 'approved') {
                if (userRole === 'secretary') {
                    nextStages.secretary = 'approved';
                    nextStatus = 'pending';
                    currentStep = 2;
                } else if (userRole === 'coordinator') {
                    if (req.stages?.secretary !== 'approved') {
                        toast.error('Secretary must approve first before Coordinator can act.');
                        return;
                    }
                    nextStages.coordinator = 'approved';
                    nextStatus = 'pending';
                    currentStep = 3;
                } else if (userRole === 'director') {
                    if (req.stages?.coordinator !== 'approved') {
                        toast.error('Coordinator must approve first before Director can act.');
                        return;
                    }
                    nextStages.director = 'approved';
                    nextStatus = 'approved';
                    currentStep = 3;
                }
            }

            try {
                const updatePayload = {
                    status: nextStatus,
                    stages: nextStages,
                    current_step: currentStep,
                    rejection_reason: reason || null
                };

                if (req.isRealApplication) {
                    await examApplicationService.update(requestId, updatePayload);
                } else if (req.type === 'postponements') {
                    await postponementRequestService.update(req.requestKey || requestId, updatePayload);
                } else if (req.type === 'reattempts') {
                    await reattemptRequestService.update(req.requestKey || requestId, updatePayload);
                }

                if (action === 'rejected') {
                    toast.success('Request rejected.');
                } else if (action === 'approved') {
                    if (userRole === 'secretary') {
                        toast.success('Approved at Secretary level. Awaiting Coordinator approval.');
                    } else if (userRole === 'coordinator') {
                        toast.success('Approved at Coordinator level. Awaiting Director final approval.');
                    } else if (userRole === 'director') {
                        toast.success('Application fully approved!');
                    } else {
                        toast.success('Request approved.');
                    }
                }

                loadAllCourseData(false);
            } catch (err: any) {
                console.error('Failed to update request:', err);
                toast.error(err.response?.data?.message || 'Failed to update request.');
            }
        }
    };

    const handleDeleteApplication = (realId: string) => {
        setConfirmConfig({
            show: true,
            title: "Delete Application Request",
            message: "Are you sure you want to delete this application request completely? This action cannot be undone.",
            action: async () => {
                try {
                    await courseApplicationService.delete(realId);
                    toast.success("Application deleted successfully!");
                    loadAllCourseData(false);
                } catch (err: any) {
                    console.error("Failed to delete application:", err);
                    toast.error(err.response?.data?.message || "Failed to delete application.");
                } finally {
                    setConfirmConfig(prev => ({ ...prev, show: false }));
                }
            }
        });
    };

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [pendingRequest, setPendingRequest] = useState<{ id: string, type: 'enrollment' | 'approval' } | null>(null);

    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedRequestDetails, setSelectedRequestDetails] = useState<any>(null);

    const handleRejectClick = (id: string, type: 'enrollment' | 'approval') => {
        setPendingRequest({ id, type });
        setRejectionReason('');
        setShowRejectModal(true);
    };

    const handleRejectConfirm = () => {
        if (pendingRequest) {
            handleActionRequest(pendingRequest.id, 'rejected', pendingRequest.type, rejectionReason);
            setShowRejectModal(false);
            setPendingRequest(null);
            setShowDetailsModal(false);
        }
    };

    const handleViewDetails = (req: any, type: 'enrollment' | 'approval') => {
        setSelectedRequestDetails({ ...req, requestType: type });
        setShowDetailsModal(true);
    };

    // Helpers
    const materialsActiveSemester = filteredMaterialsSemesters.find(s => s.id === materialsSelectedSemesterId) || null;
    const materialsActiveModule = materialsActiveSemester?.modules.find((m: any) => m.id === materialsSelectedModuleId) || null;

    // Delete Confirmation State
    const [confirmConfig, setConfirmConfig] = useState<{ show: boolean, title: string, message: string, action: () => any }>({ show: false, title: '', message: '', action: () => { } });
    const [isConfirmActionProcessing, setIsConfirmActionProcessing] = useState(false);

    // Students State
    const [searchQuery, setSearchQuery] = useState('');
    const [enrollmentSearchQuery, setEnrollmentSearchQuery] = useState('');
    const [enrollmentTypeFilter, setEnrollmentTypeFilter] = useState<'all' | 'new' | 'existing'>('all');
    const [showStudentModal, setShowStudentModal] = useState(false);

    const [waitlistTab, setWaitlistTab] = useState<'postponements' | 'reattempts'>('postponements');
    const [waitlistPostponements, setWaitlistPostponements] = useState<any[]>([]);
    const [waitlistReattempts, setWaitlistReattempts] = useState<any[]>([]);
    const [showWaitlistAddModal, setShowWaitlistAddModal] = useState(false);
    const [showWaitlistEditModal, setShowWaitlistEditModal] = useState(false);
    const [editingWaitlistRecord, setEditingWaitlistRecord] = useState<any | null>(null);
    const [isSavingWaitlist, setIsSavingWaitlist] = useState(false);

    const [waitlistForm, setWaitlistForm] = useState({
        type: 'postponement' as 'postponement' | 'reattempt',
        applicationId: '',
        studentRegNo: '',
        studentName: '',
        originBatch: '',
        examTitle: '',
        examId: '',
        subjectId: '',
        reason: '',
        approved: false,
        selectedSubjects: [] as string[]
    });

    const [regNoSuggestions, setRegNoSuggestions] = useState<EnrolledStudent[]>([]);
    const [showRegNoSuggestions, setShowRegNoSuggestions] = useState(false);

    const [enrollForm, setEnrollForm] = useState({ id: '', name: '', displayName: '', email: '', date: new Date().toISOString().split('T')[0] });
    const [idSuggestions, setIdSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);

    // Results State
    const [selectedExamForResult, setSelectedExamForResult] = useState<string | null>(null);
    const [selectedSubjectForResult, setSelectedSubjectForResult] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [importedResults, setImportedResults] = useState<{ studentId: string; grade: string; marks: number; specialNote?: string }[] | null>(null);
    const [isImportingResults, setIsImportingResults] = useState(false);
    const [releasedSubjects, setReleasedSubjects] = useState<string[]>([]);
    const mapGradeToMarks = (grade: string) => {
        switch (grade.toUpperCase()) {
            case 'A+': return 90;
            case 'A': return 80;
            case 'A-': return 75;
            case 'B+': return 70;
            case 'B': return 65;
            case 'B-': return 60;
            case 'C+': return 55;
            case 'C': return 50;
            case 'C-': return 45;
            case 'D+': return 40;
            case 'D': return 35;
            default: return 25;
        }
    };

    const isGradeLower = (studentGrade: string, minGrade: string): boolean => {
        if (!minGrade || minGrade.toUpperCase() === 'NONE') return false;
        if (!studentGrade || studentGrade.toUpperCase() === 'N/A' || studentGrade.toUpperCase() === 'PENDING') return false;
        const gradesOrder = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'E', 'F'];
        const sIndex = gradesOrder.indexOf(studentGrade.toUpperCase().trim());
        const mIndex = gradesOrder.indexOf(minGrade.toUpperCase().trim());
        if (sIndex === -1) return false;
        if (mIndex === -1) return false;
        return sIndex > mIndex;
    };

    const handleMinGradeChange = (newMinGrade: string) => {
        setMinRepeatGrade(newMinGrade);
        if (importedResults) {
            const updated = importedResults.map(r => {
                if (r.grade !== 'N/A') {
                    const isLower = isGradeLower(r.grade, newMinGrade);
                    if (isLower && (!r.specialNote || r.specialNote === 'Reattempt Required')) {
                        return { ...r, specialNote: 'Reattempt Required' };
                    } else if (!isLower && r.specialNote === 'Reattempt Required') {
                        return { ...r, specialNote: '' };
                    }
                }
                return r;
            });
            setImportedResults(updated);
        }
    };

    const getEligibleStudentsForResults = () => {
        if (!selectedExamForResult || !selectedSubjectForResult) {
            return [];
        }

        const isForSubject = (subjName: string, selectedSubName: string) => {
            if (!subjName || !selectedSubName) return false;
            const cleanSubj = subjName.toLowerCase().trim();
            const cleanSelected = selectedSubName.toLowerCase().trim();
            return cleanSubj === cleanSelected || cleanSubj.includes(cleanSelected) || cleanSelected.includes(cleanSubj);
        };

        const getStudentDetails = (studentNumber: string) => {
            const enrolled = enrolledStudents.find(s => s.id === studentNumber);
            if (enrolled) return {
                id: studentNumber,
                name: enrolled.name,
                displayName: enrolled.displayName || enrolled.name,
                email: enrolled.email
            };

            const real = realStudents.find(s => s.student_number === studentNumber || String(s.id) === studentNumber);
            if (real) {
                return {
                    id: studentNumber,
                    name: real.full_name || real.name || 'Student',
                    displayName: real.display_name || real.fullName || real.name || 'Student',
                    email: real.email || ''
                };
            }

            return {
                id: studentNumber,
                name: 'Student ' + studentNumber,
                displayName: 'Student ' + studentNumber,
                email: ''
            };
        };

        const examTitle = exams.find(e => e.id === selectedExamForResult)?.title || '';

        const regularIds = new Set<string>();
        const postponementIds = new Set<string>();
        const reattemptIds = new Set<string>();

        const studentNotes = new Map<string, string>();
        const studentAttempts = new Map<string, number>();

        // 1. Regular exam applications (must be approved, real application, and matching this exam + subject)
        approvalRequests.forEach(req => {
            if (req.status === 'approved' && req.isRealApplication) {
                const isExamMatch = req.examKey?.toString() === selectedExamForResult.toString() ||
                    (examTitle && req.raw?.exam_title?.toLowerCase().trim() === examTitle.toLowerCase().trim());
                if (isExamMatch) {
                    const sub = req.subjects?.find((s: any) => isForSubject(s.name || s, selectedSubjectForResult));
                    if (sub && (sub.taken || sub.checked || sub.taken === undefined)) {
                        regularIds.add(req.studentNumber);
                        studentNotes.set(req.studentNumber, "");
                        studentAttempts.set(req.studentNumber, Number(sub.attempt || req.attempt || 1));
                    }
                }
            }
        });

        // 2. Postponement requests (must be approved and assigned to this exam + include this subject)
        waitlistPostponements.forEach((req: any) => {
            if (req.status === 'approved' || req.status === 'assigned') {
                const isAssigned = req.raw?.assigned_exam_id?.toString() === selectedExamForResult.toString();
                const titleMatches = req.examTitle === examTitle || req.subject?.includes(examTitle);

                if (isAssigned || (req.status === 'approved' && titleMatches)) {
                    const subjects = req.raw?.exams || [];
                    const matchesSubject = subjects.length === 0 || subjects.some((s: string) => isForSubject(s, selectedSubjectForResult));
                    if (matchesSubject) {
                        postponementIds.add(req.studentNumber);
                        studentNotes.set(req.studentNumber, "");
                        studentAttempts.set(req.studentNumber, Number(req.raw?.attempt || req.attempt || 1));
                    }
                }
            }
        });

        // 3. Reattempt requests (must be approved and assigned to this exam + match this subject)
        waitlistReattempts.forEach((req: any) => {
            if (req.status === 'approved' || req.status === 'assigned') {
                const isAssigned = req.raw?.assigned_exam_id?.toString() === selectedExamForResult.toString();
                const titleMatches = req.examTitle === examTitle;
                const isExamMatch = isAssigned || (req.status === 'approved' && titleMatches);

                const subjectName = req.raw?.subject?.name || req.subject?.name || req.subject || '';
                const matchesSubject = isForSubject(subjectName, selectedSubjectForResult);

                if (isExamMatch && matchesSubject) {
                    reattemptIds.add(req.studentNumber);
                    studentNotes.set(req.studentNumber, req.reason || "");
                    studentAttempts.set(req.studentNumber, Number(req.raw?.attempt || req.attempt || 2));
                }
            }
        });

        // Also check approvalRequests for reattempts type
        approvalRequests.forEach(req => {
            if (req.status === 'approved' && req.type === 'reattempts') {
                const isExamMatch = req.examKey?.toString() === selectedExamForResult.toString() ||
                    (examTitle && req.raw?.exam_title?.toLowerCase().trim() === examTitle.toLowerCase().trim());
                if (isExamMatch) {
                    const sub = req.subjects?.find((s: any) => isForSubject(s.name || s, selectedSubjectForResult));
                    if (sub) {
                        reattemptIds.add(req.studentNumber);
                        studentNotes.set(req.studentNumber, req.reason || "");
                        studentAttempts.set(req.studentNumber, Number(sub.attempt || req.attempt || 2));
                    }
                }
            }
        });

        // Remove overlapping IDs to avoid double listing (prioritize: Reattempt > Postponement > Regular)
        postponementIds.forEach(id => regularIds.delete(id));
        reattemptIds.forEach(id => { regularIds.delete(id); postponementIds.delete(id); });

        const categorized: { id: string; name: string; displayName: string; email: string; studentType: 'Regular' | 'Postponement' | 'Reattempt'; attempt: number; specialNote: string }[] = [];

        // Sorting each category in ascending order by Student ID / registration number
        const sortedRegular = Array.from(regularIds).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
        const sortedPostponement = Array.from(postponementIds).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
        const sortedReattempt = Array.from(reattemptIds).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

        sortedRegular.forEach(id => {
            const details = getStudentDetails(id);
            categorized.push({
                ...details,
                studentType: 'Regular',
                attempt: studentAttempts.get(id) || 1,
                specialNote: studentNotes.get(id) || ''
            });
        });

        sortedPostponement.forEach(id => {
            const details = getStudentDetails(id);
            categorized.push({
                ...details,
                studentType: 'Postponement',
                attempt: studentAttempts.get(id) || 1,
                specialNote: studentNotes.get(id) || ''
            });
        });

        sortedReattempt.forEach(id => {
            const details = getStudentDetails(id);
            categorized.push({
                ...details,
                studentType: 'Reattempt',
                attempt: studentAttempts.get(id) || 2,
                specialNote: studentNotes.get(id) || ''
            });
        });

        return categorized;
    };

    const [minRepeatGrade, setMinRepeatGrade] = useState('D');
    const [activeResultTab, setActiveResultTab] = useState<'Regular' | 'Postponement' | 'Reattempt'>('Regular');
    const [resultSearchQuery, setResultSearchQuery] = useState('');

    useEffect(() => {
        setActiveResultTab('Regular');
        setResultSearchQuery('');
    }, [selectedExamForResult, selectedSubjectForResult]);

    useEffect(() => {
        const fetchResults = async () => {
            if (!selectedExamForResult) {
                setReleasedSubjects([]);
                return;
            }
            try {
                const results = await examResultService.getByExam(selectedExamForResult);
                const subjectsWithResults = results.map((r: any) => r.subject?.name).filter(Boolean);
                setReleasedSubjects(subjectsWithResults);

                if (selectedSubjectForResult) {
                    const matchedResult = results.find((r: any) => r.subject?.name === selectedSubjectForResult);
                    const eligible = getEligibleStudentsForResults();
                    if (matchedResult) {
                        setMinRepeatGrade(matchedResult.min_repeat_grade || 'D');
                        const dbGrades = matchedResult.grades.map((g: any) => ({
                            studentId: g.user?.student_number || String(g.user_id),
                            grade: g.grade,
                            marks: mapGradeToMarks(g.grade),
                            specialNote: g.special_note || ''
                        }));
                        const merged = eligible.map(s => {
                            const existing = dbGrades.find((db: any) => db.studentId === s.id);
                            if (existing) {
                                const isLower = isGradeLower(existing.grade, matchedResult.min_repeat_grade || 'D');
                                return {
                                    ...existing,
                                    specialNote: existing.specialNote || (isLower ? 'Reattempt Required' : '') || s.specialNote || ''
                                };
                            } else {
                                return {
                                    studentId: s.id,
                                    grade: 'N/A',
                                    marks: 0,
                                    specialNote: s.specialNote || ''
                                };
                            }
                        });
                        setImportedResults(merged);
                    } else {
                        const mapped = eligible.map(s => ({
                            studentId: s.id,
                            grade: 'N/A',
                            marks: 0,
                            specialNote: s.specialNote || ''
                        }));
                        setImportedResults(mapped);
                        setMinRepeatGrade('D');
                    }
                }
            } catch (err) {
                console.error("Failed to fetch exam results from database:", err);
            }
        };
        fetchResults();
    }, [selectedExamForResult, selectedSubjectForResult, id, enrolledStudents, approvalRequests, waitlistPostponements, waitlistReattempts]);

    useEffect(() => {
        if (selectedExamForResult && !selectedSubjectForResult) {
            const selectedExam = exams.find(e => e.id === selectedExamForResult);
            if (selectedExam) {
                const allSubjects = (selectedExam as any).subjects && (selectedExam as any).subjects.length > 0
                    ? (selectedExam as any).subjects
                    : (course?.level === 'Diploma' ? (diplomaSubjects || []) : (semesters?.flatMap(s => s.subjects) || []));

                if (allSubjects && allSubjects.length <= 1) {
                    const name = allSubjects[0]?.name || 'Exam Results';
                    setSelectedSubjectForResult(name);
                }
            }
        }
    }, [selectedExamForResult, selectedSubjectForResult, exams, course, semesters, diplomaSubjects]);

    const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
    const [editScore, setEditScore] = useState<string>('');
    const [editGrade, setEditGrade] = useState<string>('');
    const [editSpecialNote, setEditSpecialNote] = useState<string>('');

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved': return { bg: '#D1FAE5', text: '#059669' };
            case 'rejected': return { bg: '#FEE2E2', text: '#DC2626' };
            case 'pending': return { bg: '#FEF3C7', text: '#D97706' };
            default: return { bg: '#F1F5F9', text: '#475569' };
        }
    };

    const getDisplayStatus = (req: any) => {
        if (!req || !req.status) return 'pending';
        const statusLower = req.status.toLowerCase();
        if (statusLower === 'approved') return 'approved';
        if (statusLower === 'rejected') return 'rejected';
        if (statusLower === 'pending') {
            const level = req.rawApp ? req.rawApp.approval_level : (req.approval_level || 0);
            if (userRole === 'secretary') {
                return level >= 1 ? 'approved' : 'pending';
            }
            if (userRole === 'coordinator') {
                return level >= 2 ? 'approved' : 'pending';
            }
            if (userRole === 'director') {
                return level >= 3 ? 'approved' : 'pending';
            }
            return 'pending';
        }
        return req.status.toLowerCase();
    };

    const handleStartEdit = (id: string, result: any, student: any) => {
        setEditingStudentId(id);
        setEditScore(result ? result.marks.toString() : '0');
        setEditGrade(result ? result.grade : 'F');
        setEditSpecialNote(result && result.specialNote !== undefined ? result.specialNote : (student.specialNote || ''));
    };

    const handleSaveEdit = (studentId: string) => {
        let currentResults = importedResults;
        if (!currentResults) {
            const students = getEligibleStudentsForResults();
            currentResults = students.map(s => ({
                studentId: s.id,
                grade: 'N/A',
                marks: 0,
                specialNote: s.specialNote || ''
            }));
        }

        const isLower = isGradeLower(editGrade, minRepeatGrade);
        const resolvedNote = isLower ? 'Reattempt Required' : (editSpecialNote === 'Reattempt Required' ? '' : editSpecialNote);

        const updated = currentResults.map(r =>
            r.studentId === studentId
                ? { ...r, marks: parseInt(editScore) || 0, grade: editGrade, specialNote: resolvedNote }
                : r
        );
        setImportedResults(updated);
        setEditingStudentId(null);
    };

    const handleReleaseResults = async () => {
        if (!selectedExamForResult || !selectedSubjectForResult || !importedResults) {
            toast.error("Invalid state or results not initialized.");
            return;
        }

        // 1. Find subject id
        let subjectId: number | null = null;
        if (course) {
            if (course.semesters) {
                for (const sem of course.semesters) {
                    const found = sem.subjects.find(s => s.name === selectedSubjectForResult);
                    if (found) {
                        subjectId = Number((found as any).id);
                        break;
                    }
                }
            }
            if (!subjectId && course.diplomaSubjects) {
                const found = course.diplomaSubjects.find(s => s.name === selectedSubjectForResult);
                if (found) {
                    subjectId = Number((found as any).id);
                }
            }
        }

        if (!subjectId) {
            toast.error("Selected subject not found in course subjects list.");
            return;
        }

        // 2. Map studentId to user_id
        const mappedGrades = importedResults.map(r => {
            const studentUser = realStudents.find(
                s => s.student_number === r.studentId || String(s.id) === r.studentId || s.email === r.studentId
            );
            const userId = studentUser ? studentUser.id : (Number(r.studentId) || null);
            return {
                user_id: userId ? Number(userId) : null,
                grade: r.grade,
                special_note: r.specialNote || null
            };
        }).filter(g => g.user_id !== null && g.grade !== 'N/A') as { user_id: number; grade: string; special_note: string | null }[];

        const selectedExam = exams.find(e => e.id === selectedExamForResult);
        const semesterVal = (selectedExam as any)?.semester?.toString() || '1';

        try {
            // 3. Save to database
            await examResultService.create({
                course_id: Number(id),
                subject_id: subjectId,
                exam_id: Number(selectedExamForResult),
                batch: selectedBatch || '2024/01',
                semester: semesterVal,
                min_repeat_grade: minRepeatGrade,
                grades: mappedGrades
            });

            // 4. Update exam status on database
            const nextReleasedSubjects = [...new Set([...releasedSubjects, selectedSubjectForResult])];
            setReleasedSubjects(nextReleasedSubjects);

            const allSubjects = (selectedExam && (selectedExam as any).subjects && (selectedExam as any).subjects.length > 0)
                ? (selectedExam as any).subjects
                : (course?.level === 'Diploma' ? (diplomaSubjects || []) : (semesters.flatMap(s => s.subjects) || []));
            const allReleased = nextReleasedSubjects.length >= allSubjects.length;
            const examStatus = allReleased ? 'Results Released' : 'Result Updated';

            if (selectedExam) {
                await examService.update(selectedExamForResult, {
                    title: selectedExam.title,
                    batch_name: selectedExam.batch_name || selectedExam.batch || '',
                    deadline: selectedExam.deadline,
                    date: selectedExam.date,
                    fee: parseFloat(selectedExam.fee.toString()) || 0,
                    type: selectedExam.type,
                    status: examStatus
                });

                setExams(exams.map(e => e.id === selectedExamForResult ? { ...e, status: examStatus } : e));
            }

            if (allReleased) {
                toast.success('All results released successfully! Exam status updated to Results Released.');
            } else {
                toast.success(`Results for ${selectedSubjectForResult} updated! Exam status updated to Result Updated.`);
            }
        } catch (err: any) {
            console.error("Failed to release results:", err);
            toast.error(err.response?.data?.message || "Failed to save results to database.");
        }
    };

    const handleIdChange = (val: string) => {
        setEnrollForm({ ...enrollForm, id: val, name: '', displayName: '', email: '' });

        const allStudents = realStudents;

        if (!val) {
            setIdSuggestions(allStudents);
            setShowSuggestions(true);
        } else {
            const matches = allStudents.filter(u => {
                const sNumber = u.student_number || u.studentNumber || '';
                const fName = u.full_name || u.fullName || '';
                const email = u.email || '';
                return sNumber.toLowerCase().includes(val.toLowerCase()) ||
                    fName.toLowerCase().includes(val.toLowerCase()) ||
                    email.toLowerCase().includes(val.toLowerCase());
            });
            setIdSuggestions(matches);
            setShowSuggestions(true);
        }
    };

    const handleSelectStudent = (u: any) => {
        setEnrollForm({
            ...enrollForm,
            id: u.student_number || u.studentNumber || String(u.id),
            name: u.full_name || u.fullName,
            displayName: u.display_name || u.displayName || '',
            email: u.email
        });
        setShowSuggestions(false);
    };

    useEffect(() => {
        if (course) {
            setCommonData({
                name: course.title,
                code: course.code,
                enrollments: course.totalStudents.toString(),
                duration: course.duration,
                secretary: course.secretary || '',
                status: course.intakeStatus,
                registrationDeadline: '',
                lecturerId: undefined,
                lecturerName: ''
            });
            setCourseType(course.level as any);

            if (course.level === 'Degree' || course.level === 'Higher National Diploma') {
                const initialSemTable = (course as any).semesters || Array(course.level === 'Degree' ? 8 : 4).fill(null).map(() => ({
                    subjects: [{ code: '', name: 'Core Subject', credits: '3' }]
                }));
                setSemesters(initialSemTable);
                setSemesterCount(initialSemTable.length);
            } else if (course.level === 'Diploma') {
                setDiplomaSubjects((course as any).diplomaSubjects || [{ code: '', name: 'Intro to IT', credits: '4' }]);
            }
        }
    }, [course]);

    // Sync batch data to form when entering details section
    useEffect(() => {
        if (selectedBatch && activeSection === 'details') {
            const currentBatch = batches.find(b => b.name === selectedBatch);
            if (currentBatch) {
                setCommonData(prev => ({
                    ...prev,
                    name: currentBatch.name,
                    code: (currentBatch as any).code || '',
                    enrollments: currentBatch.maxEnrollments || '',
                    status: currentBatch.status || 'Open',
                    registrationDeadline: currentBatch.registrationDeadline || '',
                    lecturerId: (currentBatch as any).lecturerId || undefined,
                    lecturerName: (currentBatch as any).lecturerName || ''
                }));

                // Set batch subjects
                if (currentBatch.subjects && currentBatch.subjects.length > 0) {
                    setBatchSubjects(currentBatch.subjects);
                } else {
                    const allSubjects = courseType === 'Diploma' ? diplomaSubjects : semesters.flatMap(s => s.subjects);
                    setBatchSubjects(allSubjects.filter(s => s.name).map(s => ({
                        name: s.name,
                        credits: s.credits,
                        lecturer: '',
                        lecturerId: undefined,
                        subjectId: s.id || undefined
                    })));
                }
            }
        }
    }, [selectedBatch, activeSection, batches, courseType, diplomaSubjects, semesters]);

    const lecturersList = realLecturers;

    const handleCommonChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setCommonData({ ...commonData, [e.target.name]: e.target.value });
    };

    const handleSemesterCountChange = (count: number) => {
        setSemesterCount(count);
        const newSemesters = [...semesters];
        if (count > semesters.length) {
            for (let i = semesters.length; i < count; i++) {
                newSemesters.push({ subjects: [{ code: '', name: '', credits: '' }] });
            }
        } else {
            newSemesters.splice(count);
        }
        setSemesters(newSemesters);
    };

    const addSubject = (semIndex: number) => {
        const newSemesters = [...semesters];
        newSemesters[semIndex].subjects.push({ code: '', name: '', credits: '' });
        setSemesters(newSemesters);
    };

    const removeSubject = (semIndex: number, subIndex: number) => {
        setConfirmConfig({
            show: true,
            title: 'Delete Subject',
            message: 'Are you sure you want to remove this subject from the curriculum?',
            action: () => {
                const newSemesters = [...semesters];
                newSemesters[semIndex].subjects.splice(subIndex, 1);
                setSemesters(newSemesters);
                setConfirmConfig(prev => ({ ...prev, show: false }));
            }
        });
    };

    const updateSubject = (semIndex: number, subIndex: number, field: keyof Subject, value: string) => {
        const newSemesters = [...semesters];
        newSemesters[semIndex].subjects[subIndex][field] = value;
        setSemesters(newSemesters);
    };

    const updateDiplomaSubject = (idx: number, field: keyof Subject, value: string) => {
        const newSubs = [...diplomaSubjects];
        newSubs[idx][field] = value;
        setDiplomaSubjects(newSubs);
    };

    const updateBatchSubjectLecturer = (subjectName: string, lecturerId: string) => {
        const selectedLecturer = lecturersList.find((l: any) => l.id?.toString() === lecturerId);
        const lecturerName = selectedLecturer ? (selectedLecturer.full_name || selectedLecturer.fullName || '') : '';
        setBatchSubjects(prev => {
            const newSubs = [...prev];
            const idx = newSubs.findIndex(bs => bs.name === subjectName);
            if (idx >= 0) {
                newSubs[idx].lecturer = lecturerName;
                newSubs[idx].lecturerId = lecturerId || undefined;
            } else {
                newSubs.push({ name: subjectName, credits: '3', lecturer: lecturerName, lecturerId: lecturerId || undefined });
            }
            return newSubs;
        });
    };

    const handleUpdateCourse = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedBatch) {
            const targetBatch = batches.find(b => b.name === selectedBatch);
            if (targetBatch && targetBatch.id) {
                try {
                    const payload: any = {
                        name: commonData.name,
                        start_date: targetBatch.startDate,
                        registration_deadline: commonData.registrationDeadline || null,
                        max_enrollments: parseInt(commonData.enrollments) || 50,
                        subtitle: targetBatch.subtitle || 'Academic Intake Phase',
                        status: commonData.status,
                        instructor_id: commonData.lecturerId || null
                    };
                    // Include subject-lecturer assignments if any subjects have IDs
                    const subjectsWithIds = batchSubjects.filter(bs => bs.subjectId);
                    if (subjectsWithIds.length > 0) {
                        payload.subjects = subjectsWithIds.map(bs => ({
                            subject_id: bs.subjectId,
                            lecturer_id: bs.lecturerId || null
                        }));
                    }
                    const updated = await batchService.update(id!, targetBatch.id, payload);

                    const updatedBatches = batches.map(b => {
                        if (b.id === targetBatch.id) {
                            return {
                                ...b,
                                name: updated.name,
                                maxEnrollments: updated.max_enrollments.toString(),
                                status: updated.status,
                                registrationDeadline: updated.registration_deadline || '',
                                lecturerId: updated.instructor_id || undefined,
                                lecturerName: updated.instructor?.full_name || '',
                                subjects: batchSubjects
                            };
                        }
                        return b;
                    });

                    setBatches(updatedBatches);

                    if (commonData.name !== selectedBatch) {
                        setSelectedBatch(commonData.name);
                    }
                    toast.success('Batch Configuration Updated successfully in database!');
                } catch (err: any) {
                    console.error("Failed to update batch:", err);
                    toast.error(err.response?.data?.message || 'Failed to update batch in database.');
                    return;
                }
            } else {
                // If it's a mock batch (no id), just update state
                const updatedBatches = batches.map(b => {
                    if (b.name === selectedBatch) {
                        return {
                            ...b,
                            name: commonData.name,
                            maxEnrollments: commonData.enrollments,
                            status: commonData.status,
                            registrationDeadline: commonData.registrationDeadline,
                            subjects: batchSubjects
                        };
                    }
                    return b;
                });
                setBatches(updatedBatches);
                if (commonData.name !== selectedBatch) {
                    setSelectedBatch(commonData.name);
                }
                toast.success('Batch Configuration Updated (Local Only).');
            }
        } else {
            toast.success('Course Updated Successfully!');
        }

        setActiveSection(null);
    };


    const handleDeleteExam = (id: string) => {
        setConfirmConfig({
            show: true,
            title: 'Delete Examination',
            message: 'This will permanently remove the examination and all associated settings. Continue?',
            action: async () => {
                try {
                    await examService.delete(id);
                    setExams(exams.filter(ex => ex.id !== id));
                    toast.success('Examination deleted successfully.');
                } catch (err: any) {
                    console.error('Failed to delete exam:', err);
                    toast.error(err.response?.data?.message || 'Failed to delete examination from database.');
                } finally {
                    setConfirmConfig(prev => ({ ...prev, show: false }));
                }
            }
        });
    };

    const handleBack = () => {
        if (activeSection === 'results' && selectedSubjectForResult) {
            const selectedExam = exams.find(e => e.id === selectedExamForResult);
            const allSubjects = (selectedExam && (selectedExam as any).subjects && (selectedExam as any).subjects.length > 0)
                ? (selectedExam as any).subjects
                : (course?.level === 'Diploma' ? (diplomaSubjects || []) : (semesters?.flatMap(s => s.subjects) || []));

            if (allSubjects.length <= 1) {
                setSelectedSubjectForResult(null);
                setSelectedExamForResult(null);
                setImportedResults(null);
            } else {
                setSelectedSubjectForResult(null);
                setImportedResults(null);
            }
        } else if (activeSection === 'results' && selectedExamForResult) {
            setSelectedExamForResult(null);
            setImportedResults(null);
        } else if (activeSection === 'materials' && materialsViewState === 'resources') {
            if (['Certificate', 'Advanced Certificate'].includes(courseType)) {
                if (userRole === 'lecturer') {
                    setSelectedBatch(null);
                } else {
                    setActiveSection(null);
                }
            } else {
                setMaterialsViewState('modules');
                setMaterialsSelectedModuleId(null);
            }
        } else if (activeSection === 'materials' && materialsViewState === 'modules') {
            if (userRole === 'lecturer' && filteredMaterialsSemesters.length === 1) {
                setSelectedBatch(null);
            } else {
                setMaterialsViewState('semesters');
                setMaterialsSelectedSemesterId(null);
            }
        } else if (activeSection) {
            if (activeSection === 'materials') {
                setMaterialsViewState('semesters');
                setMaterialsSelectedSemesterId(null);
                setMaterialsSelectedModuleId(null);
            }
            if (userRole === 'lecturer') {
                setSelectedBatch(null);
            } else {
                setActiveSection(null);
            }
        } else if (selectedBatch) {
            setSelectedBatch(null);
        } else {
            navigate(course ? `/admin/courses?level=${encodeURIComponent(course.level)}` : '/admin/courses');
        }
    };

    const handleAddStudent = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!enrollForm.id || !enrollForm.name || !enrollForm.email) {
            toast.error('Please fill out all required student details.');
            return;
        }

        // Check if student ID already enrolled
        if (enrolledStudents.some(s => s.id === enrollForm.id)) {
            toast.error('This student is already enrolled in this course.');
            return;
        }

        try {
            const response = await courseService.enrollStudent(id!, {
                student_id: enrollForm.id,
                batch: selectedBatch || undefined
            });

            const newStudent = response.student;
            const updatedStudents = [newStudent, ...enrolledStudents];
            setEnrolledStudents(updatedStudents);

            toast.success('Student Enrollment Added Successfully!');
            setShowStudentModal(false);
            setEnrollForm({ id: '', name: '', displayName: '', email: '', date: new Date().toISOString().split('T')[0] });
        } catch (err: any) {
            console.error('Failed to enroll student in database:', err);
            toast.error('Failed to enroll student. Please try again.');
            setShowStudentModal(false);
            setEnrollForm({ id: '', name: '', displayName: '', email: '', date: new Date().toISOString().split('T')[0] });
        }
    };

    const handleOpenAddWaitlistModal = () => {
        setWaitlistForm({
            type: 'postponement',
            applicationId: 'P-',
            studentRegNo: '',
            studentName: '',
            originBatch: '',
            examTitle: '',
            examId: '',
            subjectId: '',
            reason: '',
            approved: false,
            selectedSubjects: []
        });
        setRegNoSuggestions([]);
        setShowRegNoSuggestions(false);
        setShowWaitlistAddModal(true);
    };

    const handleOpenEditWaitlistModal = (record: any, type: 'postponement' | 'reattempt') => {
        const studentObj = enrolledStudents.find(s => s.id === record.studentNumber);

        let initialExamId = '';
        const possibleExamTitle = record.examTitle || record.exam_title || record.raw?.exam_title || record.subject;

        if (possibleExamTitle) {
            const matchingExam = exams.find(e => e.title === possibleExamTitle);
            if (matchingExam) initialExamId = matchingExam.id.toString();
        }

        if (!initialExamId && type === 'reattempt' && record.raw?.subject_id) {
            const matchingExam = exams.find(e =>
                e.subjects?.some((sub: any) => sub.id?.toString() === record.raw.subject_id.toString())
            );
            if (matchingExam) {
                initialExamId = matchingExam.id.toString();
            }
        }

        setEditingWaitlistRecord({ ...record, type });
        setWaitlistForm({
            type,
            applicationId: record.application_id || '',
            studentRegNo: record.studentNumber || '',
            studentName: record.studentName || '',
            originBatch: record.batch || record.originBatch || studentObj?.batch || '',
            examTitle: record.examTitle || record.subject || record.exam_title || '',
            examId: initialExamId,
            subjectId: type === 'reattempt' ? record.raw?.subject_id?.toString() || '' : '',
            reason: record.reason || '',
            approved: (record.status || '').toLowerCase() === 'approved',
            selectedSubjects: type === 'reattempt' ? (record.subject ? [record.subject] : []) : (record.raw?.exams || [])
        });
        setShowWaitlistEditModal(true);
    };

    const handleRegNoChange = (val: string) => {
        setWaitlistForm(prev => ({
            ...prev,
            studentRegNo: val,
            studentName: '',
            originBatch: '',
            examTitle: '',
            examId: '',
            subjectId: '',
            selectedSubjects: []
        }));

        if (!val) {
            setRegNoSuggestions([]);
            setShowRegNoSuggestions(false);
        } else {
            const filtered = enrolledStudents.filter(s =>
                s.id.toLowerCase().includes(val.toLowerCase()) ||
                s.name.toLowerCase().includes(val.toLowerCase())
            );
            setRegNoSuggestions(filtered);
            setShowRegNoSuggestions(true);
        }
    };

    const handleSelectSuggestedStudent = (student: EnrolledStudent) => {
        setWaitlistForm(prev => ({
            ...prev,
            studentRegNo: student.id,
            studentName: student.name,
            originBatch: student.batch || '',
            selectedSubjects: []
        }));
        setShowRegNoSuggestions(false);
    };

    const handleSaveWaitlistRecord = async (e: React.FormEvent, isEdit = false) => {
        e.preventDefault();

        const type = waitlistForm.type;
        const appID = waitlistForm.applicationId.trim().toUpperCase();

        if (!appID) {
            toast.error('Application ID is required');
            return;
        }

        if (type === 'postponement' && !appID.startsWith('P-')) {
            toast.error('Postponement Application ID must start with P- (e.g., P-1234)');
            return;
        }
        if (type === 'reattempt' && !appID.startsWith('R-')) {
            toast.error('Reattempt Application ID must start with R- (e.g., R-1234)');
            return;
        }

        if (!waitlistForm.studentRegNo) {
            toast.error('Student Registration Number is required');
            return;
        }

        const matchedRealStudent = realStudents.find(
            rs => rs.student_number === waitlistForm.studentRegNo || rs.id?.toString() === waitlistForm.studentRegNo
        );

        if (!matchedRealStudent) {
            toast.error('Could not map the selected registration number to a database student.');
            return;
        }

        if (waitlistForm.selectedSubjects.length === 0) {
            toast.error('Please select at least one subject.');
            return;
        }

        const userId = matchedRealStudent.id;
        const status = waitlistForm.approved ? 'approved' : 'pending';

        const findSubjectIdInCourse = (subjectLabel: string) => {
            if (course?.semesters) {
                for (const sem of course.semesters) {
                    const found = sem.subjects.find((sub: any) => {
                        const label = sub.code ? `${sub.code} - ${sub.name}` : sub.name;
                        return label === subjectLabel || sub.name === subjectLabel || sub.code === subjectLabel;
                    });
                    if (found) return (found as any).id;
                }
            }
            if (course?.diplomaSubjects) {
                const found = course.diplomaSubjects.find((sub: any) => {
                    const label = sub.code ? `${sub.code} - ${sub.name}` : sub.name;
                    return label === subjectLabel || sub.name === subjectLabel || sub.code === subjectLabel;
                });
                if (found) return (found as any).id;
            }
            return null;
        };

        setIsSavingWaitlist(true);
        try {
            if (type === 'postponement') {
                const examText = waitlistForm.examTitle || (waitlistForm.examId ? exams.find(e => e.id.toString() === waitlistForm.examId.toString())?.title : '') || 'Exam';
                if (!examText) {
                    toast.error('Please select the examination.');
                    setIsSavingWaitlist(false);
                    return;
                }

                const payload = {
                    user_id: userId,
                    application_id: appID,
                    course_id: parseInt(id!),
                    exam_title: examText,
                    reason: waitlistForm.reason,
                    batch: waitlistForm.originBatch,
                    status: waitlistForm.examId ? 'assigned' : status,
                    exams: waitlistForm.selectedSubjects,
                    assigned_exam_id: waitlistForm.examId ? parseInt(waitlistForm.examId) : null
                };

                if (isEdit && editingWaitlistRecord) {
                    await postponementRequestService.update(editingWaitlistRecord.id, payload);
                    toast.success('Postponement request updated successfully');
                } else {
                    await postponementRequestService.create(payload);
                    toast.success('Postponement request added to waitlist');
                }
            } else {
                const examText = waitlistForm.examTitle || (waitlistForm.examId ? exams.find(e => e.id.toString() === waitlistForm.examId.toString())?.title : '') || 'Exam';
                if (isEdit && editingWaitlistRecord) {
                    // Editing an existing single reattempt request
                    const subLabel = waitlistForm.selectedSubjects[0];
                    const subjId = findSubjectIdInCourse(subLabel);
                    if (!subjId) {
                        toast.error('Could not find database ID for selected subject.');
                        setIsSavingWaitlist(false);
                        return;
                    }

                    const payload = {
                        user_id: userId,
                        application_id: appID,
                        course_id: parseInt(id!),
                        subject_id: subjId,
                        exam_title: examText,
                        reason: waitlistForm.reason,
                        batch: waitlistForm.originBatch,
                        status: waitlistForm.examId ? 'assigned' : status,
                        assigned_exam_id: waitlistForm.examId ? parseInt(waitlistForm.examId) : null
                    };
                    await reattemptRequestService.update(editingWaitlistRecord.id, payload);
                    toast.success('Reattempt request updated successfully');
                } else {
                    // Creating new reattempt request(s) - one per selected subject
                    for (let i = 0; i < waitlistForm.selectedSubjects.length; i++) {
                        const subLabel = waitlistForm.selectedSubjects[i];
                        const subjId = findSubjectIdInCourse(subLabel);
                        if (!subjId) continue;

                        const codePart = subLabel.split(' - ')[0].trim().replace(/\s+/g, '');
                        const suffix = waitlistForm.selectedSubjects.length > 1 ? `-${codePart}` : '';
                        const payload = {
                            user_id: userId,
                            application_id: `${appID}${suffix}`,
                            course_id: parseInt(id!),
                            subject_id: subjId,
                            exam_title: examText,
                            reason: waitlistForm.reason,
                            batch: waitlistForm.originBatch,
                            status: waitlistForm.examId ? 'assigned' : status,
                            assigned_exam_id: waitlistForm.examId ? parseInt(waitlistForm.examId) : null
                        };
                        await reattemptRequestService.create(payload);
                    }
                    toast.success('Reattempt request(s) added to waitlist');
                }
            }

            setShowWaitlistAddModal(false);
            setShowWaitlistEditModal(false);
            setEditingWaitlistRecord(null);
            await loadAllCourseData(false);
        } catch (err: any) {
            console.error('Failed to save waitlist record:', err);
            toast.error(err.response?.data?.message || 'Failed to save waitlist record');
        } finally {
            setIsSavingWaitlist(false);
        }
    };

    const handleDeleteWaitlistRecord = async () => {
        if (!editingWaitlistRecord) return;

        setConfirmConfig({
            show: true,
            title: 'Confirm Delete',
            message: `Are you sure you want to delete the waitlist record ${editingWaitlistRecord.application_id}? This action cannot be undone.`,
            action: async () => {
                try {
                    if (editingWaitlistRecord.type === 'postponement') {
                        await postponementRequestService.delete(editingWaitlistRecord.id);
                    } else {
                        await reattemptRequestService.delete(editingWaitlistRecord.id);
                    }
                    toast.success('Waitlist record deleted successfully');
                    setShowWaitlistEditModal(false);
                    setEditingWaitlistRecord(null);
                    await loadAllCourseData(false);
                } catch (err) {
                    console.error('Failed to delete waitlist record:', err);
                    toast.error('Failed to delete waitlist record');
                } finally {
                    setConfirmConfig(prev => ({ ...prev, show: false }));
                }
            }
        });
    };

    if (isLoadingCourse) {
        return (
            <div className="cm-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                <div style={{ textAlign: 'center', color: '#64748B' }}>
                    <div style={{ width: '48px', height: '48px', border: '3px solid #E2E8F0', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                    <p style={{ fontWeight: 600 }}>Loading course...</p>
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="cm-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                <div style={{ textAlign: 'center', color: '#64748B' }}>
                    <BookOpen size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                    <h3 style={{ fontWeight: 700, color: '#1E293B', marginBottom: '8px' }}>Course Not Found</h3>
                    <p>The course you're looking for doesn't exist or has been removed.</p>
                    <button className="admin-btn-primary" style={{ marginTop: '20px' }} onClick={() => navigate('/admin/courses')}>
                        <ArrowLeft size={16} /> Back to Courses
                    </button>
                </div>
            </div>
        );
    }

    const filteredStudents = enrolledStudents
        .filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (s.displayName && s.displayName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                s.id.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesBatch = !selectedBatch || s.batch?.toString().trim().toLowerCase() === selectedBatch.toString().trim().toLowerCase();
            return matchesSearch && matchesBatch;
        })
        .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }));

    const filteredWaitlistPostponements = waitlistPostponements.filter(p =>
        p.status?.toString().toLowerCase() !== 'assigned' &&
        p.status?.toString().toLowerCase() !== 'rejected' &&
        (!selectedBatch || p.batch?.toString().trim().toLowerCase() === selectedBatch.toString().trim().toLowerCase())
    );
    const filteredWaitlistReattempts = waitlistReattempts.filter(r =>
        r.status?.toString().toLowerCase() !== 'assigned' &&
        r.status?.toString().toLowerCase() !== 'rejected' &&
        (!selectedBatch || r.batch?.toString().trim().toLowerCase() === selectedBatch.toString().trim().toLowerCase())
    );

    return (
        <div className="cm-container">
            <div style={{
                marginBottom: (activeSection === 'approvals_req' || activeSection === 'enrollment_req' || activeSection === 'waitlist') ? '8px' : '20px',
                display: 'flex',
                alignItems: 'stretch',
                gap: '8px'
            }}>
                <button className="am-back-btn" onClick={handleBack}>
                    <ArrowLeft size={20} />
                </button>
                <div className="admin-breadcrumb">
                    <span onClick={() => navigate(course ? `/admin/courses?level=${encodeURIComponent(course.level)}` : '/admin/courses')}>Course Management</span>
                    <ChevronRight size={14} />
                    <span className={!selectedBatch ? "current" : ""} onClick={() => {
                        _setSelectedBatch(null);
                        _setActiveSection(null);
                        updateNavigation(null, null);
                    }}>{course.title}</span>
                    {selectedBatch && (
                        <>
                            <ChevronRight size={14} />
                            <span className={!activeSection ? "current" : ""} onClick={() => setActiveSection(null)}>{selectedBatch}</span>
                        </>
                    )}
                    {activeSection && (
                        <>
                            <ChevronRight size={14} />
                            <span className="current">
                                {activeSection === 'details' && 'Batch Configuration'}
                                {activeSection === 'exams' && 'Examinations'}
                                {activeSection === 'results' && 'Results'}
                                {activeSection === 'students' && 'Students'}
                                {activeSection === 'materials' && 'Materials'}
                                {activeSection === 'announcements' && 'Announcements'}
                                {activeSection === 'enrollment_req' && 'Enrollments'}
                                {activeSection === 'approvals_req' && 'Approvals'}
                                {activeSection === 'waitlist' && 'Waitlist'}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {activeSection !== 'approvals_req' && activeSection !== 'enrollment_req' && activeSection !== 'waitlist' && (
                <div className="admin-page-header" style={{ marginBottom: '12px' }}>
                    <div>
                        <h1 className="admin-page-title">
                            {!selectedBatch && !activeSection && 'Select Batch'}
                            {selectedBatch && !activeSection && `${selectedBatch} Management`}
                            {activeSection === 'details' && 'Batch Configuration'}
                            {activeSection === 'announcements' && 'Announcements'}
                            {activeSection === 'exams' && 'Examinations'}
                            {activeSection === 'results' && 'Result Management'}
                            {activeSection === 'students' && 'Enrolled Students'}
                            {activeSection === 'materials' && 'Course Materials'}
                        </h1>
                        <p className="admin-page-subtitle" style={{ marginBottom: '0' }}>
                            {!selectedBatch && !activeSection && `Manage batches for ${course.title}. Click manage to open batch specific modules.`}
                            {selectedBatch && !activeSection && `Overview and management modules for ${course.title} - ${selectedBatch}.`}
                            {activeSection === 'details' && 'Update basic information, timelines and academic structures.'}
                            {activeSection === 'announcements' && 'Broadcast messages, updates, and important notices to the entire batch.'}
                            {activeSection === 'exams' && 'Create, update and coordinate examinations for this course.'}
                            {activeSection === 'results' && !selectedExamForResult && 'Select an examination from the list below to manage and import student results.'}
                            {activeSection === 'results' && selectedExamForResult && (
                                <>Managing results for <strong>{selectedSubjectForResult ? getSubjectDisplayName(selectedSubjectForResult) : (exams.find(e => e.id === selectedExamForResult)?.title || 'Selected Exam')}</strong></>
                            )}
                            {activeSection === 'students' && 'View and manage student profiles currently enrolled in this course.'}
                            {activeSection === 'materials' && 'Upload and organize lecture notes, videos, and other academic resources.'}
                        </p>
                    </div>

                    <div className="admin-header-actions">
                        {!selectedBatch && !activeSection && (userRole === 'secretary' || userRole === 'coordinator' || userRole === 'director') && (
                            <button className="create-exam-btn" onClick={() => setActiveSection('waitlist')} style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)', boxShadow: '0 4px 15px rgba(124,58,237,0.2)' }}>
                                <List size={18} /> Waitlist
                            </button>
                        )}

                        {activeSection === 'details' && (
                            <button className="create-exam-btn" onClick={handleUpdateCourse}>
                                <Save size={18} /> Save Changes
                            </button>
                        )}
                        {activeSection === 'exams' && (
                            <button className="create-exam-btn" onClick={() => navigate(`/admin/courses/manage/${id}/exams/create?batch=${selectedBatch || ''}`)}>
                                <Plus size={18} /> Create Exam
                            </button>
                        )}
                        {activeSection === 'students' && (
                            <>
                                {userRole !== 'secretary' && userRole !== 'lecturer' && (
                                    <button className="create-exam-btn" onClick={() => setShowStudentModal(true)}>
                                        <Plus size={18} /> Add Student
                                    </button>
                                )}
                                <button className="create-exam-btn" style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', boxShadow: '0 4px 15px rgba(2, 132, 199, 0.25)' }} onClick={() => {
                                    setIsExporting(true);
                                    setTimeout(() => {
                                        setIsExporting(false);
                                        toast.success('Student list exported successfully');
                                    }, 1500);
                                }}>
                                    <Download size={18} /> {isExporting ? 'Exporting...' : 'Export List'}
                                </button>
                            </>
                        )}
                        {activeSection === 'results' && selectedExamForResult && selectedSubjectForResult && (
                            <button
                                className="create-exam-btn"
                                style={{
                                    background: 'linear-gradient(135deg, #0D9488 0%, #10B981 100%)',
                                    boxShadow: '0 4px 15px rgba(13, 148, 136, 0.25)'
                                }}
                                onClick={handleReleaseResults}
                            >
                                <Send size={18} /> Release Results
                            </button>
                        )}
                    </div>
                </div>
            )}

            {!selectedBatch && !activeSection && (
                <div style={{ padding: '0 4px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                        {displayedBatches.map((batchObj) => {
                            const batch = batchObj.name;
                            const getBatchStatus = (statusLabel: string) => {
                                const normalized = (statusLabel || '').toLowerCase();
                                if (normalized === 'active' || normalized === 'ongoing') return { label: 'Active', color: '#10B981', bg: '#ECFDF5' };
                                if (normalized === 'upcoming' || normalized === 'scheduled') return { label: 'Upcoming', color: '#F59E0B', bg: '#FFFBEB' };
                                return { label: 'Close', color: '#EF4444', bg: '#FEE2E2' };
                            };
                            const status = getBatchStatus(batchObj.status);
                            const enrolledCount = enrolledStudents.filter(s => s.batch === batch || (!s.batch && displayedBatches.length === 1)).length;
                            const maxEnrollment = parseInt(batchObj.maxEnrollments, 10) || 50;

                            return (
                                <div key={batchObj.id || batch} style={{
                                    background: '#FFFFFF',
                                    borderRadius: '24px',
                                    padding: '28px',
                                    border: '1px solid #E2E8F0',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    minHeight: '340px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 10px 25px -10px rgba(0,0,0,0.05)',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    position: 'relative'
                                }} className="premium-batch-square-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                        <div style={{
                                            width: '50px', height: '50px',
                                            background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
                                            color: '#7C3AED', borderRadius: '14px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: '0 4px 10px rgba(124, 58, 237, 0.1)'
                                        }}>
                                            <Layers size={24} />
                                        </div>
                                        <div style={{
                                            background: status.bg, color: status.color,
                                            padding: '6px 12px', borderRadius: '20px',
                                            fontSize: '10px', fontWeight: 800,
                                            textTransform: 'uppercase', letterSpacing: '0.05em',
                                            border: `1px solid ${status.color}20`
                                        }}>{status.label}</div>
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontSize: '11px', fontWeight: 800,
                                            padding: '4px 10px', borderRadius: '6px',
                                            background: '#F1F5F9', color: '#64748B',
                                            textTransform: 'uppercase', display: 'inline-block',
                                            marginBottom: '12px', letterSpacing: '0.05em'
                                        }}>{batchObj.subtitle}</div>
                                        <h4 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: '0 0 24px 0', lineHeight: 1.3 }}>{batch}</h4>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ENROLLED STUDENTS</span>
                                                <span style={{ fontSize: '14px', fontWeight: 800, color: '#7C3AED' }}>{enrolledCount} / {maxEnrollment}</span>
                                            </div>
                                            {status.label === 'Upcoming' && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>REG. DEADLINE</span>
                                                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>
                                                        {batchObj.registrationDeadline
                                                            ? new Date(batchObj.registrationDeadline).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
                                                            : 'N/A'
                                                        }
                                                    </span>
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>COMMENCED DATE</span>
                                                <span style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>{new Date(batchObj.startDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '28px', display: 'flex', gap: '8px' }}>
                                        <button
                                            className="admin-btn-primary"
                                            style={{
                                                flex: 1, height: '48px', borderRadius: '12px',
                                                fontSize: '14px', fontWeight: 700,
                                                background: 'linear-gradient(to right, #7C3AED, #6D28D9)',
                                                border: 'none', color: '#FFFFFF', cursor: 'pointer',
                                                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                            onClick={() => setSelectedBatch(batch)}
                                        >
                                            Manage Modules
                                        </button>
                                        {userRole !== 'secretary' && userRole !== 'lecturer' && (
                                            <div style={{ position: 'relative' }}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenBatchMenu(openBatchMenu === batch ? null : batch);
                                                    }}
                                                    style={{
                                                        width: '48px', height: '48px', borderRadius: '12px',
                                                        background: '#F8FAFC', border: '1px solid #E2E8F0',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: '#64748B', cursor: 'pointer', transition: 'all 0.2s ease'
                                                    }}
                                                    className="hover-bg-slate"
                                                >
                                                    <MoreVertical size={20} />
                                                </button>

                                                {openBatchMenu === batch && (
                                                    <div style={{
                                                        position: 'absolute', top: '100%', right: '0', marginTop: '8px',
                                                        background: '#FFFFFF', borderRadius: '12px',
                                                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                                                        border: '1px solid #E2E8F0', width: '160px', zIndex: 10, overflow: 'hidden'
                                                    }}>
                                                        <button
                                                            style={{
                                                                width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px',
                                                                background: 'none', border: 'none', borderBottom: '1px solid #F1F5F9',
                                                                color: '#475569', fontSize: '14px', fontWeight: 500, cursor: 'pointer', textAlign: 'left' as const
                                                            }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenBatchMenu(null);
                                                                _setSelectedBatch(batch);
                                                                _setActiveSection('details');
                                                                updateNavigation(batch, 'details');
                                                            }}
                                                            className="hover-bg-slate"
                                                        >
                                                            <Edit2 size={16} /> Edit
                                                        </button>
                                                        <button
                                                            style={{
                                                                width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px',
                                                                background: 'none', border: 'none',
                                                                color: '#EF4444', fontSize: '14px', fontWeight: 500, cursor: 'pointer', textAlign: 'left' as const
                                                            }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenBatchMenu(null);
                                                                setConfirmConfig({
                                                                    show: true,
                                                                    title: 'Delete Batch',
                                                                    message: 'Are you sure you want to delete this batch? All associated data will be removed.',
                                                                    action: async () => {
                                                                        try {
                                                                            if (batchObj.id) {
                                                                                await batchService.delete(id!, batchObj.id);
                                                                            }
                                                                            setBatches(batches.filter(b => b.id !== batchObj.id));
                                                                            toast.success('Batch deleted successfully.');
                                                                        } catch (err: any) {
                                                                            console.error('Failed to delete batch:', err);
                                                                            toast.error(err.response?.data?.message || 'Failed to delete batch.');
                                                                        } finally {
                                                                            setConfirmConfig(prev => ({ ...prev, show: false }));
                                                                        }
                                                                    }
                                                                });
                                                            }}
                                                            className="hover-bg-red"
                                                        >
                                                            <Trash2 size={16} /> Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {userRole !== 'secretary' && userRole !== 'lecturer' && (
                        <div style={{ position: 'fixed', bottom: '32px', right: '32px', zIndex: 100 }}>
                            <button
                                onClick={() => setShowBatchModal(true)}
                                style={{
                                    background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                                    color: '#FFF', border: 'none', padding: '16px 24px',
                                    borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '8px',
                                    fontWeight: 600, fontSize: '15px',
                                    boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
                                    cursor: 'pointer', transition: 'all 0.3s ease',
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <Plus size={20} /> Add New Batch
                            </button>
                        </div>
                    )}
                </div>
            )}

            {selectedBatch && activeSection === null && (
                <div className="management-nav-container">
                    {/* Row 0: Request Management (Special Multi-Action Card) */}
                    <div className="nav-button-card" onClick={() => setActiveSection('enrollment_req')}>
                        <div style={{
                            position: 'absolute',
                            top: '24px',
                            right: '24px',
                            padding: '6px 14px',
                            borderRadius: '20px',
                            background: 'rgba(124, 58, 237, 0.08)',
                            border: '1px solid rgba(124, 58, 237, 0.2)',
                            color: '#7C3AED',
                            fontSize: '11px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 10px rgba(124, 58, 237, 0.05)'
                        }}>
                            <span style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: '#7C3AED',
                                boxShadow: '0 0 8px #7C3AED'
                            }}></span>
                            {userRole === 'super_admin' ? 'Super Admin' : userRole.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </div>
                        <div className="nav-card-icon" style={{ background: '#F0F9FF', color: '#0EA5E9' }}>
                            <ClipboardList size={28} />
                        </div>
                        <div className="nav-card-content">
                            <h3>Enrollment Management</h3>
                            <p>Track enrollment requests and manage registration statuses.</p>
                        </div>
                        <div className="nav-card-arrow">
                            <ArrowLeft size={18} style={{ transform: 'rotate(180deg)' }} />
                        </div>
                    </div>

                    {/* Row 1: Exam and Result Management */}
                    <div className="nav-button-card" onClick={() => setActiveSection('exams')}>
                        <div className="nav-card-icon" style={{ background: '#E0F2FE', color: '#0284C7' }}>
                            <Calendar size={28} />
                        </div>
                        <div className="nav-card-content">
                            <h3>Exam Management</h3>
                            <p>Create new examinations, manage halls and edit schedules.</p>
                        </div>
                        <div className="nav-card-arrow">
                            <ArrowLeft size={18} style={{ transform: 'rotate(180deg)' }} />
                        </div>
                    </div>

                    <div className="nav-button-card" onClick={() => setActiveSection('results')}>
                        <div className="nav-card-icon" style={{ background: '#DCFCE7', color: '#16A34A' }}>
                            <FileSpreadsheet size={28} />
                        </div>
                        <div className="nav-card-content">
                            <h3>Result Management</h3>
                            <p>Import examination results, set pass grades and templates.</p>
                        </div>
                        <div className="nav-card-arrow">
                            <ArrowLeft size={18} style={{ transform: 'rotate(180deg)' }} />
                        </div>
                    </div>

                    {/* Row 2: Course Configuration and Enrolled Students */}
                    <div className="nav-button-card" onClick={() => setActiveSection('students')}>
                        <div className="nav-card-icon" style={{ background: '#FEF2F2', color: '#DC2626' }}>
                            <Users size={28} />
                        </div>
                        <div className="nav-card-content">
                            <h3>Enrolled Students</h3>
                            <p>View details of students who enrolled in this course.</p>
                        </div>
                        <div className="nav-card-arrow">
                            <ArrowLeft size={18} style={{ transform: 'rotate(180deg)' }} />
                        </div>
                    </div>

                    <div className="nav-button-card" onClick={() => setActiveSection('announcements')}>
                        <div className="nav-card-icon" style={{ background: '#FDF2F8', color: '#DB2777' }}>
                            <Mail size={28} />
                        </div>
                        <div className="nav-card-content">
                            <h3>Announcements</h3>
                            <p>Broadcast messages, updates, and important notices.</p>
                        </div>
                        <div className="nav-card-arrow">
                            <ArrowLeft size={18} style={{ transform: 'rotate(180deg)' }} />
                        </div>
                    </div>

                    {/* Row 3: Course Materials */}
                    <div className="nav-button-card" onClick={() => setActiveSection('materials')}>
                        <div className="nav-card-icon" style={{ background: '#FFF7ED', color: '#EA580C' }}>
                            <Layers size={28} />
                        </div>
                        <div className="nav-card-content">
                            <h3>Course Materials</h3>
                            <p>Upload lecture notes, recordings and supplementary resources.</p>
                        </div>
                        <div className="nav-card-arrow">
                            <ArrowLeft size={18} style={{ transform: 'rotate(180deg)' }} />
                        </div>
                    </div>
                </div>
            )}



            {activeSection !== null && (
                <div className="manage-course-sections-container">
                    {activeSection === 'announcements' && (
                        <div className="manage-section-main-card">
                            <div className="section-card-content">
                                <div className="form-section-card no-shadow">
                                    <div className="section-header">
                                        <Mail size={18} />
                                        <h3>Batch Announcements</h3>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px 0' }}>
                                        <div style={{ display: 'flex', gap: '20px', width: '100%' }}>
                                            <div className="cm-form-group" style={{ flex: 1 }}>
                                                <label>Announcement Title</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Schedule Update for Mid-Terms"
                                                    className="admin-input"
                                                    value={annTitle}
                                                    onChange={(e) => setAnnTitle(e.target.value)}
                                                />
                                            </div>
                                            <div className="cm-form-group" style={{ width: '200px' }}>
                                                <label>Type / Priority</label>
                                                <select
                                                    className="admin-input"
                                                    value={annType}
                                                    onChange={(e) => setAnnType(e.target.value)}
                                                >
                                                    <option value="Notice">Notice (Blue)</option>
                                                    <option value="Important">Important (Red)</option>
                                                    <option value="Update">Update (Green)</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="cm-form-group" style={{ maxWidth: '100%' }}>
                                            <label>Message Content</label>
                                            <textarea
                                                placeholder="Type your announcement here..."
                                                className="admin-input"
                                                style={{ minHeight: '150px', resize: 'vertical' }}
                                                value={annContent}
                                                onChange={(e) => setAnnContent(e.target.value)}
                                            ></textarea>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <button
                                                className="admin-btn-primary"
                                                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(to right, #DB2777, #BE185D)', color: '#FFF', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                                                onClick={handleBroadcastAnnouncement}
                                            >
                                                <Send size={16} /> Broadcast Announcement
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="form-section-card no-shadow" style={{ marginTop: '24px' }}>
                                    <div className="section-header">
                                        <Clock size={18} />
                                        <h3>Recent Announcements</h3>
                                    </div>
                                    <div style={{ padding: '20px 0' }}>
                                        {(() => {
                                            const displayedAnnouncements = announcementsList.filter(ann => !selectedBatch || ann.batch === selectedBatch || !ann.batch);
                                            return displayedAnnouncements.length === 0 ? (
                                                <div style={{ textAlign: 'center', color: '#64748B' }}>
                                                    No recent announcements sent to this batch.
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                    {displayedAnnouncements.map((ann, idx) => (
                                                        <div
                                                            key={idx}
                                                            style={{
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'flex-start',
                                                                padding: '16px',
                                                                borderRadius: '12px',
                                                                background: '#F8FAFC',
                                                                borderLeft: `4px solid ${ann.iconColor || '#7C3AED'}`
                                                            }}
                                                        >
                                                            <div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                                    <span
                                                                        style={{
                                                                            fontSize: '11px',
                                                                            fontWeight: 700,
                                                                            padding: '2px 8px',
                                                                            borderRadius: '4px',
                                                                            color: ann.iconColor,
                                                                            background: `${ann.iconColor}15`
                                                                        }}
                                                                    >
                                                                        {ann.type}
                                                                    </span>
                                                                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>{ann.date}</span>
                                                                </div>
                                                                <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 700, color: '#1E293B' }}>{ann.title}</h4>
                                                                <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>{ann.desc}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => handleDeleteAnnouncement(ann)}
                                                                style={{
                                                                    background: 'none',
                                                                    border: 'none',
                                                                    color: '#94A3B8',
                                                                    cursor: 'pointer',
                                                                    padding: '4px',
                                                                    borderRadius: '4px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center'
                                                                }}
                                                                onMouseEnter={(e) => e.currentTarget.style.color = '#EF4444'}
                                                                onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 1. Edit Details Section */}
                    {activeSection === 'details' && (
                        <>
                            <div className="manage-section-main-card">
                                <div className="section-card-content">

                                    {/* Section 1: Basic Information */}
                                    <div className="form-section-card no-shadow">
                                        <div className="section-header">
                                            <BookOpen size={18} />
                                            <h3>Batch Configuration</h3>
                                        </div>
                                        <div className="cm-form-grid">
                                            <div className="cm-form-group">
                                                <label>Batch Name</label>
                                                <input type="text" name="name" value={commonData.name} onChange={handleCommonChange} className="admin-input" />
                                            </div>
                                            <div className="cm-form-group">
                                                <label>Max Enrollments</label>
                                                <input type="number" name="enrollments" value={commonData.enrollments} onChange={handleCommonChange} className="admin-input" />
                                            </div>
                                            {commonData.status === 'Upcoming' && (
                                                <div className="cm-form-group">
                                                    <label>Registration Deadline</label>
                                                    <input type="date" name="registrationDeadline" value={commonData.registrationDeadline} onChange={handleCommonChange} className="admin-input" />
                                                </div>
                                            )}
                                            <div className="cm-form-group">
                                                <label>Secretary</label>
                                                <input type="text" name="secretary" value={commonData.secretary} readOnly className="admin-input" style={{ background: '#F8FAFC' }} />
                                            </div>
                                            <div className="cm-form-group">
                                                <label>Batch Status</label>
                                                <select name="status" value={commonData.status} onChange={handleCommonChange} className="admin-input">
                                                    <option value="Upcoming">Upcoming</option>
                                                    <option value="Active">Active</option>
                                                    <option value="Close">Close</option>
                                                </select>
                                            </div>
                                            {['Certificate', 'Advanced Certificate'].includes(courseType) && (
                                                <div className="cm-form-group">
                                                    <label>Lecturer / Instructor</label>
                                                    <select
                                                        name="lecturerId"
                                                        value={commonData.lecturerId || ''}
                                                        onChange={(e) => {
                                                            const lId = e.target.value;
                                                            const selectedLecturer = lecturersList.find((l: any) => l.id?.toString() === lId);
                                                            setCommonData(prev => ({
                                                                ...prev,
                                                                lecturerId: lId || undefined,
                                                                lecturerName: selectedLecturer ? selectedLecturer.full_name : ''
                                                            }));
                                                        }}
                                                        className="admin-input"
                                                    >
                                                        <option value="">Select Lecturer</option>
                                                        {lecturersList.map(inst => (
                                                            <option key={inst.id} value={inst.id}>{inst.full_name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Section 2: Academic Structure */}
                                    {!['Certificate', 'Advanced Certificate'].includes(courseType) && (
                                        <div className="form-section-card no-shadow">
                                            <div className="section-header">
                                                <Layers size={18} />
                                                <h3>Academic Structure</h3>
                                            </div>

                                            {(courseType === 'Degree' || courseType === 'Higher National Diploma') && (
                                                <div className="degree-structure">
                                                    <div className="cm-form-group" style={{ maxWidth: '300px', marginBottom: '24px' }}>
                                                        <label>Number of Semesters</label>
                                                        <select value={semesterCount} onChange={(e) => handleSemesterCountChange(parseInt(e.target.value))} className="admin-input" disabled={!!selectedBatch}>
                                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                                                                <option key={n} value={n}>{n} Semesters</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {semesters.map((sem, semIdx) => (
                                                        <div key={semIdx} className="semester-block">
                                                            <div className="semester-header">
                                                                <h4>Semester {semIdx + 1}</h4>
                                                                {!selectedBatch && (
                                                                    <button type="button" className="add-sub-btn" onClick={() => addSubject(semIdx)}>
                                                                        <Plus size={14} /> Add Subject
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <div className="subject-list">
                                                                {sem.subjects.map((sub, subIdx) => (
                                                                    <div key={subIdx} className="subject-row">
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Subject Code"
                                                                            value={sub.code}
                                                                            className="admin-input"
                                                                            style={{ width: '150px' }}
                                                                            onChange={(e) => updateSubject(semIdx, subIdx, 'code', e.target.value)}
                                                                            disabled={!!selectedBatch}
                                                                        />
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Subject Name"
                                                                            value={sub.name}
                                                                            className="admin-input"
                                                                            style={{ flex: 1 }}
                                                                            onChange={(e) => updateSubject(semIdx, subIdx, 'name', e.target.value)}
                                                                            disabled={!!selectedBatch}
                                                                        />
                                                                        {selectedBatch && (
                                                                            <select
                                                                                value={batchSubjects.find(bs => bs.name === sub.name)?.lecturerId || ''}
                                                                                className="admin-input"
                                                                                style={{ flex: 1 }}
                                                                                onChange={(e) => updateBatchSubjectLecturer(sub.name, e.target.value)}
                                                                            >
                                                                                <option value="">Select Lecturer</option>
                                                                                {lecturersList.map(inst => (
                                                                                    <option key={inst.id} value={inst.id}>{inst.full_name}</option>
                                                                                ))}
                                                                            </select>
                                                                        )}
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Cr"
                                                                            value={sub.credits}
                                                                            className="admin-input"
                                                                            style={{ width: '80px' }}
                                                                            onChange={(e) => updateSubject(semIdx, subIdx, 'credits', e.target.value)}
                                                                            disabled={!!selectedBatch}
                                                                        />
                                                                        {!selectedBatch && (
                                                                            <button type="button" className="icon-btn delete" onClick={() => removeSubject(semIdx, subIdx)}>
                                                                                <Trash2 size={16} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {courseType === 'Diploma' && (
                                                <div className="diploma-structure">
                                                    <div className="semester-header">
                                                        <h4>Course Subjects</h4>
                                                        {!selectedBatch && (
                                                            <button type="button" className="add-sub-btn" onClick={() => setDiplomaSubjects([...diplomaSubjects, { code: '', name: '', credits: '' }])}>
                                                                <Plus size={14} /> Add Subject
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="subject-list">
                                                        {diplomaSubjects.map((sub, idx) => (
                                                            <div key={idx} className="subject-row">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Subject Code"
                                                                    value={sub.code}
                                                                    className="admin-input"
                                                                    style={{ width: '150px' }}
                                                                    onChange={(e) => updateDiplomaSubject(idx, 'code', e.target.value)}
                                                                    disabled={!!selectedBatch}
                                                                />
                                                                <input
                                                                    type="text"
                                                                    placeholder="Subject Name"
                                                                    value={sub.name}
                                                                    className="admin-input"
                                                                    style={{ flex: 1 }}
                                                                    onChange={(e) => updateDiplomaSubject(idx, 'name', e.target.value)}
                                                                    disabled={!!selectedBatch}
                                                                />
                                                                {selectedBatch && (
                                                                    <select
                                                                        value={batchSubjects.find(bs => bs.name === sub.name)?.lecturerId || ''}
                                                                        className="admin-input"
                                                                        style={{ flex: 1 }}
                                                                        onChange={(e) => updateBatchSubjectLecturer(sub.name, e.target.value)}
                                                                    >
                                                                        <option value="">Select Lecturer</option>
                                                                        {lecturersList.map(inst => (
                                                                            <option key={inst.id} value={inst.id}>{inst.full_name}</option>
                                                                        ))}
                                                                    </select>
                                                                )}
                                                                <input
                                                                    type="text"
                                                                    placeholder="Cr"
                                                                    value={sub.credits}
                                                                    className="admin-input"
                                                                    style={{ width: '80px' }}
                                                                    onChange={(e) => updateDiplomaSubject(idx, 'credits', e.target.value)}
                                                                    disabled={!!selectedBatch}
                                                                />
                                                                {!selectedBatch && (
                                                                    <button type="button" className="icon-btn delete" onClick={() => {
                                                                        setConfirmConfig({
                                                                            show: true,
                                                                            title: 'Delete Subject',
                                                                            message: 'Remove this subject from the diploma program?',
                                                                            action: () => {
                                                                                const newSubs = [...diplomaSubjects];
                                                                                newSubs.splice(idx, 1);
                                                                                setDiplomaSubjects(newSubs);
                                                                                setConfirmConfig(prev => ({ ...prev, show: false }));
                                                                            }
                                                                        });
                                                                    }}>
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* 2. Manage Exams Section */}
                    {activeSection === 'exams' && (
                        <>
                            <div style={{ padding: '0 4px' }}>
                                <div style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
                                    <div style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                                            {exams.filter(exam => !selectedBatch || exam.batch === selectedBatch || exam.batch_name === selectedBatch).map(exam => {
                                                const getExamStatus = (s: string) => {
                                                    const statusMap: Record<string, { color: string, bg: string }> = {
                                                        'Registration Open': { color: '#10B981', bg: '#ECFDF5' },
                                                        'Registrations are Open': { color: '#10B981', bg: '#ECFDF5' },
                                                        'Open': { color: '#10B981', bg: '#ECFDF5' },
                                                        'On Progress': { color: '#3B82F6', bg: '#EFF6FF' },
                                                        'Evaluation Phase': { color: '#F59E0B', bg: '#FFFBEB' },
                                                        'Results Released': { color: '#8B5CF6', bg: '#F5F3FF' },
                                                        'Result Updated': { color: '#D97706', bg: '#FEF3C7' },
                                                        'Closed': { color: '#EF4444', bg: '#FEF2F2' },
                                                        'Exam Closed': { color: '#EF4444', bg: '#FEF2F2' },
                                                        'Registrations are Closed': { color: '#EF4444', bg: '#FEF2F2' },
                                                        'Registration Closed': { color: '#EF4444', bg: '#FEF2F2' },
                                                        'Upcoming': { color: '#6366F1', bg: '#EEF2FF' }
                                                    };
                                                    return statusMap[s] || { color: '#64748B', bg: '#F8FAFC' };
                                                };
                                                const status = getExamStatus((() => {
                                                    if (!exam.deadline) return exam.status;
                                                    try {
                                                        const dDate = new Date(exam.deadline);
                                                        if (isNaN(dDate.getTime())) return exam.status;
                                                        if (dDate.getTime() < new Date().setHours(0, 0, 0, 0) && ((exam.status as string) === 'Registration Open' || (exam.status as string) === 'Registrations are Open' || (exam.status as string) === 'Open')) {
                                                            return 'Closed';
                                                        }
                                                    } catch (e) { }
                                                    return exam.status;
                                                })());

                                                return (
                                                    <div key={exam.id} style={{
                                                        background: '#FFFFFF',
                                                        borderRadius: '24px',
                                                        padding: '28px',
                                                        border: '1px solid #E2E8F0',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        minHeight: '340px',
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 10px 25px -10px rgba(0,0,0,0.05)',
                                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        position: 'relative'
                                                    }} className="premium-exam-square-card" onClick={() => openExamDotMenu === exam.id && setOpenExamDotMenu(null)}>
                                                        {/* Header: Icon and Status Badge */}
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                                            <div style={{
                                                                width: '50px',
                                                                height: '50px',
                                                                background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
                                                                color: '#0EA5E9',
                                                                borderRadius: '14px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                boxShadow: '0 4px 10px rgba(14, 165, 233, 0.1)'
                                                            }}>
                                                                <Layers size={24} />
                                                            </div>
                                                            <div style={{
                                                                background: status.bg,
                                                                color: status.color,
                                                                padding: '6px 12px',
                                                                borderRadius: '20px',
                                                                fontSize: '10px',
                                                                fontWeight: 800,
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.05em',
                                                                border: `1px solid ${status.color}20`
                                                            }}>{(() => {
                                                                if (!exam.deadline) return exam.status;
                                                                try {
                                                                    const dDate = new Date(exam.deadline);
                                                                    if (isNaN(dDate.getTime())) return exam.status;
                                                                    if (dDate.getTime() < new Date().setHours(0, 0, 0, 0) && ((exam.status as string) === 'Registration Open' || (exam.status as string) === 'Registrations are Open' || (exam.status as string) === 'Open')) {
                                                                        return 'Closed';
                                                                    }
                                                                } catch (e) { }
                                                                return exam.status;
                                                            })()}</div>
                                                        </div>

                                                        {/* Content */}
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{
                                                                fontSize: '11px',
                                                                fontWeight: 800,
                                                                padding: '4px 10px',
                                                                borderRadius: '6px',
                                                                background: '#F1F5F9',
                                                                color: '#64748B',
                                                                textTransform: 'uppercase',
                                                                display: 'inline-block',
                                                                marginBottom: '12px',
                                                                letterSpacing: '0.05em'
                                                            }}>{exam.type}</div>
                                                            <h4 style={{ fontSize: '19px', fontWeight: 800, color: '#0F172A', margin: '0 0 24px 0', lineHeight: 1.3 }}>{exam.title}</h4>

                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>REG. DEADLINE</span>
                                                                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>{exam.deadline ? new Date(exam.deadline).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'TBA'}</span>
                                                                </div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>REG. STUDENTS</span>
                                                                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#7C3AED' }}>{getRegisteredStudentCount(exam)}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Footer Actions: Manage Students + Three-dot menu */}
                                                        <div style={{ marginTop: '28px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                            <button
                                                                className="admin-btn-primary"
                                                                style={{
                                                                    flex: 1,
                                                                    height: '48px',
                                                                    borderRadius: '12px',
                                                                    fontSize: '14px',
                                                                    fontWeight: 700,
                                                                    background: 'linear-gradient(to right, #7C3AED, #6D28D9)',
                                                                    border: 'none',
                                                                    color: '#FFFFFF',
                                                                    cursor: 'pointer',
                                                                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    gap: '8px'
                                                                }}
                                                                onClick={() => navigate(`/admin/courses/manage/${id}/exams/${exam.id}/students?batch=${encodeURIComponent(selectedBatch || '')}`)}
                                                            >
                                                                <Users size={16} />
                                                                Manage Students
                                                            </button>
                                                            {/* Three-dot menu */}
                                                            <div style={{ position: 'relative' }}>
                                                                <button
                                                                    style={{
                                                                        width: '48px',
                                                                        height: '48px',
                                                                        borderRadius: '12px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        background: '#F8FAFC',
                                                                        border: '1px solid #E2E8F0',
                                                                        color: '#475569',
                                                                        cursor: 'pointer',
                                                                        transition: 'all 0.2s ease'
                                                                    }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setOpenExamDotMenu(openExamDotMenu === exam.id ? null : exam.id);
                                                                    }}
                                                                    title="More options"
                                                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#1E293B'; }}
                                                                    onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#475569'; }}
                                                                >
                                                                    <MoreVertical size={18} />
                                                                </button>
                                                                {openExamDotMenu === exam.id && (
                                                                    <div
                                                                        style={{
                                                                            position: 'absolute',
                                                                            right: 0,
                                                                            bottom: '54px',
                                                                            background: '#FFFFFF',
                                                                            borderRadius: '12px',
                                                                            border: '1px solid #E2E8F0',
                                                                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                                                            zIndex: 50,
                                                                            minWidth: '160px',
                                                                            overflow: 'hidden'
                                                                        }}
                                                                    >
                                                                        <button
                                                                            style={{
                                                                                width: '100%',
                                                                                padding: '12px 16px',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: '10px',
                                                                                background: 'none',
                                                                                border: 'none',
                                                                                cursor: 'pointer',
                                                                                fontSize: '14px',
                                                                                fontWeight: 600,
                                                                                color: '#1E293B',
                                                                                textAlign: 'left',
                                                                                transition: 'background 0.15s ease'
                                                                            }}
                                                                            onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
                                                                            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                                                            onClick={() => {
                                                                                setOpenExamDotMenu(null);
                                                                                navigate(`/admin/courses/manage/${id}/exams/edit/${exam.id}?batch=${encodeURIComponent(selectedBatch || '')}`);
                                                                            }}
                                                                        >
                                                                            <Edit2 size={15} style={{ color: '#7C3AED' }} />
                                                                            Edit
                                                                        </button>
                                                                        <div style={{ height: '1px', background: '#F1F5F9', margin: '0 12px' }} />
                                                                        <button
                                                                            style={{
                                                                                width: '100%',
                                                                                padding: '12px 16px',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: '10px',
                                                                                background: 'none',
                                                                                border: 'none',
                                                                                cursor: 'pointer',
                                                                                fontSize: '14px',
                                                                                fontWeight: 600,
                                                                                color: '#EF4444',
                                                                                textAlign: 'left',
                                                                                transition: 'background 0.15s ease'
                                                                            }}
                                                                            onMouseEnter={(e) => e.currentTarget.style.background = '#FEF2F2'}
                                                                            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                                                            onClick={() => {
                                                                                setOpenExamDotMenu(null);
                                                                                handleDeleteExam(exam.id);
                                                                            }}
                                                                        >
                                                                            <Trash2 size={15} />
                                                                            Delete
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}



                    {/* 3. Manage Results Section */}
                    {activeSection === 'results' && (
                        <>
                            {!selectedExamForResult ? (
                                <div style={{ padding: '0 4px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                                        {exams.filter(e => {
                                            const matchesBatch = !selectedBatch || e.batch === selectedBatch || e.batch_name === selectedBatch;
                                            if (!matchesBatch) return false;
                                            let resolvedStatus = e.status;
                                            if (e.deadline) {
                                                try {
                                                    const dDate = new Date(e.deadline);
                                                    if (!isNaN(dDate.getTime()) && dDate.getTime() < new Date().setHours(0, 0, 0, 0) && (e.status === 'Registration Open' || e.status === 'Registrations are Open' || e.status === 'Open')) {
                                                        resolvedStatus = 'Closed';
                                                    }
                                                } catch (err) { }
                                            }
                                            if (resolvedStatus === 'Registrations are Closed' || resolvedStatus === 'Registration Closed' || resolvedStatus === 'Exam Closed') {
                                                resolvedStatus = 'Closed';
                                            }
                                            return resolvedStatus === 'Closed' || resolvedStatus === 'Result Updated' || resolvedStatus === 'Results Released';
                                        }).map(exam => {
                                            const resolvedStatus = (() => {
                                                if (exam.deadline) {
                                                    try {
                                                        const dDate = new Date(exam.deadline);
                                                        if (!isNaN(dDate.getTime()) && dDate.getTime() < new Date().setHours(0, 0, 0, 0) && (exam.status === 'Registration Open' || exam.status === 'Registrations are Open' || exam.status === 'Open')) {
                                                            return 'Closed';
                                                        }
                                                    } catch (err) { }
                                                }
                                                if (exam.status === 'Registrations are Closed' || exam.status === 'Registration Closed' || exam.status === 'Exam Closed') {
                                                    return 'Closed';
                                                }
                                                return exam.status;
                                            })();
                                            const getExamStatus = () => (resolvedStatus === 'Results Released' ? { color: '#10B981', bg: '#ECFDF5' } : (resolvedStatus === 'Result Updated' ? { color: '#D97706', bg: '#FEF3C7' } : { color: '#EF4444', bg: '#FEF3C7' }));
                                            const status = getExamStatus();

                                            return (
                                                <div key={exam.id} style={{
                                                    background: '#FFFFFF',
                                                    borderRadius: '24px',
                                                    padding: '28px',
                                                    border: '1px solid #E2E8F0',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    minHeight: '340px',
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 10px 25px -10px rgba(0,0,0,0.05)',
                                                    position: 'relative'
                                                }}>
                                                    {/* Header: Icon and Status Badge */}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                                        <div style={{
                                                            width: '50px',
                                                            height: '50px',
                                                            background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
                                                            color: '#0EA5E9',
                                                            borderRadius: '14px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}>
                                                            <Layers size={24} />
                                                        </div>
                                                        <div style={{
                                                            background: status.bg,
                                                            color: status.color,
                                                            padding: '6px 12px',
                                                            borderRadius: '20px',
                                                            fontSize: '10px',
                                                            fontWeight: 800,
                                                            textTransform: 'uppercase'
                                                        }}>{resolvedStatus === 'Results Released' ? 'RESULTS RELEASED' : (resolvedStatus === 'Result Updated' ? 'PARTIALLY RELEASED' : 'YET TO RELEASE')}</div>
                                                    </div>

                                                    {/* Content */}
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '6px', background: '#F1F5F9', color: '#64748B', textTransform: 'uppercase', display: 'inline-block', marginBottom: '12px' }}>{exam.type}</div>
                                                        <h4 style={{ fontSize: '19px', fontWeight: 800, color: '#0F172A', margin: '0 0 24px 0', lineHeight: 1.3 }}>{exam.title}</h4>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>REG. DEADLINE</span>
                                                                <span style={{ fontSize: '14px', fontWeight: 700 }}>{exam.deadline ? new Date(exam.deadline).toLocaleDateString() : 'TBA'}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>REG. STUDENTS</span>
                                                                <span style={{ fontSize: '14px', fontWeight: 800, color: '#7C3AED' }}>{getRegisteredStudentCount(exam)}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Action */}
                                                    <div style={{ marginTop: '28px' }}>
                                                        <button
                                                            className="admin-btn-primary"
                                                            style={{
                                                                width: '100%',
                                                                height: '48px',
                                                                borderRadius: '12px',
                                                                background: 'linear-gradient(to right, #10B981, #059669)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                            onClick={() => setSelectedExamForResult(exam.id)}
                                                        >
                                                            Manage Results
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (() => {
                                const selectedExam = exams.find(e => e.id === selectedExamForResult);
                                console.log('Managing results for:', selectedExam?.title);
                                const allSubjects = (selectedExam && (selectedExam as any).subjects && (selectedExam as any).subjects.length > 0)
                                    ? (selectedExam as any).subjects
                                    : (course.level === 'Diploma' ? diplomaSubjects : semesters.flatMap(s => s.subjects));
                                return (
                                    <div className="manage-section-main-card" style={{ background: 'transparent', border: 'none', boxShadow: 'none', marginTop: '-24px' }}>

                                        <div className="section-card-content" style={{ padding: '24px 0px' }}>
                                            {!selectedSubjectForResult ? (
                                                <div className="results-horizontal-list">
                                                    {allSubjects.map((subject: any, idx: number) => {
                                                        const isReleased = releasedSubjects.includes(subject.name);

                                                        return (
                                                            <div key={idx} className="premium-subject-horizontal-card">
                                                                <div className="subj-h-info">
                                                                    <div className="subj-h-icon-container">
                                                                        <BookOpen size={22} />
                                                                    </div>
                                                                    <div className="subj-h-details">
                                                                        <h3>{subject.name}</h3>
                                                                    </div>
                                                                </div>

                                                                <div className="subj-h-meta">
                                                                    <span className="subj-h-credits-badge">{subject.credits} CREDITS</span>
                                                                </div>

                                                                <div className="subj-h-actions" style={{ gap: '24px' }}>
                                                                    <div className={`subj-status-pillar ${isReleased ? 'released' : 'not-released'}`}>
                                                                        <div className="status-dot"></div>
                                                                        <span>{isReleased ? 'RELEASED' : 'YET TO RELEASE'}</span>
                                                                    </div>

                                                                    <button
                                                                        className="premium-manage-btn-dual"
                                                                        style={{ width: '150px', justifyContent: 'center' }}
                                                                        onClick={() => setSelectedSubjectForResult(subject.name)}
                                                                    >
                                                                        <div className="main-action">
                                                                            <FileSpreadsheet size={16} />
                                                                            <span>Manage</span>
                                                                        </div>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="manage-section-main-card">
                                                    <div className="section-card-content" style={{ padding: '0px' }}>
                                                        <div className="manage-results-config-bar" style={{
                                                            background: '#FFFFFF',
                                                            padding: '24px',
                                                            borderRadius: '24px',
                                                            border: '1px solid #E2E8F0',
                                                            marginBottom: '24px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
                                                        }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                                <div style={{
                                                                    width: '50px',
                                                                    height: '50px',
                                                                    background: '#FFF1F2',
                                                                    color: '#E11D48',
                                                                    borderRadius: '16px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    boxShadow: '0 4px 10px rgba(225, 29, 72, 0.1)'
                                                                }}>
                                                                    <AlertCircle size={22} />
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontWeight: 800, color: '#1E293B', fontSize: '15px' }}>Minimum Results for Reattempts</div>
                                                                    <div style={{ color: '#64748B', fontSize: '13px' }}>Set the passing grade threshold for this examination.</div>
                                                                </div>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Min. Grade:</span>
                                                                    <div style={{ position: 'relative' }}>
                                                                        <select
                                                                            className="admin-input"
                                                                            style={{ width: '100px', height: '48px', paddingRight: '12px', textAlign: 'center', fontWeight: 800, color: '#E11D48', border: '2px solid #FFE4E6', appearance: 'none', cursor: 'pointer' }}
                                                                            value={minRepeatGrade}
                                                                            onChange={(e) => handleMinGradeChange(e.target.value)}
                                                                        >
                                                                            {['N/A', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'E', 'F'].map(g => (
                                                                                <option key={g} value={g}>{g}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Tab headers */}
                                                        {(() => {
                                                            const allStudents = getEligibleStudentsForResults();
                                                            return (
                                                                <div style={{
                                                                    display: 'flex',
                                                                    gap: '12px',
                                                                    marginBottom: '24px',
                                                                    borderBottom: '1px solid #E2E8F0',
                                                                    paddingBottom: '12px'
                                                                }}>
                                                                    {[
                                                                        { key: 'Regular' as const, label: 'Regular', icon: <UserPlus size={16} />, count: allStudents.filter(s => s.studentType === 'Regular').length },
                                                                        { key: 'Postponement' as const, label: 'Postponements', icon: <Clock size={16} />, count: allStudents.filter(s => s.studentType === 'Postponement').length },
                                                                        { key: 'Reattempt' as const, label: 'Reattempts', icon: <History size={16} />, count: allStudents.filter(s => s.studentType === 'Reattempt').length }
                                                                    ].map(tab => {
                                                                        const isActive = activeResultTab === tab.key;
                                                                        return (
                                                                            <button
                                                                                key={tab.key}
                                                                                type="button"
                                                                                onClick={() => setActiveResultTab(tab.key)}
                                                                                style={{
                                                                                    padding: '10px 20px',
                                                                                    borderRadius: '12px',
                                                                                    border: 'none',
                                                                                    background: isActive ? '#7C3AED' : 'transparent',
                                                                                    color: isActive ? '#FFFFFF' : '#64748B',
                                                                                    fontWeight: 700,
                                                                                    fontSize: '14px',
                                                                                    cursor: 'pointer',
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    gap: '8px',
                                                                                    transition: 'all 0.2s ease',
                                                                                    outline: 'none',
                                                                                    boxShadow: isActive ? '0 4px 12px rgba(124, 58, 237, 0.2)' : 'none'
                                                                                }}
                                                                                onMouseEnter={(e) => {
                                                                                    if (activeResultTab !== tab.key) {
                                                                                        e.currentTarget.style.background = '#F1F5F9';
                                                                                        e.currentTarget.style.color = '#1E293B';
                                                                                    }
                                                                                }}
                                                                                onMouseLeave={(e) => {
                                                                                    if (activeResultTab !== tab.key) {
                                                                                        e.currentTarget.style.background = 'transparent';
                                                                                        e.currentTarget.style.color = '#64748B';
                                                                                    }
                                                                                }}
                                                                            >
                                                                                {tab.icon}
                                                                                <span>{tab.label}</span>
                                                                                <span style={{
                                                                                    background: isActive ? 'rgba(255, 255, 255, 0.25)' : '#E2E8F0',
                                                                                    color: isActive ? '#FFFFFF' : '#475569',
                                                                                    padding: '2px 8px',
                                                                                    borderRadius: '20px',
                                                                                    fontSize: '11px',
                                                                                    fontWeight: 800
                                                                                }}>
                                                                                    {tab.count}
                                                                                </span>
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            );
                                                        })()}

                                                        <div className="form-section-card" style={{ marginTop: '16px', padding: '24px', background: '#FFFFFF', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.06)' }}>
                                                            {/* Card Header */}
                                                            {(() => {
                                                                const allStudents = getEligibleStudentsForResults();
                                                                const studentsInActiveTab = allStudents.filter(s => s.studentType === activeResultTab);
                                                                const count = studentsInActiveTab.length;

                                                                const headerDetails = {
                                                                    'Regular': {
                                                                        title: 'Regular Students',
                                                                        subtitle: 'Approved regular examination applications for this subject.',
                                                                        icon: <UserPlus size={18} />,
                                                                        iconColor: '#0EA5E9',
                                                                        iconBg: '#F0F9FF'
                                                                    },
                                                                    'Postponement': {
                                                                        title: 'Postponement Students',
                                                                        subtitle: 'Approved postponement waitlist requests assigned to this subject.',
                                                                        icon: <Clock size={18} />,
                                                                        iconColor: '#D97706',
                                                                        iconBg: '#FFFBEB'
                                                                    },
                                                                    'Reattempt': {
                                                                        title: 'Reattempt Students',
                                                                        subtitle: 'Approved reattempt waitlist requests assigned to this subject.',
                                                                        icon: <History size={18} />,
                                                                        iconColor: '#EF4444',
                                                                        iconBg: '#FEF2F2'
                                                                    }
                                                                }[activeResultTab];

                                                                return (
                                                                    <>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px', marginBottom: '16px' }}>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                                <div style={{ width: '38px', height: '38px', background: headerDetails.iconBg, color: headerDetails.iconColor, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                                    {headerDetails.icon}
                                                                                </div>
                                                                                <div>
                                                                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>{headerDetails.title}</h3>
                                                                                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>{headerDetails.subtitle}</p>
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
                                                                                    {count} Registered
                                                                                </span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Search Input */}
                                                                        <div style={{ position: 'relative', marginBottom: '16px' }}>
                                                                            <input
                                                                                type="text"
                                                                                placeholder={`Search ${activeResultTab.toLowerCase()} students by name or ID...`}
                                                                                className="admin-input"
                                                                                value={resultSearchQuery}
                                                                                onChange={(e) => setResultSearchQuery(e.target.value)}
                                                                                style={{
                                                                                    paddingLeft: '40px',
                                                                                    background: '#F8FAFC',
                                                                                    height: '46px',
                                                                                    borderRadius: '10px',
                                                                                    border: '1px solid #E2E8F0',
                                                                                    width: '100%',
                                                                                    fontSize: '14px',
                                                                                    boxSizing: 'border-box'
                                                                                }}
                                                                            />
                                                                            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                                                                        </div>
                                                                    </>
                                                                );
                                                            })()}

                                                            <div style={{ overflowX: 'auto' }}>
                                                                <table className="admin-table">
                                                                    <thead>
                                                                        <tr>
                                                                            <th style={{ width: '15%' }}>REG NO</th>
                                                                            <th style={{ width: '30%' }}>STUDENT NAME</th>
                                                                            <th style={{ width: '12%' }}>ATTEMPT</th>
                                                                            <th style={{ width: '13%' }}>GRADE</th>
                                                                            <th style={{ width: '20%' }}>SPECIAL NOTE</th>
                                                                            <th style={{ width: '10%' }}>ACTIONS</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {(() => {
                                                                            const allStudents = getEligibleStudentsForResults();
                                                                            const studentsInActiveTab = allStudents.filter(s => s.studentType === activeResultTab);
                                                                            const filteredStudents = studentsInActiveTab.filter(s =>
                                                                                s.id.toLowerCase().includes(resultSearchQuery.toLowerCase()) ||
                                                                                s.name.toLowerCase().includes(resultSearchQuery.toLowerCase()) ||
                                                                                (s.displayName && s.displayName.toLowerCase().includes(resultSearchQuery.toLowerCase()))
                                                                            );

                                                                            if (filteredStudents.length === 0) {
                                                                                return (
                                                                                    <tr>
                                                                                        <td colSpan={6} style={{ textAlign: 'center', padding: '48px 24px', color: '#94A3B8' }}>
                                                                                            <BookOpen size={40} style={{ opacity: 0.3, marginBottom: '12px', margin: '0 auto' }} />
                                                                                            <div style={{ fontWeight: 700, fontSize: '15px' }}>No {activeResultTab} Students Found</div>
                                                                                            <p style={{ fontSize: '13px', margin: '4px 0 0', opacity: 0.8 }}>There are no students matching your search criteria.</p>
                                                                                        </td>
                                                                                    </tr>
                                                                                );
                                                                            }

                                                                            return filteredStudents.map(student => {
                                                                                const result = importedResults?.find(r => r.studentId === student.id);
                                                                                const isEditing = editingStudentId === student.id;

                                                                                return (
                                                                                    <tr key={student.id}>
                                                                                        <td style={{ fontWeight: 700, color: '#1E293B' }}>{student.id}</td>
                                                                                        <td style={{ color: '#475569' }}>
                                                                                            <div style={{ fontWeight: 600 }}>{student.displayName || student.name}</div>
                                                                                            <div style={{ fontSize: '11px', color: '#94A3B8' }}>{student.email}</div>
                                                                                        </td>
                                                                                        <td style={{ verticalAlign: 'middle', fontWeight: 600 }}>
                                                                                            <span style={{
                                                                                                padding: '4px 8px',
                                                                                                background: '#F0F9FF',
                                                                                                color: '#0284C7',
                                                                                                borderRadius: '6px',
                                                                                                fontSize: '12px',
                                                                                                fontWeight: 700
                                                                                            }}>
                                                                                                Attempt {student.attempt}
                                                                                            </span>
                                                                                        </td>
                                                                                        <td style={{ verticalAlign: 'middle' }}>
                                                                                            {isEditing ? (
                                                                                                <select
                                                                                                    className="admin-input mini"
                                                                                                    style={{ width: '90px', padding: '0 8px', height: '32px', textAlign: 'center', fontWeight: 800, cursor: 'pointer' }}
                                                                                                    value={editGrade}
                                                                                                    onChange={(e) => setEditGrade(e.target.value)}
                                                                                                >
                                                                                                    {['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'E', 'F', 'N/A'].map(g => (
                                                                                                        <option key={g} value={g}>{g}</option>
                                                                                                    ))}
                                                                                                </select>
                                                                                            ) : (
                                                                                                <div className={`grade-pill-modern ${result ? result.grade.replace('+', 'plus').replace('-', 'minus').toLowerCase() : 'pending'}`}>
                                                                                                    {result ? result.grade : 'N/A'}
                                                                                                </div>
                                                                                            )}
                                                                                        </td>
                                                                                        <td style={{ color: '#64748B', fontSize: '13px', verticalAlign: 'middle' }}>
                                                                                            {isEditing ? (
                                                                                                <input
                                                                                                    type="text"
                                                                                                    className="admin-input"
                                                                                                    style={{ width: '100%', height: '32px', fontSize: '13px', padding: '0 8px' }}
                                                                                                    value={editSpecialNote}
                                                                                                    onChange={(e) => setEditSpecialNote(e.target.value)}
                                                                                                />
                                                                                            ) : (
                                                                                                (result?.specialNote !== undefined ? result.specialNote : student.specialNote) || '-'
                                                                                            )}
                                                                                        </td>
                                                                                        <td style={{ verticalAlign: 'middle' }}>
                                                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                                                {isEditing ? (
                                                                                                    <>
                                                                                                        <button
                                                                                                            title="Save"
                                                                                                            onClick={() => handleSaveEdit(student.id)}
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
                                                                                                            <Check size={14} />
                                                                                                        </button>
                                                                                                        <button
                                                                                                            title="Cancel"
                                                                                                            onClick={() => setEditingStudentId(null)}
                                                                                                            style={{
                                                                                                                width: '32px',
                                                                                                                height: '32px',
                                                                                                                borderRadius: '8px',
                                                                                                                cursor: 'pointer',
                                                                                                                border: 'none',
                                                                                                                background: '#FEF2F2',
                                                                                                                color: '#EF4444',
                                                                                                                display: 'flex',
                                                                                                                alignItems: 'center',
                                                                                                                justifyContent: 'center',
                                                                                                                transition: 'all 0.15s ease'
                                                                                                            }}
                                                                                                        >
                                                                                                            <X size={14} />
                                                                                                        </button>
                                                                                                    </>
                                                                                                ) : (
                                                                                                    <button
                                                                                                        title="Edit Result"
                                                                                                        onClick={() => handleStartEdit(student.id, result, student)}
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
                                                                                                        onMouseEnter={(e) => {
                                                                                                            e.currentTarget.style.background = '#7C3AED';
                                                                                                            e.currentTarget.style.color = '#FFFFFF';
                                                                                                        }}
                                                                                                        onMouseLeave={(e) => {
                                                                                                            e.currentTarget.style.background = '#FFFFFF';
                                                                                                            e.currentTarget.style.color = '#7C3AED';
                                                                                                        }}
                                                                                                    >
                                                                                                        <Edit2 size={14} />
                                                                                                    </button>
                                                                                                )}
                                                                                            </div>
                                                                                        </td>
                                                                                    </tr>
                                                                                );
                                                                            });
                                                                        })()}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                        </>
                    )}

                    {/* 4. Enrolled Students Section */}
                    {activeSection === 'students' && (
                        <>
                            <div className="manage-section-main-card">
                                <div className="section-card-content">
                                    <div className="form-section-card no-shadow" style={{ paddingTop: '20px' }}>
                                        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div className="search-box-wrapper" style={{ position: 'relative' }}>
                                                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                                                <input
                                                    type="text"
                                                    placeholder="Search by name or ID..."
                                                    className="admin-input"
                                                    style={{ paddingLeft: '36px', width: '320px', height: '40px' }}
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="cm-table-container premium-table-wrapper">
                                            <table className="cm-table interactive-table">
                                                <thead>
                                                    <tr>
                                                        <th style={{ width: '40%' }}>Student Name</th>
                                                        <th style={{ width: '15%' }}>Student ID</th>
                                                        <th style={{ width: '30%' }}>Enrollment</th>
                                                        <th style={{ width: '15%' }}>Manage</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredStudents.map(student => (
                                                        <tr key={student.id}>
                                                            <td>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                                    <div>
                                                                        <div className="student-name-bold">{student.displayName || student.name}</div>
                                                                        <div className="student-email-muted">{student.email}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className="id-badge-minimal">{student.id}</span>
                                                            </td>
                                                            <td>
                                                                <div style={{ color: '#475569', fontSize: '13px', fontWeight: 500 }}>{student.enrollmentDate}</div>
                                                            </td>

                                                            <td>
                                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                                    <a
                                                                        href={`mailto:${student.email}`}
                                                                        className="modern-action-btn mail"
                                                                        title="Contact Student"
                                                                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                                                    >
                                                                        <Mail size={14} />
                                                                    </a>
                                                                    {userRole !== 'secretary' && userRole !== 'lecturer' && (
                                                                        <button
                                                                            className="modern-action-btn delete"
                                                                            style={{ color: '#EF4444' }}
                                                                            title="Suspend Access"
                                                                            onClick={() => {
                                                                                setConfirmConfig({
                                                                                    show: true,
                                                                                    title: 'Suspend Student',
                                                                                    message: `Are you sure you want to suspend student "${student.displayName || student.name}" from this course?`,
                                                                                    action: async () => {
                                                                                        try {
                                                                                            await courseService.unenrollStudent(id!, student.id);
                                                                                            const updated = enrolledStudents.filter(s => s.id !== student.id);
                                                                                            setEnrolledStudents(updated);
                                                                                            toast.success('Student suspended successfully');
                                                                                        } catch (err: any) {
                                                                                            console.error('Failed to suspend student:', err);
                                                                                            toast.error('Failed to suspend student. Please try again.');
                                                                                        }
                                                                                        setConfirmConfig(prev => ({ ...prev, show: false }));
                                                                                    }
                                                                                });
                                                                            }}
                                                                        >
                                                                            <X size={14} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {filteredStudents.length === 0 && (
                                            <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                                                <Users size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                                                <p>No students found matching your search criteria.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* 5. Course Materials Section */}
                    {activeSection === 'materials' && (
                        <div className="manage-section-main-card" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
                            <div className="section-card-content" style={{ padding: 0 }}>
                                {/* VIEW 1: Semesters */}
                                {materialsViewState === 'semesters' && (
                                    <div className="semester-selection-view">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                            <span className="section-label" style={{ margin: 0 }}>Manage Semesters</span>
                                        </div>
                                        {filteredMaterialsSemesters.length === 0 ? (
                                            <div style={{ background: '#FFFFFF', padding: '40px', borderRadius: '20px', border: '1px solid #E2E8F0', textAlign: 'center', color: '#64748B' }}>
                                                <AlertCircle size={48} style={{ color: '#EA580C', marginBottom: '16px' }} />
                                                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>No Assigned Subjects</h3>
                                                <p>You have not been assigned to teach any subjects for this batch.</p>
                                            </div>
                                        ) : (
                                            <div className="semester-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                                                {filteredMaterialsSemesters.map((sem) => (
                                                    <div
                                                        key={sem.id}
                                                        className="premium-square-card hover-lift"
                                                        style={{ background: '#FFFFFF', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0', cursor: 'pointer', position: 'relative' }}
                                                        onClick={() => {
                                                            setMaterialsSelectedSemesterId(sem.id);
                                                            setMaterialsViewState('modules');
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                                            <div style={{ width: '48px', height: '48px', background: '#FFF7ED', color: '#EA580C', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <Calendar size={24} />
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setMaterialsSemesters(prev => prev.map(s => s.id === sem.id ? { ...s, visible: !s.visible } : s));
                                                                }}
                                                                style={{ background: 'none', border: 'none', color: sem.visible ? '#10B981' : '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}
                                                                title={sem.visible ? 'Hide from students' : 'Show to students'}
                                                            >
                                                                {sem.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                                                                {sem.visible ? 'Visible' : 'Hidden'}
                                                            </button>
                                                        </div>
                                                        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>{sem.name}</h3>
                                                        <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 500 }}>{sem.modules.length} Modules</span>
                                                        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#EA580C', fontWeight: 700, fontSize: '14px' }}>
                                                            <span>Manage Modules</span>
                                                            <ChevronRight size={18} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* VIEW 2: Modules */}
                                {materialsViewState === 'modules' && materialsActiveSemester && (
                                    <div className="modules-view">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                            <span className="section-label" style={{ margin: 0 }}>{materialsActiveSemester.name} — Subjects</span>
                                        </div>
                                        <div className="modules-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {materialsActiveSemester.modules.map((module: any) => (
                                                <div
                                                    key={module.id}
                                                    className="module-list-card premium-list-item"
                                                    style={{ background: '#FFFFFF', padding: '20px 24px', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                                                    onClick={() => {
                                                        setMaterialsSelectedModuleId(module.id);
                                                        setMaterialsViewState('resources');
                                                    }}
                                                >
                                                    <div style={{ width: '48px', height: '48px', background: '#F8FAFC', color: '#475569', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '20px' }}>
                                                        <BookOpen size={24} />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>{module.title}</h3>
                                                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{module.code}</span>
                                                    </div>
                                                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '24px' }}>
                                                        <div>
                                                            <div style={{ fontSize: '20px', fontWeight: 800, color: '#EA580C' }}>{module.materials.length}</div>
                                                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Resources</div>
                                                        </div>
                                                        <ChevronRight size={20} color="#94A3B8" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* VIEW 3: Resources */}
                                {materialsViewState === 'resources' && materialsActiveModule && (
                                    <div className="resources-view">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                            <span className="section-label" style={{ margin: 0 }}>{['Certificate', 'Advanced Certificate'].includes(courseType) ? 'Course Materials' : `Materials for ${materialsActiveModule.title}`}</span>
                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                <button className="admin-btn-primary" style={{ background: '#FFF1F2', color: '#E11D48', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setShowVideoModal(true)}>
                                                    <Video size={16} /> Add Video
                                                </button>
                                                <button className="admin-btn-primary" style={{ background: '#EFF6FF', color: '#1D4ED8', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setShowFileModal(true)}>
                                                    <Upload size={16} /> Upload File
                                                </button>
                                            </div>
                                        </div>

                                        {/* Downloadable Resources List */}
                                        <div style={{ marginBottom: '32px' }}>
                                            <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#475569', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <FileText size={18} /> Downloads
                                            </h4>
                                            {materialsActiveModule.materials.filter((m: any) => m.type !== 'Video').length > 0 ? (
                                                <div style={{ display: 'grid', gap: '16px' }}>
                                                    {materialsActiveModule.materials.filter((m: any) => m.type !== 'Video').map((material: any, idx: number) => (
                                                        <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '16px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                                <div style={{ width: '40px', height: '40px', background: '#DBEAFE', color: '#2563EB', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    {material.type === 'PDF' && <FileText size={20} />}
                                                                    {material.type === 'ZIP' && <FileArchive size={20} />}
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontWeight: 700, color: '#1E293B' }}>{material.title}</div>
                                                                    <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>{material.type} • {material.size}</div>
                                                                </div>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingMaterial(material);
                                                                        setEditingMaterialOriginalTitle(material.title);
                                                                        setFileForm({
                                                                            title: material.title,
                                                                            type: material.type,
                                                                            link: material.link || material.url || ''
                                                                        });
                                                                        setShowFileModal(true);
                                                                    }}
                                                                    style={{ width: '36px', height: '36px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#64748B', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                                    title="Edit"
                                                                >
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        showConfirm('Confirm Delete', `Are you sure you want to delete "${material.title}"? This action is permanent.`, async () => {
                                                                            try {
                                                                                const targetBatch = batches.find(b => b.name === selectedBatch);
                                                                                if (!targetBatch || !targetBatch.id) {
                                                                                    toast.error('No active batch found to save changes.');
                                                                                    return;
                                                                                }

                                                                                const updatedSemesters = materialsSemesters.map(sem => {
                                                                                    if (sem.id !== materialsSelectedSemesterId) return sem;
                                                                                    return {
                                                                                        ...sem,
                                                                                        modules: sem.modules.map((mod: any) => {
                                                                                            if (mod.id !== materialsSelectedModuleId) return mod;
                                                                                            return {
                                                                                                ...mod,
                                                                                                materials: mod.materials.filter((m: any) => m.title !== material.title)
                                                                                            };
                                                                                        })
                                                                                    };
                                                                                });

                                                                                const payload = {
                                                                                    name: targetBatch.name,
                                                                                    start_date: targetBatch.startDate,
                                                                                    registration_deadline: targetBatch.registrationDeadline || null,
                                                                                    max_enrollments: parseInt(targetBatch.maxEnrollments) || 50,
                                                                                    status: targetBatch.status,
                                                                                    instructor_id: targetBatch.lecturerId || null,
                                                                                    materials: updatedSemesters
                                                                                };

                                                                                await batchService.update(id!, targetBatch.id, payload);
                                                                                setMaterialsSemesters(updatedSemesters);
                                                                                setBatches(prev => prev.map(b => b.id === targetBatch.id ? { ...b, materials: updatedSemesters } : b));
                                                                                toast.success('Course material deleted from database.');
                                                                            } catch (err: any) {
                                                                                console.error('Failed to delete course material:', err);
                                                                                toast.error('Failed to delete course material from database.');
                                                                            }
                                                                        });
                                                                    }}
                                                                    style={{ width: '36px', height: '36px', background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#EF4444', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', padding: '32px', borderRadius: '16px', textAlign: 'center', color: '#94A3B8' }}>
                                                    No downloadable resources added yet.
                                                </div>
                                            )}
                                        </div>

                                        {/* Videos List */}
                                        <div>
                                            <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#475569', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Video size={18} /> Lesson Recordings
                                            </h4>
                                            {materialsActiveModule.materials.filter((m: any) => m.type === 'Video').length > 0 ? (
                                                <div style={{ display: 'grid', gap: '16px' }}>
                                                    {materialsActiveModule.materials.filter((m: any) => m.type === 'Video').map((material: any, idx: number) => (
                                                        <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '16px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                                <div style={{ width: '40px', height: '40px', background: '#FCE7F3', color: '#DB2777', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <Play size={20} />
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontWeight: 700, color: '#1E293B' }}>{material.title}</div>
                                                                    <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>{material.type} • {material.size}</div>
                                                                </div>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingMaterial(material);
                                                                        setEditingMaterialOriginalTitle(material.title);
                                                                        setVideoForm({
                                                                            title: material.title,
                                                                            url: material.url || '',
                                                                            duration: material.size || ''
                                                                        });
                                                                        setShowVideoModal(true);
                                                                    }}
                                                                    style={{ width: '36px', height: '36px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#64748B', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                                    title="Edit"
                                                                >
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        showConfirm('Confirm Delete', `Are you sure you want to delete "${material.title}"? This action is permanent.`, async () => {
                                                                            try {
                                                                                const targetBatch = batches.find(b => b.name === selectedBatch);
                                                                                if (!targetBatch || !targetBatch.id) {
                                                                                    toast.error('No active batch found to save changes.');
                                                                                    return;
                                                                                }

                                                                                const updatedSemesters = materialsSemesters.map(sem => {
                                                                                    if (sem.id !== materialsSelectedSemesterId) return sem;
                                                                                    return {
                                                                                        ...sem,
                                                                                        modules: sem.modules.map((mod: any) => {
                                                                                            if (mod.id !== materialsSelectedModuleId) return mod;
                                                                                            return {
                                                                                                ...mod,
                                                                                                materials: mod.materials.filter((m: any) => m.title !== material.title)
                                                                                            };
                                                                                        })
                                                                                    };
                                                                                });

                                                                                const payload = {
                                                                                    name: targetBatch.name,
                                                                                    start_date: targetBatch.startDate,
                                                                                    registration_deadline: targetBatch.registrationDeadline || null,
                                                                                    max_enrollments: parseInt(targetBatch.maxEnrollments) || 50,
                                                                                    status: targetBatch.status,
                                                                                    instructor_id: targetBatch.lecturerId || null,
                                                                                    materials: updatedSemesters
                                                                                };

                                                                                await batchService.update(id!, targetBatch.id, payload);
                                                                                setMaterialsSemesters(updatedSemesters);
                                                                                setBatches(prev => prev.map(b => b.id === targetBatch.id ? { ...b, materials: updatedSemesters } : b));
                                                                                toast.success('Lesson recording deleted from database.');
                                                                            } catch (err: any) {
                                                                                console.error('Failed to delete lesson recording:', err);
                                                                                toast.error('Failed to delete lesson recording from database.');
                                                                            }
                                                                        });
                                                                    }}
                                                                    style={{ width: '36px', height: '36px', background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#EF4444', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', padding: '32px', borderRadius: '16px', textAlign: 'center', color: '#94A3B8' }}>
                                                    No recordings added yet.
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 6. Enrollment Requests Section */}
                    {activeSection === 'enrollment_req' && (
                        <div className="section-content-fade">
                            <div className="modern-admin-card" style={{ padding: '0', background: 'transparent', border: 'none', boxShadow: 'none' }}>
                                <div className="admin-page-top-card" style={{ background: '#FFFFFF', padding: '32px', borderRadius: '24px', marginBottom: '24px', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                        <div>
                                            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A' }}>Enrollment Requests</h2>
                                            <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>{course.title} ({course.code})</p>
                                        </div>
                                        <button
                                            onClick={handleRefresh}
                                            disabled={isRefreshing}
                                            className="admin-btn-outline"
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '40px', padding: '0 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#475569' }}
                                        >
                                            <RefreshCw size={16} style={{ animation: isRefreshing ? 'spin 1.5s linear infinite' : 'none' }} />
                                            {isRefreshing ? 'Refreshing...' : 'Refresh List'}
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', borderTop: '1px solid #F1F5F9', paddingTop: '20px', gap: '24px' }}>
                                        <div className="search-box-wrapper" style={{ position: 'relative', flex: 1 }}>
                                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                                            <input
                                                type="text"
                                                placeholder="Search by name or reg no..."
                                                className="admin-input"
                                                style={{ paddingLeft: '36px', width: '100%', height: '40px', margin: 0 }}
                                                value={enrollmentSearchQuery}
                                                onChange={(e) => setEnrollmentSearchQuery(e.target.value)}
                                            />
                                        </div>
                                        <div className="filter-pill-group" style={{ display: 'flex', gap: '12px' }}>
                                            <button
                                                className={`pill-btn ${enrollmentTypeFilter === 'all' ? 'active' : ''}`}
                                                onClick={() => setEnrollmentTypeFilter('all')}
                                            >All</button>
                                            <button
                                                className={`pill-btn ${enrollmentTypeFilter === 'new' ? 'active' : ''}`}
                                                onClick={() => setEnrollmentTypeFilter('new')}
                                            >New</button>
                                            <button
                                                className={`pill-btn ${enrollmentTypeFilter === 'existing' ? 'active' : ''}`}
                                                onClick={() => setEnrollmentTypeFilter('existing')}
                                            >Existing</button>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ background: '#FFFFFF', borderRadius: '18px', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)', overflow: 'hidden' }}>
                                    <div className="approval-table-wrapper">
                                        <table className="approval-table">
                                            <thead>
                                                <tr>
                                                    <th>Applicant Details</th>
                                                    <th>Type</th>
                                                    <th>Reg. No</th>
                                                    <th>Received At</th>
                                                    <th>Status</th>
                                                    <th style={{ textAlign: 'center' }}>Verification</th>
                                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {getFilteredEnrollmentRequests().sort((a, b) => {
                                                    const aPending = (a.status || '').toLowerCase() === 'pending';
                                                    const bPending = (b.status || '').toLowerCase() === 'pending';
                                                    if (aPending && !bPending) return -1;
                                                    if (!aPending && bPending) return 1;

                                                    const aTime = a.rawApp?.created_at ? new Date(a.rawApp.created_at).getTime() : new Date(a.receivedTime).getTime();
                                                    const bTime = b.rawApp?.created_at ? new Date(b.rawApp.created_at).getTime() : new Date(b.receivedTime).getTime();
                                                    return bTime - aTime;
                                                }).map((req, idx) => {
                                                    const isFullyApproved = req.stages && req.stages.secretary === 'approved' && req.stages.coordinator === 'approved' && req.stages.director === 'approved';

                                                    return (
                                                        <tr key={idx}>
                                                            <td>
                                                                <div className="at-applicant">
                                                                    <div>
                                                                        <span className="at-name">{req.name}</span>
                                                                        <span className="at-email">{req.email}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className={`at-type-badge ${req.type.toLowerCase() === 'new' ? 'new' : 'existing'}`}>
                                                                    {req.type}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div style={{ fontSize: '13px', fontWeight: 500, color: req.type.toLowerCase() === 'new' ? '#94A3B8' : '#7C3AED' }}>
                                                                    {req.studentNumber || '-'}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div style={{ fontSize: '13px', color: '#64748B' }}>
                                                                    {req.receivedTime.split(' ')[1]} {req.receivedTime.split(' ')[2]}
                                                                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>{req.receivedTime.split(' ')[0]}</div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className={`at-status-badge ${getDisplayStatus(req)}`} style={{
                                                                    background: getStatusColor(getDisplayStatus(req)).bg,
                                                                    color: getStatusColor(getDisplayStatus(req)).text
                                                                }}>
                                                                    {getDisplayStatus(req)}
                                                                </span>
                                                            </td>
                                                            <td style={{ textAlign: 'center' }}>
                                                                <VerificationStages
                                                                    secretaryStatus={req.stages?.secretary}
                                                                    coordinatorStatus={req.stages?.coordinator}
                                                                    directorStatus={req.stages?.director}
                                                                />
                                                            </td>
                                                            <td>
                                                                <div className="at-actions" style={{ justifyContent: 'flex-end' }}>
                                                                    <button className="at-action-btn view" title="View Details" onClick={() => handleViewDetails(req, 'enrollment')}><Eye size={16} /></button>
                                                                    {(req.status || 'pending').toLowerCase() === 'pending' && (userRole === 'secretary' || userRole === 'coordinator' || userRole === 'director') && (!req.rawApp || (
                                                                        (req.rawApp.approval_level === 0 && userRole === 'secretary') ||
                                                                        (req.rawApp.approval_level === 1 && userRole === 'coordinator') ||
                                                                        (req.rawApp.approval_level === 2 && userRole === 'director')
                                                                    )) && (
                                                                            <button className="at-action-btn approve" title={req.rawApp ? `Approve (Stage ${req.rawApp.approval_level + 1}/3)` : "Approve"} onClick={() => handleActionRequest(req.realId, 'approved', 'enrollment')}><Check size={16} /></button>
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
                    )}

                    {/* 7. Application Approvals Section */}
                    {activeSection === 'approvals_req' && (
                        <div className="section-content-fade">
                            <div className="admin-page-top-card" style={{ background: '#FFFFFF', padding: '32px', borderRadius: '24px', marginBottom: '24px', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A' }}>Exam Approvals</h2>
                                    <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>{course.title} ({course.code})</p>
                                </div>
                                <button
                                    onClick={handleRefresh}
                                    disabled={isRefreshing}
                                    className="admin-btn-outline"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '40px', padding: '0 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#475569' }}
                                >
                                    <RefreshCw size={16} style={{ animation: isRefreshing ? 'spin 1.5s linear infinite' : 'none' }} />
                                    {isRefreshing ? 'Refreshing...' : 'Refresh List'}
                                </button>
                            </div>

                            <div style={{ background: '#FFFFFF', borderRadius: '18px', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)', overflow: 'hidden' }}>
                                <div className="approval-table-wrapper">
                                    <table className="approval-table">
                                        <thead>
                                            <tr>
                                                <th>Student Details</th>
                                                <th>Type / Subject</th>
                                                <th>Received At</th>
                                                <th>Status</th>
                                                <th style={{ textAlign: 'center' }}>Verification</th>
                                                <th style={{ textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {getFilteredApprovalRequests().filter(req => req.type === 'regular').sort((a, b) => new Date(b.receivedTime).getTime() - new Date(a.receivedTime).getTime()).map((req, idx) => {
                                                const isFullyApproved = req.stages && req.stages.secretary === 'approved' && req.stages.coordinator === 'approved' && req.stages.director === 'approved';

                                                return (
                                                    <tr key={idx}>
                                                        <td>
                                                            <div className="at-applicant">
                                                                <div>
                                                                    <span className="at-name">{req.name}</span>
                                                                    <span className="at-email">{req.studentNumber || 'CODL/2404'}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                                <span style={{ fontSize: '14px', fontWeight: 700, color: '#475569' }}>{req.subject}</span>
                                                                <span style={{ fontSize: '12px', color: '#94A3B8' }}>{req.sem}</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div style={{ fontSize: '13px', color: '#64748B' }}>
                                                                {req.receivedTime.split(' ')[1]} {req.receivedTime.split(' ')[2]}
                                                                <div style={{ fontSize: '11px', color: '#94A3B8' }}>{req.receivedTime.split(' ')[0]}</div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className={`at-status-badge ${req.status}`} style={{
                                                                background: getStatusColor(req.status).bg,
                                                                color: getStatusColor(req.status).text
                                                            }}>
                                                                {req.status}
                                                            </span>
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <VerificationStages
                                                                secretaryStatus={req.stages?.secretary}
                                                                coordinatorStatus={req.stages?.coordinator}
                                                                directorStatus={req.stages?.director}
                                                            />
                                                        </td>
                                                        <td>
                                                            <div className="at-actions" style={{ justifyContent: 'flex-end' }}>
                                                                <button className="at-action-btn view" title="Review Application" onClick={() => handleViewDetails(req, 'approval')}><Eye size={16} /></button>
                                                                {(req.status || 'pending').toLowerCase() === 'pending' && (
                                                                    (userRole === 'secretary' && (req.stages?.secretary || 'pending').toLowerCase() === 'pending') ||
                                                                    (userRole === 'coordinator' && (req.stages?.secretary || 'pending').toLowerCase() === 'approved' && (req.stages?.coordinator || 'pending').toLowerCase() === 'pending') ||
                                                                    (userRole === 'director' && (req.stages?.coordinator || 'pending').toLowerCase() === 'approved' && (req.stages?.director || 'pending').toLowerCase() === 'pending')
                                                                ) && (
                                                                        <button className="at-action-btn approve" title="Approve Request" onClick={() => handleActionRequest(req.id, 'approved', 'approval')}><Check size={16} /></button>
                                                                    )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {getFilteredApprovalRequests().filter(req => req.type === 'regular').length === 0 && (
                                                <tr>
                                                    <td colSpan={6}>
                                                        <div className="at-empty" style={{ padding: '80px 0', textAlign: 'center' }}>
                                                            <div style={{ width: '80px', height: '80px', background: '#F8FAFC', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                                                <Clock size={32} color="#94A3B8" />
                                                            </div>
                                                            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#475569', margin: '0 0 8px 0' }}>No Pending Requests</h3>
                                                            <p style={{ color: '#94A3B8', fontSize: '14px', maxWidth: '300px', margin: '0 auto' }}>
                                                                No pending Exam Application requests found.
                                                            </p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}



            {/* 8. Waitlist Section */}
            {activeSection === 'waitlist' && (
                <div className="section-content-fade">
                    <div className="admin-page-top-card" style={{ background: '#FFFFFF', padding: '32px', borderRadius: '24px', marginBottom: '24px', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Postponements & Reattempts Waitlist</h2>
                            <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>{course.title} ({course.code})</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="admin-btn-outline"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '40px', padding: '0 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#475569' }}
                            >
                                <RefreshCw size={16} style={{ animation: isRefreshing ? 'spin 1.5s linear infinite' : 'none' }} />
                                {isRefreshing ? 'Refreshing...' : 'Refresh List'}
                            </button>
                            <button
                                onClick={() => handleOpenAddWaitlistModal()}
                                className="create-exam-btn"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '40px', padding: '0 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, border: 'none', background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)', color: '#FFFFFF', boxShadow: '0 4px 15px rgba(124,58,237,0.2)' }}
                            >
                                <Plus size={18} /> Add Student
                            </button>
                        </div>
                    </div>

                    <div className="admin-sub-tab-group high-fidelity" style={{ marginBottom: '24px', display: 'flex', background: '#FFFFFF', padding: '12px', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.05)' }}>
                        {[
                            { id: 'postponements', label: 'Postponements', count: filteredWaitlistPostponements.length },
                            { id: 'reattempts', label: 'Reattempts', count: filteredWaitlistReattempts.length }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setWaitlistTab(tab.id as any)}
                                className={`tab-high-fidelity ${waitlistTab === tab.id ? 'active' : ''}`}
                                style={{ flex: 1 }}
                            >
                                {tab.label}
                                <span className="tab-count">{tab.count}</span>
                            </button>
                        ))}
                    </div>

                    <div style={{ background: '#FFFFFF', borderRadius: '18px', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)', overflow: 'hidden' }}>
                        <div className="admin-table-container" style={{ margin: 0, border: 'none' }}>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th style={{ paddingLeft: '24px' }}>Application ID</th>
                                        <th>Student Details</th>
                                        <th>{waitlistTab === 'postponements' ? 'Examination unable to take' : 'Examination with Reattempt(s)'}</th>
                                        <th style={{ textAlign: 'center' }}>Original Batch</th>
                                        <th style={{ textAlign: 'center' }}>Status</th>
                                        <th style={{ textAlign: 'center', paddingRight: '24px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {waitlistTab === 'postponements' ? (
                                        filteredWaitlistPostponements.length > 0 ? (
                                            filteredWaitlistPostponements.map((postponement: any) => {
                                                const isApproved = postponement.status === 'approved';
                                                return (
                                                    <tr key={postponement.id}>
                                                        <td style={{ paddingLeft: '24px', fontWeight: 700, color: '#7C3AED' }}>
                                                            {postponement.application_id}
                                                        </td>
                                                        <td>
                                                            <div style={{ fontWeight: 700, color: '#0F172A' }}>{postponement.studentName}</div>
                                                            <div style={{ fontSize: '12px', color: '#64748B' }}>{postponement.studentNumber}</div>
                                                        </td>
                                                        <td>
                                                            <div style={{ fontWeight: 600, color: '#475569' }}>{postponement.examTitle}</div>
                                                            {postponement.raw?.exams && postponement.raw.exams.length > 0 && (
                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                                                                    {postponement.raw.exams.map((sub: string, idx: number) => (
                                                                        <span key={idx} style={{
                                                                            fontSize: '10px',
                                                                            background: '#EEF2FF',
                                                                            color: '#4F46E5',
                                                                            padding: '2px 8px',
                                                                            borderRadius: '4px',
                                                                            fontWeight: 700,
                                                                            border: '1px solid #4F46E520'
                                                                        }}>
                                                                            {sub}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <div style={{ fontWeight: 600, color: '#1E293B' }}>{postponement.batch || 'N/A'}</div>
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <span style={{
                                                                display: 'inline-block',
                                                                padding: '6px 12px',
                                                                borderRadius: '8px',
                                                                background: isApproved ? '#DCFCE7' : '#FEF3C7',
                                                                color: isApproved ? '#10B981' : '#D97706',
                                                                fontSize: '11px',
                                                                fontWeight: 800,
                                                                textTransform: 'uppercase',
                                                                border: `1px solid ${isApproved ? '#10B98130' : '#D9770630'}`,
                                                                letterSpacing: '0.05em'
                                                            }}>
                                                                {postponement.status}
                                                            </span>
                                                        </td>
                                                        <td style={{ textAlign: 'center', paddingRight: '24px' }}>
                                                            <button
                                                                className="at-action-btn view"
                                                                title="View Details"
                                                                onClick={() => handleOpenEditWaitlistModal(postponement, 'postponement')}
                                                                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', background: '#F1F5F9', border: 'none', cursor: 'pointer', color: '#475569' }}
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: '#94A3B8' }}>No postponements waiting in the waitlist.</td>
                                            </tr>
                                        )
                                    ) : (
                                        filteredWaitlistReattempts.length > 0 ? (
                                            filteredWaitlistReattempts.map((reattempt: any) => {
                                                const isApproved = reattempt.status === 'approved';
                                                return (
                                                    <tr key={reattempt.id}>
                                                        <td style={{ paddingLeft: '24px', fontWeight: 700, color: '#7C3AED' }}>
                                                            {reattempt.application_id}
                                                        </td>
                                                        <td>
                                                            <div style={{ fontWeight: 700, color: '#0F172A' }}>{reattempt.studentName}</div>
                                                            <div style={{ fontSize: '12px', color: '#64748B' }}>{reattempt.studentNumber}</div>
                                                        </td>
                                                        <td>
                                                            <div style={{ fontWeight: 600, color: '#475569' }}>{reattempt.subject}</div>
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <div style={{ fontWeight: 600, color: '#1E293B' }}>{reattempt.batch || 'N/A'}</div>
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <span style={{
                                                                display: 'inline-block',
                                                                padding: '6px 12px',
                                                                borderRadius: '8px',
                                                                background: isApproved ? '#DCFCE7' : '#FEF3C7',
                                                                color: isApproved ? '#10B981' : '#D97706',
                                                                fontSize: '11px',
                                                                fontWeight: 800,
                                                                textTransform: 'uppercase',
                                                                border: `1px solid ${isApproved ? '#10B98130' : '#D9770630'}`,
                                                                letterSpacing: '0.05em'
                                                            }}>
                                                                {reattempt.status}
                                                            </span>
                                                        </td>
                                                        <td style={{ textAlign: 'center', paddingRight: '24px' }}>
                                                            <button
                                                                className="at-action-btn view"
                                                                title="View Details"
                                                                onClick={() => handleOpenEditWaitlistModal(reattempt, 'reattempt')}
                                                                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', background: '#F1F5F9', border: 'none', cursor: 'pointer', color: '#475569' }}
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: '#94A3B8' }}>No reattempts waiting in the waitlist.</td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Student to Waitlist Modal */}
            {showWaitlistAddModal && (
                <div className="cm-modal-overlay" style={{ zIndex: 1100 }} onClick={() => setShowWaitlistAddModal(false)}>
                    <div className="cm-modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                        <div className="cm-modal-header">
                            <div>
                                <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Add Student to Waitlist</h2>
                            </div>
                            <button className="cm-modal-close" onClick={() => setShowWaitlistAddModal(false)}><X size={20} /></button>
                        </div>

                        <form onSubmit={(e) => handleSaveWaitlistRecord(e, false)} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', margin: 0 }}>
                            <div className="cm-modal-body" style={{ padding: '24px 28px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div className="cm-form-group">
                                        <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>Waitlist Type</label>
                                        <div style={{ display: 'flex', gap: '16px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                                                <input
                                                    type="radio"
                                                    name="waitlistType"
                                                    checked={waitlistForm.type === 'postponement'}
                                                    onChange={() => setWaitlistForm(prev => ({ ...prev, type: 'postponement', applicationId: 'P-', examTitle: '', examId: '' }))}
                                                />
                                                Postponement
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                                                <input
                                                    type="radio"
                                                    name="waitlistType"
                                                    checked={waitlistForm.type === 'reattempt'}
                                                    onChange={() => setWaitlistForm(prev => ({ ...prev, type: 'reattempt', applicationId: 'R-', subjectId: '', examId: '' }))}
                                                />
                                                Reattempt
                                            </label>
                                        </div>
                                    </div>

                                    <div className="cm-form-group">
                                        <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>
                                            Application ID
                                        </label>
                                        <input
                                            type="text"
                                            className="cm-input"
                                            required
                                            placeholder={waitlistForm.type === 'postponement' ? 'P-1001' : 'R-1001'}
                                            value={waitlistForm.applicationId}
                                            onChange={e => {
                                                const val = e.target.value.toUpperCase();
                                                const prefix = waitlistForm.type === 'postponement' ? 'P-' : 'R-';
                                                if (!val.startsWith(prefix)) {
                                                    setWaitlistForm(prev => ({ ...prev, applicationId: prefix }));
                                                } else {
                                                    setWaitlistForm(prev => ({ ...prev, applicationId: val }));
                                                }
                                            }}
                                            style={{ textTransform: 'uppercase' }}
                                        />
                                    </div>

                                    <div className="cm-form-group" style={{ position: 'relative' }}>
                                        <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>Student Registration No</label>
                                        <input
                                            type="text"
                                            className="cm-input"
                                            required
                                            placeholder="26CODL0001"
                                            value={waitlistForm.studentRegNo}
                                            onChange={e => handleRegNoChange(e.target.value)}
                                            onFocus={() => {
                                                if (waitlistForm.studentRegNo) {
                                                    handleRegNoChange(waitlistForm.studentRegNo);
                                                }
                                            }}
                                        />
                                        {showRegNoSuggestions && regNoSuggestions.length > 0 && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '100%',
                                                left: 0,
                                                right: 0,
                                                background: '#FFFFFF',
                                                border: '1px solid #E2E8F0',
                                                borderRadius: '12px',
                                                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                                                zIndex: 10,
                                                maxHeight: '180px',
                                                overflowY: 'auto',
                                                marginTop: '4px'
                                            }}>
                                                {regNoSuggestions.map(student => (
                                                    <div
                                                        key={student.id}
                                                        onClick={() => handleSelectSuggestedStudent(student)}
                                                        style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column' }}
                                                        className="suggestion-hover-item"
                                                    >
                                                        <span style={{ fontWeight: 700, color: '#0F172A' }}>{student.id}</span>
                                                        <span style={{ fontSize: '12px', color: '#64748B' }}>{student.name} ({student.batch || 'No Batch'})</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="cm-form-group">
                                        <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>Student's Full Name</label>
                                        <input
                                            type="text"
                                            className="cm-input"
                                            readOnly
                                            value={waitlistForm.studentName}
                                            style={{ background: '#F8FAFC', color: '#64748B' }}
                                        />
                                    </div>
                                    <div className="cm-form-group">
                                        <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>Origin Batch</label>
                                        <input
                                            type="text"
                                            className="cm-input"
                                            readOnly
                                            value={waitlistForm.originBatch}
                                            style={{ background: '#F8FAFC', color: '#64748B' }}
                                        />
                                    </div>

                                    {waitlistForm.type === 'postponement' ? (
                                        <div className="cm-form-group">
                                            <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>Name of the examination that unable to take</label>
                                            <select
                                                className="cm-input"
                                                required
                                                value={waitlistForm.examTitle}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setWaitlistForm(prev => ({ ...prev, examTitle: val, selectedSubjects: [] }));
                                                }}
                                            >
                                                <option value="">-- Select Examination --</option>
                                                {exams
                                                    .filter(exam => !waitlistForm.originBatch || exam.batch === waitlistForm.originBatch || exam.batch_name === waitlistForm.originBatch)
                                                    .map(exam => (
                                                        <option key={exam.id} value={exam.title}>{exam.title}</option>
                                                    ))
                                                }
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="cm-form-group">
                                            <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>Examination with Reattempts</label>
                                            <select
                                                className="cm-input"
                                                required
                                                value={waitlistForm.examId}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setWaitlistForm(prev => ({ ...prev, examId: val, subjectId: '', selectedSubjects: [] }));
                                                }}
                                            >
                                                <option value="">-- Select Exam --</option>
                                                {exams
                                                    .filter(exam => !waitlistForm.originBatch || exam.batch === waitlistForm.originBatch || exam.batch_name === waitlistForm.originBatch)
                                                    .map(exam => (
                                                        <option key={exam.id} value={exam.id.toString()}>{exam.title}</option>
                                                    ))
                                                }
                                            </select>
                                        </div>
                                    )}

                                    {/* dynamic checkboxes section */}
                                    {(() => {
                                        const selectedExam = waitlistForm.type === 'postponement'
                                            ? exams.find(e => e.title === waitlistForm.examTitle)
                                            : exams.find(e => e.id.toString() === waitlistForm.examId.toString());
                                        const subjectsOfExam = selectedExam?.subjects || [];
                                        if (subjectsOfExam.length === 0) return null;
                                        return (
                                            <div className="cm-form-group">
                                                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>Select Subject(s) Included</label>
                                                <div style={{
                                                    border: '1px solid #E2E8F0',
                                                    borderRadius: '12px',
                                                    padding: '16px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '12px',
                                                    maxHeight: '200px',
                                                    overflowY: 'auto',
                                                    background: '#F8FAFC'
                                                }}>
                                                    {subjectsOfExam.map((sub: any, idx: number) => {
                                                        const subLabel = sub.code ? `${sub.code} - ${sub.name}` : sub.name;
                                                        const isChecked = waitlistForm.selectedSubjects.includes(subLabel);
                                                        return (
                                                            <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', margin: 0 }}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            setWaitlistForm(prev => ({
                                                                                ...prev,
                                                                                selectedSubjects: [...prev.selectedSubjects, subLabel]
                                                                            }));
                                                                        } else {
                                                                            setWaitlistForm(prev => ({
                                                                                ...prev,
                                                                                selectedSubjects: prev.selectedSubjects.filter(s => s !== subLabel)
                                                                            }));
                                                                        }
                                                                    }}
                                                                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#7C3AED' }}
                                                                />
                                                                {subLabel}
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    <div className="cm-form-group">
                                        <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>Details</label>
                                        <textarea
                                            className="cm-input"
                                            rows={3}
                                            placeholder="Enter details or reason..."
                                            value={waitlistForm.reason}
                                            onChange={e => setWaitlistForm(prev => ({ ...prev, reason: e.target.value }))}
                                            style={{
                                                resize: 'vertical',
                                                minHeight: '100px',
                                                fontFamily: 'inherit'
                                            }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', cursor: 'pointer' }} onClick={() => setWaitlistForm(prev => ({ ...prev, approved: !prev.approved }))}>
                                        <input
                                            type="checkbox"
                                            id="addApprovedCheckbox"
                                            checked={waitlistForm.approved}
                                            onChange={e => setWaitlistForm(prev => ({ ...prev, approved: e.target.checked }))}
                                            onClick={e => e.stopPropagation()}
                                            style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#7C3AED', margin: 0 }}
                                        />
                                        <label htmlFor="addApprovedCheckbox" style={{ fontWeight: 600, color: '#334155', cursor: 'pointer', userSelect: 'none', fontSize: '14px', margin: 0 }}>Application Approved</label>
                                    </div>
                                </div>
                            </div>

                            <div className="cm-modal-footer">
                                <button type="button" className="admin-btn-outline" onClick={() => setShowWaitlistAddModal(false)}>Cancel</button>
                                <button type="submit" className="create-exam-btn" disabled={isSavingWaitlist} style={{ background: isSavingWaitlist ? '#A78BFA' : 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)', border: 'none', color: '#FFFFFF', opacity: isSavingWaitlist ? 0.7 : 1, cursor: isSavingWaitlist ? 'not-allowed' : 'pointer' }}>{isSavingWaitlist ? 'Saving...' : 'Add to Waitlist'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View/Edit Waitlist Record Modal */}
            {showWaitlistEditModal && editingWaitlistRecord && (
                <div className="cm-modal-overlay" style={{ zIndex: 1100 }} onClick={() => { setShowWaitlistEditModal(false); setEditingWaitlistRecord(null); }}>
                    <div className="cm-modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                        <div className="cm-modal-header">
                            <div>
                                <h2 style={{ fontSize: '20px', fontWeight: 800 }}>
                                    {editingWaitlistRecord.type === 'postponement' ? 'Postponement Details' : 'Reattempt Details'}
                                </h2>
                            </div>
                            <button className="cm-modal-close" onClick={() => { setShowWaitlistEditModal(false); setEditingWaitlistRecord(null); }}><X size={20} /></button>
                        </div>

                        <form onSubmit={(e) => handleSaveWaitlistRecord(e, true)} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', margin: 0 }}>
                            <div className="cm-modal-body" style={{ padding: '24px 28px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div className="cm-form-group">
                                        <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>
                                            Application ID
                                        </label>
                                        <input
                                            type="text"
                                            className="cm-input"
                                            required
                                            value={waitlistForm.applicationId}
                                            onChange={e => {
                                                const val = e.target.value.toUpperCase();
                                                const prefix = waitlistForm.type === 'postponement' ? 'P-' : 'R-';
                                                if (!val.startsWith(prefix)) {
                                                    setWaitlistForm(prev => ({ ...prev, applicationId: prefix }));
                                                } else {
                                                    setWaitlistForm(prev => ({ ...prev, applicationId: val }));
                                                }
                                            }}
                                            style={{ textTransform: 'uppercase' }}
                                        />
                                    </div>
                                    <div className="cm-form-group">
                                        <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>Student Registration No</label>
                                        <input
                                            type="text"
                                            className="cm-input"
                                            readOnly
                                            value={waitlistForm.studentRegNo}
                                            style={{ background: '#F8FAFC', color: '#64748B' }}
                                        />
                                    </div>
                                    <div className="cm-form-group">
                                        <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>Student's Full Name</label>
                                        <input
                                            type="text"
                                            className="cm-input"
                                            readOnly
                                            value={waitlistForm.studentName}
                                            style={{ background: '#F8FAFC', color: '#64748B' }}
                                        />
                                    </div>
                                    <div className="cm-form-group">
                                        <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>Origin Batch</label>
                                        <input
                                            type="text"
                                            className="cm-input"
                                            readOnly
                                            value={waitlistForm.originBatch}
                                            style={{ background: '#F8FAFC', color: '#64748B' }}
                                        />
                                    </div>


                                    {editingWaitlistRecord.type === 'postponement' ? (
                                        <div className="cm-form-group">
                                            <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>Name of the examination that unable to take</label>
                                            <select
                                                className="cm-input"
                                                required
                                                value={waitlistForm.examTitle}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setWaitlistForm(prev => ({ ...prev, examTitle: val, selectedSubjects: [] }));
                                                }}
                                            >
                                                <option value="">-- Select Examination --</option>
                                                {exams
                                                    .filter(exam => !waitlistForm.originBatch || exam.batch === waitlistForm.originBatch || exam.batch_name === waitlistForm.originBatch)
                                                    .map(exam => (
                                                        <option key={exam.id} value={exam.title}>{exam.title}</option>
                                                    ))
                                                }
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="cm-form-group">
                                            <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>Examination with Reattempts</label>
                                            <select
                                                className="cm-input"
                                                required
                                                value={waitlistForm.examId}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setWaitlistForm(prev => ({ ...prev, examId: val, subjectId: '', selectedSubjects: [] }));
                                                }}
                                            >
                                                <option value="">-- Select Exam --</option>
                                                {exams
                                                    .filter(exam => !waitlistForm.originBatch || exam.batch === waitlistForm.originBatch || exam.batch_name === waitlistForm.originBatch)
                                                    .map(exam => (
                                                        <option key={exam.id} value={exam.id.toString()}>{exam.title}</option>
                                                    ))
                                                }
                                            </select>
                                        </div>
                                    )}

                                    {/* dynamic checkboxes section */}
                                    {(() => {
                                        const selectedExam = waitlistForm.type === 'postponement'
                                            ? exams.find(e => e.title === waitlistForm.examTitle)
                                            : exams.find(e => e.id.toString() === waitlistForm.examId.toString());
                                        const subjectsOfExam = selectedExam?.subjects || [];
                                        if (subjectsOfExam.length === 0) return null;
                                        return (
                                            <div className="cm-form-group">
                                                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>
                                                    {waitlistForm.type === 'postponement' ? 'Select Subject(s) Included' : 'Select Subject Included'}
                                                </label>
                                                <div style={{
                                                    border: '1px solid #E2E8F0',
                                                    borderRadius: '12px',
                                                    padding: '16px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '12px',
                                                    maxHeight: '200px',
                                                    overflowY: 'auto',
                                                    background: '#F8FAFC'
                                                }}>
                                                    {subjectsOfExam.map((sub: any, idx: number) => {
                                                        const subLabel = sub.code ? `${sub.code} - ${sub.name}` : sub.name;
                                                        const isChecked = waitlistForm.selectedSubjects.includes(subLabel);
                                                        return (
                                                            <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', margin: 0 }}>
                                                                <input
                                                                    type={waitlistForm.type === 'postponement' ? 'checkbox' : 'radio'}
                                                                    name="editSubjectSelection"
                                                                    checked={isChecked}
                                                                    onChange={(e) => {
                                                                        if (waitlistForm.type === 'postponement') {
                                                                            if (e.target.checked) {
                                                                                setWaitlistForm(prev => ({
                                                                                    ...prev,
                                                                                    selectedSubjects: [...prev.selectedSubjects, subLabel]
                                                                                }));
                                                                            } else {
                                                                                setWaitlistForm(prev => ({
                                                                                    ...prev,
                                                                                    selectedSubjects: prev.selectedSubjects.filter(s => s !== subLabel)
                                                                                }));
                                                                            }
                                                                        } else {
                                                                            setWaitlistForm(prev => ({
                                                                                ...prev,
                                                                                selectedSubjects: [subLabel]
                                                                            }));
                                                                        }
                                                                    }}
                                                                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#7C3AED' }}
                                                                />
                                                                {subLabel}
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    <div className="cm-form-group">
                                        <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>Details</label>
                                        <textarea
                                            className="cm-input"
                                            rows={3}
                                            placeholder="Enter details or reason..."
                                            value={waitlistForm.reason}
                                            onChange={e => setWaitlistForm(prev => ({ ...prev, reason: e.target.value }))}
                                            style={{
                                                resize: 'vertical',
                                                minHeight: '100px',
                                                fontFamily: 'inherit'
                                            }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', cursor: 'pointer' }} onClick={() => setWaitlistForm(prev => ({ ...prev, approved: !prev.approved }))}>
                                        <input
                                            type="checkbox"
                                            id="editApprovedCheckbox"
                                            checked={waitlistForm.approved}
                                            onChange={e => setWaitlistForm(prev => ({ ...prev, approved: e.target.checked }))}
                                            onClick={e => e.stopPropagation()}
                                            style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#7C3AED', margin: 0 }}
                                        />
                                        <label htmlFor="editApprovedCheckbox" style={{ fontWeight: 600, color: '#334155', cursor: 'pointer', userSelect: 'none', fontSize: '14px', margin: 0 }}>Application Approved</label>
                                    </div>
                                </div>
                            </div>

                            <div className="cm-modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <button
                                    type="button"
                                    className="admin-btn-outline"
                                    onClick={handleDeleteWaitlistRecord}
                                    style={{ border: '1px solid #EF4444', color: '#EF4444', background: '#FEF2F2', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                >
                                    <Trash2 size={16} /> Delete Record
                                </button>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button type="button" className="admin-btn-outline" onClick={() => { setShowWaitlistEditModal(false); setEditingWaitlistRecord(null); }}>Cancel</button>
                                    <button type="submit" className="create-exam-btn" disabled={isSavingWaitlist} style={{ background: isSavingWaitlist ? '#A78BFA' : 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)', border: 'none', color: '#FFFFFF', opacity: isSavingWaitlist ? 0.7 : 1, cursor: isSavingWaitlist ? 'not-allowed' : 'pointer' }}>{isSavingWaitlist ? 'Saving...' : 'Save Changes'}</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Exam creation is now handled in a separate page */}

            {confirmConfig.show && (
                <div className="cm-modal-overlay" style={{ zIndex: 1100 }}>
                    <div className="cm-modal" style={{ maxWidth: '400px', textAlign: 'center', padding: '32px' }}>
                        <div style={{ color: '#EF4444', marginBottom: '20px' }}>
                            <AlertCircle size={48} />
                        </div>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1E293B', marginBottom: '12px' }}>{confirmConfig.title}</h2>
                        <p style={{ color: '#64748B', lineHeight: '1.6', marginBottom: '28px' }}>{confirmConfig.message}</p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                                className="admin-btn-outline"
                                onClick={() => setConfirmConfig(prev => ({ ...prev, show: false }))}
                                disabled={isConfirmActionProcessing}
                            >
                                Cancel
                            </button>
                            <button
                                className="create-exam-btn"
                                style={{ background: '#EF4444', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.25)', opacity: isConfirmActionProcessing ? 0.7 : 1 }}
                                onClick={async () => {
                                    if (isConfirmActionProcessing) return;
                                    setIsConfirmActionProcessing(true);
                                    try {
                                        await confirmConfig.action();
                                    } catch (e) {
                                        console.error(e);
                                    } finally {
                                        setIsConfirmActionProcessing(false);
                                    }
                                }}
                                disabled={isConfirmActionProcessing}
                            >
                                {isConfirmActionProcessing ? 'Processing...' : 'Confirm Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showStudentModal && (
                <div className="cm-modal-overlay">
                    <div className="cm-modal" style={{ maxWidth: '500px', overflow: 'visible' }}>
                        <div className="cm-modal-header">
                            <h2>Manual Student Enrollment</h2>
                            <button className="cm-modal-close" onClick={() => setShowStudentModal(false)}><X size={20} /></button>
                        </div>
                        <div className="cm-modal-body">
                            <form onSubmit={handleAddStudent} className="cm-form-grid" style={{ gridTemplateColumns: '1fr' }}>
                                <div className="cm-form-group" style={{ position: 'relative' }}>
                                    <label>Search Student by ID</label>
                                    <div style={{ position: 'relative' }}>
                                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                                        <input
                                            type="text"
                                            placeholder="Enter Student ID or search by Name..."
                                            required
                                            className="admin-input"
                                            style={{ paddingLeft: '40px' }}
                                            value={enrollForm.id}
                                            onChange={(e) => handleIdChange(e.target.value)}
                                            onFocus={() => handleIdChange(enrollForm.id)}
                                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                        />
                                    </div>

                                    {showSuggestions && idSuggestions.length > 0 && (
                                        <div className="id-suggestions-dropdown">
                                            {idSuggestions.map(u => (
                                                <div
                                                    key={u.id}
                                                    className="suggestion-item"
                                                    onClick={() => handleSelectStudent(u)}
                                                >
                                                    <div style={{ fontWeight: 700, color: '#1E293B' }}>{u.student_number || u.studentNumber}</div>
                                                    <div style={{ fontSize: '12px', color: '#64748B' }}>{(u.full_name || u.fullName)} • {u.email}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="cm-form-grid" style={{ gridTemplateColumns: '1fr 1fr', opacity: enrollForm.name ? 1 : 0.6 }}>
                                    <div className="cm-form-group">
                                        <label>Full Name</label>
                                        <input
                                            type="text"
                                            readOnly
                                            placeholder="Auto-filled"
                                            className="admin-input bg-muted"
                                            value={enrollForm.name}
                                        />
                                    </div>
                                    <div className="cm-form-group">
                                        <label>Email Address</label>
                                        <input
                                            type="email"
                                            readOnly
                                            placeholder="Auto-filled"
                                            className="admin-input bg-muted"
                                            value={enrollForm.email}
                                        />
                                    </div>
                                </div>

                                <div className="cm-form-group">
                                    <label>Enrollment Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="admin-input"
                                        value={enrollForm.date}
                                        onChange={(e) => setEnrollForm({ ...enrollForm, date: e.target.value })}
                                    />
                                </div>

                                <div className="cm-modal-footer" style={{ padding: '20px 0 0 0', borderTop: 'none' }}>
                                    <button type="button" className="admin-btn-outline" onClick={() => setShowStudentModal(false)}>Cancel</button>
                                    <button
                                        type="submit"
                                        className="admin-btn-primary"
                                        style={{ background: '#10B981', opacity: enrollForm.id && enrollForm.name ? 1 : 0.5 }}
                                        disabled={!enrollForm.name}
                                    >
                                        Enroll Student
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {showBatchModal && (
                <div className="cm-modal-overlay">
                    <div className="cm-modal" style={{ maxWidth: '500px' }}>
                        <div className="cm-modal-header">
                            <div>
                                <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Add New Intake Batch</h2>
                                <p style={{ color: '#64748B', fontSize: '14px', marginTop: '2px' }}>Configure essential details for the new academic cycle.</p>
                            </div>
                            <button className="cm-modal-close" onClick={() => setShowBatchModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddBatchSubmit}>
                            <div className="cm-modal-body" style={{ padding: '24px' }}>
                                <div className="cm-form-grid" style={{ gridTemplateColumns: '1fr' }}>
                                    <div className="cm-form-group">
                                        <label className="metric-label">Batch Name</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Batch 04"
                                            className="admin-input"
                                            value={batchForm.name}
                                            onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="cm-form-group">
                                        <label className="metric-label">Subtitle / Label</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Academic Intake Phase"
                                            className="admin-input"
                                            value={batchForm.subtitle}
                                            onChange={(e) => setBatchForm({ ...batchForm, subtitle: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="cm-form-grid" style={{ gridTemplateColumns: batchForm.status === 'Upcoming' ? '1fr 1fr' : '1fr', marginTop: '16px' }}>
                                    <div className="cm-form-group">
                                        <label className="metric-label">Commencement Date</label>
                                        <input
                                            type="date"
                                            required
                                            className="admin-input"
                                            value={batchForm.startDate}
                                            onChange={(e) => setBatchForm({ ...batchForm, startDate: e.target.value })}
                                        />
                                    </div>
                                    {batchForm.status === 'Upcoming' && (
                                        <div className="cm-form-group">
                                            <label className="metric-label">Registration Deadline</label>
                                            <input
                                                type="date"
                                                className="admin-input"
                                                value={batchForm.registrationDeadline}
                                                onChange={(e) => setBatchForm({ ...batchForm, registrationDeadline: e.target.value })}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="cm-form-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '16px' }}>
                                    <div className="cm-form-group">
                                        <label className="metric-label">Max Enrollments</label>
                                        <input
                                            type="number"
                                            required
                                            className="admin-input"
                                            value={batchForm.maxEnrollments}
                                            onChange={(e) => setBatchForm({ ...batchForm, maxEnrollments: e.target.value })}
                                        />
                                    </div>
                                    <div className="cm-form-group">
                                        <label className="metric-label">Initial Status</label>
                                        <select
                                            className="admin-input"
                                            value={batchForm.status}
                                            onChange={(e) => setBatchForm({ ...batchForm, status: e.target.value })}
                                        >
                                            <option value="Upcoming">Upcoming</option>
                                            <option value="Active">Active</option>
                                            <option value="Close">Close</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="cm-modal-footer" style={{ borderTop: 'none', paddingTop: 0, paddingBottom: '24px' }}>
                                <button type="button" className="admin-btn-outline" onClick={() => setShowBatchModal(false)}>Cancel</button>
                                <button
                                    type="submit"
                                    className="admin-btn-primary"
                                    style={{ background: '#7C3AED' }}
                                    disabled={isSubmittingBatch}
                                >
                                    {isSubmittingBatch ? 'Creating...' : 'Create Batch'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showVideoModal && (
                <div className="cm-modal-overlay">
                    <div className="cm-modal" style={{ maxWidth: '480px' }}>
                        <div className="cm-modal-header" style={{ borderBottom: '1px solid #F1F5F9', padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '40px', height: '40px', background: '#FFF1F2', color: '#E11D48', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Video size={20} />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>{editingMaterial ? 'Edit Lesson Recording' : 'Add Lesson Recording'}</h2>
                                    <p style={{ color: '#64748B', fontSize: '13px', marginTop: '2px' }}>{editingMaterial ? 'Update video resource details.' : 'Attach a new video resource to this module.'}</p>
                                </div>
                            </div>
                            <button className="cm-modal-close" onClick={() => { setShowVideoModal(false); setEditingMaterial(null); setVideoForm({ title: '', url: '', duration: '' }); }}><X size={20} /></button>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (!materialsSelectedSemesterId || !materialsSelectedModuleId) return;

                            try {
                                const targetBatch = batches.find(b => b.name === selectedBatch);
                                if (!targetBatch || !targetBatch.id) {
                                    toast.error('No active batch found to save changes.');
                                    return;
                                }

                                let updatedSemesters = [];
                                if (editingMaterial) {
                                    updatedSemesters = materialsSemesters.map(sem => {
                                        if (sem.id !== materialsSelectedSemesterId) return sem;
                                        return {
                                            ...sem,
                                            modules: sem.modules.map((mod: any) => {
                                                if (mod.id !== materialsSelectedModuleId) return mod;
                                                return {
                                                    ...mod,
                                                    materials: mod.materials.map((mat: any) => {
                                                        if (mat.title !== editingMaterialOriginalTitle) return mat;
                                                        return {
                                                            ...mat,
                                                            title: videoForm.title,
                                                            url: videoForm.url,
                                                            size: videoForm.duration || '0:00'
                                                        };
                                                    })
                                                };
                                            })
                                        };
                                    });
                                } else {
                                    const newVideo = {
                                        title: videoForm.title,
                                        type: 'Video',
                                        size: videoForm.duration || '0:00',
                                        locked: false,
                                        url: videoForm.url,
                                        addedAt: new Date().toISOString()
                                    };
                                    updatedSemesters = materialsSemesters.map(sem => {
                                        if (sem.id !== materialsSelectedSemesterId) return sem;
                                        return { ...sem, modules: sem.modules.map((mod: any) => mod.id !== materialsSelectedModuleId ? mod : { ...mod, materials: [...mod.materials, newVideo] }) };
                                    });
                                }

                                const payload = {
                                    name: targetBatch.name,
                                    start_date: targetBatch.startDate,
                                    registration_deadline: targetBatch.registrationDeadline || null,
                                    max_enrollments: parseInt(targetBatch.maxEnrollments) || 50,
                                    status: targetBatch.status,
                                    instructor_id: targetBatch.lecturerId || null,
                                    materials: updatedSemesters
                                };

                                await batchService.update(id!, targetBatch.id, payload);
                                setMaterialsSemesters(updatedSemesters);
                                setBatches(prev => prev.map(b => b.id === targetBatch.id ? { ...b, materials: updatedSemesters } : b));
                                toast.success(editingMaterial ? 'Lesson recording updated successfully in database!' : 'Lesson recording added successfully to database!');
                            } catch (err: any) {
                                console.error('Failed to save lesson recording:', err);
                                toast.error('Failed to save lesson recording in database.');
                            }

                            setShowVideoModal(false);
                            setVideoForm({ title: '', url: '', duration: '' });
                            setEditingMaterial(null);
                        }}>
                            <div className="cm-modal-body" style={{ padding: '24px' }}>
                                <div className="cm-form-group">
                                    <label style={{ color: '#475569', fontWeight: 600, marginBottom: '8px', display: 'block' }}>Video Title</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Lecture 05: Intermediate JavaScript"
                                        className="admin-input"
                                        value={videoForm.title}
                                        onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                                        style={{ width: '100%', height: '45px' }}
                                    />
                                </div>
                                <div className="cm-form-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '20px' }}>
                                    <div className="cm-form-group">
                                        <label style={{ color: '#475569', fontWeight: 600, marginBottom: '8px', display: 'block' }}>Platform / URL</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="YouTube/Vimeo Link"
                                            className="admin-input"
                                            value={videoForm.url}
                                            onChange={(e) => setVideoForm({ ...videoForm, url: e.target.value })}
                                        />
                                    </div>
                                    <div className="cm-form-group">
                                        <label style={{ color: '#475569', fontWeight: 600, marginBottom: '8px', display: 'block' }}>Duration</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 1h 20m"
                                            className="admin-input"
                                            value={videoForm.duration}
                                            onChange={(e) => setVideoForm({ ...videoForm, duration: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="cm-modal-footer" style={{ padding: '0 24px 24px 24px', borderTop: 'none', justifyContent: 'flex-end', gap: '12px' }}>
                                <button type="button" className="admin-btn-outline" style={{ height: '42px', padding: '0 20px' }} onClick={() => { setShowVideoModal(false); setEditingMaterial(null); setVideoForm({ title: '', url: '', duration: '' }); }}>Cancel</button>
                                <button type="submit" className="admin-btn-primary" style={{ background: '#E11D48', height: '42px', padding: '0 24px' }}>{editingMaterial ? 'Save Changes' : 'Add Recording'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showFileModal && (
                <div className="cm-modal-overlay">
                    <div className="cm-modal" style={{ maxWidth: '480px' }}>
                        <div className="cm-modal-header" style={{ borderBottom: '1px solid #F1F5F9', padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '40px', height: '40px', background: '#EFF6FF', color: '#1D4ED8', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Upload size={20} />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>{editingMaterial ? 'Edit Course Material' : 'Upload Course Material'}</h2>
                                    <p style={{ color: '#64748B', fontSize: '13px', marginTop: '2px' }}>{editingMaterial ? 'Update study guides, PDF notes or extra resources.' : 'Upload study guides, PDF notes or extra resources.'}</p>
                                </div>
                            </div>
                            <button className="cm-modal-close" onClick={() => { setShowFileModal(false); setSelectedFile(null); setFileForm({ title: '', type: 'PDF', link: '' }); setEditingMaterial(null); }}><X size={20} /></button>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (!materialsSelectedSemesterId || !materialsSelectedModuleId) return;

                            try {
                                const targetBatch = batches.find(b => b.name === selectedBatch);
                                if (!targetBatch || !targetBatch.id) {
                                    toast.error('No active batch found to save materials to database.');
                                    return;
                                }

                                if (!fileForm.link) {
                                    toast.error('Please provide an external cloud link.');
                                    return;
                                }

                                const uploadedUrl = fileForm.link;
                                let updatedSemesters = [];
                                if (editingMaterial) {
                                    updatedSemesters = materialsSemesters.map(sem => {
                                        if (sem.id !== materialsSelectedSemesterId) return sem;
                                        return {
                                            ...sem,
                                            modules: sem.modules.map((mod: any) => {
                                                if (mod.id !== materialsSelectedModuleId) return mod;
                                                return {
                                                    ...mod,
                                                    materials: mod.materials.map((mat: any) => {
                                                        if (mat.title !== editingMaterialOriginalTitle) return mat;
                                                        return {
                                                            ...mat,
                                                            title: fileForm.title,
                                                            type: fileForm.type,
                                                            size: 'Cloud Link',
                                                            url: uploadedUrl,
                                                            link: uploadedUrl
                                                        };
                                                    })
                                                };
                                            })
                                        };
                                    });
                                } else {
                                    const newFile = {
                                        title: fileForm.title,
                                        type: fileForm.type,
                                        size: 'Cloud Link',
                                        locked: false,
                                        addedAt: new Date().toISOString(),
                                        url: uploadedUrl,
                                        link: uploadedUrl
                                    };
                                    updatedSemesters = materialsSemesters.map(sem => {
                                        if (sem.id !== materialsSelectedSemesterId) return sem;
                                        return { ...sem, modules: sem.modules.map((mod: any) => mod.id !== materialsSelectedModuleId ? mod : { ...mod, materials: [...mod.materials, newFile] }) };
                                    });
                                }

                                // Sync the updated semesters list to the DB batch materials!
                                const payload = {
                                    name: targetBatch.name,
                                    start_date: targetBatch.startDate,
                                    registration_deadline: targetBatch.registrationDeadline || null,
                                    max_enrollments: parseInt(targetBatch.maxEnrollments) || 50,
                                    status: targetBatch.status,
                                    instructor_id: targetBatch.lecturerId || null,
                                    materials: updatedSemesters
                                };

                                await batchService.update(id!, targetBatch.id, payload);
                                setMaterialsSemesters(updatedSemesters);

                                // Update the batch state
                                setBatches(prev => prev.map(b => b.id === targetBatch.id ? { ...b, materials: updatedSemesters } : b));

                                toast.success(editingMaterial ? 'Course material updated successfully in database!' : 'Course material added successfully to database!');
                            } catch (err: any) {
                                console.error('Failed to save course material:', err);
                                toast.error(err.response?.data?.message || 'Failed to persist course material in database.');
                            }

                            setShowFileModal(false);
                            setFileForm({ title: '', type: 'PDF', link: '' });
                            setSelectedFile(null);
                            setEditingMaterial(null);
                        }}>
                            <div className="cm-modal-body" style={{ padding: '24px' }}>
                                <div className="cm-form-group">
                                    <label style={{ color: '#475569', fontWeight: 600, marginBottom: '8px', display: 'block' }}>Resource Title</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Chapter 01: Introduction PDF"
                                        className="admin-input"
                                        value={fileForm.title}
                                        onChange={(e) => setFileForm({ ...fileForm, title: e.target.value })}
                                        style={{ width: '100%', height: '45px' }}
                                    />
                                </div>
                                <div className="cm-form-group" style={{ marginTop: '20px' }}>
                                    <label style={{ color: '#475569', fontWeight: 600, marginBottom: '8px', display: 'block' }}>File Type</label>
                                    <select
                                        className="admin-input"
                                        value={fileForm.type}
                                        onChange={(e) => setFileForm({ ...fileForm, type: e.target.value })}
                                        style={{ width: '100%', height: '45px' }}
                                    >
                                        <option value="PDF">PDF Document</option>
                                        <option value="ZIP">ZIP Archive</option>
                                        <option value="DOCX">DOCX File</option>
                                        <option value="PPTX">PowerPoint</option>
                                    </select>
                                </div>
                                <div className="cm-form-group" style={{ marginTop: '20px' }}>
                                    <label style={{ color: '#475569', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                                        External Link (OneDrive / Google Drive)
                                    </label>
                                    <input
                                        type="url"
                                        required
                                        placeholder="e.g. https://drive.google.com/..."
                                        className="admin-input"
                                        value={fileForm.link || ''}
                                        onChange={(e) => setFileForm({ ...fileForm, link: e.target.value })}
                                        style={{ width: '100%', height: '45px' }}
                                    />
                                </div>
                            </div>
                            <div className="cm-modal-footer" style={{ padding: '0 24px 24px 24px', borderTop: 'none', justifyContent: 'flex-end', gap: '12px' }}>
                                <button type="button" className="admin-btn-outline" style={{ height: '42px', padding: '0 20px' }} onClick={() => { setShowFileModal(false); setSelectedFile(null); setFileForm({ title: '', type: 'PDF', link: '' }); setEditingMaterial(null); }}>Cancel</button>
                                <button type="submit" className="admin-btn-primary" style={{ background: '#1D4ED8', height: '42px', padding: '0 24px' }}>{editingMaterial ? 'Save Changes' : 'Add Material'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showRejectModal && (
                <div className="cm-modal-overlay" style={{ zIndex: 3000 }}>
                    <div className="cm-modal" style={{ maxWidth: '450px' }}>
                        <div className="cm-modal-header" style={{ borderBottom: '1px solid #F1F5F9', padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '40px', height: '40px', background: '#FFF1F2', color: '#E11D48', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <XCircle size={20} />
                                </div>
                                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>Reject</h2>
                            </div>
                            <button className="cm-modal-close" onClick={() => setShowRejectModal(false)}><X size={20} /></button>
                        </div>
                        <div className="cm-modal-body" style={{ padding: '24px' }}>
                            <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '20px' }}>Please provide a reason for rejecting this request. This will be visible to the applicant.</p>
                            <div className="cm-form-group">
                                <label style={{ color: '#475569', fontWeight: 600, marginBottom: '8px', display: 'block' }}>Rejection Reason</label>
                                <textarea
                                    className="admin-input"
                                    placeholder="e.g. Incomplete documentation, prerequisite not met..."
                                    rows={4}
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    style={{ width: '100%', resize: 'vertical', minHeight: '100px' }}
                                ></textarea>
                            </div>
                        </div>
                        <div className="cm-modal-footer" style={{ padding: '0 24px 24px 24px', borderTop: 'none', justifyContent: 'flex-end', gap: '12px' }}>
                            <button className="admin-btn-outline" onClick={() => setShowRejectModal(false)}>Cancel</button>
                            <button className="admin-btn-primary" style={{ background: '#E11D48' }} onClick={handleRejectConfirm} disabled={!rejectionReason.trim()}>Confirm Rejection</button>
                        </div>
                    </div>
                </div>
            )}

            {showDetailsModal && selectedRequestDetails && (() => {
                const isEnrollment = selectedRequestDetails.requestType === 'enrollment';
                const app = selectedRequestDetails.rawApp;

                return (
                    <div className="cm-modal-overlay" style={{ zIndex: 1200 }}>
                        <div className="cm-modal" style={{ maxWidth: isEnrollment ? '850px' : '600px' }}>
                            <div className="cm-modal-header" style={{ borderBottom: '1px solid #F1F5F9', padding: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '40px', height: '40px', background: '#F0F9FF', color: '#0369A1', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ClipboardList size={20} />
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                                            {isEnrollment ? 'Application Details' : 'Request Details'}
                                        </h2>
                                        <p style={{ color: '#64748B', fontSize: '13px', marginTop: '2px' }}>
                                            {isEnrollment ? `Ref: ${selectedRequestDetails.id}` : 'Comprehensive overview of the submitted request.'}
                                        </p>
                                    </div>
                                </div>
                                <button className="cm-modal-close" onClick={() => setShowDetailsModal(false)}><X size={20} /></button>
                            </div>

                            <div className="cm-modal-body" style={{ padding: '24px', overflowY: 'auto', maxHeight: '70vh' }}>
                                {isEnrollment ? (
                                    <>
                                        {app?.is_new_applicant && (
                                            <div className="am-new-user-alert" style={{ marginBottom: '20px' }}>
                                                <div className="am-alert-icon"><UserCheck size={20} /></div>
                                                <div className="am-alert-text">
                                                    <strong>New Applicant Verification</strong>
                                                    <p>This applicant is new to the system. Please verify identity documents carefully before first-level approval.</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="am-section-divider">
                                            <h4><User size={16} /> Personal Information</h4>
                                        </div>
                                        <div className="am-details-grid">
                                            <div className="am-detail-item">
                                                <span className="am-label">Student Name</span>
                                                <span className="am-value">{app?.display_name || app?.applicant_name || selectedRequestDetails.name}</span>
                                            </div>
                                            <div className="am-detail-item">
                                                <span className="am-label">NIC Number</span>
                                                <span className="am-value">{app?.applicant_nic || 'N/A'}</span>
                                            </div>
                                            <div className="am-detail-item">
                                                <span className="am-label">Email Address</span>
                                                <span className="am-value">{app?.applicant_email || selectedRequestDetails.email || 'N/A'}</span>
                                            </div>
                                            <div className="am-detail-item">
                                                <span className="am-label">Phone Number</span>
                                                <span className="am-value">{app?.phone || 'N/A'}</span>
                                            </div>
                                            <div className="am-detail-item">
                                                <span className="am-label">WhatsApp Number</span>
                                                <span className="am-value">{app?.whatsapp || 'N/A'}</span>
                                            </div>
                                            <div className="am-detail-item">
                                                <span className="am-label">Home Phone</span>
                                                <span className="am-value">{app?.home_phone || 'N/A'}</span>
                                            </div>
                                            <div className="am-detail-item">
                                                <span className="am-label">Guardian Phone</span>
                                                <span className="am-value">{app?.guardian_phone || 'N/A'}</span>
                                            </div>
                                            <div className="am-detail-item">
                                                <span className="am-label">Date of Birth</span>
                                                <span className="am-value">{app?.dob ? app.dob.split('T')[0] : 'N/A'}</span>
                                            </div>
                                            <div className="am-detail-item">
                                                <span className="am-label">Sex / Gender</span>
                                                <span className="am-value">{app?.sex || 'N/A'}</span>
                                            </div>
                                            <div className="am-detail-item">
                                                <span className="am-label">Civil Status</span>
                                                <span className="am-value">{app?.civil_status || 'N/A'}</span>
                                            </div>
                                            <div className="am-detail-item">
                                                <span className="am-label">District</span>
                                                <span className="am-value">{app?.district || 'N/A'}</span>
                                            </div>
                                            <div className="am-detail-item full-width">
                                                <span className="am-label">Home Address</span>
                                                <span className="am-value">{app?.address || 'N/A'}</span>
                                            </div>
                                        </div>

                                        <div className="am-section-divider">
                                            <h4><FileText size={16} /> Employee Information</h4>
                                        </div>
                                        <div className="am-details-grid">
                                            <div className="am-detail-item">
                                                <span className="am-label">Employment Title / Designation</span>
                                                <span className="am-value">{app?.employment_title || 'Not Employed'}</span>
                                            </div>
                                            <div className="am-detail-item">
                                                <span className="am-label">Official Address</span>
                                                <span className="am-value">{app?.official_address || 'N/A'}</span>
                                            </div>
                                        </div>

                                        <div className="am-section-divider">
                                            <h4><Award size={16} /> Academic Qualifications</h4>
                                        </div>
                                        <div className="am-qual-blocks">
                                            <div className="am-qual-card">
                                                <div className="am-qual-header">
                                                    <h5>G.C.E. O/L Results</h5>
                                                    <span>Year: {app?.ol_year || 'N/A'} • Index: {app?.ol_index || 'N/A'}</span>
                                                </div>
                                                <table className="am-qual-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Subject</th>
                                                            <th style={{ textAlign: 'center' }}>Grade</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {(app?.ol_subjects || []).map((sub: any, i: number) => (
                                                            <tr key={i}>
                                                                <td>{sub.subject}</td>
                                                                <td style={{ textAlign: 'center' }}><span className="am-grade-sm">{sub.grade}</span></td>
                                                            </tr>
                                                        ))}
                                                        {(!app?.ol_subjects || app.ol_subjects.length === 0) && (
                                                            <tr>
                                                                <td colSpan={2} style={{ textAlign: 'center', color: '#94A3B8' }}>No O/L subjects recorded</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="am-qual-card">
                                                <div className="am-qual-header">
                                                    <h5>G.C.E. A/L Results</h5>
                                                    <span>Year: {app?.al_year || 'N/A'} • Index: {app?.al_index || 'N/A'}</span>
                                                </div>
                                                <table className="am-qual-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Subject</th>
                                                            <th style={{ textAlign: 'center' }}>Grade</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {(app?.al_subjects || []).map((sub: any, i: number) => (
                                                            <tr key={i}>
                                                                <td>{sub.subject}</td>
                                                                <td style={{ textAlign: 'center' }}><span className="am-grade-sm">{sub.grade}</span></td>
                                                            </tr>
                                                        ))}
                                                        {(!app?.al_subjects || app.al_subjects.length === 0) && (
                                                            <tr>
                                                                <td colSpan={2} style={{ textAlign: 'center', color: '#94A3B8' }}>No A/L subjects recorded</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {app?.other_qualifications && (
                                            <div style={{ marginTop: '16px', background: '#F8FAFC', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', width: '100%' }}>
                                                <h5 style={{ fontWeight: 600, color: '#334155', marginBottom: '6px', fontSize: '13px' }}>Other Qualifications</h5>
                                                <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>{app.other_qualifications}</p>
                                            </div>
                                        )}


                                    </>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div className="am-section-divider" style={{ marginTop: 0 }}>
                                            <h4><User size={16} /> Personal Information</h4>
                                        </div>
                                        <div className="am-details-grid">
                                            <div className="am-detail-item">
                                                <span className="am-label">Student Name</span>
                                                <span className="am-value">{selectedRequestDetails.name}</span>
                                            </div>
                                            <div className="am-detail-item">
                                                <span className="am-label">Registration Number</span>
                                                <span className="am-value">{selectedRequestDetails.studentNumber || 'CODL/2404'}</span>
                                            </div>
                                            <div className="am-detail-item">
                                                <span className="am-label">NIC Number</span>
                                                <span className="am-value">{selectedRequestDetails.nic || '199912345678'}</span>
                                            </div>
                                            <div className="am-detail-item">
                                                <span className="am-label">Email Address</span>
                                                <span className="am-value">{selectedRequestDetails.email || 'hiruni@example.com'}</span>
                                            </div>
                                            <div className="am-detail-item">
                                                <span className="am-label">Contact Phone</span>
                                                <span className="am-value">{selectedRequestDetails.phone || '0721234567'}</span>
                                            </div>
                                            <div className="am-detail-item full-width">
                                                <span className="am-label">Home Address</span>
                                                <span className="am-value">{selectedRequestDetails.address || '123, Central Avenue, Colombo 03'}</span>
                                            </div>
                                        </div>

                                        <div className="am-section-divider">
                                            <h4><FileText size={16} /> Request Details</h4>
                                        </div>
                                        <div className="am-details-grid">
                                            <div className="am-detail-item">
                                                <span className="am-label">Request Type</span>
                                                <span className="am-value" style={{ textTransform: 'capitalize' }}>
                                                    {selectedRequestDetails.type === 'regular' ? 'Exam Application' :
                                                        (selectedRequestDetails.type === 'postponements' ? 'Postponement' :
                                                            (selectedRequestDetails.type === 'reattempts' ? 'Reattempt' : selectedRequestDetails.type || 'Approval Request'))}
                                                </span>
                                            </div>
                                            <div className="am-detail-item">
                                                <span className="am-label">Target Semester</span>
                                                <span className="am-value">{selectedRequestDetails.sem || 'Semester 1'}</span>
                                            </div>
                                            <div className="am-detail-item full-width">
                                                <span className="am-label">Subject / Exam Title</span>
                                                <span className="am-value">{selectedRequestDetails.subject}</span>
                                            </div>
                                            {selectedRequestDetails.type === 'postponements' && selectedRequestDetails.salutation && (
                                                <>
                                                    <div className="am-detail-item">
                                                        <span className="am-label">Salutation / Status</span>
                                                        <span className="am-value">{selectedRequestDetails.salutation}</span>
                                                    </div>
                                                    <div className="am-detail-item">
                                                        <span className="am-label">Course Offered</span>
                                                        <span className="am-value">{selectedRequestDetails.courseOffered}</span>
                                                    </div>
                                                    <div className="am-detail-item">
                                                        <span className="am-label">Academic Year</span>
                                                        <span className="am-value">{selectedRequestDetails.year}</span>
                                                    </div>
                                                    <div className="am-detail-item">
                                                        <span className="am-label">Batch</span>
                                                        <span className="am-value">{selectedRequestDetails.batch}</span>
                                                    </div>
                                                    <div className="am-detail-item full-width">
                                                        <span className="am-label">Unable to Take Examination</span>
                                                        <span className="am-value">{selectedRequestDetails.examUnableToTake}</span>
                                                    </div>
                                                    <div className="am-detail-item">
                                                        <span className="am-label">Scheduled Exam Date</span>
                                                        <span className="am-value">{selectedRequestDetails.examScheduledDate || 'N/A'}</span>
                                                    </div>
                                                    <div className="am-detail-item">
                                                        <span className="am-label">Unable to Attend Date(s)</span>
                                                        <span className="am-value">{selectedRequestDetails.unableDatesDetails}</span>
                                                    </div>
                                                </>
                                            )}
                                            {selectedRequestDetails.newDate && (
                                                <div className="am-detail-item">
                                                    <span className="am-label">Requested New Date</span>
                                                    <span className="am-value">{selectedRequestDetails.newDate}</span>
                                                </div>
                                            )}
                                            <div className="am-detail-item">
                                                <span className="am-label">Submitted Date</span>
                                                <span className="am-value">{selectedRequestDetails.date || '2026-05-26'}</span>
                                            </div>
                                            {selectedRequestDetails.reason && (
                                                <div className="am-detail-item full-width">
                                                    <span className="am-label">Reason for Request</span>
                                                    <span className="am-value" style={{ fontStyle: 'italic', color: '#475569' }}>"{selectedRequestDetails.reason}"</span>
                                                </div>
                                            )}
                                        </div>

                                        {selectedRequestDetails.subjects && selectedRequestDetails.subjects.length > 0 && (
                                            <div style={{ marginTop: '12px' }}>
                                                <div className="am-section-divider" style={{ marginBottom: '12px' }}>
                                                    <h4><Layers size={16} /> Applying Subjects</h4>
                                                </div>
                                                <div style={{ background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                                        <thead>
                                                            <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                                                                <th style={{ padding: '10px 16px', fontWeight: 600, color: '#475569' }}>Subject Code</th>
                                                                <th style={{ padding: '10px 16px', fontWeight: 600, color: '#475569' }}>Subject Name</th>
                                                                <th style={{ padding: '10px 16px', fontWeight: 600, color: '#475569', textAlign: 'center' }}>Attempt</th>
                                                                <th style={{ padding: '10px 16px', fontWeight: 600, color: '#475569', textAlign: 'center' }}>Taken</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {selectedRequestDetails.subjects.map((sub: any, idx: number) => (
                                                                <tr key={idx} style={{ borderBottom: idx < selectedRequestDetails.subjects.length - 1 ? '1px solid #E2E8F0' : 'none' }}>
                                                                    <td style={{ padding: '10px 16px', color: '#64748B', fontWeight: 700 }}>{sub.code || 'N/A'}</td>
                                                                    <td style={{ padding: '10px 16px', color: '#334155', fontWeight: 600 }}>{sub.name}</td>
                                                                    <td style={{ padding: '10px 16px', textAlign: 'center', color: '#0284C7', fontWeight: 700 }}>{sub.attempt || 1}</td>
                                                                    <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                                                                        <span style={{
                                                                            display: 'inline-block',
                                                                            padding: '2px 8px',
                                                                            borderRadius: '4px',
                                                                            fontSize: '11px',
                                                                            fontWeight: 700,
                                                                            background: (sub.taken || sub.taken === undefined) ? '#DCFCE7' : '#F1F5F9',
                                                                            color: (sub.taken || sub.taken === undefined) ? '#15803D' : '#64748B'
                                                                        }}>
                                                                            {(sub.taken || sub.taken === undefined) ? 'YES' : 'NO'}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="detail-item" style={{ gridColumn: 'span 2', marginTop: '20px', padding: '20px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.05em' }}>Approval Workflow Progress</label>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                                        {/* Connector Line */}
                                        <div style={{ position: 'absolute', top: '12px', left: '10%', right: '10%', height: '2px', background: '#E2E8F0', zIndex: 0 }}></div>

                                        {[
                                            { key: 'secretary', id: 'Secretary' },
                                            { key: 'coordinator', id: 'Coordinator' },
                                            { key: 'director', id: 'Director' }
                                        ].map((stage, i) => {
                                            const status = selectedRequestDetails.stages?.[stage.key] || 'pending';
                                            const isActive = status !== 'pending';
                                            const isApproved = status === 'approved';
                                            const isRejected = status === 'rejected';

                                            return (
                                                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 1, position: 'relative', width: '33.33%' }}>
                                                    <div style={{
                                                        width: '26px', height: '26px', borderRadius: '50%',
                                                        background: isApproved ? '#10B981' : (isRejected ? '#EF4444' : '#FFFFFF'),
                                                        border: `2px solid ${isApproved ? '#10B981' : (isRejected ? '#EF4444' : '#CBD5E1')}`,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: isActive ? '#FFFFFF' : '#CBD5E1',
                                                        boxShadow: isActive ? '0 0 10px rgba(0,0,0,0.05)' : 'none'
                                                    }}>
                                                        {isApproved ? <Check size={14} strokeWidth={3} /> : (isRejected ? <X size={14} strokeWidth={3} /> : <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#CBD5E1' }}></div>)}
                                                    </div>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: '12px', fontWeight: 700, color: isActive ? '#1E293B' : '#94A3B8' }}>{stage.id}</div>
                                                        <div style={{ fontSize: '10px', color: isApproved ? '#059669' : (isRejected ? '#DC2626' : '#94A3B8'), fontWeight: 600, textTransform: 'uppercase' }}>{status}</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                {selectedRequestDetails.rejectionReason && (
                                    <div className="detail-item" style={{ gridColumn: 'span 2', background: '#FFF1F2', padding: '16px', borderRadius: '12px', border: '1px solid #FECDD3', marginTop: '20px' }}>
                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#E11D48', textTransform: 'uppercase', marginBottom: '8px' }}>Rejection Remark</label>
                                        <div style={{ color: '#9F1239', fontSize: '14px', lineHeight: 1.5 }}>{selectedRequestDetails.rejectionReason}</div>
                                    </div>
                                )}
                            </div>

                            <div className="cm-modal-footer" style={{ padding: '24px', borderTop: '1px solid #F1F5F9', justifyContent: 'flex-end', display: 'flex', gap: '12px' }}>
                                {(userRole === 'super_admin' || userRole === 'secretary') && (isEnrollment || selectedRequestDetails.requestType === 'approval') && (
                                    <button
                                        className="admin-btn-primary"
                                        style={{ background: '#E11D48', padding: '10px 24px', borderRadius: '10px', marginRight: 'auto' }}
                                        onClick={() => {
                                            if (isEnrollment) {
                                                handleDeleteApplication(selectedRequestDetails.realId);
                                            } else {
                                                setConfirmConfig({
                                                    show: true,
                                                    title: "Delete Approval Request",
                                                    message: "Are you sure you want to delete this approval request completely? This action cannot be undone.",
                                                    action: async () => {
                                                        // 1. Delete from state
                                                        setApprovalRequests(prev => prev.filter(r => r.id !== selectedRequestDetails.id));

                                                        // 2. Delete from database based on type
                                                        try {
                                                            if (selectedRequestDetails.isRealApplication) {
                                                                await examApplicationService.delete(selectedRequestDetails.realId);
                                                            } else if (selectedRequestDetails.isRealStudentRequest) {
                                                                const reqType = selectedRequestDetails.requestType;
                                                                if (reqType === 'postponement') {
                                                                    await postponementRequestService.delete(selectedRequestDetails.requestKey);
                                                                } else if (reqType === 'reattempt') {
                                                                    await reattemptRequestService.delete(selectedRequestDetails.requestKey);
                                                                }
                                                            }
                                                        } catch (err) {
                                                            console.error('Failed to delete from database:', err);
                                                        }

                                                        toast.success("Request deleted successfully!");
                                                        setConfirmConfig(prev => ({ ...prev, show: false }));
                                                    }
                                                });
                                            }
                                            setShowDetailsModal(false);
                                        }}
                                    >
                                        <Trash2 size={18} style={{ marginRight: '8px' }} /> Delete Application
                                    </button>
                                )}
                                {userRole !== 'super_admin' && ((selectedRequestDetails.status || 'pending').toLowerCase() === 'pending') && (
                                    isEnrollment ? (
                                        !app || (
                                            (app.approval_level === 0 && userRole === 'secretary') ||
                                            (app.approval_level === 1 && userRole === 'coordinator') ||
                                            (app.approval_level === 2 && userRole === 'director')
                                        )
                                    ) : (
                                        (userRole === 'secretary' && (selectedRequestDetails.stages?.secretary || 'pending').toLowerCase() === 'pending') ||
                                        (userRole === 'coordinator' && (selectedRequestDetails.stages?.secretary || 'pending').toLowerCase() === 'approved' && (selectedRequestDetails.stages?.coordinator || 'pending').toLowerCase() === 'pending') ||
                                        (userRole === 'director' && (selectedRequestDetails.stages?.coordinator || 'pending').toLowerCase() === 'approved' && (selectedRequestDetails.stages?.director || 'pending').toLowerCase() === 'pending')
                                    )
                                ) && (
                                        <>
                                            <button
                                                className="admin-btn-primary"
                                                style={{ background: '#E11D48', padding: '10px 24px', borderRadius: '10px' }}
                                                onClick={() => handleRejectClick(isEnrollment ? selectedRequestDetails.realId : selectedRequestDetails.id, selectedRequestDetails.requestType)}
                                            >
                                                <XCircle size={18} style={{ marginRight: '8px' }} /> Reject
                                            </button>
                                            <button
                                                className="admin-btn-primary"
                                                style={{ background: '#10B981', padding: '10px 24px', borderRadius: '10px' }}
                                                onClick={() => {
                                                    handleActionRequest(isEnrollment ? selectedRequestDetails.realId : selectedRequestDetails.id, 'approved', selectedRequestDetails.requestType);
                                                    setShowDetailsModal(false);
                                                }}
                                            >
                                                <Check size={18} style={{ marginRight: '8px' }} /> Approve
                                            </button>
                                        </>
                                    )}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {confirmModal.show && (
                <div 
                    className="cm-modal-overlay" 
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                    onClick={() => {
                        if (!isConfirmLoading) {
                            setConfirmModal(prev => ({ ...prev, show: false }));
                        }
                    }}
                >
                    <div className="cm-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', borderRadius: '16px', background: '#FFFFFF', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                        <div className="cm-modal-header" style={{ borderBottom: 'none', padding: 0, marginBottom: '12px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>{confirmModal.title}</h2>
                        </div>
                        <div className="cm-modal-body" style={{ padding: 0, marginBottom: '24px' }}>
                            <p style={{ color: '#64748B', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>{confirmModal.message}</p>
                        </div>
                        <div className="cm-modal-footer" style={{ borderTop: 'none', padding: 0, display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button 
                                className="admin-btn-outline" 
                                style={{ height: '38px', padding: '0 16px', borderRadius: '8px', cursor: isConfirmLoading ? 'not-allowed' : 'pointer', fontWeight: 600, border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#475569' }} 
                                disabled={isConfirmLoading}
                                onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                            >
                                Cancel
                            </button>
                            <button
                                className="admin-btn-primary"
                                style={{ 
                                    height: '38px', 
                                    padding: '0 16px', 
                                    borderRadius: '8px', 
                                    cursor: isConfirmLoading ? 'not-allowed' : 'pointer', 
                                    fontWeight: 600, 
                                    border: 'none', 
                                    background: '#EF4444', 
                                    color: '#FFFFFF',
                                    opacity: isConfirmLoading ? 0.7 : 1,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                                disabled={isConfirmLoading}
                                onClick={async () => {
                                    setIsConfirmLoading(true);
                                    try {
                                        await confirmModal.onConfirm();
                                    } catch (err) {
                                        console.error('Action failed:', err);
                                    } finally {
                                        setIsConfirmLoading(false);
                                        setConfirmModal(prev => ({ ...prev, show: false }));
                                    }
                                }}
                            >
                                {isConfirmLoading ? (
                                    <>
                                        <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                                        Deleting...
                                    </>
                                ) : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
