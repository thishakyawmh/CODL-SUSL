import React, { useState, useEffect } from 'react';
import { GraduationCap, CheckCircle2, AlertCircle, Loader2, Send, Info } from 'lucide-react';
import { industryAnalysisService } from '../../services/apiService';
import './IndustryAnalysisForm.css';

export function IndustryAnalysisForm() {
    const [formData, setFormData] = useState({
        company_name: '',
        industry_sector: '',
        organization_size: 'Medium',
        primary_academic_field: '',
        secondary_academic_field: '',
        third_academic_field: '',
        required_skills: '',
        academic_practices: '',
        minimum_qualification: 'Bachelor\'s Degree',
        minimum_degree_result: 'Second Class Upper',
        certification_importance: 3,
        emerging_fields: '',
        new_program_suggestion: '',
        graduate_skill_gaps: '',
        additional_recommendations: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Load Google reCAPTCHA v3 script dynamically
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

    // Determine backend URL dynamically
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    const bannerImgUrl = `${backendUrl}/storage/industry-analysis.webp`;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg('');

        // Basic validations
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
        if (!formData.primary_academic_field) {
            setErrorMsg('Please select your primary academic field of interest.');
            setIsLoading(false);
            return;
        }

        try {
            // Get reCAPTCHA v3 token if configured
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
                ...formData,
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
                                secondary_academic_field: '',
                                third_academic_field: '',
                                required_skills: '',
                                academic_practices: '',
                                minimum_qualification: 'Bachelor\'s Degree',
                                minimum_degree_result: 'Second Class Upper',
                                certification_importance: 3,
                                emerging_fields: '',
                                new_program_suggestion: '',
                                graduate_skill_gaps: '',
                                additional_recommendations: ''
                            });
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
            {/* Top Header Card */}
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

            {/* Premium Info Card */}
            <div className="industry-analysis-description-card">
                <div className="description-text">
                    This survey gathers industry feedback to identify current skill demands and emerging trends, supporting curriculum advancement and the development of relevant future degree programs.
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="interest-form">

                {/* Part 1: Company Profile */}
                <div className="form-section">
                    <div className="section-header-row">
                        <h3 className="form-section-title" style={{ borderLeftColor: '#7C3AED' }}>
                            Part 1: Company Profile
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
                                <option value="Information Technology">Information Technology</option>
                                <option value="Engineering & Construction">Engineering & Construction</option>
                                <option value="Banking & Finance">Banking & Finance</option>
                                <option value="Tourism & Hospitality">Tourism & Hospitality</option>
                                <option value="Apparel & Manufacturing">Apparel & Manufacturing</option>
                                <option value="Healthcare & Pharmaceutical">Healthcare & Pharmaceutical</option>
                                <option value="Education & Research">Education & Research</option>
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

                {/* Part 2: Academic & Skill Alignment */}
                <div className="form-section">
                    <div className="section-header-row">
                        <h3 className="form-section-title" style={{ borderLeftColor: '#3B82F6' }}>
                            Part 2: Academic & Skill Alignment
                        </h3>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="primary_academic_field">Primary Academic Domain of Interest *</label>
                            <select
                                id="primary_academic_field"
                                name="primary_academic_field"
                                className="form-select"
                                value={formData.primary_academic_field}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Select Field...</option>
                                <option value="Computing & IT">Computing & Information Technology</option>
                                <option value="Business & Management">Business & Management</option>
                                <option value="Engineering & Technology">Engineering & Technology</option>
                                <option value="Languages & Communication">Languages & Communication</option>
                                <option value="Agricultural Sciences">Agricultural Sciences</option>
                            </select>
                        </div>

                        <div className="form-group full-width">
                            <label htmlFor="required_skills">Demanded Professional Skills</label>
                            <textarea
                                id="required_skills"
                                name="required_skills"
                                className="form-textarea"
                                placeholder="List essential skills, technologies, or tool competencies required for incoming hires..."
                                value={formData.required_skills}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                </div>

                {/* Part 3: Recommendations & Feedback */}
                <div className="form-section">
                    <div className="section-header-row">
                        <h3 className="form-section-title" style={{ borderLeftColor: '#F59E0B' }}>
                            Part 3: Curriculum Recommendations & Feedback
                        </h3>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="minimum_qualification">Expected Minimum Qualification Level</label>
                            <select
                                id="minimum_qualification"
                                name="minimum_qualification"
                                className="form-select"
                                value={formData.minimum_qualification}
                                onChange={handleInputChange}
                            >
                                <option value="Diploma">Diploma</option>
                                <option value="Higher National Diploma">Higher National Diploma (HND)</option>
                                <option value="Bachelor's Degree">Bachelor's Degree</option>
                                <option value="Master's Degree">Master's Degree or Higher</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="certification_importance">Importance of Professional Certifications (1-5)</label>
                            <div className="slider-container" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                                <input
                                    type="range"
                                    id="certification_importance"
                                    name="certification_importance"
                                    min="1"
                                    max="5"
                                    style={{ flex: 1, accentColor: '#7c3aed' }}
                                    value={formData.certification_importance}
                                    onChange={handleInputChange}
                                />
                                <span style={{ fontWeight: 600, color: '#4b5563', minWidth: '24px' }}>
                                    {formData.certification_importance}
                                </span>
                            </div>
                        </div>

                        <div className="form-group full-width">
                            <label htmlFor="graduate_skill_gaps">Observed Skill Gaps in Current Graduates</label>
                            <textarea
                                id="graduate_skill_gaps"
                                name="graduate_skill_gaps"
                                className="form-textarea"
                                placeholder="Describe any gaps in soft skills, technical skills, or business understanding you regularly observe..."
                                value={formData.graduate_skill_gaps}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="form-group full-width">
                            <label htmlFor="new_program_suggestion">New Degree Programs or Specialization Recommendations</label>
                            <textarea
                                id="new_program_suggestion"
                                name="new_program_suggestion"
                                className="form-textarea"
                                placeholder="If you could introduce one new specialization or degree program, what would it be?..."
                                value={formData.new_program_suggestion}
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
