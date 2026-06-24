// =============================================
// Mock Data for Super Admin Panel
// =============================================

export interface User {
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
}

export interface ApprovalStage {
    level: 1 | 2 | 3;
    role: string;
    status: 'pending' | 'approved' | 'rejected';
    approvedBy?: string;
    approvedAt?: string;
    comment?: string;
}

const defaultStages: ApprovalStage[] = [
    { level: 1, role: 'secretary', status: 'approved', approvedBy: 'Ashan Kumara', approvedAt: '2026-03-12' },
    { level: 2, role: 'Admin', status: 'approved', approvedBy: 'Nimali Silva', approvedAt: '2026-03-13' },
    { level: 3, role: 'Super Admin', status: 'pending' }
];

export interface CourseApplication {
    id: string;
    applicantName: string;
    applicantEmail: string;
    applicantNic: string;
    courseTitle: string;
    courseLevel: string;
    applicationDate: string;
    status: 'pending' | 'approved' | 'rejected';
    documents: string[];
    phone: string;
    district: string;
    approvalStages: ApprovalStage[];
    // Extended fields
    dob?: string;
    sex?: string;
    civilStatus?: string;
    address?: string;
    employmentTitle?: string;
    officialAddress?: string;
    homePhone?: string;
    whatsapp?: string;
    guardianPhone?: string;
    olYear?: string;
    olIndex?: string;
    olSubjects?: { subject: string; grade: string }[];
    alYear?: string;
    alIndex?: string;
    alSubjects?: { subject: string; grade: string }[];
    otherQualifications?: string;
    isNewApplicant?: boolean;
    documentsVerified?: { personal: boolean; educational: boolean };
}

export interface LetterRequestAdmin {
    id: string;
    studentName: string;
    studentNumber: string;
    course: string;
    letterType: string;
    reason: string;
    requestDate: string;
    status: 'pending' | 'approved' | 'rejected';
    approvalStages: ApprovalStage[];
    // Extended fields
    address?: string;
    phone?: string;
    nic?: string;
    year?: string;
    batch?: string;
    statusPrefix?: string; // Mr, Mrs, Ms, Rev
}

export interface PostponementRequestAdmin {
    id: string;
    studentName: string;
    studentNumber: string;
    course: string;
    examTitle: string;
    reason: string;
    requestDate: string;
    status: 'pending' | 'approved' | 'rejected';
    medicalCert: boolean;
    approvalStages: ApprovalStage[];
    // Extended fields
    exams?: { subject: string; type: string; date: string }[];
    batch?: string;
}

export interface ExamApplicationAdmin {
    id: string;
    studentName: string;
    studentNumber: string;
    course: string;
    examTitle: string;
    semester: string;
    applicationDate: string;
    status: 'pending' | 'approved' | 'rejected';
    approvalStages: ApprovalStage[];
    // Extended fields
    statusPrefix?: string;
    nameWithInitials?: string;
    nameDenotedByInitials?: string;
    phone?: string;
    permanentAddress?: string;
    examPeriodAddress?: string;
    medium?: string;
    registrationDate?: string;
    previousPostponements?: string;
    feePaid?: number;
    paymentDate?: string;
    subjects?: { code: string; name: string; attempt: string }[];
    isReal?: boolean;
    currentStep?: number;
}

export interface ReattemptRequestAdmin {
    id: string;
    studentName: string;
    studentNumber: string;
    course: string;
    subject: string;
    previousGrade: string;
    attempt: number;
    requestDate: string;
    status: 'pending' | 'approved' | 'rejected';
    approvalStages: ApprovalStage[];
    batch?: string;
}

export interface ExamResultAdmin {
    id: string;
    course: string;
    subject: string;
    subjectCode: string;
    batch: string;
    semester: string;
    lecturer: string;
    uploadDate: string;
    studentCount: number;
    status: 'pending' | 'approved' | 'rejected';
    results: { studentId: string; studentName: string; grade: string }[];
    approvalStages: ApprovalStage[];
}

export interface Subject {
    code?: string;
    name: string;
    credits: string;
}

export interface BatchSubject {
    name: string;
    credits: string;
    instructor: string;
}

export interface Semester {
    subjects: Subject[];
}

export interface AdminBatch {
    name: string;
    startDate: string;
    maxEnrollments: string;
    subtitle: string;
    status: string;
    subjects?: BatchSubject[]; // Subjects with batch-level instructor assignments
}

export interface AdminCourse {
    id: string;
    title: string;
    code: string;
    level: 'Certificate' | 'Advanced Certificate' | 'Diploma' | 'Higher National Diploma' | 'Degree';
    department: string;
    duration: string;
    intakeStatus: 'Open' | 'Closed';
    secretary: string | null;
    totalStudents: number;
    activeStudents: number;
    batches: string[]; // Batch names for backward compatibility
    batchesCount?: number;
    createdDate: string;
    // Academic Structure — subjects defined at course level (no instructor)
    semesters?: Semester[];
    diplomaSubjects?: Subject[];
    coordinator?: string;
}

export interface RolePermission {
    module: string;
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    approve: boolean;
}

export interface RoleConfig {
    role: string;
    label: string;
    color: string;
    userCount: number;
    permissions: RolePermission[];
}

export interface ActivityLog {
    id: string;
    user: string;
    action: string;
    target: string;
    timestamp: string;
    type: 'approval' | 'user' | 'course' | 'system' | 'grade';
}

// ===================== MOCK DATA =====================

export const mockUsers: User[] = [];

export const mockCourseApplications: CourseApplication[] = [];

export const mockLetterRequests: LetterRequestAdmin[] = [];

export const mockPostponementRequests: PostponementRequestAdmin[] = [];

export const mockExamApplications: ExamApplicationAdmin[] = [];

export const mockReattemptRequests: ReattemptRequestAdmin[] = [];

export const mockExamResults: ExamResultAdmin[] = [];

export const mockAdminCourses: AdminCourse[] = [];

export const mockRoleConfigs: RoleConfig[] = [
    {
        role: 'super_admin',
        label: 'Super Admin',
        color: '#DC2626',
        userCount: 1,
        permissions: [
            { module: 'Dashboard', view: true, create: true, edit: true, delete: true, approve: true },
            { module: 'User Management', view: true, create: true, edit: true, delete: true, approve: true },
            { module: 'Application Approvals', view: true, create: true, edit: true, delete: true, approve: true },
            { module: 'Course Management', view: true, create: true, edit: true, delete: true, approve: true },

            { module: 'Role Management', view: true, create: true, edit: true, delete: true, approve: true },
            { module: 'System Settings', view: true, create: true, edit: true, delete: true, approve: true },
        ]
    },

    {
        role: 'student',
        label: 'Student',
        color: '#059669',
        userCount: 4,
        permissions: [
            { module: 'Dashboard', view: true, create: false, edit: false, delete: false, approve: false },
            { module: 'User Management', view: false, create: false, edit: false, delete: false, approve: false },
            { module: 'Application Approvals', view: false, create: false, edit: false, delete: false, approve: false },
            { module: 'Course Management', view: false, create: false, edit: false, delete: false, approve: false },

            { module: 'Role Management', view: false, create: false, edit: false, delete: false, approve: false },
            { module: 'System Settings', view: false, create: false, edit: false, delete: false, approve: false },
        ]

    }
];

export const mockActivityLogs: ActivityLog[] = [];

// Stats / KPI helpers
export const getAdminStats = () => ({
    totalStudents: mockUsers.filter(u => u.role === 'student').length,
    activeStudents: mockUsers.filter(u => u.role === 'student' && u.status === 'active').length,
    totalUsers: mockUsers.length,
    pendingApplications: mockCourseApplications.filter(a => a.status === 'pending').length,
    pendingLetters: mockLetterRequests.filter(l => l.status === 'pending').length,
    pendingPostponements: mockPostponementRequests.filter(p => p.status === 'pending').length,
    pendingExamApps: mockExamApplications.filter(e => e.status === 'pending').length,
    pendingReattempts: mockReattemptRequests.filter(r => r.status === 'pending').length,
    activeCourses: mockAdminCourses.filter(c => c.intakeStatus !== 'Closed').length,
    totalCourses: mockAdminCourses.length,
    totalEnrolled: mockAdminCourses.reduce((sum, c) => sum + c.totalStudents, 0),
});

export const getTotalPendingApprovals = () => {
    const stats = getAdminStats();
    return stats.pendingApplications + stats.pendingLetters + stats.pendingPostponements + stats.pendingExamApps + stats.pendingReattempts;
};

export const getCurrentAdminUser = () => {
    if (typeof window !== 'undefined') {
        const userStr = sessionStorage.getItem('user');
        if (userStr) {
            try {
                const parsedUser = JSON.parse(userStr);
                return {
                    id: parsedUser.id || 'unknown',
                    studentNumber: parsedUser.student_number || parsedUser.studentNumber || '',
                    fullName: parsedUser.full_name || parsedUser.fullName || 'Unknown User',
                    email: parsedUser.email || '',
                    nic: parsedUser.nic || '',
                    role: parsedUser.role || 'super_admin',
                    status: parsedUser.status || 'active',
                    avatar: parsedUser.avatar || '',
                    phone: parsedUser.phone || '',
                    joinDate: parsedUser.created_at || parsedUser.joinDate || '',
                    courses: parsedUser.courses || [],
                    lastLogin: parsedUser.updated_at || parsedUser.lastLogin || ''
                };
            } catch (e) {
                console.error("Failed to parse stored user", e);
            }
        }
    }
    return {
        id: '',
        studentNumber: '',
        fullName: 'Unknown',
        email: '',
        nic: '',
        role: 'super_admin',
        status: 'active',
        avatar: '',
        phone: '',
        joinDate: '',
        courses: [],
        lastLogin: ''
    } as any;
};

export const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    // Filter out common academic / administrative titles
    const cleanParts = parts.filter(p => !['dr.', 'mr.', 'mrs.', 'ms.', 'prof.', 'rev.', 'dr', 'mr', 'mrs', 'ms', 'prof', 'rev'].includes(p.toLowerCase()));
    if (cleanParts.length >= 2) {
        return (cleanParts[0][0] + cleanParts[cleanParts.length - 1][0]).toUpperCase();
    } else if (cleanParts.length === 1 && cleanParts[0]) {
        return cleanParts[0][0].toUpperCase();
    }
    return name[0] ? name[0].toUpperCase() : 'U';
};

export const getAvatarColor = (name: string) => {
    if (!name) return '#7C3AED'; // default purple
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
        '#7C3AED', // Purple
        '#2563EB', // Blue
        '#059669', // Emerald
        '#D97706', // Amber
        '#DC2626', // Red
        '#0891B2', // Cyan
        '#DB2777', // Pink
        '#4F46E5', // Indigo
    ];
};

export const getFullAvatarUrl = (avatar: string | null | undefined): string => {
    if (!avatar) return '';

    // Resolve dynamic host for local and external testing
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

    let resolvedAvatar = avatar;
    if (resolvedAvatar.includes('localhost/storage')) {
        resolvedAvatar = resolvedAvatar.replace('localhost/storage', `${currentHost}:8000/storage`);
    } else if (resolvedAvatar.includes('localhost:8000/storage')) {
        resolvedAvatar = resolvedAvatar.replace('localhost:8000/storage', `${currentHost}:8000/storage`);
    } else if (resolvedAvatar.includes('127.0.0.1/storage')) {
        resolvedAvatar = resolvedAvatar.replace('127.0.0.1/storage', `${currentHost}:8000/storage`);
    } else if (resolvedAvatar.includes('127.0.0.1:8000/storage')) {
        resolvedAvatar = resolvedAvatar.replace('127.0.0.1:8000/storage', `${currentHost}:8000/storage`);
    }

    if (resolvedAvatar.startsWith('http://') || resolvedAvatar.startsWith('https://') || resolvedAvatar.startsWith('data:')) {
        return resolvedAvatar;
    }

    const cleanPath = resolvedAvatar.startsWith('/') ? resolvedAvatar : `/${resolvedAvatar}`;
    let path = cleanPath;
    if (path.startsWith('/avatars/')) {
        path = `/storage${path}`;
    }
    return `http://${currentHost}:8000${path}`;
};

