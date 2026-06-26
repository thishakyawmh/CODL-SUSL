import React, { useState, useEffect } from 'react';
import {
    Sparkles, RefreshCw, BarChart2, ShieldAlert, BookOpen, FileText, Database, Plus, ChevronDown, CheckCircle, Download
} from 'lucide-react';
import { aiAnalyticsService } from '../../services/apiService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './AIAnalytics.css';

export const AIAnalytics: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'student' | 'industry' | 'recommendations' | 'reports' | 'surveys'>('overview');
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncUrl, setSyncUrl] = useState('');
    const [syncType, setSyncType] = useState<'student' | 'industry'>('student');
    const [overviewData, setOverviewData] = useState<any>(null);
    const [studentData, setStudentData] = useState<any[]>([]);
    const [industryData, setIndustryData] = useState<any>(null);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [surveys, setSurveys] = useState<any>(null);


    const [showSyncModal, setShowSyncModal] = useState(false);
    const [showSurveyModal, setShowSurveyModal] = useState(false);
    const [newSurveyType, setNewSurveyType] = useState<'student' | 'industry'>('student');
    const [surveyForm, setSurveyForm] = useState<any>({});


    const [facultyFilter, setFacultyFilter] = useState('All');
    const [departmentFilter, setDepartmentFilter] = useState('All');

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'overview') {
                const res = await aiAnalyticsService.getOverview();
                setOverviewData(res);
            } else if (activeTab === 'student') {
                const res = await aiAnalyticsService.getStudentInterest();
                setStudentData(res);
            } else if (activeTab === 'industry') {
                const res = await aiAnalyticsService.getIndustryGap();
                setIndustryData(res);
            } else if (activeTab === 'recommendations') {
                const res = await aiAnalyticsService.getRecommendations();
                setRecommendations(res);
            } else if (activeTab === 'surveys') {
                const res = await aiAnalyticsService.getSurveys();
                setSurveys(res);
            }
        } catch (err) {
            console.error('Failed to load AI analytics data:', err);
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
            fetchData();
        } catch (err: any) {
            alert('Google Sheets Sync Failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setSyncing(false);
        }
    };

    const handleAddSurvey = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await aiAnalyticsService.createSurvey({
                survey_type: newSurveyType,
                data: surveyForm
            });
            alert('Survey response successfully logged.');
            setShowSurveyModal(false);
            setSurveyForm({});
            fetchData();
        } catch (err: any) {
            alert('Failed to log survey: ' + err.message);
        }
    };

    const exportPDF = () => {
        const input = document.getElementById('report-document');
        if (!input) return;
        setLoading(true);
        html2canvas(input, { scale: 2 }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save('CODL_Curriculum_Audit_Report.pdf');
            setLoading(false);
        });
    };

    return (
        <div className="admin-dashboard text-slate-100">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title flex items-center gap-2">
                        <Sparkles className="text-purple-400" /> AI Curriculum Analytics
                    </h1>
                    <p className="admin-page-subtitle">Evaluate academic alignment, identify technical shortages, and review recommendations.</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-1 btn btn-secondary" onClick={() => setShowSyncModal(true)}>
                        <RefreshCw size={16} /> Sync Google Sheet
                    </button>
                    <button className="flex items-center gap-1 btn btn-primary" onClick={() => { setShowSurveyModal(true); setSurveyForm({}); }}>
                        <Plus size={16} /> Log Survey
                    </button>
                </div>
            </div>


            <div className="ai-tabs-container">
                <button className={`ai-tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}><BarChart2 size={16} /> Overview</button>
                <button className={`ai-tab-btn ${activeTab === 'student' ? 'active' : ''}`} onClick={() => setActiveTab('student')}><BookOpen size={16} /> Student Interests</button>
                <button className={`ai-tab-btn ${activeTab === 'industry' ? 'active' : ''}`} onClick={() => setActiveTab('industry')}><ShieldAlert size={16} /> Industry Gaps</button>
                <button className={`ai-tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`} onClick={() => setActiveTab('recommendations')}><Sparkles size={16} /> AI Recommendations</button>
                <button className={`ai-tab-btn ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}><FileText size={16} /> Reports</button>
                <button className={`ai-tab-btn ${activeTab === 'surveys' ? 'active' : ''}`} onClick={() => setActiveTab('surveys')}><Database size={16} /> Survey Responses</button>
            </div>

            {loading ? (
                <div className="loading-spinner-container">
                    <div className="loading-spinner"></div>
                    <p>Evaluating semantic alignments and parsing patterns...</p>
                </div>
            ) : (
                <div className="ai-tab-content">
                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && overviewData && (
                        <div className="space-y-6">
                            <div className="ai-kpi-grid">
                                <div className="ai-kpi-card purple">
                                    <h3>Overall Student Match</h3>
                                    <div className="value">{overviewData.kpis.studentMatch}%</div>
                                    <p>Cohesion with student aspirations</p>
                                </div>
                                <div className="ai-kpi-card indigo">
                                    <h3>Overall Industry Match</h3>
                                    <div className="value">{overviewData.kpis.industryMatch}%</div>
                                    <p>Satisfies direct industry hiring needs</p>
                                </div>
                                <div className="ai-kpi-card cyan">
                                    <h3>Average Alignment</h3>
                                    <div className="value">{overviewData.kpis.alignment}%</div>
                                    <p>Combined curriculum readiness score</p>
                                </div>
                                <div className="ai-kpi-card dark">
                                    <h3>Datasets Sourced</h3>
                                    <div className="kpi-sub-rows">
                                        <div><span>Courses Audited:</span> <strong>{overviewData.kpis.courses}</strong></div>
                                        <div><span>Surveys Collected:</span> <strong>{overviewData.kpis.surveys}</strong></div>
                                        <div><span>Companies Sourced:</span> <strong>{overviewData.kpis.companies}</strong></div>
                                    </div>
                                </div>
                            </div>

                            <div className="ai-charts-grid">
                                <div className="ai-chart-card">
                                    <h4>Student Interest Distribution</h4>
                                    <p className="text-slate-400 text-sm mb-4">Top domains requested by students in survey responses.</p>
                                    <div className="ai-chart-body">
                                        {overviewData.studentDemand.map((d: any) => (
                                            <div key={d.name} className="chart-bar-row">
                                                <div className="label"><span>{d.name}</span> <span>{d.value}%</span></div>
                                                <div className="bar-bg"><div className="bar-fill purple" style={{ width: `${d.value}%` }}></div></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="ai-chart-card">
                                    <h4>Industry Demand Distribution</h4>
                                    <p className="text-slate-400 text-sm mb-4">Top technologies required by employer audits.</p>
                                    <div className="ai-chart-body">
                                        {overviewData.industryDemand.map((d: any) => (
                                            <div key={d.name} className="chart-bar-row">
                                                <div className="label"><span>{d.name}</span> <span>{d.value}%</span></div>
                                                <div className="bar-bg"><div className="bar-fill indigo" style={{ width: `${d.value}%` }}></div></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STUDENT INTEREST TAB */}
                    {activeTab === 'student' && (
                        <div className="ai-table-card">
                            <div className="flex justify-between items-center mb-4 p-4 border-b border-slate-700">
                                <h3>Curriculum alignment with Student Interests</h3>
                                <div className="text-sm text-slate-400">Jaccard Semantic Alignment Comparison</div>
                            </div>
                            <table className="ai-data-table">
                                <thead>
                                    <tr>
                                        <th>Course Name</th>
                                        <th>Code</th>
                                        <th>Interest Match</th>
                                        <th>Covered Domains</th>
                                        <th>Missing/Gap Domains</th>
                                        <th>Est. Match Post-Update</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentData.map((row: any) => (
                                        <tr key={row.id}>
                                            <td className="font-semibold">{row.name}</td>
                                            <td><span className="code-badge">{row.code}</span></td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <span className={`match-badge ${row.match >= 75 ? 'high' : row.match >= 50 ? 'medium' : 'low'}`}>{row.match}%</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="tag-container">
                                                    {row.wellCovered.map((t: string) => <span key={t} className="tag well">{t}</span>)}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="tag-container">
                                                    {row.missing.map((t: string) => <span key={t} className="tag missing">{t}</span>)}
                                                    {row.missing.length === 0 && <span className="text-green-400 text-xs flex items-center gap-1"><CheckCircle size={12} /> Fully aligned</span>}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bar-bg" style={{ width: '80px' }}><div className="bar-fill green" style={{ width: `${row.estimatedMatch}%` }}></div></div>
                                                    <span className="font-bold text-green-400">{row.estimatedMatch}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* INDUSTRY GAP TAB */}
                    {activeTab === 'industry' && industryData && (
                        <div className="space-y-6">
                            <div className="ai-kpi-card text-center py-4 bg-slate-800 border border-slate-700 rounded-lg">
                                <h4>Critical Industry Skill Shortages</h4>
                                <p className="text-slate-400 text-sm mb-3">Key technologies flagged in employer audits (mentioned in &gt; 20% of responses).</p>
                                <div className="flex justify-center gap-2 flex-wrap">
                                    {industryData.criticalShortages.map((t: string) => (
                                        <span key={t} className="tag missing text-sm px-3 py-1 font-semibold">{t}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="ai-table-card">
                                <table className="ai-data-table">
                                    <thead>
                                        <tr>
                                            <th>Course Name</th>
                                            <th>Code</th>
                                            <th>Industry Match %</th>
                                            <th>Well Covered Skills</th>
                                            <th>Crucial Missing Skills</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {industryData.courses.map((row: any) => (
                                            <tr key={row.id}>
                                                <td className="font-semibold">{row.name}</td>
                                                <td><span className="code-badge">{row.code}</span></td>
                                                <td>
                                                    <span className={`match-badge ${row.match >= 75 ? 'high' : row.match >= 50 ? 'medium' : 'low'}`}>{row.match}%</span>
                                                </td>
                                                <td>
                                                    <div className="tag-container">
                                                        {row.wellCovered.map((t: string) => <span key={t} className="tag well">{t}</span>)}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="tag-container">
                                                        {row.missing.map((t: string) => <span key={t} className="tag missing">{t}</span>)}
                                                        {row.missing.length === 0 && <span className="text-green-400 text-xs flex items-center gap-1"><CheckCircle size={12} /> Matches demand</span>}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* AI RECOMMENDATIONS TAB */}
                    {activeTab === 'recommendations' && (
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-800 border-l-4 border-purple-500 rounded-r-lg text-sm mb-2">
                                <strong>Regex-Based Rule Engines</strong>: The recommendations below are dynamically generated by evaluating PCRE regular expression patterns stored in `recommendation_rules` against all student interests and company surveys. They represent strategic institutional gaps.
                            </div>

                            {recommendations.length === 0 ? (
                                <div className="card-empty-state">
                                    <CheckCircle size={48} className="text-green-400 mb-2" />
                                    <h3>No Critical Gaps Detected</h3>
                                    <p>All matching courses satisfy the threshold triggers of seeded recommendation rules.</p>
                                </div>
                            ) : (
                                recommendations.map((rec: any, idx: number) => (
                                    <div key={idx} className="ai-rec-card-premium">
                                        <div className="rec-card-header">
                                            <div>
                                                <span className="ai-tag-pill critical">Trigger Match: {rec.match_percent}%</span>
                                                <h4 className="mt-1">{rec.name}</h4>
                                            </div>
                                            <div className="text-xs text-slate-400 font-mono">Trigger pattern: {rec.trigger_pattern}</div>
                                        </div>
                                        <div className="rec-card-body space-y-3">
                                            <div className="p-3 bg-purple-950/30 border border-purple-900/50 rounded-lg">
                                                <strong>Proposed Subject</strong>: <span className="font-semibold text-purple-300">{rec.recommendation_subject}</span>
                                                <p className="mt-1 text-slate-300">{rec.recommendation_text}</p>
                                            </div>
                                            <div>
                                                <strong>Explanation</strong>:
                                                <p className="text-slate-400 text-sm mt-1">{rec.explanation}</p>
                                            </div>
                                            <div>
                                                <strong>Deficient Courses (lacking this subject)</strong>:
                                                <div className="flex gap-2 mt-2">
                                                    {rec.courses_lacking.map((c: any) => (
                                                        <span key={c.id} className="code-badge bg-red-950/40 text-red-300 border border-red-900/40">{c.title} ({c.code})</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* REPORTS TAB */}
                    {activeTab === 'reports' && (
                        <div className="space-y-4">
                            <div className="flex justify-end p-2">
                                <button className="flex items-center gap-1 btn btn-primary" onClick={exportPDF}>
                                    <Download size={16} /> Export to PDF
                                </button>
                            </div>
                            <div id="report-document" className="report-paper bg-white text-slate-900 p-8 rounded shadow-lg max-w-4xl mx-auto">
                                <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
                                    <h2 className="text-2xl font-bold">Centre for Open & Distance Learning (CODL)</h2>
                                    <h3 className="text-lg font-semibold text-slate-700">Sabaragamuwa University of Sri Lanka</h3>
                                    <h1 className="text-xl font-bold text-purple-800 mt-2">INSTITUTIONAL CURRICULUM AUDIT REPORT</h1>
                                    <p className="text-xs text-slate-500 mt-1">Generated: {new Date().toLocaleDateString()} | Sourced: Student & Employer surveys</p>
                                </div>

                                <div className="space-y-6 text-sm">
                                    <div>
                                        <h4 className="font-bold text-slate-800 border-b border-slate-300 pb-1 mb-2">1. Executive Summary</h4>
                                        <p>This automated audit evaluates the alignment of existing CODL undergraduate degree curricula against contemporary applicant preferences and employer job requirements. Sourced from Google Sheet responses, the system parses tech tags using regular expressions to highlight curriculum deficits.</p>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-slate-800 border-b border-slate-300 pb-1 mb-2">2. Alignment Indices</h4>
                                        <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                                            <thead>
                                                <tr className="bg-slate-100">
                                                    <th className="border border-slate-300 p-2">Metric</th>
                                                    <th className="border border-slate-300 p-2">Index Score</th>
                                                    <th className="border border-slate-300 p-2">Interpretation</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td className="border border-slate-300 p-2">Student Match</td>
                                                    <td className="border border-slate-300 p-2 font-bold">High (78%)</td>
                                                    <td className="border border-slate-300 p-2">Degree programs align well with student academic expectations.</td>
                                                </tr>
                                                <tr>
                                                    <td className="border border-slate-300 p-2">Industry Match</td>
                                                    <td className="border border-slate-300 p-2 font-bold">Moderate (68%)</td>
                                                    <td className="border border-slate-300 p-2">Practical modern toolchains show gaps.</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-slate-800 border-b border-slate-300 pb-1 mb-2">3. Recommended Interventions</h4>
                                        <p className="mb-2">The regex rule engine recommends immediate curriculum additions for the following modules:</p>
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li><strong>DevOps & Cloud Infrastructure</strong>: Add as laboratory sessions under computing degrees.</li>
                                            <li><strong>Artificial Intelligence Fundamentals</strong>: Introduce core PyTorch/Tensorflow modeling.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SURVEY RESPONSES TAB */}
                    {activeTab === 'surveys' && surveys && (
                        <div className="space-y-6">
                            <div className="ai-charts-grid">
                                <div className="ai-table-card">
                                    <div className="flex justify-between items-center mb-4 p-4 border-b border-slate-700">
                                        <h4>Student Interests Surveys ({surveys.students.length})</h4>
                                        <button className="flex items-center gap-1 btn btn-secondary btn-sm" onClick={() => { setSyncType('student'); setShowSyncModal(true); }}>
                                            Sync Student Sheets
                                        </button>
                                    </div>
                                    <div className="overflow-y-auto max-h-96">
                                        <table className="ai-data-table">
                                            <thead>
                                                <tr>
                                                    <th>Type</th>
                                                    <th>Field</th>
                                                    <th>Skills wanted</th>
                                                    <th>Aspirations</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {surveys.students.map((s: any) => (
                                                    <tr key={s.id}>
                                                        <td className="text-xs">{s.respondent_type}</td>
                                                        <td className="font-semibold text-xs">{s.preferred_field}</td>
                                                        <td className="text-xs text-slate-400">{s.skills_to_learn}</td>
                                                        <td className="text-xs text-purple-300">{s.job_aspirations}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="ai-table-card">
                                    <div className="flex justify-between items-center mb-4 p-4 border-b border-slate-700">
                                        <h4>Industry Demands Surveys ({surveys.companies.length})</h4>
                                        <button className="flex items-center gap-1 btn btn-secondary btn-sm" onClick={() => { setSyncType('industry'); setShowSyncModal(true); }}>
                                            Sync Industry Sheets
                                        </button>
                                    </div>
                                    <div className="overflow-y-auto max-h-96">
                                        <table className="ai-data-table">
                                            <thead>
                                                <tr>
                                                    <th>Company</th>
                                                    <th>Sector</th>
                                                    <th>Required skills</th>
                                                    <th>Shortages</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {surveys.companies.map((c: any) => (
                                                    <tr key={c.id}>
                                                        <td className="font-semibold text-xs">{c.company_name}</td>
                                                        <td className="text-xs">{c.industry_sector}</td>
                                                        <td className="text-xs text-slate-400">{c.required_skills}</td>
                                                        <td className="text-xs text-red-300">{c.skill_shortages}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Sync Modal */}
            {showSyncModal && (
                <div className="modal-backdrop">
                    <div className="modal-content-card">
                        <h3>Sync from Google Sheets</h3>
                        <form onSubmit={handleSync} className="space-y-4 mt-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Select Sheet Type</label>
                                <select className="form-input bg-slate-800 border-slate-700 w-full" value={syncType} onChange={(e) => setSyncType(e.target.value as any)}>
                                    <option value="student">Student Interests Data</option>
                                    <option value="industry">Industry Requirements Data</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Google Sheet URL</label>
                                <input type="url" required className="form-input bg-slate-800 border-slate-700 w-full text-sm" placeholder="https://docs.google.com/spreadsheets/d/.../edit" value={syncUrl} onChange={(e) => setSyncUrl(e.target.value)} />
                                <div className="text-xs text-slate-400 mt-1">Make sure link sharing is set to public. To test, you can paste our sample sheets.</div>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowSyncModal(false)}>Cancel</button>
                                <button type="submit" disabled={syncing} className="btn btn-primary flex items-center gap-1">
                                    {syncing ? 'Syncing...' : 'Sync Data'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Log Survey Modal */}
            {showSurveyModal && (
                <div className="modal-backdrop">
                    <div className="modal-content-card max-w-lg">
                        <h3>Log Manual Survey Response</h3>
                        <div className="flex gap-2 my-3 border-b border-slate-700 pb-2">
                            <button className={`btn btn-xs ${newSurveyType === 'student' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setNewSurveyType('student'); setSurveyForm({}); }}>Student</button>
                            <button className={`btn btn-xs ${newSurveyType === 'industry' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setNewSurveyType('industry'); setSurveyForm({}); }}>Company</button>
                        </div>
                        <form onSubmit={handleAddSurvey} className="space-y-4">
                            {newSurveyType === 'student' ? (
                                <>
                                    <div>
                                        <label className="block text-xs font-semibold mb-1">Respondent Type</label>
                                        <select required className="form-input bg-slate-800 border-slate-700 w-full" value={surveyForm.respondent_type || ''} onChange={(e) => setSurveyForm({ ...surveyForm, respondent_type: e.target.value })}>
                                            <option value="">Select...</option>
                                            <option value="school_leaver">School Leaver</option>
                                            <option value="prospective_student">Prospective Student</option>
                                            <option value="current_student">Current Student</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold mb-1">Preferred Field</label>
                                        <input required type="text" className="form-input bg-slate-800 border-slate-700 w-full" placeholder="e.g. Software Engineering" value={surveyForm.preferred_field || ''} onChange={(e) => setSurveyForm({ ...surveyForm, preferred_field: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold mb-1">Skills to Learn</label>
                                        <textarea required className="form-input bg-slate-800 border-slate-700 w-full text-xs" rows={2} placeholder="e.g. React, Docker, Kubernetes" value={surveyForm.skills_to_learn || ''} onChange={(e) => setSurveyForm({ ...surveyForm, skills_to_learn: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold mb-1">Job Aspirations</label>
                                        <input required type="text" className="form-input bg-slate-800 border-slate-700 w-full" placeholder="e.g. DevOps Engineer" value={surveyForm.job_aspirations || ''} onChange={(e) => setSurveyForm({ ...surveyForm, job_aspirations: e.target.value })} />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-xs font-semibold mb-1">Company Name</label>
                                        <input required type="text" className="form-input bg-slate-800 border-slate-700 w-full" placeholder="e.g. WSO2" value={surveyForm.company_name || ''} onChange={(e) => setSurveyForm({ ...surveyForm, company_name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold mb-1">Industry Sector</label>
                                        <input required type="text" className="form-input bg-slate-800 border-slate-700 w-full" placeholder="e.g. Software Development" value={surveyForm.industry_sector || ''} onChange={(e) => setSurveyForm({ ...surveyForm, industry_sector: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold mb-1">Required Technical Skills</label>
                                        <textarea required className="form-input bg-slate-800 border-slate-700 w-full text-xs" rows={2} placeholder="e.g. CI/CD, Docker, AWS" value={surveyForm.required_skills || ''} onChange={(e) => setSurveyForm({ ...surveyForm, required_skills: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold mb-1">Skill Shortages</label>
                                        <input required type="text" className="form-input bg-slate-800 border-slate-700 w-full" placeholder="e.g. DevOps pipelines" value={surveyForm.skill_shortages || ''} onChange={(e) => setSurveyForm({ ...surveyForm, skill_shortages: e.target.value })} />
                                    </div>
                                </>
                            )}
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowSurveyModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Response</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};