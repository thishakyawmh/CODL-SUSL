// Mock data and helper utilities for the admin and student portals

export interface AdminCourse {
    id: string;
    title: string;
    code: string;
    level: string;
    createdDate?: string;
    semesters?: any[];
    diplomaSubjects?: any[];
    department?: string;
    intakeStatus?: string;
    activeStudents?: number;
    totalStudents?: number;
    duration?: string;
    batches?: string[];
    batchesCount?: number;
    secretary?: string;
    coordinator?: string;
}

export interface Subject {
    id: string | number;
    code: string;
    name: string;
    credits?: number;
}

export interface User {
    id: string;
    fullName: string;
    email: string;
    role: string;
    status: string;
    avatar?: string;
    studentNumber?: string;
    nic?: string;
    phone?: string;
    lastLogin?: string;
    joinDate?: string;
    courses?: any[];
}

export interface CourseApplication {
    id: string;
    courseTitle: string;
    applicantName: string;
    displayName?: string;
    applicantEmail: string;
    applicantNic: string;
    phone: string;
    whatsapp?: string;
    homePhone?: string;
    guardianPhone?: string;
    district?: string;
    dob?: string;
    sex?: string;
    civilStatus?: string;
    address?: string;
    employmentTitle?: string;
    officialAddress?: string;
    olSubjects?: any[];
    olYear?: string;
    olIndex?: string;
    alSubjects?: any[];
    alYear?: string;
    alIndex?: string;
    otherQualifications?: string;
    isNewApplicant?: boolean;
    isReal?: boolean;
    studentNumber?: string;
    documents?: any;
    documentsVerified?: { personal: boolean; educational: boolean };
    status: string;
    applicationDate: string;
    approvalStages: any[];
}

export interface ExamApplicationAdmin {
    id: string;
    studentName: string;
    studentNumber: string;
    course: string;
    examTitle: string;
    semester: string;
    applicationDate: string;
    status: string;
    approvalStages: any[];
    currentStep?: number;
    phone?: string;
    feePaid?: number;
    paymentDate?: string;
    subjects?: any[];
    rejectionReason?: string;
    isReal?: boolean;
    statusPrefix?: string;
    nameWithInitials?: string;
    nameDenotedByInitials?: string;
    permanentAddress?: string;
    examPeriodAddress?: string;
    medium?: string;
    registrationDate?: string;
    previousPostponements?: string;
    isExamApplication?: boolean;
}

export interface PostponementRequestAdmin {
    id: string;
    studentName: string;
    studentNumber: string;
    course: string;
    examTitle: string;
    subject: string;
    reason: string;
    status: string;
    createdDate: string;
    approvalStages: any[];
    rejectionReason?: string;
    isReal?: boolean;
}

export interface ReattemptRequestAdmin {
    id: string;
    studentName: string;
    studentNumber: string;
    course: string;
    examTitle: string;
    subject: string;
    reason: string;
    status: string;
    createdDate: string;
    approvalStages: any[];
    rejectionReason?: string;
    isReal?: boolean;
}

export interface ActivityLog {
    id: string;
    user: string;
    role: string;
    action: string;
    target: string;
    type: string;
    timestamp: string;
}

// Helper functions for avatars and user initials
export const getInitials = (name?: string): string => {
    if (!name) return 'A';
    return name
        .trim()
        .split(/\s+/)
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

export const getAvatarColor = (name?: string): string => {
    if (!name) return '#7C3AED';
    const colors = [
        '#7C3AED', // Purple-600
        '#4F46E5', // Indigo-600
        '#2563EB', // Blue-600
        '#0D9488', // Teal-600
        '#059669', // Emerald-600
        '#DC2626', // Red-600
        '#D97706', // Amber-600
        '#DB2777'  // Pink-600
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
};

export const getFullAvatarUrl = (avatar?: string): string => {
    if (!avatar) return '';
    if (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('data:')) {
        return avatar;
    }
    return `/uploads/avatars/${avatar}`;
};

export const getCurrentAdminUser = () => {
    if (typeof window !== 'undefined') {
        try {
            const userStr = sessionStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                return {
                    id: user.id?.toString() || 'admin-1',
                    fullName: user.full_name || user.displayName || 'Haleema Sultan',
                    role: user.role || sessionStorage.getItem('adminRole') || 'super_admin',
                    avatar: user.avatar || '',
                    email: user.email || 'admin@codl.lk',
                    phone: user.phone || '0712345678'
                };
            }
        } catch (e) {
            console.error("Failed to parse admin user", e);
        }
    }
    return {
        id: 'admin-1',
        fullName: 'Haleema Sultan',
        role: 'super_admin',
        avatar: '',
        email: 'admin@codl.lk',
        phone: '0712345678'
    };
};

export const mockAdminCourses: AdminCourse[] = [
    {
        id: '1',
        title: 'Diploma in Computer Science',
        code: 'DCS',
        level: 'Diploma',
        department: 'Computing',
        intakeStatus: 'Open',
        activeStudents: 45,
        totalStudents: 60,
        duration: '1 Year',
        batches: ['Batch 01', 'Batch 02']
    },
    {
        id: '2',
        title: 'BSc in Information Technology',
        code: 'BIT',
        level: 'Degree',
        department: 'Computing',
        intakeStatus: 'Open',
        activeStudents: 120,
        totalStudents: 150,
        duration: '3 Years',
        batches: ['Batch 01', 'Batch 02', 'Batch 03']
    },
    {
        id: '3',
        title: 'Certificate in English',
        code: 'CE',
        level: 'Certificate',
        department: 'Languages',
        intakeStatus: 'Closed',
        activeStudents: 30,
        totalStudents: 40,
        duration: '6 Months',
        batches: ['Batch 01']
    }
];

export const mockActivityLogs: ActivityLog[] = [
    {
        id: '1',
        user: 'Haleema Sultan',
        role: 'super_admin',
        action: 'Logged in to staff portal',
        target: 'System',
        type: 'auth',
        timestamp: new Date().toISOString()
    }
];
