import React from 'react';
import {
    BarChart3, Lightbulb, ArrowLeft, ArrowRight, Sparkles, AlertCircle, ArrowUpRight
} from 'lucide-react';
import './AIAnalytics.css';

export const AIAnalytics: React.FC = () => {
    const [activeDetail, setActiveDetail] = React.useState<'none' | 'interests' | 'strategic'>('none');

    const industryTrends = [
        { name: 'AI & Machine Learning', value: 94, trend: '+4.2%' },
        { name: 'Cloud Engineering', value: 89, trend: '+3.1%' },
        { name: 'Data Privacy & Security', value: 87, trend: '+2.8%' },
        { name: 'Full-Stack Development', value: 78, trend: '+1.5%' },
    ];

    return (
        <div className="admin-dashboard">
            {/* Page Header */}
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">AI Analytics</h1>
                    <p className="admin-page-subtitle">Strategic institutional insights derived from internal performance and external market trends.</p>
                </div>
            </div>

            <div className="ai-analytics-page">
                {activeDetail === 'none' ? (
                    /* Main Dashboard View: Left buttons & Right big Matching Score Card */
                    <div className="ai-dashboard-layout">
                        {/* Left Column: Two Buttons */}
                        <div className="ai-left-column">
                            <button 
                                className="ai-large-panel-btn interactive-card"
                                onClick={() => setActiveDetail('interests')}
                            >
                                <div className="panel-btn-content">
                                    <div className="panel-icon-box purple">
                                        <BarChart3 size={24} />
                                    </div>
                                    <div className="panel-text">
                                        <h3>Interests and industry demand</h3>
                                        <p>Go inside to analyze current market survey trends, tech field demands, and curriculum alignments.</p>
                                    </div>
                                    <ArrowRight className="panel-arrow-icon" size={20} />
                                </div>
                            </button>

                            <button 
                                className="ai-large-panel-btn interactive-card"
                                onClick={() => setActiveDetail('strategic')}
                            >
                                <div className="panel-btn-content">
                                    <div className="panel-icon-box indigo">
                                        <Lightbulb size={24} />
                                    </div>
                                    <div className="panel-text">
                                        <h3>Strategic Recommendation</h3>
                                        <p>Go inside to view high-priority course suggestions, regional expansions, and resource updates.</p>
                                    </div>
                                    <ArrowRight className="panel-arrow-icon" size={20} />
                                </div>
                            </button>
                        </div>

                        {/* Right Column: Overall Matching Score Card */}
                        <div className="ai-right-column">
                            <div className="ai-big-match-card">
                                <div className="match-gauge-header">
                                    <div className="gauge-center-wrapper">
                                        {/* Large Circular Matching Gauge */}
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
                                                        strokeDashoffset: `${2 * Math.PI * 40 * (1 - 0.89)}` 
                                                    }} 
                                                />
                                            </svg>
                                            <div className="ai-gauge-text-overlay">
                                                <span className="ai-gauge-percentage large-text">89%</span>
                                                <span className="ai-gauge-label">Matching Score</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Text Box at the Bottom */}
                                <div className="match-card-body">
                                    <div className="ai-dashboard-summary-box">
                                        <div className="summary-title-row">
                                            <AlertCircle size={16} className="summary-icon" />
                                            <h4>CODL Alignment Summary</h4>
                                        </div>
                                        <p className="summary-paragraph">
                                            The institutional matching score combines recent applicant interest trends with active curriculum mappings to evaluate CODL's overall market readiness. Click the panels on the left to navigate inside and explore detailed analytics or strategic suggestions.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : activeDetail === 'interests' ? (
                    /* Interests and Industry Demand Sub-view */
                    <div className="ai-detail-subview-container animate-fade-in">
                        {/* Sub-view Header Nav */}
                        <div className="subview-nav-row">
                            <button className="subview-back-btn" onClick={() => setActiveDetail('none')}>
                                <ArrowLeft size={16} /> Back to Dashboard
                            </button>
                        </div>

                        <div className="subview-header">
                            <div className="header-badge">
                                <Sparkles size={12} style={{ marginRight: '4px' }} /> Analytical View
                            </div>
                            <h2>Interests and Industry Demand Analysis</h2>
                            <p>Deep-dive evaluation of technological discipline requirements based on national employment registry surveys.</p>
                        </div>

                        <div className="subview-content-grid">
                            <div className="subview-main-card">
                                <div className="subview-card-header">
                                    <h3>Industry Demand Alignment</h3>
                                    <span className="ai-tag-pill">Latest Survey</span>
                                </div>
                                <div className="ai-stat-list">
                                    {industryTrends.map((trend, i) => (
                                        <div key={i} className="ai-stat-item">
                                            <div className="ai-stat-label">
                                                <span>{trend.name}</span>
                                                <span style={{ color: '#10B981', fontWeight: 700 }}>{trend.trend}</span>
                                            </div>
                                            <div className="ai-progress-bg">
                                                <div className="ai-progress-fill" style={{ width: `${trend.value}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="subview-narrative-card">
                                <h3>Key Insights & Takeaways</h3>
                                <p>
                                    Technical proficiencies in artificial intelligence, cloud infrastructure, and cyber-security have shown exponential growth in demand across all industrial sectors.
                                </p>
                                <p style={{ marginTop: '12px' }}>
                                    CODL's current curriculum covers full-stack development effectively, but there is a clear strategic opportunity to introduce dedicated micro-credentials or specialization tracks in AI/ML to cater to modern student preferences.
                                </p>
                                <div className="insight-stat-box">
                                    <span className="number">94%</span>
                                    <span className="label">AI & ML Demand</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Strategic Recommendation Sub-view */
                    <div className="ai-detail-subview-container animate-fade-in">
                        {/* Sub-view Header Nav */}
                        <div className="subview-nav-row">
                            <button className="subview-back-btn" onClick={() => setActiveDetail('none')}>
                                <ArrowLeft size={16} /> Back to Dashboard
                            </button>
                        </div>

                        <div className="subview-header">
                            <div className="header-badge indigo">
                                <Sparkles size={12} style={{ marginRight: '4px' }} /> Strategic View
                            </div>
                            <h2>Strategic Recommendations</h2>
                            <p>Data-driven suggestions generated by AI mapping models to optimize course catalogs and student reach.</p>
                        </div>

                        <div className="subview-content-grid">
                            <div className="subview-main-card">
                                <div className="subview-card-header">
                                    <h3>Actionable Items</h3>
                                    <span className="ai-tag-pill">Prioritized List</span>
                                </div>
                                <div className="ai-rec-list-vertical">
                                    <div className="ai-rec-card-premium">
                                        <div className="rec-card-header">
                                            <span className="ai-tag-pill critical">High Priority</span>
                                            <h4>Curriculum Update: AI & ML</h4>
                                        </div>
                                        <p>Market demand for AI skills is at 94%. We recommend introducing a foundational course to capture the surging interest in this sector.</p>
                                    </div>

                                    <div className="ai-rec-card-premium">
                                        <div className="rec-card-header">
                                            <span className="ai-tag-pill growth">Growth Opportunity</span>
                                            <h4>Regional Expansion: Southern Provinces</h4>
                                        </div>
                                        <p>Application volume in Galle and Matara is below expected levels. Targeted digital outreach could increase regional intake by 15%.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="subview-narrative-card">
                                <h3>Curriculum Strategy</h3>
                                <p>
                                    Recommendations are ranked by alignment impact (ease of course integration vs. student demand conversion).
                                </p>
                                <p style={{ marginTop: '12px' }}>
                                    Updating the AI & ML syllabus has the highest projected impact. A targeted digital marketing campaign centered in Galle and Matara is expected to yield immediate results for the upcoming enrollment cycle.
                                </p>
                                <a href="#/courses" className="rec-action-link">
                                    Manage Courses Catalog <ArrowUpRight size={14} />
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
