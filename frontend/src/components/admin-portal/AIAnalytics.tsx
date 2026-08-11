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
    const [viewMode, setViewMode] = useState<'hub' | 'course' | 'common'>('hub');

    const [syncing, setSyncing] = useState(false);
    const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

    // Toast notification state
    const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info' }[]>([]);
    const toastIdRef = React.useRef(0);

    // Confirmation modal state
    const [confirmModal, setConfirmModal] = useState<{ open: boolean; onConfirm: () => void }>({ open: false, onConfirm: () => {} });

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
            if (globalData && globalData.emerging_technologies) {
                setGlobalEmergingTech(globalData.emerging_technologies);
            }
            if (globalData && globalData.last_sync_at) {
                setLastSyncedAt(globalData.last_sync_at);
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
                setConfirmModal({ open: false, onConfirm: () => {} });
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
                    <p>Loading AI Roadmap...</p>
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
                <div className="confirm-modal-backdrop" onClick={() => setConfirmModal({ open: false, onConfirm: () => {} })}>
                    <div className="confirm-modal-card" onClick={e => e.stopPropagation()}>
                        <div className="confirm-modal-icon-wrap">
                            <RefreshCw size={28} />
                        </div>
                        <h3 className="confirm-modal-title">Run Full Sync?</h3>
                        <p className="confirm-modal-desc">
                            This will download the latest Student and Industry survey sheets from Google Sheets, update local databases, and run the AI matching algorithms. The process may take 1–2 minutes.
                        </p>
                        <div className="confirm-modal-actions">
                            <button className="confirm-modal-btn cancel" onClick={() => setConfirmModal({ open: false, onConfirm: () => {} })}>Cancel</button>
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
            ) : viewMode === 'common' ? (
                <CommonAnalyticsDashboard onBack={() => setViewMode('hub')} />
            ) : (
                <ProgramHub
                    programs={programs}
                    globalEmergingTech={globalEmergingTech}
                    onSelect={(c) => { setSelectedCourse(c); setViewMode('course'); }}
                    onOpenSync={handleDirectSync}
                    onOpenManageForms={() => navigate('/admin/ai-analytics/manage-forms')}
                    onOpenCommonAnalytics={() => setViewMode('common')}
                    syncing={syncing}
                    lastSyncedAt={lastSyncedAt}
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
    onOpenCommonAnalytics: () => void,
    syncing?: boolean,
    lastSyncedAt?: string | null
}> = ({ programs, globalEmergingTech, onSelect, onOpenSync, onOpenManageForms, onOpenCommonAnalytics, syncing, lastSyncedAt }) => {
    const [levelFilter, setLevelFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

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
                        <button className="admin-btn-outline" onClick={onOpenCommonAnalytics}>
                            <BarChart2 size={16} /> Common Student Analytics
                        </button>
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

    if (!overview || Object.keys(overview).length === 0 || !overview.kpis) {
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
                    <Database size={48} className="text-slate-300 mb-4" />
                    <h3>No AI Analytics Generated Yet</h3>
                    <p className="mb-4">There is no synchronized survey data matching the academic scope of <strong>{course.title}</strong>.</p>
                    <p className="text-sm">Please return to the hub and sync the Google Sheets data.</p>
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

                    <div className="flex items-center gap-2 mt-2" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
            <div className="pdf-insights-section" style={{ display: activeTab === 'insights' ? 'flex' : 'none', flexDirection: 'column', gap: '36px' }}>
                <h3 className="pdf-only-title" style={{ display: 'none', fontSize: '20px', fontWeight: 800, color: '#1E293B', borderBottom: '2px solid #E2E8F0', paddingBottom: '8px', marginBottom: '24px', marginTop: '24px' }}>I. AI Analytics & Survey Insights</h3>

                {/* Category 1: Curriculum & Teaching Delivery */}
                <div className="category-section" style={{ background: '#FAF5FF50', border: '1px solid #7C3AED10', padding: '28px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(124, 58, 237, 0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ backgroundColor: '#F3E8FF', color: '#7C3AED', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <BookOpen size={20} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#4C1D95', margin: 0 }}>Curriculum & Delivery Insights</h3>
                                <p style={{ fontSize: '13px', color: '#6B21A8', margin: '2px 0 0 0', fontWeight: 500 }}>Analysis of curriculum scope, subject coverage, delivery split, and curriculum anomalies</p>
                            </div>
                        </div>

                        {/* Score badge next to the title (right corner) */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', backgroundColor: '#F3E8FF70', padding: '10px 18px', borderRadius: '16px', border: '1px solid #7C3AED15' }}>
                            <span style={{ fontSize: '24px', fontWeight: 800, color: '#7C3AED', lineHeight: 1.1 }}>{overview.coverage_percent !== null ? `${overview.coverage_percent}%` : 'N/A'}</span>
                            <span style={{ fontSize: '12px', fontWeight: 500, color: '#6B21A8', marginTop: '4px' }}>Curriculum Coverage</span>
                        </div>
                    </div>

                    <div className="ai-category-grid">
                        {/* Missing Core Subjects */}
                        <div className="ai-chart-card" style={{ borderLeft: '5px solid #EF4444', margin: 0 }}>
                            <h4 className="flex items-center gap-2 text-red-700 font-bold" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <ShieldAlert size={18} className="text-red-500" /> Missing Core Subjects
                            </h4>
                            <p className="text-slate-400 text-xs mb-4" style={{ margin: '0 0 16px 0', fontSize: '12px', fontWeight: 500 }}>Demanded domains completely absent from the current curriculum.</p>
                            {overview.missing_subjects && overview.missing_subjects.length > 0 ? (
                                <div className="tag-container">
                                    {overview.missing_subjects.map((domain: string, idx: number) => (
                                        <span key={idx} className="tag missing">
                                            {domain}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', padding: '16px', borderRadius: '12px' }}>
                                    <CheckCircle size={20} />
                                    <span className="text-sm font-semibold">All required core technology domains are covered by the curriculum.</span>
                                </div>
                            )}
                        </div>

                        {/* Curriculum Anomalies */}
                        <div className="ai-chart-card" style={{ borderLeft: '5px solid #F59E0B', margin: 0 }}>
                            <h4 className="flex items-center gap-2 text-amber-700 font-bold" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <AlertTriangle size={18} className="text-amber-500" /> Curriculum Anomalies
                            </h4>
                            <p className="text-slate-400 text-xs mb-4" style={{ margin: '0 0 16px 0', fontSize: '12px', fontWeight: 500 }}>Legacy subjects or subjects with low survey demand.</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {((overview.outdated_subjects && overview.outdated_subjects.length > 0) ||
                                    (overview.low_demand_subjects && overview.low_demand_subjects.length > 0)) ? (
                                    <>
                                        {overview.outdated_subjects.map((sub: any, idx: number) => (
                                            <div key={`out-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', padding: '12px 16px', borderRadius: '12px', fontSize: '13px' }}>
                                                <strong style={{ color: '#92400E' }}>{sub.code}: {sub.name}</strong>
                                                <span style={{ color: '#B45309', fontWeight: 'bold' }}>Legacy Tech Warning</span>
                                            </div>
                                        ))}
                                        {overview.low_demand_subjects.map((sub: any, idx: number) => (
                                            <div key={`low-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px 16px', borderRadius: '12px', fontSize: '13px' }}>
                                                <strong style={{ color: '#334155' }}>{sub.code}: {sub.name}</strong>
                                                <span style={{ color: '#64748B', fontWeight: '600' }}>Low Demand (&lt;5%)</span>
                                            </div>
                                        ))}
                                    </>
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

                        {/* Student Preferred Learning Methods */}
                        <div className="ai-chart-card" style={{ margin: 0 }}>
                            <h4>Student Preferred Learning Methods</h4>
                            <p className="text-slate-400 text-xs mb-4" style={{ margin: '0 0 16px 0', fontSize: '12px', fontWeight: 500 }}>Teaching modes preferred by prospective applicants.</p>
                            <div className="ai-chart-body" style={{ marginTop: '12px' }}>
                                {overview.learning_preferences_data?.student_methods && overview.learning_preferences_data?.student_methods.length > 0 ? (
                                    overview.learning_preferences_data.student_methods.map((m: any, idx: number) => (
                                        <div key={idx} className="chart-bar-row">
                                            <div className="label"><span>{m.name}</span> <span>{m.value}%</span></div>
                                            <div className="bar-bg"><div className="bar-fill purple" style={{ width: `${m.value}%` }}></div></div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-slate-400 py-6 text-sm">Insufficient data points.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Category 2: Student Interest & Alignment */}
                <div className="category-section" style={{ background: '#EEF2FF50', border: '1px solid #4F46E510', padding: '28px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(79, 70, 229, 0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ backgroundColor: '#E0E7FF', color: '#4F46E5', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Users size={20} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E1B4B', margin: 0 }}>Student Interest & Alignment</h3>
                                <p style={{ fontSize: '13px', color: '#312E81', margin: '2px 0 0 0', fontWeight: 500 }}>Alignment of course subjects against student applicant trends and demand</p>
                            </div>
                        </div>

                        {/* Score badge next to the title (right corner) */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', backgroundColor: '#E0E7FF70', padding: '10px 18px', borderRadius: '16px', border: '1px solid #4F46E515' }}>
                            <span style={{ fontSize: '24px', fontWeight: 800, color: '#4F46E5', lineHeight: 1.1 }}>{overview.kpis.studentMatch !== null ? `${overview.kpis.studentMatch}%` : 'N/A'}</span>
                            <span style={{ fontSize: '12px', fontWeight: 500, color: '#312E81', marginTop: '4px' }}>Student Demand Alignment</span>
                        </div>
                    </div>

                    {/* Student Demand (Top Fields) rendered directly as a single balanced card */}
                    <div className="ai-chart-card" style={{ margin: 0 }}>
                        <h4>Student Demand (Top Fields)</h4>
                        <p className="text-slate-400 text-sm mb-4" style={{ margin: '0 0 16px 0', fontSize: '12px', fontWeight: 500 }}>Most requested semantic clusters among applicants.</p>
                        <div className="ai-chart-body">
                            {studentData && studentData.length > 0 ? (
                                studentData.slice(0, 6).map((d: any) => (
                                    <div key={d.name} className="chart-bar-row">
                                        <div className="label"><span>{d.name}</span> <span>{d.value}%</span></div>
                                        <div className="bar-bg"><div className="bar-fill purple" style={{ width: `${d.value}%` }}></div></div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-slate-400 py-6 text-sm">Insufficient data points.</div>
                            )}
                        </div>
                    </div>
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

                    <div className="ai-category-grid">
                        {/* Industry Expected Practices */}
                        <div className="ai-chart-card" style={{ margin: 0 }}>
                            <h4>Industry Expected Practices</h4>
                            <p className="text-slate-400 text-xs mb-4" style={{ margin: '0 0 16px 0', fontSize: '12px', fontWeight: 500 }}>Academic training methods requested by graduate employers.</p>
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

                        {/* Graduate Skill Shortages */}
                        <div className="ai-chart-card" style={{ borderLeft: '5px solid #EF4444', margin: 0 }}>
                            <h4 className="flex items-center gap-2 text-red-700 font-bold" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <AlertTriangle size={18} className="text-red-500" /> Graduate Skill Shortages
                            </h4>
                            <p className="text-slate-400 text-xs mb-4" style={{ margin: '0 0 16px 0', fontSize: '12px', fontWeight: 500 }}>Industry reported graduate capability deficits.</p>
                            {skillGap && skillGap.missing_skills && skillGap.missing_skills.length > 0 ? (
                                <div className="tag-container">
                                    {skillGap.missing_skills.map((skill: string, idx: number) => (
                                        <span key={idx} className="tag missing">{skill}</span>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center p-6 bg-green-50 text-green-700 rounded-lg border border-green-200 gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', padding: '16px', borderRadius: '12px' }}>
                                    <CheckCircle size={20} />
                                    <span>No graduate capability deficits reported.</span>
                                </div>
                            )}
                        </div>

                        {/* Industry Gaps (Top Demands) (Spans full width in row 2) */}
                        <div className="ai-chart-card" style={{ margin: 0, gridColumn: '1 / -1' }}>
                            <h4>Industry Gaps (Top Demands)</h4>
                            <p className="text-slate-400 text-sm mb-4" style={{ margin: '0 0 16px 0', fontSize: '12px', fontWeight: 500 }}>Technologies most heavily requested by employers.</p>
                            <div className="ai-chart-body">
                                {industryData && industryData.length > 0 ? (
                                    industryData.slice(0, 6).map((d: any) => (
                                        <div key={d.name} className="chart-bar-row">
                                            <div className="label"><span>{d.name}</span> <span>{d.value}%</span></div>
                                            <div className="bar-bg"><div className="bar-fill indigo" style={{ width: `${d.value}%` }}></div></div>
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

/* =========================================================
   COMMON STUDENT ANALYTICS COMPONENTS
   ========================================================= */

const DonutChart: React.FC<{
    data: any[],
    onSliceClick: (fieldName: string) => void,
    selectedField: string | null
}> = ({ data, onSliceClick, selectedField }) => {
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    let accumulatedPercent = 0;

    const colors = [
        '#7C3AED', // Purple
        '#3B82F6', // Blue
        '#10B981', // Emerald
        '#EC4899', // Pink
        '#F59E0B', // Amber
        '#06B6D4', // Cyan
        '#94A3B8'  // Slate
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <div style={{ position: 'relative', width: '220px', height: '220px' }}>
                <svg width="220" height="220" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}>
                    {data.map((item, index) => {
                        const percent = item.value;
                        const strokeLength = (percent / 100) * circumference;
                        const strokeOffset = circumference - ((accumulatedPercent / 100) * circumference);
                        accumulatedPercent += percent;

                        const color = colors[index % colors.length];
                        const isSelected = selectedField === item.name;

                        return (
                            <circle
                                key={item.name}
                                cx="100"
                                cy="100"
                                r={radius}
                                fill="transparent"
                                stroke={color}
                                strokeWidth={isSelected ? "22" : "16"}
                                strokeDasharray={`${strokeLength} ${circumference}`}
                                strokeDashoffset={strokeOffset}
                                style={{
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer',
                                    opacity: selectedField ? (isSelected ? 1.0 : 0.4) : 0.95
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSelected) e.currentTarget.style.opacity = '1.0';
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected && selectedField) e.currentTarget.style.opacity = '0.4';
                                    else if (!isSelected) e.currentTarget.style.opacity = '0.95';
                                }}
                                onClick={() => onSliceClick(item.name)}
                            >
                                <title>{item.name}: {item.count} responses ({item.value}%)</title>
                            </circle>
                        );
                    })}
                    <circle cx="100" cy="100" r={radius - 12} fill="#FFFFFF" />
                </svg>
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    pointerEvents: 'none'
                }}>
                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Selected Field
                    </span>
                    <div style={{ fontSize: '14px', fontWeight: '900', color: '#1E293B', marginTop: '2px', maxWidth: '140px', lineHeight: 1.2 }}>
                        {selectedField || "Click a slice"}
                    </div>
                </div>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', maxWidth: '340px' }}>
                {data.map((item, index) => {
                    const color = colors[index % colors.length];
                    const isSelected = selectedField === item.name;
                    return (
                        <div
                            key={item.name}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '12px',
                                fontWeight: isSelected ? '700' : '500',
                                color: isSelected ? '#1E293B' : '#64748B',
                                cursor: 'pointer'
                            }}
                            onClick={() => onSliceClick(item.name)}
                        >
                            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color }}></span>
                            <span>{item.name} ({item.value}%)</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const FieldSkillDrilldown: React.FC<{
    field: string,
    skillsData: any[],
    loading: boolean
}> = ({ field, skillsData, loading }) => {
    return (
        <div className="ai-chart-card" style={{ borderLeft: '5px solid #10B981' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#065F46', fontWeight: '800' }}>
                <Sparkles size={18} className="text-emerald-500" /> Skill Demand for {field}
            </h4>
            <p className="text-slate-400 text-xs mb-4" style={{ margin: '0 0 16px 0', fontSize: '12px', fontWeight: 500 }}>
                Normalized skill/domain demand filtered strictly by students interested in {field}.
            </p>
            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', padding: '48px 0' }}>
                    <div className="loading-spinner small"></div>
                    <span className="text-sm text-slate-400">Loading skill demands...</span>
                </div>
            ) : (
                <div className="ai-chart-body" style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {skillsData && skillsData.length > 0 ? (
                        skillsData.map((s: any, idx: number) => (
                            <div key={idx} className="chart-bar-row">
                                <div className="label">
                                    <span>{s.name}</span>
                                    <span>{s.count} ({s.value}%)</span>
                                </div>
                                <div className="bar-bg">
                                    <div className="bar-fill emerald" style={{ width: `${s.value}%` }}></div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-slate-400 py-6 text-sm">No skill demand data for this field.</div>
                    )}
                </div>
            )}
        </div>
    );
};

const ProvinceInterests: React.FC<{ data: any }> = ({ data }) => {
    const provinces = Object.keys(data);

    if (provinces.length === 0) {
        return (
            <div className="ai-chart-card">
                <div className="text-center text-slate-400 py-6 text-sm">No province data available.</div>
            </div>
        );
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {provinces.map((prov) => {
                const fields = data[prov];
                return (
                    <div key={prov} className="ai-chart-card" style={{ borderTop: '4px solid #3B82F6' }}>
                        <h4 style={{ color: '#1E3A8A', fontSize: '15px', fontWeight: '800', marginBottom: '12px' }}>
                            {prov} Province
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {fields.map((f: any) => (
                                <div key={f.field} className="chart-bar-row">
                                    <div className="label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                        <span style={{ fontWeight: '700', color: '#334155' }}>
                                            #{f.rank} {f.field}
                                        </span>
                                        <span style={{ color: '#64748B', fontWeight: '600' }}>
                                            {f.percentage}%
                                        </span>
                                    </div>
                                    <div className="bar-bg" style={{ height: '8px', borderRadius: '4px' }}>
                                        <div
                                            className="bar-fill blue"
                                            style={{
                                                width: `${f.percentage}%`,
                                                height: '100%',
                                                backgroundColor: '#3B82F6',
                                                borderRadius: '4px'
                                            }}
                                            title={`${f.field}: ${f.count} weighted responses (${f.percentage}%)`}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const HighDemandSkills: React.FC<{ skills: any[] }> = ({ skills }) => {
    return (
        <div className="ai-chart-card" style={{ borderLeft: '5px solid #F59E0B' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#78350F', fontWeight: '800' }}>
                <TrendingUp size={18} className="text-amber-500" /> High-Demand Skills
            </h4>
            <p className="text-slate-400 text-xs mb-4" style={{ margin: '0 0 16px 0', fontSize: '12px', fontWeight: 500 }}>Ranked horizontal bar chart of high-growth / high-demand skill domains.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {skills && skills.length > 0 ? (
                    skills.map((s: any, idx: number) => (
                        <div key={idx} className="chart-bar-row">
                            <div className="label">
                                <span>#{s.rank} {s.name}</span>
                                <span>{s.count} ({s.percentage}%)</span>
                            </div>
                            <div className="bar-bg">
                                <div className="bar-fill amber" style={{ width: `${s.percentage}%` }}></div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-slate-400 py-6 text-sm">Insufficient data points.</div>
                )}
            </div>
        </div>
    );
};

const OpportunitiesExpected: React.FC<{ opportunities: any[] }> = ({ opportunities }) => {
    return (
        <div className="ai-chart-card">
            <h4>University Opportunities Students Expect</h4>
            <p className="text-slate-400 text-xs mb-4" style={{ margin: '0 0 16px 0', fontSize: '12px', fontWeight: 500 }}>Recurring opportunity themes grouped dynamically from survey feedback.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {opportunities && opportunities.length > 0 ? (
                    opportunities.map((o: any, idx: number) => (
                        <div key={idx} className="chart-bar-row">
                            <div className="label"><span>{o.name}</span> <span>{o.count} ({o.percentage}%)</span></div>
                            <div className="bar-bg"><div className="bar-fill blue" style={{ width: `${o.percentage}%` }}></div></div>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-slate-400 py-6 text-sm">Insufficient data points.</div>
                )}
            </div>
        </div>
    );
};

const BalanceDonutChart: React.FC<{ data: any[] }> = ({ data }) => {
    const activeData = data.filter(item => item.count > 0);
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    let accumulatedPercent = 0;

    const colorMap: { [key: string]: string } = {
        '1 (100% Theory)': '#EF4444',
        '2 (Mostly Theory)': '#F59E0B',
        '3 (Balanced)': '#3B82F6',
        '4 (Mostly Practical)': '#10B981',
        '5 (100% Practical)': '#7C3AED'
    };

    if (activeData.length === 0) {
        return <div className="text-center text-slate-400 py-6 text-sm">No data available.</div>;
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '20px', width: '100%', flexWrap: 'wrap', marginTop: '10px' }}>
            <div style={{ position: 'relative', width: '130px', height: '130px' }}>
                <svg width="130" height="130" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
                    {activeData.map((item) => {
                        const percent = item.percentage;
                        const strokeLength = (percent / 100) * circumference;
                        const strokeOffset = circumference - ((accumulatedPercent / 100) * circumference);
                        accumulatedPercent += percent;

                        const color = colorMap[item.label] || '#94A3B8';

                        return (
                            <circle
                                key={item.label}
                                cx="70"
                                cy="70"
                                r={radius}
                                fill="transparent"
                                stroke={color}
                                strokeWidth="12"
                                strokeDasharray={`${strokeLength} ${circumference}`}
                                strokeDashoffset={strokeOffset}
                                style={{ opacity: 0.95 }}
                            >
                                <title>{item.label}: {item.count} responses ({item.percentage}%)</title>
                            </circle>
                        );
                    })}
                    <circle cx="70" cy="70" r={radius - 8} fill="#FFFFFF" />
                </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {activeData.map((item) => {
                    const color = colorMap[item.label] || '#94A3B8';
                    return (
                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569', fontWeight: 600 }}>
                            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '3px', backgroundColor: color }}></span>
                            <span>{item.label}: {item.count} ({item.percentage}%)</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const LearningPreferences: React.FC<{ methods: any[], balance: any[] }> = ({ methods, balance }) => {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {/* Preferred Learning Methods */}
            <div className="ai-chart-card">
                <h4>Preferred Learning Methods</h4>
                <p className="text-slate-400 text-xs mb-4" style={{ margin: '0 0 16px 0', fontSize: '12px', fontWeight: 500 }}>Ranked teaching modes selected by students in surveys.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {methods && methods.length > 0 ? (
                        methods.map((m: any, idx: number) => (
                            <div key={idx} className="chart-bar-row">
                                <div className="label"><span>{m.name}</span> <span>{m.count} ({m.percentage}%)</span></div>
                                <div className="bar-bg"><div className="bar-fill purple" style={{ width: `${m.percentage}%` }}></div></div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-slate-400 py-6 text-sm">Insufficient data points.</div>
                    )}
                </div>
            </div>

            {/* Learning Balance Donut Chart */}
            <div className="ai-chart-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h4 style={{ alignSelf: 'flex-start' }}>Learning Balance Distribution</h4>
                <p className="text-slate-400 text-xs mb-4" style={{ alignSelf: 'flex-start', margin: '0 0 16px 0', fontSize: '12px', fontWeight: 500 }}>Proportional breakdown of theory vs practical learning preferences.</p>
                <BalanceDonutChart data={balance} />
            </div>
        </div>
    );
};

const CommonAnalyticsDashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [selectedField, setSelectedField] = useState<string | null>(null);
    const [drilldownData, setDrilldownData] = useState<any[]>([]);
    const [drilldownLoading, setDrilldownLoading] = useState(false);

    useEffect(() => {
        const fetchCommonOverview = async () => {
            setLoading(true);
            try {
                const res = await aiAnalyticsService.getCommonOverview();
                setData(res);
                if (res.overall_demand && res.overall_demand.length > 0) {
                    const firstField = res.overall_demand[0].name;
                    setSelectedField(firstField);
                    fetchDrilldown(firstField);
                }
            } catch (err) {
                console.error("Failed to load common student analytics", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCommonOverview();
    }, []);

    const fetchDrilldown = async (field: string) => {
        if (field === 'Other') {
            setDrilldownData([]);
            return;
        }
        setDrilldownLoading(true);
        try {
            const res = await aiAnalyticsService.getCommonDrilldown(field);
            setDrilldownData(res);
        } catch (err) {
            console.error("Failed to load drilldown data", err);
        } finally {
            setDrilldownLoading(false);
        }
    };

    const handleSliceClick = (field: string) => {
        setSelectedField(field);
        fetchDrilldown(field);
    };

    if (loading) {
        return (
            <div className="loading-spinner-container">
                <div className="loading-spinner"></div>
                <p>Aggregating University-wide Student Analytics...</p>
            </div>
        );
    }

    if (!data || data.total_surveys === 0) {
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
                    <Database size={48} className="text-slate-300 mb-4" />
                    <h3>No Common Student Analytics Available</h3>
                    <p className="mb-4">There are currently no student interest surveys loaded in the database.</p>
                    <p className="text-sm">Please return to the hub and sync the Google Sheets data.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10" style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6" style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <button
                        className="cm-back-text-btn"
                        onClick={onBack}
                        style={{ marginBottom: '16px' }}
                    >
                        <ArrowLeft size={16} /> Back to Programs
                    </button>
                    <h1 className="admin-page-title">Common Student Analytics</h1>
                    <p className="text-slate-500 text-sm mt-1" style={{ fontWeight: 600 }}>University-wide student demand and academic interest insights across {data.total_surveys} surveys.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                <div className="ai-chart-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h4 style={{ alignSelf: 'flex-start' }}>Overall Student Demand by Academic Field</h4>
                    <p className="text-slate-400 text-xs mb-6" style={{ alignSelf: 'flex-start', margin: '0 0 24px 0', fontSize: '12px', fontWeight: 500 }}>
                        Click a slice of the donut to drill down into field-specific skill demands.
                    </p>
                    <DonutChart
                        data={data.overall_demand}
                        onSliceClick={handleSliceClick}
                        selectedField={selectedField}
                    />
                </div>

                <FieldSkillDrilldown
                    field={selectedField || "None"}
                    skillsData={drilldownData}
                    loading={drilldownLoading}
                />
            </div>

            <div>
                <h3 className="text-xl font-bold text-slate-800 mb-4" style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px' }}>
                    Student Interests by Province
                </h3>
                <ProvinceInterests data={data.provinces_data} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                <HighDemandSkills skills={data.high_demand_skills} />
                <OpportunitiesExpected opportunities={data.opportunities} />
            </div>

            <div>
                <h3 className="text-xl font-bold text-slate-800 mb-4" style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px' }}>
                    Learning Preferences
                </h3>
                <LearningPreferences methods={data.learning_methods} balance={data.learning_balance} />
            </div>
        </div>
    );
};
