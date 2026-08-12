import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Sparkles, RefreshCw, BarChart2, ShieldAlert, BookOpen, FileText,
    Database, Plus, ChevronDown, CheckCircle, Download, ArrowLeft,
    TrendingUp, AlertTriangle, Layers, Cloud, Activity, Calendar, Users, Filter,
    GraduationCap, Award, ArrowUpRight, Search, Lightbulb
} from 'lucide-react';
import { aiAnalyticsService, courseService } from '../../services/apiService';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
// @ts-ignore
import SriLankaMapData from '@svg-maps/sri-lanka';
import './AIAnalytics.css';

interface Course {
    id: string;
    title: string;
    code: string;
    level: string;
    department: string;
    duration?: string;
    max_students?: number;
    created_at?: string;
    batches_count?: number;
}

export const AIAnalytics: React.FC = () => {
    const navigate = useNavigate();
    const [programs, setPrograms] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [globalEmergingTech, setGlobalEmergingTech] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'hub' | 'course'>('hub');
    const [levelFilter, setLevelFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const [syncing, setSyncing] = useState(false);
    const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
    const [studentCount, setStudentCount] = useState<number>(0);
    const [industryCount, setIndustryCount] = useState<number>(0);



    const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info' }[]>([]);
    const toastIdRef = React.useRef(0);


    const [confirmModal, setConfirmModal] = useState<{ open: boolean; onConfirm: () => void }>({ open: false, onConfirm: () => { } });

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        const id = ++toastIdRef.current;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    };

    const dismissToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    useEffect(() => {
        fetchPrograms();
    }, []);

    const fetchPrograms = async () => {
        setLoading(true);
        try {
            const data = await aiAnalyticsService.getPrograms();
            if (data && data.programs) {
                setPrograms(data.programs);
                setStudentCount(data.student_count || 0);
                setIndustryCount(data.industry_count || 0);
            } else if (Array.isArray(data)) {
                setPrograms(data);
            }

            const globalData = await aiAnalyticsService.getGlobalOverview().catch(() => null);
            if (globalData) {
                if (globalData.emerging_technologies) {
                    setGlobalEmergingTech(globalData.emerging_technologies);
                }
                if (globalData.last_sync_at) {
                    setLastSyncedAt(globalData.last_sync_at);
                }
                if (globalData.student_count) {
                    setStudentCount(globalData.student_count);
                }
                if (globalData.industry_count) {
                    setIndustryCount(globalData.industry_count);
                }
            }
        } catch (err) {
            console.error('Failed to load programs', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDirectSync = async () => {
        setConfirmModal({
            open: true,
            onConfirm: async () => {
                setConfirmModal({ open: false, onConfirm: () => { } });
                setSyncing(true);
                try {
                    const res = await aiAnalyticsService.syncGoogleSheet();
                    showToast(res.message || "Google Sheets sync completed successfully!", 'success');

                    fetchPrograms();
                } catch (err: any) {
                    showToast('Google Sheets Sync Failed: ' + (err.response?.data?.error || err.response?.data?.message || err.message), 'error');
                } finally {
                    setSyncing(false);
                }
            }
        });
    };

    if (loading) {
        return (
            <>
                { }
                <div className="toast-container">
                    {toasts.map(toast => (
                        <div key={toast.id} className={`toast-notification toast-${toast.type}`} onClick={() => dismissToast(toast.id)}>
                            <div className="toast-icon-wrap">
                                {toast.type === 'success' && <CheckCircle size={20} />}
                                {toast.type === 'error' && <AlertTriangle size={20} />}
                                {toast.type === 'info' && <Activity size={20} />}
                            </div>
                            <span className="toast-message">{toast.message}</span>
                            <button className="toast-dismiss" onClick={(e) => { e.stopPropagation(); dismissToast(toast.id); }}>&times;</button>
                        </div>
                    ))}
                </div>
                <div className="loading-spinner-container">
                    <div className="loading-spinner"></div>
                    <p>Loading AI Analytics...</p>
                </div>
            </>
        );
    }

    return (
        <div className="ai-analytics-page">
            { }
            {syncing && (
                <div className="sync-overlay">
                    <div className="sync-overlay-content">
                        <div className="sync-overlay-spinner">
                            <div className="sync-pulse-ring"></div>
                            <div className="sync-pulse-ring delay-1"></div>
                            <div className="sync-pulse-ring delay-2"></div>
                            <Cloud size={36} className="sync-overlay-icon" />
                        </div>
                        <h2 className="sync-overlay-title">Syncing Data</h2>
                        <p className="sync-overlay-desc">Downloading surveys from Google Sheets and running the AI matching pipeline. This may take few minutes.</p>
                        <div className="sync-progress-bar">
                            <div className="sync-progress-bar-fill"></div>
                        </div>
                        <span className="sync-overlay-hint">Please do not close this page.</span>
                    </div>
                </div>
            )}

            { }
            {confirmModal.open && (
                <div className="confirm-modal-backdrop" onClick={() => setConfirmModal({ open: false, onConfirm: () => { } })}>
                    <div className="confirm-modal-card" onClick={e => e.stopPropagation()}>
                        <div className="confirm-modal-icon-wrap">
                            <RefreshCw size={28} />
                        </div>
                        <h3 className="confirm-modal-title">Run Full Sync?</h3>
                        <p className="confirm-modal-desc">
                            This will download the latest Student and Industry survey sheets from Google Sheets, update local databases, and run the AI matching algorithms. The process may take few minutes.
                        </p>
                        <div className="confirm-modal-actions">
                            <button className="confirm-modal-btn cancel" onClick={() => setConfirmModal({ open: false, onConfirm: () => { } })}>Cancel</button>
                            <button className="confirm-modal-btn confirm" onClick={confirmModal.onConfirm}>
                                <RefreshCw size={16} /> Yes, Sync Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            { }
            <div className="toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast-notification toast-${toast.type}`} onClick={() => dismissToast(toast.id)}>
                        <div className="toast-icon-wrap">
                            {toast.type === 'success' && <CheckCircle size={20} />}
                            {toast.type === 'error' && <AlertTriangle size={20} />}
                            {toast.type === 'info' && <Activity size={20} />}
                        </div>
                        <span className="toast-message">{toast.message}</span>
                        <button className="toast-dismiss" onClick={(e) => { e.stopPropagation(); dismissToast(toast.id); }}>&times;</button>
                    </div>
                ))}
            </div>

            {viewMode === 'course' && selectedCourse ? (
                <ProgramDashboard course={selectedCourse} onBack={() => { setSelectedCourse(null); setViewMode('hub'); }} />
            ) : (
                <ProgramHub
                    programs={programs}
                    globalEmergingTech={globalEmergingTech}
                    onSelect={(c) => { setSelectedCourse(c); setViewMode('course'); }}
                    onOpenSync={handleDirectSync}
                    onOpenManageForms={() => navigate('/admin/ai-analytics/manage-forms')}
                    syncing={syncing}
                    lastSyncedAt={lastSyncedAt}
                    studentCount={studentCount}
                    industryCount={industryCount}
                    levelFilter={levelFilter}
                    setLevelFilter={setLevelFilter}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                />
            )}
        </div>
    );
};




const ProgramHub: React.FC<{
    programs: Course[],
    globalEmergingTech: string[],
    onSelect: (c: Course) => void,
    onOpenSync: () => void,
    onOpenManageForms: () => void,
    syncing?: boolean,
    lastSyncedAt?: string | null,
    studentCount: number,
    industryCount: number,
    levelFilter: string,
    setLevelFilter: (val: string) => void,
    searchTerm: string,
    setSearchTerm: (val: string) => void,
}> = ({
    programs,
    globalEmergingTech,
    onSelect,
    onOpenSync,
    onOpenManageForms,
    syncing,
    lastSyncedAt,
    studentCount,
    industryCount,
    levelFilter,
    setLevelFilter,
    searchTerm,
    setSearchTerm
}) => {

        const categories = [
            {
                name: 'Degree',
                desc: '4-Year Academic Programs',
                icon: GraduationCap,
                color: '#7C3AED',
                filter: (p: Course) => p.level.toLowerCase().includes('degree')
            },
            {
                name: 'Higher National Diploma',
                desc: 'Advanced Professional Diplomas',
                icon: Layers,
                color: '#F59E0B',
                filter: (p: Course) => p.level.toLowerCase().includes('higher national') || p.level.toLowerCase().includes('hnd')
            },
            {
                name: 'Diploma',
                desc: '1-2 Year Specialized Courses',
                icon: BookOpen,
                color: '#3B82F6',
                filter: (p: Course) => p.level.toLowerCase().includes('diploma') && !p.level.toLowerCase().includes('higher national') && !p.level.toLowerCase().includes('hnd')
            },
            {
                name: 'Advanced Certificate',
                desc: 'Intermediate Level Certifications',
                icon: Award,
                color: '#EC4899',
                filter: (p: Course) => p.level.toLowerCase().includes('advanced certificate')
            },
            {
                name: 'Certificate',
                desc: 'Short-term Skill Programs',
                icon: Award,
                color: '#10B981',
                filter: (p: Course) => p.level.toLowerCase().includes('certificate') && !p.level.toLowerCase().includes('advanced')
            }
        ];

        const getCount = (name: string) => {
            const cat = categories.find(c => c.name === name);
            if (!cat) return 0;
            return programs.filter(cat.filter).length;
        };

        const filteredPrograms = programs.filter(p => {
            const matchesSearch = !searchTerm ||
                p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.department.toLowerCase().includes(searchTerm.toLowerCase());

            if (levelFilter === 'all' || levelFilter === 'categories_hub') {
                return matchesSearch;
            } else {
                const activeCat = categories.find(c => c.name === levelFilter);
                return matchesSearch && (activeCat ? activeCat.filter(p) : true);
            }
        });

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

        const formatDate = (dateString?: string) => {
            if (!dateString) return 'Not Available';
            try {
                const d = new Date(dateString);
                if (isNaN(d.getTime())) return 'Not Available';
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            } catch (e) {
                return 'Not Available';
            }
        };

        return (
            <div className="programs-hub-container" style={{ padding: '0' }}>
                { }
                <div className="admin-page-header">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        {(levelFilter !== 'all' || searchTerm !== '') && (
                            <button
                                className="cm-back-text-btn"
                                onClick={() => {
                                    if (levelFilter !== 'categories_hub' && levelFilter !== 'all' && !searchTerm) {
                                        setLevelFilter('categories_hub');
                                    } else {
                                        setLevelFilter('all');
                                        setSearchTerm('');
                                    }
                                }}
                            >
                                <ArrowLeft size={18} /> Back
                            </button>
                        )}
                        <h1 className="admin-page-title">
                            {searchTerm
                                ? `Search Results for "${searchTerm}"`
                                : levelFilter === 'categories_hub'
                                    ? "Programme-wise Analysis"
                                    : levelFilter !== 'all'
                                        ? `${levelFilter} Programs`
                                        : "AI Analytics Workspace"
                            }
                        </h1>
                        <p className="admin-page-subtitle">
                            {searchTerm
                                ? "Explore and analyze our educational program categories."
                                : levelFilter === 'categories_hub'
                                    ? "Explore curriculum alignment, technology gaps, and AI recommendations by qualification level."
                                    : levelFilter !== 'all'
                                        ? `Explore and analyze course alignments under ${levelFilter} category.`
                                        : "Analyze curriculum alignment against student interest surveys and industry capability audits."
                            }
                        </p>
                    </div>
                    {levelFilter === 'all' && !searchTerm && (
                        <div className="admin-header-actions" style={{ gap: '12px' }}>
                            <span className="last-sync-badge" style={{ fontSize: '0.85rem', color: '#64748B', display: 'flex', alignItems: 'center', backgroundColor: '#F1F5F9', padding: '6px 12px', borderRadius: '6px', fontWeight: 500 }}>
                                Last Sync: {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never Synced'}
                            </span>
                            <button className="admin-btn-outline" onClick={onOpenManageForms}>
                                <Database size={16} /> Manage Forms
                            </button>
                            <button className="admin-btn-primary" onClick={onOpenSync} disabled={syncing}>
                                <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Syncing...' : 'Sync'}
                            </button>
                        </div>
                    )}
                </div>

                { }
                {levelFilter !== 'all' && (
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
                )}

                { }
                {levelFilter === 'all' && !searchTerm && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div className="ai-chart-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px 24px', margin: 0, borderLeft: '6px solid #7C3AED', background: '#FFFFFF', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.015)', borderRadius: '16px' }}>
                            <div style={{ backgroundColor: '#F3E8FF', color: '#7C3AED', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Users size={28} />
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Student Interests Analyzed</span>
                                <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#0F172A', margin: '4px 0 0 0', lineHeight: 1 }}>{studentCount}</h2>
                            </div>
                        </div>

                        <div className="ai-chart-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px 24px', margin: 0, borderLeft: '6px solid #10B981', background: '#FFFFFF', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.015)', borderRadius: '16px' }}>
                            <div style={{ backgroundColor: '#D1FAE5', color: '#10B981', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Award size={28} />
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Industry Audits Analyzed</span>
                                <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#0F172A', margin: '4px 0 0 0', lineHeight: 1 }}>{industryCount}</h2>
                            </div>
                        </div>

                        <div
                            className="programme-analysis-btn"
                            onClick={() => setLevelFilter('categories_hub')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '20px 24px',
                                margin: 0,
                                background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                                boxShadow: '0 4px 20px rgba(124, 58, 237, 0.3)',
                                borderRadius: '16px',
                                cursor: 'pointer',
                                transition: 'all 0.25s ease',
                                border: 'none',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#FFFFFF', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <GraduationCap size={28} />
                                </div>
                                <div>
                                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Programme-wise Analysis</span>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Explore by qualification level</p>
                                </div>
                            </div>
                            <ArrowUpRight size={18} style={{ color: '#FFFFFF' }} />
                        </div>
                    </div>
                )}

                {levelFilter === 'all' && !searchTerm && (
                    <>
                        { }
                        <div style={{ marginBottom: '32px' }}>
                            <InteractiveSriLankaMap />
                        </div>

                        { }
                        <div style={{ marginBottom: '32px' }}>
                            <UniversityOpportunitiesChart />
                        </div>
                    </>
                )}
                {levelFilter === 'categories_hub' && !searchTerm ? (

                    <div className="cm-categories-grid" style={{ margin: 0, padding: 0, boxShadow: 'none', border: 'none', background: 'transparent' }}>
                        {categories.map(cat => {
                            const count = getCount(cat.name);
                            return (
                                <div key={cat.name} className="cm-category-card" onClick={() => setLevelFilter(cat.name)}>
                                    <div className="cm-category-icon" style={{ background: `${cat.color}15`, color: cat.color }}>
                                        <cat.icon size={28} />
                                    </div>
                                    <h3>{cat.name}</h3>
                                    <p>{cat.desc}</p>
                                    <div className="cm-category-stats">
                                        <span>{count} Course{count !== 1 ? 's' : ''}</span>
                                        <ArrowUpRight size={14} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : levelFilter !== 'all' ? (

                    <>
                        <div className="cm-grid">
                            {filteredPrograms.map(p => {
                                const levelStyle = getLevelColor(p.level);
                                return (
                                    <div className="cm-course-card" key={p.id}>
                                        <div className="cmc-header">
                                            <span className="cmc-level" style={{ background: levelStyle.bg, color: levelStyle.text }}>
                                                {p.level}
                                            </span>
                                        </div>

                                        <h3 className="cmc-title" title={p.title}>{p.title}</h3>
                                        <p className="cmc-code">{p.code} • {p.department}</p>

                                        <div className="cmc-stats">
                                            <div className="cmc-stat">
                                                <Calendar size={14} />
                                                <span>{formatDate(p.created_at)}</span>
                                            </div>
                                            <div className="cmc-stat">
                                                <Calendar size={14} />
                                                <span>{p.duration || 'Not Available'}</span>
                                            </div>
                                            <div className="cmc-stat">
                                                <Award size={14} />
                                                <span>{p.batches_count !== undefined && p.batches_count !== null ? `${p.batches_count} batch${p.batches_count !== 1 ? 'es' : ''}` : 'Not Available'}</span>
                                            </div>
                                        </div>

                                        <div className="cmc-grid-actions">
                                            <button className="cmc-btn-manage big" onClick={() => onSelect(p)}>
                                                <Sparkles size={16} /> Analyze
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {filteredPrograms.length === 0 && (
                            <div className="cm-empty">
                                <BookOpen size={48} />
                                <p>No courses match your criteria</p>
                            </div>
                        )}
                    </>
                ) : null}

            </div>
        );
    };


const formatLastUpdated = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).replace(',', ' -');
    } catch {
        return dateStr;
    }
};

const ProgramDashboard: React.FC<{ course: Course, onBack: () => void }> = ({ course, onBack }) => {
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState<any>(null);
    const [studentData, setStudentData] = useState<any>(null);
    const [industryData, setIndustryData] = useState<any>(null);
    const [skillGap, setSkillGap] = useState<any>(null);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [emergingTech, setEmergingTech] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'insights' | 'recommendations' | 'curriculum'>('insights');
    const [fullCourseData, setFullCourseData] = useState<any>(null);
    const [academicEntry, setAcademicEntry] = useState<any>(null);

    const handleDownloadPDF = async () => {
        if (!overview) return;
        try {
            const doc = new jsPDF('p', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 20;
            let y = margin;

            const checkPageOverflow = (heightNeeded: number) => {
                if (y + heightNeeded > pageHeight - margin) {
                    doc.addPage();
                    y = margin;
                }
            };

            const addText = (text: string, x: number, style?: { fontSize?: number, fontStyle?: string, color?: string }) => {
                if (style?.fontSize) doc.setFontSize(style.fontSize);
                if (style?.fontStyle) doc.setFont('helvetica', style.fontStyle);
                else doc.setFont('helvetica', 'normal');

                if (style?.color) {
                    if (style.color === 'purple') doc.setTextColor(124, 58, 237);
                    else if (style.color === 'red') doc.setTextColor(239, 68, 68);
                    else if (style.color === 'orange') doc.setTextColor(217, 119, 6);
                    else if (style.color === 'gray') doc.setTextColor(100, 116, 139);
                    else doc.setTextColor(15, 23, 42);
                } else {
                    doc.setTextColor(15, 23, 42);
                }

                doc.text(text, x, y);
            };


            addText('ACADEMIC CURRICULUM ALIGNMENT REPORT', margin, { fontSize: 16, fontStyle: 'bold', color: 'purple' });
            y += 10;

            doc.setDrawColor(226, 232, 240);
            doc.line(margin, y, pageWidth - margin, y);
            y += 10;

            addText(`Program Name: ${course.title || 'N/A'}`, margin, { fontSize: 13, fontStyle: 'bold' });
            y += 8;
            addText(`Department: ${course.department || 'N/A'}`, margin, { fontSize: 11, fontStyle: 'normal' });
            y += 6;
            addText(`Code: ${fullCourseData?.code || course.code || 'N/A'}`, margin, { fontSize: 11, fontStyle: 'normal' });
            y += 6;
            addText(`Report Generated: ${new Date().toLocaleDateString()}`, margin, { fontSize: 9, fontStyle: 'normal', color: 'gray' });
            y += 12;

            addText('I. EXECUTIVE KPI SUMMARY', margin, { fontSize: 12, fontStyle: 'bold', color: 'purple' });
            y += 8;

            const covText = overview.coverage_percent !== null ? `${overview.coverage_percent}%` : 'N/A';
            const studText = overview.kpis?.studentMatch !== null ? `${overview.kpis.studentMatch}%` : 'N/A';
            const indText = overview.kpis?.industryMatch !== null ? `${overview.kpis.industryMatch}%` : 'N/A';

            addText(`Curriculum Coverage: ${covText}`, margin + 5, { fontSize: 10, fontStyle: 'bold' });
            y += 6;
            addText(`Student Demand Alignment: ${studText}`, margin + 5, { fontSize: 10, fontStyle: 'bold' });
            y += 6;
            addText(`Industry Requirement Match: ${indText}`, margin + 5, { fontSize: 10, fontStyle: 'bold' });
            y += 12;

            addText('II. CURRICULUM & DELIVERY INSIGHTS', margin, { fontSize: 12, fontStyle: 'bold', color: 'purple' });
            y += 8;

            checkPageOverflow(25);
            addText('Missing Core Subjects:', margin + 5, { fontSize: 10, fontStyle: 'bold' });
            y += 5;
            if (overview.missing_subjects && overview.missing_subjects.length > 0) {
                overview.missing_subjects.forEach((sub: any) => {
                    checkPageOverflow(15);
                    const name = typeof sub === 'string' ? sub : (sub.name || 'N/A');
                    const classification = typeof sub === 'string' ? '' : ` (${sub.classification || ''})`;
                    const combinedPct = typeof sub === 'string' ? '' : ` - ${sub.combined_pct || 0}% Combined Score`;

                    addText(`- ${name}${classification}${combinedPct}`, margin + 10, { fontSize: 9.5, fontStyle: 'bold' });
                    y += 5;

                    if (typeof sub === 'object' && sub !== null && sub.explanation) {
                        checkPageOverflow(15);
                        const splitExplanation = doc.splitTextToSize(`Insight: ${sub.explanation}`, pageWidth - margin * 2 - 20);
                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(9);
                        doc.setTextColor(100, 116, 139);
                        doc.text(splitExplanation, margin + 15, y);
                        y += (splitExplanation.length * 4.5) + 3;
                    }
                });
            } else {
                addText('None', margin + 10, { fontSize: 9.5, fontStyle: 'normal' });
                y += 5;
            }

            checkPageOverflow(25);
            addText('Curriculum Anomalies:', margin + 5, { fontSize: 10, fontStyle: 'bold' });
            y += 5;
            let anomaliesFound = false;
            if (overview.outdated_subjects && overview.outdated_subjects.length > 0) {
                overview.outdated_subjects.forEach((anomaly: any) => {
                    checkPageOverflow(15);
                    const subject = anomaly.affected_subject || (anomaly.code ? `${anomaly.code} ${anomaly.name}` : 'N/A');
                    const type = anomaly.anomaly_type || 'Legacy Technology Warning';
                    const exp = anomaly.explanation || '';
                    const color = type === 'Curriculum Modernization' ? 'red' : 'gray';

                    addText(`- ${type}: ${subject}`, margin + 10, { fontSize: 9, fontStyle: 'bold', color });
                    y += 5;
                    if (exp) {
                        checkPageOverflow(12);
                        const splitExp = doc.splitTextToSize(exp, pageWidth - margin * 2 - 20);
                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(8.5);
                        doc.setTextColor(100, 116, 139);
                        doc.text(splitExp, margin + 15, y);
                        y += (splitExp.length * 4.5) + 3;
                    }
                    anomaliesFound = true;
                });
            }
            if (overview.low_demand_subjects && overview.low_demand_subjects.length > 0) {
                overview.low_demand_subjects.forEach((sub: any) => {
                    checkPageOverflow(12);
                    const code = sub.code || '';
                    const name = sub.name || '';
                    const reason = sub.reason || sub.explanation || 'Less than 5% demand';
                    addText(`- Low Demand Subject: ${code} ${name} (${reason})`, margin + 10, { fontSize: 9, fontStyle: 'normal', color: 'gray' });
                    y += 5;
                    anomaliesFound = true;
                });
            }
            if (!anomaliesFound) {
                addText('- No curriculum anomalies or legacy warning subjects detected.', margin + 10, { fontSize: 9, fontStyle: 'normal' });
                y += 5;
            }
            y += 4;

            checkPageOverflow(25);
            addText(`Preferred Learning Delivery Split:`, margin + 5, { fontSize: 10, fontStyle: 'bold' });
            y += 7;

            const theory = overview.learning_preferences_data?.student_theory_percent || 0;
            const practical = overview.learning_preferences_data?.student_practical_percent || 0;


            addText(`Theory: ${theory}%`, margin + 10, { fontSize: 9, fontStyle: 'bold' });
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.text(`Practical: ${practical}%`, margin + 110, y, { align: 'right' });
            y += 3;


            const totalBarWidth = 100;
            const barHeight = 5;
            const theoryWidth = (theory / 100) * totalBarWidth;
            const practicalWidth = (practical / 100) * totalBarWidth;


            doc.setFillColor(241, 245, 249);
            doc.rect(margin + 10, y, totalBarWidth, barHeight, 'F');


            if (theoryWidth > 0) {
                doc.setFillColor(192, 132, 252);
                doc.rect(margin + 10, y, theoryWidth, barHeight, 'F');
            }


            if (practicalWidth > 0) {
                doc.setFillColor(124, 58, 237);
                doc.rect(margin + 10 + theoryWidth, y, practicalWidth, barHeight, 'F');
            }

            y += barHeight + 8;

            checkPageOverflow(30);
            addText('Student Preferred Learning Methods:', margin + 5, { fontSize: 10, fontStyle: 'bold' });
            y += 7;
            if (overview.learning_preferences_data?.student_methods && overview.learning_preferences_data?.student_methods.length > 0) {
                overview.learning_preferences_data.student_methods.forEach((m: any) => {
                    checkPageOverflow(15);
                    addText(`${m.name}: ${m.value}%`, margin + 10, { fontSize: 9 });
                    y += 4;


                    doc.setFillColor(241, 245, 249);
                    doc.rect(margin + 10, y, 90, 2, 'F');
                    doc.setFillColor(124, 58, 237);
                    doc.rect(margin + 10, y, (m.value / 100) * 90, 2, 'F');
                    y += 6;
                });
            } else {
                addText('Insufficient student preference records.', margin + 10, { fontSize: 9, color: 'gray' });
                y += 5;
            }


            doc.addPage();
            y = margin;

            addText('III. STUDENT & JOB MARKET ALIGNMENT INSIGHTS', margin, { fontSize: 14, fontStyle: 'bold', color: 'purple' });
            y += 10;

            checkPageOverflow(30);
            addText('Top Student Fields of Demand (Survey Results):', margin + 5, { fontSize: 10, fontStyle: 'bold' });
            y += 7;
            if (studentData && studentData.length > 0) {
                studentData.slice(0, 6).forEach((item: any) => {
                    checkPageOverflow(15);
                    addText(`${item.name}: ${item.value}%`, margin + 10, { fontSize: 9 });
                    y += 4;

                    doc.setFillColor(241, 245, 249);
                    doc.rect(margin + 10, y, 90, 2, 'F');
                    doc.setFillColor(124, 58, 237);
                    doc.rect(margin + 10, y, (item.value / 100) * 90, 2, 'F');
                    y += 6;
                });
            } else {
                addText('Insufficient student survey data points.', margin + 10, { fontSize: 9, color: 'gray' });
                y += 5;
            }
            y += 4;

            checkPageOverflow(30);
            addText('Top Job Market Technology Requirements (Employer Gaps):', margin + 5, { fontSize: 10, fontStyle: 'bold' });
            y += 7;
            if (industryData && industryData.length > 0) {
                industryData.slice(0, 6).forEach((item: any) => {
                    checkPageOverflow(15);
                    addText(`${item.name}: ${item.value}%`, margin + 10, { fontSize: 9 });
                    y += 4;

                    doc.setFillColor(241, 245, 249);
                    doc.rect(margin + 10, y, 90, 2, 'F');
                    doc.setFillColor(79, 70, 229);
                    doc.rect(margin + 10, y, (item.value / 100) * 90, 2, 'F');
                    y += 6;
                });
            } else {
                addText('Insufficient industry demand data points.', margin + 10, { fontSize: 9, color: 'gray' });
                y += 5;
            }
            y += 4;

            checkPageOverflow(25);
            addText('Graduate Skill Shortages (Employer Reported Deficits):', margin + 5, { fontSize: 10, fontStyle: 'bold' });
            y += 7;
            if (skillGap && skillGap.missing_skills && skillGap.missing_skills.length > 0) {
                const skillText = skillGap.missing_skills.join(', ');
                const splitSkills = doc.splitTextToSize(skillText, pageWidth - margin * 2 - 15);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.text(splitSkills, margin + 10, y);
                y += (splitSkills.length * 5) + 4;
            } else {
                addText('No graduate capability deficits reported by industry.', margin + 10, { fontSize: 9 });
                y += 5;
            }
            y += 4;

            checkPageOverflow(30);
            addText('Industry Expected Practices (Employer Request Rates):', margin + 5, { fontSize: 10, fontStyle: 'bold' });
            y += 7;
            if (overview.learning_preferences_data?.industry_practices && overview.learning_preferences_data?.industry_practices.length > 0) {
                overview.learning_preferences_data.industry_practices.forEach((item: any) => {
                    checkPageOverflow(15);
                    addText(`${item.name}: ${item.value}% expected practice rate`, margin + 10, { fontSize: 9 });
                    y += 4;

                    doc.setFillColor(241, 245, 249);
                    doc.rect(margin + 10, y, 90, 2, 'F');
                    doc.setFillColor(79, 70, 229);
                    doc.rect(margin + 10, y, (item.value / 100) * 90, 2, 'F');
                    y += 6;
                });
            } else {
                addText('Insufficient employer practice details.', margin + 10, { fontSize: 9, color: 'gray' });
                y += 5;
            }


            doc.addPage();
            y = margin;

            addText('IV. ACADEMIC ENTRY REQUIREMENTS EVIDENCE', margin, { fontSize: 14, fontStyle: 'bold', color: 'purple' });
            y += 10;

            if (academicEntry && academicEntry.accepted_industry_count > 0) {
                addText(`Relevant Employers: ${academicEntry.accepted_industry_count}`, margin + 5, { fontSize: 10, fontStyle: 'bold' });
                y += 6;
                addText(`Education Specified Rate: ${academicEntry.education_requirement_count}/${academicEntry.accepted_industry_count} employers`, margin + 5, { fontSize: 10 });
                y += 6;
                addText(`GPA/Result Specified Rate: ${academicEntry.result_requirement_count}/${academicEntry.accepted_industry_count} employers`, margin + 5, { fontSize: 10 });
                y += 10;

                checkPageOverflow(30);
                addText('Minimum Education Required (Employer Distribution):', margin + 5, { fontSize: 10, fontStyle: 'bold' });
                y += 7;
                if (academicEntry.education_distribution && academicEntry.education_distribution.length > 0) {
                    academicEntry.education_distribution.forEach((item: any) => {
                        checkPageOverflow(15);
                        addText(`${item.label}: ${item.percentage}% (${item.count} response${item.count !== 1 ? 's' : ''})`, margin + 10, { fontSize: 9 });
                        y += 4;

                        doc.setFillColor(241, 245, 249);
                        doc.rect(margin + 10, y, 90, 2, 'F');
                        doc.setFillColor(5, 150, 105);
                        doc.rect(margin + 10, y, (item.percentage / 100) * 90, 2, 'F');
                        y += 6;
                    });
                } else {
                    addText('No education requirement distribution data.', margin + 10, { fontSize: 9, color: 'gray' });
                    y += 5;
                }
                y += 4;

                checkPageOverflow(30);
                addText('Minimum Expected GPA / Result Class (Employer Distribution):', margin + 5, { fontSize: 10, fontStyle: 'bold' });
                y += 7;
                if (academicEntry.result_distribution && academicEntry.result_distribution.length > 0) {
                    academicEntry.result_distribution.forEach((item: any) => {
                        checkPageOverflow(15);
                        addText(`${item.label}: ${item.percentage}% (${item.count} response${item.count !== 1 ? 's' : ''})`, margin + 10, { fontSize: 9 });
                        y += 4;

                        doc.setFillColor(241, 245, 249);
                        doc.rect(margin + 10, y, 90, 2, 'F');
                        doc.setFillColor(3, 105, 161);
                        doc.rect(margin + 10, y, (item.percentage / 100) * 90, 2, 'F');
                        y += 6;
                    });
                } else {
                    addText('No GPA/Result requirement distribution data.', margin + 10, { fontSize: 9, color: 'gray' });
                    y += 5;
                }
            } else {
                addText('No academic entry requirements data from industry surveys.', margin + 5, { fontSize: 10, color: 'gray' });
                y += 5;
            }

            y += 4;


            doc.addPage();
            y = margin;

            addText('V. AI ACTIONABLE RECOMMENDATIONS', margin, { fontSize: 14, fontStyle: 'bold', color: 'purple' });
            y += 10;

            if (!recommendations || recommendations.length === 0) {
                addText('Optimal Alignment - No recommendations or curriculum adjustments required.', margin + 5, { fontSize: 10, fontStyle: 'bold' });
                y += 6;
            } else {
                recommendations.forEach((rec, idx) => {
                    checkPageOverflow(46);

                    doc.setDrawColor(226, 232, 240);
                    doc.rect(margin, y, pageWidth - margin * 2, 34);

                    if (rec.priority === 'Critical') doc.setFillColor(239, 68, 68);
                    else if (rec.priority === 'High') doc.setFillColor(245, 158, 11);
                    else doc.setFillColor(59, 130, 246);
                    doc.rect(margin, y, 2.5, 34, 'F');


                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(10);
                    doc.setTextColor(15, 23, 42);
                    doc.text(`${rec.priority} Priority: ${rec.title}`, margin + 6, y + 5);


                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(9);
                    doc.setTextColor(71, 85, 105);
                    const descText = `Insight: ${rec.description}`;
                    const splitDesc = doc.splitTextToSize(descText, pageWidth - margin * 2 - 12);
                    doc.text(splitDesc, margin + 6, y + 11);


                    doc.setFont('helvetica', 'bold');
                    doc.text(`Impact: ${rec.impact}`, margin + 6, y + 23);


                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(8.5);
                    doc.setTextColor(148, 163, 184);
                    doc.text(`Evidence Source: ${rec.evidence_source}`, margin + 6, y + 29);

                    y += 39;
                });
            }


            doc.addPage();
            y = margin;

            addText('VI. EXISTING CURRICULUM STRUCTURE', margin, { fontSize: 14, fontStyle: 'bold', color: 'purple' });
            y += 10;

            if (fullCourseData?.semesters && fullCourseData.semesters.length > 0) {
                fullCourseData.semesters.forEach((sem: any) => {
                    checkPageOverflow(35);

                    addText(sem.name, margin + 5, { fontSize: 11, fontStyle: 'bold', color: 'purple' });
                    y += 6;

                    if (sem.subjects && sem.subjects.length > 0) {

                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(8.5);
                        doc.setTextColor(100, 116, 139);
                        doc.text('CODE', margin + 10, y);
                        doc.text('SUBJECT NAME', margin + 35, y);
                        doc.text('CREDITS', pageWidth - margin - 25, y);
                        y += 4;
                        doc.setDrawColor(241, 245, 249);
                        doc.line(margin + 10, y, pageWidth - margin - 10, y);
                        y += 5;


                        sem.subjects.forEach((sub: any) => {
                            checkPageOverflow(8);
                            doc.setFont('helvetica', 'normal');
                            doc.setFontSize(9.5);
                            doc.setTextColor(51, 65, 85);

                            doc.text(sub.code || '', margin + 10, y);
                            doc.text(sub.name || '', margin + 35, y);
                            doc.text(`${sub.credits} Credits`, pageWidth - margin - 25, y);
                            y += 5;
                        });
                        y += 4;
                    } else {
                        addText('No subjects defined for this semester.', margin + 10, { fontSize: 9, color: 'gray' });
                        y += 5;
                    }
                    y += 4;
                });
            } else if (fullCourseData?.subjects && fullCourseData.subjects.length > 0) {
                checkPageOverflow(25);
                addText('Curriculum Subjects', margin + 5, { fontSize: 11, fontStyle: 'bold', color: 'purple' });
                y += 6;


                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8.5);
                doc.setTextColor(100, 116, 139);
                doc.text('CODE', margin + 10, y);
                doc.text('SUBJECT NAME', margin + 35, y);
                doc.text('CREDITS', pageWidth - margin - 25, y);
                y += 4;
                doc.setDrawColor(241, 245, 249);
                doc.line(margin + 10, y, pageWidth - margin - 10, y);
                y += 5;


                fullCourseData.subjects.forEach((sub: any) => {
                    checkPageOverflow(8);
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(9.5);
                    doc.setTextColor(51, 65, 85);

                    doc.text(sub.code || '', margin + 10, y);
                    doc.text(sub.name || '', margin + 35, y);
                    doc.text(`${sub.credits} Credits`, pageWidth - margin - 25, y);
                    y += 5;
                });
            } else {
                addText('No subjects defined in the current curriculum.', margin + 5, { fontSize: 10, fontStyle: 'bold' });
                y += 5;
            }

            doc.save(`AI_Analytics_${fullCourseData?.code || course.code || 'Course'}_Report.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
        }
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const [ov, st, ind, gap, rec, tech, fullCourse, acEntry] = await Promise.all([
                    aiAnalyticsService.getOverview(course.id).catch(() => null),
                    aiAnalyticsService.getStudentInterest(course.id).catch(() => null),
                    aiAnalyticsService.getIndustryGap(course.id).catch(() => null),
                    aiAnalyticsService.getSkillGap(course.id).catch(() => null),
                    aiAnalyticsService.getRecommendations(course.id).catch(() => []),
                    aiAnalyticsService.getEmergingTechnologies(course.id).catch(() => []),
                    courseService.getById(course.id).catch(() => null),
                    aiAnalyticsService.getAcademicEntryRequirements(course.id).catch(() => null)
                ]);

                setOverview(ov);
                setStudentData(st);
                setIndustryData(ind);
                setSkillGap(gap);
                setRecommendations(rec || []);
                setEmergingTech(tech || []);
                setFullCourseData(fullCourse);
                setAcademicEntry(acEntry);
            } catch (err) {
                console.error("Error loading program dashboard", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [course.id]);

    if (loading) {
        return (
            <div className="loading-spinner-container">
                <div className="loading-spinner"></div>
                <p>Analyzing Semantic Data for {course.title}...</p>
            </div>
        );
    }

    if (!overview || Object.keys(overview).length === 0 || !overview.kpis || overview.kpis.evidence_status === 'insufficient' || overview.kpis.surveys === 0) {
        return (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <button
                    className="cm-back-text-btn"
                    onClick={onBack}
                    style={{ marginBottom: '24px' }}
                >
                    <ArrowLeft size={16} /> Back to Programs
                </button>
                <div className="card-empty-state">
                    <Database size={54} style={{ color: '#94A3B8', marginBottom: '16px' }} />
                    <h3>No AI Analytics Generated Yet</h3>
                    <p>There is no synchronized survey data matching the academic scope of <strong>{course.title}</strong>.</p>
                    <p>Please return to the hub and sync the Google Sheets data.</p>
                </div>
            </div>
        );
    }

    return (
        <div id="ai-analytics-report-content" className="space-y-8 pb-10" style={{ animation: 'fadeIn 0.3s ease' }}>
            { }
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6" style={{ paddingBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ width: '100%' }}>
                    <button
                        className="cm-back-text-btn pdf-hide"
                        onClick={onBack}
                        style={{ marginBottom: '16px' }}
                    >
                        <ArrowLeft size={16} /> Back
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '16px' }}>
                        <h1 className="admin-page-title" style={{ margin: 0 }}>{course.title}</h1>
                        <button
                            className="pdf-hide"
                            onClick={handleDownloadPDF}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: '#7C3AED',
                                color: '#FFFFFF',
                                border: 'none',
                                padding: '10px 18px',
                                borderRadius: '12px',
                                fontWeight: 700,
                                fontSize: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#6D28D9';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#7C3AED';
                            }}
                        >
                            <Download size={16} />
                            <span>Download Report</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                        {course.code && course.code.trim() && <span className="code-badge">{course.code}</span>}
                        <span className="text-slate-500 text-sm" style={{ fontWeight: 600 }}>{course.department}</span>
                        <span className="text-slate-400 text-xs" style={{ marginLeft: '8px' }}>| Last Updated: {formatLastUpdated(overview.last_generated)}</span>
                    </div>
                </div>
            </div>
            { }
            <div
                className="pdf-hide"
                style={{
                    display: 'flex',
                    borderBottom: '2px solid #E2E8F0',
                    marginBottom: '32px',
                    gap: '12px',
                    width: '100%',
                    paddingBottom: '0'
                }}
            >
                <button
                    className={`tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
                    style={{
                        padding: '12px 20px',
                        fontSize: '15px',
                        fontWeight: 700,
                        border: 'none',
                        borderBottom: activeTab === 'insights' ? '3px solid #7C3AED' : '3px solid transparent',
                        backgroundColor: activeTab === 'insights' ? '#F3E8FF' : 'transparent',
                        color: activeTab === 'insights' ? '#7C3AED' : '#64748B',
                        borderRadius: '12px 12px 0 0',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontFamily: 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '-2px'
                    }}
                    onClick={() => setActiveTab('insights')}
                >
                    <TrendingUp size={18} />
                    <span>AI Insights</span>
                </button>
                <button
                    className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
                    style={{
                        padding: '12px 20px',
                        fontSize: '15px',
                        fontWeight: 700,
                        border: 'none',
                        borderBottom: activeTab === 'recommendations' ? '3px solid #7C3AED' : '3px solid transparent',
                        backgroundColor: activeTab === 'recommendations' ? '#F3E8FF' : 'transparent',
                        color: activeTab === 'recommendations' ? '#7C3AED' : '#64748B',
                        borderRadius: '12px 12px 0 0',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontFamily: 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '-2px'
                    }}
                    onClick={() => setActiveTab('recommendations')}
                >
                    <Sparkles size={18} />
                    <span>AI Recommendations</span>
                    {recommendations && recommendations.length > 0 && (
                        <span
                            style={{
                                padding: '2px 8px',
                                background: activeTab === 'recommendations' ? '#7C3AED' : '#E2E8F0',
                                color: activeTab === 'recommendations' ? '#FFFFFF' : '#475569',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 800,
                                marginLeft: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: '20px',
                                height: '18px'
                            }}
                        >
                            {recommendations.length}
                        </span>
                    )}
                </button>
                <button
                    className={`tab-btn ${activeTab === 'curriculum' ? 'active' : ''}`}
                    style={{
                        padding: '12px 20px',
                        fontSize: '15px',
                        fontWeight: 700,
                        border: 'none',
                        borderBottom: activeTab === 'curriculum' ? '3px solid #7C3AED' : '3px solid transparent',
                        backgroundColor: activeTab === 'curriculum' ? '#F3E8FF' : 'transparent',
                        color: activeTab === 'curriculum' ? '#7C3AED' : '#64748B',
                        borderRadius: '12px 12px 0 0',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontFamily: 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '-2px'
                    }}
                    onClick={() => setActiveTab('curriculum')}
                >
                    <BookOpen size={18} />
                    <span>Existing Curriculum</span>
                </button>
            </div>

            { }
            <div className="pdf-insights-section" style={{ display: activeTab === 'insights' ? 'flex' : 'none', flexDirection: 'column', gap: '36px' }}>
                <h3 className="pdf-only-title" style={{ display: 'none', fontSize: '20px', fontWeight: 800, color: '#1E293B', borderBottom: '2px solid #E2E8F0', paddingBottom: '8px', marginBottom: '24px', marginTop: '24px' }}>I. AI Analytics & Survey Insights</h3>

                { }
                <div className="category-section" style={{ background: '#FAF5FF50', border: '1px solid #7C3AED10', padding: '28px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(124, 58, 237, 0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ backgroundColor: '#F3E8FF', color: '#7C3AED', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <BookOpen size={20} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#4C1D95', margin: 0 }}>Curriculum & Delivery Insights</h3>
                                <p style={{ fontSize: '13px', color: '#6B21A8', margin: '2px 0 0 0', fontWeight: 500 }}>Analysis of curriculum scope, subject coverage, delivery split, and curriculum anomalies</p>

                                {overview.kpis && (
                                    <div style={{
                                        backgroundColor: overview.kpis.evidence_status === 'insufficient' ? '#FEE2E2' : '#EFF6FF',
                                        color: overview.kpis.evidence_status === 'insufficient' ? '#991B1B' : '#1E40AF',
                                        border: overview.kpis.evidence_status === 'insufficient' ? '1px solid #FCA5A5' : '1px solid #BFDBFE',
                                        padding: '8px 14px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        marginTop: '10px',
                                        width: 'fit-content'
                                    }}>
                                        <span>📢</span>
                                        <span>
                                            {overview.kpis.evidence_status === 'insufficient'
                                                ? `Insufficient program-specific evidence. Only ${overview.kpis.student_count || 0} relevant student responses and ${overview.kpis.industry_count || 0} relevant industry responses were found.`
                                                : `Analysis based on ${overview.kpis.student_count || 0} relevant student responses and ${overview.kpis.industry_count || 0} relevant industry responses. Overall Confidence: ${overview.kpis.confidence || 'High'}.`}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        { }
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', backgroundColor: '#F3E8FF70', padding: '10px 18px', borderRadius: '16px', border: '1px solid #7C3AED15' }}>
                            <span style={{ fontSize: '24px', fontWeight: 800, color: '#7C3AED', lineHeight: 1.1 }}>{overview.coverage_percent !== null ? `${overview.coverage_percent}%` : 'N/A'}</span>
                            <span style={{ fontSize: '12px', fontWeight: 500, color: '#6B21A8', marginTop: '4px' }}>Curriculum Coverage</span>
                        </div>
                    </div>

                    {overview.kpis?.curriculum_status === 'insufficient' ? (
                        <div style={{
                            backgroundColor: '#F8FAFC',
                            border: '1px dashed #CBD5E1',
                            padding: '40px 24px',
                            borderRadius: '20px',
                            textAlign: 'center',
                            marginTop: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '16px'
                        }}>
                            <div style={{
                                backgroundColor: '#F1F5F9',
                                color: '#64748B',
                                padding: '16px',
                                borderRadius: '50%',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <AlertTriangle size={32} />
                            </div>
                            <div>
                                <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', margin: '0 0 8px 0' }}>Curriculum Analysis Unavailable</h4>
                                <p style={{ fontSize: '14px', color: '#64748B', margin: '0 auto', maxWidth: '540px', lineHeight: '1.5' }}>
                                    This program does not currently have curriculum data available. Add the program's curriculum subjects to enable AI-powered curriculum gap and anomaly analysis.
                                </p>
                            </div>
                            <div style={{
                                display: 'flex',
                                gap: '24px',
                                background: '#FFFFFF',
                                border: '1px solid #E2E8F0',
                                padding: '16px 28px',
                                borderRadius: '16px',
                                fontSize: '13px',
                                color: '#475569',
                                fontWeight: 500,
                                textAlign: 'left',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94A3B8', fontWeight: 700 }}>Curriculum Status</span>
                                    <strong style={{ color: '#EF4444' }}>Not Available</strong>
                                </div>
                                <div style={{ width: '1px', backgroundColor: '#E2E8F0' }}></div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94A3B8', fontWeight: 700 }}>Curriculum Insights</span>
                                    <strong style={{ color: '#EF4444' }}>Unavailable</strong>
                                </div>
                                <div style={{ width: '1px', backgroundColor: '#E2E8F0' }}></div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94A3B8', fontWeight: 700 }}>Reason</span>
                                    <strong style={{ color: '#475569' }}>No verified subject data</strong>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                            {/* Potential Curriculum Gaps */}
                            <div className="ai-chart-card" style={{ borderLeft: '5px solid #7C3AED', margin: 0 }}>
                                <h4 className="flex items-center gap-2 text-violet-700 font-bold" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                    <ShieldAlert size={18} className="text-violet-500" /> Potential Curriculum Gaps
                                </h4>
                                <p className="text-slate-400 text-xs mb-4" style={{ margin: '0 0 16px 0', fontSize: '12px', fontWeight: 500 }}>Evidence-based analysis of curriculum gaps, enhancements and industry trends.</p>
                                {overview.missing_subjects && overview.missing_subjects.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {overview.missing_subjects.map((sub: any, idx: number) => {
                                            // Determine styles dynamically based on classification
                                            let cardBg = '#F8FAFC';
                                            let cardBorder = '#E2E8F0';
                                            let textTheme = '#475569';
                                            let badgeBg = '#E2E8F0';

                                            if (sub.classification === 'Core Curriculum Gap') {
                                                cardBg = '#FEF2F2';
                                                cardBorder = '#FCA5A5';
                                                textTheme = '#B91C1C';
                                                badgeBg = '#FEE2E2';
                                            } else if (sub.classification === 'Curriculum Enhancement') {
                                                cardBg = '#F5F3FF';
                                                cardBorder = '#C084FC';
                                                textTheme = '#6D28D9';
                                                badgeBg = '#EDE9FE';
                                            } else if (sub.classification === 'Emerging / Industry Technology Trend') {
                                                cardBg = '#F0F9FF';
                                                cardBorder = '#7DD3FC';
                                                textTheme = '#0369A1';
                                                badgeBg = '#E0F2FE';
                                            }

                                            return (
                                                <div key={idx} style={{
                                                    backgroundColor: cardBg,
                                                    border: `1px solid ${cardBorder}`,
                                                    padding: '16px 20px',
                                                    borderRadius: '20px',
                                                    fontSize: '13px',
                                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.01)',
                                                    transition: 'all 0.2s ease'
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                            <strong style={{ color: '#1E293B', fontSize: '15px' }}>{sub.name}</strong>
                                                            <span style={{
                                                                backgroundColor: badgeBg,
                                                                color: textTheme,
                                                                padding: '3px 10px',
                                                                borderRadius: '8px',
                                                                fontWeight: 700,
                                                                fontSize: '11px'
                                                            }}>
                                                                {sub.classification}
                                                            </span>
                                                        </div>
                                                        <span style={{
                                                            backgroundColor: '#7C3AED15',
                                                            color: '#7C3AED',
                                                            padding: '4px 10px',
                                                            borderRadius: '10px',
                                                            fontWeight: 800,
                                                            fontSize: '12px'
                                                        }}>
                                                            {sub.combined_pct}% Combined Score
                                                        </span>
                                                    </div>

                                                    <p style={{ margin: '0 0 12px 0', color: '#334155', fontSize: '13px', lineHeight: '1.4' }}>
                                                        {sub.explanation}
                                                    </p>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(0,0,0,0.04)', paddingTop: '10px', fontSize: '11.5px', color: '#64748B' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                                                            <span>🏢 Industry: <strong>{sub.relevant_industry_responses}/{sub.total_industry_responses} ({sub.industry_pct}%)</strong></span>
                                                            <span>🎓 Student: <strong>{sub.relevant_student_responses}/{sub.total_student_responses} ({sub.student_pct}%)</strong></span>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', color: '#475569' }}>
                                                            <span>📖 Curriculum: <strong style={{ color: sub.curriculum_coverage_status === 'Not Covered' ? '#EF4444' : '#10B981' }}>{sub.curriculum_coverage_status}</strong></span>
                                                            <span>⚡ Confidence: <strong>{sub.evidence_confidence}</strong></span>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                                                            {sub.evidence_sources && sub.evidence_sources.map((src: string, i: number) => (
                                                                <span key={i} style={{ backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', color: '#475569', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 600 }}>{src}</span>
                                                            ))}
                                                        </div>
                                                        <div style={{ marginTop: '4px' }}>
                                                            🔑 Skills: <strong style={{ color: '#475569' }}>{sub.skills.join(', ')}</strong>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', padding: '16px', borderRadius: '12px' }}>
                                        <CheckCircle size={20} />
                                        <span className="text-sm font-semibold">All required technology domains are covered by the curriculum.</span>
                                    </div>
                                )}
                            </div>

                            {/* Curriculum Anomalies */}
                            <div className="ai-chart-card" style={{ borderLeft: '5px solid #F59E0B', margin: 0 }}>
                                <h4 className="flex items-center gap-2 text-amber-700 font-bold" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                    <AlertTriangle size={18} className="text-amber-500" /> Curriculum Anomalies
                                </h4>
                                <p className="text-slate-400 text-xs mb-4" style={{ margin: '0 0 16px 0', fontSize: '12px', fontWeight: 500 }}>Low demand, legacy warning, or skill coverage gap indicators.</p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {overview.outdated_subjects && overview.outdated_subjects.length > 0 ? (
                                        overview.outdated_subjects.map((anomaly: any, idx: number) => {
                                            // Determine alert color based on category
                                            let bgColor = '#FFFBEB';
                                            let borderColor = '#FDE68A';
                                            let textColor = '#B45309';
                                            let typeColor = '#D97706';

                                            if (anomaly.anomaly_type === 'Curriculum Modernization') {
                                                bgColor = '#FEF2F2';
                                                borderColor = '#FEE2E2';
                                                textColor = '#991B1B';
                                                typeColor = '#EF4444';
                                            } else if (anomaly.anomaly_type === 'Low Observed Demand') {
                                                bgColor = '#F8FAFC';
                                                borderColor = '#E2E8F0';
                                                textColor = '#334155';
                                                typeColor = '#64748B';
                                            }

                                            return (
                                                <div key={idx} style={{
                                                    backgroundColor: bgColor,
                                                    border: `1px solid ${borderColor}`,
                                                    padding: '14px 18px',
                                                    borderRadius: '16px',
                                                    fontSize: '13px'
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                        <strong style={{ color: textColor, fontSize: '13px' }}>{anomaly.affected_subject}</strong>
                                                        <span style={{
                                                            backgroundColor: `${typeColor}15`,
                                                            color: typeColor,
                                                            padding: '2px 8px',
                                                            borderRadius: '8px',
                                                            fontWeight: 700,
                                                            fontSize: '10.5px'
                                                        }}>
                                                            {anomaly.anomaly_type}
                                                        </span>
                                                    </div>
                                                    <p style={{ margin: '0 0 8px 0', color: '#475569', fontSize: '12.5px' }}>{anomaly.explanation}</p>
                                                    <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#64748B' }}>
                                                        <span>📊 Combined relevance: <strong>{anomaly.combined_evidence}%</strong></span>
                                                        <span>🔑 Key domains: <strong>{anomaly.supporting_evidence.join(', ')}</strong></span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', padding: '16px', borderRadius: '12px' }}>
                                            <CheckCircle size={20} />
                                            <span className="text-sm font-semibold">No legacy or low-demand anomalies found in current subjects.</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Theory vs Practical Split */}
                            <div className="ai-chart-card" style={{ margin: 0 }}>
                                <h4>Theory vs Practical Split</h4>
                                <p className="text-slate-400 text-xs mb-4" style={{ margin: '0 0 16px 0', fontSize: '12px', fontWeight: 500 }}>Student preference ratio derived from survey responses.</p>

                                {(() => {
                                    const theory = overview.learning_preferences_data?.student_theory_percent || 0;
                                    const practical = overview.learning_preferences_data?.student_practical_percent || 0;

                                    return (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                                            {/* Horizontal Split Bar */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, color: '#475569' }}>
                                                    <span>Theory ({theory}%)</span>
                                                    <span>Practical ({practical}%)</span>
                                                </div>
                                                <div style={{ width: '100%', height: '24px', borderRadius: '12px', display: 'flex', overflow: 'hidden', backgroundColor: '#F1F5F9', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' }}>
                                                    {theory > 0 && (
                                                        <div style={{ width: `${theory}%`, backgroundColor: '#C084FC', height: '100%', transition: 'all 0.5s ease' }} />
                                                    )}
                                                    {practical > 0 && (
                                                        <div style={{ width: `${practical}%`, backgroundColor: '#7C3AED', height: '100%', transition: 'all 0.5s ease' }} />
                                                    )}
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', width: '100%', marginTop: '10px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                                                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#C084FC', display: 'inline-block' }}></span>
                                                    <span style={{ color: '#475569', fontWeight: 600 }}>Theory:</span>
                                                    <span style={{ fontWeight: 800, color: '#1E293B' }}>{theory}%</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                                                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#7C3AED', display: 'inline-block' }}></span>
                                                    <span style={{ color: '#475569', fontWeight: 600 }}>Practical:</span>
                                                    <span style={{ fontWeight: 800, color: '#1E293B' }}>{practical}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                                {/* Preferred Learning & Training Methods */}
                                <div className="ai-chart-card" style={{ marginTop: '20px' }}>
                                    <h4>Preferred Learning & Training Methods</h4>
                                    <p className="text-slate-400 text-xs mb-4" style={{ margin: '0 0 16px 0', fontSize: '12px', fontWeight: 500 }}>Teaching and training modes preferred by applicants and employers ranked by weighted overall demand (70% Industry / 30% Student).</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
                                        {(() => {
                                            const studentMethods = overview.learning_preferences_data?.student_methods || [];
                                            const industryPractices = overview.learning_preferences_data?.industry_practices || [];

                                            const methodMap: Record<string, { student: number; industry: number }> = {};

                                            studentMethods.forEach((m: any) => {
                                                const name = m.name;
                                                if (!methodMap[name]) {
                                                    methodMap[name] = { student: 0, industry: 0 };
                                                }
                                                methodMap[name].student = m.value;
                                            });

                                            industryPractices.forEach((p: any) => {
                                                const name = p.name;
                                                if (!methodMap[name]) {
                                                    methodMap[name] = { student: 0, industry: 0 };
                                                }
                                                methodMap[name].industry = p.value;
                                            });

                                            const combinedMethods = Object.keys(methodMap).map(name => {
                                                const { student, industry } = methodMap[name];
                                                const overallVal = Math.round((industry * 0.70) + (student * 0.30));
                                                const studentMatch = studentMethods.find((m: any) => m.name === name);
                                                const alignmentLevel = studentMatch?.alignment_level || (overallVal >= 15 ? 'High' : (overallVal >= 8 ? 'Medium' : 'Low'));

                                                return {
                                                    name,
                                                    studentVal: student,
                                                    industryVal: industry,
                                                    overallVal,
                                                    alignment_level: alignmentLevel
                                                };
                                            });

                                            const topMethods = combinedMethods
                                                .sort((a, b) => b.overallVal - a.overallVal)
                                                .slice(0, 4);

                                            if (topMethods.length === 0) {
                                                return <div className="text-center text-slate-400 py-6 text-sm">Insufficient data points.</div>;
                                            }

                                            return topMethods.map((item: any, idx: number) => (
                                                <div key={idx} style={{
                                                    borderBottom: '1px solid #F1F5F9',
                                                    paddingBottom: '12px',
                                                    fontSize: '13px'
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                        <span style={{ fontWeight: 700, color: '#1E293B' }}>{item.name}</span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ fontWeight: 800, color: '#7C3AED' }}>{item.overallVal}% Overall Demand</span>
                                                            <span style={{
                                                                backgroundColor: item.alignment_level === 'High' ? '#DCFCE7' : (item.alignment_level === 'Medium' ? '#FEF3C7' : '#F1F5F9'),
                                                                color: item.alignment_level === 'High' ? '#15803D' : (item.alignment_level === 'Medium' ? '#B45309' : '#475569'),
                                                                padding: '2px 6px',
                                                                borderRadius: '6px',
                                                                fontSize: '10px',
                                                                fontWeight: 700
                                                            }}>
                                                                {item.alignment_level} Alignment
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="bar-bg" style={{ height: '8px', backgroundColor: '#F3F4F6', borderRadius: '4px', margin: '4px 0 0 0' }}>
                                                        <div className="bar-fill purple" style={{ width: `${item.overallVal}%`, height: '100%', backgroundColor: '#8B5CF6', borderRadius: '4px' }}></div>
                                                    </div>
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                </div>                            </div>
                        </div>
                    )}
                </div>


                {/* Category 3: Industry & Market Requirements */}
                <div className="category-section" style={{ background: '#ECFDF550', border: '1px solid #05966910', padding: '28px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(5, 150, 105, 0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ backgroundColor: '#D1FAE5', color: '#059669', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Award size={20} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#064E3B', margin: 0 }}>Industry & Market Requirements</h3>
                                <p style={{ fontSize: '13px', color: '#047857', margin: '2px 0 0 0', fontWeight: 500 }}>Alignment of student curriculum skills against job market requirements and expected practices</p>
                            </div>
                        </div>

                        {/* Score badge next to the title (right corner) */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', backgroundColor: '#D1FAE570', padding: '10px 18px', borderRadius: '16px', border: '1px solid #05966915' }}>
                            <span style={{ fontSize: '24px', fontWeight: 800, color: '#059669', lineHeight: 1.1 }}>{overview.kpis.industryMatch !== null ? `${overview.kpis.industryMatch}%` : 'N/A'}</span>
                            <span style={{ fontSize: '12px', fontWeight: 500, color: '#064E3B', marginTop: '4px' }}>Industry Requirement Match</span>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                        <div className="ai-chart-card" style={{ margin: 0, border: '1px solid #D1FAE5', background: 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '20px' }}>
                                <div style={{ background: '#D1FAE5', color: '#059669', borderRadius: '10px', padding: '8px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#064E3B', marginBottom: '2px' }}>Academic Entry Requirements</div>
                                    <div style={{ fontSize: '12px', color: '#047857', fontWeight: 500 }}>Minimum academic qualifications and result expectations reported by program-relevant employers.</div>
                                </div>
                                {academicEntry && (
                                    <div style={{
                                        fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px',
                                        background: academicEntry.evidence_confidence === 'sufficient' ? '#D1FAE5' : '#FEF9C3',
                                        color: academicEntry.evidence_confidence === 'sufficient' ? '#065F46' : '#854D0E',
                                        border: `1px solid ${academicEntry.evidence_confidence === 'sufficient' ? '#6EE7B7' : '#FDE047'}`,
                                        whiteSpace: 'nowrap', flexShrink: 0, alignSelf: 'flex-start', marginTop: '2px'
                                    }}>
                                        {academicEntry.evidence_confidence === 'sufficient' ? '✓ Sufficient Evidence' : '⚠ Limited Evidence'}
                                    </div>
                                )}
                            </div>

                            {(!academicEntry || academicEntry.accepted_industry_count === 0) ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '18px 20px' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                    <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>No sufficient program-specific industry evidence.</span>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {[
                                            { label: 'Relevant Employers', value: academicEntry.accepted_industry_count },
                                            { label: 'Education Specified', value: `${academicEntry.education_requirement_count}/${academicEntry.accepted_industry_count}` },
                                            { label: 'Result Specified', value: `${academicEntry.result_requirement_count}/${academicEntry.accepted_industry_count}` },
                                        ].map((pill) => (
                                            <div key={pill.label} style={{ background: '#FFFFFF', border: '1px solid #D1FAE5', borderRadius: '10px', padding: '6px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '90px' }}>
                                                <span style={{ fontSize: '16px', fontWeight: 800, color: '#059669', lineHeight: 1.1 }}>{pill.value}</span>
                                                <span style={{ fontSize: '10px', color: '#6B7280', fontWeight: 600, textAlign: 'center', marginTop: '2px' }}>{pill.label}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '16px 18px', border: '1px solid #D1FAE5' }}>
                                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }} />
                                                Minimum Education Required
                                            </div>
                                            {(academicEntry.education_distribution || []).length === 0 ? (
                                                <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>No education requirement data.</p>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    {(academicEntry.education_distribution as Array<{ label: string; count: number; percentage: number }>).map((item) => (
                                                        <div key={item.label}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#1E293B', marginBottom: '4px' }}>
                                                                <span>{item.label}</span>
                                                                <span style={{ color: '#059669', fontWeight: 700 }}>{item.percentage}%</span>
                                                            </div>
                                                            <div style={{ height: '7px', borderRadius: '999px', background: '#D1FAE5', overflow: 'hidden' }}>
                                                                <div style={{ height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg, #059669, #34D399)', width: `${item.percentage}%`, transition: 'width 0.6s ease' }} />
                                                            </div>
                                                            <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px', textAlign: 'right' }}>{item.count} response{item.count !== 1 ? 's' : ''}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '16px 18px', border: '1px solid #D1FAE5' }}>
                                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#0369A1', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#0369A1' }} />
                                                Minimum Expected GPA / Result Class
                                            </div>
                                            {(academicEntry.result_distribution || []).length === 0 ? (
                                                <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>No result/GPA requirement data.</p>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    {(academicEntry.result_distribution as Array<{ label: string; count: number; percentage: number }>).map((item) => (
                                                        <div key={item.label}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#1E293B', marginBottom: '4px' }}>
                                                                <span>{item.label}</span>
                                                                <span style={{ color: '#0369A1', fontWeight: 700 }}>{item.percentage}%</span>
                                                            </div>
                                                            <div style={{ height: '7px', borderRadius: '999px', background: '#DBEAFE', overflow: 'hidden' }}>
                                                                <div style={{ height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg, #0369A1, #38BDF8)', width: `${item.percentage}%`, transition: 'width 0.6s ease' }} />
                                                            </div>
                                                            <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px', textAlign: 'right' }}>{item.count} response{item.count !== 1 ? 's' : ''}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {academicEntry.cross_analysis && Object.keys(academicEntry.cross_analysis).length > 0 && (
                                        <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '16px 18px', border: '1px solid #E0F2FE' }}>
                                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                                                Qualification × Result Cross-Analysis
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {Object.entries(academicEntry.cross_analysis as Record<string, Array<{ label: string; count: number; percentage: number }>>)
                                                    .filter(([, results]) => results.length > 0)
                                                    .map(([eduLabel, results]) => (
                                                        <div key={eduLabel}>
                                                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#7C3AED', flexShrink: 0 }} />
                                                                {eduLabel}
                                                            </div>
                                                            <div style={{ paddingLeft: '14px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                                {results.map((r) => (
                                                                    <span key={r.label} style={{
                                                                        background: 'linear-gradient(135deg, #EDE9FE, #DDD6FE)',
                                                                        color: '#6D28D9', fontSize: '11px', fontWeight: 600,
                                                                        padding: '3px 10px', borderRadius: '20px',
                                                                        border: '1px solid #C4B5FD'
                                                                    }}>
                                                                        {r.label} — {r.percentage}%
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                        </div>
                                    )}

                                    {academicEntry.summary && (
                                        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '14px 16px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="8" /><line x1="12" y1="12" x2="12" y2="16" /></svg>
                                            <p style={{ margin: 0, fontSize: '12.5px', color: '#065F46', lineHeight: 1.65, fontWeight: 500 }}>{academicEntry.summary}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab 2: AI Recommendations */}
            <div className="pdf-recommendations-section" style={{ display: activeTab === 'recommendations' ? 'block' : 'none' }}>
                <h3 className="pdf-only-title" style={{ display: 'none', fontSize: '20px', fontWeight: 800, color: '#1E293B', borderBottom: '2px solid #E2E8F0', paddingBottom: '8px', marginBottom: '24px', marginTop: '36px' }}>II. AI Actionable Recommendations</h3>

                <div className="mt-8" style={{ marginTop: '0px' }}>
                    {!recommendations || recommendations.length === 0 ? (
                        <div className="card-empty-state py-10">
                            <CheckCircle size={48} className="text-green-400 mb-2" />
                            <h3>Optimal Alignment</h3>
                            <p>The AI Engine did not trigger any intervention rules for {course.title}.</p>
                        </div>
                    ) : (
                        <div className="space-y-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {recommendations.map((rec, idx) => {
                                // Theme variables based on priority
                                const priorityColor =
                                    rec.priority === 'Critical' ? '#EF4444' :
                                        rec.priority === 'High' ? '#F59E0B' : '#3B82F6';

                                const priorityBg =
                                    rec.priority === 'Critical' ? '#FEF2F2' :
                                        rec.priority === 'High' ? '#FFFBEB' : '#EFF6FF';

                                const priorityTextColor =
                                    rec.priority === 'Critical' ? '#991B1B' :
                                        rec.priority === 'High' ? '#92400E' : '#1E40AF';

                                return (
                                    <div
                                        key={idx}
                                        className="ai-rec-card-premium relative overflow-hidden group"
                                        style={{
                                            position: 'relative',
                                            overflow: 'hidden',
                                            borderLeft: `6px solid ${priorityColor}`,
                                            boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
                                            borderRadius: '16px',
                                            backgroundColor: '#FFFFFF',
                                            padding: '24px',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <div className="rec-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                                            <div>
                                                <div className="flex items-center gap-2 mb-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span className="ai-tag-pill" style={{
                                                        backgroundColor: priorityBg,
                                                        color: priorityTextColor,
                                                        padding: '4px 12px',
                                                        borderRadius: '20px',
                                                        fontSize: '11px',
                                                        fontWeight: 800,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.025em'
                                                    }}>
                                                        {rec.priority} Priority
                                                    </span>
                                                    <span className="text-xs font-semibold text-slate-500" style={{ border: '1px solid #E2E8F0', padding: '2px 8px', borderRadius: '6px', backgroundColor: '#F8FAFC' }}>
                                                        {rec.type}
                                                    </span>
                                                </div>
                                                <h4 className="mt-2 text-lg" style={{ fontSize: '18px', fontWeight: '800', margin: '8px 0 0 0', color: '#0F172A' }}>{rec.title}</h4>
                                            </div>
                                            <div className="text-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>Evidence Source</span>
                                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569', backgroundColor: '#F1F5F9', padding: '4px 10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>{rec.evidence_source}</span>
                                            </div>
                                        </div>
                                        <div className="rec-card-body space-y-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {/* Actionable Insight Section */}
                                            <div style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)', border: '1px solid #E2E8F0', padding: '16px', borderRadius: '12px', display: 'flex', gap: '12px' }}>
                                                <div style={{ color: priorityColor, marginTop: '2px' }}>
                                                    <Lightbulb size={20} />
                                                </div>
                                                <div>
                                                    <span style={{ fontWeight: 800, color: '#1E293B', fontSize: '14px' }}>Actionable Insight</span>
                                                    <p style={{ margin: '4px 0 0 0', color: '#475569', fontSize: '13.5px', lineHeight: 1.5 }}>{rec.description}</p>
                                                </div>
                                            </div>

                                            {/* Anticipated Impact Section */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ECFDF5', padding: '6px', borderRadius: '8px' }}>
                                                    <CheckCircle size={18} />
                                                </div>
                                                <div>
                                                    <span style={{ fontWeight: 700, color: '#334155', fontSize: '13px' }}>Anticipated Impact:</span>
                                                    <span style={{ color: '#047857', fontWeight: 700, fontSize: '13px', marginLeft: '6px', backgroundColor: '#D1FAE5', padding: '2px 8px', borderRadius: '6px' }}>{rec.impact}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Tab 3: Existing Curriculum */}
            <div className="pdf-curriculum-section" style={{ display: activeTab === 'curriculum' ? 'block' : 'none' }}>
                <h3 className="pdf-only-title" style={{ display: 'none', fontSize: '20px', fontWeight: 800, color: '#1E293B', borderBottom: '2px solid #E2E8F0', paddingBottom: '8px', marginBottom: '24px', marginTop: '36px' }}>III. Existing Curriculum Structure</h3>

                <div className="mt-8" style={{ marginTop: '0px' }}>
                    {fullCourseData?.semesters && fullCourseData.semesters.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {fullCourseData.semesters.map((sem: any) => (
                                <div
                                    key={sem.id}
                                    style={{
                                        background: '#FFFFFF',
                                        borderRadius: '16px',
                                        padding: '24px',
                                        border: '1px solid #E2E8F0',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                                    }}
                                >
                                    <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', marginBottom: '16px', borderBottom: '2px solid #F1F5F9', paddingBottom: '8px' }}>
                                        {sem.name}
                                    </h4>
                                    {sem.subjects && sem.subjects.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 100px', fontWeight: 700, fontSize: '12px', color: '#64748B', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
                                                <span>SUBJECT CODE</span>
                                                <span>SUBJECT NAME</span>
                                                <span style={{ textAlign: 'right' }}>CREDITS</span>
                                            </div>
                                            {sem.subjects.map((sub: any) => (
                                                <div key={sub.id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 100px', fontSize: '14px', color: '#334155', padding: '6px 0' }}>
                                                    <span style={{ fontWeight: 600, color: '#7C3AED' }}>{sub.code}</span>
                                                    <span style={{ fontWeight: 500 }}>{sub.name}</span>
                                                    <span style={{ textAlign: 'right', fontWeight: 600, color: '#475569' }}>{sub.credits} Credits</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>No subjects assigned to this semester yet.</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : fullCourseData?.subjects && fullCourseData.subjects.length > 0 ? (
                        <div
                            style={{
                                background: '#FFFFFF',
                                borderRadius: '16px',
                                padding: '24px',
                                border: '1px solid #E2E8F0',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                            }}
                        >
                            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', marginBottom: '16px', borderBottom: '2px solid #F1F5F9', paddingBottom: '8px' }}>
                                Curriculum Subjects
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 100px', fontWeight: 700, fontSize: '12px', color: '#64748B', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
                                    <span>SUBJECT CODE</span>
                                    <span>SUBJECT NAME</span>
                                    <span style={{ textAlign: 'right' }}>CREDITS</span>
                                </div>
                                {fullCourseData.subjects.map((sub: any) => (
                                    <div key={sub.id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 100px', fontSize: '14px', color: '#334155', padding: '6px 0' }}>
                                        <span style={{ fontWeight: 600, color: '#7C3AED' }}>{sub.code}</span>
                                        <span style={{ fontWeight: 500 }}>{sub.name}</span>
                                        <span style={{ textAlign: 'right', fontWeight: 600, color: '#475569' }}>{sub.credits} Credits</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="card-empty-state py-10">
                            <BookOpen size={48} className="text-slate-300 mb-2" />
                            <h3>No Subjects Defined</h3>
                            <p>This program does not have any subjects defined in its curriculum structure.</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};




const MAP_CHART_COLORS = ['#7C3AED', '#3B82F6', '#10B981', '#EC4899', '#F59E0B', '#06B6D4', '#EF4444', '#8B5CF6'];

const CHART_GRADIENTS = [
    { id: 'grad-violet', start: '#A78BFA', end: '#7C3AED' },
    { id: 'grad-blue', start: '#60A5FA', end: '#2563EB' },
    { id: 'grad-green', start: '#34D399', end: '#059669' },
    { id: 'grad-pink', start: '#F472B6', end: '#DB2777' },
    { id: 'grad-amber', start: '#FBBF24', end: '#D97706' },
    { id: 'grad-cyan', start: '#22D3EE', end: '#0891B2' },
    { id: 'grad-red', start: '#F87171', end: '#DC2626' },
    { id: 'grad-purple', start: '#C084FC', end: '#9333EA' },
];

interface GeoData {
    by_province: Record<string, Record<string, { name: string; score: number }[]>>;
    all_island: { name: string; score: number }[];
    district_counts: Record<string, number>;
    education_levels: { name: string; value: number }[];
    industry_sectors: { name: string; value: number }[];
    industry_domains: { name: string; value: number }[];
}

const InteractiveSriLankaMap: React.FC = () => {
    const [geoData, setGeoData] = useState<GeoData | null>(null);
    const [loadingGeo, setLoadingGeo] = useState(true);
    const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
    const [allIslandSelectedField, setAllIslandSelectedField] = useState<string | null>(null);
    const [allIslandSkills, setAllIslandSkills] = useState<{ name: string; score: number; percentage: number }[]>([]);
    const [loadingAllIslandSkills, setLoadingAllIslandSkills] = useState(false);

    const [industrySelectedField, setIndustrySelectedField] = useState<string | null>(null);
    const [industrySkills, setIndustrySkills] = useState<{ name: string; score: number; value: number; percentage: number }[]>([]);
    const [loadingIndustrySkills, setLoadingIndustrySkills] = useState(false);

    useEffect(() => {
        aiAnalyticsService.getGeographyData().then(d => {
            setGeoData(d);
            setLoadingGeo(false);
            if (d?.all_island && d.all_island.length > 0) {
                handleAllIslandFieldClick(d.all_island[0].name);
            }
            if (d?.industry_domains && d.industry_domains.length > 0) {
                handleIndustryFieldClick(d.industry_domains[0].name);
            }
        }).catch(() => setLoadingGeo(false));
    }, []);

    const districtCounts = geoData?.district_counts || {};
    const maxCount = Math.max(...Object.values(districtCounts).map(v => Number(v)), 1);

    const getColorForDistrict = (name: string) => {
        const nameLower = name.toLowerCase().trim();
        const count = districtCounts[nameLower] || districtCounts[name] || 0;
        if (count === 0) return '#F1F5F9';
        const ratio = count / maxCount;
        const lightness = 80 - (ratio * 40);
        return `hsl(262, 80%, ${lightness}%)`;
    };

    const handleAllIslandFieldClick = async (field: string) => {
        setAllIslandSelectedField(field);
        setLoadingAllIslandSkills(true);
        setAllIslandSkills([]);
        try {
            const data = await aiAnalyticsService.getGeographySkills(field);
            setAllIslandSkills(data.skills || []);
        } catch { setAllIslandSkills([]); }
        finally { setLoadingAllIslandSkills(false); }
    };

    const handleIndustryFieldClick = async (field: string) => {
        setIndustrySelectedField(field);
        setLoadingIndustrySkills(true);
        setIndustrySkills([]);
        try {
            const data = await aiAnalyticsService.getIndustrySkills(field);
            setIndustrySkills(data.skills || []);
        } catch { setIndustrySkills([]); }
        finally { setLoadingIndustrySkills(false); }
    };

    const allIslandPieData = (geoData?.all_island || []).slice(0, 8).map(f => ({ ...f, value: f.score }));

    const mapTooltipStyle: React.CSSProperties = {
        position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)',
        background: '#1E293B', color: '#FFF', padding: '6px 12px', borderRadius: '8px',
        fontSize: '11px', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 10,
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Grid Container for Side-by-Side: Education Levels, Industry Sectors, & Sri Lanka Map */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>

                {/* Left Card: Applicant Education Levels */}
                <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', padding: '28px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: '24px' }}>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>Applicant Education Levels</h4>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Prior qualifications of surveyed applicants.</p>
                    </div>
                    {loadingGeo ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '340px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #E9D5FF', borderTopColor: '#7C3AED', animation: 'spin 0.9s linear infinite' }}></div>
                        </div>
                    ) : (geoData?.education_levels || []).length === 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '340px', color: '#94A3B8', fontSize: '13px' }}>No education data available.</div>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ResponsiveContainer width="100%" height={320}>
                                <PieChart>
                                    <defs>
                                        {CHART_GRADIENTS.map(g => (
                                            <linearGradient id={g.id} key={g.id} x1="0" y1="0" x2="1" y2="1">
                                                <stop offset="0%" stopColor={g.start} />
                                                <stop offset="100%" stopColor={g.end} />
                                            </linearGradient>
                                        ))}
                                    </defs>
                                    <Pie
                                        data={geoData?.education_levels}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={110}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {(geoData?.education_levels || []).map((_, idx) => (
                                            <Cell key={`cell-${idx}`} fill={`url(#${CHART_GRADIENTS[idx % CHART_GRADIENTS.length].id})`} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={({ active, payload }: any) => {
                                        if (active && payload?.length) {
                                            const p = payload[0].payload;
                                            const total = (geoData?.education_levels || []).reduce((sum, item) => sum + item.value, 0);
                                            const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : '0.0';
                                            return (
                                                <div style={{ background: '#1E293B', color: '#FFF', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                                                    <div style={{ fontWeight: 700 }}>{p.name}</div>
                                                    <div style={{ opacity: 0.85, marginTop: 4 }}>Applicants: {p.value} ({pct}%)</div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Middle Card: Industry Sector Distribution */}
                <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', padding: '28px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: '24px' }}>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>Industry Sector Distribution</h4>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Sectors of surveyed industry organizations.</p>
                    </div>
                    {loadingGeo ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '340px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #E9D5FF', borderTopColor: '#7C3AED', animation: 'spin 0.9s linear infinite' }}></div>
                        </div>
                    ) : (geoData?.industry_sectors || []).length === 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '340px', color: '#94A3B8', fontSize: '13px' }}>No industry sector data available.</div>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ResponsiveContainer width="100%" height={320}>
                                <PieChart>
                                    <defs>
                                        {CHART_GRADIENTS.map(g => (
                                            <linearGradient id={g.id} key={g.id} x1="0" y1="0" x2="1" y2="1">
                                                <stop offset="0%" stopColor={g.start} />
                                                <stop offset="100%" stopColor={g.end} />
                                            </linearGradient>
                                        ))}
                                    </defs>
                                    <Pie
                                        data={geoData?.industry_sectors}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={110}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {(geoData?.industry_sectors || []).map((_, idx) => (
                                            <Cell key={`cell-ind-${idx}`} fill={`url(#${CHART_GRADIENTS[idx % CHART_GRADIENTS.length].id})`} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={({ active, payload }: any) => {
                                        if (active && payload?.length) {
                                            const p = payload[0].payload;
                                            const total = (geoData?.industry_sectors || []).reduce((sum, item) => sum + item.value, 0);
                                            const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : '0.0';
                                            return (
                                                <div style={{ background: '#1E293B', color: '#FFF', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                                                    <div style={{ fontWeight: 700 }}>{p.name}</div>
                                                    <div style={{ opacity: 0.85, marginTop: 4 }}>Organizations: {p.value} ({pct}%)</div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Right Card: Geographical Distribution Map */}
                <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', padding: '28px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: '24px' }}>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>Geographical Distribution</h4>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Applicant interest mapped by district of residence.</p>
                    </div>
                    {loadingGeo ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '340px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #E9D5FF', borderTopColor: '#7C3AED', animation: 'spin 0.9s linear infinite' }}></div>
                        </div>
                    ) : (
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '340px' }}>
                            <div style={{ width: '220px', height: '330px', position: 'relative', flexShrink: 0 }}>
                                <svg viewBox={SriLankaMapData.viewBox} style={{ width: '100%', height: '100%', maxHeight: '100%', cursor: 'pointer' }}>
                                    {SriLankaMapData.locations.map((loc: any) => {
                                        const isHovered = hoveredDistrict === loc.name;
                                        const count = districtCounts[loc.name.toLowerCase().trim()] || districtCounts[loc.name] || 0;
                                        const fillColor = getColorForDistrict(loc.name);
                                        const strokeColor = count > 0 ? '#7C3AED' : '#CBD5E1';

                                        return (
                                            <path
                                                key={loc.id}
                                                d={loc.path}
                                                fill={fillColor}
                                                stroke={strokeColor}
                                                strokeWidth={isHovered ? '2' : '1'}
                                                style={{ transition: 'all 0.18s ease', outline: 'none' }}
                                                onMouseEnter={() => setHoveredDistrict(loc.name)}
                                                onMouseLeave={() => setHoveredDistrict(null)}
                                            >
                                                <title>{loc.name}: {count} applicants</title>
                                            </path>
                                        );
                                    })}
                                </svg>
                                {hoveredDistrict && (
                                    <div style={mapTooltipStyle}>
                                        {hoveredDistrict} · {districtCounts[hoveredDistrict.toLowerCase().trim()] || districtCounts[hoveredDistrict] || 0} applicants
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>


            {/* Row 2: Top Interest Fields & Skills (Separate section under the map) */}
            <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', padding: '28px', display: 'flex', flexDirection: 'column' }}>
                {loadingGeo ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '360px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #E9D5FF', borderTopColor: '#7C3AED', animation: 'spin 0.9s linear infinite' }}></div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: allIslandSelectedField ? '1fr 1fr' : '1fr', gap: '32px', alignItems: 'flex-start' }}>
                        <div>
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>Top Interest Fields</h4>
                            <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
                                Click a slice to see the top skills requested for that field.
                            </p>
                            <ResponsiveContainer width="100%" height={340}>
                                <PieChart>
                                    <Pie data={allIslandPieData} cx="50%" cy="50%" outerRadius={120} paddingAngle={3} dataKey="value"
                                        onClick={(entry: any) => handleAllIslandFieldClick(entry.name)} style={{ cursor: 'pointer' }}>
                                        {allIslandPieData.map((entry, i) => (
                                            <Cell key={i} fill={MAP_CHART_COLORS[i % MAP_CHART_COLORS.length]}
                                                stroke={allIslandSelectedField === entry.name ? '#0F172A' : 'transparent'}
                                                strokeWidth={allIslandSelectedField === entry.name ? 3 : 0}
                                                opacity={allIslandSelectedField && allIslandSelectedField !== entry.name ? 0.45 : 1} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={({ active, payload }: any) => {
                                        if (active && payload?.length) {
                                            const p = payload[0].payload;
                                            return <div style={{ background: '#1E293B', color: '#FFF', padding: '10px 14px', borderRadius: '10px', fontSize: '12px' }}><div style={{ fontWeight: 700 }}>{p.name}</div><div style={{ opacity: 0.85, marginTop: 4 }}>Weighted score: {p.score}</div></div>;
                                        }
                                        return null;
                                    }} />
                                    <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" iconSize={8}
                                        formatter={(value) => <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>{value}</span>} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        {allIslandSelectedField && (
                            <div style={{ animation: 'fadeInRight 0.3s ease' }}>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>Top Skills for <span style={{ background: 'linear-gradient(135deg, #EDE9FE, #DDD6FE)', color: '#6D28D9', padding: '2px 10px', borderRadius: '6px', fontWeight: 800 }}>{allIslandSelectedField}</span></h4>
                                <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748B', fontWeight: 500 }}>All Island · All Education Levels</p>
                                {loadingAllIslandSkills ? (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '3px solid #E9D5FF', borderTopColor: '#7C3AED', animation: 'spin 0.9s linear infinite' }}></div>
                                    </div>
                                ) : allIslandSkills.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8', fontSize: '13px' }}>No skill data found.</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={340}>
                                        <PieChart>
                                            <Pie data={allIslandSkills.map(s => ({ ...s, value: s.score }))} cx="50%" cy="50%" outerRadius={115} paddingAngle={2} dataKey="value">
                                                {allIslandSkills.map((_, i) => <Cell key={i} fill={MAP_CHART_COLORS[i % MAP_CHART_COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip content={({ active, payload }: any) => {
                                                if (active && payload?.length) {
                                                    const p = payload[0].payload;
                                                    return <div style={{ background: '#1E293B', color: '#FFF', padding: '10px 14px', borderRadius: '10px', fontSize: '12px' }}><div style={{ fontWeight: 700, textTransform: 'capitalize' }}>{p.name}</div><div style={{ opacity: 0.85, marginTop: 4 }}>{p.percentage}% · score {p.score}</div></div>;
                                                }
                                                return null;
                                            }} />
                                            <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" iconSize={8}
                                                formatter={(value) => <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600, textTransform: 'capitalize' }}>{value}</span>} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Row 3: Industry Demand & Soft Skills */}
            <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', padding: '28px', display: 'flex', flexDirection: 'column' }}>
                {loadingGeo ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '360px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #E9D5FF', borderTopColor: '#7C3AED', animation: 'spin 0.9s linear infinite' }}></div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: industrySelectedField ? '1fr 1fr' : '1fr', gap: '32px', alignItems: 'flex-start' }}>
                        <div>
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>Primary Academic Domain of Interest (top 05)</h4>
                            <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
                                Click a slice to see the top soft skills requested for that field.
                            </p>
                            <ResponsiveContainer width="100%" height={340}>
                                <PieChart>
                                    <Pie data={geoData?.industry_domains || []} cx="50%" cy="50%" outerRadius={120} paddingAngle={3} dataKey="value"
                                        onClick={(entry: any) => handleIndustryFieldClick(entry.name)} style={{ cursor: 'pointer' }}>
                                        {(geoData?.industry_domains || []).map((entry, i) => (
                                            <Cell key={i} fill={MAP_CHART_COLORS[i % MAP_CHART_COLORS.length]}
                                                stroke={industrySelectedField === entry.name ? '#0F172A' : 'transparent'}
                                                strokeWidth={industrySelectedField === entry.name ? 3 : 0}
                                                opacity={industrySelectedField && industrySelectedField !== entry.name ? 0.45 : 1} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={({ active, payload }: any) => {
                                        if (active && payload?.length) {
                                            const p = payload[0].payload;
                                            return <div style={{ background: '#1E293B', color: '#FFF', padding: '10px 14px', borderRadius: '10px', fontSize: '12px' }}><div style={{ fontWeight: 700 }}>{p.name}</div><div style={{ opacity: 0.85, marginTop: 4 }}>Responses count: {p.value}</div></div>;
                                        }
                                        return null;
                                    }} />
                                    <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" iconSize={8}
                                        formatter={(value) => <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>{value}</span>} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        {industrySelectedField && (
                            <div style={{ animation: 'fadeInRight 0.3s ease' }}>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>Top 7 Soft Skills for <span style={{ background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)', color: '#047857', padding: '2px 10px', borderRadius: '6px', fontWeight: 800 }}>{industrySelectedField}</span></h4>
                                <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748B', fontWeight: 500 }}>All Island · Industry Demands</p>
                                {loadingIndustrySkills ? (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '3px solid #E9D5FF', borderTopColor: '#7C3AED', animation: 'spin 0.9s linear infinite' }}></div>
                                    </div>
                                ) : industrySkills.length === 0 ? (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#64748B', fontSize: '13px' }}>No skill data found.</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie data={industrySkills} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={4} dataKey="value">
                                                {industrySkills.map((entry, idx) => (
                                                    <Cell key={`cell-ind-skill-${idx}`} fill={MAP_CHART_COLORS[(idx + 2) % MAP_CHART_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={({ active, payload }: any) => {
                                                if (active && payload?.length) {
                                                    const p = payload[0].payload;
                                                    return <div style={{ background: '#1E293B', color: '#FFF', padding: '10px 14px', borderRadius: '10px', fontSize: '12px' }}><div style={{ fontWeight: 700 }}>{p.name}</div><div style={{ opacity: 0.85, marginTop: 4 }}>Demanded: {p.value} times ({p.percentage}%)</div></div>;
                                                }
                                                return null;
                                            }} />
                                            <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" iconSize={8}
                                                formatter={(value) => <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>{value}</span>} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

/* =========================================================
   UNIVERSITY OPPORTUNITIES BAR CHART
   ========================================================= */

const UNI_OPP_COLORS = [
    '#7C3AED', '#3B82F6', '#10B981', '#EC4899',
    '#F59E0B', '#06B6D4', '#EF4444', '#8B5CF6',
    '#0EA5E9', '#84CC16', '#F97316', '#6366F1',
];

// Sub-components defined OUTSIDE to prevent infinite re-renders
const UniOppBar = (props: any) => {
    const { x, y, width, height, fill, isHovered } = props;
    const depth = 7;
    if (height <= 0) return null;
    return (
        <g>
            <rect x={x} y={y} width={width} height={height} fill={fill} rx={3}
                style={{ filter: isHovered ? 'brightness(1.18)' : 'none', transition: 'filter 0.15s ease' }} />
            <polygon points={`${x + width},${y} ${x + width + depth},${y - depth / 2} ${x + width + depth},${y + height - depth / 2} ${x + width},${y + height}`}
                fill={fill + '99'} />
            <polygon points={`${x},${y} ${x + depth},${y - depth / 2} ${x + width + depth},${y - depth / 2} ${x + width},${y}`}
                fill={fill + 'DD'} />
        </g>
    );
};

const UniOppTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const d = payload[0].payload;
        return (
            <div style={{ background: '#1E293B', color: '#FFF', padding: '10px 16px', borderRadius: '10px', fontSize: '13px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', lineHeight: 1.6 }}>
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>{d.name}</div>
                <div style={{ opacity: 0.85 }}>
                    <span style={{ fontWeight: 700, fontSize: '16px', color: '#A78BFA' }}>{d.percentage}%</span>
                    <span style={{ marginLeft: '8px', fontSize: '11px', opacity: 0.7 }}>({d.count} responses)</span>
                </div>
            </div>
        );
    }
    return null;
};

const UniOppXTick = ({ x, y, payload }: any) => {
    const words = String(payload.value).split(' ');
    const lines: string[] = [];
    let current = '';
    for (const w of words) {
        if ((current + ' ' + w).trim().length > 14) { lines.push(current.trim()); current = w; }
        else { current = (current + ' ' + w).trim(); }
    }
    if (current) lines.push(current);
    return (
        <g transform={`translate(${x},${y})`}>
            {lines.map((line, i) => (
                <text key={i} x={0} y={0} dy={14 + i * 13} textAnchor="middle" fill="#64748B" fontSize={10} fontWeight={500}>{line}</text>
            ))}
        </g>
    );
};

const UniversityOpportunitiesChart: React.FC = () => {

    const [data, setData] = useState<{ name: string; count: number; percentage: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    useEffect(() => {
        aiAnalyticsService.getUniversityOpportunities()
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    return (
        <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            padding: '28px',
        }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                    University Opportunities Students Expect
                </h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
                    Recurring opportunity themes grouped directly from survey responses · hover for percentage.
                </p>
            </div>

            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '280px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #E9D5FF', borderTopColor: '#7C3AED', animation: 'spin 0.9s linear infinite', margin: '0 auto 12px auto' }}></div>
                        <span style={{ fontSize: '13px', color: '#94A3B8' }}>Loading opportunity data…</span>
                    </div>
                </div>
            ) : data.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8', fontSize: '13px' }}>No data available.</div>
            ) : (
                /* Bar Chart - full width, no side panel */
                <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                        data={data.slice(0, 5)}
                        margin={{ top: 20, right: 32, left: 0, bottom: 60 }}
                        barCategoryGap="28%"
                        onMouseLeave={() => setActiveIndex(null)}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                        <XAxis
                            dataKey="name"
                            tick={<UniOppXTick />}
                            tickLine={false}
                            axisLine={{ stroke: '#E2E8F0' }}
                            interval={0}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 10, fill: '#94A3B8' }}
                            tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip content={<UniOppTooltip />} cursor={false} />
                        <Bar
                            dataKey="percentage"
                            shape={(props: any) => <UniOppBar {...props} fill={UNI_OPP_COLORS[props.index % UNI_OPP_COLORS.length]} isHovered={activeIndex === props.index} />}
                            onMouseEnter={(_: any, index: number) => setActiveIndex(index)}
                        >
                            {data.slice(0, 5).map((_, i) => (
                                <Cell
                                    key={i}
                                    fill={UNI_OPP_COLORS[i % UNI_OPP_COLORS.length]}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

