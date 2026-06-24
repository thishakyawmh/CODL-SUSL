import React, { useState, useMemo, useEffect } from 'react';
import {
    Search, User, Mail, Phone, Shield, Calendar,
    BookOpen, GraduationCap, ClipboardCheck, FileText,
    Clock, CheckCircle2, XCircle, AlertCircle,
    Hash, ChevronRight, ChevronDown, X, Layers,
    Award, RefreshCw, PauseCircle, TrendingUp,
    BarChart3, Activity, Eye, ArrowLeft, Plus, Trash2
} from 'lucide-react';
import { getFullAvatarUrl, getCurrentAdminUser } from '../../data/mockAdminData';
import type { User as UserType } from '../../data/mockAdminData';
import { toast } from '../../utils/toast';
import {
    userService,
    examApplicationService,
    letterRequestService,
    reattemptRequestService,
    postponementRequestService,
    examResultService,
    courseService
} from '../../services/apiService';
import './TrackStudent.css';

interface DBUserType {
    id: string;
    studentNumber: string;
    fullName: string;
    email: string;
    nic: string;
    role: 'super_admin' | 'admin' | 'director' | 'coordinator' | 'secretary' | 'lecturer' | 'student';
    status: 'active' | 'inactive' | 'suspended';
    avatar: string;
    phone: string;
    joinDate: string;
    courses: string[];
    lastLogin: string;

    // DB-specific fields
    dob?: string | null;
    sex?: string | null;
    civilStatus?: string | null;
    address?: string | null;
    whatsapp?: string | null;
    olYear?: string | null;
    olIndex?: string | null;
    olSubjects?: { subject: string; grade: string }[] | null;
    alYear?: string | null;
    alIndex?: string | null;
    alSubjects?: { subject: string; grade: string }[] | null;
    otherQualifications?: string | null;
    displayName?: string;
}

interface AcademicProfile {
    dob: string;
    sex: string;
    civilStatus: string;
    address: string;
    whatsapp: string;
    olYear: string;
    olIndex: string;
    olSubjects: { subject: string; grade: string }[];
    alYear: string;
    alIndex: string;
    alSubjects: { subject: string; grade: string }[];
    otherQualifications: string;
}

const getStudentAcademicProfile = (student: DBUserType): AcademicProfile => {
    // If it's a real student with seeded profile fields, use those directly
    if (student.dob || student.olSubjects || student.alSubjects) {
        return {
            dob: student.dob || '2001-05-15',
            sex: student.sex || 'Female',
            civilStatus: student.civilStatus || 'Unmarried',
            address: student.address || 'No 45, Main Road, Ratnapura',
            whatsapp: student.whatsapp || student.phone || '',
            olYear: student.olYear || '2019',
            olIndex: student.olIndex || '12345678',
            olSubjects: student.olSubjects || [],
            alYear: student.alYear || '2022',
            alIndex: student.alIndex || '9876543',
            alSubjects: student.alSubjects || [],
            otherQualifications: student.otherQualifications || 'None'
        };
    }

    // No profile data available — return empty defaults
    return {
        dob: '',
        sex: '',
        civilStatus: '',
        address: student.address || '',
        whatsapp: student.whatsapp || student.phone || '',
        olYear: '',
        olIndex: '',
        olSubjects: [],
        alYear: '',
        alIndex: '',
        alSubjects: [],
        otherQualifications: ''
    };
};

const safeDate = (dateVal: any): string | null => {
    if (!dateVal) return null;
    try {
        const d = new Date(dateVal);
        return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
    } catch {
        return null;
    }
};

const safeDateTime = (dateVal: any): string => {
    if (!dateVal) return new Date().toISOString();
    try {
        const d = new Date(dateVal);
        return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
    } catch {
        return new Date().toISOString();
    }
};

const normalizeStudent = (user: any): DBUserType => {
    return {
        id: String(user.id),
        studentNumber: user.student_number || '',
        fullName: user.full_name || '',
        email: user.email || '',
        nic: user.nic || '',
        role: user.role === 'student' ? user.role : 'student',
        status: (user.status === 'active' || user.status === 'inactive' || user.status === 'suspended') ? user.status : 'active',
        avatar: user.avatar ? getFullAvatarUrl(user.avatar) : `https://i.pravatar.cc/150?u=${user.id}`,
        phone: user.phone || '',
        joinDate: safeDate(user.created_at) || '2026-05-22',
        courses: user.courses ? user.courses.map((c: any) => c.title) : [],
        lastLogin: safeDateTime(user.last_login || user.updated_at),
        dob: safeDate(user.dob),
        sex: user.sex,
        civilStatus: user.civil_status,
        address: user.address,
        whatsapp: user.whatsapp,
        olSubjects: user.ol_subjects,
        alSubjects: user.al_subjects,
        olYear: user.ol_year,
        olIndex: user.ol_index,
        alYear: user.al_year,
        alIndex: user.al_index,
        otherQualifications: user.other_qualifications,
        displayName: user.display_name || '',
    };
};

const normalizeCourse = (course: any) => {
    return {
        id: String(course.id),
        title: course.title,
        code: course.code,
        level: course.level,
        department: course.department || '',
        duration: course.duration,
        intakeStatus: course.intake_status || 'Open',
        secretary: course.secretary ? course.secretary.full_name : null,
        coordinator: course.coordinator ? course.coordinator.full_name : null,
        totalStudents: 0,
        activeStudents: 0,
        batches: ['Batch 01'],
        createdDate: safeDate(course.created_at) || '2026-01-01',
        semesters: course.semesters ? course.semesters.map((s: any) => ({
            name: s.name,
            subjects: s.subjects ? s.subjects.map((sub: any) => ({
                code: sub.code,
                name: sub.name,
                credits: String(sub.credits)
            })) : []
        })) : []
    };
};

const normalizeExamApplication = (ea: any) => {
    return {
        id: String(ea.id),
        studentName: ea.user ? ea.user.full_name : '',
        studentNumber: ea.user ? ea.user.student_number : '',
        course: ea.course ? ea.course.title : '',
        examTitle: ea.exam_title,
        semester: ea.semester || '',
        applicationDate: safeDate(ea.created_at) || '',
        status: ea.status || 'pending',
        approvalStages: ea.approval_stages || [],
        feePaid: ea.fee_paid,
        paymentDate: safeDate(ea.payment_date),
        subjects: ea.subjects || []
    };
};

const normalizeLetterRequest = (lr: any) => {
    return {
        id: String(lr.id),
        studentName: lr.user ? lr.user.full_name : '',
        studentNumber: lr.user ? lr.user.student_number : '',
        course: lr.course ? lr.course.title : '',
        letterType: lr.letter_type,
        reason: lr.reason,
        requestDate: safeDate(lr.created_at) || '',
        status: lr.status || 'pending',
        approvalStages: lr.approval_stages || []
    };
};

const normalizePostponement = (pr: any) => {
    return {
        id: String(pr.id),
        studentName: pr.user ? pr.user.full_name : '',
        studentNumber: pr.user ? pr.user.student_number : '',
        course: pr.course ? pr.course.title : '',
        examTitle: pr.exam_title,
        reason: pr.reason,
        requestDate: safeDate(pr.created_at) || '',
        status: pr.status || 'pending',
        medicalCert: !!pr.medical_cert,
        approvalStages: pr.approval_stages || [],
        exams: pr.exams || [],
        batch: pr.batch || ''
    };
};

const normalizeReattempt = (rr: any) => {
    return {
        id: String(rr.id),
        studentName: rr.user ? rr.user.full_name : '',
        studentNumber: rr.user ? rr.user.student_number : '',
        course: rr.course ? rr.course.title : '',
        subject: rr.subject ? rr.subject.name : '',
        previousGrade: rr.previous_grade || '',
        attempt: rr.attempt || 1,
        requestDate: safeDate(rr.created_at) || '',
        status: rr.status || 'pending',
        approvalStages: rr.approval_stages || [],
        batch: rr.batch || ''
    };
};

const normalizeExamResult = (er: any) => {
    return {
        id: String(er.id),
        course: er.course ? er.course.title : '',
        subject: er.subject ? er.subject.name : '',
        subjectCode: er.subject ? er.subject.code : '',
        batch: er.batch || '',
        semester: er.semester || '',
        lecturer: er.lecturer ? er.lecturer.full_name : '',
        uploadDate: safeDate(er.created_at) || '',
        studentCount: er.student_count || 0,
        status: er.status || 'pending',
        results: er.grades ? er.grades.map((g: any) => ({
            studentId: g.user ? g.user.student_number : '',
            studentName: g.user ? g.user.full_name : '',
            grade: g.grade
        })) : [],
        approvalStages: er.approval_stages || []
    };
};

export const TrackStudent: React.FC = () => {
    const currentAdminUser = getCurrentAdminUser();
    const isSuperAdmin = currentAdminUser.role === 'super_admin';

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<DBUserType | null>(null);
    const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});

    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({
        studentNumber: '',
        fullName: '',
        email: '',
        nic: '',
        role: 'student' as 'student',
        status: 'active' as 'active' | 'inactive' | 'suspended',
        phone: '',
        dob: '',
        sex: '',
        civilStatus: '',
        address: '',
        whatsapp: '',
        olYear: '',
        olIndex: '',
        olSubjects: [] as { subject: string; grade: string }[],
        alYear: '',
        alIndex: '',
        alSubjects: [] as { subject: string; grade: string }[],
        otherQualifications: '',
        displayName: ''
    });

    const openEditModal = (student: DBUserType, profile: AcademicProfile) => {
        setEditForm({
            studentNumber: student.studentNumber,
            fullName: student.fullName,
            email: student.email,
            nic: student.nic,
            role: student.role as any,
            status: student.status,
            phone: student.phone,
            dob: profile.dob || '',
            sex: profile.sex || '',
            civilStatus: profile.civilStatus || '',
            address: profile.address || '',
            whatsapp: profile.whatsapp || '',
            olYear: profile.olYear || '',
            olIndex: profile.olIndex || '',
            olSubjects: profile.olSubjects ? [...profile.olSubjects] : [],
            alYear: profile.alYear || '',
            alIndex: profile.alIndex || '',
            alSubjects: profile.alSubjects ? [...profile.alSubjects] : [],
            otherQualifications: profile.otherQualifications || '',
            displayName: student.displayName || ''
        });
        setShowEditModal(true);
    };

    const handleEditFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudent) return;
        try {
            const payload = {
                student_number: editForm.studentNumber,
                full_name: editForm.fullName,
                email: editForm.email,
                nic: editForm.nic,
                role: editForm.role,
                status: editForm.status,
                phone: editForm.phone,
                dob: editForm.dob || null,
                sex: editForm.sex || null,
                civil_status: editForm.civilStatus || null,
                address: editForm.address || null,
                whatsapp: editForm.whatsapp || null,
                ol_year: editForm.olYear || null,
                ol_index: editForm.olIndex || null,
                ol_subjects: editForm.olSubjects,
                al_year: editForm.alYear || null,
                al_index: editForm.alIndex || null,
                al_subjects: editForm.alSubjects,
                other_qualifications: editForm.otherQualifications || null,
                display_name: editForm.displayName || null
            };

            const updatedUser = await userService.update(selectedStudent.id, payload);
            const normalized = normalizeStudent(updatedUser);

            setRealStudents(prev => prev.map(s => s.id === selectedStudent.id ? normalized : s));
            setSelectedStudent(normalized);
            setShowEditModal(false);
            toast.success('Student profile updated successfully.');
        } catch (err: any) {
            console.error('Failed to update student profile:', err);
            toast.error(err.response?.data?.message || 'Failed to update student profile.');
        }
    };

    const handleAddOLSubject = () => {
        setEditForm(prev => ({
            ...prev,
            olSubjects: [...prev.olSubjects, { subject: '', grade: 'A' }]
        }));
    };

    const handleRemoveOLSubject = (idx: number) => {
        setEditForm(prev => ({
            ...prev,
            olSubjects: prev.olSubjects.filter((_, i) => i !== idx)
        }));
    };

    const handleOLSubjectChange = (idx: number, field: 'subject' | 'grade', value: string) => {
        setEditForm(prev => ({
            ...prev,
            olSubjects: prev.olSubjects.map((s, i) => i === idx ? { ...s, [field]: value } : s)
        }));
    };

    const handleAddALSubject = () => {
        setEditForm(prev => ({
            ...prev,
            alSubjects: [...prev.alSubjects, { subject: '', grade: 'A' }]
        }));
    };

    const handleRemoveALSubject = (idx: number) => {
        setEditForm(prev => ({
            ...prev,
            alSubjects: prev.alSubjects.filter((_, i) => i !== idx)
        }));
    };

    const handleALSubjectChange = (idx: number, field: 'subject' | 'grade', value: string) => {
        setEditForm(prev => ({
            ...prev,
            alSubjects: prev.alSubjects.map((s, i) => i === idx ? { ...s, [field]: value } : s)
        }));
    };

    const [realStudents, setRealStudents] = useState<DBUserType[]>([]);
    const [realExamApplications, setRealExamApplications] = useState<any[]>([]);
    const [realLetterRequests, setRealLetterRequests] = useState<any[]>([]);
    const [realReattempts, setRealReattempts] = useState<any[]>([]);
    const [realPostponements, setRealPostponements] = useState<any[]>([]);
    const [realExamResults, setRealExamResults] = useState<any[]>([]);
    const [realCourses, setRealCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [dbError, setDbError] = useState<string | null>(null);

    // Fetch live data on mount
    useEffect(() => {
        const fetchRealData = async () => {
            setLoading(true);

            const safeFetch = async (fetchFn: () => Promise<any>, fallbackValue: any = []) => {
                try {
                    const res = await fetchFn();
                    return res || fallbackValue;
                } catch (err: any) {
                    console.error('Failed to fetch from service:', err);
                    if (err?.response?.status === 401 || err?.response?.status === 403) {
                        throw err; // Propagate auth errors
                    }
                    return fallbackValue;
                }
            };

            try {
                const [
                    usersData,
                    examAppsData,
                    lettersData,
                    reattemptsData,
                    postponementsData,
                    resultsData,
                    coursesData
                ] = await Promise.all([
                    safeFetch(() => userService.getAll(), null),
                    safeFetch(() => examApplicationService.getAll()),
                    safeFetch(() => letterRequestService.getAll()),
                    safeFetch(() => reattemptRequestService.getAll()),
                    safeFetch(() => postponementRequestService.getAll()),
                    safeFetch(() => examResultService.getAll()),
                    safeFetch(() => courseService.getAll())
                ]);

                if (usersData === null) {
                    throw new Error('Unauthorized');
                }

                const studentsOnly = (usersData || [])
                    .filter((u: any) => {
                        if (!u) return false;
                        const role = u.role || '';
                        const studentNumber = u.student_number || '';
                        return role === 'student' || studentNumber.startsWith('CODL/');
                    })
                    .map((u: any) => {
                        try {
                            return normalizeStudent(u);
                        } catch (err) {
                            console.error('Failed to normalize student:', u, err);
                            return null;
                        }
                    })
                    .filter(Boolean) as DBUserType[];

                setRealStudents(studentsOnly);
                setRealExamApplications((examAppsData || []).map(normalizeExamApplication));
                setRealLetterRequests((lettersData || []).map(normalizeLetterRequest));
                setRealReattempts((reattemptsData || []).map(normalizeReattempt));
                setRealPostponements((postponementsData || []).map(normalizePostponement));
                setRealExamResults((resultsData || []).map(normalizeExamResult));
                setRealCourses((coursesData || []).map(normalizeCourse));
                setDbError(null);
            } catch (error: any) {
                console.error('Failed to fetch real database data for student tracking:', error);
                if (error?.response?.status === 401 || error?.response?.status === 403) {
                    setDbError('Session token is invalid or expired. Please log out and log back in to load real database students.');
                } else {
                    setDbError('Could not connect to database server. Please check your connection and try again.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchRealData();
    }, []);

    // Use database data directly — no mock blending

    const filteredStudents = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const q = searchQuery.toLowerCase();
        return realStudents.filter(s =>
            (s.fullName || '').toLowerCase().includes(q) ||
            (s.studentNumber || '').toLowerCase().includes(q) ||
            (s.email || '').toLowerCase().includes(q) ||
            (s.nic || '').toLowerCase().includes(q)
        );
    }, [searchQuery, realStudents]);

    const getStudentData = (student: DBUserType) => {
        const examApps = realExamApplications.filter(
            e => e.studentNumber === student.studentNumber || e.studentName === student.fullName
        );
        const letterReqs = realLetterRequests.filter(
            l => l.studentNumber === student.studentNumber || l.studentName === student.fullName
        );
        const reattempts = realReattempts.filter(
            r => r.studentNumber === student.studentNumber || r.studentName === student.fullName
        );
        const postponements = realPostponements.filter(
            p => p.studentNumber === student.studentNumber || p.studentName === student.fullName
        );

        const results: { subject: string; subjectCode: string; grade: string; course: string; semester: string; status: string; uploadDate: string; lecturer: string; batch: string }[] = [];
        realExamResults.forEach(er => {
            er.results.forEach((r: any) => {
                if (r.studentId === student.studentNumber || r.studentName === student.fullName) {
                    results.push({
                        subject: er.subject,
                        subjectCode: er.subjectCode,
                        grade: r.grade,
                        course: er.course,
                        semester: er.semester,
                        status: er.status,
                        uploadDate: er.uploadDate,
                        lecturer: er.lecturer,
                        batch: er.batch,
                    });
                }
            });
        });

        return { examApps, letterReqs, reattempts, postponements, results };
    };

    const selectStudent = (student: DBUserType) => {
        setSelectedStudent(student);
        setSearchQuery('');
        const expanded: Record<string, boolean> = {};
        student.courses.forEach(c => { expanded[c] = true; });
        setExpandedCourses(expanded);
    };

    const clearStudent = () => {
        setSelectedStudent(null);
    };

    const toggleCourse = (courseName: string) => {
        setExpandedCourses(prev => ({ ...prev, [courseName]: !prev[courseName] }));
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved': return <CheckCircle2 size={14} />;
            case 'rejected': return <XCircle size={14} />;
            case 'pending': return <Clock size={14} />;
            default: return <AlertCircle size={14} />;
        }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'approved': return 'ts-status approved';
            case 'rejected': return 'ts-status rejected';
            case 'pending': return 'ts-status pending';
            default: return 'ts-status';
        }
    };

    const getGradeColor = (grade: string) => {
        if (grade.startsWith('A')) return '#10B981';
        if (grade.startsWith('B')) return '#3B82F6';
        if (grade.startsWith('C')) return '#F59E0B';
        return '#EF4444';
    };

    const getGradePoints = (grade: string): number => {
        const map: Record<string, number> = {
            'A+': 4.0, 'A': 4.0, 'A-': 3.7,
            'B+': 3.3, 'B': 3.0, 'B-': 2.7,
            'C+': 2.3, 'C': 2.0, 'C-': 1.7,
            'D+': 1.3, 'D': 1.0, 'D-': 0.7,
            'E': 0.0, 'F': 0.0
        };
        return map[grade] ?? 0;
    };

    const studentData = selectedStudent ? getStudentData(selectedStudent) : null;

    // Build per-course academic view
    const getCourseAcademicView = (courseName: string) => {
        const courseData = realCourses.find(c => c.title === courseName);
        const courseResults = studentData?.results.filter(r => r.course === courseName) || [];
        const courseReattempts = studentData?.reattempts.filter(r => r.course === courseName) || [];
        const coursePostponements = studentData?.postponements.filter(p => p.course === courseName) || [];
        const courseExamApps = studentData?.examApps.filter(e => e.course === courseName) || [];
        return { courseData, courseResults, courseReattempts, coursePostponements, courseExamApps };
    };

    // Build a timeline of all student activity
    const buildTimeline = () => {
        if (!studentData || !selectedStudent) return [];
        const events: { date: string; type: string; title: string; detail: string; status: string; icon: React.ReactNode; course: string }[] = [];

        studentData.examApps.forEach(e => {
            events.push({
                date: e.applicationDate,
                type: 'exam_app',
                title: 'Exam Application',
                detail: `${e.examTitle}`,
                status: e.status,
                icon: <ClipboardCheck size={14} />,
                course: e.course
            });
        });

        studentData.results.forEach(r => {
            events.push({
                date: r.uploadDate,
                type: 'result',
                title: 'Result Released',
                detail: `${r.subject} (${r.subjectCode}) — Grade: ${r.grade}`,
                status: r.status === 'approved' ? 'approved' : 'pending',
                icon: <GraduationCap size={14} />,
                course: r.course
            });
        });

        studentData.letterReqs.forEach(l => {
            events.push({
                date: l.requestDate,
                type: 'letter',
                title: 'Letter Request',
                detail: `${l.letterType}`,
                status: l.status,
                icon: <FileText size={14} />,
                course: l.course
            });
        });

        studentData.postponements.forEach(p => {
            events.push({
                date: p.requestDate,
                type: 'postponement',
                title: 'Postponement Request',
                detail: `${p.examTitle}`,
                status: p.status,
                icon: <PauseCircle size={14} />,
                course: p.course
            });
        });

        studentData.reattempts.forEach(r => {
            events.push({
                date: r.requestDate,
                type: 'reattempt',
                title: 'Reattempt Request',
                detail: `${r.subject} (Attempt ${r.attempt})`,
                status: r.status,
                icon: <RefreshCw size={14} />,
                course: r.course
            });
        });

        // Push simulated application submission & approval events for each course
        selectedStudent.courses.forEach(courseName => {
            const joinDate = new Date(selectedStudent.joinDate);
            const submissionDateObj = new Date(joinDate);
            submissionDateObj.setDate(submissionDateObj.getDate() - 3);
            const submissionDate = submissionDateObj.toISOString().split('T')[0];
            const approvalDate = selectedStudent.joinDate;

            events.push({
                date: submissionDate,
                type: 'app_submission',
                title: 'Application Submitted',
                detail: `Submitted enrollment application for ${courseName}`,
                status: 'approved',
                icon: <FileText size={14} />,
                course: courseName
            });

            events.push({
                date: approvalDate,
                type: 'app_approval',
                title: 'Application Approved',
                detail: `Enrollment application approved and registered under student number ${selectedStudent.studentNumber}`,
                status: 'approved',
                icon: <CheckCircle2 size={14} />,
                course: courseName
            });
        });

        return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };

    const timeline = selectedStudent ? buildTimeline() : [];
    const academicProfile = selectedStudent ? getStudentAcademicProfile(selectedStudent) : null;

    return (
        <div className="ts-container">
            <div className="ts-header">
                <div>
                    <h1>Track Student</h1>
                    <p>Search by student ID, name, or NIC to view their complete academic profile and activity history.</p>
                </div>
            </div>

            <div className="ts-search-section">
                <div className="ts-search-bar">
                    <Search size={20} className="ts-search-icon" />
                    <input
                        type="text"
                        placeholder="Search by name, registration number, or NIC..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button className="ts-search-clear" onClick={() => setSearchQuery('')}>
                            <X size={16} />
                        </button>
                    )}
                </div>

                {dbError && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 16px',
                        background: '#FEF2F2',
                        border: '1px solid #FEE2E2',
                        borderRadius: '12px',
                        color: '#EF4444',
                        fontSize: '14px',
                        fontWeight: 500,
                        marginTop: '12px',
                        marginBottom: '4px'
                    }}>
                        <AlertCircle size={16} />
                        <span>{dbError}</span>
                    </div>
                )}

                {!loading && !dbError && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        color: '#10B981',
                        fontWeight: 600,
                        marginTop: '12px',
                        padding: '0 4px'
                    }}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }}></span>
                        <span>Connected to Database: {realStudents.length} students loaded.</span>
                    </div>
                )}

                {filteredStudents.length > 0 && searchQuery && (
                    <div className="ts-search-results">
                        {filteredStudents.map(s => (
                            <button key={s.id} className="ts-search-item" onClick={() => selectStudent(s)}>
                                <img src={s.avatar} alt={s.fullName} className="ts-search-avatar" />
                                <div className="ts-search-info">
                                    <span className="ts-search-name">{s.fullName}</span>
                                    <span className="ts-search-id">{s.studentNumber} · {s.courses[0] || 'No course'}</span>
                                </div>
                                <span className={`ts-user-status ${s.status}`}>
                                    <span className="ts-dot"></span>
                                    {s.status}
                                </span>
                                <ChevronRight size={16} className="ts-search-arrow" />
                            </button>
                        ))}
                    </div>
                )}

                {searchQuery && filteredStudents.length === 0 && (
                    <div className="ts-search-results">
                        <div className="ts-no-results">
                            <Search size={24} />
                            <p>No students found matching "{searchQuery}"</p>
                        </div>
                    </div>
                )}
            </div>

            {selectedStudent && studentData && academicProfile ? (
                <div className="ts-profile-section-new">
                    {/* Profile Header Banner */}
                    <div className="ts-profile-header-new" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'stretch', padding: '24px' }}>
                        <div className="ts-profile-header-left" style={{ display: 'flex', alignItems: 'center', gap: '24px', width: '100%' }}>
                            <button className="ts-back-btn" onClick={clearStudent}>
                                <ArrowLeft size={18} />
                            </button>
                            <img src={selectedStudent.avatar} alt={selectedStudent.fullName} className="ts-profile-avatar-new" />
                            <div className="ts-profile-info-new">
                                <div className="ts-profile-name-row">
                                    <h2>{selectedStudent.fullName}</h2>
                                </div>
                                <div className="ts-profile-meta-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                    <span className="ts-profile-id-new"><Hash size={14} /> {selectedStudent.studentNumber}</span>
                                    <span className={`ts-user-status ${selectedStudent.status}`}>
                                        <span className="ts-dot"></span>
                                        {selectedStudent.status}
                                    </span>
                                    <span className="ts-role-badge">
                                        Student
                                    </span>
                                    <span className="ts-last-login" style={{ marginLeft: 'auto' }}>
                                        <Clock size={12} /> Last Login: {new Date(selectedStudent.lastLogin).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                        {isSuperAdmin && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #F1F5F9', paddingTop: '16px', marginTop: '8px' }}>
                                <button
                                    onClick={() => openEditModal(selectedStudent, academicProfile)}
                                    style={{
                                        background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                                        color: '#FFF', border: 'none', padding: '10px 20px',
                                        borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px',
                                        fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(124,58,237,0.25)', transition: 'all 0.2s ease'
                                    }}
                                >
                                    <Eye size={16} /> Edit Profile Data
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Profile Dashboard Grid */}
                    <div className="ts-profile-grid">
                        {/* Column 1: Personal & Contact Info */}
                        <div className="ts-section-card">
                            <div className="ts-section-header">
                                <User size={18} />
                                <h3>Personal & Contact Information</h3>
                            </div>
                            <div className="ts-section-body">
                                <div className="ts-info-group">
                                    <h4>Personal Details</h4>
                                    <div className="ts-info-grid">
                                        <div className="ts-info-item">
                                            <span className="ts-info-label">Full Name</span>
                                            <span className="ts-info-val">{selectedStudent.fullName}</span>
                                        </div>
                                        <div className="ts-info-item">
                                            <span className="ts-info-label">Display Name</span>
                                            <span className="ts-info-val">{selectedStudent.displayName || 'Not Set'}</span>
                                        </div>
                                        <div className="ts-info-item">
                                            <span className="ts-info-label">NIC Number</span>
                                            <span className="ts-info-val">{selectedStudent.nic}</span>
                                        </div>
                                        <div className="ts-info-item">
                                            <span className="ts-info-label">Date of Birth</span>
                                            <span className="ts-info-val">{academicProfile.dob}</span>
                                        </div>
                                        <div className="ts-info-item">
                                            <span className="ts-info-label">Gender</span>
                                            <span className="ts-info-val">{academicProfile.sex}</span>
                                        </div>
                                        <div className="ts-info-item">
                                            <span className="ts-info-label">Civil Status</span>
                                            <span className="ts-info-val">{academicProfile.civilStatus}</span>
                                        </div>
                                        <div className="ts-info-item">
                                            <span className="ts-info-label">Join Date</span>
                                            <span className="ts-info-val">{selectedStudent.joinDate}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="ts-info-group ts-border-top">
                                    <h4>Contact Details</h4>
                                    <div className="ts-info-grid">
                                        <div className="ts-info-item">
                                            <span className="ts-info-label">Email Address</span>
                                            <span className="ts-info-val">{selectedStudent.email}</span>
                                        </div>
                                        <div className="ts-info-item">
                                            <span className="ts-info-label">Phone Number</span>
                                            <span className="ts-info-val">{selectedStudent.phone}</span>
                                        </div>
                                        <div className="ts-info-item">
                                            <span className="ts-info-label">WhatsApp Number</span>
                                            <span className="ts-info-val">{academicProfile.whatsapp}</span>
                                        </div>
                                        <div className="ts-info-item full-width">
                                            <span className="ts-info-label">Permanent Address</span>
                                            <span className="ts-info-val">{academicProfile.address}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Academic Qualifications */}
                        <div className="ts-section-card">
                            <div className="ts-section-header">
                                <GraduationCap size={18} />
                                <h3>Academic Qualifications</h3>
                            </div>
                            <div className="ts-section-body ts-academic-body">
                                {/* O/L Section */}
                                <div className="ts-academic-sub">
                                    <div className="ts-academic-sub-header">
                                        <h4>G.C.E. O/L Examination</h4>
                                        <span className="ts-academic-year">Year: {academicProfile.olYear} · Index: {academicProfile.olIndex}</span>
                                    </div>
                                    <table className="ts-mini-table">
                                        <thead>
                                            <tr>
                                                <th>Subject</th>
                                                <th>Grade</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {academicProfile.olSubjects.map((sub, sIdx) => (
                                                <tr key={sIdx}>
                                                    <td>{sub.subject}</td>
                                                    <td><span className="ts-grade-badge">{sub.grade}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* A/L Section */}
                                <div className="ts-academic-sub ts-border-top">
                                    <div className="ts-academic-sub-header">
                                        <h4>G.C.E. A/L Examination</h4>
                                        <span className="ts-academic-year">Year: {academicProfile.alYear} · Index: {academicProfile.alIndex}</span>
                                    </div>
                                    <table className="ts-mini-table">
                                        <thead>
                                            <tr>
                                                <th>Subject</th>
                                                <th>Grade</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {academicProfile.alSubjects.map((sub, sIdx) => (
                                                <tr key={sIdx}>
                                                    <td>{sub.subject}</td>
                                                    <td><span className="ts-grade-badge">{sub.grade}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Other Qualifications */}
                                <div className="ts-academic-sub ts-border-top">
                                    <h4>Other Qualifications & Certifications</h4>
                                    <p className="ts-other-qualifications">{academicProfile.otherQualifications}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Course Details Section Header */}
                    <div className="ts-section-title-outer">
                        <BookOpen size={20} />
                        <h3>Course Details & Recent Activities</h3>
                    </div>

                    {/* Enrolled Courses Dashboard */}
                    <div className="ts-courses-dashboard">
                        {selectedStudent.courses.map((courseName, cIdx) => {
                            const { courseData, courseResults, courseReattempts, coursePostponements, courseExamApps } = getCourseAcademicView(courseName);
                            const isExpanded = expandedCourses[courseName];
                            const courseTimeline = timeline.filter(e => e.course === courseName);

                            return (
                                <div key={cIdx} className="ts-course-block-new">
                                    <button className="ts-course-header-new" onClick={() => toggleCourse(courseName)}>
                                        <div className="ts-course-header-left">
                                            <div className="ts-course-icon-lg-new">
                                                <BookOpen size={20} />
                                            </div>
                                            <div className="ts-course-header-info-new">
                                                <h3>{courseName}</h3>
                                                <div className="ts-course-meta-tags">
                                                    {courseData && (
                                                        <>
                                                            <span className="ts-meta-tag level">{courseData.level}</span>
                                                            <span className="ts-meta-tag">{courseData.department}</span>
                                                            <span className="ts-meta-tag">{courseData.duration}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ts-course-header-right">
                                            <div className="ts-course-mini-stats">
                                                <span title="Results"><GraduationCap size={14} /> {courseResults.length}</span>
                                                <span title="Exam Apps"><ClipboardCheck size={14} /> {courseExamApps.length}</span>
                                                {courseReattempts.length > 0 && <span className="warn" title="Reattempts"><RefreshCw size={14} /> {courseReattempts.length}</span>}
                                                {coursePostponements.length > 0 && <span title="Postponements"><PauseCircle size={14} /> {coursePostponements.length}</span>}
                                            </div>
                                            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="ts-course-body-new">
                                            {/* Coordinator / Secretary Bar */}
                                            {courseData && (
                                                <div className="ts-course-info-bar">
                                                    {courseData.coordinator && (
                                                        <div className="ts-info-chip"><Award size={14} /> Coordinator: {courseData.coordinator}</div>
                                                    )}
                                                    {courseData.secretary && (
                                                        <div className="ts-info-chip"><User size={14} /> Secretary: {courseData.secretary}</div>
                                                    )}
                                                    <div className="ts-info-chip"><Layers size={14} /> {courseData.batches.join(', ')}</div>
                                                </div>
                                            )}

                                            <div className="ts-course-content-grid">
                                                {/* Left Column: Academic Progress Tables */}
                                                <div className="ts-course-left-col">
                                                    {courseData?.semesters && courseData.semesters.length > 0 ? (
                                                        courseData.semesters.map((sem: any, sIdx: number) => (
                                                            <div key={sIdx} className="ts-semester-block">
                                                                <div className="ts-semester-title">
                                                                    <Layers size={16} />
                                                                    <span>Semester {sIdx + 1}</span>
                                                                </div>
                                                                <table className="ts-table">
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Subject</th>
                                                                            <th>Credits</th>
                                                                            <th>Result</th>
                                                                            <th>Status</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {sem.subjects.map((sub: any, subIdx: number) => {
                                                                            const result = courseResults.find(r =>
                                                                                r.subject.toLowerCase() === sub.name.toLowerCase()
                                                                            );
                                                                            const reattempt = courseReattempts.find(r =>
                                                                                r.subject.toLowerCase() === sub.name.toLowerCase()
                                                                            );

                                                                            return (
                                                                                <tr key={subIdx}>
                                                                                    <td className="ts-td-bold">{sub.name}</td>
                                                                                    <td><span className="ts-credit-badge">{sub.credits}</span></td>
                                                                                    <td>
                                                                                        {result ? (
                                                                                            <span className="ts-grade" style={{ background: `${getGradeColor(result.grade)}15`, color: getGradeColor(result.grade) }}>
                                                                                                {result.grade}
                                                                                            </span>
                                                                                        ) : (
                                                                                            <span className="ts-no-result">—</span>
                                                                                        )}
                                                                                    </td>
                                                                                    <td>
                                                                                        {reattempt ? (
                                                                                            <span className="ts-status pending">
                                                                                                <RefreshCw size={12} /> Reattempt #{reattempt.attempt}
                                                                                            </span>
                                                                                        ) : result ? (
                                                                                            <span className="ts-status approved">
                                                                                                <CheckCircle2 size={12} /> Passed
                                                                                            </span>
                                                                                        ) : (
                                                                                            <span className="ts-awaiting">Awaiting</span>
                                                                                        )}
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="ts-no-structure">
                                                            <AlertCircle size={16} />
                                                            <span>No semester structure available for this course.</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Right Column: Course timeline */}
                                                <div className="ts-course-right-col">
                                                    <div className="ts-timeline-header-new">
                                                        <Activity size={16} />
                                                        <span>Recent Course Activities</span>
                                                    </div>
                                                    {courseTimeline.length > 0 ? (
                                                        <div className="ts-course-timeline">
                                                            {courseTimeline.map((event, idx) => (
                                                                <div key={idx} className="ts-timeline-item-new">
                                                                    <div className={`ts-timeline-dot-new ${event.status}`}>
                                                                        {event.icon}
                                                                    </div>
                                                                    <div className="ts-timeline-content-new">
                                                                        <div className="ts-timeline-top-new">
                                                                            <span className="ts-timeline-title-new">{event.title}</span>
                                                                            <span className={getStatusClass(event.status)}>
                                                                                {getStatusIcon(event.status)} {event.status}
                                                                            </span>
                                                                        </div>
                                                                        <p className="ts-timeline-detail-new">{event.detail}</p>
                                                                        <span className="ts-timeline-date-new">{event.date}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="ts-empty-timeline">
                                                            <Clock size={20} />
                                                            <span>No activity logs for this course.</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="ts-empty-state">
                    <div className="ts-empty-icon">
                        <User size={40} />
                    </div>
                    <h3>Search for a Student</h3>
                    <p>Enter a student's name, registration number, or NIC in the search bar above to view their complete academic profile.</p>
                    <div className="ts-empty-hints">
                        <span>Try: <strong>Hiruni Yasoda</strong></span>
                        <span>Or: <strong>26CODL0001</strong></span>
                    </div>
                </div>
            )}

            {showEditModal && (
                <div className="cm-modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }} onClick={() => setShowEditModal(false)}>
                    <div className="cm-modal" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <GraduationCap size={24} style={{ color: '#7C3AED' }} /> Edit Student Profile
                            </h2>
                            <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleEditFormSubmit}>
                            {/* Section A: Account, Identity & Demographics */}
                            <div style={{ background: '#FAFBFD', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0', marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#7C3AED', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account, Identity & Demographics</h3>
                                <div className="modal-grid-2col">
                                    <div className="cm-form-group">
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px', display: 'block' }}>Student Registration ID</label>
                                        <input type="text" value={editForm.studentNumber} onChange={(e) => setEditForm(prev => ({ ...prev, studentNumber: e.target.value }))} className="admin-input" required />
                                    </div>
                                    <div className="cm-form-group">
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px', display: 'block' }}>NIC Number</label>
                                        <input type="text" value={editForm.nic} onChange={(e) => setEditForm(prev => ({ ...prev, nic: e.target.value }))} className="admin-input" required />
                                    </div>
                                    <div className="cm-form-group">
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px', display: 'block' }}>Full Name</label>
                                        <input type="text" value={editForm.fullName} onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))} className="admin-input" required />
                                    </div>
                                    <div className="cm-form-group">
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px', display: 'block' }}>Display Name</label>
                                        <input type="text" value={editForm.displayName} onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))} className="admin-input" />
                                    </div>
                                    <div className="cm-form-group">
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px', display: 'block' }}>Email Address</label>
                                        <input type="email" value={editForm.email} onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))} className="admin-input" required />
                                    </div>
                                    <div className="cm-form-group">
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px', display: 'block' }}>Phone Number</label>
                                        <input type="text" value={editForm.phone} onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))} className="admin-input" />
                                    </div>
                                    <div className="cm-form-group">
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px', display: 'block' }}>WhatsApp Number</label>
                                        <input type="text" value={editForm.whatsapp} onChange={(e) => setEditForm(prev => ({ ...prev, whatsapp: e.target.value }))} className="admin-input" />
                                    </div>
                                    <div className="cm-form-group">
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px', display: 'block' }}>Date of Birth</label>
                                        <input type="date" value={editForm.dob} onChange={(e) => setEditForm(prev => ({ ...prev, dob: e.target.value }))} className="admin-input" />
                                    </div>
                                    <div className="cm-form-group">
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px', display: 'block' }}>User Status</label>
                                        <select value={editForm.status} onChange={(e: any) => setEditForm(prev => ({ ...prev, status: e.target.value }))} className="admin-input">
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="suspended">Suspended</option>
                                        </select>
                                    </div>
                                    <div className="cm-form-group">
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px', display: 'block' }}>System Role</label>
                                        <select value={editForm.role} onChange={(e: any) => setEditForm(prev => ({ ...prev, role: e.target.value }))} className="admin-input" disabled>
                                            <option value="student">Student</option>
                                        </select>
                                    </div>
                                    <div className="cm-form-group">
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px', display: 'block' }}>Gender</label>
                                        <select value={editForm.sex} onChange={(e) => setEditForm(prev => ({ ...prev, sex: e.target.value }))} className="admin-input">
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="cm-form-group">
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px', display: 'block' }}>Civil Status</label>
                                        <select value={editForm.civilStatus} onChange={(e) => setEditForm(prev => ({ ...prev, civilStatus: e.target.value }))} className="admin-input">
                                            <option value="">Select Status</option>
                                            <option value="Unmarried">Unmarried</option>
                                            <option value="Married">Married</option>
                                        </select>
                                    </div>
                                    <div className="cm-form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px', display: 'block' }}>Permanent Address</label>
                                        <textarea value={editForm.address} onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))} className="admin-input" style={{ height: '64px', resize: 'vertical' }} />
                                    </div>
                                </div>
                            </div>

                            {/* Section B: Academic Qualifications Summary */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
                                {/* Left Side: O/L Exam */}
                                <div style={{ background: '#FAFBFD', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', minHeight: '340px' }}>
                                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#7C3AED', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>G.C.E. O/L Examination</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                        <div className="cm-form-group">
                                            <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>O/L Year</label>
                                            <input type="text" value={editForm.olYear} onChange={(e) => setEditForm(prev => ({ ...prev, olYear: e.target.value }))} className="admin-input" style={{ height: '38px' }} />
                                        </div>
                                        <div className="cm-form-group">
                                            <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>O/L Index</label>
                                            <input type="text" value={editForm.olIndex} onChange={(e) => setEditForm(prev => ({ ...prev, olIndex: e.target.value }))} className="admin-input" style={{ height: '38px' }} />
                                        </div>
                                    </div>

                                    <div className="cm-form-group" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>O/L Subjects & Grades</label>
                                            <button type="button" onClick={handleAddOLSubject} style={{ padding: '4px 8px', fontSize: '11px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><Plus size={10} /> Add Subject</button>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, maxHeight: '180px', overflowY: 'auto', border: '1px solid #E2E8F0', padding: '8px', borderRadius: '8px', background: '#FFFFFF' }}>
                                            {editForm.olSubjects.map((sub, sIdx) => (
                                                <div key={sIdx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <input type="text" value={sub.subject} placeholder="Subject Name" onChange={(e) => handleOLSubjectChange(sIdx, 'subject', e.target.value)} className="admin-input" style={{ height: '38px', fontSize: '13px', flex: 1, width: 'auto', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', background: '#FFFFFF', color: '#1E293B' }} required />
                                                    <select value={sub.grade} onChange={(e) => handleOLSubjectChange(sIdx, 'grade', e.target.value)} className="admin-input" style={{ height: '38px', width: '70px', fontSize: '13px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 8px', background: '#FFFFFF', color: '#1E293B', cursor: 'pointer' }}>
                                                        {['A', 'B', 'C', 'S', 'W', 'F'].map(g => <option key={g} value={g}>{g}</option>)}
                                                    </select>
                                                    <button type="button" onClick={() => handleRemoveOLSubject(sIdx)} style={{ height: '38px', width: '38px', background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#EF4444', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><Trash2 size={14} /></button>
                                                </div>
                                            ))}
                                            {editForm.olSubjects.length === 0 && <span style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'center', padding: '4px' }}>No O/L subjects added.</span>}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: A/L Exam */}
                                <div style={{ background: '#FAFBFD', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', minHeight: '340px' }}>
                                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#7C3AED', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>G.C.E. A/L Examination</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                        <div className="cm-form-group">
                                            <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>A/L Year</label>
                                            <input type="text" value={editForm.alYear} onChange={(e) => setEditForm(prev => ({ ...prev, alYear: e.target.value }))} className="admin-input" style={{ height: '38px' }} />
                                        </div>
                                        <div className="cm-form-group">
                                            <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>A/L Index</label>
                                            <input type="text" value={editForm.alIndex} onChange={(e) => setEditForm(prev => ({ ...prev, alIndex: e.target.value }))} className="admin-input" style={{ height: '38px' }} />
                                        </div>
                                    </div>

                                    <div className="cm-form-group" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>A/L Subjects & Grades</label>
                                            <button type="button" onClick={handleAddALSubject} style={{ padding: '4px 8px', fontSize: '11px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><Plus size={10} /> Add Subject</button>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, maxHeight: '180px', overflowY: 'auto', border: '1px solid #E2E8F0', padding: '8px', borderRadius: '8px', background: '#FFFFFF' }}>
                                            {editForm.alSubjects.map((sub, sIdx) => (
                                                <div key={sIdx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <input type="text" value={sub.subject} placeholder="Subject Name" onChange={(e) => handleALSubjectChange(sIdx, 'subject', e.target.value)} className="admin-input" style={{ height: '38px', fontSize: '13px', flex: 1, width: 'auto', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 12px', background: '#FFFFFF', color: '#1E293B' }} required />
                                                    <select value={sub.grade} onChange={(e) => handleALSubjectChange(sIdx, 'grade', e.target.value)} className="admin-input" style={{ height: '38px', width: '70px', fontSize: '13px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 8px', background: '#FFFFFF', color: '#1E293B', cursor: 'pointer' }}>
                                                        {['A', 'B', 'C', 'S', 'F'].map(g => <option key={g} value={g}>{g}</option>)}
                                                    </select>
                                                    <button type="button" onClick={() => handleRemoveALSubject(sIdx)} style={{ height: '38px', width: '38px', background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#EF4444', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><Trash2 size={14} /></button>
                                                </div>
                                            ))}
                                            {editForm.alSubjects.length === 0 && <span style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'center', padding: '4px' }}>No A/L subjects added.</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section C: Professional & Other Qualifications */}
                            <div style={{ background: '#FAFBFD', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0', marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#7C3AED', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Professional & Other Qualifications</h3>
                                <div className="cm-form-group">
                                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px', display: 'block' }}>Other Qualifications & Certifications</label>
                                    <textarea value={editForm.otherQualifications} onChange={(e) => setEditForm(prev => ({ ...prev, otherQualifications: e.target.value }))} className="admin-input" style={{ height: '64px', resize: 'vertical' }} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #F1F5F9', paddingTop: '20px', marginTop: '12px' }}>
                                <button type="button" className="admin-btn-outline" style={{ height: '42px', padding: '0 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }} onClick={() => setShowEditModal(false)}>Cancel</button>
                                <button type="submit" className="admin-btn-primary" style={{ height: '42px', padding: '0 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)', border: 'none', color: '#FFFFFF' }}>Save All Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
