import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    BookOpen, Search, Plus, Edit3, Users as UsersIcon,
    Calendar, Award, Trash2, ArrowUpRight, UserCheck, Layers, ArrowLeft, MoreVertical,
    Clock
} from 'lucide-react';
import {
    mockAdminCourses, getCurrentAdminUser
} from '../../data/mockAdminData';
import {
    courseService,
    courseApplicationService,
    letterRequestService,
    postponementRequestService,
    examApplicationService,
    reattemptRequestService
} from '../../services/apiService';
import { toast } from '../../utils/toast';
import './CourseManagement.css';

export const CourseManagement: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState('');
    const [levelFilter, setLevelFilter] = useState<string>(() => {
        return searchParams.get('level') || 'all';
    });
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [realCourses, setRealCourses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number | null>(null);

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

    const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
        showConfirm(
            'Confirm Delete Course',
            `Are you sure you want to delete "${courseTitle}"? All associated batches, materials, and records will be permanently removed. This action cannot be undone.`,
            async () => {
                try {
                    await courseService.delete(courseId);
                    setRealCourses(prev => prev.filter(c => c.id !== courseId));
                    toast.success('Course deleted successfully.');
                } catch (err: any) {
                    console.error('Failed to delete course:', err);
                    toast.error(err.response?.data?.message || 'Failed to delete course.');
                }
            }
        );
    };

    const currentUser = getCurrentAdminUser();
    const userRole = currentUser.role;
    const canCreate = userRole === 'super_admin' || userRole === 'director';

    useEffect(() => {
        const fetchRealCourses = async () => {
            try {
                const data = await courseService.getAll();
                // Map backend fields to frontend UI expectations
                const mapped = data.map((c: any) => ({
                    id: c.id.toString(),
                    title: c.title,
                    code: c.code,
                    level: c.level,
                    department: c.department || 'Computing',
                    intakeStatus: c.intake_status,
                    activeStudents: c.students_count || 0,
                    totalStudents: c.max_students || 0,
                    duration: c.duration || '6 Months',
                    batches: c.batches || [],
                    batchesCount: c.batches_count || 0,
                    secretary: c.secretary?.full_name || 'Not Assigned',
                    secretary_id: c.secretary_id,
                    coordinator: c.coordinator?.full_name || 'Not Assigned',
                    coordinator_id: c.coordinator_id
                }));
                setRealCourses(mapped);
            } catch (err) {
                console.error('Failed to fetch real courses:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRealCourses();
    }, []);

    useEffect(() => {
        if (isLoading) return;
        if (!['coordinator', 'secretary', 'director', 'super_admin'].includes(userRole)) return;

        const fetchPendingApprovals = async () => {
            try {
                // Determine assigned course IDs for filtering
                let assignedCourseIds: string[] = [];
                let localCourses = [...mockAdminCourses, ...realCourses];

                if (userRole === 'secretary') {
                    const adminName = currentUser.fullName.toLowerCase();
                    const filtered = localCourses.filter(course => {
                        if (course.id.startsWith('CRS-')) {
                            const sec = course.secretary?.toLowerCase() || '';
                            return sec !== '' && (sec.includes(adminName) || adminName.includes(sec.replace(/^(mr\.|mrs\.|ms\.)\s+/i, '')));
                        } else {
                            return course.secretary_id?.toString() === currentUser.id?.toString() ||
                                (course.secretary?.toLowerCase() || '').includes(adminName);
                        }
                    });
                    assignedCourseIds = filtered.map(c => c.id.toString());
                } else if (userRole === 'coordinator') {
                    const adminName = currentUser.fullName.toLowerCase();
                    const filtered = localCourses.filter(course => {
                        if (course.id.startsWith('CRS-')) {
                            const coord = course.coordinator?.toLowerCase() || '';
                            return coord !== '' && (coord.includes(adminName) || adminName.includes(coord.replace(/^(dr\.|mr\.|mrs\.|ms\.)\s+/i, '')));
                        } else {
                            return course.coordinator_id?.toString() === currentUser.id?.toString() ||
                                (course.coordinator?.toLowerCase() || '').includes(adminName);
                        }
                    });
                    assignedCourseIds = filtered.map(c => c.id.toString());
                }

                const [
                    courseApps,
                    letterReqs,
                    postponementReqs,
                    examApps,
                    reattemptReqs
                ] = await Promise.all([
                    courseApplicationService.getAll().catch(() => []),
                    letterRequestService.getAll().catch(() => []),
                    postponementRequestService.getAll().catch(() => []),
                    examApplicationService.getAll().catch(() => []),
                    reattemptRequestService.getAll().catch(() => [])
                ]);

                let totalPending = 0;

                if (userRole === 'secretary') {
                    const pendingCourseApps = courseApps.filter((app: any) =>
                        app.status === 'pending' &&
                        app.approval_level === 0 &&
                        assignedCourseIds.includes(app.course_id?.toString())
                    ).length;

                    const pendingLetterReqs = letterReqs.filter((req: any) =>
                        req.status === 'pending' &&
                        req.approval_level === 0 &&
                        assignedCourseIds.includes(req.course_id?.toString())
                    ).length;

                    const pendingPostponements = postponementReqs.filter((req: any) =>
                        req.status === 'pending' &&
                        (req.current_step === 1 || !req.current_step) &&
                        assignedCourseIds.includes(req.course_id?.toString())
                    ).length;

                    const pendingExamApps = examApps.filter((req: any) =>
                        req.status === 'pending' &&
                        (req.current_step === 1 || !req.current_step) &&
                        assignedCourseIds.includes(req.course_id?.toString())
                    ).length;

                    const pendingReattempts = reattemptReqs.filter((req: any) =>
                        req.status === 'pending' &&
                        (req.current_step === 1 || !req.current_step) &&
                        assignedCourseIds.includes(req.course_id?.toString())
                    ).length;

                    totalPending = pendingCourseApps + pendingLetterReqs + pendingPostponements + pendingExamApps + pendingReattempts;
                } else if (userRole === 'coordinator') {
                    const pendingCourseApps = courseApps.filter((app: any) =>
                        app.status === 'pending' &&
                        app.approval_level === 1 &&
                        assignedCourseIds.includes(app.course_id?.toString())
                    ).length;

                    const pendingLetterReqs = letterReqs.filter((req: any) =>
                        req.status === 'pending' &&
                        req.approval_level === 1 &&
                        assignedCourseIds.includes(req.course_id?.toString())
                    ).length;

                    const pendingPostponements = postponementReqs.filter((req: any) =>
                        req.status === 'pending' &&
                        req.current_step === 2 &&
                        assignedCourseIds.includes(req.course_id?.toString())
                    ).length;

                    const pendingExamApps = examApps.filter((req: any) =>
                        req.status === 'pending' &&
                        req.current_step === 2 &&
                        assignedCourseIds.includes(req.course_id?.toString())
                    ).length;

                    const pendingReattempts = reattemptReqs.filter((req: any) =>
                        req.status === 'pending' &&
                        req.current_step === 2 &&
                        assignedCourseIds.includes(req.course_id?.toString())
                    ).length;

                    totalPending = pendingCourseApps + pendingLetterReqs + pendingPostponements + pendingExamApps + pendingReattempts;
                } else if (userRole === 'director') {
                    const pendingCourseApps = courseApps.filter((app: any) =>
                        app.status === 'pending' &&
                        app.approval_level === 2
                    ).length;

                    const pendingLetterReqs = letterReqs.filter((req: any) =>
                        req.status === 'pending' &&
                        req.approval_level === 2
                    ).length;

                    const pendingPostponements = postponementReqs.filter((req: any) =>
                        req.status === 'pending' &&
                        req.current_step === 3
                    ).length;

                    const pendingExamApps = examApps.filter((req: any) =>
                        req.status === 'pending' &&
                        req.current_step === 3
                    ).length;

                    const pendingReattempts = reattemptReqs.filter((req: any) =>
                        req.status === 'pending' &&
                        req.current_step === 3
                    ).length;

                    totalPending = pendingCourseApps + pendingLetterReqs + pendingPostponements + pendingExamApps + pendingReattempts;
                } else if (userRole === 'super_admin') {
                    const pendingCourseApps = courseApps.filter((app: any) =>
                        app.status === 'pending'
                    ).length;

                    const pendingLetterReqs = letterReqs.filter((req: any) =>
                        req.status === 'pending'
                    ).length;

                    const pendingPostponements = postponementReqs.filter((req: any) =>
                        req.status === 'pending'
                    ).length;

                    const pendingExamApps = examApps.filter((req: any) =>
                        req.status === 'pending'
                    ).length;

                    const pendingReattempts = reattemptReqs.filter((req: any) =>
                        req.status === 'pending'
                    ).length;

                    totalPending = pendingCourseApps + pendingLetterReqs + pendingPostponements + pendingExamApps + pendingReattempts;
                }

                setPendingApprovalsCount(totalPending);
            } catch (err) {
                console.error('Failed to calculate pending approvals:', err);
            }
        };

        fetchPendingApprovals();
    }, [isLoading, realCourses, userRole]);

    // Merge mock and real courses
    let allCourses = [...mockAdminCourses, ...realCourses];

    // Filter by assigned courses if the user is a secretary or coordinator
    if (userRole === 'secretary') {
        const adminName = currentUser.fullName.toLowerCase();
        allCourses = allCourses.filter(course => {
            if (course.id.startsWith('CRS-')) {
                // Mock courses
                const sec = course.secretary?.toLowerCase() || '';
                return sec !== '' && (sec.includes(adminName) || adminName.includes(sec.replace(/^(mr\.|mrs\.|ms\.)\s+/i, '')));
            } else {
                // Real courses from API
                return course.secretary_id?.toString() === currentUser.id?.toString() ||
                    (course.secretary?.toLowerCase() || '').includes(adminName);
            }
        });
    } else if (userRole === 'coordinator') {
        const adminName = currentUser.fullName.toLowerCase();
        allCourses = allCourses.filter(course => {
            if (course.id.startsWith('CRS-')) {
                // Mock courses
                const coord = course.coordinator?.toLowerCase() || '';
                return coord !== '' && (coord.includes(adminName) || adminName.includes(coord.replace(/^(dr\.|mr\.|mrs\.|ms\.)\s+/i, '')));
            } else {
                // Real courses from API
                return course.coordinator_id?.toString() === currentUser.id?.toString() ||
                    (course.coordinator?.toLowerCase() || '').includes(adminName);
            }
        });
    } else if (userRole === 'lecturer') {
        const adminName = currentUser.fullName.toLowerCase();
        allCourses = allCourses.filter(course => {
            if (course.id.startsWith('CRS-')) {
                // Mock courses
                const coord = course.coordinator?.toLowerCase() || '';
                const sec = course.secretary?.toLowerCase() || '';
                return (coord !== '' && (coord.includes(adminName) || adminName.includes(coord.replace(/^(dr\.|mr\.|mrs\.|ms\.)\s+/i, '')))) ||
                    (sec !== '' && (sec.includes(adminName) || adminName.includes(sec.replace(/^(mr\.|mrs\.|ms\.)\s+/i, ''))));
            } else {
                // Real courses from API are already filtered by the backend
                return true;
            }
        });
    }

    const filteredCourses = allCourses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLevel = levelFilter === 'all' || course.level === levelFilter;
        return matchesSearch && matchesLevel;
    });

    const getIntakeColor = (status: string) => {
        switch (status) {
            case 'Open': return { bg: '#D1FAE5', text: '#059669' };
            case 'Closed': return { bg: '#FEE2E2', text: '#DC2626' };
            default: return { bg: '#F1F5F9', text: '#475569' };
        }
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'Degree': return { bg: '#EDE9FE', text: '#7C3AED' };
            case 'Diploma': return { bg: '#DBEAFE', text: '#2563EB' };
            case 'Higher National Diploma': return { bg: '#FEF3C7', text: '#D97706' };
            case 'Advanced Certificate': return { bg: '#FCE7F3', text: '#DB2777' };
            case 'Certificate': return { bg: '#CCFBF1', text: '#0D9488' };
            default: return { bg: '#F1F5F9', text: '#475569' };
        }
    };

    if (isLoading) {
        return (
            <div className="cm-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                <div style={{ textAlign: 'center', color: '#64748B' }}>
                    <div style={{ width: '48px', height: '48px', border: '3px solid #E2E8F0', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                    <p style={{ fontWeight: 600 }}>Loading courses...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="cm-container" onClick={() => setOpenMenuId(null)}>
            <div className="admin-page-header">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    {(levelFilter !== 'all' || searchTerm !== '') && (
                        <button
                            className="cm-back-text-btn"
                            style={{ marginBottom: '16px', marginLeft: '-16px' }}
                            onClick={() => {
                                setLevelFilter('all');
                                setSearchTerm('');
                                navigate('/admin/courses', { replace: true });
                            }}
                        >
                            <ArrowLeft size={18} /> Back
                        </button>
                    )}
                    <h1 className="admin-page-title">
                        {(levelFilter !== 'all' || searchTerm !== '')
                            ? (searchTerm ? `Search Results for "${searchTerm}"` : `${levelFilter} Programs`)
                            : "Course Management"
                        }
                    </h1>
                    <p className="admin-page-subtitle">
                        {(levelFilter !== 'all' || searchTerm !== '')
                            ? "Explore and manage our educational program categories."
                            : "Create, manage, and configure all courses, batches, and secretary assignments."
                        }
                    </p>
                </div>
                <div className="admin-header-actions">
                    {canCreate && (
                        <button className="admin-btn-primary" onClick={() => navigate('/admin/courses/create')}>
                            <Plus size={16} /> New Course
                        </button>
                    )}
                </div>
            </div>


            {/* Stats */}
            {levelFilter === 'all' && !searchTerm && (
                <div className="cm-stats-row" style={{
                    gridTemplateColumns: ['coordinator', 'secretary', 'director', 'super_admin'].includes(userRole)
                        ? 'repeat(4, 1fr)'
                        : (userRole === 'lecturer' ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)')
                }}>
                    {['coordinator', 'secretary', 'director', 'super_admin'].includes(userRole) && (
                        <div className="cm-stat-card">
                            <div className="cm-stat-icon" style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}><Clock size={20} /></div>
                            <div className="cm-stat-info">
                                <span className="cm-stat-val">{pendingApprovalsCount !== null ? pendingApprovalsCount : '0'}</span>
                                <span className="cm-stat-label">Pending Approvals</span>
                            </div>
                        </div>
                    )}
                    <div className="cm-stat-card">
                        <div className="cm-stat-icon" style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}><BookOpen size={20} /></div>
                        <div className="cm-stat-info">
                            <span className="cm-stat-val">{allCourses.length}</span>
                            <span className="cm-stat-label">Total Courses</span>
                        </div>
                    </div>
                    {userRole !== 'lecturer' && (
                        <div className="cm-stat-card">
                            <div className="cm-stat-icon" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}><ArrowUpRight size={20} /></div>
                            <div className="cm-stat-info">
                                <span className="cm-stat-val">
                                    {(() => {
                                        const todayStr = new Date().toISOString().split('T')[0];
                                        return allCourses.filter(c =>
                                            c.intakeStatus === 'Open' ||
                                            (c.batches || []).some((b: any) =>
                                                b.status === 'Upcoming' && (!b.registration_deadline || b.registration_deadline >= todayStr)
                                            )
                                        ).length;
                                    })()}
                                </span>
                                <span className="cm-stat-label">Courses Open for Intake</span>
                            </div>
                        </div>
                    )}
                    <div className="cm-stat-card">
                        <div className="cm-stat-icon" style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}><UsersIcon size={20} /></div>
                        <div className="cm-stat-info">
                            <span className="cm-stat-val">{allCourses.reduce((s, c) => s + c.activeStudents, 0)}</span>
                            <span className="cm-stat-label">Total Registered Students</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Search Bar only */}
            <div className="cm-filters">
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

            {/* Category Overview (Featured when no search/filter) */}
            {levelFilter === 'all' && !searchTerm && (
                allCourses.length === 0 ? (
                    <div className="cm-empty" style={{ background: '#FFFFFF', padding: '60px', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.05)', textAlign: 'center', margin: '20px 0' }}>
                        <BookOpen size={48} style={{ color: '#94A3B8', margin: '0 auto 16px', opacity: 0.5 }} />
                        <p style={{ fontWeight: 600, color: '#475569', margin: 0 }}>No assigned courses found.</p>
                    </div>
                ) : (
                    <div className="cm-categories-grid">
                        {[
                            { name: 'Degree', desc: '4-Year Academic Programs', icon: BookOpen, color: '#7C3AED', count: allCourses.filter(c => c.level === 'Degree').length },
                            { name: 'Higher National Diploma', desc: 'Advanced Professional Diplomas', icon: Layers, color: '#F59E0B', count: allCourses.filter(c => c.level === 'Higher National Diploma').length },
                            { name: 'Diploma', desc: '1-2 Year Specialized Courses', icon: BookOpen, color: '#3B82F6', count: allCourses.filter(c => c.level === 'Diploma').length },
                            { name: 'Advanced Certificate', desc: 'Intermediate Level Certifications', icon: Award, color: '#EC4899', count: allCourses.filter(c => c.level === 'Advanced Certificate').length },
                            { name: 'Certificate', desc: 'Short-term Skill Programs', icon: Award, color: '#10B981', count: allCourses.filter(c => c.level === 'Certificate').length },
                        ].filter(type => {
                            if (['secretary', 'coordinator', 'lecturer'].includes(userRole)) {
                                return type.count > 0;
                            }
                            return true;
                        }).map(type => (
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
                )
            )}

            {/* Course Content Grid */}
            {(levelFilter !== 'all' || searchTerm !== '') && (
                <>


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
                                            <span>{course.batchesCount !== undefined ? course.batchesCount : course.batches.length} batch{(course.batchesCount !== undefined ? course.batchesCount : course.batches.length) !== 1 ? 'es' : ''}</span>
                                        </div>
                                    </div>

                                    <div className="cmc-faculty-info">
                                        <div className="cmc-faculty-item">
                                            <UserCheck size={13} />
                                            <span>Secretary: <strong>{course.secretary || 'Not Assigned'}</strong></span>
                                        </div>
                                        <div className="cmc-faculty-item">
                                            <Layers size={13} />
                                            <span>Coordinator: <strong>{course.coordinator || 'Not Assigned'}</strong></span>
                                        </div>
                                    </div>

                                    <div className="cmc-grid-actions">
                                        <button className="cmc-btn-manage big" title="Manage Course Batches" onClick={() => navigate(`/admin/courses/manage/${course.id}`)}>
                                            <Edit3 size={16} /> Manage
                                        </button>

                                        {userRole !== 'secretary' && userRole !== 'lecturer' && (
                                            <div className="cmc-more-container">
                                                <button
                                                    className="cmc-btn-more"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenuId(openMenuId === course.id ? null : course.id);
                                                    }}
                                                >
                                                    <MoreVertical size={20} />
                                                </button>

                                                {openMenuId === course.id && (
                                                    <div className="cmc-dropdown-menu">
                                                        <button onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/admin/courses/edit/${course.id}`);
                                                        }}>
                                                            <Edit3 size={14} /> Edit Settings
                                                        </button>
                                                        {userRole !== 'coordinator' && (
                                                            <button
                                                                className="delete"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setOpenMenuId(null);
                                                                    if (userRole === 'director' || userRole === 'super_admin') {
                                                                        handleDeleteCourse(course.id, course.title);
                                                                    } else {
                                                                        toast.warning('Only Directors or Super Administrators can delete courses directly.', { title: 'Action Restricted' });
                                                                    }
                                                                }}
                                                            >
                                                                <Trash2 size={14} /> Delete Course
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {filteredCourses.length === 0 && (
                        <div className="cm-empty">
                            <BookOpen size={48} />
                            <p>No courses match your criteria</p>
                        </div>
                    )}
                </>
            )}

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
                    <div className="cm-modal" style={{ maxWidth: '400px', width: '90%', padding: '24px', background: '#FFFFFF', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>{confirmModal.title}</h2>
                            <p style={{ color: '#64748B', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>{confirmModal.message}</p>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
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
                                        background: '#EF4444', 
                                        color: '#FFFFFF', 
                                        border: 'none',
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
                </div>
            )}
        </div>
    );
};
