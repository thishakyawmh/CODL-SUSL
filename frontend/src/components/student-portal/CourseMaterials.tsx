import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowLeft, FileText, Download, Lock, Calendar, BookOpen, Video, FileArchive, ChevronRight, Play } from 'lucide-react';
import { type Course } from './CourseDetails';
import { courseService } from '../../services/apiService';
import './CourseMaterials.css';

interface Material {
    title: string;
    type: 'PDF' | 'Video' | 'ZIP' | 'DOC';
    size: string;
    locked: boolean;
    url?: string;
    link?: string;
}

interface Module {
    id: string;
    code: string;
    title: string;
    materials: Material[];
}

interface Semester {
    id: number;
    name: string;
    modules: Module[];
    visible?: boolean;
}

type ViewState = 'semesters' | 'modules' | 'resources';

export const CourseMaterials: React.FC = () => {
    const navigate = useNavigate();
    const { course } = useOutletContext<{ course: Course }>();

    const [viewState, setViewState] = useState<ViewState>('semesters');
    const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    React.useEffect(() => {
        if (course.type === 'Certification') {
            setSelectedSemesterId(1);
            setSelectedModuleId('materials');
            setViewState('resources');
        }
    }, [course.type]);

    React.useEffect(() => {
        const fetchMaterials = async () => {
            setIsLoading(true);
            try {
                const dbMaterials = await courseService.getCourseMaterials(course.id);

                let totalMatCount = 0;
                if (dbMaterials && Array.isArray(dbMaterials)) {
                    dbMaterials.forEach(sem => {
                        (sem.modules || []).forEach((mod: any) => {
                            totalMatCount += (mod.materials || []).length;
                        });
                    });
                }
                localStorage.setItem(`materials_lastVisited_${course.id}`, Date.now().toString());
                localStorage.setItem(`materials_count_${course.id}`, totalMatCount.toString());

                if (dbMaterials && dbMaterials.length > 0) {
                    setSemesters(dbMaterials);
                } else {

                    let generated: Semester[] = [];
                    if (course.semesters && course.semesters.length > 0) {
                        generated = course.semesters.map((sem, semIdx) => ({
                            id: semIdx + 1,
                            name: sem.name || `Semester 0${semIdx + 1}`,
                            visible: true,
                            modules: (sem.subjects || []).map((sub) => ({
                                id: sub.id.toString(),
                                code: sub.code,
                                title: sub.name,
                                materials: []
                            }))
                        }));
                    } else if (course.subjects && course.subjects.length > 0) {
                        generated = [
                            {
                                id: 1,
                                name: 'Course Materials',
                                visible: true,
                                modules: course.subjects.map((sub) => ({
                                    id: sub.id.toString(),
                                    code: sub.code,
                                    title: sub.name,
                                    materials: []
                                }))
                            }
                        ];
                    } else {
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
                    }
                    setSemesters(generated);
                }
            } catch (err) {
                console.error("Failed to fetch course materials from DB:", err);

                setSemesters([
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
                ]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMaterials();
    }, [course]);

    if (isLoading) {
        return (
            <div className="course-materials-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                <style>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
                <div style={{ textAlign: 'center', color: '#64748B' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid #E2E8F0', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                    <p style={{ fontWeight: 600 }}>Loading course materials...</p>
                </div>
            </div>
        );
    }

    const visibleSemesters = semesters.filter(s => s.visible !== false);
    const activeSemester = visibleSemesters.find(s => s.id === selectedSemesterId) || visibleSemesters[0] || semesters[0];
    const activeModule = activeSemester?.modules.find(m => m.id === selectedModuleId) || null;

    const getFileIcon = (type: Material['type']) => {
        switch (type) {
            case 'PDF': return <FileText size={18} />;
            case 'Video': return <Video size={18} />;
            case 'ZIP': return <FileArchive size={18} />;
            default: return <BookOpen size={18} />;
        }
    };

    const getFileClass = (type: Material['type']) => {
        switch (type) {
            case 'PDF': return 'pdf';
            case 'Video': return 'video';
            case 'ZIP': return 'doc';
            default: return 'doc';
        }
    };

    const handleBack = () => {
        if (viewState === 'resources') {
            if (course.type === 'Certification') {
                navigate(`/course/${course.id}`);
            } else {
                setViewState('modules');
                setSelectedModuleId(null);
            }
        } else if (viewState === 'modules') {
            setViewState('semesters');
            setSelectedSemesterId(null);
        } else {
            navigate(`/course/${course.id}`);
        }
    };

    const selectSemester = (id: number) => {
        setSelectedSemesterId(id);
        setViewState('modules');
    };

    const selectModule = (moduleId: string) => {
        setSelectedModuleId(moduleId);
        setViewState('resources');
    };

    const getBackLabel = () => {
        if (viewState === 'resources') return 'Back';
        if (viewState === 'modules') return 'Back';
        return 'Back';
    };

    const getTitle = () => {
        if (viewState === 'resources' && activeModule) {
            if (course.type === 'Certification') {
                return course.title;
            }
            return `${activeModule.title}`;
        }
        if (viewState === 'modules' && activeSemester) {
            return `${course.title} - ${activeSemester.name}`;
        }
        return course.title;
    };

    return (
        <div className="course-materials-container">
            <div className="portal-navigation-container">
                <button className="back-btn portal-nav-back-btn" onClick={handleBack}>
                    <ArrowLeft size={18} /> Back
                </button>
                <div className="portal-breadcrumbs">
                    <span className="breadcrumb-link" onClick={() => navigate('/dashboard')}>Registered Courses</span>
                    <ChevronRight size={14} className="breadcrumb-separator" />
                    <span className="breadcrumb-link" onClick={() => navigate(`/course/${course.id}`)}>{course.title}</span>
                    <ChevronRight size={14} className="breadcrumb-separator" />
                    <span className="breadcrumb-current">Course Materials</span>
                </div>
            </div>

            <div className="course-details-header">
                <h1 className="course-details-title">{getTitle()}</h1>
                <div className="course-header-labels">
                    <span className="course-code-label">{course.code}</span>
                    <span className={`course-type-label ${course.type.toLowerCase()}`}>{course.type}</span>
                    {viewState === 'resources' && activeModule && (
                        <span className="course-code-label">{activeModule.code}</span>
                    )}
                </div>
            </div>

            {/* VIEW 1: Semester Selection */}
            {viewState === 'semesters' && (
                <div className="semester-selection-view">
                    <span className="section-label">Available Semesters</span>
                    <div className="semester-grid">
                        {visibleSemesters.map((sem) => (
                            <div
                                key={sem.id}
                                className="semester-card"
                                onClick={() => selectSemester(sem.id)}
                            >
                                <div className="sem-header">
                                    <div className="sem-icon-box">
                                        <Calendar size={24} />
                                    </div>
                                </div>
                                <div className="sem-info">
                                    <h3>{sem.name}</h3>
                                    <span className="sem-subjects-count">{sem.modules.length} Modules Available</span>
                                </div>
                                <div className="sem-action-row">
                                    <span className="action-text">Explore</span>
                                    <div className="action-circle">
                                        <ChevronRight size={16} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* VIEW 2: Module List (name, code, resource count) */}
            {viewState === 'modules' && (
                <div className="modules-view">
                    <span className="section-label">{activeSemester.name} — Subjects</span>
                    <div className="modules-list">
                        {activeSemester.modules.map((module) => (
                            <div
                                key={module.id}
                                className="module-list-card"
                                onClick={() => selectModule(module.id)}
                            >
                                <div className="module-list-icon">
                                    <BookOpen size={22} />
                                </div>
                                <div className="module-list-info">
                                    <h3 className="module-list-title">{module.title}</h3>
                                    <span className="module-list-code">{module.code}</span>
                                </div>
                                <div className="module-list-meta">
                                    <span className="module-resource-count">{module.materials.length}</span>
                                    <span className="module-resource-label">Resources</span>
                                </div>
                                <ChevronRight size={20} className="module-list-arrow" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* VIEW 3: Resources for selected module */}
            {viewState === 'resources' && activeModule && (
                <div className="resources-view">
                    {activeModule.materials.length === 0 && (
                        <div style={{ padding: '60px 40px', textAlign: 'center', color: '#94A3B8', border: '2px dashed #E2E8F0', borderRadius: '16px', background: '#F8FAFC' }}>
                            <BookOpen size={48} style={{ opacity: 0.3, marginBottom: '16px', display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
                            <p style={{ fontWeight: 600, fontSize: '15px', color: '#64748B' }}>No course materials uploaded yet.</p>
                        </div>
                    )}
                    {activeModule.materials.filter(m => m.type !== 'Video').length > 0 && (
                        <>
                            <span className="section-label">Downloadable Resources</span>
                            <div className="resources-list">
                                {activeModule.materials.filter(m => m.type !== 'Video').map((material, idx) => (
                                    <div
                                        key={idx}
                                        className={`material-item ${material.locked ? 'locked' : 'clickable'}`}
                                        style={{ opacity: material.locked ? 0.6 : 1, cursor: material.locked ? 'default' : 'pointer' }}
                                        onClick={() => {
                                            if (!material.locked) {
                                                const defaultUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
                                                const url = material.url || material.link || defaultUrl;
                                                window.open(url, '_blank');
                                            }
                                        }}
                                    >
                                        <div className={`file-icon ${getFileClass(material.type)}`}>
                                            {getFileIcon(material.type)}
                                        </div>
                                        <div className="material-info">
                                            <p className="material-title">{material.title}</p>
                                            <p className="material-meta">{material.type} • {material.size}</p>
                                        </div>
                                        {material.locked ? (
                                            <Lock size={16} style={{ color: '#94A3B8' }} />
                                        ) : (
                                            <button className="download-btn" onClick={(e) => { e.stopPropagation(); if (material.url || material.link) { window.open(material.url || material.link, '_blank'); } else { window.open('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '_blank'); } }}>
                                                <Download size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {activeModule.materials.filter(m => m.type === 'Video').length > 0 && (
                        <>
                            <span className="section-label" style={{ marginTop: '32px' }}>Videos & Recordings</span>
                            <div className="resources-list">
                                {activeModule.materials.filter(m => m.type === 'Video').map((material, idx) => (
                                    <div
                                        key={idx}
                                        className={`material-item ${material.locked ? 'locked' : 'clickable'}`}
                                        style={{ opacity: material.locked ? 0.6 : 1, cursor: material.locked ? 'default' : 'pointer' }}
                                        onClick={() => {
                                            if (!material.locked) {
                                                const defaultUrl = 'https://www.w3schools.com/html/mov_bbb.mp4';
                                                const url = material.url || material.link || defaultUrl;
                                                window.open(url, '_blank');
                                            }
                                        }}
                                    >
                                        <div className={`file-icon ${getFileClass(material.type)}`}>
                                            {getFileIcon(material.type)}
                                        </div>
                                        <div className="material-info">
                                            <p className="material-title">{material.title}</p>
                                            <p className="material-meta">{material.type} • {material.size}</p>
                                        </div>
                                        {material.locked ? (
                                            <Lock size={16} style={{ color: '#94A3B8' }} />
                                        ) : (
                                            <button className="download-btn" onClick={(e) => { e.stopPropagation(); if (material.url || material.link) { window.open(material.url || material.link, '_blank'); } else { window.open('https://www.w3schools.com/html/mov_bbb.mp4', '_blank'); } }}>
                                                <Play size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
