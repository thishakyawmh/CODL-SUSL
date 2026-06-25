import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
    ArrowLeft, Save, Trash2, 
    Layers, BookOpen, FileText, X
} from 'lucide-react';
import type { Subject, AdminCourse } from '../../data/mockAdminData';
import { courseService, examService } from '../../services/apiService';
import { toast } from '../../utils/toast';
import './CourseManagement.css';

export const CreateExam: React.FC = () => {
    const { id, examId } = useParams<{ id: string, examId?: string }>();
    const isEditing = !!examId;
    const navigate = useNavigate();
    
    // Course info
    const courseId = id;
    const [course, setCourse] = useState<AdminCourse | null>(null);
    const [isLoadingCourse, setIsLoadingCourse] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (course) return;

        const fetchCourse = async () => {
            try {
                const data = await courseService.getById(courseId!);
                const mapped: AdminCourse = {
                    id: data.id.toString(),
                    title: data.title,
                    code: data.code,
                    level: data.level as AdminCourse['level'],
                    department: data.department || 'CODL',
                    duration: data.duration || '1 Year',
                    intakeStatus: (data.intake_status || 'Open') as 'Open' | 'Closed',
                    secretary: data.secretary?.full_name || null,
                    coordinator: data.coordinator?.full_name || null,
                    totalStudents: data.max_students || 0,
                    activeStudents: 0,
                    batches: [], 
                    createdDate: data.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
                    semesters: data.semesters?.map((sem: any) => ({
                        subjects: sem.subjects?.map((sub: any) => ({
                            code: sub.code || '',
                            name: sub.name,
                            credits: sub.credits?.toString() || '3'
                        })) || []
                    })) || undefined,
                    diplomaSubjects: data.subjects?.map((sub: any) => ({
                        code: sub.code || '',
                        name: sub.name,
                        credits: sub.credits?.toString() || '3'
                    })) || undefined
                };
                setCourse(mapped);
            } catch (err) {
                console.error('Failed to fetch course for exam:', err);
            } finally {
                setIsLoadingCourse(false);
            }
        };
        fetchCourse();
    }, [courseId, course]);

    const [searchParams] = useSearchParams();
    const batchFromUrl = searchParams.get('batch');
    
    const [examType, setExamType] = useState<string>('Semester Exam');
    const [customType, setCustomType] = useState<string>('');
    const [selectedSemester, setSelectedSemester] = useState<number>(0);
    const [examName, setExamName] = useState<string>('');
    const [examDeadline, setExamDeadline] = useState<string>('');
    const [examFee, setExamFee] = useState<string>('2500');
    const [examBatch, setExamBatch] = useState<string>(batchFromUrl || '');
    const [examStatus, setExamStatus] = useState<string>('Registrations are Open');
    const [timetablePath, setTimetablePath] = useState<string>('');
    const [isUploading, setIsUploading] = useState<boolean>(false);
    
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const shouldSkipSubjectsSync = React.useRef(false);

    // Set default batch once course is loaded
    useEffect(() => {
        if (course && !examBatch) {
            setExamBatch(batchFromUrl || course.batches[0] || 'Batch 01');
        }
    }, [course, batchFromUrl, examBatch]);

    // Student selection state (kept to preserve DB assignments when editing/updating)
    const [selectedRegulars, setSelectedRegulars] = useState<string[]>([]);
    const [selectedReattempts, setSelectedReattempts] = useState<string[]>([]);
    const [selectedPostponements, setSelectedPostponements] = useState<string[]>([]);

    // Auto switch status based on deadline
    useEffect(() => {
        if (examDeadline) {
            const today = new Date().toISOString().split('T')[0];
            if (examDeadline < today && examStatus === 'Registrations are Open') {
                setExamStatus('Registrations are Closed');
            } else if (examDeadline >= today && examStatus === 'Registrations are Closed') {
                setExamStatus('Registrations are Open');
            }
        }
    }, [examDeadline]);

    // Load subjects when semester or type changes
    useEffect(() => {
        if (shouldSkipSubjectsSync.current) {
            shouldSkipSubjectsSync.current = false;
            return;
        }
        if (examType !== 'Other') {
            if (course?.semesters) {
                const semData = course.semesters[selectedSemester];
                if (semData) {
                    setSubjects([...semData.subjects]);
                }
            } else if (course?.diplomaSubjects) {
                setSubjects([...course.diplomaSubjects]);
            } else {
                setSubjects([]);
            }
        }
    }, [examType, selectedSemester, course]);

    const handleRemoveSubject = (idx: number) => {
        setSubjects(subjects.filter((_, i) => i !== idx));
    };

    // Load existing exam data if editing
    useEffect(() => {
        if (isEditing && examId) {
            const fetchExam = async () => {
                try {
                    const exams = await examService.getByCourse(id!);
                    const exam = exams.find((e: any) => e.id.toString() === examId.toString());
                    if (exam) {
                        setExamName(exam.title || '');
                        setExamDeadline(exam.deadline || '');
                        setExamFee(exam.fee?.toString() || '2500');
                        if (exam.type === 'Semester Exam' || exam.type === 'Mid Exam' || exam.type === 'Unit Exam' || exam.type === 'Module Exam') {
                            setExamType(exam.type);
                        } else {
                            setExamType('Other');
                            setCustomType(exam.type);
                        }
                        let loadedStatus = exam.status || 'Registrations are Open';
                        if (loadedStatus === 'Open' || loadedStatus === 'Registration Open') {
                            loadedStatus = 'Registrations are Open';
                        } else if (loadedStatus === 'Registration Closed') {
                            loadedStatus = 'Registrations are Closed';
                        } else if (loadedStatus === 'Closed') {
                            loadedStatus = 'Exam Closed';
                        }
                        setExamStatus(loadedStatus);
                        if (exam.batch || exam.batch_name) setExamBatch(exam.batch || exam.batch_name);
                        if (exam.subjects) {
                            shouldSkipSubjectsSync.current = true;
                            setSubjects(exam.subjects);
                        }
                        if (exam.regulars) setSelectedRegulars(exam.regulars);
                        else setSelectedRegulars([]);
                        if (exam.reattempts) setSelectedReattempts(exam.reattempts);
                        if (exam.postponements) setSelectedPostponements(exam.postponements);
                        if (exam.timetable_path || exam.timetablePath) setTimetablePath(exam.timetable_path || exam.timetablePath);
                    }
                } catch (err) {
                    console.error("Failed to load exam details for editing:", err);
                }
            };
            fetchExam();
        }
    }, [isEditing, examId, id, course]);

    const handleCreateExam = async () => {
        if (!examName || (!examDeadline)) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (isSaving) return;
        setIsSaving(true);

        const payload = {
            title: examName,
            deadline: examDeadline,
            date: examDeadline,
            fee: parseFloat(examFee) || 0,
            type: examType === 'Other' ? customType : examType,
            status: examStatus,
            batch_name: examBatch,
            regulars: selectedRegulars,
            reattempts: selectedReattempts,
            postponements: selectedPostponements,
            subjects,
            timetable_path: timetablePath,
            semester: selectedSemester + 1
        };

        try {
            if (isEditing) {
                await examService.update(examId, payload);
                toast.success(`Examination "${examName}" has been successfully updated.`);
            } else {
                await examService.create(id!, payload);
                toast.success(`Examination "${examName}" has been successfully created.`);
            }
            navigate(`/admin/courses/manage/${id}?batch=${encodeURIComponent(examBatch)}&section=exams`);
        } catch (err) {
            console.error("Failed to save exam:", err);
            toast.error("Failed to save exam to database.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoadingCourse) {
        return (
            <div className="cm-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                <div style={{ textAlign: 'center', color: '#64748B' }}>
                    <div style={{ width: '48px', height: '48px', border: '3px solid #E2E8F0', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                    <p style={{ fontWeight: 600 }}>Loading course details...</p>
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
                    <p>The course for this examination could not be found.</p>
                    <button className="admin-btn-primary" style={{ marginTop: '20px' }} onClick={() => navigate('/admin/courses')}>
                        <ArrowLeft size={16} /> Back to Courses
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
        <div className="cm-container">
            <div className="admin-page-header" style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'flex-start' }}>
                <button className="cm-back-btn" onClick={() => navigate(`/admin/courses/manage/${id}?batch=${encodeURIComponent(examBatch)}&section=exams`)} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '10px 18px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                        {isEditing ? 'Update Examination' : 'Create New Examination'}
                    </h1>
                    <p style={{ color: '#64748B', margin: '6px 0 0 0', fontSize: '15px' }}>
                        {course.title} • {course.code} {examBatch && `• ${examBatch}`}
                    </p>
                </div>
            </div>

            <div className="create-course-form" style={{ marginTop: '16px' }}>
                <div className="form-section-card">
                    <div className="section-header">
                        <FileText size={18} />
                        <h3>Examination Details</h3>
                    </div>
                    
                    <div className="cm-form-grid">
                        <div className="cm-form-group full-width">
                            <label>Exam Title</label>
                            <input 
                                type="text" 
                                placeholder="e.g. Final Semester Examination 2026" 
                                className="admin-input"
                                value={examName}
                                onChange={(e) => setExamName(e.target.value)}
                            />
                        </div>
                        
                        <div className="cm-form-group">
                            <label>Examination Type</label>
                            <select 
                                className="admin-input"
                                value={examType}
                                onChange={(e) => setExamType(e.target.value)}
                            >
                                {course.level !== 'Certificate' && course.level !== 'Advance Certificate' && (
                                    <>
                                        <option value="Semester Exam">Semester Exam</option>
                                        <option value="Mid Exam">Mid Exam</option>
                                    </>
                                )}
                                <option value="Course Exam">{course.level === 'Certificate' || course.level === 'Advance Certificate' ? 'Module Exam' : 'Unit Exam'}</option>
                                <option value="Other">Other (Custom)</option>
                            </select>
                        </div>
                        
                        {examType === 'Other' && (
                            <div className="cm-form-group">
                                <label>Custom Type Name</label>
                                <input 
                                    type="text" 
                                    placeholder="Enter exam type..." 
                                    className="admin-input"
                                    value={customType}
                                    onChange={(e) => setCustomType(e.target.value)}
                                />
                            </div>
                        )}

                        {examType !== 'Other' && course.semesters && (
                            <div className="cm-form-group">
                                <label>Target Semester</label>
                                <select 
                                    className="admin-input"
                                    value={selectedSemester}
                                    onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
                                >
                                    {course.semesters.map((_, idx) => (
                                        <option key={idx} value={idx}>Semester {idx + 1}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="cm-form-group">
                            <label>Application Deadline</label>
                            <input 
                                type="date" 
                                className="admin-input"
                                value={examDeadline}
                                onChange={(e) => setExamDeadline(e.target.value)}
                            />
                        </div>

                        <div className="cm-form-group">
                            <label>Examination fee for reattempts, per subject</label>
                            <input 
                                type="number" 
                                className="admin-input"
                                value={examFee}
                                onChange={(e) => setExamFee(e.target.value)}
                            />
                        </div>

                        <div className="cm-form-group">
                            <label>Examination Status</label>
                            <select 
                                className="admin-input"
                                value={examStatus}
                                onChange={(e) => setExamStatus(e.target.value)}
                            >
                                <option value="Registrations are Open">Registrations are Open</option>
                                <option value="Registrations are Closed">Registrations are Closed</option>
                                <option value="Exam Closed">Exam Closed</option>
                            </select>
                        </div>

                        <div className="cm-form-group full-width">
                            <label>Examination Timetable (PDF or Document)</label>
                            <div 
                                style={{ 
                                    border: '2px dashed #E2E8F0', 
                                    padding: '32px', 
                                    borderRadius: '16px', 
                                    background: '#F8FAFC', 
                                    textAlign: 'center',
                                    marginTop: '8px',
                                    transition: 'all 0.2s ease',
                                    cursor: isUploading ? 'not-allowed' : 'pointer',
                                    opacity: isUploading ? 0.7 : 1
                                }}
                                onDragOver={(e) => e.preventDefault()}
                                onClick={() => {
                                    if (isUploading) return;
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = '.pdf,.doc,.docx';
                                    input.onchange = async (e: any) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setIsUploading(true);
                                            toast.info(`Uploading "${file.name}"...`);
                                            try {
                                                const res = await examService.uploadTimetable(file);
                                                setTimetablePath(res.url);
                                                toast.success('Timetable uploaded successfully!');
                                            } catch (err) {
                                                console.error('Failed to upload timetable:', err);
                                                toast.error('Failed to upload timetable.');
                                            } finally {
                                                setIsUploading(false);
                                            }
                                        }
                                    };
                                    input.click();
                                }}
                            >
                                <div style={{ color: '#7C3AED', marginBottom: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {isUploading ? (
                                            <div style={{ width: '28px', height: '28px', border: '3px solid #E2E8F0', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                        ) : (
                                            <FileText size={40} style={{ opacity: 0.6 }} />
                                        )}
                                    </div>
                                </div>
                                {isUploading ? (
                                    <p style={{ margin: 0, fontWeight: 700, color: '#475569' }}>Uploading timetable, please wait...</p>
                                ) : timetablePath ? (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <span style={{ fontWeight: 700, color: '#1E293B' }}>
                                            {timetablePath.includes('/') ? timetablePath.split('/').pop() : timetablePath}
                                        </span>
                                        <button 
                                            style={{ background: 'none', border: 'none', color: '#EF4444', padding: '4px', cursor: 'pointer' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setTimetablePath('');
                                            }}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <p style={{ margin: 0, fontWeight: 700, color: '#475569' }}>Click to upload or drag & drop</p>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94A3B8' }}>Supports .pdf, .doc or .docx (Max 20MB)</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="form-section-card">
                    <div className="section-header">
                        <Layers size={18} />
                        <h3>Subjects Included</h3>
                    </div>

                    {subjects.length > 0 ? (
                        <div style={{ marginTop: '16px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #E2E8F0' }}>
                                        <th style={{ padding: '14px 20px', fontWeight: 700, color: '#475569', width: '150px' }}>Subject Code</th>
                                        <th style={{ padding: '14px 20px', fontWeight: 700, color: '#475569' }}>Subject Name</th>
                                        <th style={{ padding: '14px 20px', fontWeight: 700, color: '#475569', width: '120px', textAlign: 'center' }}>Credits</th>
                                        <th style={{ padding: '14px 20px', fontWeight: 700, color: '#475569', width: '80px', textAlign: 'center' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subjects.map((sub, idx) => (
                                        <tr key={idx} style={{ borderBottom: idx < subjects.length - 1 ? '1px solid #E2E8F0' : 'none', background: '#FFFFFF' }}>
                                            <td style={{ padding: '14px 20px', fontWeight: 700, color: '#64748B' }}>{sub.code || 'N/A'}</td>
                                            <td style={{ padding: '14px 20px', fontWeight: 600, color: '#1E293B' }}>{sub.name || 'Untitled Subject'}</td>
                                            <td style={{ padding: '14px 20px', color: '#475569', fontWeight: 600, textAlign: 'center' }}>{sub.credits} Credits</td>
                                            <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                                                <button 
                                                    type="button"
                                                    title="Remove from this exam"
                                                    onClick={() => handleRemoveSubject(idx)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#EF4444',
                                                        cursor: 'pointer',
                                                        padding: '4px',
                                                        borderRadius: '6px',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        transition: 'all 0.15s ease'
                                                    }}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', background: '#F8FAFC', borderRadius: '20px', border: '1px dashed #E2E8F0', marginTop: '16px' }}>
                            <BookOpen size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
                            <p>No subjects assigned to this exam yet.</p>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '24px' }}>
                    <button className="admin-btn-outline" onClick={() => navigate(`/admin/courses/manage/${id}?batch=${encodeURIComponent(examBatch)}&section=exams`)}>Cancel</button>
                    <button 
                        className="admin-btn-primary" 
                        onClick={handleCreateExam}
                        disabled={isSaving}
                    >
                        <Save size={18} /> {isSaving ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Examination' : 'Create Examination')}
                    </button>
                </div>
            </div>
        </div>
        </>
    );
};
