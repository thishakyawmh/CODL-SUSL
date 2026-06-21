import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowLeft, Send, CheckCircle2, User, Mail, Sparkles } from 'lucide-react';
import { curriculumAlignmentService } from '../../services/apiService';
import { toast } from '../../utils/toast';
import './PublicSurveysHub.css';

const INTEREST_FIELDS = [
    { name: 'Artificial Intelligence', icon: '🤖', desc: 'Neural Networks, Deep Learning, Machine Learning Applications' },
    { name: 'Cyber Security', icon: '🛡️', desc: 'Ethical Hacking, Network Defense, Penetration Testing' },
    { name: 'Data Science', icon: '📊', desc: 'Big Data Analytics, Statistical Modeling, Predictive Modeling' },
    { name: 'Robotics', icon: '⚙️', desc: 'Control Systems, Mechatronics, Process Automation' },
    { name: 'Software Engineering', icon: '💻', desc: 'Full Stack Web & Mobile Development, Software Architecture' },
    { name: 'Cloud Computing', icon: '☁️', desc: 'Infrastructure as Code, AWS / Azure, DevOps Practices' },
    { name: 'Networking', icon: '🌐', desc: 'Routing & Switching, Telecom Systems, Infrastructure Security' }
];

export const StudentSurveyForm: React.FC = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [interestField, setInterestField] = useState('');
    const [careerPath, setCareerPath] = useState('');
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!interestField) {
            toast.error('Please select an interest field.');
            return;
        }

        setIsSubmitting(true);

        const payload = {
            name: name.trim() || null,
            email: email.trim() || null,
            interest_field: interestField,
            career_path: careerPath.trim() || null
        };

        try {
            await curriculumAlignmentService.submitStudentSurvey(payload);
            setIsSuccess(true);
            toast.success('Survey submitted successfully!');
        } catch (err: any) {
            console.error('Failed to submit student interest survey:', err);
            toast.error(err.response?.data?.message || 'Failed to submit interest. Please try again.');
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
                        <CheckCircle2 size={72} color="#8B5CF6" />
                    </div>
                    <h1>Awesome!</h1>
                    <p className="ps-hub-subtitle">
                        Your interest profile has been submitted. We use this data to predict demand and introduce high-impact course tracks matching student desires.
                    </p>
                    <button className="ps-btn-back-hub" style={{ backgroundColor: '#8B5CF6' }} onClick={() => navigate('/survey')}>
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
                    <div className="ps-hub-badge" style={{ backgroundColor: 'rgba(139, 92, 246, 0.08)', color: '#8B5CF6', borderColor: 'rgba(139, 92, 246, 0.15)' }}>
                        <GraduationCap size={13} />
                        <span>Student Interest</span>
                    </div>
                    <h1>School Leaver Interest Survey</h1>
                    <p>Share your academic preferences and career goals. Your choices directly guide the expansion of our program offerings.</p>
                </header>

                <form onSubmit={handleSubmit} className="ps-survey-form">
                    {/* Section 1: Contact Details */}
                    <div className="ps-form-section">
                        <h2>1. Personal Profile (Optional)</h2>
                        <p className="ps-section-desc">You can submit this survey anonymously or provide contact details to receive updates on program admissions.</p>
                        
                        <div className="ps-input-row">
                            <div className="ps-input-group" style={{ flex: 1 }}>
                                <label htmlFor="studentName">
                                    <User size={13} style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block' }} /> 
                                    Full Name
                                </label>
                                <input
                                    id="studentName"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Amal Perera"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="ps-input-group" style={{ flex: 1 }}>
                                <label htmlFor="studentEmail">
                                    <Mail size={13} style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block' }} /> 
                                    Email Address
                                </label>
                                <input
                                    id="studentEmail"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="e.g. amal@gmail.com"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Core Area of Interest */}
                    <div className="ps-form-section">
                        <h2>2. Which field interests you most?</h2>
                        <p className="ps-section-desc">Select the single educational field you are most passionate about starting or pursuing.</p>

                        <div className="ps-field-grid">
                            {INTEREST_FIELDS.map(f => {
                                const isChecked = interestField === f.name;
                                return (
                                    <div
                                        key={f.name}
                                        className={`ps-field-card ${isChecked ? 'selected' : ''}`}
                                        onClick={() => setInterestField(f.name)}
                                    >
                                        <div className="field-icon">{f.icon}</div>
                                        <div className="field-body">
                                            <h3>{f.name}</h3>
                                            <p>{f.desc}</p>
                                        </div>
                                        <input
                                            type="radio"
                                            name="interestField"
                                            value={f.name}
                                            checked={isChecked}
                                            onChange={() => setInterestField(f.name)}
                                            style={{ display: 'none' }}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Section 3: Intended Career Path */}
                    <div className="ps-form-section">
                        <h2>3. Career Aspirations</h2>
                        <p className="ps-section-desc">Describe your target job role or where you see yourself working after graduation.</p>

                        <div className="ps-input-group">
                            <label htmlFor="careerPath">Target Job Role</label>
                            <input
                                id="careerPath"
                                type="text"
                                value={careerPath}
                                onChange={(e) => setCareerPath(e.target.value)}
                                placeholder="e.g. Ethical Hacker, Game Developer, AI Scientist"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    <button type="submit" className="ps-submit-btn" style={{ background: '#8B5CF6' }} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <div className="spinner"></div>
                        ) : (
                            <>
                                <Send size={18} /> Submit My Interest
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
