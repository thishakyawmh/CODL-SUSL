import React, { useState, useEffect } from 'react';
import { GraduationCap, CheckCircle2, AlertCircle, Loader2, Send, Info } from 'lucide-react';
import { industryAnalysisService } from '../../services/apiService';
import './IndustryAnalysisForm.css';




const ACADEMIC_DOMAINS: Record<string, string[]> = {
    'Computing & Information Technology': [
        'Computer Science', 'Software Engineering', 'Information Systems', 'Cybersecurity',
        'Artificial Intelligence', 'Data Science', 'Cloud Computing', 'Network Administration',
        'Database Management', 'Human-Computer Interaction', 'Game Development',
        'Internet of Things (IoT)', 'Blockchain Technology', 'Quantum Computing', 'Bioinformatics'
    ],
    'Engineering & Technology': [
        'Civil Engineering', 'Mechanical Engineering', 'Electrical Engineering', 'Chemical Engineering',
        'Aerospace Engineering', 'Materials Science & Engineering', 'Industrial Engineering',
        'Biomedical Engineering', 'Robotics Engineering', 'Environmental Engineering',
        'Nanotechnology', 'Mechatronics', 'Petroleum Engineering', 'Marine Engineering'
    ],
    'Business & Management': [
        'Business Administration', 'Human Resource Management', 'Operations Management',
        'Supply Chain Management', 'International Business', 'Entrepreneurship',
        'Strategic Management', 'Project Management', 'Organizational Behavior',
        'Business Analytics', 'Risk Management', 'E-commerce Management', 'Healthcare Management'
    ],
    'Accounting & Finance': [
        'Financial Accounting', 'Management Accounting', 'Corporate Finance', 'Investment Banking',
        'Taxation', 'Auditing', 'Forensic Accounting', 'Wealth Management', 'Actuarial Finance',
        'Financial Risk Management', 'Quantitative Finance', 'Public Accounting', 'Islamic Finance'
    ],
    'Marketing': [
        'Digital Marketing', 'Brand Management', 'Market Research', 'Product Marketing',
        'Advertising', 'Sales Management', 'Consumer Behavior', 'Public Relations (PR)',
        'Social Media Marketing', 'Content Marketing', 'Search Engine Optimization (SEO)',
        'Retail Marketing', 'B2B Marketing'
    ],
    'Economics': [
        'Microeconomics', 'Macroeconomics', 'International Economics', 'Econometrics',
        'Behavioral Economics', 'Development Economics', 'Environmental Economics',
        'Labor Economics', 'Financial Economics', 'Health Economics', 'Public Economics',
        'Urban Economics', 'Industrial Organization'
    ],
    'Science': [
        'Physics', 'Chemistry', 'Biology', 'Earth Science', 'Astronomy', 'Biochemistry',
        'Zoology', 'Botany', 'Microbiology', 'Genetics', 'Ecology', 'Oceanography',
        'Neuroscience', 'Materials Chemistry'
    ],
    'Mathematics & Statistics': [
        'Pure Mathematics', 'Applied Mathematics', 'Statistics', 'Actuarial Science',
        'Data Analytics', 'Probability Theory', 'Cryptography', 'Operations Research',
        'Computational Mathematics', 'Financial Mathematics', 'Topology', 'Number Theory', 'Geometry'
    ],
    'Medicine & Health Sciences': [
        'General Medicine', 'Nursing', 'Dentistry', 'Pharmacy', 'Public Health',
        'Physiotherapy', 'Surgery', 'Pediatrics', 'Psychiatry', 'Radiology', 'Pathology',
        'Medical Laboratory Science', 'Occupational Therapy', 'Epidemiology', 'Nutrition and Dietetics'
    ],
    'Agriculture': [
        'Agronomy (Crop Science)', 'Animal Science', 'Horticulture', 'Agricultural Economics',
        'Soil Science', 'Forestry', 'Plant Pathology', 'Entomology', 'Agricultural Engineering',
        'Aquaculture', 'Agribusiness', 'Dairy Science', 'Organic Farming'
    ],
    'Law': [
        'Criminal Law', 'Civil Law', 'Corporate Law', 'International Law', 'Constitutional Law',
        'Intellectual Property Law', 'Environmental Law', 'Family Law', 'Human Rights Law',
        'Tax Law', 'Labor and Employment Law', 'Real Estate Law', 'Space Law'
    ],
    'Education': [
        'Early Childhood Education', 'Special Education', 'Curriculum and Instruction',
        'Educational Leadership', 'Educational Psychology', 'Adult Education',
        'Primary Education', 'Secondary Education', 'Educational Technology (EdTech)',
        'Physical Education', 'Language Teaching (e.g., TESOL)', 'Higher Education Administration',
        'Bilingual Education'
    ],
    'Social Sciences': [
        'Sociology', 'Anthropology', 'Political Science', 'Geography', 'International Relations',
        'Criminology', 'Demography', 'Cultural Studies', 'Urban Studies', 'Public Policy',
        'Social Work', 'Development Studies', 'Gender Studies'
    ],
    'Arts & Humanities': [
        'History', 'Philosophy', 'Literature', 'Linguistics', 'Performing Arts (Music, Theater, Dance)',
        'Visual Arts', 'Religious Studies', 'Classics', 'Art History', 'Creative Writing',
        'Cultural Heritage Studies', 'Archaeology', 'Ethics'
    ],
    'Architecture': [
        'Landscape Architecture', 'Interior Architecture', 'Urban Planning',
        'Architectural Engineering', 'Historic Preservation', 'Sustainable Design',
        'Industrial Design', 'Naval Architecture', 'Parametric Design', 'Civic Design',
        'Residential Architecture', 'Commercial Architecture', 'Construction Management'
    ],
    'Environmental Studies': [
        'Environmental Science', 'Ecology', 'Conservation Biology', 'Climate Science',
        'Environmental Policy', 'Sustainability Studies', 'Renewable Energy',
        'Wildlife Management', 'Environmental Toxicology', 'Water Resource Management',
        'Ocean Conservation', 'Forestry Management', 'Environmental Law and Ethics'
    ],
    'Hospitality & Tourism': [
        'Hotel Management', 'Culinary Arts', 'Event Management', 'Travel and Tourism',
        'Recreation and Leisure Studies', 'Resort Management', 'Food and Beverage Management',
        'Eco-Tourism', 'Aviation Management', 'Cruise Ship Management', 'Casino Management',
        'Hospitality Marketing', 'Theme Park Management'
    ],
    'Media & Communication': [
        'Journalism', 'Broadcasting', 'Film and Television Studies', 'Public Relations',
        'Digital Media', 'Corporate Communication', 'Advertising Strategy', 'Photojournalism',
        'Mass Communication', 'Media Ethics', 'Interactive Media', 'Sports Communication', 'Publishing'
    ],
    'Psychology': [
        'Clinical Psychology', 'Cognitive Psychology', 'Developmental Psychology',
        'Forensic Psychology', 'Social Psychology', 'Educational Psychology',
        'Industrial-Organizational Psychology', 'Neuropsychology', 'Sports Psychology',
        'Counseling Psychology', 'Health Psychology', 'Evolutionary Psychology', 'Consumer Psychology'
    ]
};

const DOMAIN_KEYS = Object.keys(ACADEMIC_DOMAINS);

const SOFT_SKILLS = [
    'Communication', 'Teamwork', 'Problem Solving', 'Time Management',
    'Critical Thinking', 'Emotional Intelligence', 'Adaptability', 'Leadership',
    'Conflict Resolution', 'Active Listening', 'Creativity', 'Work Ethic',
    'Interpersonal Skills', 'Negotiation', 'Decision Making', 'Flexibility',
    'Empathy', 'Networking', 'Attention to Detail', 'Public Speaking'
];

const TRAINING_PRACTICES = [
    'Practical Labs', 'Workshops', 'Group Projects', 'Individual Projects',
    'Industry Training', 'Research Projects', 'Field Visits', 'Guest Lectures',
    'Internships', 'Hackathons'
];

export function IndustryAnalysisForm() {
    const [formData, setFormData] = useState({
        company_name: '',
        industry_sector: '',
        organization_size: 'Medium',
        primary_academic_field: '',
        sub_disciplines: [] as string[],
        tech_stacks: '',
        soft_skills: [] as string[],
        training_practices: [] as string[],
        minimum_qualification: 'Bachelor\'s Degree',
        minimum_degree_result: 'Second Class Upper',
        certification_importance: 3,
        new_program_suggestion: '',
        graduate_skill_gaps: '',
        additional_recommendations: ''
    });

    const [customDomain, setCustomDomain] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const [industrySectors, setIndustrySectors] = useState<string[]>([]);
    const [academicDomains, setAcademicDomains] = useState<any[]>([]);


    useEffect(() => {
        const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
        if (!siteKey) return;

        const existingScript = document.getElementById('recaptcha-script-industry');
        if (existingScript) return;

        const script = document.createElement('script');
        script.id = 'recaptcha-script-industry';
        script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        return () => {
            const badge = document.querySelector('.grecaptcha-badge');
            if (badge) {
                badge.remove();
            }
            const loadedScript = document.getElementById('recaptcha-script-industry');
            if (loadedScript) {
                loadedScript.remove();
            }
        };
    }, []);


    useEffect(() => {
        const loadConfigs = async () => {
            try {
                const sectorsData = await industryAnalysisService.getSectors();
                if (sectorsData && sectorsData.length > 0) {
                    setIndustrySectors(sectorsData.map((s: any) => s.sector_name));
                } else {
                    setIndustrySectors([
                        'Information Technology',
                        'Engineering & Construction',
                        'Banking & Finance',
                        'Tourism & Hospitality',
                        'Apparel & Manufacturing',
                        'Healthcare & Pharmaceutical',
                        'Education & Research'
                    ]);
                }
            } catch (err) {
                console.error('Failed to load industry sectors config:', err);
                setIndustrySectors([
                    'Information Technology',
                    'Engineering & Construction',
                    'Banking & Finance',
                    'Tourism & Hospitality',
                    'Apparel & Manufacturing',
                    'Healthcare & Pharmaceutical',
                    'Education & Research'
                ]);
            }

            try {
                const configData = await industryAnalysisService.getConfig();
                if (configData && configData.length > 0) {
                    setAcademicDomains(configData);
                } else {
                    const mapped = Object.keys(ACADEMIC_DOMAINS).map(key => ({
                        interest_field: key,
                        skills: ACADEMIC_DOMAINS[key]
                    }));
                    setAcademicDomains(mapped);
                }
            } catch (err) {
                console.error('Failed to load academic domains config:', err);
                const mapped = Object.keys(ACADEMIC_DOMAINS).map(key => ({
                    interest_field: key,
                    skills: ACADEMIC_DOMAINS[key]
                }));
                setAcademicDomains(mapped);
            }
        };

        loadConfigs();
    }, []);


    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const backendUrl = import.meta.env.VITE_BACKEND_URL || (apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl);
    const bannerImgUrl = `${backendUrl}/storage/industry-analysis.webp`;


    const selectedDomainObj = academicDomains.find(d => d.interest_field === formData.primary_academic_field);
    const availableSubDisciplines: string[] = selectedDomainObj ? selectedDomainObj.skills : [];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDomainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setFormData(prev => ({
            ...prev,
            primary_academic_field: value,
            sub_disciplines: [],   
            tech_stacks: ''        
        }));
        if (value !== 'Other') setCustomDomain('');
    };

    const toggleSubDiscipline = (discipline: string) => {
        setFormData(prev => {
            const current = prev.sub_disciplines;
            if (current.includes(discipline)) {
                return { ...prev, sub_disciplines: current.filter(d => d !== discipline) };
            }
            if (current.length >= 5) return prev; 
            return { ...prev, sub_disciplines: [...current, discipline] };
        });
    };

    const removeSubDiscipline = (discipline: string) => {
        setFormData(prev => ({
            ...prev,
            sub_disciplines: prev.sub_disciplines.filter(d => d !== discipline)
        }));
    };

    const toggleSoftSkill = (skill: string) => {
        setFormData(prev => {
            const current = prev.soft_skills;
            if (current.includes(skill)) {
                return { ...prev, soft_skills: current.filter(s => s !== skill) };
            }
            return { ...prev, soft_skills: [...current, skill] };
        });
    };

    const toggleTrainingPractice = (practice: string) => {
        setFormData(prev => {
            const current = prev.training_practices;
            if (current.includes(practice)) {
                return { ...prev, training_practices: current.filter(p => p !== practice) };
            }
            return { ...prev, training_practices: [...current, practice] };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg('');


        if (!formData.company_name.trim()) {
            setErrorMsg('Please enter your company/organization name.');
            setIsLoading(false);
            return;
        }
        if (!formData.industry_sector) {
            setErrorMsg('Please select your industry sector.');
            setIsLoading(false);
            return;
        }

        const effectiveDomain = formData.primary_academic_field === 'Other'
            ? customDomain.trim()
            : formData.primary_academic_field;

        if (!effectiveDomain) {
            setErrorMsg('Please select or enter your primary academic domain of interest.');
            setIsLoading(false);
            return;
        }

        try {

            let recaptchaToken = null;
            const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
            const recaptcha = (window as any).grecaptcha;

            if (siteKey && recaptcha) {
                try {
                    recaptchaToken = await recaptcha.execute(siteKey, { action: 'submit_industry_survey' });
                } catch (recaptchaErr) {
                    console.error('reCAPTCHA execution failed:', recaptchaErr);
                }
            }


            const payload = {
                company_name: formData.company_name,
                industry_sector: formData.industry_sector,
                organization_size: formData.organization_size,
                primary_academic_field: effectiveDomain,
                secondary_academic_field: formData.sub_disciplines.join(', '),
                third_academic_field: formData.soft_skills.join(', '),
                required_skills: formData.tech_stacks,
                academic_practices: formData.training_practices.join(', '),
                minimum_qualification: formData.minimum_qualification,
                minimum_degree_result: formData.minimum_degree_result,
                certification_importance: formData.certification_importance,
                new_program_suggestion: formData.new_program_suggestion,
                graduate_skill_gaps: formData.graduate_skill_gaps,
                additional_recommendations: formData.additional_recommendations,
                recaptcha_token: recaptchaToken
            };

            await industryAnalysisService.submit(payload);
            setIsSubmitted(true);
        } catch (err: any) {
            console.error('Industry survey submission failed:', err);
            setErrorMsg(
                err.response?.data?.message ||
                'Failed to record your response. Please try again later.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="industry-analysis-container">
                { }
                <div className="industry-analysis-header-card">
                    <div className="header-text-section">
                        <h1>Industry Requirements</h1>
                        <div className="header-subtitle-container">
                            <img src="/images/logo.png" className="header-uni-logo" alt="SUSL Logo" />
                            <div className="subtitle-text">
                                <span className="subtitle-line1">Center for Open and Distance Learning</span>
                                <span className="subtitle-line2">Sabaragamuwa University of Sri Lanka</span>
                            </div>
                        </div>
                    </div>
                    <div className="banner-image-placeholder">
                        <img src={bannerImgUrl} alt="Industry Requirements Survey Banner" />
                    </div>
                </div>

                <div className="success-card">
                    <div className="success-icon-wrapper">
                        <CheckCircle2 size={56} style={{ color: '#10B981' }} />
                    </div>
                    <h2>Thank You!</h2>
                    <p>
                        Your industry feedback has been submitted successfully. Your input helps us align our curriculum with current professional standards.
                    </p>
                    <button
                        className="back-btn"
                        onClick={() => {
                            setIsSubmitted(false);
                            setFormData({
                                company_name: '',
                                industry_sector: '',
                                organization_size: 'Medium',
                                primary_academic_field: '',
                                sub_disciplines: [],
                                tech_stacks: '',
                                soft_skills: [],
                                training_practices: [],
                                minimum_qualification: 'Bachelor\'s Degree',
                                minimum_degree_result: 'Second Class Upper',
                                certification_importance: 3,
                                new_program_suggestion: '',
                                graduate_skill_gaps: '',
                                additional_recommendations: ''
                            });
                            setCustomDomain('');
                        }}
                    >
                        Submit Another Response
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="industry-analysis-container">
            { }
            <div className="industry-analysis-header-card">
                <div className="header-text-section">
                    <h1>Industry Requirements</h1>
                    <div className="header-subtitle-container">
                        <img src="/images/logo.png" className="header-uni-logo" alt="SUSL Logo" />
                        <div className="subtitle-text">
                            <span className="subtitle-line1">Center for Open and Distance Learning</span>
                            <span className="subtitle-line2">Sabaragamuwa University of Sri Lanka</span>
                        </div>
                    </div>
                </div>
                <div className="banner-image-placeholder">
                    <img src={bannerImgUrl} alt="Industry Requirements Survey Banner" />
                </div>
            </div>

            { }
            <div className="industry-analysis-description-card">
                <div className="description-text">
                    This survey gathers industry feedback to identify current skill demands and emerging trends, supporting curriculum advancement and the development of relevant future degree programs.
                </div>
            </div>

            { }
            <form onSubmit={handleSubmit} className="interest-form">

                { }
                <div className="form-section">
                    <div className="section-header-row">
                        <h3 className="form-section-title" style={{ borderLeftColor: '#7C3AED' }}>
                            Company Profile
                        </h3>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="company_name">Company / Organization Name *</label>
                            <input
                                type="text"
                                id="company_name"
                                name="company_name"
                                className="form-input"
                                placeholder="Enter company name..."
                                value={formData.company_name}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="industry_sector">Industry Sector *</label>
                            <select
                                id="industry_sector"
                                name="industry_sector"
                                className="form-select"
                                value={formData.industry_sector}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Select Sector...</option>
                                {industrySectors.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="organization_size">Organization Size</label>
                            <select
                                id="organization_size"
                                name="organization_size"
                                className="form-select"
                                value={formData.organization_size}
                                onChange={handleInputChange}
                            >
                                <option value="Small">Small (Under 50 employees)</option>
                                <option value="Medium">Medium (50 - 250 employees)</option>
                                <option value="Large">Large (Over 250 employees)</option>
                            </select>
                        </div>
                    </div>
                </div>

                { }
                <div className="form-section">
                    <div className="section-header-row">
                        <h3 className="form-section-title" style={{ borderLeftColor: '#3B82F6' }}>
                            Academic & Skill Alignment
                        </h3>
                    </div>
                    <div className="form-grid">
                        { }
                        <div className="form-group full-width">
                            <label htmlFor="primary_academic_field">Primary Academic Domain of Interest *</label>
                            <select
                                id="primary_academic_field"
                                name="primary_academic_field"
                                className="form-select"
                                value={formData.primary_academic_field}
                                onChange={handleDomainChange}
                                required
                            >
                                <option value="">Select Domain...</option>
                                {academicDomains.map(d => (
                                    <option key={d.interest_field} value={d.interest_field}>{d.interest_field}</option>
                                ))}
                                <option value="Other">Other (type below)</option>
                            </select>
                        </div>

                        { }
                        {formData.primary_academic_field === 'Other' && (
                            <div className="form-group full-width">
                                <label htmlFor="custom_domain">Specify Your Academic Domain *</label>
                                <input
                                    type="text"
                                    id="custom_domain"
                                    className="form-input"
                                    placeholder="Type your academic domain..."
                                    value={customDomain}
                                    onChange={(e) => setCustomDomain(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        { }
                        {availableSubDisciplines.length > 0 && (
                            <div className="form-group full-width">
                                <label>
                                    Sub-Disciplines
                                    <span className="sub-discipline-hint"> (select up to 5)</span>
                                </label>

                                { }
                                <div className="subdiscipline-chips">
                                    {availableSubDisciplines.map(disc => {
                                        const isSelected = formData.sub_disciplines.includes(disc);
                                        const isDisabled = !isSelected && formData.sub_disciplines.length >= 5;
                                        return (
                                            <button
                                                key={disc}
                                                type="button"
                                                className={`subdiscipline-chip${isSelected ? ' selected' : ''}${isDisabled ? ' disabled' : ''}`}
                                                onClick={() => !isDisabled && toggleSubDiscipline(disc)}
                                                disabled={isDisabled}
                                            >
                                                {disc}
                                            </button>
                                        );
                                    })}
                                </div>

                                {formData.sub_disciplines.length >= 5 && (
                                    <p className="max-reached-note">Maximum of 5 sub-disciplines reached.</p>
                                )}
                            </div>
                        )}

                        { }
                        {formData.primary_academic_field && (
                            <div className="form-group full-width">
                                <label htmlFor="tech_stacks">Tech Stacks / Specialized Areas Needed</label>
                                <input
                                    type="text"
                                    id="tech_stacks"
                                    name="tech_stacks"
                                    className="form-input"
                                    placeholder="e.g. React, Node.js, Python, TensorFlow  (separate with commas)"
                                    value={formData.tech_stacks}
                                    onChange={handleInputChange}
                                />
                                <span className="field-helper-text">Type the technologies, tools, or specialized areas separated by commas.</span>
                            </div>
                        )}
                    </div>
                </div>

                { }
                <div className="form-section">
                    <div className="section-header-row">
                        <h3 className="form-section-title" style={{ borderLeftColor: '#F59E0B' }}>
                            Skill Sets & Training Preferences
                        </h3>
                    </div>
                    <div className="form-grid">
                        { }
                        <div className="form-group full-width">
                            <label>Soft Skills Needed</label>
                            <div className="subdiscipline-chips">
                                {SOFT_SKILLS.map(skill => {
                                    const isSelected = formData.soft_skills.includes(skill);
                                    return (
                                        <button
                                            key={skill}
                                            type="button"
                                            className={`subdiscipline-chip${isSelected ? ' selected' : ''}`}
                                            onClick={() => toggleSoftSkill(skill)}
                                        >
                                            {skill}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        { }
                        <div className="form-group full-width">
                            <label>Training Practices Requested</label>
                            <div className="subdiscipline-chips">
                                {TRAINING_PRACTICES.map(practice => {
                                    const isSelected = formData.training_practices.includes(practice);
                                    return (
                                        <button
                                            key={practice}
                                            type="button"
                                            className={`subdiscipline-chip${isSelected ? ' selected' : ''}`}
                                            onClick={() => toggleTrainingPractice(practice)}
                                        >
                                            {practice}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        { }
                        <div className="form-group">
                            <label htmlFor="minimum_qualification">Minimum Education Required</label>
                            <select
                                id="minimum_qualification"
                                name="minimum_qualification"
                                className="form-select"
                                value={formData.minimum_qualification}
                                onChange={handleInputChange}
                            >
                                <option value="Bachelor's Degree">Bachelor's Degree</option>
                                <option value="Master's Degree">Master's Degree</option>
                                <option value="Diploma / Higher National Diploma">Diploma / Higher National Diploma</option>
                                <option value="Professional Certification">Professional Certification</option>
                                <option value="Doctorate (Ph.D.)">Doctorate (Ph.D.)</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        {/* Minimum Expected GPA / Result Class */}
                        <div className="form-group">
                            <label htmlFor="minimum_degree_result">Minimum Expected GPA / Result Class</label>
                            <select
                                id="minimum_degree_result"
                                name="minimum_degree_result"
                                className="form-select"
                                value={formData.minimum_degree_result}
                                onChange={handleInputChange}
                            >
                                <option value="First Class">First Class</option>
                                <option value="Second Class Upper">Second Class (Upper)</option>
                                <option value="Second Class Lower">Second Class (Lower)</option>
                                <option value="General Pass">General Pass</option>
                                <option value="Specific GPA Threshold">Specific GPA Threshold</option>
                            </select>
                        </div>

                        {/* Importance of Professional Credentials */}
                        <div className="form-group full-width">
                            <label htmlFor="certification_importance">Importance of Professional Credentials</label>
                            <div className="credentials-scale">
                                {[1, 2, 3, 4, 5].map((val) => (
                                    <button
                                        key={val}
                                        type="button"
                                        className={`credentials-option ${formData.certification_importance === val ? 'active' : ''}`}
                                        onClick={() => setFormData(prev => ({ ...prev, certification_importance: val }))}
                                    >
                                        <span className="credentials-number">{val}</span>
                                        <span className="credentials-label">{
                                            val === 1 ? 'Not Important' :
                                                val === 2 ? 'Low Importance' :
                                                    val === 3 ? 'Medium' :
                                                        val === 4 ? 'Important' : 'Extremely Important'
                                        }</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Part 4: Curriculum Feedback & Strategic Recommendations */}
                <div className="form-section">
                    <div className="section-header-row">
                        <h3 className="form-section-title" style={{ borderLeftColor: '#10B981' }}>
                            Curriculum Feedback & Strategic Recommendations
                        </h3>
                    </div>
                    <div className="form-grid">
                        {/* Direct suggestions for new degree programs */}
                        <div className="form-group full-width">
                            <label htmlFor="new_program_suggestion">Direct suggestions for new degree programs</label>
                            <textarea
                                id="new_program_suggestion"
                                name="new_program_suggestion"
                                className="form-textarea"
                                placeholder="Describe any new degree programs, curriculums, or specializations that the university should introduce..."
                                value={formData.new_program_suggestion}
                                onChange={handleInputChange}
                            />
                        </div>

                        {/* Identified Capability deficits in recent graduates */}
                        <div className="form-group full-width">
                            <label htmlFor="graduate_skill_gaps">Identified Capability deficits in recent graduates</label>
                            <textarea
                                id="graduate_skill_gaps"
                                name="graduate_skill_gaps"
                                className="form-textarea"
                                placeholder="Describe any capability, technical, or soft skill deficits observed in recent hires..."
                                value={formData.graduate_skill_gaps}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                </div>

                {/* Error Alerts */}
                {errorMsg && (
                    <div className="form-alert error">
                        <AlertCircle size={18} />
                        <span>{errorMsg}</span>
                    </div>
                )}

                {/* Submission action buttons */}
                <div className="form-actions">
                    <button type="submit" className="submit-btn" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                <span>Submitting...</span>
                            </>
                        ) : (
                            <>
                                <Send size={18} />
                                <span>Submit Survey</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
