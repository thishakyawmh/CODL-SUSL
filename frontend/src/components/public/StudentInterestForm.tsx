import React, { useState, useEffect } from 'react';
import { GraduationCap, CheckCircle2, AlertCircle, Loader2, Send, Plus, Trash2 } from 'lucide-react';
import { studentInterestService } from '../../services/apiService';
import './StudentInterestForm.css';

interface InterestConfig {
    id: number;
    interest_field: string;
    skills: string[];
}

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

    const teachingMethodsOptions = [
        'Fully Online lectures',
        'Physical classes/lectures',
        'Hybrid mode (Both)',
        'Practical labs & workshops',
        'Industry guest talks/seminars'
    ];

    // State for configs loaded from admin backend
    const [interestConfig, setInterestConfig] = useState<InterestConfig[]>([]);

    // State for profile data
    const [formData, setFormData] = useState({
        email: '',
        whatsapp_no: '',
        education_level: 'Undergraduate',
        custom_education_level: '',
        province: '',
        district: '',
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
        loadConfig();
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
                        <h1>Student Academic Interest Survey</h1>
                        <p>Center for Open and Distance Learning (CODL) — Sabaragamuwa University of Sri Lanka</p>
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
                                });
                                setPrimaryInterest({ field: '', skills: [], teaching_methods: [], theory_practical: 3 });
                                setSecondaryInterest({ field: '', skills: [], teaching_methods: [], theory_practical: 3 });
                                setTernaryInterest({ field: '', skills: [], teaching_methods: [], theory_practical: 3 });
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
                    <h1>Student Academic Interest Survey</h1>
                    <p>Center for Open and Distance Learning (CODL) — Sabaragamuwa University of Sri Lanka</p>
                </div>
                <div className="banner-image-placeholder">
                    <img src={bannerImgUrl} alt="Student Interest Survey Banner" />
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
                                            {teachingMethodsOptions.map(method => (
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

                                    {/* Theory vs Practical */}
                                    <div className="form-group full-width slider-container">
                                        <label>
                                            Preferred Learning Balance (Theory vs. Practical focus) * : <strong>{
                                                primaryInterest.theory_practical === 1 ? '100% Theoretical' : 
                                                primaryInterest.theory_practical === 5 ? '100% Practical/Applied' : 
                                                primaryInterest.theory_practical === 3 ? 'Balanced Hybrid' : 
                                                primaryInterest.theory_practical === 2 ? 'More Theoretical' : 'More Practical'
                                            }</strong>
                                        </label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="5"
                                            value={primaryInterest.theory_practical}
                                            onChange={(e) => handleSliderChange('primary', parseInt(e.target.value))}
                                            className="form-range"
                                        />
                                        <div className="slider-labels">
                                            <span>Theoretical Core</span>
                                            <span>Balanced</span>
                                            <span>Applied / Practical</span>
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
                                                {teachingMethodsOptions.map(method => (
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

                                        {/* Theory vs Practical */}
                                        <div className="form-group full-width slider-container">
                                            <label>
                                                Preferred Learning Balance (Theory vs. Practical focus) * : <strong>{
                                                    secondaryInterest.theory_practical === 1 ? '100% Theoretical' : 
                                                    secondaryInterest.theory_practical === 5 ? '100% Practical/Applied' : 
                                                    secondaryInterest.theory_practical === 3 ? 'Balanced Hybrid' : 
                                                    secondaryInterest.theory_practical === 2 ? 'More Theoretical' : 'More Practical'
                                                }</strong>
                                            </label>
                                            <input
                                                type="range"
                                                min="1"
                                                max="5"
                                                value={secondaryInterest.theory_practical}
                                                onChange={(e) => handleSliderChange('secondary', parseInt(e.target.value))}
                                                className="form-range"
                                            />
                                            <div className="slider-labels">
                                                <span>Theoretical Core</span>
                                                <span>Balanced</span>
                                                <span>Applied / Practical</span>
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
                                                {teachingMethodsOptions.map(method => (
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
                                            <label>
                                                Preferred Learning Balance (Theory vs. Practical focus) * : <strong>{
                                                    ternaryInterest.theory_practical === 1 ? '100% Theoretical' : 
                                                    ternaryInterest.theory_practical === 5 ? '100% Practical/Applied' : 
                                                    ternaryInterest.theory_practical === 3 ? 'Balanced Hybrid' : 
                                                    ternaryInterest.theory_practical === 2 ? 'More Theoretical' : 'More Practical'
                                                }</strong>
                                            </label>
                                            <input
                                                type="range"
                                                min="1"
                                                max="5"
                                                value={ternaryInterest.theory_practical}
                                                onChange={(e) => handleSliderChange('ternary', parseInt(e.target.value))}
                                                className="form-range"
                                            />
                                            <div className="slider-labels">
                                                <span>Theoretical Core</span>
                                                <span>Balanced</span>
                                                <span>Applied / Practical</span>
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
