import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Save, Plus, Trash2,
    BookOpen, Layers, ChevronRight
} from 'lucide-react';
import { userService, categoryService, courseService } from '../../services/apiService';
import { mockAdminCourses, getCurrentAdminUser } from '../../data/mockAdminData';
import { toast } from '../../utils/toast';
import './CourseManagement.css';

const FACULTY_OPTIONS = [
    'Faculty of Agricultural Sciences',
    'Faculty of Applied Sciences',
    'Faculty of Computing',
    'Faculty of Geomatics',
    'Faculty of Management Studies',
    'Faculty of Medicine',
    'Faculty of Social Sciences and Languages',
    'Faculty of Technology',
    'Postgraduate Unit'
];

interface Subject {
    code?: string;
    name: string;
    credits: string;
}

interface Semester {
    subjects: Subject[];
}

interface Category {
    id: number;
    name: string;
}

interface RemoteUser {
    id: string;
    full_name: string;
    role: string;
}

export const CreateCourse: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;
    const currentUser = getCurrentAdminUser();
    const userRole = currentUser.role;

    useEffect(() => {
        if (!isEdit && userRole !== 'super_admin' && userRole !== 'director') {
            toast.error('You do not have permission to create courses.');
            navigate('/admin/courses');
        }
    }, [isEdit, userRole, navigate]);

    const [courseType, setCourseType] = useState<'Degree' | 'Higher National Diploma' | 'Diploma' | 'Advance Certificate' | 'Certificate'>('Degree');
    const [categories, setCategories] = useState<Category[]>([]);
    const [instructors, setInstructors] = useState<RemoteUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Common Fields
    const [commonData, setCommonData] = useState({
        name: '',
        code: '',
        enrollments: '',
        duration: '3 Years',
        startDate: '',
        endDate: '',
        secretary: '',
        coordinator: '',
        status: 'Open',
        department: 'Faculty of Computing'
    });

    const [facultySelect, setFacultySelect] = useState('Faculty of Computing');
    const [customFaculty, setCustomFaculty] = useState('');

    // Specific Fields
    const [semesterCount, setSemesterCount] = useState(1);
    const [semesters, setSemesters] = useState<Semester[]>([{ subjects: [{ code: '', name: '', credits: '' }] }]);
    const [diplomaSubjects, setDiplomaSubjects] = useState<Subject[]>([{ code: '', name: '', credits: '' }]);

    useEffect(() => {
        // Fetch Categories and Instructors
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [cats, users] = await Promise.all([
                    categoryService.getAll(),
                    userService.getAll()
                ]);
                setCategories(cats);
                setInstructors(users.filter((u: RemoteUser) =>
                    ['lecturer', 'coordinator', 'secretary', 'director'].includes(u.role)
                ));

                if (isEdit && id) {
                    // 1. Try mock data first
                    let courseData = mockAdminCourses.find(c => String(c.id) === String(id));

                    // 2. If not found in mock, load from API
                    if (!courseData) {
                        try {
                            const fetched = await courseService.getById(id);
                            if (fetched) {
                                // Map backend structure to frontend structure
                                courseData = {
                                    id: fetched.id.toString(),
                                    title: fetched.title,
                                    code: fetched.code,
                                    level: fetched.level,
                                    department: fetched.department || 'Computing',
                                    duration: fetched.duration,
                                    intakeStatus: fetched.intake_status,
                                    secretary: fetched.secretary_id ? fetched.secretary_id.toString() : '',
                                    coordinator: fetched.coordinator_id ? fetched.coordinator_id.toString() : '',
                                    totalStudents: fetched.max_students || 0,
                                    activeStudents: 0,
                                    batches: [],
                                    createdDate: fetched.created_at || '',
                                    semesters: fetched.semesters?.map((sem: any) => ({
                                        subjects: sem.subjects?.map((sub: any) => ({
                                            code: sub.code || '',
                                            name: sub.name,
                                            credits: sub.credits?.toString() || '3'
                                        })) || [{ code: '', name: '', credits: '' }]
                                    })) || [],
                                    diplomaSubjects: fetched.subjects?.map((sub: any) => ({
                                        code: sub.code || '',
                                        name: sub.name,
                                        credits: sub.credits?.toString() || '3'
                                    })) || []
                                } as any;
                            }
                        } catch (apiErr) {
                            console.error('Failed to fetch course from API:', apiErr);
                        }
                    }

                    if (courseData) {
                        if (userRole === 'coordinator') {
                            const adminName = currentUser.fullName.toLowerCase();
                            const coordName = courseData.coordinator?.toLowerCase() || '';
                            const isAssigned = coordName.includes(adminName) ||
                                adminName.includes(coordName.replace(/^(dr\.|mr\.|mrs\.|ms\.)\s+/i, '')) ||
                                coordName === currentUser.id?.toString() ||
                                (courseData as any).coordinator_id?.toString() === currentUser.id?.toString();
                            if (!isAssigned) {
                                toast.error('You do not have permission to edit this course.');
                                navigate('/admin/courses');
                                return;
                            }
                        }
                        setCourseType(courseData.level as any);
                        const dept = courseData.department || 'Faculty of Computing';
                        setCommonData({
                            name: courseData.title || '',
                            code: courseData.code || '',
                            enrollments: courseData.totalStudents ? courseData.totalStudents.toString() : '',
                            duration: courseData.duration || '3 Years',
                            startDate: '',
                            endDate: '',
                            secretary: courseData.secretary || '',
                            coordinator: courseData.coordinator || '',
                            status: courseData.intakeStatus || 'Open',
                            department: dept
                        });

                        if (FACULTY_OPTIONS.includes(dept)) {
                            setFacultySelect(dept);
                            setCustomFaculty('');
                        } else {
                            setFacultySelect('Other');
                            setCustomFaculty(dept);
                        }

                        if (['Degree', 'Higher National Diploma'].includes(courseData.level)) {
                            const sems = courseData.semesters || [{ subjects: [{ code: '', name: '', credits: '' }] }];
                            setSemesters(sems);
                            setSemesterCount(sems.length);
                        } else if (courseData.level === 'Diploma') {
                            setDiplomaSubjects(courseData.diplomaSubjects && courseData.diplomaSubjects.length > 0 ? courseData.diplomaSubjects : [{ code: '', name: '', credits: '' }]);
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to fetch initial data:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id, isEdit]);

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
        const newSemesters = [...semesters];
        newSemesters[semIndex].subjects.splice(subIndex, 1);
        setSemesters(newSemesters);
    };

    const updateSubject = (semIndex: number, subIndex: number, field: keyof Subject, value: string) => {
        const newSemesters = [...semesters];
        newSemesters[semIndex].subjects[subIndex][field] = value;
        setSemesters(newSemesters);
    };

    const addDiplomaSubject = () => {
        setDiplomaSubjects([...diplomaSubjects, { code: '', name: '', credits: '' }]);
    };

    const updateDiplomaSubject = (index: number, field: keyof Subject, value: string) => {
        const newSubjects = [...diplomaSubjects];
        newSubjects[index][field] = value;
        setDiplomaSubjects(newSubjects);
    };

    const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
        if (e) e.preventDefault();
        setIsLoading(true);

        try {
            // Find category ID based on level
            const category = categories.find(c => c.name === courseType);

            const payload: any = {
                title: commonData.name,
                code: commonData.code,
                level: courseType,
                department: commonData.department || 'CODL',
                duration: commonData.duration,
                intake_status: commonData.status,
                max_students: commonData.enrollments ? parseInt(commonData.enrollments) : null,
                secretary_id: commonData.secretary ? parseInt(commonData.secretary) : null,
                coordinator_id: commonData.coordinator ? parseInt(commonData.coordinator) : null,
                category_id: category ? category.id : null,
            };

            // Structure data based on course level
            if (['Degree', 'Higher National Diploma'].includes(courseType)) {
                payload.semesters = semesters.map((sem, idx) => ({
                    name: `Semester ${idx + 1}`,
                    subjects: sem.subjects.filter(s => s.name).map(s => ({
                        code: s.code || '',
                        name: s.name,
                        credits: s.credits
                    }))
                }));
            } else if (courseType === 'Diploma') {
                payload.subjects = diplomaSubjects.filter(s => s.name).map(s => ({
                    code: s.code || '',
                    name: s.name,
                    credits: s.credits
                }));
            }

            if (isEdit) {
                const isMock = String(id).startsWith('CRS-');
                if (isMock) {
                    const idx = mockAdminCourses.findIndex(c => String(c.id) === String(id));
                    if (idx !== -1) {
                        mockAdminCourses[idx] = {
                            ...mockAdminCourses[idx],
                            title: payload.title,
                            code: payload.code,
                            level: payload.level,
                            department: payload.department,
                            duration: payload.duration,
                            intakeStatus: payload.intake_status,
                            totalStudents: payload.max_students || 0,
                            secretary: payload.secretary_id ? payload.secretary_id.toString() : '',
                            coordinator: payload.coordinator_id ? payload.coordinator_id.toString() : '',
                            semesters: payload.semesters,
                            diplomaSubjects: payload.subjects
                        } as any;
                    }
                } else {
                    await courseService.update(id!, payload);
                }
                toast.success('Course updated successfully!');
            } else {
                await courseService.create(payload);
                toast.success('Course created successfully!');
            }
            navigate(-1);
        } catch (err: any) {
            console.error('Failed to create course:', err);
            const errorMsg = err.response?.data?.message || 'Failed to create course. Please check all fields.';
            toast.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="cm-container">
            <div style={{
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'stretch',
                gap: '8px'
            }}>
                <button className="am-back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                </button>
                <div className="admin-breadcrumb">
                    <span onClick={() => navigate('/admin/courses')}>Course Management</span>
                    <ChevronRight size={14} />
                    <span className="current">{isEdit ? 'Edit Course' : 'Create Course'}</span>
                </div>
            </div>

            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">{isEdit ? 'Edit Course Settings' : 'Create New Course'}</h1>
                    <p className="admin-page-subtitle">
                        {isEdit ? `Modifying settings for ${commonData.name}` : 'Define course structure, subjects, and assign faculty members.'}
                    </p>
                </div>
                <div className="admin-header-actions">
                    <button className="admin-btn-outline" onClick={() => navigate(-1)} disabled={isLoading}>
                        Cancel
                    </button>
                    <button className="admin-btn-primary" onClick={() => handleSubmit()} disabled={isLoading}>
                        <Save size={16} /> {isLoading ? (isEdit ? 'Updating...' : 'Saving...') : (isEdit ? 'Update Course' : 'Save Course')}
                    </button>
                </div>
            </div>

            <form className="create-course-form" onSubmit={handleSubmit}>
                {/* Section 0: Course Category */}
                <div className="form-section-card" style={{ border: '2px solid #7C3AED20', background: '#F5F3FF40' }}>
                    <div className="section-header">
                        <Layers size={20} color="#7C3AED" />
                        <h3 style={{ color: '#7C3AED' }}>Course Category</h3>
                    </div>
                    <div className="cm-form-grid">
                        <div className="cm-form-group full-width">
                            <label>Selection the Program Level</label>
                            <select
                                value={courseType}
                                onChange={(e) => {
                                    const type = e.target.value as any;
                                    setCourseType(type);
                                    // Set default durations
                                    if (type === 'Degree') setCommonData(prev => ({ ...prev, duration: '3 Years' }));
                                    else if (type === 'Higher National Diploma') setCommonData(prev => ({ ...prev, duration: '2 Years' }));
                                    else if (type === 'Diploma') setCommonData(prev => ({ ...prev, duration: '1 Year' }));
                                    else setCommonData(prev => ({ ...prev, duration: '' }));
                                }}
                                className="admin-input-large"
                                disabled={isLoading}
                            >
                                <option value="Degree">Degree Program</option>
                                <option value="Higher National Diploma">Higher National Diploma (HND)</option>
                                <option value="Diploma">Diploma Program</option>
                                <option value="Advance Certificate">Advance Certificate</option>
                                <option value="Certificate">Certificate Program</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Section 1: Basic Information */}
                <div className="form-section-card">
                    <div className="section-header">
                        <BookOpen size={20} />
                        <h3>Course Details</h3>
                    </div>
                    <div className="cm-form-grid">
                        <div className="cm-form-group full-width">
                            <label>Course Name</label>
                            <input type="text" name="name" value={commonData.name} onChange={handleCommonChange} placeholder="e.g. BSc (Hons) in Computer Science" required disabled={isLoading} />
                        </div>
                        <div className="cm-form-group">
                            <label>Course Code</label>
                            <input type="text" name="code" value={commonData.code} onChange={handleCommonChange} placeholder="e.g. BSC-CS" required disabled={isLoading} />
                        </div>
                        <div className="cm-form-group">
                            <label>Max Enrollments</label>
                            <input type="number" name="enrollments" value={commonData.enrollments} onChange={handleCommonChange} placeholder="e.g. 100" disabled={isLoading} />
                        </div>

                        <div className="cm-form-group">
                            <label>Course Duration</label>
                            {['Degree', 'Higher National Diploma', 'Diploma'].includes(courseType) ? (
                                <select
                                    name="duration"
                                    value={commonData.duration}
                                    onChange={handleCommonChange}
                                    disabled={isLoading}
                                >
                                    <option value="1 Year">1 Year</option>
                                    <option value="2 Years">2 Years</option>
                                    <option value="3 Years">3 Years</option>
                                    <option value="4 Years">4 Years</option>
                                </select>
                            ) : (
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="number"
                                        name="duration"
                                        value={commonData.duration.split(' ')[0]}
                                        onChange={(e) => setCommonData({ ...commonData, duration: `${e.target.value} Months` })}
                                        placeholder="e.g. 6"
                                        style={{ paddingRight: '70px' }}
                                        disabled={isLoading}
                                    />
                                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', fontWeight: 600, color: '#64748B' }}>Months</span>
                                </div>
                            )}
                        </div>

                        <div className="cm-form-group">
                            <label>Offered Faculty</label>
                            <select
                                value={facultySelect}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setFacultySelect(val);
                                    if (val !== 'Other') {
                                        setCommonData(prev => ({ ...prev, department: val }));
                                    } else {
                                        setCommonData(prev => ({ ...prev, department: customFaculty }));
                                    }
                                }}
                                disabled={isLoading}
                            >
                                <option value="">Select Faculty</option>
                                {FACULTY_OPTIONS.map(f => (
                                    <option key={f} value={f}>{f}</option>
                                ))}
                                <option value="Other">Other (input manually)</option>
                            </select>
                        </div>

                        {facultySelect === 'Other' && (
                            <div className="cm-form-group">
                                <label>Specify Faculty Name</label>
                                <input
                                    type="text"
                                    value={customFaculty}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setCustomFaculty(val);
                                        setCommonData(prev => ({ ...prev, department: val }));
                                    }}
                                    placeholder="Enter faculty name"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        )}

                        <div className="cm-form-group">
                            <label>Course Secretary</label>
                            <select name="secretary" value={commonData.secretary} onChange={handleCommonChange} disabled={isLoading}>
                                <option value="">Select Secretary</option>
                                {instructors.filter(inst => inst.role === 'secretary').map(inst => (
                                    <option key={inst.id} value={inst.id}>{inst.full_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="cm-form-group">
                            <label>Course Coordinator</label>
                            <select name="coordinator" value={commonData.coordinator} onChange={handleCommonChange} disabled={isLoading || userRole === 'coordinator'}>
                                <option value="">Select Coordinator</option>
                                {instructors.filter(inst => inst.role === 'coordinator').map(inst => (
                                    <option key={inst.id} value={inst.id}>{inst.full_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="cm-form-group">
                            <label>Status</label>
                            <select name="status" value={commonData.status} onChange={handleCommonChange} disabled={isLoading}>
                                <option value="Open">Open</option>
                                <option value="Closed">Closed</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Section 3: Academic Structure (Dynamic) */}
                {!['Certificate', 'Advance Certificate'].includes(courseType) && (
                    <div className="form-section-card">
                        <div className="section-header">
                            <Layers size={20} />
                            <h3>Academic Structure</h3>
                        </div>

                        {(courseType === 'Degree' || courseType === 'Higher National Diploma') && (
                            <div className="degree-structure">
                                <div className="cm-form-group" style={{ maxWidth: '300px', marginBottom: '24px' }}>
                                    <label>Number of Semesters</label>
                                    <select value={semesterCount} onChange={(e) => handleSemesterCountChange(parseInt(e.target.value))} disabled={isLoading}>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                                            <option key={n} value={n}>{n} Semesters</option>
                                        ))}
                                    </select>
                                </div>

                                {semesters.map((sem, semIdx) => (
                                    <div key={semIdx} className="semester-block">
                                        <div className="semester-header">
                                            <h4>Semester {semIdx + 1}</h4>
                                            <button type="button" className="add-sub-btn" onClick={() => addSubject(semIdx)} disabled={isLoading}>
                                                <Plus size={14} /> Add Subject
                                            </button>
                                        </div>
                                        <div className="subject-list">
                                            {sem.subjects.map((sub, subIdx) => (
                                                <div key={subIdx} className="subject-row">
                                                    <div className="cm-form-group no-margin" style={{ width: '150px' }}>
                                                        <input
                                                            type="text"
                                                            placeholder="Subject Code"
                                                            value={sub.code}
                                                            onChange={(e) => updateSubject(semIdx, subIdx, 'code', e.target.value)}
                                                            disabled={isLoading}
                                                        />
                                                    </div>
                                                    <div className="cm-form-group no-margin" style={{ flex: 1 }}>
                                                        <input
                                                            type="text"
                                                            placeholder="Subject Name"
                                                            value={sub.name}
                                                            onChange={(e) => updateSubject(semIdx, subIdx, 'name', e.target.value)}
                                                            disabled={isLoading}
                                                        />
                                                    </div>
                                                    <div className="cm-form-group no-margin" style={{ width: '100px' }}>
                                                        <input
                                                            type="text"
                                                            placeholder="Credits"
                                                            value={sub.credits}
                                                            onChange={(e) => updateSubject(semIdx, subIdx, 'credits', e.target.value)}
                                                            disabled={isLoading}
                                                        />
                                                    </div>
                                                    <button type="button" className="remove-sub-btn" onClick={() => removeSubject(semIdx, subIdx)} disabled={isLoading}>
                                                        <Trash2 size={16} />
                                                    </button>
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
                                    <button type="button" className="add-sub-btn" onClick={addDiplomaSubject} disabled={isLoading}>
                                        <Plus size={14} /> Add Subject
                                    </button>
                                </div>
                                <div className="subject-list">
                                    {diplomaSubjects.map((sub, idx) => (
                                        <div key={idx} className="subject-row">
                                            <div className="cm-form-group no-margin" style={{ width: '150px' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Subject Code"
                                                    value={sub.code}
                                                    onChange={(e) => updateDiplomaSubject(idx, 'code', e.target.value)}
                                                    disabled={isLoading}
                                                />
                                            </div>
                                            <div className="cm-form-group no-margin" style={{ flex: 1 }}>
                                                <input
                                                    type="text"
                                                    placeholder="Subject Name"
                                                    value={sub.name}
                                                    onChange={(e) => updateDiplomaSubject(idx, 'name', e.target.value)}
                                                    disabled={isLoading}
                                                />
                                            </div>
                                            <div className="cm-form-group no-margin" style={{ width: '100px' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Credits"
                                                    value={sub.credits}
                                                    onChange={(e) => updateDiplomaSubject(idx, 'credits', e.target.value)}
                                                    disabled={isLoading}
                                                />
                                            </div>
                                            <button type="button" className="remove-sub-btn" onClick={() => {
                                                const newSubs = [...diplomaSubjects];
                                                newSubs.splice(idx, 1);
                                                setDiplomaSubjects(newSubs);
                                            }} disabled={isLoading}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}


            </form>
        </div>
    );
};
