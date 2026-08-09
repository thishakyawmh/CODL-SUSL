import React, { useState, useEffect } from 'react';
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
}

export const AIAnalytics: React.FC = () => {
    const [programs, setPrograms] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);

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
            {selectedCourse ? (
                <ProgramDashboard course={selectedCourse} onBack={() => setSelectedCourse(null)} />
            ) : (
                <ProgramHub
                    programs={programs}
                    onSelect={setSelectedCourse}
                    onOpenSync={() => setShowSyncModal(true)}
                />
            )}

            {/* Sync Modal */}
            {showSyncModal && (
                <div className="modal-backdrop" onClick={() => setShowSyncModal(false)}>
                    <div className="modal-content-card" onClick={e => e.stopPropagation()}>
                        <h3>Sync Google Sheets Data</h3>
                        <p className="text-slate-500 text-sm mb-6">Connect survey data to the AI NLP pipeline.</p>
                        <form onSubmit={handleSync} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-semibold mb-1">Data Source Type</label>
                                <select
                                    className="form-input w-full"
                                    value={syncType}
                                    onChange={(e) => setSyncType(e.target.value as any)}
                                >
                                    <option value="student">Student Interest Survey</option>
                                    <option value="industry">Industry Gaps Audit</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">Google Sheet CSV URL</label>
                                <input
                                    type="url"
                                    className="form-input w-full"
                                    placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv"
                                    value={syncUrl}
                                    onChange={(e) => setSyncUrl(e.target.value)}
                                    required
                                />
                                <p className="text-xs text-slate-400 mt-1">Must be a published CSV export link.</p>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowSyncModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={syncing}>
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
const ProgramHub: React.FC<{ programs: Course[], onSelect: (c: Course) => void, onOpenSync: () => void }> = ({ programs, onSelect, onOpenSync }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPrograms = programs.filter(p => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            p.title.toLowerCase().includes(term) ||
            p.code.toLowerCase().includes(term) ||
            p.department.toLowerCase().includes(term)
        );
    });

    const categories = [
        {
            title: 'Degree',
            subtitle: '4-Year Academic Programs',
            icon: <GraduationCap size={22} />,
            accentColor: { bg: '#EDE9FE', text: '#7C3AED' },
            filter: (p: Course) => p.level.toLowerCase().includes('degree')
        },
        {
            title: 'Higher National Diploma',
            subtitle: 'Advanced Professional Diplomas',
            icon: <Layers size={22} />,
            accentColor: { bg: '#FEF3C7', text: '#D97706' },
            filter: (p: Course) => p.level.toLowerCase().includes('higher national') || p.level.toLowerCase().includes('hnd')
        },
        {
            title: 'Diploma',
            subtitle: '1-2 Year Specialized Courses',
            icon: <BookOpen size={22} />,
            accentColor: { bg: '#DBEAFE', text: '#2563EB' },
            filter: (p: Course) => p.level.toLowerCase().includes('diploma') && !p.level.toLowerCase().includes('higher national') && !p.level.toLowerCase().includes('hnd')
        },
        {
            title: 'Advanced Certificate',
            subtitle: 'Fast-track Academic Qualifications',
            icon: <Award size={22} />,
            accentColor: { bg: '#FCE7F3', text: '#DB2777' },
            filter: (p: Course) => p.level.toLowerCase().includes('advanced certificate')
        },
        {
            title: 'Certificate',
            subtitle: 'Foundational Skills Programs',
            icon: <FileText size={22} />,
            accentColor: { bg: '#CCFBF1', text: '#0D9488' },
            filter: (p: Course) => p.level.toLowerCase().includes('certificate') && !p.level.toLowerCase().includes('advanced')
        }
    ];

    return (
        <div className="programs-hub-container" style={{ padding: '0' }}>
            {/* Header section identical to other pages */}
            <div className="admin-page-header">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <h1 className="admin-page-title">AI Analytics Workspace</h1>
                    <p className="admin-page-subtitle">Analyze curriculum alignment against student interest surveys and industry capability audits.</p>
                </div>
            </div>

            {/* AI Learning Roadmap Card (Redesigned Google Data Sheet section) */}
            <div className="ai-roadmap-card">
                <div className="ai-roadmap-card-content">
                    <div className="ai-roadmap-icon-box">
                        <Database size={24} />
                    </div>
                    <div className="ai-roadmap-text">
                        <h4>AI Learning Roadmap</h4>
                        <p>Synchronize Student Interests & Industry Gaps Google Sheets to power the AI NLP engine.</p>
                    </div>
                </div>
                <button className="btn btn-primary ai-roadmap-btn" onClick={onOpenSync}>
                    <RefreshCw size={16} /> Sync Google Sheet Data
                </button>
            </div>

            {/* Search Input Bar consistent with Course Management search bar */}
            <div className="ai-search-container">
                <Search size={18} />
                <input
                    type="text"
                    placeholder="Search for any course, degree or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Qualification Cards Grid */}
            <div className="qualification-grid">
                {categories.map(cat => {
                    const catPrograms = filteredPrograms.filter(cat.filter);
                    return (
                        <div key={cat.title} className="qualification-card">
                            <div className="qualification-card-header">
                                <div className="qualification-icon-box" style={{ backgroundColor: cat.accentColor.bg, color: cat.accentColor.text }}>
                                    {cat.icon}
                                </div>
                                <span className="qualification-count-badge">
                                    {catPrograms.length} {catPrograms.length === 1 ? 'Course' : 'Courses'}
                                </span>
                            </div>
                            <div className="qualification-details">
                                <h3 className="qualification-title">{cat.title}</h3>
                                <p className="qualification-subtitle">{cat.subtitle}</p>
                            </div>
                            <div className="qualification-divider"></div>
                            <div className="qualification-programs-list">
                                {catPrograms.length > 0 ? (
                                    catPrograms.map(p => (
                                        <div key={p.id} className="qualification-program-item" onClick={() => onSelect(p)}>
                                            <div className="program-item-info">
                                                <span className="program-item-title">{p.title}</span>
                                                <span className="program-item-code">{p.code} • {p.department}</span>
                                            </div>
                                            <div className="program-item-action">
                                                <span className="program-analyze-text">Analyze</span>
                                                <ArrowUpRight size={16} className="program-item-arrow" />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="qualification-empty-state">
                                        No courses matching query
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
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
                    className="btn btn-secondary mb-6 text-sm" 
                    onClick={onBack}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}
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
                        className="btn btn-secondary text-sm" 
                        onClick={onBack}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}
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
                    <div className="text-3xl font-black text-purple-900" style={{ color: '#7C3AED', fontWeight: 900 }}>{overview.coverage_percent}%</div>
                </div>
            </div>

            {/* KPIs */}
            <div className="ai-kpi-grid-consistent">
                <div className="ai-kpi-card-consistent">
                    <div className="ai-kpi-icon-box purple">
                        <BookOpen size={22} />
                    </div>
                    <div className="ai-kpi-info">
                        <span className="ai-kpi-val">{overview.coverage_percent}%</span>
                        <span className="ai-kpi-label">Curriculum Coverage</span>
                        <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#94A3B8', fontWeight: 500, lineHeight: 1.3 }}>Percentage of demanded domains covered by subjects</p>
                    </div>
                </div>
                <div className="ai-kpi-card-consistent">
                    <div className="ai-kpi-icon-box indigo">
                        <TrendingUp size={22} />
                    </div>
                    <div className="ai-kpi-info">
                        <span className="ai-kpi-val">{overview.kpis.studentMatch}%</span>
                        <span className="ai-kpi-label">Student Demand Alignment</span>
                        <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#94A3B8', fontWeight: 500, lineHeight: 1.3 }}>Semantic match with applicant interests</p>
                    </div>
                </div>
                <div className="ai-kpi-card-consistent">
                    <div className="ai-kpi-icon-box cyan">
                        <Award size={22} />
                    </div>
                    <div className="ai-kpi-info">
                        <span className="ai-kpi-val">{overview.kpis.industryMatch}%</span>
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
                                <span>{overview.learning_preferences_data.student_theory_percent}%</span>
                            </div>
                            <div className="bar-bg" style={{ height: '16px', borderRadius: '8px', position: 'relative', overflow: 'hidden', backgroundColor: '#EDE9FE' }}>
                                <div className="bar-fill purple" style={{ 
                                    width: `${overview.learning_preferences_data.student_practical_percent}%`, 
                                    height: '100%', 
                                    backgroundColor: '#7C3AED',
                                    borderRadius: '0 8px 8px 0',
                                    float: 'right'
                                }}></div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '700', marginTop: '8px', color: '#1E293B' }}>
                                <span>Hands-on Practical</span>
                                <span>{overview.learning_preferences_data.student_practical_percent}%</span>
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

            {/* Emerging Tech & Skill Gaps */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '32px' }}>
                <div className="ai-chart-card">
                    <h4>Emerging Technologies</h4>
                    <p className="text-slate-400 text-xs mb-4" style={{ margin: '0 0 16px 0', fontSize: '12px', fontWeight: 500 }}>Raw tags detected in qualitative feedback.</p>
                    {emergingTech && emergingTech.length > 0 ? (
                        <div className="tag-container">
                            {emergingTech.map((tech, idx) => (
                                <span key={idx} className="tag well">{tech}</span>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-slate-400 py-4 text-sm">No emerging signals detected.</div>
                    )}
                </div>
                
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