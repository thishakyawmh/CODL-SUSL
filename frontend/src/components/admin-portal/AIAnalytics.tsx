import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Sparkles, RefreshCw, BarChart2, ShieldAlert, BookOpen, FileText,
    Database, Plus, ChevronDown, CheckCircle, Download, ArrowLeft,
    TrendingUp, AlertTriangle, Layers, Cloud, Activity, Calendar, Users, Filter,
    GraduationCap, Award, ArrowUpRight, Search
} from 'lucide-react';
import { aiAnalyticsService } from '../../services/apiService';
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

    const [showSyncModal, setShowSyncModal] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncUrl, setSyncUrl] = useState('');
    const [syncType, setSyncType] = useState<'student' | 'industry'>('student');



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
        } catch (err) {
            console.error('Failed to load programs', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!syncUrl) return;
        setSyncing(true);
        try {
            const res = await aiAnalyticsService.syncGoogleSheet({ type: syncType, url: syncUrl });
            alert(res.message);
            setShowSyncModal(false);
            setSyncUrl('');
            // Refresh programs lists
            fetchPrograms();
        } catch (err: any) {
            alert('Google Sheets Sync Failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setSyncing(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-spinner-container">
                <div className="loading-spinner"></div>
                <p>Loading AI Roadmap...</p>
            </div>
        );
    }

    return (
        <div className="ai-analytics-page">
            {viewMode === 'course' && selectedCourse ? (
                <ProgramDashboard course={selectedCourse} onBack={() => { setSelectedCourse(null); setViewMode('hub'); }} />
            ) : viewMode === 'common' ? (
                <CommonAnalyticsDashboard onBack={() => setViewMode('hub')} />
            ) : (
                <ProgramHub
                    programs={programs}
                    globalEmergingTech={globalEmergingTech}
                    onSelect={(c) => { setSelectedCourse(c); setViewMode('course'); }}
                    onOpenSync={() => setShowSyncModal(true)}
                    onOpenManageForms={() => navigate('/admin/ai-analytics/manage-forms')}
                    onOpenCommonAnalytics={() => setViewMode('common')}
                />
            )}

            {/* Sync Modal */}
            {showSyncModal && (
                <div className="modal-backdrop" onClick={() => setShowSyncModal(false)}>
                    <div className="modal-content-card" onClick={e => e.stopPropagation()}>
                        <h3>Sync Google Sheets Data</h3>
                        <p className="sync-modal-desc">Connect survey data to the AI NLP pipeline.</p>
                        <form onSubmit={handleSync} className="sync-modal-form">
                            <div className="sync-modal-form-group">
                                <label className="sync-modal-form-label">Data Source Type</label>
                                <select
                                    className="sync-modal-form-select"
                                    value={syncType}
                                    onChange={(e) => setSyncType(e.target.value as any)}
                                >
                                    <option value="student">Student Interest Survey</option>
                                    <option value="industry">Industry Gaps Audit</option>
                                </select>
                            </div>
                            <div className="sync-modal-form-group">
                                <label className="sync-modal-form-label">Google Sheet CSV URL</label>
                                <input
                                    type="url"
                                    className="sync-modal-form-input"
                                    placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv"
                                    value={syncUrl}
                                    onChange={(e) => setSyncUrl(e.target.value)}
                                    required
                                />
                                <span className="sync-modal-form-tip">Must be a published CSV export link.</span>
                            </div>
                            <div className="sync-modal-form-actions">
                                <button type="button" className="sync-modal-btn sync-modal-btn-secondary" onClick={() => setShowSyncModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="sync-modal-btn sync-modal-btn-primary" disabled={syncing}>
                                    {syncing ? 'Syncing Pipeline...' : 'Run Sync & Generate Cache'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
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
    onOpenCommonAnalytics: () => void
}> = ({ programs, globalEmergingTech, onSelect, onOpenSync, onOpenManageForms, onOpenCommonAnalytics }) => {
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
                    <div className="admin-header-actions">
                        <button className="admin-btn-outline" onClick={onOpenCommonAnalytics}>
                            <BarChart2 size={16} /> Common Student Analytics
                        </button>
                        <button className="admin-btn-outline" onClick={onOpenManageForms}>
                            <Database size={16} /> Manage Forms
                        </button>
                        <button className="admin-btn-primary" onClick={onOpenSync}>
                            <RefreshCw size={16} /> Sync Google Sheet Data
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

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const [ov, st, ind, gap, rec, tech] = await Promise.all([
                    aiAnalyticsService.getOverview(course.id).catch(() => null),
                    aiAnalyticsService.getStudentInterest(course.id).catch(() => null),
                    aiAnalyticsService.getIndustryGap(course.id).catch(() => null),
                    aiAnalyticsService.getSkillGap(course.id).catch(() => null),
                    aiAnalyticsService.getRecommendations(course.id).catch(() => []),
                    aiAnalyticsService.getEmergingTechnologies(course.id).catch(() => [])
                ]);

                setOverview(ov);
                setStudentData(st);
                setIndustryData(ind);
                setSkillGap(gap);
                setRecommendations(rec || []);
                setEmergingTech(tech || []);
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
        <div className="space-y-8 pb-10" style={{ animation: 'fadeIn 0.3s ease' }}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6" style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <button 
                        className="cm-back-text-btn" 
                        onClick={onBack}
                        style={{ marginBottom: '16px' }}
                    >
                        <ArrowLeft size={16} /> Back to Programs
                    </button>
                    <h1 className="admin-page-title">{course.title}</h1>
                    <div className="flex items-center gap-2 mt-2" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span className="code-badge">{course.code}</span>
                        <span className="text-slate-500 text-sm" style={{ fontWeight: 600 }}>{course.department}</span>
                        <span className="text-slate-400 text-xs" style={{ marginLeft: '8px' }}>| Cache Generated: {overview.last_generated}</span>
                    </div>
                </div>
                <div className="text-right p-4 rounded-2xl border border-purple-100 min-w-[160px]" style={{ background: '#EDE9FE40', border: '1px solid #7C3AED20' }}>
                    <div className="text-xs text-purple-600 font-bold uppercase tracking-wider mb-1">Curriculum Coverage</div>
                    <div className="text-3xl font-black text-purple-900" style={{ color: '#7C3AED', fontWeight: 900 }}>{overview.coverage_percent !== null ? `${overview.coverage_percent}%` : 'N/A'}</div>
                </div>
            </div>

            {/* KPIs */}
            <div className="ai-kpi-grid-consistent">
                <div className="ai-kpi-card-consistent">
                    <div className="ai-kpi-icon-box purple">
                        <BookOpen size={22} />
                    </div>
                    <div className="ai-kpi-info">
                        <span className="ai-kpi-val">{overview.coverage_percent !== null ? `${overview.coverage_percent}%` : 'N/A'}</span>
                        <span className="ai-kpi-label">Curriculum Coverage</span>
                        <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#94A3B8', fontWeight: 500, lineHeight: 1.3 }}>Percentage of demanded domains covered by subjects</p>
                    </div>
                </div>
                <div className="ai-kpi-card-consistent">
                    <div className="ai-kpi-icon-box indigo">
                        <TrendingUp size={22} />
                    </div>
                    <div className="ai-kpi-info">
                        <span className="ai-kpi-val">{overview.kpis.studentMatch !== null ? `${overview.kpis.studentMatch}%` : 'N/A'}</span>
                        <span className="ai-kpi-label">Student Demand Alignment</span>
                        <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#94A3B8', fontWeight: 500, lineHeight: 1.3 }}>Semantic match with applicant interests</p>
                    </div>
                </div>
                <div className="ai-kpi-card-consistent">
                    <div className="ai-kpi-icon-box cyan">
                        <Award size={22} />
                    </div>
                    <div className="ai-kpi-info">
                        <span className="ai-kpi-val">{overview.kpis.industryMatch !== null ? `${overview.kpis.industryMatch}%` : 'N/A'}</span>
                        <span className="ai-kpi-label">Industry Requirement Match</span>
                        <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#94A3B8', fontWeight: 500, lineHeight: 1.3 }}>Fulfillment of graduate employer gaps</p>
                    </div>
                </div>
            </div>

            {/* Curriculum Gaps Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                {/* Missing Subjects */}
                <div className="ai-chart-card" style={{ borderLeft: '5px solid #EF4444' }}>
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

                {/* Legacy or Low-Demand subjects */}
                <div className="ai-chart-card" style={{ borderLeft: '5px solid #F59E0B' }}>
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
            </div>

            {/* Learning Preferences Section */}
            {overview.learning_preferences_data && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                    {/* Theory vs Practical preference */}
                    <div className="ai-chart-card">
                        <h4>Theory vs Practical Split</h4>
                        <p className="text-slate-400 text-xs mb-4" style={{ margin: '0 0 16px 0', fontSize: '12px', fontWeight: 500 }}>Student preference ratio derived from survey responses.</p>
                        
                        <div style={{ marginTop: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '700', marginBottom: '8px', color: '#1E293B' }}>
                                <span>Theory Lectures</span>
                                <span>{overview.learning_preferences_data.student_theory_percent !== null ? `${overview.learning_preferences_data.student_theory_percent}%` : 'N/A'}</span>
                            </div>
                            <div className="bar-bg" style={{ height: '16px', borderRadius: '8px', position: 'relative', overflow: 'hidden', backgroundColor: '#EDE9FE' }}>
                                <div className="bar-fill purple" style={{ 
                                    width: `${overview.learning_preferences_data.student_practical_percent || 0}%`, 
                                    height: '100%', 
                                    backgroundColor: '#7C3AED',
                                    borderRadius: '0 8px 8px 0',
                                    float: 'right'
                                }}></div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '700', marginTop: '8px', color: '#1E293B' }}>
                                <span>Hands-on Practical</span>
                                <span>{overview.learning_preferences_data.student_practical_percent !== null ? `${overview.learning_preferences_data.student_practical_percent}%` : 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Preferred learning methods */}
                    <div className="ai-chart-card">
                        <h4>Student Preferred Learning Methods</h4>
                        <p className="text-slate-400 text-xs mb-4" style={{ margin: '0 0 16px 0', fontSize: '12px', fontWeight: 500 }}>Teaching modes preferred by prospective applicants.</p>
                        <div className="ai-chart-body" style={{ marginTop: '12px' }}>
                            {overview.learning_preferences_data.student_methods && overview.learning_preferences_data.student_methods.length > 0 ? (
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

                    {/* Industry Required Academic Practices */}
                    <div className="ai-chart-card">
                        <h4>Industry Expected Practices</h4>
                        <p className="text-slate-400 text-xs mb-4" style={{ margin: '0 0 16px 0', fontSize: '12px', fontWeight: 500 }}>Academic training methods requested by graduate employers.</p>
                        <div className="ai-chart-body" style={{ marginTop: '12px' }}>
                            {overview.learning_preferences_data.industry_practices && overview.learning_preferences_data.industry_practices.length > 0 ? (
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
                </div>
            )}

            {/* Visualizations Grid */}
            <div className="ai-charts-grid">
                {/* Student Demand */}
                <div className="ai-chart-card">
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

                {/* Industry Demand */}
                <div className="ai-chart-card">
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

            {/* Skill Gaps */}
            <div style={{ marginBottom: '32px' }}>
                <div className="ai-chart-card" style={{ borderLeft: '5px solid #EF4444' }}>
                    <h4 className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
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
            </div>

            {/* AI Recommendations */}
            <div className="mt-8" style={{ marginTop: '32px' }}>
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2" style={{ fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                    <Sparkles className="text-purple-600" /> AI Curriculum Recommendations
                </h3>
                
                {!recommendations || recommendations.length === 0 ? (
                    <div className="card-empty-state py-10">
                        <CheckCircle size={48} className="text-green-400 mb-2" />
                        <h3>Optimal Alignment</h3>
                        <p>The AI Engine did not trigger any intervention rules for {course.title}.</p>
                    </div>
                ) : (
                    <div className="space-y-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {recommendations.map((rec, idx) => (
                            <div key={idx} className="ai-rec-card-premium relative overflow-hidden group" style={{ position: 'relative', overflow: 'hidden' }}>
                                <div className="rec-card-header">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span className="ai-tag-pill" style={{ 
                                                backgroundColor: rec.priority === 'Critical' ? '#FEE2E2' : rec.priority === 'High' ? '#FEF3C7' : '#EFF6FF',
                                                color: rec.priority === 'Critical' ? '#B91C1C' : rec.priority === 'High' ? '#B45309' : '#1D4ED8'
                                            }}>
                                                {rec.priority} Priority
                                            </span>
                                            <span className="text-xs font-semibold text-slate-500 border border-slate-200 px-2 py-0.5 rounded" style={{ border: '1px solid #E2E8F0', padding: '2px 8px', borderRadius: '6px' }}>
                                                {rec.type}
                                            </span>
                                        </div>
                                        <h4 className="mt-2 text-lg" style={{ fontSize: '18px', fontWeight: '800', margin: '8px 0 0 0' }}>{rec.title}</h4>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em' }}>Evidence Source</div>
                                        <div className="text-sm font-semibold text-slate-700">{rec.evidence_source}</div>
                                    </div>
                                </div>
                                <div className="rec-card-body space-y-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl" style={{ backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9', padding: '16px', borderRadius: '12px' }}>
                                        <strong className="text-slate-800" style={{ fontWeight: 700 }}>Actionable Insight</strong>:
                                        <p className="mt-1 text-slate-600 leading-relaxed" style={{ margin: '4px 0 0 0' }}>{rec.description}</p>
                                    </div>
                                    <div>
                                        <strong className="text-slate-800" style={{ fontWeight: 700 }}>Anticipated Impact</strong>:
                                        <p className="text-slate-500 text-sm mt-1" style={{ margin: '4px 0 0 0' }}>{rec.impact}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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
