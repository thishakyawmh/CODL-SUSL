import React, { useState } from 'react';
import { SkillSelector } from '../common/SkillSelector';
import axios from 'axios';
import './IndustrySurveyForm.css'; // We will create some basic styles for the form

export const IndustrySurveyForm: React.FC = () => {
    const [formData, setFormData] = useState({
        // Section 1
        company_name: '',
        industry_sector: '',
        organization_size: '',
        // Section 2
        preferred_fields: [] as string[],
        // Section 3
        required_skills: [] as string[],
        // Section 4
        academic_practices: [] as string[],
        min_qualification: '',
        expected_gpa: '',
        certification_importance: 3,
        // Section 5
        emerging_fields: [] as string[],
        new_program_recommendation: '',
        // Section 6
        skill_shortages: [] as string[],
        additional_recommendations: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleMultiSelect = (field: string, value: string) => {
        setFormData(prev => {
            const currentArray = (prev as any)[field] as string[];
            if (currentArray.includes(value)) {
                return { ...prev, [field]: currentArray.filter(i => i !== value) };
            } else {
                return { ...prev, [field]: [...currentArray, value] };
            }
        });
    };

    const handleSelect3 = (field: string, value: string, max: number = 3) => {
        setFormData(prev => {
            const currentArray = (prev as any)[field] as string[];
            if (currentArray.includes(value)) {
                return { ...prev, [field]: currentArray.filter(i => i !== value) };
            } else if (currentArray.length < max) {
                return { ...prev, [field]: [...currentArray, value] };
            }
            return prev;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            // Flatten arrays into strings for core DB fields where appropriate, 
            // or pass arrays directly (our backend controller will dump arrays to the JSON metadata column)
            const payload = {
                survey_type: 'industry',
                data: {
                    company_name: formData.company_name,
                    industry_sector: formData.industry_sector,
                    required_skills: formData.required_skills.join(', '),
                    skill_shortages: formData.skill_shortages.join(', '),
                    preferred_field: formData.preferred_fields.join(', '), // Using this as graduate demand fields
                    organization_size: formData.organization_size,
                    academic_practices: formData.academic_practices,
                    min_qualification: formData.min_qualification,
                    expected_gpa: formData.expected_gpa,
                    certification_importance: formData.certification_importance,
                    emerging_fields: formData.emerging_fields,
                    new_program_recommendation: formData.new_program_recommendation,
                    additional_recommendations: formData.additional_recommendations
                }
            };

            await axios.post('/api/public/surveys', payload);
            
            setSuccessMessage("Thank you for your valuable feedback! Your response has been submitted.");
            // Reset form
            setFormData({
                company_name: '', industry_sector: '', organization_size: '',
                preferred_fields: [], required_skills: [], academic_practices: [],
                min_qualification: '', expected_gpa: '', certification_importance: 3,
                emerging_fields: [], new_program_recommendation: '',
                skill_shortages: [], additional_recommendations: ''
            });

        } catch (error: any) {
            console.error("Survey submission failed:", error);
            setErrorMessage("Failed to submit the survey. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="survey-container">
            <h1 className="survey-title">Industry Needs Survey</h1>
            <p className="survey-subtitle">Help us shape the future curriculum to meet industry demands.</p>

            {successMessage && <div className="survey-alert success">{successMessage}</div>}
            {errorMessage && <div className="survey-alert error">{errorMessage}</div>}

            <form onSubmit={handleSubmit} className="survey-form">
                
                {/* SECTION 1 */}
                <div className="survey-section">
                    <h2>Section 1: Organization Information</h2>
                    
                    <div className="form-group">
                        <label>Organization / Company Name (Optional)</label>
                        <input 
                            type="text" 
                            className="form-control"
                            value={formData.company_name}
                            onChange={e => setFormData({...formData, company_name: e.target.value})}
                        />
                    </div>

                    <div className="form-group">
                        <label>Industry Sector (Required)</label>
                        <select 
                            required
                            className="form-control"
                            value={formData.industry_sector}
                            onChange={e => setFormData({...formData, industry_sector: e.target.value})}
                        >
                            <option value="">Select Sector...</option>
                            <option value="Information Technology">Information Technology</option>
                            <option value="Engineering & Manufacturing">Engineering & Manufacturing</option>
                            <option value="Banking & Finance">Banking & Finance</option>
                            <option value="Healthcare">Healthcare</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Organization Size</label>
                        <select 
                            className="form-control"
                            value={formData.organization_size}
                            onChange={e => setFormData({...formData, organization_size: e.target.value})}
                        >
                            <option value="">Select Size...</option>
                            <option value="Small">Small (1-50 Employees)</option>
                            <option value="Medium">Medium (51-250 Employees)</option>
                            <option value="Large">Large (251+ Employees)</option>
                        </select>
                    </div>
                </div>

                {/* SECTION 2 */}
                <div className="survey-section">
                    <h2>Section 2: Graduate Demand</h2>
                    <label>Which academic field(s) does your organization recruit graduates from? (Select up to 3)</label>
                    <div className="checkbox-grid">
                        {['Computing & Information Technology', 'Engineering & Technology', 'Business & Management', 'Science', 'Arts & Humanities'].map(field => (
                            <label key={field} className="checkbox-label">
                                <input 
                                    type="checkbox" 
                                    checked={formData.preferred_fields.includes(field)}
                                    onChange={() => handleSelect3('preferred_fields', field)}
                                    disabled={!formData.preferred_fields.includes(field) && formData.preferred_fields.length >= 3}
                                />
                                {field}
                            </label>
                        ))}
                    </div>
                </div>

                {/* SECTION 3 - THE SKILL SELECTOR */}
                <div className="survey-section">
                    <h2>Section 3: Required Skills</h2>
                    <label>Which technical skills, tools, technologies, or competencies are most valuable when recruiting graduates?</label>
                    <SkillSelector 
                        selectedSkills={formData.required_skills}
                        onChange={(skills) => setFormData({...formData, required_skills: skills})}
                        placeholder="Search skills e.g., React, AWS, Python..."
                    />
                </div>

                {/* SECTION 4 */}
                <div className="survey-section">
                    <h2>Section 4: Academic Expectations</h2>
                    <label>Which academic practices would better prepare graduates for your industry?</label>
                    <div className="checkbox-grid">
                        {['Practical Laboratory Sessions', 'Industry Internships', 'Capstone Projects', 'Soft Skills Training'].map(practice => (
                            <label key={practice} className="checkbox-label">
                                <input 
                                    type="checkbox" 
                                    checked={formData.academic_practices.includes(practice)}
                                    onChange={() => handleMultiSelect('academic_practices', practice)}
                                />
                                {practice}
                            </label>
                        ))}
                    </div>
                    
                    <div className="form-group mt-3">
                        <label>Importance of professional certifications</label>
                        <div className="range-slider">
                            <span>Not Important (1)</span>
                            <input 
                                type="range" min="1" max="5" 
                                value={formData.certification_importance}
                                onChange={e => setFormData({...formData, certification_importance: parseInt(e.target.value)})}
                            />
                            <span>Extremely Important (5)</span>
                        </div>
                    </div>
                </div>

                {/* SECTION 5 */}
                <div className="survey-section">
                    <h2>Section 5: Future Skills & Programme Demand</h2>
                    <label>Which emerging fields should universities introduce or expand?</label>
                    <div className="checkbox-grid">
                        {['Artificial Intelligence', 'Cyber Security', 'Cloud Computing', 'Data Science', 'IoT'].map(field => (
                            <label key={field} className="checkbox-label">
                                <input 
                                    type="checkbox" 
                                    checked={formData.emerging_fields.includes(field)}
                                    onChange={() => handleMultiSelect('emerging_fields', field)}
                                />
                                {field}
                            </label>
                        ))}
                    </div>

                    <div className="form-group mt-3">
                        <label>If universities could introduce ONE new programme, what would you recommend?</label>
                        <textarea 
                            className="form-control" rows={3}
                            value={formData.new_program_recommendation}
                            onChange={e => setFormData({...formData, new_program_recommendation: e.target.value})}
                        ></textarea>
                    </div>
                </div>

                {/* SECTION 6 */}
                <div className="survey-section">
                    <h2>Section 6: Graduate Skill Gaps</h2>
                    <label>Which areas do graduates commonly need to improve?</label>
                    <div className="checkbox-grid">
                        {['Practical Experience', 'Communication', 'Problem Solving', 'Leadership'].map(gap => (
                            <label key={gap} className="checkbox-label">
                                <input 
                                    type="checkbox" 
                                    checked={formData.skill_shortages.includes(gap)}
                                    onChange={() => handleMultiSelect('skill_shortages', gap)}
                                />
                                {gap}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="submit-btn" disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Submit Survey'}
                    </button>
                </div>
            </form>
        </div>
    );
};
