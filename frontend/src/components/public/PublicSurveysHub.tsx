import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, GraduationCap, ArrowRight, ShieldCheck, PieChart, Sparkles } from 'lucide-react';
import './PublicSurveysHub.css';

export const PublicSurveysHub: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="ps-hub-container">
            <div className="ps-hub-bg-blobs">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
            </div>

            <div className="ps-hub-card">
                <header className="ps-hub-header">
                    <div className="ps-hub-badge">
                        <Sparkles size={14} />
                        <span>CODL | SUSL Academic Intelligence</span>
                    </div>
                    <h1>Curriculum Alignment Hub</h1>
                    <p className="ps-hub-subtitle">
                        Help us shape the future of higher education. Select a portal below to submit your feedback, skills demands, or academic interests.
                    </p>
                </header>

                <div className="ps-hub-choices">
                    {/* Industry Survey Card */}
                    <div className="ps-choice-card industry" onClick={() => navigate('/survey/industry')}>
                        <div className="ps-choice-icon">
                            <Building2 size={32} />
                        </div>
                        <div className="ps-choice-body">
                            <h2>Industry Demand Survey</h2>
                            <p>For corporate partners, recruiters, and technical leaders to list in-demand roles and required workforce competencies.</p>
                            <span className="ps-choice-action">
                                Go to Survey <ArrowRight size={16} />
                            </span>
                        </div>
                    </div>

                    {/* Student Survey Card */}
                    <div className="ps-choice-card student" onClick={() => navigate('/survey/student')}>
                        <div className="ps-choice-icon">
                            <GraduationCap size={32} />
                        </div>
                        <div className="ps-choice-body">
                            <h2>School Leaver Survey</h2>
                            <p>For high school graduates, prospective students, and applicants to share their preferred domains and career aspirations.</p>
                            <span className="ps-choice-action">
                                Go to Survey <ArrowRight size={16} />
                            </span>
                        </div>
                    </div>
                </div>

                <footer className="ps-hub-footer">
                    <div className="ps-footer-feature">
                        <ShieldCheck size={16} />
                        <span>Anonymous & Secure</span>
                    </div>
                    <div className="ps-footer-feature">
                        <PieChart size={16} />
                        <span>AI-Powered Diagnostics</span>
                    </div>
                </footer>
            </div>
        </div>
    );
};
