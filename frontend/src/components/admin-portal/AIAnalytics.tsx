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
    // educationLevels and districts removed — now fetched directly by InteractiveSriLankaMap

    // Toast notification state
    const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info' }[]>([]);
    const toastIdRef = React.useRef(0);

    // Confirmation modal state
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
            setPrograms(data);
            const globalData = await aiAnalyticsService.getGlobalOverview().catch(() => null);
            if (globalData) {
                if (globalData.emerging_technologies) {
                    setGlobalEmergingTech(globalData.emerging_technologies);
                }
                if (globalData.last_sync_at) {
                    setLastSyncedAt(globalData.last_sync_at);
                }
                setStudentCount(globalData.student_count || 0);
                setIndustryCount(globalData.industry_count || 0);
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
                    // Refresh programs lists
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
                {/* Toast must always be in the DOM */}
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
            {/* ===== FULL-PAGE SYNC OVERLAY ===== */}
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
                        <p className="sync-overlay-desc">Downloading surveys from Google Sheets and running the AI matching pipeline. This may take 1–2 minutes.</p>
                        <div className="sync-progress-bar">
                            <div className="sync-progress-bar-fill"></div>
                        </div>
                        <span className="sync-overlay-hint">Please do not close this page.</span>
                    </div>
                </div>
            )}

            {/* ===== CONFIRMATION MODAL ===== */}
            {confirmModal.open && (
                <div className="confirm-modal-backdrop" onClick={() => setConfirmModal({ open: false, onConfirm: () => { } })}>
                    <div className="confirm-modal-card" onClick={e => e.stopPropagation()}>
                        <div className="confirm-modal-icon-wrap">
                            <RefreshCw size={28} />
                        </div>
                        <h3 className="confirm-modal-title">Run Full Sync?</h3>
                        <p className="confirm-modal-desc">
                            This will download the latest Student and Industry survey sheets from Google Sheets, update local databases, and run the AI matching algorithms. The process may take 1–2 minutes.
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

            {/* ===== TOAST NOTIFICATIONS ===== */}
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



/* =========================================================
   STATE A: PROGRAM HUB (LANDING PAGE)
   ========================================================= */
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
    setLevelFilter: React.Dispatch<React.SetStateAction<string>>,
    searchTerm: string,
    setSearchTerm: React.Dispatch<React.SetStateAction<string>>,
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

        if (levelFilter === 'all') {
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
            {/* Header section identical to other pages with Sync button aligned on the right */}
            <div className="admin-page-header">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    {(levelFilter !== 'all' || searchTerm !== '') && (
                        <button
                            className="cm-back-text-btn"
                            onClick={() => {
                                setLevelFilter('all');
                                setSearchTerm('');
                            }}
                        >
                            <ArrowLeft size={18} /> Back
                        </button>
                    )}
                    <h1 className="admin-page-title">
                        {(levelFilter !== 'all' || searchTerm !== '')
                            ? (searchTerm ? `Search Results for "${searchTerm}"` : `${levelFilter} Programs`)
                            : "AI Analytics Workspace"
                        }
                    </h1>
                    <p className="admin-page-subtitle">
                        {(levelFilter !== 'all' || searchTerm !== '')
                            ? "Explore and analyze our educational program categories."
                            : "Analyze curriculum alignment against student interest surveys and industry capability audits."
                        }
                    </p>
                </div>
                {levelFilter === 'all' && !searchTerm && (
                    <div className="admin-header-actions" style={{ gap: '12px' }}>
                        {lastSyncedAt && (
                            <span className="last-sync-badge" style={{ fontSize: '0.85rem', color: '#64748B', display: 'flex', alignItems: 'center', backgroundColor: '#F1F5F9', padding: '6px 12px', borderRadius: '6px', fontWeight: 500 }}>
                                Last Sync: {new Date(lastSyncedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                        <button className="admin-btn-outline" onClick={onOpenManageForms}>
                            <Database size={16} /> Manage Forms
                        </button>
                        <button className="admin-btn-primary" onClick={onOpenSync} disabled={syncing}>
                            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Syncing...' : 'Sync'}
                        </button>
                    </div>
                )}
            </div>

            {/* Search Input Bar consistent with Course Management search bar */}
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

            {/* Survey Records Analyzed Metric Cards */}
            {levelFilter === 'all' && !searchTerm && (
                <>
                    {/* Top Row: Simple Stats Count Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '20px' }}>
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
                    </div>

                    {/* Second Row: Interactive Sri Lanka Map (full width) */}
                    <div style={{ marginBottom: '32px' }}>
                        <InteractiveSriLankaMap />
                    </div>

                    {/* Third Row: University Opportunities Bar Chart */}
                    <div style={{ marginBottom: '32px' }}>
                        <UniversityOpportunitiesChart />
                    </div>
                </>
            )}

            {/* Qualification Cards Grid (Initially visible when no category/search is selected) */}
            {levelFilter === 'all' && !searchTerm ? (
                <div className="cm-categories-grid">
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
            ) : (
                /* Course Content Grid displayed when category is selected or search term is entered */
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
            )}
            {levelFilter === 'all' && !searchTerm && (
                <div className="ai-chart-card" style={{ marginTop: '32px' }}>
                    <h4>Global Emerging Technologies</h4>
                    <p className="text-slate-400 text-xs mb-4" style={{ margin: '0 0 16px 0', fontSize: '12px', fontWeight: 500 }}>Raw tags detected in qualitative student & industry feedback across all programs.</p>
                    {globalEmergingTech && globalEmergingTech.length > 0 ? (
                        <div className="tag-container">
                            {globalEmergingTech.map((tech, idx) => (
                                <span key={idx} className="tag well">{tech}</span>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-slate-400 py-4 text-sm">No emerging signals detected.</div>
                    )}
                </div>
            )}
        </div>
    );
};

/* =========================================================
   STATE B: PROGRAM-SPECIFIC DASHBOARD
   ========================================================= */
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

            // --- PAGE 1: TITLE & EXECUTIVE SUMMARY ---
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

            addText('Missing Core Subjects:', margin + 5, { fontSize: 10, fontStyle: 'bold' });
            y += 5;
            const missingText = overview.missing_subjects && overview.missing_subjects.length > 0
                ? overview.missing_subjects.join(', ')
                : 'None';
            const splitMissing = doc.splitTextToSize(missingText, pageWidth - margin * 2 - 10);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text(splitMissing, margin + 10, y);
            y += (splitMissing.length * 5) + 4;

            addText('Curriculum Anomalies:', margin + 5, { fontSize: 10, fontStyle: 'bold' });
            y += 5;
            let anomaliesFound = false;
            if (overview.outdated_subjects && overview.outdated_subjects.length > 0) {
                overview.outdated_subjects.forEach((sub: any) => {
                    addText(`- Outdated Subject: ${sub.code} ${sub.name} (Legacy Technology Warning)`, margin + 10, { fontSize: 9, fontStyle: 'normal', color: 'red' });
                    y += 5;
                    anomaliesFound = true;
                });
            }
            if (overview.low_demand_subjects && overview.low_demand_subjects.length > 0) {
                overview.low_demand_subjects.forEach((sub: any) => {
                    addText(`- Low Demand Subject: ${sub.code} ${sub.name} (Less than 5% demand)`, margin + 10, { fontSize: 9, fontStyle: 'normal', color: 'gray' });
                    y += 5;
                    anomaliesFound = true;
                });
            }
            if (!anomaliesFound) {
                addText('- No curriculum anomalies or legacy warning subjects detected.', margin + 10, { fontSize: 9, fontStyle: 'normal' });
                y += 5;
            }
            y += 4;

            addText(`Preferred Learning Delivery Split:`, margin + 5, { fontSize: 10, fontStyle: 'bold' });
            const y_start = y;

            const theory = overview.learning_preferences_data?.student_theory_percent || 0;
            const practical = overview.learning_preferences_data?.student_practical_percent || 0;

            // Donut Chart coordinates - centered vertically with the legend block
            const cx = margin + 120;
            const cy = y_start + 11;
            const r = 14;

            const drawPieSlice = (cx: number, cy: number, r: number, startAngle: number, endAngle: number, fillHex: string) => {
                const steps = 30;
                const stepAngle = (endAngle - startAngle) / steps;

                if (fillHex === 'purple') doc.setFillColor(192, 132, 252);
                else doc.setFillColor(124, 58, 237);

                for (let i = 0; i < steps; i++) {
                    const a1 = startAngle + i * stepAngle;
                    const a2 = startAngle + (i + 1) * stepAngle;

                    const rad1 = (a1 - 90) * Math.PI / 180;
                    const rad2 = (a2 - 90) * Math.PI / 180;

                    doc.triangle(
                        cx, cy,
                        cx + r * Math.cos(rad1), cy + r * Math.sin(rad1),
                        cx + r * Math.cos(rad2), cy + r * Math.sin(rad2),
                        'F'
                    );
                }
            };

            const theoryAngle = (theory / 100) * 360;
            drawPieSlice(cx, cy, r, 0, theoryAngle, 'purple');
            drawPieSlice(cx, cy, r, theoryAngle, 360, 'indigo');

            // Inner cutout to build a Donut chart
            doc.setFillColor(255, 255, 255);
            doc.ellipse(cx, cy, r * 0.45, r * 0.45, 'F');

            // Draw Legend with color boxes
            y += 8;
            doc.setFillColor(192, 132, 252);
            doc.rect(margin + 10, y - 2.5, 3, 3, 'F');
            addText(`Theory Preference: ${theory}%`, margin + 15, { fontSize: 9 });

            y += 6;
            doc.setFillColor(124, 58, 237);
            doc.rect(margin + 10, y - 2.5, 3, 3, 'F');
            addText(`Practical Preference: ${practical}%`, margin + 15, { fontSize: 9 });

            y = y_start + 28; // clearance below chart bottom

            addText('Student Preferred Learning Methods:', margin + 5, { fontSize: 10, fontStyle: 'bold' });
            y += 7;
            if (overview.learning_preferences_data?.student_methods && overview.learning_preferences_data?.student_methods.length > 0) {
                overview.learning_preferences_data.student_methods.forEach((m: any) => {
                    checkPageOverflow(15);
                    addText(`${m.name}: ${m.value}%`, margin + 10, { fontSize: 9 });
                    y += 4;

                    // Draw single progress bar chart
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

            // --- PAGE 2: STUDENT & JOB MARKET ALIGNMENT ---
            doc.addPage();
            y = margin;

            addText('III. STUDENT & JOB MARKET ALIGNMENT INSIGHTS', margin, { fontSize: 14, fontStyle: 'bold', color: 'purple' });
            y += 10;

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

            // --- PAGE 3: RECOMMENDATIONS ---
            doc.addPage();
            y = margin;

            addText('IV. AI ACTIONABLE RECOMMENDATIONS', margin, { fontSize: 14, fontStyle: 'bold', color: 'purple' });
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

                    // Title
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(10);
                    doc.setTextColor(15, 23, 42);
                    doc.text(`${rec.priority} Priority: ${rec.title}`, margin + 6, y + 5);

                    // Description
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(9);
                    doc.setTextColor(71, 85, 105);
                    const descText = `Insight: ${rec.description}`;
                    const splitDesc = doc.splitTextToSize(descText, pageWidth - margin * 2 - 12);
                    doc.text(splitDesc, margin + 6, y + 11);

                    // Impact
                    doc.setFont('helvetica', 'bold');
                    doc.text(`Impact: ${rec.impact}`, margin + 6, y + 23);

                    // Source
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(8.5);
                    doc.setTextColor(148, 163, 184);
                    doc.text(`Evidence Source: ${rec.evidence_source}`, margin + 6, y + 29);

                    y += 39;
                });
            }

            // --- PAGE 4: EXISTING CURRICULUM ---
            doc.addPage();
            y = margin;

            addText('V. EXISTING CURRICULUM STRUCTURE', margin, { fontSize: 14, fontStyle: 'bold', color: 'purple' });
            y += 10;

            if (fullCourseData?.semesters && fullCourseData.semesters.length > 0) {
                fullCourseData.semesters.forEach((sem: any) => {
                    checkPageOverflow(35);

                    addText(sem.name, margin + 5, { fontSize: 11, fontStyle: 'bold', color: 'purple' });
                    y += 6;

                    if (sem.subjects && sem.subjects.length > 0) {
                        // Header row
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

                        // Items
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
                addText('Curriculum Subjects', margin + 5, { fontSize: 11, fontStyle: 'bold', color: 'purple' });
                y += 6;

                // Header row
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

                // Items
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
                const [ov, st, ind, gap, rec, tech, fullCourse] = await Promise.all([
                    aiAnalyticsService.getOverview(course.id).catch(() => null),
                    aiAnalyticsService.getStudentInterest(course.id).catch(() => null),
                    aiAnalyticsService.getIndustryGap(course.id).catch(() => null),
                    aiAnalyticsService.getSkillGap(course.id).catch(() => null),
                    aiAnalyticsService.getRecommendations(course.id).catch(() => []),
                    aiAnalyticsService.getEmergingTechnologies(course.id).catch(() => []),
                    courseService.getById(course.id).catch(() => null)
                ]);

                setOverview(ov);
                setStudentData(st);
                setIndustryData(ind);
                setSkillGap(gap);
                setRecommendations(rec || []);
                setEmergingTech(tech || []);
                setFullCourseData(fullCourse);
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
            {/* Header */}
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

                    <div className="flex items-center gap-2 mt-4" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
                        {course.code && course.code.trim() && <span className="code-badge">{course.code}</span>}
                        <span className="text-slate-500 text-sm" style={{ fontWeight: 600 }}>{course.department}</span>
                        <span className="text-slate-400 text-xs" style={{ marginLeft: '8px' }}>| Last Updated: {overview.last_generated}</span>
                    </div>
                </div>
            </div>
            {/* Tab Controls */}
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

            {/* Tab 1: AI Insights */}
            <div className="pdf-insights-section" style={{ display: activeTab === 'insights' ? 'flex' : 'none' }}>
                <h3 className="pdf-only-title" style={{ display: 'none', fontSize: '20px', fontWeight: 800, color: '#1E293B', borderBottom: '2px solid #E2E8F0', paddingBottom: '8px', marginBottom: '24px', marginTop: '24px' }}>I. AI Analytics & Survey Insights</h3>

                {/* Category 1: Curriculum & Teaching Delivery */}
                <div className="category-section category-purple">
                    <div className="category-header">
                        <div className="category-title-wrapper">
                            <div className="category-icon-box purple">
                                <BookOpen size={20} />
                            </div>
                            <div className="category-title-text">
                                <h3>Curriculum & Delivery Insights</h3>
                                <p>Analysis of curriculum scope, subject coverage, delivery split, and curriculum anomalies</p>
                                
                                {overview.kpis && (
                                    <div className={`evidence-alert-badge ${overview.kpis.evidence_status === 'insufficient' ? 'insufficient' : 'sufficient'}`}>
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

                        {/* Score badge next to the title (right corner) */}
                        <div className="category-score-badge">
                            <span className="score-val">{overview.coverage_percent !== null ? `${overview.coverage_percent}%` : 'N/A'}</span>
                            <span className="score-label">Curriculum Coverage</span>
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
                        <div className="ai-category-grid">
                            {/* Potential Curriculum Gaps */}
                            <div className="ai-chart-card" style={{ borderLeft: '5px solid #7C3AED', margin: 0 }}>
                                <h4 className="ai-card-title text-violet-700 font-bold">
                                    <ShieldAlert size={18} className="text-violet-500" /> Potential Curriculum Gaps
                                </h4>
                                <p className="ai-card-subtitle">Evidence-based analysis of curriculum gaps, enhancements and industry trends.</p>
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
                                                    <div className="ai-metadata-grid">
                                                        <span>🏢 Industry: <strong>{sub.relevant_industry_responses}/{sub.total_industry_responses} ({sub.industry_pct}%)</strong></span>
                                                        <span>🎓 Student: <strong>{sub.relevant_student_responses}/{sub.total_student_responses} ({sub.student_pct}%)</strong></span>
                                                        <span>📖 Curriculum: <strong style={{ color: sub.curriculum_coverage_status === 'Not Covered' ? '#EF4444' : '#10B981' }}>{sub.curriculum_coverage_status}</strong></span>
                                                        <span>⚡ Confidence: <strong>{sub.evidence_confidence}</strong></span>
                                                    </div>
                                                    <div className="ai-metadata-extra">
                                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                            {sub.evidence_sources && sub.evidence_sources.map((src: string, i: number) => (
                                                                <span key={i} style={{ backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', color: '#475569', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 600 }}>{src}</span>
                                                            ))}
                                                        </div>
                                                        <div>
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
                                <h4 className="ai-card-title text-amber-700 font-bold">
                                    <AlertTriangle size={18} className="text-amber-500" /> Curriculum Anomalies
                                </h4>
                                <p className="ai-card-subtitle">Low demand, legacy warning, or skill coverage gap indicators.</p>

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
                            <div className="ai-chart-card" style={{ margin: 0, gridColumn: '1 / -1' }}>
                                <h4 className="ai-card-title">Theory vs Practical Split</h4>
                                <p className="ai-card-subtitle">Student preference ratio derived from survey responses.</p>

                                {(() => {
                                    const theory = overview.learning_preferences_data?.student_theory_percent || 0;
                                    const practical = overview.learning_preferences_data?.student_practical_percent || 0;
                                    const radius = 38;
                                    const circumference = 2 * Math.PI * radius;
                                    const theoryStroke = (theory / 100) * circumference;
                                    const practicalStroke = (practical / 100) * circumference;

                                    return (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', marginTop: '20px' }}>
                                            <div style={{ position: 'relative', width: '150px', height: '150px', flexShrink: 0 }}>
                                                <svg width="150" height="150" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                                                    {/* Practical segment */}
                                                    <circle
                                                        cx="50"
                                                        cy="50"
                                                        r={radius}
                                                        fill="transparent"
                                                        stroke="#7C3AED"
                                                        strokeWidth="18"
                                                        strokeDasharray={`${practicalStroke} ${circumference}`}
                                                        strokeDashoffset="0"
                                                    />
                                                    {/* Theory segment */}
                                                    <circle
                                                        cx="50"
                                                        cy="50"
                                                        r={radius}
                                                        fill="transparent"
                                                        stroke="#C084FC"
                                                        strokeWidth="18"
                                                        strokeDasharray={`${theoryStroke} ${circumference}`}
                                                        strokeDashoffset={-practicalStroke}
                                                    />
                                                </svg>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', width: '100%' }}>
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
                            </div>
                        </div>
                    )}
                </div>

                {/* Category 2: Combined Demand & Learning Preferences */}
                <div className="category-section category-indigo">
                    <div className="category-header">
                        <div className="category-title-wrapper">
                            <div className="category-icon-box indigo">
                                <Layers size={20} />
                            </div>
                            <div className="category-title-text">
                                <h3>Combined Demand & Learning Preferences</h3>
                                <p>Analysis of curriculum gaps and preferred academic training methods across student and industry databases</p>
                            </div>
                        </div>

                        {/* Score badge next to the title (right corner) */}
                        <div className="category-score-badge">
                            <span className="score-val">{overview.kpis.alignment !== null ? `${overview.kpis.alignment}%` : 'N/A'}</span>
                            <span className="score-label">Overall Curriculum Alignment</span>
                        </div>
                    </div>

                    <div className="ai-category-grid">
                        {/* Combined Curriculum Demand (Gaps) */}
                        <div className="ai-chart-card" style={{ margin: 0 }}>
                            <h4 className="ai-card-title">Combined Curriculum Demand</h4>
                            <p className="ai-card-subtitle">Combined demand scores for curriculum gaps from industry and student tables.</p>
                            <div className="ai-chart-body" style={{ marginTop: '12px' }}>
                                {overview.missing_subjects && overview.missing_subjects.length > 0 ? (
                                    overview.missing_subjects.map((sub: any, idx: number) => (
                                        <div key={idx} className="chart-bar-row">
                                            <div className="label"><span>{sub.name}</span> <span>{sub.combined_pct}%</span></div>
                                            <div className="bar-bg"><div className="bar-fill purple" style={{ width: `${sub.combined_pct}%` }}></div></div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-slate-400 py-6 text-sm">No curriculum gaps detected.</div>
                                )}
                            </div>
                        </div>

                        {/* Training Practices Requested */}
                        <div className="ai-chart-card" style={{ margin: 0 }}>
                            <h4 className="ai-card-title">Training Practices Requested</h4>
                            <p className="ai-card-subtitle">Academic training methods requested by graduate employers.</p>
                            <div className="ai-chart-body" style={{ marginTop: '12px' }}>
                                {overview.learning_preferences_data?.industry_practices && overview.learning_preferences_data?.industry_practices.length > 0 ? (
                                    overview.learning_preferences_data.industry_practices.map((p: any, idx: number) => (
                                        <div key={idx} className="chart-bar-row">
                                            <div className="label"><span>{p.name}</span> <span>{p.value}%</span></div>
                                            <div className="bar-bg"><div className="bar-fill indigo" style={{ width: `${p.value}%` }}></div></div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-slate-400 py-6 text-sm">Insufficient data points.</div>
                                )}
                            </div>
                        </div>

                        {/* Student Learning Preferences (Spans full width in row 2) */}
                        <div className="ai-chart-card" style={{ margin: 0, gridColumn: '1 / -1' }}>
                            <h4 className="ai-card-title">Student Learning Preferences</h4>
                            <p className="ai-card-subtitle">Teaching modes preferred by prospective applicants with industry alignment context.</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
                                {overview.learning_preferences_data?.student_methods && overview.learning_preferences_data?.student_methods.length > 0 ? (
                                    overview.learning_preferences_data.student_methods.map((m: any, idx: number) => (
                                        <div key={idx} style={{
                                            borderBottom: '1px solid #F1F5F9',
                                            paddingBottom: '12px',
                                            fontSize: '13px'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                <span style={{ fontWeight: 700, color: '#1E293B' }}>{m.name}</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontWeight: 800, color: '#7C3AED' }}>{m.value}% Student</span>
                                                    <span className={`evidence-alert-badge ${m.alignment_level === 'High' ? 'sufficient' : (m.alignment_level === 'Medium' ? 'sufficient' : 'insufficient')}`} style={{ margin: 0, padding: '2px 6px', fontSize: '9.5px', borderRadius: '4px' }}>
                                                        {m.alignment_level} Alignment
                                                    </span>
                                                </div>
                                            </div>
                                            <p style={{ margin: 0, color: '#64748B', fontSize: '12px', fontStyle: 'italic' }}>
                                                🎯 {m.industry_evidence}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-slate-400 py-6 text-sm">Insufficient data points.</div>
                                )}
                            </div>
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



// ─── District → Province lookup ─────────────────────────────────────────────
const DISTRICT_TO_PROVINCE: Record<string, string> = {
    colombo: 'Western', gampaha: 'Western', kalutara: 'Western',
    kandy: 'Central', matale: 'Central', 'nuwara eliya': 'Central',
    galle: 'Southern', matara: 'Southern', hambantota: 'Southern',
    jaffna: 'Northern', kilinochchi: 'Northern', mannar: 'Northern', mullaitivu: 'Northern', vavuniya: 'Northern',
    batticaloa: 'Eastern', ampara: 'Eastern', trincomalee: 'Eastern',
    kurunegala: 'North Western', puttalam: 'North Western',
    anuradhapura: 'North Central', polonnaruwa: 'North Central',
    badulla: 'Uva', monaragala: 'Uva',
    ratnapura: 'Sabaragamuwa', kegalle: 'Sabaragamuwa',
};

const PROVINCE_COLORS: Record<string, string> = {
    'Western': '#7C3AED', 'Central': '#2563EB', 'Southern': '#059669',
    'Northern': '#DC2626', 'Eastern': '#D97706', 'North Western': '#0891B2',
    'North Central': '#7C3AED', 'Uva': '#DB2777', 'Sabaragamuwa': '#65A30D',
};

const EDU_ORDER = ['Undergraduate', 'Advanced Level', 'Diploma Holder', 'Ordinary Level', 'Not Specified'];
const MAP_CHART_COLORS = ['#7C3AED', '#3B82F6', '#10B981', '#EC4899', '#F59E0B', '#06B6D4', '#EF4444', '#8B5CF6'];

interface GeoData {
    by_province: Record<string, Record<string, { name: string; score: number }[]>>;
    all_island: { name: string; score: number }[];
    district_counts: Record<string, number>;
}

const InteractiveSriLankaMap: React.FC = () => {
    const [geoData, setGeoData] = useState<GeoData | null>(null);
    const [loadingGeo, setLoadingGeo] = useState(true);
    const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
    const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
    const [allIslandMode, setAllIslandMode] = useState(false);
    const [selectedField, setSelectedField] = useState<string | null>(null);
    const [selectedEduLevel, setSelectedEduLevel] = useState<string | null>(null);
    const [skills, setSkills] = useState<{ name: string; score: number; percentage: number }[]>([]);
    const [loadingSkills, setLoadingSkills] = useState(false);
    const [allIslandSelectedField, setAllIslandSelectedField] = useState<string | null>(null);
    const [allIslandSkills, setAllIslandSkills] = useState<{ name: string; score: number; percentage: number }[]>([]);
    const [loadingAllIslandSkills, setLoadingAllIslandSkills] = useState(false);

    useEffect(() => {
        aiAnalyticsService.getGeographyData().then(d => {
            setGeoData(d); setLoadingGeo(false);
        }).catch(() => setLoadingGeo(false));
    }, []);

    const districtCounts = geoData?.district_counts || {};
    const maxCount = Math.max(...Object.values(districtCounts), 1);

    const getProvinceForDistrict = (name: string) => DISTRICT_TO_PROVINCE[name.toLowerCase()] || null;

    const getColorForDistrict = (name: string) => {
        const province = getProvinceForDistrict(name);
        const count = districtCounts[name] || 0;
        if (count === 0) return '#E2E8F0';
        const ratio = count / maxCount;
        const base = PROVINCE_COLORS[province || ''] || '#7C3AED';
        if (ratio < 0.25) return `${base}40`;
        if (ratio < 0.5) return `${base}80`;
        if (ratio < 0.75) return `${base}BB`;
        return base;
    };

    const handleDistrictClick = (districtName: string) => {
        const province = getProvinceForDistrict(districtName);
        if (!province) return;
        setAllIslandMode(false);
        setSelectedProvince(province);
        setSelectedField(null);
        setSelectedEduLevel(null);
        setSkills([]);
    };

    const handleFieldClick = async (field: string, eduLevel: string) => {
        setSelectedField(field);
        setSelectedEduLevel(eduLevel);
        setLoadingSkills(true);
        setSkills([]);
        try {
            const data = await aiAnalyticsService.getGeographySkills(field, selectedProvince || '', eduLevel);
            setSkills(data.skills || []);
        } catch { setSkills([]); }
        finally { setLoadingSkills(false); }
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

    const allIslandPieData = (geoData?.all_island || []).slice(0, 8).map(f => ({ ...f, value: f.score }));
    const provinceData = selectedProvince && geoData?.by_province[selectedProvince] ? geoData.by_province[selectedProvince] : null;
    const sortedEduLevels = provinceData
        ? EDU_ORDER.filter(e => provinceData[e]).concat(Object.keys(provinceData).filter(e => !EDU_ORDER.includes(e)))
        : [];

    const mapTooltipStyle: React.CSSProperties = {
        position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)',
        background: '#1E293B', color: '#FFF', padding: '6px 12px', borderRadius: '8px',
        fontSize: '11px', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 10,
    };

    return (
        <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', padding: '28px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>Geographic Interest Distribution</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Click a district to explore academic interests by education level. Click a field to see top skills.</p>
                </div>
                <button onClick={() => { setAllIslandMode(!allIslandMode); setSelectedProvince(null); setSelectedField(null); setAllIslandSelectedField(null); setAllIslandSkills([]); setSkills([]); }}
                    style={{ padding: '8px 18px', borderRadius: '10px', border: allIslandMode ? '2px solid #7C3AED' : '1.5px solid #CBD5E1', background: allIslandMode ? '#7C3AED' : '#FFFFFF', color: allIslandMode ? '#FFFFFF' : '#475569', fontWeight: 700, fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s ease', whiteSpace: 'nowrap' }}>
                    🌐 All Island
                </button>
            </div>

            {loadingGeo ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '360px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #E9D5FF', borderTopColor: '#7C3AED', animation: 'spin 0.9s linear infinite', margin: '0 auto 12px auto' }}></div>
                        <span style={{ fontSize: '13px', color: '#94A3B8' }}>Loading geographic data…</span>
                    </div>
                </div>
            ) : allIslandMode ? (
                <div style={{ display: 'grid', gridTemplateColumns: allIslandSelectedField ? '1fr 1fr' : '1fr', gap: '32px', alignItems: 'flex-start' }}>
                    <div>
                        <p style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: 700, color: '#374151' }}>Top Interest Fields — All Island <span style={{ fontSize: '11px', fontWeight: 500, color: '#94A3B8', marginLeft: '8px' }}>click a slice to see skills</span></p>
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
                            <p style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: 700, color: '#374151' }}>Top Skills for "{allIslandSelectedField}"</p>
                            <p style={{ margin: '0 0 16px 0', fontSize: '11px', color: '#94A3B8' }}>All Island · All Education Levels</p>
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
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: selectedProvince ? '220px 1fr 1fr' : '220px 1fr', gap: '24px', alignItems: 'flex-start' }}>
                    <div style={{ position: 'relative' }}>
                        <svg viewBox={SriLankaMapData.viewBox} style={{ width: '100%', maxHeight: '400px', cursor: 'pointer' }}>
                            {SriLankaMapData.locations.map((loc: any) => {
                                const province = getProvinceForDistrict(loc.name);
                                const isSelected = province === selectedProvince;
                                const isHovered = hoveredDistrict === loc.name;
                                return (
                                    <path key={loc.id} d={loc.path} fill={getColorForDistrict(loc.name)}
                                        stroke={isSelected ? '#0F172A' : isHovered ? '#7C3AED' : '#FFFFFF'}
                                        strokeWidth={isSelected ? '2.5' : isHovered ? '2' : '1'}
                                        style={{ transition: 'all 0.18s ease', outline: 'none' }}
                                        onMouseEnter={() => setHoveredDistrict(loc.name)}
                                        onMouseLeave={() => setHoveredDistrict(null)}
                                        onClick={() => handleDistrictClick(loc.name)}>
                                        <title>{loc.name}{province ? ` (${province})` : ''}: {districtCounts[loc.name] || 0} applicants</title>
                                    </path>
                                );
                            })}
                        </svg>
                        {hoveredDistrict && <div style={mapTooltipStyle}>{hoveredDistrict} · {districtCounts[hoveredDistrict] || 0} applicants</div>}
                        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {Object.entries(PROVINCE_COLORS).map(([p, c]) => (
                                <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#475569' }}>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: c, flexShrink: 0 }} />{p}
                                </div>
                            ))}
                        </div>
                    </div>

                    {selectedProvince && provinceData && (
                        <div style={{ background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '20px', animation: 'fadeInRight 0.25s ease', maxHeight: '520px', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div>
                                    <h5 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>{selectedProvince} Province</h5>
                                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748B' }}>Top interest fields · click a field to see skills</p>
                                </div>
                                <button onClick={() => { setSelectedProvince(null); setSelectedField(null); setSkills([]); }}
                                    style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#94A3B8', lineHeight: 1 }}>×</button>
                            </div>
                            {sortedEduLevels.map(eduLevel => {
                                const fields = provinceData[eduLevel] || [];
                                return (
                                    <div key={eduLevel} style={{ marginBottom: '16px' }}>
                                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7C3AED' }} />{eduLevel}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {fields.slice(0, 3).map((f, idx) => {
                                                const isActive = selectedField === f.name && selectedEduLevel === eduLevel;
                                                return (
                                                    <button key={idx} onClick={() => handleFieldClick(f.name, eduLevel)}
                                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', border: isActive ? '1.5px solid #7C3AED' : '1px solid #E2E8F0', background: isActive ? '#EDE9FE' : '#FFFFFF', textAlign: 'left', transition: 'all 0.15s ease', width: '100%' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: MAP_CHART_COLORS[idx], color: '#FFF', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{idx + 1}</span>
                                                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#1E293B' }}>{f.name}</span>
                                                        </div>
                                                        <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>{f.score}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {selectedProvince && selectedField && (
                        <div style={{ background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '20px', animation: 'fadeInRight 0.25s ease' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <h5 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>Top Skills</h5>
                                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748B' }}>{selectedField} · {selectedEduLevel}</p>
                            </div>
                            {loadingSkills ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '3px solid #E9D5FF', borderTopColor: '#7C3AED', animation: 'spin 0.9s linear infinite' }}></div>
                                </div>
                            ) : skills.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8', fontSize: '13px' }}>No skill data for this field.</div>
                            ) : (
                                <>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <PieChart>
                                            <Pie data={skills.map(s => ({ ...s, value: s.score }))} cx="50%" cy="50%" outerRadius={85} paddingAngle={2} dataKey="value">
                                                {skills.map((_, i) => <Cell key={i} fill={MAP_CHART_COLORS[i % MAP_CHART_COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip content={({ active, payload }: any) => {
                                                if (active && payload?.length) {
                                                    const p = payload[0].payload;
                                                    return <div style={{ background: '#1E293B', color: '#FFF', padding: '8px 12px', borderRadius: '8px', fontSize: '11px' }}><div style={{ fontWeight: 700, textTransform: 'capitalize' }}>{p.name}</div><div style={{ opacity: 0.8, marginTop: 2 }}>{p.percentage}%</div></div>;
                                                }
                                                return null;
                                            }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                                        {skills.map((s, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: MAP_CHART_COLORS[i % MAP_CHART_COLORS.length], flexShrink: 0 }} />
                                                <span style={{ fontSize: '12px', color: '#1E293B', fontWeight: 600, textTransform: 'capitalize', flex: 1 }}>{s.name}</span>
                                                <div style={{ height: '6px', borderRadius: '3px', background: '#EDE9FE', flex: 2, overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${s.percentage}%`, background: MAP_CHART_COLORS[i % MAP_CHART_COLORS.length], borderRadius: '3px' }} />
                                                </div>
                                                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, minWidth: '36px', textAlign: 'right' }}>{s.percentage}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {!selectedProvince && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', color: '#94A3B8', padding: '40px' }}>
                            <div style={{ fontSize: '40px' }}>🗺️</div>
                            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>Click a district on the map<br />to explore academic interests</p>
                            <p style={{ margin: 0, fontSize: '11px', textAlign: 'center' }}>Or use "All Island" to see<br />a full pie chart overview</p>
                        </div>
                    )}
                </div>
            )}
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px', alignItems: 'center' }}>
                    {/* Bar Chart */}
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart
                            data={data}
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
                                {data.map((_, i) => (
                                    <Cell
                                        key={i}
                                        fill={UNI_OPP_COLORS[i % UNI_OPP_COLORS.length]}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>

                    {/* Ranked list panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {data.map((item, i) => (
                            <div
                                key={i}
                                onMouseEnter={() => setActiveIndex(i)}
                                onMouseLeave={() => setActiveIndex(null)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '10px 14px',
                                    borderRadius: '10px',
                                    background: activeIndex === i ? '#F5F3FF' : '#F8FAFC',
                                    border: activeIndex === i ? '1.5px solid #7C3AED' : '1px solid #E2E8F0',
                                    cursor: 'default',
                                    transition: 'all 0.15s ease',
                                }}
                            >
                                {/* Rank badge */}
                                <div style={{
                                    width: '26px', height: '26px', borderRadius: '8px',
                                    background: UNI_OPP_COLORS[i % UNI_OPP_COLORS.length],
                                    color: '#FFF', fontSize: '11px', fontWeight: 800,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    {i + 1}
                                </div>
                                {/* Label + bar */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {item.name}
                                    </div>
                                    <div style={{ height: '5px', borderRadius: '3px', background: '#E2E8F0', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${item.percentage}%`,
                                            background: UNI_OPP_COLORS[i % UNI_OPP_COLORS.length],
                                            borderRadius: '3px',
                                            transition: 'width 0.4s ease',
                                        }} />
                                    </div>
                                </div>
                                {/* Percentage */}
                                <span style={{ fontSize: '13px', fontWeight: 800, color: UNI_OPP_COLORS[i % UNI_OPP_COLORS.length], minWidth: '48px', textAlign: 'right' }}>
                                    {item.percentage}%
                                </span>
                                <span style={{ fontSize: '10px', color: '#94A3B8', minWidth: '28px', textAlign: 'right' }}>
                                    ({item.count})
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

