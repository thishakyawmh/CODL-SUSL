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
    courseService,
    statsService
} from '../../services/apiService';
import './TrackStudent.css';

interface DBUserType {
    id: string;
    studentNumber: string;
    fullName: string;
    email: string;
    nic: string;
    role: 'super_admin' | 'admin' | 'director' | 'coordinator' | 'secretary' | 'lecturer' | 'student' | 'applicant';
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

import { StudentHeroBanner } from './track-student/StudentHeroBanner';
import { StudentProfileTab } from './track-student/StudentProfileTab';
import { AcademicProgressTab } from './track-student/AcademicProgressTab';
import { RequestsApprovalTab } from './track-student/RequestsApprovalTab';
import { StudentTimelineTab } from './track-student/StudentTimelineTab';
import { EditStudentModal } from './track-student/EditStudentModal';

export const TrackStudent: React.FC = () => {
    const currentAdminUser = getCurrentAdminUser();
    const isSuperAdmin = currentAdminUser.role === 'super_admin';

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<DBUserType | null>(null);
    const [activeTab, setActiveTab] = useState<'profile' | 'academic' | 'requests' | 'timeline'>('profile');
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
    const [realCourses, setRealCourses] = useState<any[]>([]); const [loading, setLoading] = useState<boolean>(false);
    const [dbError, setDbError] = useState<string | null>(null);
    const [totalStudentCount, setTotalStudentCount] = useState<number>(0);

    // Fetch total number of students in database on mount
    useEffect(() => {
        const fetchTotalCount = async () => {
            try {
                const response = await statsService.getAdminStats();
                setTotalStudentCount(response.totalStudents || 0);
            } catch (err) {
                console.error('Failed to load total student count:', err);
            }
        };
        fetchTotalCount();
    }, []);

    // Fetch live search results when query changes
    useEffect(() => {
        if (!searchQuery.trim()) {
            setRealStudents([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setLoading(true);
            try {
                const results = await userService.searchStudents(searchQuery);
                const studentsOnly = (results || [])
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
                setDbError(null);
            } catch (error: any) {
                console.error('Failed to search database students:', error);
                if (error?.response?.status === 401 || error?.response?.status === 403) {
                    setDbError('Session token is invalid or expired. Please log out and log back in.');
                } else {
                    setDbError('Could not connect to database server. Please check your connection.');
                }
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

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
            e => e.studentNumber === student.studentNumber
        );
        const letterReqs = realLetterRequests.filter(
            l => l.studentNumber === student.studentNumber
        );
        const reattempts = realReattempts.filter(
            r => r.studentNumber === student.studentNumber
        );
        const postponements = realPostponements.filter(
            p => p.studentNumber === student.studentNumber
        );

        const results: { subject: string; subjectCode: string; grade: string; course: string; semester: string; status: string; uploadDate: string; lecturer: string; batch: string }[] = [];
        realExamResults.forEach(er => {
            er.results.forEach((r: any) => {
                if (r.studentId === student.studentNumber) {
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

    const selectStudent = async (student: DBUserType) => {
        setLoading(true);
        setSelectedStudent(student);
        setSearchQuery('');
        const expanded: Record<string, boolean> = {};
        student.courses.forEach(c => { expanded[c] = true; });
        setExpandedCourses(expanded);

        try {
            const data = await userService.getStudentTrackingDetails(student.id);
            setRealExamApplications((data.examApplications || []).map(normalizeExamApplication));
            setRealLetterRequests((data.letterRequests || []).map(normalizeLetterRequest));
            setRealReattempts((data.reattemptRequests || []).map(normalizeReattempt));
            setRealPostponements((data.postponementRequests || []).map(normalizePostponement));
            setRealExamResults((data.examResults || []).map(normalizeExamResult));
            setRealCourses((data.courses || []).map(normalizeCourse));
            setDbError(null);
        } catch (error: any) {
            console.error('Failed to fetch tracking details for student:', error);
            setDbError('Could not retrieve tracking details. Please try again.');
        } finally {
            setLoading(false);
        }
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

                {filteredStudents.length > 0 && searchQuery && (
                    <div className="ts-search-results">
                        {filteredStudents.map(s => (
                            <button key={s.id} className="ts-search-item" onClick={() => selectStudent(s)}>
                                <img src={s.avatar} alt={s.fullName} className="ts-search-avatar" />
                                <div className="ts-search-info">
                                    <span className="ts-search-name">{s.fullName}</span>
                                    <span className="ts-search-id">{s.studentNumber}</span>
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
                    {/* Student Hero Banner */}
                    <StudentHeroBanner
                        student={selectedStudent}
                        profile={academicProfile}
                        studentData={studentData}
                        onBack={clearStudent}
                        onEdit={() => openEditModal(selectedStudent, academicProfile)}
                    />

                    {/* Tabbed Navigation Bar */}
                    <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #E2E8F0', marginBottom: '24px' }}>
                        <button
                            onClick={() => setActiveTab('profile')}
                            style={{
                                padding: '12px 20px',
                                fontWeight: 700,
                                fontSize: '14px',
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                color: activeTab === 'profile' ? '#2563EB' : '#64748B',
                                borderBottom: activeTab === 'profile' ? '3px solid #2563EB' : '3px solid transparent',
                                marginBottom: '-2px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <User size={16} /> Student Profile
                        </button>

                        <button
                            onClick={() => setActiveTab('academic')}
                            style={{
                                padding: '12px 20px',
                                fontWeight: 700,
                                fontSize: '14px',
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                color: activeTab === 'academic' ? '#2563EB' : '#64748B',
                                borderBottom: activeTab === 'academic' ? '3px solid #2563EB' : '3px solid transparent',
                                marginBottom: '-2px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <GraduationCap size={16} /> Academic Progress
                        </button>

                        <button
                            onClick={() => setActiveTab('requests')}
                            style={{
                                padding: '12px 20px',
                                fontWeight: 700,
                                fontSize: '14px',
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                color: activeTab === 'requests' ? '#2563EB' : '#64748B',
                                borderBottom: activeTab === 'requests' ? '3px solid #2563EB' : '3px solid transparent',
                                marginBottom: '-2px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <ClipboardCheck size={16} /> Applications & Requests
                        </button>

                        <button
                            onClick={() => setActiveTab('timeline')}
                            style={{
                                padding: '12px 20px',
                                fontWeight: 700,
                                fontSize: '14px',
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                color: activeTab === 'timeline' ? '#2563EB' : '#64748B',
                                borderBottom: activeTab === 'timeline' ? '3px solid #2563EB' : '3px solid transparent',
                                marginBottom: '-2px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <Clock size={16} /> Activity Timeline
                        </button>
                    </div>

                    {/* Tab Contents */}
                    {activeTab === 'profile' && (
                        <StudentProfileTab student={selectedStudent} profile={academicProfile} />
                    )}

                    {activeTab === 'academic' && (
                        <AcademicProgressTab
                            student={selectedStudent}
                            studentData={studentData}
                            realCourses={realCourses}
                            expandedCourses={expandedCourses}
                            onToggleCourse={toggleCourse}
                        />
                    )}

                    {activeTab === 'requests' && (
                        <RequestsApprovalTab studentData={studentData} />
                    )}

                    {activeTab === 'timeline' && (
                        <StudentTimelineTab timeline={timeline} />
                    )}
                </div>
            ) : (
                <div style={{
                    marginTop: '24px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '24px',
                    alignItems: 'stretch'
                }}>
                    {/* KPI Metric Widget */}
                    <div style={{
                        background: '#FFFFFF',
                        borderRadius: '16px',
                        padding: '32px 24px',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: '12px'
                    }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            background: '#EFF6FF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#2563EB'
                        }}>
                            <User size={28} />
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Total Registered Students
                        </span>
                        <h2 style={{ fontSize: '56px', fontWeight: 900, color: '#2563EB', margin: '4px 0', lineHeight: 1 }}>
                            {totalStudentCount}
                        </h2>
                        <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                            Live Database Count
                        </span>
                    </div>

                    {/* Search Guides / Examples */}
                    <div style={{
                        background: '#FFFFFF',
                        borderRadius: '16px',
                        padding: '28px',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '20px'
                    }}>
                        <div>
                            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                                Interactive Quick Search Guide
                            </h3>
                            <p style={{ color: '#64748B', fontSize: '13px', margin: '6px 0 0 0', lineHeight: '1.5' }}>
                                Find student records instantly. Click any example badge below to automatically test search query filters:
                            </p>
                        </div>

                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            {/* Search Card 1 */}
                            <div
                                onClick={() => setSearchQuery('Saveena')}
                                style={{
                                    background: '#F8FAFC',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: '12px',
                                    padding: '12px 16px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#2563EB';
                                    e.currentTarget.style.background = '#F0F9FF';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#E2E8F0';
                                    e.currentTarget.style.background = '#F8FAFC';
                                }}
                            >
                                <div>
                                    <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                                        Search By Name
                                    </span>
                                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                                        Matches display or full name
                                    </span>
                                </div>
                                <code style={{ background: '#EFF6FF', color: '#2563EB', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 700 }}>
                                    "Saveena"
                                </code>
                            </div>

                            {/* Search Card 2 */}
                            <div
                                onClick={() => setSearchQuery('26CODL0001')}
                                style={{
                                    background: '#F8FAFC',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: '12px',
                                    padding: '12px 16px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#2563EB';
                                    e.currentTarget.style.background = '#F0F9FF';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#E2E8F0';
                                    e.currentTarget.style.background = '#F8FAFC';
                                }}
                            >
                                <div>
                                    <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                                        Search By Reg No
                                    </span>
                                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                                        Matches unique student ID
                                    </span>
                                </div>
                                <code style={{ background: '#EFF6FF', color: '#2563EB', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 700 }}>
                                    "26CODL0001"
                                </code>
                            </div>

                            {/* Search Card 3 */}
                            <div
                                onClick={() => setSearchQuery('200545678921')}
                                style={{
                                    background: '#F8FAFC',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: '12px',
                                    padding: '12px 16px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#2563EB';
                                    e.currentTarget.style.background = '#F0F9FF';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#E2E8F0';
                                    e.currentTarget.style.background = '#F8FAFC';
                                }}
                            >
                                <div>
                                    <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                                        Search By NIC
                                    </span>
                                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                                        Matches national identity
                                    </span>
                                </div>
                                <code style={{ background: '#EFF6FF', color: '#2563EB', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 700 }}>
                                    "200545678921"
                                </code>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Student Modal */}
            <EditStudentModal
                show={showEditModal}
                editForm={editForm}
                setEditForm={setEditForm}
                onClose={() => setShowEditModal(false)}
                onSubmit={handleEditFormSubmit}
                onAddOLSubject={handleAddOLSubject}
                onRemoveOLSubject={handleRemoveOLSubject}
                onOLSubjectChange={handleOLSubjectChange}
                onAddALSubject={handleAddALSubject}
                onRemoveALSubject={handleRemoveALSubject}
                onALSubjectChange={handleALSubjectChange}
            />
        </div>
    );
};
