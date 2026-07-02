import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, Filter } from 'lucide-react';
import { PendingStatusModal } from './PendingStatusModal';
import { courseService } from '../../services/apiService';
import './RegisteredCourses.css';

export interface Course {
    id: string;
    title: string;
    code: string;
    type: 'Degree' | 'Diploma' | 'Certification' | string;
    startDate: string;
    endDate: string;
    batch: string;
}

interface RegisteredCoursesProps {
    onSelect: (course: Course) => void;
}



export const RegisteredCourses: React.FC<RegisteredCoursesProps> = ({ onSelect }) => {
    const [filter, setFilter] = useState<'All' | 'Degree' | 'Diploma' | 'Certification'>('All');
    const [pendingApplications, setPendingApplications] = useState<any[]>([]);
    const [pendingCourse, setPendingCourse] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [backendCourses, setBackendCourses] = useState<Course[]>([]);
    const [courseNotifications, setCourseNotifications] = useState<Record<string, number>>({});

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const cacheKey = 'student_dashboard_overview_cache';
                const cachedData = sessionStorage.getItem(cacheKey);
                
                let data;
                if (cachedData) {
                    const { data: cached, timestamp } = JSON.parse(cachedData);
                    if (Date.now() - timestamp < 30000) {
                        data = cached;
                    }
                }

                if (!data) {
                    data = await courseService.getDashboardOverview();
                    sessionStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
                }

                const mapped: Course[] = (data.courses || []).map((c: any) => ({
                    id: c.id.toString(),
                    title: c.title,
                    code: c.code,
                    type: c.level === 'Certificate' || c.level === 'Advanced Certificate' ? 'Certification' : c.level,
                    startDate: c.created_at ? new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Jan 15, 2026',
                    endDate: c.duration || '3 Years',
                    batch: c.pivot?.batch || 'Batch TBD'
                }));
                setBackendCourses(mapped);

                const pending = (data.pendingApplications || []).filter((app: any) => app.status === 'pending');
                setPendingApplications(pending);

                const notificationsMap: Record<string, number> = {};

                mapped.forEach((course) => {
                    let totalCount = 0;
                    try {
                        const courseData = data.notificationsData?.[course.id];
                        if (!courseData) return;

                        const lastVisitedMaterials = localStorage.getItem(`materials_lastVisited_${course.id}`);
                        const lastVisitedMaterialsTs = lastVisitedMaterials ? parseInt(lastVisitedMaterials, 10) : 0;

                        const lastVisitedExams = localStorage.getItem(`exams_lastVisited_${course.id}`);
                        const lastVisitedExamsTs = lastVisitedExams ? parseInt(lastVisitedExams, 10) : 0;

                        const materials = courseData.materials || [];
                        const examData = courseData.examData || { exams: [], my_applications: [], postponement_requests: [], reattempt_requests: [] };

                        // 1. Calculate new materials count
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

                        // 2. Calculate new exams count
                        let exCount = 0;
                        let totalExamCount = 0;
                        const exams = examData.exams || [];
                        const myApps = examData.my_applications || [];
                        const myPostponements = examData.postponement_requests || [];
                        const myReattempts = examData.reattempt_requests || [];

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

                        myApps.forEach((app: any) => {
                            const updatedAt = app.updated_at ? new Date(app.updated_at).getTime() : 0;
                            if (updatedAt > lastVisitedExamsTs) exCount++;
                        });

                        myPostponements.forEach((req: any) => {
                            const updatedAt = req.updated_at ? new Date(req.updated_at).getTime() : 0;
                            if (updatedAt > lastVisitedExamsTs) exCount++;
                        });

                        myReattempts.forEach((req: any) => {
                            const updatedAt = req.updated_at ? new Date(req.updated_at).getTime() : 0;
                            if (updatedAt > lastVisitedExamsTs) exCount++;
                        });

                        totalCount = matCount + exCount;
                    } catch (e) {
                        console.error(`Failed to calculate notification count for course ${course.id}:`, e);
                    }
                    notificationsMap[course.id] = totalCount;
                });

                setCourseNotifications(notificationsMap);
            } catch (err) {
                console.error('Failed to fetch dashboard data:', err);
            }
        };

        fetchDashboardData();
    }, []);

    const filteredCourses = backendCourses.filter(prog => filter === 'All' || prog.type === filter);

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'Degree': return { bg: '#EDE9FE', text: '#7C3AED' }; // Purple
            case 'Diploma': return { bg: '#F3E8FF', text: '#9333EA' }; // Purple
            case 'Certification': return { bg: '#CCFBF1', text: '#0D9488' }; // Teal
            default: return { bg: '#F1F5F9', text: '#475569' }; // Gray
        }
    };

    return (
        <div className="registered-Courses-wrapper">
            {pendingApplications.length > 0 && (
                <div className="pending-enrollment-section">
                    <div className="registered-Courses-header no-border">
                        <div className="rp-title-section">
                            <BookOpen size={22} className="rp-title-icon warning" />
                            <h2 className="rp-title warning">Pending Enrollments</h2>
                        </div>
                    </div>

                    <div className="rp-grid spaced-top">
                        {pendingApplications.map((app) => {
                            const courseDetails = app.course || app;
                            return (
                                <div className="rp-card pending-card" key={app.id}>
                                    <div className="rp-card-header">
                                        <div className="rp-card-icon pending">
                                            <BookOpen size={20} />
                                        </div>
                                        <span className="rp-badge pending">
                                            Under Review
                                        </span>
                                    </div>

                                    <div className="rp-card-body">
                                        <h3 className="rp-course-title">{courseDetails.title}</h3>
                                        <p className="rp-course-code">{courseDetails.level} • {courseDetails.department || 'General'}</p>
                                    </div>

                                    <div className="rp-card-info-text">
                                        <span>
                                            Your application was successfully submitted and is currently being reviewed by the administration.
                                        </span>
                                    </div>

                                    <button
                                        className="rp-access-btn warning"
                                        onClick={() => {
                                            setPendingCourse(app);
                                            setIsModalOpen(true);
                                        }}
                                    >
                                        View Status
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <PendingStatusModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                course={pendingCourse}
                onApprove={() => {}}
            />

            <div className="registered-Courses-header">
                <div className="rp-title-section">
                    <BookOpen size={22} className="rp-title-icon" />
                    <h2 className="rp-title">My Registered Courses</h2>
                </div>
                <div className="rp-filters">
                    <Filter size={18} className="rp-filter-icon" />
                    <div className="rp-filter-chips">
                        {(['All', 'Degree', 'Diploma', 'Certification'] as const).map(type => (
                            <button
                                key={type}
                                className={`rp-chip ${filter === type ? 'active' : ''}`}
                                onClick={() => setFilter(type)}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="rp-grid">
                {filteredCourses.map(prog => {
                    const typeClass = prog.type.toLowerCase();
                    const notifCount = courseNotifications[prog.id] || 0;
                    return (
                        <div className="rp-card" key={prog.id} style={{ position: 'relative' }}>
                            {notifCount > 0 && (
                                <div className="course-card-notification-badge">
                                    {notifCount}
                                </div>
                            )}
                            <div className="rp-card-header">
                                <div className={`rp-card-icon ${typeClass}`}>
                                    <BookOpen size={20} />
                                </div>
                                <span className={`rp-badge ${typeClass}`}>
                                    {prog.type}
                                </span>
                            </div>

                            <div className="rp-card-body">
                                <h3 className="rp-course-title">{prog.title}</h3>
                                <p className="rp-course-code">{prog.code} • {prog.batch}</p>
                            </div>

                            <div className="rp-card-dates">
                                <div className="rp-date">
                                    <Calendar size={14} />
                                    <span>Start: {prog.startDate}</span>
                                </div>
                                <div className="rp-date">
                                    <Calendar size={14} />
                                    <span>End: {prog.endDate}</span>
                                </div>
                            </div>

                            <button className="rp-access-btn" onClick={() => onSelect(prog)}>
                                Access Course
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
