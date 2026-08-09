import React, { useState, useEffect } from 'react';
import { GraduationCap, CheckCircle2, AlertCircle, Loader2, Send, Plus, Trash2, Info } from 'lucide-react';
import { studentInterestService } from '../../services/apiService';
import './StudentInterestForm.css';

interface InterestConfig {
    id: number;
    interest_field: string;
    skills: string[];
}

const DEFAULT_FALLBACK_CONFIG: InterestConfig[] = [
    {
        id: 1,
        interest_field: 'Computing & Information Technology',
        skills: ['Artificial Intelligence', 'Machine Learning', 'Data Science', 'Software Engineering', 'Cyber Security', 'Cloud Computing', 'DevOps', 'Networking', 'Database Systems', 'Mobile App Development', 'Web Development', 'UI/UX Design', 'Game Development', 'Internet of Things (IoT)', 'Blockchain', 'Robotics', 'Digital Forensics', 'Project Management']
    },
    {
        id: 2,
        interest_field: 'Engineering & Technology',
        skills: ['Civil Engineering', 'Mechanical Engineering', 'Electrical Engineering', 'Electronic Engineering', 'Mechatronics', 'Chemical Engineering', 'Biomedical Engineering', 'Aerospace Engineering', 'Environmental Engineering', 'Industrial Engineering', 'Renewable Energy Engineering', 'Robotics']
    },
    {
        id: 3,
        interest_field: 'Business & Management',
        skills: ['Human Resource Management', 'Entrepreneurship', 'International Business', 'Supply Chain Management', 'Business Analytics', 'Digital Marketing', 'Project Management', 'Finance', 'Banking', 'E-Commerce']
    },
    {
        id: 4,
        interest_field: 'Accounting & Finance',
        skills: ['Financial Technology (FinTech)', 'Investment Banking & Wealth Management', 'Forensic Accounting & Fraud Examination', 'Corporate Finance & Valuation', 'International Financial Reporting (IFRS)', 'Tax Strategy & Advisory', 'Audit & Assurance', 'Sustainable Finance & ESG Reporting', 'Risk Management']
    },
    {
        id: 5,
        interest_field: 'Marketing',
        skills: ['Digital & Social Media Marketing', 'Brand Management', 'Consumer Behavior Analytics', 'Content Marketing', 'Influencer & Affiliate Marketing', 'SEO & SEM Strategies', 'Public Relations (PR)', 'Neuromarketing', 'Growth Hacking', 'E-commerce Marketing']
    },
    {
        id: 6,
        interest_field: 'Economics',
        skills: ['Behavioral Economics', 'Development Economics', 'Data Analytics & Econometrics', 'International Trade & Globalization', 'Public Policy Economics', 'Financial Economics', 'Environmental & Resource Economics', 'Macroeconomic Strategy & Policy', 'Labor & Health Economics']
    },
    {
        id: 7,
        interest_field: 'Mathematics & Statistics',
        skills: ['Applied Mathematics', 'Data Science & Statistics', 'Actuarial Science', 'Financial Mathematics', 'Operations Research', 'Cryptography & Security', 'Mathematical Modeling', 'Quantitative Finance', 'Pure Mathematics']
    },
    {
        id: 8,
        interest_field: 'Medicine & Health Sciences',
        skills: ['Medicine', 'Pharmacy', 'Nursing', 'Physiotherapy', 'Medical Laboratory Science', 'Public Health', 'Nutrition', 'Psychology']
    },
    {
        id: 9,
        interest_field: 'Science',
        skills: ['Physics', 'Chemistry', 'Biology', 'Biotechnology', 'Environmental Science', 'Food Science', 'Nanotechnology', 'Astronomy']
    },
    {
        id: 10,
        interest_field: 'Agriculture',
        skills: ['Precision Agriculture / Smart Farming', 'Agribusiness Management', 'Food Technology & Safety', 'Horticulture', 'Sustainable Agriculture', 'Agricultural Engineering', 'Plant Biotechnology', 'Agri-informatics', 'Aquaculture & Fisheries', 'Climate-Smart Agriculture']
    },
    {
        id: 11,
        interest_field: 'Law',
        skills: ['Corporate & Commercial Law', 'Cyber Law & Digital Rights', 'Intellectual Property (IP) Law', 'International Law', 'Human Rights Law', 'Environmental & Climate Law', 'Criminal Law & Justice', 'Family Law', 'Space & Aviation Law', 'AI & Technology Law', 'Alternative Dispute Resolution (ADR)']
    },
    {
        id: 12,
        interest_field: 'Education',
        skills: ['EdTech (Educational Technology)', 'Early Childhood Education', 'Special Education & Inclusion', 'Curriculum & Instructional Design', 'Educational Leadership & Management', 'TESOL (Teaching English as a Second Language)', 'STEM/STEAM Education', 'Adult & Continuing Education']
    },
    {
        id: 13,
        interest_field: 'Social Sciences',
        skills: ['Psychology (Clinical & Behavioral)', 'Sociology & Criminology', 'International Relations & Diplomacy', 'Political Science', 'Behavioral Economics', 'Anthropology', 'Gender Studies', 'Public Policy & Administration', 'Urban & Community Studies']
    },
    {
        id: 14,
        interest_field: 'Arts & Humanities',
        skills: ['Digital Arts & Animation', 'Graphic Design', 'Performing Arts (Music/Dance/Drama)', 'Fine Arts', 'Creative Writing', 'Film & Media Production', 'Game Art & Design', 'Fashion Design', 'Interior Design']
    },
    {
        id: 15,
        interest_field: 'Architecture',
        skills: ['Sustainable & Green Architecture', 'Urban Design & Planning', 'Landscape Architecture', 'Interior Architecture', 'Parametric & Computational Design', 'Smart City Planning', 'Architectural Conservation', 'BIM (Building Information Modeling)']
    },
    {
        id: 16,
        interest_field: 'Environmental Studies',
        skills: ['Climate Change & Adaptation Strategy', 'Sustainable Resource Management', 'Renewable Energy & Clean Tech', 'Environmental Policy & Governance', 'Biodiversity & Conservation Biology', 'Environmental Impact Assessment (EIA)', 'Disaster Risk Reduction & Management', 'Urban Ecology & Sustainability', 'Circular Economy & Waste Management']
    },
    {
        id: 17,
        interest_field: 'Hospitality & Tourism',
        skills: ['Hotel & Resort Management', 'Sustainable Tourism / Ecotourism', 'Event & Experience Management', 'Culinary Arts & Management', 'Aviation & Cruise Management', 'Travel Tech & Digital Tourism', 'Luxury Brand Management', 'Food & Beverage Operations']
    },
    {
        id: 18,
        interest_field: 'Media & Communication',
        skills: ['Digital Journalism & New Media', 'Strategic Communication & Public Relations (PR)', 'Media Production & Broadcasting', 'Social Media Strategy & Content Creation', 'Film & Cinema Studies', 'Advertising & Brand Communication', 'Corporate & Organizational Communication', 'Media Analytics & Audience Research', 'Interactive Media & Game Journalism']
    },
    {
        id: 19,
        interest_field: 'Psychology',
        skills: ['Counseling Psychology', 'Cognitive & Behavioral Neuroscience', 'Industrial & Organizational (I/O) Psychology', 'Educational & School Psychology', 'Child & Adolescent Psychology', 'Forensic & Criminal Psychology', 'Health & Sports Psychology', 'Media & Cyberpsychology', 'Social & Personality Psychology']
    }
];

export const StudentInterestForm: React.FC = () => {
    // Determine backend URL dynamically
    const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/api$/, '');
    const bannerImgUrl = `${backendUrl}/storage/form1.webp`;

    // Provinces and Districts mapping in Sri Lanka
    const provinceDistricts: Record<string, string[]> = {
        'Western': ['Colombo', 'Gampaha', 'Kalutara'],
        'Central': ['Kandy', 'Matale', 'Nuwara Eliya'],
        'Southern': ['Galle', 'Matara', 'Hambantota'],
        'Northern': ['Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu'],
        'Eastern': ['Trincomalee', 'Batticaloa', 'Ampara'],
        'North Western': ['Kurunegala', 'Puttalam'],
        'North Central': ['Anuradhapura', 'Polonnaruwa'],
        'Uva': ['Badulla', 'Moneragala'],
        'Sabaragamuwa': ['Ratnapura', 'Kegalle']
    };

    const provinces = Object.keys(provinceDistricts);

    const DEFAULT_TEACHING_METHODS = [
        'Practical Labs',
        'Workshops',
        'Group Projects',
        'Individual Projects',
        'Industry Training',
        'Research Projects',
        'Field Visits',
        'Guest Lectures',
        'Traditional Lectures',
        'Online Learning',
        'Competitions / Hackathons'
    ];

    const [teachingMethods, setTeachingMethods] = useState<string[]>(DEFAULT_TEACHING_METHODS);

    const DEFAULT_UNIVERSITY_OPPORTUNITIES = [
        'Professional Certifications',
        'Industry Internships',
        'Research Opportunities',
        'Startup Support',
        'Career Guidance',
        'International Exchange',
        'Scholarships',
        'Modern Laboratories',
        'Innovation Centres',
        'Industry Projects'
    ];

    const [universityOpportunities, setUniversityOpportunities] = useState<string[]>(DEFAULT_UNIVERSITY_OPPORTUNITIES);
    const [selectedOpportunities, setSelectedOpportunities] = useState<string[]>([]);

    // State for configs loaded from admin backend
    const [interestConfig, setInterestConfig] = useState<InterestConfig[]>(DEFAULT_FALLBACK_CONFIG);

    // State for profile data
    const [formData, setFormData] = useState({
        email: '',
        whatsapp_no: '',
        education_level: 'Undergraduate',
        custom_education_level: '',
        province: '',
        district: '',
        new_program_suggestion: ''
    });

    // Dynamic sections state
    const [primaryInterest, setPrimaryInterest] = useState({
        field: '',
        skills: [] as string[],
        teaching_methods: [] as string[],
        theory_practical: 3
    });

    const [secondaryInterest, setSecondaryInterest] = useState({
        field: '',
        skills: [] as string[],
        teaching_methods: [] as string[],
        theory_practical: 3
    });
    const [showSecondary, setShowSecondary] = useState(false);

    const [ternaryInterest, setTernaryInterest] = useState({
        field: '',
        skills: [] as string[],
        teaching_methods: [] as string[],
        theory_practical: 3
    });
    const [showTernary, setShowTernary] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Fetch config on mount
    useEffect(() => {
        const loadConfig = async () => {
            try {
                const data = await studentInterestService.getConfig();
                setInterestConfig(data);
            } catch (err) {
                console.error('Failed to load academic interest configs:', err);
            }
        };

        const loadTeachingMethods = async () => {
            try {
                const data = await studentInterestService.getTeachingMethods();
                if (data && data.length > 0) {
                    setTeachingMethods(data.map((m: any) => m.method_name));
                }
            } catch (err) {
                console.error('Failed to load teaching methods:', err);
            }
        };

        const loadOpportunities = async () => {
            try {
                const data = await studentInterestService.getUniversityOpportunities();
                if (data && data.length > 0) {
                    setUniversityOpportunities(data.map((o: any) => o.opportunity_name));
                }
            } catch (err) {
                console.error('Failed to load university opportunities:', err);
            }
        };

        loadConfig();
        loadTeachingMethods();
        loadOpportunities();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // If province changes, reset district
        if (name === 'province') {
            setFormData(prev => ({
                ...prev,
                province: value,
                district: ''
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // Helper to get skills list for a selected interest field
    const getSkillsForField = (fieldName: string): string[] => {
        const matched = interestConfig.find(c => c.interest_field === fieldName);
        return matched ? matched.skills : [];
    };

    // Helper to manage skill selection (Max 5)
    const handleSkillToggle = (
        interestType: 'primary' | 'secondary' | 'ternary',
        skill: string
    ) => {
        const setterMap = {
            primary: { state: primaryInterest, set: setPrimaryInterest },
            secondary: { state: secondaryInterest, set: setSecondaryInterest },
            ternary: { state: ternaryInterest, set: setTernaryInterest }
        };

        const { state, set } = setterMap[interestType];
        const current = [...state.skills];
        const index = current.indexOf(skill);

        if (index > -1) {
            current.splice(index, 1);
            set({ ...state, skills: current });
        } else {
            if (current.length >= 5) {
                // Ignore if already reached 5
                return;
            }
            current.push(skill);
            set({ ...state, skills: current });
        }
    };

    // Helper to toggle teaching methods
    const handleMethodToggle = (
        interestType: 'primary' | 'secondary' | 'ternary',
        method: string
    ) => {
        const setterMap = {
            primary: { state: primaryInterest, set: setPrimaryInterest },
            secondary: { state: secondaryInterest, set: setSecondaryInterest },
            ternary: { state: ternaryInterest, set: setTernaryInterest }
        };

        const { state, set } = setterMap[interestType];
        const current = [...state.teaching_methods];
        const index = current.indexOf(method);

        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(method);
        }
        set({ ...state, teaching_methods: current });
    };

    const handleOpportunityToggle = (opportunity: string) => {
        const current = [...selectedOpportunities];
        const index = current.indexOf(opportunity);
        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(opportunity);
        }
        setSelectedOpportunities(current);
    };

    const handleSliderChange = (
        interestType: 'primary' | 'secondary' | 'ternary',
        value: number
    ) => {
        const setterMap = {
            primary: { state: primaryInterest, set: setPrimaryInterest },
            secondary: { state: secondaryInterest, set: setSecondaryInterest },
            ternary: { state: ternaryInterest, set: setTernaryInterest }
        };

        const { state, set } = setterMap[interestType];
        set({ ...state, theory_practical: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg('');

        // Basic Profile validations
        if (!formData.province) {
            setErrorMsg('Please select your province.');
            setIsLoading(false);
            return;
        }
        if (!formData.district) {
            setErrorMsg('Please select your district.');
            setIsLoading(false);
            return;
        }

        // Determine final education level text
        const finalEducationLevel = formData.education_level === 'Other'
            ? formData.custom_education_level.trim()
            : formData.education_level;

        if (formData.education_level === 'Other' && !finalEducationLevel) {
            setErrorMsg('Please specify your custom education level.');
            setIsLoading(false);
            return;
        }

        // Primary Interest validations
        if (!primaryInterest.field) {
            setErrorMsg('Primary Academic Interest is required.');
            setIsLoading(false);
            return;
        }
        if (primaryInterest.skills.length === 0) {
            setErrorMsg('Please select at least one related skill for your Primary Interest.');
            setIsLoading(false);
            return;
        }
        if (primaryInterest.teaching_methods.length === 0) {
            setErrorMsg('Please select at least one suggested teaching method for your Primary Interest.');
            setIsLoading(false);
            return;
        }

        // Secondary Interest validations
        if (showSecondary) {
            if (!secondaryInterest.field) {
                setErrorMsg('Please select an interest field for your Secondary Interest, or remove the section.');
                setIsLoading(false);
                return;
            }
            if (secondaryInterest.skills.length === 0) {
                setErrorMsg('Please select at least one related skill for your Secondary Interest.');
                setIsLoading(false);
                return;
            }
            if (secondaryInterest.teaching_methods.length === 0) {
                setErrorMsg('Please select at least one suggested teaching method for your Secondary Interest.');
                setIsLoading(false);
                return;
            }
        }

        // Ternary Interest validations
        if (showTernary) {
            if (!ternaryInterest.field) {
                setErrorMsg('Please select an interest field for your Ternary Interest, or remove the section.');
                setIsLoading(false);
                return;
            }
            if (ternaryInterest.skills.length === 0) {
                setErrorMsg('Please select at least one related skill for your Ternary Interest.');
                setIsLoading(false);
                return;
            }
            if (ternaryInterest.teaching_methods.length === 0) {
                setErrorMsg('Please select at least one suggested teaching method for your Ternary Interest.');
                setIsLoading(false);
                return;
            }
        }

        // University Opportunities validation
        if (selectedOpportunities.length === 0) {
            setErrorMsg('Please select at least one university opportunity that is important to you.');
            setIsLoading(false);
            return;
        }

        try {
            // Prepare payload
            const payload = {
                email: formData.email.trim() || null,
                whatsapp_no: formData.whatsapp_no.trim() || null,
                education_level: finalEducationLevel,
                province: formData.province,
                district: formData.district,

                // Primary Interest
                primary_field: primaryInterest.field,
                primary_skills: primaryInterest.skills.join(', '),
                primary_teaching_methods: primaryInterest.teaching_methods.join(', '),
                primary_theory_practical: primaryInterest.theory_practical,

                // Secondary Interest
                secondary_field: showSecondary ? secondaryInterest.field : null,
                secondary_skills: showSecondary ? secondaryInterest.skills.join(', ') : null,
                secondary_teaching_methods: showSecondary ? secondaryInterest.teaching_methods.join(', ') : null,
                secondary_theory_practical: showSecondary ? secondaryInterest.theory_practical : null,

                // Ternary Interest
                third_field: showTernary ? ternaryInterest.field : null,
                third_skills: showTernary ? ternaryInterest.skills.join(', ') : null,
                third_teaching_methods: showTernary ? ternaryInterest.teaching_methods.join(', ') : null,
                third_theory_practical: showTernary ? ternaryInterest.theory_practical : null,

                // University Opportunities
                university_opportunities: selectedOpportunities.join(', '),

                // New Program Suggestion (Optional)
                new_program_suggestion: formData.new_program_suggestion.trim() || null,
            };

            await studentInterestService.submit(payload);
            setIsSubmitted(true);
        } catch (err: any) {
            console.error('Submission failed:', err);
            setErrorMsg(
                err.response?.data?.message ||
                'Failed to record your response. Please try again later.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const activeDistricts = formData.province ? provinceDistricts[formData.province] : [];

    // Filter dynamic configuration list so that students don't select the same category twice
    const getAvailableFields = (currentField: string) => {
        const selectedFields = [
            primaryInterest.field,
            showSecondary ? secondaryInterest.field : '',
            showTernary ? ternaryInterest.field : ''
        ].filter(f => f && f !== currentField);

        return interestConfig.filter(c => !selectedFields.includes(c.interest_field));
    };

    if (isSubmitted) {
        return (
            <div className="student-interest-container">
                <div className="student-interest-header-card">
                    <div className="header-text-section">
                        <h1>Student Academic Interests</h1>
                        <p>
                            Center for Open and Distance Learning <br />
                            Sabaragamuwa University of Sri Lanka
                        </p>
                    </div>
                    <div className="banner-image-placeholder">
                        <img src={bannerImgUrl} alt="Student Interest Survey Banner" />
                    </div>
                </div>
                <div className="student-interest-card">
                    <div className="success-layout">
                        <div className="success-icon-wrapper">
                            <CheckCircle2 size={48} />
                        </div>
                        <h2>Response Recorded!</h2>
                        <p>
                            Thank you! Your academic interests, preferred skills, and learning practices have been submitted successfully.
                        </p>
                        <button
                            className="back-btn"
                            onClick={() => {
                                setIsSubmitted(false);
                                setFormData({
                                    email: '',
                                    whatsapp_no: '',
                                    education_level: 'Undergraduate',
                                    custom_education_level: '',
                                    province: '',
                                    district: '',
                                    new_program_suggestion: ''
                                });
                                setPrimaryInterest({ field: '', skills: [], teaching_methods: [], theory_practical: 3 });
                                setSecondaryInterest({ field: '', skills: [], teaching_methods: [], theory_practical: 3 });
                                setTernaryInterest({ field: '', skills: [], teaching_methods: [], theory_practical: 3 });
                                setSelectedOpportunities([]);
                                setShowSecondary(false);
                                setShowTernary(false);
                            }}
                        >
                            Submit Another Response
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="student-interest-container">
            <div className="student-interest-header-card">
                <div className="header-text-section">
                    <h1>Student Academic Interests</h1>
                    <p>
                        Center for Open and Distance Learning <br />
                        Sabaragamuwa University of Sri Lanka
                    </p>
                </div>
                <div className="banner-image-placeholder">
                    <img src={bannerImgUrl} alt="Student Interest Survey Banner" />
                </div>
            </div>

            <div className="student-interest-description-card">
                <div className="description-text-container">
                    <p className="description-main-text">
                        This 3–5 minute survey explores students’ academic interests, learning preferences, and career goals to help improve future degree programs and teaching methods. Your responses are confidential.
                    </p>
                </div>
            </div>

            <div className="student-interest-card">
                <form onSubmit={handleSubmit} className="interest-form">

                    {/* Part 1: Profile & Contact */}
                    <div className="form-section">
                        <h3 className="form-section-title">Profile & Contact Details</h3>
                        <div className="form-grid">

                            {/* Education level */}
                            <div className="form-group">
                                <label htmlFor="education_level">Current Education Level</label>
                                <select
                                    id="education_level"
                                    name="education_level"
                                    value={formData.education_level}
                                    onChange={handleInputChange}
                                    className="form-select"
                                    required
                                >
                                    <option value="Ordinary Level (O/L)">Ordinary Level (O/L)</option>
                                    <option value="Advanced Level (A/L)">Advanced Level (A/L)</option>
                                    <option value="Completed A/L">Completed A/L</option>
                                    <option value="Undergraduate">Undergraduate</option>
                                    <option value="Other">Other (to type)</option>
                                </select>
                            </div>

                            {/* Custom education level input when "Other" is chosen */}
                            {formData.education_level === 'Other' && (
                                <div className="form-group">
                                    <label htmlFor="custom_education_level">Specify Education Level *</label>
                                    <input
                                        type="text"
                                        id="custom_education_level"
                                        name="custom_education_level"
                                        value={formData.custom_education_level}
                                        onChange={handleInputChange}
                                        placeholder="Type your education level"
                                        className="form-input"
                                        required
                                    />
                                </div>
                            )}

                            {/* Province */}
                            <div className="form-group">
                                <label htmlFor="province">Province *</label>
                                <select
                                    id="province"
                                    name="province"
                                    value={formData.province}
                                    onChange={handleInputChange}
                                    className="form-select"
                                    required
                                >
                                    <option value="">-- Select Province --</option>
                                    {provinces.map(prov => (
                                        <option key={prov} value={prov}>{prov}</option>
                                    ))}
                                </select>
                            </div>

                            {/* District (Filtered) */}
                            <div className="form-group">
                                <label htmlFor="district">District *</label>
                                <select
                                    id="district"
                                    name="district"
                                    value={formData.district}
                                    onChange={handleInputChange}
                                    className="form-select"
                                    disabled={!formData.province}
                                    required
                                >
                                    <option value="">
                                        {formData.province ? '-- Select District --' : 'Please select a province first'}
                                    </option>
                                    {activeDistricts.map(dist => (
                                        <option key={dist} value={dist}>{dist}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Email Address */}
                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="yourname@example.com"
                                    className="form-input"
                                />
                            </div>

                            {/* WhatsApp Number */}
                            <div className="form-group">
                                <label htmlFor="whatsapp_no">WhatsApp Number</label>
                                <input
                                    type="tel"
                                    id="whatsapp_no"
                                    name="whatsapp_no"
                                    value={formData.whatsapp_no}
                                    onChange={handleInputChange}
                                    placeholder="e.g. +94771234567"
                                    className="form-input"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Part 2: Primary Academic Interest */}
                    <div className="form-section">
                        <div className="section-header-row">
                            <h3 className="form-section-title" style={{ borderLeftColor: '#7C3AED', marginBottom: 0 }}>
                                Primary Academic Interest *
                            </h3>
                        </div>

                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label htmlFor="primary_field">Select Primary Academic Interest Area *</label>
                                <select
                                    id="primary_field"
                                    value={primaryInterest.field}
                                    onChange={(e) => {
                                        setPrimaryInterest({
                                            field: e.target.value,
                                            skills: [],
                                            teaching_methods: [],
                                            theory_practical: 3
                                        });
                                    }}
                                    className="form-select"
                                    required
                                >
                                    <option value="">-- Select Academic Field --</option>
                                    {getAvailableFields(primaryInterest.field).map(c => (
                                        <option key={c.id} value={c.interest_field}>{c.interest_field}</option>
                                    ))}
                                </select>
                            </div>

                            {primaryInterest.field && (
                                <>
                                    {/* Skills associated */}
                                    <div className="form-group full-width">
                                        <label>Select up to 5 Key Skills of interest for this area * (Selected: {primaryInterest.skills.length}/5)</label>
                                        <div className="choice-grid">
                                            {getSkillsForField(primaryInterest.field).map(skill => (
                                                <div
                                                    key={skill}
                                                    className={`choice-chip ${primaryInterest.skills.includes(skill) ? 'active' : ''}`}
                                                    onClick={() => handleSkillToggle('primary', skill)}
                                                >
                                                    {skill}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Teaching Methods */}
                                    <div className="form-group full-width">
                                        <label>Suggested Teaching Methods for this academic area *</label>
                                        <div className="choice-grid">
                                            {teachingMethods.map(method => (
                                                <div
                                                    key={method}
                                                    className={`choice-chip ${primaryInterest.teaching_methods.includes(method) ? 'active' : ''}`}
                                                    onClick={() => handleMethodToggle('primary', method)}
                                                >
                                                    {method}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Preferred Learning Balance */}
                                    <div className="form-group full-width slider-container">
                                        <label>Preferred Learning Balance *</label>
                                        <div className="learning-balance-selector">
                                            {[1, 2, 3, 4, 5].map((val) => (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    className={`balance-option ${primaryInterest.theory_practical === val ? 'active' : ''}`}
                                                    onClick={() => handleSliderChange('primary', val)}
                                                >
                                                    <span className="balance-number">{val}</span>
                                                    <span className="balance-label">{
                                                        val === 1 ? 'Theoretical' :
                                                            val === 2 ? 'Mostly Theory' :
                                                                val === 3 ? 'Balanced' :
                                                                    val === 4 ? 'Mostly Practical' : 'Practical'
                                                    }</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Part 3: Secondary Academic Interest (Optional) */}
                    {showSecondary && (
                        <div className="form-section">
                            <div className="section-header-row">
                                <h3 className="form-section-title" style={{ borderLeftColor: '#F59E0B', marginBottom: 0 }}>
                                    Secondary Academic Interest
                                </h3>
                                <button
                                    type="button"
                                    className="remove-interest-btn"
                                    onClick={() => {
                                        setShowSecondary(false);
                                        setSecondaryInterest({ field: '', skills: [], teaching_methods: [], theory_practical: 3 });
                                        // If secondary is removed, ternary must also be removed/shifted
                                        setShowTernary(false);
                                        setTernaryInterest({ field: '', skills: [], teaching_methods: [], theory_practical: 3 });
                                    }}
                                >
                                    <Trash2 size={14} /> Remove Section
                                </button>
                            </div>

                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label htmlFor="secondary_field">Select Secondary Academic Interest Area *</label>
                                    <select
                                        id="secondary_field"
                                        value={secondaryInterest.field}
                                        onChange={(e) => {
                                            setSecondaryInterest({
                                                field: e.target.value,
                                                skills: [],
                                                teaching_methods: [],
                                                theory_practical: 3
                                            });
                                        }}
                                        className="form-select"
                                        required
                                    >
                                        <option value="">-- Select Academic Field --</option>
                                        {getAvailableFields(secondaryInterest.field).map(c => (
                                            <option key={c.id} value={c.interest_field}>{c.interest_field}</option>
                                        ))}
                                    </select>
                                </div>

                                {secondaryInterest.field && (
                                    <>
                                        {/* Skills associated */}
                                        <div className="form-group full-width">
                                            <label>Select up to 5 Key Skills of interest for this area * (Selected: {secondaryInterest.skills.length}/5)</label>
                                            <div className="choice-grid">
                                                {getSkillsForField(secondaryInterest.field).map(skill => (
                                                    <div
                                                        key={skill}
                                                        className={`choice-chip ${secondaryInterest.skills.includes(skill) ? 'active' : ''}`}
                                                        onClick={() => handleSkillToggle('secondary', skill)}
                                                    >
                                                        {skill}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Teaching Methods */}
                                        <div className="form-group full-width">
                                            <label>Suggested Teaching Methods for this academic area *</label>
                                            <div className="choice-grid">
                                                {teachingMethods.map(method => (
                                                    <div
                                                        key={method}
                                                        className={`choice-chip ${secondaryInterest.teaching_methods.includes(method) ? 'active' : ''}`}
                                                        onClick={() => handleMethodToggle('secondary', method)}
                                                    >
                                                        {method}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Preferred Learning Balance */}
                                        <div className="form-group full-width slider-container">
                                            <label>Preferred Learning Balance *</label>
                                            <div className="learning-balance-selector">
                                                {[1, 2, 3, 4, 5].map((val) => (
                                                    <button
                                                        key={val}
                                                        type="button"
                                                        className={`balance-option ${secondaryInterest.theory_practical === val ? 'active' : ''}`}
                                                        onClick={() => handleSliderChange('secondary', val)}
                                                    >
                                                        <span className="balance-number">{val}</span>
                                                        <span className="balance-label">{
                                                            val === 1 ? 'Theoretical' :
                                                                val === 2 ? 'Mostly Theory' :
                                                                    val === 3 ? 'Balanced' :
                                                                        val === 4 ? 'Mostly Practical' : 'Practical'
                                                        }</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Part 4: Ternary Academic Interest (Optional) */}
                    {showTernary && (
                        <div className="form-section">
                            <div className="section-header-row">
                                <h3 className="form-section-title" style={{ borderLeftColor: '#3B82F6', marginBottom: 0 }}>
                                    Ternary Academic Interest
                                </h3>
                                <button
                                    type="button"
                                    className="remove-interest-btn"
                                    onClick={() => {
                                        setShowTernary(false);
                                        setTernaryInterest({ field: '', skills: [], teaching_methods: [], theory_practical: 3 });
                                    }}
                                >
                                    <Trash2 size={14} /> Remove Section
                                </button>
                            </div>

                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label htmlFor="ternary_field">Select Ternary Academic Interest Area *</label>
                                    <select
                                        id="ternary_field"
                                        value={ternaryInterest.field}
                                        onChange={(e) => {
                                            setTernaryInterest({
                                                field: e.target.value,
                                                skills: [],
                                                teaching_methods: [],
                                                theory_practical: 3
                                            });
                                        }}
                                        className="form-select"
                                        required
                                    >
                                        <option value="">-- Select Academic Field --</option>
                                        {getAvailableFields(ternaryInterest.field).map(c => (
                                            <option key={c.id} value={c.interest_field}>{c.interest_field}</option>
                                        ))}
                                    </select>
                                </div>

                                {ternaryInterest.field && (
                                    <>
                                        {/* Skills associated */}
                                        <div className="form-group full-width">
                                            <label>Select up to 5 Key Skills of interest for this area * (Selected: {ternaryInterest.skills.length}/5)</label>
                                            <div className="choice-grid">
                                                {getSkillsForField(ternaryInterest.field).map(skill => (
                                                    <div
                                                        key={skill}
                                                        className={`choice-chip ${ternaryInterest.skills.includes(skill) ? 'active' : ''}`}
                                                        onClick={() => handleSkillToggle('ternary', skill)}
                                                    >
                                                        {skill}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Teaching Methods */}
                                        <div className="form-group full-width">
                                            <label>Suggested Teaching Methods for this academic area *</label>
                                            <div className="choice-grid">
                                                {teachingMethods.map(method => (
                                                    <div
                                                        key={method}
                                                        className={`choice-chip ${ternaryInterest.teaching_methods.includes(method) ? 'active' : ''}`}
                                                        onClick={() => handleMethodToggle('ternary', method)}
                                                    >
                                                        {method}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Theory vs Practical */}
                                        <div className="form-group full-width slider-container">
                                            <label>Preferred Learning Balance *</label>
                                            <div className="learning-balance-selector">
                                                {[1, 2, 3, 4, 5].map((val) => (
                                                    <button
                                                        key={val}
                                                        type="button"
                                                        className={`balance-option ${ternaryInterest.theory_practical === val ? 'active' : ''}`}
                                                        onClick={() => handleSliderChange('ternary', val)}
                                                    >
                                                        <span className="balance-number">{val}</span>
                                                        <span className="balance-label">{
                                                            val === 1 ? 'Theoretical' :
                                                                val === 2 ? 'Mostly Theory' :
                                                                    val === 3 ? 'Balanced' :
                                                                        val === 4 ? 'Mostly Practical' : 'Practical'
                                                        }</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Button to add secondary/ternary section */}
                    {interestConfig.length > 0 && primaryInterest.field && (
                        <div style={{ display: 'flex', gap: '16px' }}>
                            {!showSecondary && (
                                <button
                                    type="button"
                                    className="add-interest-btn"
                                    onClick={() => setShowSecondary(true)}
                                >
                                    <Plus size={16} /> Add Secondary Academic Interest
                                </button>
                            )}
                            {showSecondary && secondaryInterest.field && !showTernary && (
                                <button
                                    type="button"
                                    className="add-interest-btn"
                                    onClick={() => setShowTernary(true)}
                                >
                                    <Plus size={16} /> Add Ternary Academic Interest
                                </button>
                            )}
                        </div>
                    )}

                    {/* Part 5: University Opportunities */}
                    <div className="form-section">
                        <div className="section-header-row">
                            <h3 className="form-section-title" style={{ borderLeftColor: '#10B981', marginBottom: 0 }}>
                                Which university opportunities are most important to you? *
                            </h3>
                        </div>

                        <div className="form-grid" style={{ marginTop: '16px' }}>
                            <div className="form-group full-width">
                                <label>Select the opportunities that interest you the most *</label>
                                <div className="choice-grid">
                                    {universityOpportunities.map(opp => (
                                        <div
                                            key={opp}
                                            className={`choice-chip ${selectedOpportunities.includes(opp) ? 'active' : ''}`}
                                            onClick={() => handleOpportunityToggle(opp)}
                                        >
                                            {opp}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Part 6: New Program Suggestion */}
                    <div className="form-section">
                        <div className="section-header-row">
                            <h3 className="form-section-title" style={{ borderLeftColor: '#F59E0B', marginBottom: 0 }}>
                                If you could introduce ONE new degree program or specialization, what would it be?
                            </h3>
                        </div>
                        <div className="form-grid" style={{ marginTop: '16px' }}>
                            <div className="form-group full-width">
                                <label htmlFor="new_program_suggestion">Your Suggestion</label>
                                <textarea
                                    id="new_program_suggestion"
                                    className="form-textarea"
                                    placeholder="Enter your program or specialization idea..."
                                    value={formData.new_program_suggestion}
                                    onChange={e => setFormData(prev => ({ ...prev, new_program_suggestion: e.target.value }))}
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

                    {/* Form Submission actions */}
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
                                    <span>Submit Details</span>
                                </>
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};
