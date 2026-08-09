import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Briefcase, Plus, X, Tag, BarChart3, ArrowLeft, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { curriculumAlignmentService } from '../../services/apiService';
import { toast } from '../../utils/toast';
import './PublicSurveysHub.css';

const SECTOR_OPTIONS = [
    'Software Development',
    'IT Services & Consulting',
    'Telecommunications',
    'Banking & Finance',
    'Healthcare & BioTech',
    'Apparel & Manufacturing',
    'Education & E-Learning',
    'E-Commerce & Retail',
    'Government & Public Sector'
];

const PRESET_ROLES = [
    'Software Engineer',
    'Full Stack Developer',
    'Data Scientist',
    'AI / Machine Learning Engineer',
    'Cyber Security Analyst',
    'Cloud Architect / Engineer',
    'DevOps Engineer',
    'Robotics Specialist',
    'Database Administrator',
    'Network Engineer',
    'Business Analyst'
];

const PRESET_SKILLS = [
    'Artificial Intelligence',
    'Machine Learning',
    'Data Science',
    'Cyber Security',
    'Cloud Computing',
    'Robotics',
    'Programming',
    'Databases',
    'Networking',
    'Web Development',
    'Software Engineering',
    'Linux / OS Administation'
];

export const IndustrySurveyForm: React.FC = () => {
    const navigate = useNavigate();
    const [companyName, setCompanyName] = useState('');
    const [sector, setSector] = useState('');
    const [customSector, setCustomSector] = useState('');
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [customRole, setCustomRole] = useState('');
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [customSkill, setCustomSkill] = useState('');
    const [demandLevel, setDemandLevel] = useState<'High' | 'Medium' | 'Low'>('High');
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleAddRole = (role: string) => {
        if (role.trim() && !selectedRoles.includes(role.trim())) {
            setSelectedRoles([...selectedRoles, role.trim()]);
        }
    };

    const handleRemoveRole = (role: string) => {
        setSelectedRoles(selectedRoles.filter(r => r !== role));
    };

    const handleToggleSkill = (skill: string) => {
        if (selectedSkills.includes(skill)) {
            setSelectedSkills(selectedSkills.filter(s => s !== skill));
        } else {
            setSelectedSkills([...selectedSkills, skill]);
        }
    };

    const handleAddCustomSkill = () => {
        if (customSkill.trim() && !selectedSkills.includes(customSkill.trim())) {
            setSelectedSkills([...selectedSkills, customSkill.trim()]);
            setCustomSkill('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyName.trim()) {
            toast.error('Please enter your company name.');
            return;
        }
        if (!sector && !customSector.trim()) {
            toast.error('Please specify your industry sector.');
            return;
        }
        if (selectedRoles.length === 0) {
            toast.error('Please add at least one job role.');
            return;
        }
        if (selectedSkills.length === 0) {
            toast.error('Please select or add at least one required skill.');
            return;
        }

        setIsSubmitting(true);

        const payload = {
            company_name: companyName,
            industry_sector: sector === 'Other' ? customSector : sector,
            job_roles: selectedRoles,
            required_skills: selectedSkills,
            demand_level: demandLevel
        };

        try {
            await curriculumAlignmentService.submitIndustrySurvey(payload);
            setIsSuccess(true);
            toast.success('Survey submitted successfully!');
        } catch (err: any) {
            console.error('Failed to submit industry survey:', err);
            toast.error(err.response?.data?.message || 'Failed to submit survey. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="ps-hub-container">
                <div className="ps-hub-bg-blobs">
                    <div className="blob blob-1"></div>
                    <div className="blob blob-2"></div>
                </div>
                <div className="ps-hub-card success-card" style={{ maxWidth: '540px' }}>
                    <div className="success-icon-wrapper">
                        <CheckCircle2 size={72} color="#22C55E" />
                    </div>
                    <h1>Thank You!</h1>
                    <p className="ps-hub-subtitle">
                        Your industry demand input has been securely recorded. This information will help shape our academic curriculums to match market needs.
                    </p>
                    <button className="ps-btn-back-hub" onClick={() => navigate('/survey')}>
                        Back to Alignment Hub
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="ps-hub-container">
            <div className="ps-hub-bg-blobs">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
            </div>

            <div className="ps-form-card">
                <button className="ps-back-btn" onClick={() => navigate('/survey')}>
                    <ArrowLeft size={18} /> Back
                </button>

                <header className="ps-form-header">
                    <div className="ps-hub-badge">
                        <Building2 size={13} />
                        <span>Corporate Feedback</span>
                    </div>
                    <h1>Industry Demand Survey</h1>
                    <p>Provide information about current workforce skill requirements to help customize university educational programs.</p>
                </header>

                <form onSubmit={handleSubmit} className="ps-survey-form">
                    {/* Section 1: Company Profile */}
                    <div className="ps-form-section">
                        <h2>1. Company Profile</h2>
                        
                        <div className="ps-input-group">
                            <label htmlFor="companyName">Company Name</label>
                            <input
                                id="companyName"
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="e.g. Dialog Axiata PLC, WSO2"
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="ps-input-group">
                            <label htmlFor="sector">Industry Sector</label>
                            <select
                                id="sector"
                                value={sector}
                                onChange={(e) => setSector(e.target.value)}
                                required
                                disabled={isSubmitting}
                            >
                                <option value="">Select Sector</option>
                                {SECTOR_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                                <option value="Other">Other (Specify manually)</option>
                            </select>
                        </div>

                        {sector === 'Other' && (
                            <div className="ps-input-group animated-fade-in">
                                <label htmlFor="customSector">Specify Sector</label>
                                <input
                                    id="customSector"
                                    type="text"
                                    value={customSector}
                                    onChange={(e) => setCustomSector(e.target.value)}
                                    placeholder="e.g. Robotics, Agriculture Tech"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                        )}
                    </div>

                    {/* Section 2: In-Demand Job Roles */}
                    <div className="ps-form-section">
                        <h2>2. In-Demand Job Roles</h2>
                        <p className="ps-section-desc">Add one or more job roles that your company is actively recruiting or expects to recruit soon.</p>

                        <div className="ps-preset-container">
                            <label>Quick Select Roles:</label>
                            <div className="ps-preset-tags">
                                {PRESET_ROLES.map(role => {
                                    const isAdded = selectedRoles.includes(role);
                                    return (
                                        <button
                                            key={role}
                                            type="button"
                                            className={`ps-preset-btn ${isAdded ? 'added' : ''}`}
                                            onClick={() => isAdded ? handleRemoveRole(role) : handleAddRole(role)}
                                            disabled={isSubmitting}
                                        >
                                            {role}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="ps-custom-add-group">
                            <input
                                type="text"
                                value={customRole}
                                onChange={(e) => setCustomRole(e.target.value)}
                                placeholder="Or enter custom job role..."
                                disabled={isSubmitting}
                            />
                            <button
                                type="button"
                                className="ps-add-btn"
                                onClick={() => { handleAddRole(customRole); setCustomRole(''); }}
                                disabled={isSubmitting}
                            >
                                <Plus size={16} /> Add
                            </button>
                        </div>

                        {selectedRoles.length > 0 && (
                            <div className="ps-added-tags-box">
                                <label>Roles to Submit:</label>
                                <div className="ps-tags-grid">
                                    {selectedRoles.map(role => (
                                        <span key={role} className="ps-active-tag">
                                            <Briefcase size={13} />
                                            {role}
                                            <button type="button" onClick={() => handleRemoveRole(role)} disabled={isSubmitting}>
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section 3: Required Skills & Competencies */}
                    <div className="ps-form-section">
                        <h2>3. Required Skills & Competencies</h2>
                        <p className="ps-section-desc">Select the primary technical skills graduates need to possess for these roles.</p>

                        <div className="ps-skills-tags-select">
                            {PRESET_SKILLS.map(skill => {
                                const isSelected = selectedSkills.includes(skill);
                                return (
                                    <button
                                        key={skill}
                                        type="button"
                                        className={`ps-skill-tag-btn ${isSelected ? 'selected' : ''}`}
                                        onClick={() => handleToggleSkill(skill)}
                                        disabled={isSubmitting}
                                    >
                                        <Tag size={12} />
                                        {skill}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="ps-custom-add-group">
                            <input
                                type="text"
                                value={customSkill}
                                onChange={(e) => setCustomSkill(e.target.value)}
                                placeholder="Or enter custom technical skill..."
                                disabled={isSubmitting}
                            />
                            <button
                                type="button"
                                className="ps-add-btn"
                                onClick={handleAddCustomSkill}
                                disabled={isSubmitting}
                            >
                                <Plus size={16} /> Add
                            </button>
                        </div>

                        {selectedSkills.length > 0 && (
                            <div className="ps-added-tags-box">
                                <label>Skills to Submit:</label>
                                <div className="ps-tags-grid">
                                    {selectedSkills.map(skill => (
                                        <span key={skill} className="ps-active-tag skill-tag">
                                            <Tag size={12} />
                                            {skill}
                                            <button type="button" onClick={() => handleToggleSkill(skill)} disabled={isSubmitting}>
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section 4: Demand Level */}
                    <div className="ps-form-section">
                        <h2>4. Priority & Demand Level</h2>
                        <p className="ps-section-desc">Estimate the overall intensity of your hiring requirements for these skills.</p>

                        <div className="ps-demand-radio-group">
                            {[
                                { val: 'High', desc: 'Critical hiring need. Active deficit in talent.', color: '#EF4444' },
                                { val: 'Medium', desc: 'Moderate hiring need. Recurrent positions available.', color: '#F59E0B' },
                                { val: 'Low', desc: 'General skill requirement. Long term orientation.', color: '#22C55E' }
                            ].map(item => (
                                <label
                                    key={item.val}
                                    className={`ps-demand-label ${demandLevel === item.val ? 'checked' : ''}`}
                                    style={{ borderColor: demandLevel === item.val ? item.color : '#E2E8F0' }}
                                >
                                    <input
                                        type="radio"
                                        name="demandLevel"
                                        value={item.val}
                                        checked={demandLevel === item.val}
                                        onChange={() => setDemandLevel(item.val as any)}
                                        disabled={isSubmitting}
                                    />
                                    <div className="radio-body">
                                        <span className="radio-title" style={{ color: demandLevel === item.val ? item.color : '#0F172A' }}>
                                            {item.val} Demand
                                        </span>
                                        <span className="radio-desc">{item.desc}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="ps-submit-btn" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <div className="spinner"></div>
                        ) : (
                            <>
                                <BarChart3 size={18} /> Submit Assessment
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
