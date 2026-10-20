import React, { useState, useEffect } from 'react';
import {
    Sparkles, RefreshCw, BarChart2, ShieldAlert, BookOpen, FileText,
    Database, Plus, ChevronDown, CheckCircle, Download, ArrowLeft,
    TrendingUp, AlertTriangle, Layers, Cloud, Activity, Calendar, Users, Filter
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
            // Optional: refresh currently selected program if needed
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
                <p>Loading AI Pipeline...</p>
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
                        <h3>Sync Google Sheets Research Data</h3>
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
    const [filter, setFilter] = useState('All');

    const filteredPrograms = programs.filter(p => {
        if (filter === 'All') return true;
        if (filter === 'Degree' && p.level.toLowerCase().includes('degree')) return true;
        if (filter === 'Diploma' && p.level.toLowerCase().includes('diploma')) return true;
        if (filter === 'Certification' && p.level.toLowerCase().includes('certificate')) return true;
        return false;
    });

    return (
        <div className="programs-hub-container">
            <div className="ai-kpi-card mb-8" style={{ borderLeft: '4px solid #7C3AED' }}>
                <div className="flex justify-between items-center flex-wrap gap-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h4 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1E293B', margin: 0 }}>Research Data Pipeline</h4>
                        <p style={{ fontSize: '14px', color: '#64748B', marginTop: '4px' }}>Connect Student & Industry Google Sheets to power the AI engine.</p>
                    </div>
                    <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={onOpenSync}>
                        <RefreshCw size={16} /> Sync Google Sheet Data
                    </button>
                </div>
            </div>

            <div className="programs-header-row">
                <h2 className="programs-title"><BookOpen size={24} /> AI Analytics Workspace</h2>
                <div className="programs-filter-group">
                    <span className="filter-icon"><Filter size={20} /></span>
                    <button className={`filter-btn ${filter === 'All' ? 'active' : ''}`} onClick={() => setFilter('All')}>All</button>
                    <button className={`filter-btn ${filter === 'Degree' ? 'active' : ''}`} onClick={() => setFilter('Degree')}>Degree</button>
                    <button className={`filter-btn ${filter === 'Diploma' ? 'active' : ''}`} onClick={() => setFilter('Diploma')}>Diploma</button>
                    <button className={`filter-btn ${filter === 'Certification' ? 'active' : ''}`} onClick={() => setFilter('Certification')}>Certification</button>
                </div>
            </div>

            <div className="programs-grid">
                {filteredPrograms.map(p => (
                    <div key={p.id} className="program-card">
                        <div className="program-card-header">
                            <div className="program-icon-box">
                                <BookOpen size={20} strokeWidth={2} />
                            </div>
                            <div className="program-badge">
                                {p.level.includes('Degree') ? 'Degree' : p.level.includes('Diploma') ? 'Diploma' : 'Certificate'}
                            </div>
                        </div>

                        <h4 className="program-card-title">{p.title}</h4>
                        <div className="program-card-subtitle">{p.code} • {p.department}</div>

                        <div className="program-card-meta">
                            <div className="meta-item">
                                <Calendar size={14} />
                                <span>Start: {p.created_at || 'Jun 24, 2026'}</span>
                            </div>
                            <div className="meta-item">
                                <Calendar size={14} />
                                <span>End: {p.duration || '3 Years'}</span>
                            </div>
                        </div>

                        <button 
                            className="program-action-btn"
                            onClick={() => onSelect(p)}
                        >
                            Analyze Program
                        </button>
                    </div>
                ))}
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
            <div>
                <button className="btn btn-secondary mb-6 text-sm" onClick={onBack}>
                    <ArrowLeft size={16} /> Back to Programs
                </button>
                <div className="card-empty-state">
                    <Database size={48} className="text-slate-300 mb-4" />
                    <h3 className="text-xl">No AI Analytics Generated Yet</h3>
                    <p className="mb-4">There is no synchronized survey data matching the academic scope of <strong>{course.title}</strong>.</p>
                    <p className="text-sm">Please return to the hub and sync the Google Sheets research data.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                    <button className="btn btn-secondary mb-4 text-sm" onClick={onBack}>
                        <ArrowLeft size={16} /> Back to Programs
                    </button>
                    <h1 className="text-2xl font-bold text-slate-800">{course.title}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="code-badge">{course.code}</span>
                        <span className="text-slate-500 text-sm">{course.department}</span>
                        <span className="text-slate-400 text-xs ml-2">| Cache Generated: {overview.last_generated}</span>
                    </div>
                </div>
                <div className="text-right bg-purple-50 p-3 rounded-lg border border-purple-100 min-w-[150px]">
                    <div className="text-xs text-purple-600 font-bold uppercase tracking-wider mb-1">Curriculum Coverage</div>
                    <div className="text-3xl font-black text-purple-900">{overview.coverage_percent}%</div>
                </div>
            </div>

            {/* KPIs */}
            <div className="ai-kpi-grid">
                <div className="ai-kpi-card purple">
                    <h3>Curriculum Coverage</h3>
                    <div className="value">{overview.coverage_percent}%</div>
                    <p>Percentage of demanded domains covered by subjects</p>
                </div>
                <div className="ai-kpi-card indigo">
                    <h3>Student Demand Alignment</h3>
                    <div className="value">{overview.kpis.studentMatch}%</div>
                    <p>Semantic match with applicant interests</p>
                </div>
                <div className="ai-kpi-card cyan">
                    <h3>Industry Requirement Match</h3>
                    <div className="value">{overview.kpis.industryMatch}%</div>
                    <p>Fulfillment of graduate employer gaps</p>
                </div>
            </div>

            {/* Curriculum Gaps Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                {/* Missing Subjects */}
                <div className="ai-chart-card" style={{ borderLeft: '4px solid #EF4444' }}>
                    <h4 className="flex items-center gap-2 text-red-700 font-bold">
                        <ShieldAlert size={18} className="text-red-500" /> Missing Core Subjects
                    </h4>
                    <p className="text-slate-400 text-xs mb-4">Demanded domains completely absent from the current curriculum.</p>
                    {overview.missing_subjects && overview.missing_subjects.length > 0 ? (
                        <div className="tag-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                            {overview.missing_subjects.map((domain: string, idx: number) => (
                                <span key={idx} className="tag missing text-sm px-3 py-1.5" style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', borderRadius: '8px', fontWeight: 'bold' }}>
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
                <div className="ai-chart-card" style={{ borderLeft: '4px solid #F59E0B' }}>
                    <h4 className="flex items-center gap-2 text-amber-700 font-bold">
                        <AlertTriangle size={18} className="text-amber-500" /> Curriculum Anomalies
                    </h4>
                    <p className="text-slate-400 text-xs mb-4">Legacy subjects or subjects with low survey demand.</p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                        {((overview.outdated_subjects && overview.outdated_subjects.length > 0) || 
                          (overview.low_demand_subjects && overview.low_demand_subjects.length > 0)) ? (
                            <>
                                {overview.outdated_subjects.map((sub: any, idx: number) => (
                                    <div key={`out-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>
                                        <strong>{sub.code}: {sub.name}</strong>
                                        <span style={{ color: '#B45309', fontWeight: 'bold' }}>Legacy Tech Warning</span>
                                    </div>
                                ))}
                                {overview.low_demand_subjects.map((sub: any, idx: number) => (
                                    <div key={`low-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>
                                        <strong>{sub.code}: {sub.name}</strong>
                                        <span style={{ color: '#64748B' }}>Low Demand (&lt;5%)</span>
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                    {/* Theory vs Practical preference */}
                    <div className="ai-chart-card">
                        <h4>Theory vs Practical Split</h4>
                        <p className="text-slate-400 text-xs mb-4">Student preference ratio derived from survey responses.</p>
                        
                        <div style={{ marginTop: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                                <span>Theory Lectures</span>
                                <span>{overview.learning_preferences_data.student_theory_percent}%</span>
                            </div>
                            <div className="bar-bg" style={{ height: '16px', borderRadius: '8px' }}>
                                <div className="bar-fill purple" style={{ 
                                    width: `${overview.learning_preferences_data.student_practical_percent}%`, 
                                    height: '100%', 
                                    backgroundColor: '#7C3AED',
                                    borderRadius: '8px',
                                    float: 'right'
                                }}></div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', marginTop: '8px' }}>
                                <span>Hands-on Practical</span>
                                <span>{overview.learning_preferences_data.student_practical_percent}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Preferred learning methods */}
                    <div className="ai-chart-card">
                        <h4>Student Preferred Learning Methods</h4>
                        <p className="text-slate-400 text-xs mb-4">Teaching modes preferred by prospective applicants.</p>
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
                        <p className="text-slate-400 text-xs mb-4">Academic training methods requested by graduate employers.</p>
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
                    <p className="text-slate-400 text-sm mb-4">Most requested semantic clusters among applicants.</p>
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
                    <p className="text-slate-400 text-sm mb-4">Technologies most heavily requested by employers.</p>
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                <div className="ai-chart-card">
                    <h4>Emerging Technologies</h4>
                    <p className="text-slate-400 text-xs mb-4">Raw tags detected in qualitative feedback.</p>
                    {emergingTech && emergingTech.length > 0 ? (
                        <div className="tag-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {emergingTech.map((tech, idx) => (
                                <span key={idx} className="tag well border border-blue-200" style={{ padding: '4px 10px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '6px', fontSize: '12px' }}>{tech}</span>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-slate-400 py-4 text-sm">No emerging signals detected.</div>
                    )}
                </div>
                
                <div className="ai-chart-card" style={{ borderLeft: '4px solid #EF4444' }}>
                    <h4 className="flex items-center gap-2"><AlertTriangle size={18} className="text-red-500" /> Graduate Skill Shortages</h4>
                    <p className="text-slate-400 text-xs mb-4">Industry reported graduate capability deficits.</p>
                    {skillGap && skillGap.missing_skills && skillGap.missing_skills.length > 0 ? (
                        <div className="tag-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {skillGap.missing_skills.map((skill: string, idx: number) => (
                                <span key={idx} className="tag missing text-sm px-3 py-1" style={{ padding: '4px 10px', backgroundColor: '#FEE2E2', color: '#991B1B', borderRadius: '6px', fontSize: '12px' }}>{skill}</span>
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
            <div className="mt-8">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Sparkles className="text-purple-600" /> AI Curriculum Recommendations
                </h3>
                
                {!recommendations || recommendations.length === 0 ? (
                    <div className="card-empty-state py-10">
                        <CheckCircle size={48} className="text-green-400 mb-2" />
                        <h3>Optimal Alignment</h3>
                        <p>The AI Engine did not trigger any intervention rules for {course.title}.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {recommendations.map((rec, idx) => (
                            <div key={idx} className="ai-rec-card-premium relative overflow-hidden group">
                                <div className={`absolute top-0 left-0 w-1 h-full ${
                                    rec.priority === 'Critical' ? 'bg-red-500' : 
                                    rec.priority === 'High' ? 'bg-orange-500' : 'bg-blue-500'
                                }`}></div>
                                
                                <div className="rec-card-header">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`ai-tag-pill ${
                                                rec.priority === 'Critical' ? 'bg-red-100 text-red-700' : 
                                                rec.priority === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {rec.priority} Priority
                                            </span>
                                            <span className="text-xs font-semibold text-slate-500 border border-slate-200 px-2 py-0.5 rounded">
                                                {rec.type}
                                            </span>
                                        </div>
                                        <h4 className="mt-1 text-lg">{rec.title}</h4>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Evidence Source</div>
                                        <div className="text-sm font-semibold text-slate-700">{rec.evidence_source}</div>
                                    </div>
                                </div>
                                <div className="rec-card-body space-y-4">
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                                        <strong className="text-slate-800">Actionable Insight</strong>:
                                        <p className="mt-1 text-slate-600 leading-relaxed">{rec.description}</p>
                                    </div>
                                    <div>
                                        <strong className="text-slate-800">Anticipated Impact</strong>:
                                        <p className="text-slate-500 text-sm mt-1">{rec.impact}</p>
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