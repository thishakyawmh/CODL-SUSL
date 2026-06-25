import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000, // 60 second timeout for remote Azure DB latency
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Add a response interceptor to handle maintenance mode and unauthorized redirects
api.interceptors.response.use((response) => {
    return response;
}, (error) => {
    if (error.response) {
        if (error.response.status === 503 && error.response.data?.maintenance) {
            sessionStorage.clear();
            window.location.reload();
        } else if (error.response.status === 401) {
            const isLoginRequest = error.config && (error.config.url === '/login' || error.config.url.endsWith('/login'));
            if (!isLoginRequest) {
                sessionStorage.clear();
                const isStaff = window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/staff');
                window.location.href = isStaff ? '/staff/login' : '/login';
            }
        }
    }
    return Promise.reject(error);
});

export const authService = {
    login: async (credentials: { login: string; password: string }) => {
        const response = await api.post('/login', credentials);
        return response.data;
    },
    register: async (data: { full_name: string; email: string; password: string; password_confirmation: string }) => {
        const response = await api.post('/register', data);
        return response.data;
    },
    logout: async () => {
        const response = await api.post('/logout');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('adminRole');
        return response.data;
    },
    getCurrentUser: async () => {
        const response = await api.get('/me');
        return response.data;
    },
    googleLogin: async (credential: string) => {
        const response = await api.post('/auth/google', { credential });
        return response.data;
    }
};

export const userService = {
    getAll: async () => {
        const response = await api.get('/users');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/users', data);
        return response.data;
    },
    update: async (id: string, data: any) => {
        const response = await api.put(`/users/${id}`, data);
        return response.data;
    },
    resetPassword: async (id: string) => {
        const response = await api.post(`/users/${id}/reset-password`);
        return response.data;
    },
    updateProfile: async (data: any) => {
        const response = await api.put('/profile', data);
        return response.data;
    },
    uploadAvatar: async (file: File) => {
        const formData = new FormData();
        formData.append('avatar', file);
        const response = await api.post('/profile/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    changePassword: async (data: { current_password: string; password: string; password_confirmation: string }) => {
        const response = await api.put('/profile/password', data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    }
};

export const categoryService = {
    getAll: async () => {
        const response = await api.get('/categories');
        return response.data;
    }
};

export const courseService = {
    getAll: async () => {
        const response = await api.get('/courses');
        return response.data;
    },
    getPublicCourses: async () => {
        const response = await api.get('/public/courses');
        return response.data;
    },
    getById: async (id: string) => {
        const response = await api.get(`/courses/${id}`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/courses', data);
        return response.data;
    },
    update: async (id: string, data: any) => {
        const response = await api.put(`/courses/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/courses/${id}`);
        return response.data;
    },
    getStudentCourses: async () => {
        const response = await api.get('/student/courses');
        return response.data;
    },
    getEnrolledStudents: async (courseId: string) => {
        const response = await api.get(`/courses/${courseId}/students`);
        return response.data;
    },
    enrollStudent: async (courseId: string, data: { student_id: string; batch?: string }) => {
        const response = await api.post(`/courses/${courseId}/enroll`, data);
        return response.data;
    },
    unenrollStudent: async (courseId: string, studentId: string) => {
        const response = await api.delete(`/courses/${courseId}/students/${studentId}`);
        return response.data;
    },
    getCourseMaterials: async (courseId: string) => {
        const response = await api.get(`/student/courses/${courseId}/materials`);
        return response.data;
    },
    getManageCourseData: async (courseId: string) => {
        const response = await api.get(`/manage-course/${courseId}`);
        return response.data;
    },
    getStudentExaminationsData: async (courseId: string) => {
        const response = await api.get(`/student/courses/${courseId}/examinations-data`);
        return response.data;
    }
};

export const batchService = {
    getByCourse: async (courseId: string) => {
        const response = await api.get(`/courses/${courseId}/batches`);
        return response.data;
    },
    create: async (courseId: string, data: any) => {
        const response = await api.post(`/courses/${courseId}/batches`, data);
        return response.data;
    },
    update: async (courseId: string, batchId: string | number, data: any) => {
        const response = await api.put(`/courses/${courseId}/batches/${batchId}`, data);
        return response.data;
    },
    delete: async (courseId: string, batchId: string | number) => {
        const response = await api.delete(`/courses/${courseId}/batches/${batchId}`);
        return response.data;
    },
    uploadMaterial: async (batchId: string | number, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(`/batches/${batchId}/upload-material`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};

export const courseApplicationService = {
    getAll: async (params?: any) => {
        const response = await api.get('/course-applications', { params });
        return response.data;
    },
    getMyApplications: async () => {
        const response = await api.get('/course-applications/my');
        return response.data;
    },
    getById: async (id: string) => {
        const response = await api.get(`/course-applications/${id}`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/course-applications', data);
        return response.data;
    },
    approve: async (id: string, data?: any) => {
        const response = await api.post(`/course-applications/${id}/approve`, data);
        return response.data;
    },
    reject: async (id: string, data?: any) => {
        const response = await api.post(`/course-applications/${id}/reject`, data);
        return response.data;
    },
    verifyDocs: async (id: string, documentsVerified: any) => {
        const response = await api.put(`/course-applications/${id}/verify-docs`, { documents_verified: documentsVerified });
        return response.data;
    },
    checkNic: async (nic: string) => {
        const response = await api.post('/course-applications/check-nic', { nic });
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/course-applications/${id}`);
        return response.data;
    }
};

export const databaseTableService = {
    getTables: async () => {
        const response = await api.get('/admin/tables');
        return response.data;
    },
    getTableData: async (tableName: string) => {
        const response = await api.get(`/admin/tables/${tableName}`);
        return response.data;
    },
    deleteRecord: async (tableName: string, id: any) => {
        const response = await api.delete(`/admin/tables/${tableName}/${id}`);
        return response.data;
    }
};

export const letterRequestService = {
    getAll: async () => {
        const response = await api.get('/letter-requests');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/letter-requests', data);
        return response.data;
    },
    approve: async (id: string | number, data?: { comment?: string }) => {
        const response = await api.post(`/letter-requests/${id}/approve`, data);
        return response.data;
    },
    reject: async (id: string | number, data?: { comment?: string }) => {
        const response = await api.post(`/letter-requests/${id}/reject`, data);
        return response.data;
    },
    updateStatus: async (id: string | number, status: string) => {
        const response = await api.patch(`/letter-requests/${id}/status`, { status });
        return response.data;
    }
};

export const examApplicationService = {
    getAll: async () => {
        const response = await api.get('/exam-applications');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/exam-applications', data);
        return response.data;
    },
    update: async (id: string | number, data: any) => {
        const response = await api.put(`/exam-applications/${id}`, data);
        return response.data;
    },
    getMyApplications: async () => {
        const response = await api.get('/student/exam-applications');
        return response.data;
    },
    delete: async (id: string | number) => {
        const response = await api.delete(`/exam-applications/${id}`);
        return response.data;
    }
};

export const examService = {
    getByCourse: async (courseId: string) => {
        const response = await api.get(`/courses/${courseId}/exams`);
        return response.data;
    },
    create: async (courseId: string, data: any) => {
        const response = await api.post(`/courses/${courseId}/exams`, data);
        return response.data;
    },
    update: async (id: string | number, data: any) => {
        const response = await api.put(`/exams/${id}`, data);
        return response.data;
    },
    delete: async (id: string | number) => {
        const response = await api.delete(`/exams/${id}`);
        return response.data;
    },
    uploadTimetable: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/exams/upload-timetable', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};

export const postponementRequestService = {
    getAll: async () => {
        const response = await api.get('/postponement-requests');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/postponement-requests', data);
        return response.data;
    },
    update: async (id: string | number, data: any) => {
        const response = await api.put(`/postponement-requests/${id}`, data);
        return response.data;
    },
    getMyRequests: async () => {
        const response = await api.get('/student/postponement-requests');
        return response.data;
    },
    delete: async (id: string | number) => {
        const response = await api.delete(`/postponement-requests/${id}`);
        return response.data;
    }
};

export const reattemptRequestService = {
    getAll: async () => {
        const response = await api.get('/reattempt-requests');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/reattempt-requests', data);
        return response.data;
    },
    update: async (id: string | number, data: any) => {
        const response = await api.put(`/reattempt-requests/${id}`, data);
        return response.data;
    },
    getMyRequests: async () => {
        const response = await api.get('/student/reattempt-requests');
        return response.data;
    },
    delete: async (id: string | number) => {
        const response = await api.delete(`/reattempt-requests/${id}`);
        return response.data;
    }
};

export const examResultService = {
    getAll: async () => {
        const response = await api.get('/exam-results');
        return response.data;
    },
    create: async (data: {
        course_id: number;
        subject_id: number;
        exam_id?: number | null;
        batch: string;
        semester: string;
        min_repeat_grade?: string;
        grades: { user_id: number; grade: string }[];
    }) => {
        const response = await api.post('/exam-results', data);
        return response.data;
    },
    getMyResults: async () => {
        const response = await api.get('/exam-results/my');
        return response.data;
    },
    getByExam: async (examId: number | string) => {
        const response = await api.get(`/exam-results/exam/${examId}`);
        return response.data;
    },
};

export const announcementService = {
    getAll: async (params?: { course_id?: string | number; batch?: string }) => {
        const response = await api.get('/announcements', { params });
        return response.data;
    },
    create: async (data: {
        course_id?: number | null;
        batch?: string | null;
        title: string;
        desc: string;
        type: string;
    }) => {
        const response = await api.post('/announcements', data);
        return response.data;
    },
    delete: async (id: string | number) => {
        const response = await api.delete(`/announcements/${id}`);
        return response.data;
    }
};

export const systemSettingService = {
    getSettings: async () => {
        const response = await api.get('/admin/system-settings');
        return response.data;
    },
    updateSettings: async (data: any) => {
        const response = await api.post('/admin/system-settings', data);
        return response.data;
    },
    uploadLogo: async (file: File) => {
        const formData = new FormData();
        formData.append('logo', file);
        const response = await api.post('/admin/system-settings/logo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};

export const backupService = {
    getBackups: async () => {
        const response = await api.get('/admin/backups');
        return response.data;
    },
    runBackup: async () => {
        const response = await api.post('/admin/backups/run');
        return response.data;
    },
    downloadBackup: async (filename: string) => {
        const response = await api.get(`/admin/backups/download/${filename}`, {
            responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },
    deleteBackup: async (filename: string) => {
        const response = await api.delete(`/admin/backups/${filename}`);
        return response.data;
    }
};

export const activityLogService = {
    getAll: async () => {
        const response = await api.get('/admin/activity-logs');
        return response.data;
    }
};

export default api;
