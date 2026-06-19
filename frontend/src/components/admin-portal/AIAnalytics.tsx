import React, { useState, useEffect } from 'react';
import {
    BarChart3, Lightbulb, ArrowLeft, Sparkles, AlertCircle, ArrowUpRight, 
    BookOpen, Award, FileText, CheckCircle2, ChevronDown, ChevronUp, 
    TrendingUp, Loader2, Download, Info, Layers
} from 'lucide-react';
import { categoryService, courseService, aiAnalysisService } from '../../services/apiService';
import './AIAnalytics.css';

interface Category {
    id: number;
    name: string;
    description: string;
    icon: string;
    color: string;
}

interface Course {
    id: number;
    title: string;
    code: string;
    level: string;
    department: string;
    duration: string;
    category_id: number;
    category?: Category;
    semesters_count?: number;
    subjects_count?: number;
}

interface JobPath {
    name: string;
    matching_percentage: number;
    description: string;
    covered_skills: string[];
    missing_skills: string[];
}

interface SubjectAnalysis {
    name: string;
    code: string;
    usefulness_percentage: number;
    topics_included: string[];
    audited_slides: string[];
    recommendations: string;
}

interface AnalysisResult {
    matching_score: number;
    job_paths: JobPath[];
    subjects: SubjectAnalysis[];
    summary: string;
}

export const AIAnalytics: React.FC = () => {
    // Categories and Courses lists
    const [categories, setCategories] = useState<Category[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loadingFilters, setLoadingFilters] = useState<boolean>(true);

    // Active Selection State
    const [selectedCategoryName, setSelectedCategoryName] = useState<string>('All');
    const [activeCourseId, setActiveCourseId] = useState<number | null>(null);
    const [activeCourse, setActiveCourse] = useState<Course | null>(null);

    // Auditing State
    const [analyzing, setAnalyzing] = useState<boolean>(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [expandedSubjectCode, setExpandedSubjectCode] = useState<string | null>(null);

    // Loading Screen Message Cycler
    const [loadingText, setLoadingText] = useState<string>('Initializing AI curriculum auditor...');

    const loadingSteps = [
        'Connecting to AI Analysis Core...',
        'Scanning academic database for courses and modules...',
        'Aggregating uploaded slides and lecture files from CourseMaterials.tsx...',
        'Parsing filename tags and mapping lecture topics...',
        'Evaluating curriculum content against real-world job descriptors...',
        'Computing alignment percentages for key industry roles...',
        'Structuring curriculum audit suggestions and subject recommendations...'
    ];

    // Fetch initial filter data
    useEffect(() => {
        const fetchFilters = async () => {
            setLoadingFilters(true);
            try {
                const cats = await categoryService.getAll();
                setCategories(cats);
                const crs = await courseService.getAll();
                setCourses(crs);
            } catch (err) {
                console.error('Failed to load filter directories:', err);
            } finally {
                setLoadingFilters(false);
            }
        };
        fetchFilters();
    }, []);

    // Cycle analysis loader texts
    useEffect(() => {
        let timer: any;
        if (analyzing) {
            let step = 0;
            timer = setInterval(() => {
                step = (step + 1) % loadingSteps.length;
                setLoadingText(loadingSteps[step]);
            }, 1800);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [analyzing]);

    // Handle course selection
    const handleSelectCourse = async (course: Course) => {
        setActiveCourseId(course.id);
        setActiveCourse(course);
        setAnalysisResult(null); // Clear previous analysis
        setExpandedSubjectCode(null);
    };

    // Run AI analysis
    const handleRunAnalysis = async () => {
        if (!activeCourseId) return;
        setAnalyzing(true);
        setAnalysisResult(null);
        setExpandedSubjectCode(null);
        setLoadingText('Initializing AI curriculum auditor...');
        try {
            const data = await aiAnalysisService.analyzeCourse(activeCourseId);
            setAnalysisResult(data);
        } catch (err) {
            console.error('Curriculum analysis failed:', err);
            alert('AI Analysis failed. Please check backend log settings or API key limits.');
        } finally {
            setAnalyzing(false);
        }
    };

    // Filter courses based on category tab selection
    const getFilteredCourses = () => {
        if (selectedCategoryName === 'All') return courses;
        return courses.filter(c => {
            // Match category name or category level
            const cLvl = c.level ? c.level.toLowerCase() : '';
            const cCatName = c.category ? c.category.name.toLowerCase() : '';
            const filterLowe = selectedCategoryName.toLowerCase();
            return cLvl === filterLowe || cCatName === filterLowe;
        });
    };

    // Helper to get category color badge
    const getCategoryStyles = (level: string) => {
        const lvl = level.toLowerCase();
        if (lvl === 'degree') return { bg: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE' };
        if (lvl.includes('diploma') || lvl.includes('hnd')) return { bg: '#EEF2FF', color: '#3B82F6', border: '1px solid #DBEAFE' };
        if (lvl.includes('certificate')) return { bg: '#ECFDF5', color: '#10B981', border: '1px solid #D1FAE5' };
        return { bg: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0' };
    };

    // Category Tabs list (curated)
    const categoryTabs = ['All', 'Degree', 'Higher National Diploma', 'Diploma', 'Certificate'];

    return (
        <div className="admin-dashboard">
            {/* Page Header */}
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">AI Curriculum Auditor</h1>
                    <p className="admin-page-subtitle">
                        Analyze program syllabus contents and lecture slides against industrial demands and job paths.
                    </p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="ai-analytics-page">
                {activeCourseId === null ? (
                    /* ── DASHBOARD VIEW: Course listing with filters ── */
                    <div className="courses-dashboard-layout animate-fade-in">
                        {/* Filters Panel */}
                        <div className="filter-navigation-bar">
                            <span className="filter-label">Filter Category:</span>
                            <div className="filter-tabs-row">
                                {categoryTabs.map(tab => (
                                    <button
                                        key={tab}
                                        className={`filter-tab-btn ${selectedCategoryName === tab ? 'active' : ''}`}
                                        onClick={() => setSelectedCategoryName(tab)}
                                    >
                                        {tab === 'All' ? 'All Programs' : tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Courses Grid */}
                        {loadingFilters ? (
                            <div className="loading-state-box">
                                <Loader2 className="spinning-icon" size={32} />
                                <p>Loading academic catalogs...</p>
                            </div>
                        ) : getFilteredCourses().length === 0 ? (
                            <div className="no-courses-card">
                                <AlertCircle size={40} className="info-icon" />
                                <h3>No Courses Found</h3>
                                <p>No programs match the selected category in this semester.</p>
                            </div>
                        ) : (
                            <div className="courses-analytics-grid">
                                {getFilteredCourses().map(course => {
                                    const styles = getCategoryStyles(course.level || course.category?.name || '');
                                    const isCert = (course.level || '').toLowerCase().includes('certificate');
                                    return (
                                        <div key={course.id} className="course-card-premium interactive-card">
                                            <div className="course-card-header">
                                                <span 
                                                    className="category-badge"
                                                    style={{ backgroundColor: styles.bg, color: styles.color, borderColor: styles.border }}
                                                >
                                                    {course.level || course.category?.name || 'Academic'}
                                                </span>
                                                <span className="course-code-tag">{course.code}</span>
                                            </div>

                                            <div className="course-card-body">
                                                <h3 className="course-title-text">{course.title}</h3>
                                                <p className="course-dept-text">{course.department || 'Computing Department'}</p>
                                                
                                                <div className="course-meta-tags-row">
                                                    <span className="meta-tag">
                                                        <TrendingUp size={12} /> {course.duration}
                                                    </span>
                                                    <span className="meta-tag">
                                                        <BookOpen size={12} /> {isCert ? 'Flat Syllabus' : 'Multi-Semester'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="course-card-footer">
                                                <button 
                                                    className="audit-action-btn"
                                                    onClick={() => handleSelectCourse(course)}
                                                >
                                                    Audit Curriculum <ArrowUpRight size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    /* ── AUDIT REPORT VIEW ── */
                    <div className="audit-detail-layout animate-fade-in">
                        {/* Sub-view Nav Back */}
                        <div className="subview-nav-row">
                            <button className="subview-back-btn" onClick={() => { setActiveCourseId(null); setActiveCourse(null); setAnalysisResult(null); }}>
                                <ArrowLeft size={16} /> Back to Programs Dashboard
                            </button>
                        </div>

                        {/* Auditing Course Header */}
                        <div className="program-audit-header-card">
                            <div className="header-info">
                                <span className="header-program-code">{activeCourse?.code}</span>
                                <h2>{activeCourse?.title}</h2>
                                <p>{activeCourse?.department} Department • Duration: {activeCourse?.duration} program</p>
                            </div>
                            
                            {!analyzing && !analysisResult && (
                                <button 
                                    className="purple-btn-analyse animate-pulse-border"
                                    onClick={handleRunAnalysis}
                                >
                                    <Sparkles size={18} /> Analyse with AI
                                </button>
                            )}
                        </div>

                        {/* LOADING OVERLAY SCREEN */}
                        {analyzing && (
                            <div className="ai-loading-overlay-card">
                                <div className="loading-spinner-wrapper">
                                    <div className="outer-pulse-ring"></div>
                                    <div className="inner-pulse-ring"></div>
                                    <Sparkles size={36} className="sparkle-pulse-icon" />
                                </div>
                                <h3>Curriculum Audit in Progress</h3>
                                <p className="loading-subtitle-msg">{loadingText}</p>
                                <div className="loading-step-progressbar">
                                    <div className="progress-fill-infinite"></div>
                                </div>
                            </div>
                        )}

                        {/* EMPTY STATE: PROMPT TO AUDIT */}
                        {!analyzing && !analysisResult && (
                            <div className="empty-audit-state-card">
                                <div className="icon-badge purple">
                                    <Sparkles size={32} />
                                </div>
                                <h3>Launch Artificial Intelligence Audit</h3>
                                <p>
                                    Click the <strong>Analyse with AI</strong> button above. The system will extract the program's syllabus details, subject codes, and all course slides uploaded to <strong>CourseMaterials.tsx</strong> to check alignment against industry job demands.
                                </p>
                                <div className="demo-data-teaser">
                                    <div className="teaser-title">
                                        <Info size={14} /> Pre-audited Industrial Demands Framework:
                                    </div>
                                    <div className="teaser-badges">
                                        <span>Full-Stack Web Dev</span>
                                        <span>AI / ML Engineer</span>
                                        <span>Cloud & DevOps</span>
                                        <span>Cybersecurity</span>
                                        <span>Data Science</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ANALYSIS REPORT DISPLAY */}
                        {!analyzing && analysisResult && (
                            <div className="audit-results-grid">
                                
                                {/* ── LEFT COLUMN: GAUGE & JOB PATH MATCHINGS ── */}
                                <div className="results-left-column">
                                    {/* Overall Score Circle Card */}
                                    <div className="overall-score-premium-card">
                                        <h3>Overall Job Market Readiness</h3>
                                        <div className="gauge-center-wrapper">
                                            <div className="ai-gauge-container large-gauge">
                                                <svg className="ai-gauge-svg" viewBox="0 0 100 100">
                                                    <circle className="ai-gauge-bg" cx="50" cy="50" r="40" />
                                                    <circle 
                                                        className="ai-gauge-fill animate-gauge" 
                                                        cx="50" 
                                                        cy="50" 
                                                        r="40" 
                                                        style={{ 
                                                            strokeDasharray: `${2 * Math.PI * 40}`, 
                                                            strokeDashoffset: `${2 * Math.PI * 40 * (1 - analysisResult.matching_score / 100)}` 
                                                        }} 
                                                    />
                                                </svg>
                                                <div className="ai-gauge-text-overlay">
                                                    <span className="ai-gauge-percentage large-text">{analysisResult.matching_score}%</span>
                                                    <span className="ai-gauge-label">Alignment Index</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Job Paths Match Breakdown */}
                                    <div className="job-paths-alignment-card">
                                        <div className="card-header-icon-title">
                                            <TrendingUp className="header-icon" size={18} />
                                            <h3>Job Paths Coverages</h3>
                                        </div>
                                        <p className="section-intro">
                                            Matching score based on knowledge mapping of syllabus topics and lecture slides:
                                        </p>

                                        <div className="job-paths-list">
                                            {analysisResult.job_paths.map((path, index) => (
                                                <div key={index} className="job-path-item-card">
                                                    <div className="path-header-row">
                                                        <h4>{path.name}</h4>
                                                        <span className="percentage-badge">{path.matching_percentage}% match</span>
                                                    </div>

                                                    <div className="ai-progress-bg">
                                                        <div 
                                                            className="ai-progress-fill" 
                                                            style={{ width: `${path.matching_percentage}%` }}
                                                        ></div>
                                                    </div>

                                                    <p className="path-desc-text">{path.description}</p>

                                                    <div className="skills-clouds-container">
                                                        {path.covered_skills.length > 0 && (
                                                            <div className="skills-group">
                                                                <span className="skills-label covered">Covered:</span>
                                                                <div className="skills-tags">
                                                                    {path.covered_skills.map((s, idx) => (
                                                                        <span key={idx} className="skill-tag covered">{s}</span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {path.missing_skills.length > 0 && (
                                                            <div className="skills-group">
                                                                <span className="skills-label missing">Lacking:</span>
                                                                <div className="skills-tags">
                                                                    {path.missing_skills.map((s, idx) => (
                                                                        <span key={idx} className="skill-tag missing">{s}</span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* ── RIGHT COLUMN: SUMMARY & SUBJECT breakdown ── */}
                                <div className="results-right-column">
                                    {/* AI Executive Summary Card */}
                                    <div className="ai-executive-summary-card">
                                        <div className="summary-header">
                                            <Sparkles size={16} className="summary-icon" />
                                            <h4>AI Curriculum Audit Report</h4>
                                        </div>
                                        <p className="summary-text">{analysisResult.summary}</p>
                                    </div>

                                    {/* Subject usefulness breakdown */}
                                    <div className="subjects-usefulness-card">
                                        <div className="card-header-icon-title">
                                            <BookOpen className="header-icon" size={18} />
                                            <h3>Module Matching & Usefulness</h3>
                                        </div>
                                        <p className="section-intro">
                                            Audited list of subjects. Click a usefulness bar to view slides analyzed and recommendations:
                                        </p>

                                        <div className="subjects-list-vertical">
                                            {analysisResult.subjects.map((sub, index) => {
                                                const isExpanded = expandedSubjectCode === sub.code;
                                                return (
                                                    <div 
                                                        key={index} 
                                                        className={`subject-audit-row ${isExpanded ? 'expanded' : ''}`}
                                                    >
                                                        {/* Header Details */}
                                                        <div className="subject-row-header">
                                                            <div className="sub-title-info">
                                                                <span className="sub-code">{sub.code}</span>
                                                                <h4>{sub.name}</h4>
                                                            </div>
                                                        </div>

                                                        {/* Usefulness progress bar (interactive) */}
                                                        <div 
                                                            className="subject-bar-clickable-area"
                                                            onClick={() => setExpandedSubjectCode(isExpanded ? null : sub.code)}
                                                            title="Click to view details"
                                                        >
                                                            <div className="bar-labels">
                                                                <span>Market Usefulness Index</span>
                                                                <span className="pct-val">{sub.usefulness_percentage}%</span>
                                                            </div>
                                                            <div className="ai-progress-bg usefulness-bar">
                                                                <div 
                                                                    className="ai-progress-fill indigo-fill" 
                                                                    style={{ width: `${sub.usefulness_percentage}%` }}
                                                                ></div>
                                                            </div>
                                                            <div className="click-indicator-hint">
                                                                {isExpanded ? (
                                                                    <span>Collapse Details <ChevronUp size={12} /></span>
                                                                ) : (
                                                                    <span>Analyze Slides & Topics <ChevronDown size={12} /></span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Expanded Topics and Recommendations */}
                                                        {isExpanded && (
                                                            <div className="subject-expanded-content animate-fade-in">
                                                                {/* Included Topics */}
                                                                <div className="audit-detail-block">
                                                                    <h5>Extracted Curriculum Topics:</h5>
                                                                    <div className="topics-list-tags">
                                                                        {sub.topics_included.map((t, idx) => (
                                                                            <span key={idx} className="topic-badge">{t}</span>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                {/* Audited Slides */}
                                                                <div className="audit-detail-block">
                                                                    <h5>Audited Lecture Slides (CourseMaterials.tsx):</h5>
                                                                    {sub.audited_slides.length > 0 ? (
                                                                        <ul className="slides-filenames-list">
                                                                            {sub.audited_slides.map((slide, idx) => (
                                                                                <li key={idx}>
                                                                                    <FileText size={12} className="file-icon" />
                                                                                    <span>{slide}</span>
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    ) : (
                                                                        <div className="no-slides-warning">
                                                                            <AlertCircle size={12} />
                                                                            <span>No materials uploaded by lecturer for this subject.</span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Recommendations */}
                                                                <div className="audit-detail-block recommendation">
                                                                    <h5>Auditor Recommendation:</h5>
                                                                    <p>{sub.recommendations}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    
                                    {/* Action button at the bottom */}
                                    <div className="audit-actions-footer">
                                        <button className="export-report-btn" onClick={() => window.print()}>
                                            <Download size={14} /> Export Curriculum Audit PDF
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
