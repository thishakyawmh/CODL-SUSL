import React, { useState } from 'react';
import { ArrowLeft, Search, CheckCircle2, Trash2, BookOpen, User, Phone, GraduationCap, ShieldCheck, Send } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { DashboardHeader } from './DashboardHeader';
import { authService, courseService, courseApplicationService } from '../../services/apiService';
import { toast } from '../../utils/toast';
import './NewCourseApplication.css';

interface Course {
    id: string;
    title: string;
    level: string; // Degree, Diploma, Certificate
    department: string;
    duration: string;
    intakeStatus: 'Open' | 'Closed';
    batches?: any[];
}

export const NewCourseApplication: React.FC = () => {
    const navigate = useNavigate();
    const outletContext = useOutletContext<any>();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [realCourses, setRealCourses] = useState<Course[]>([]);
    const [selectedBatch, setSelectedBatch] = useState<any>(null);
    const [myApplications, setMyApplications] = useState<any[]>([]);

    const isStudentLayout = !window.location.pathname.includes('/applicant-dashboard');
    const hasGlobalApplication = outletContext?.hasApplication !== undefined
        ? outletContext.hasApplication
        : myApplications.some(app => ['pending', 'approved'].includes(app.status));

    const hasAppliedForCourse = (courseId: string) => {
        return myApplications.some(app =>
            app.course_id.toString() === courseId.toString() &&
            ['pending', 'approved'].includes(app.status)
        );
    };

    // Form state
    const [formData, setFormData] = useState({
        fullName: '',
        displayName: '',
        address: '',
        dob: '',
        nic: '',
        sex: '',
        civilStatus: '',
        district: '',
        employmentTitle: '',
        officialAddress: '',
        mobilePhone: '',
        homePhone: '',
        whatsapp: '',
        guardianPhone: '',
        email: '',
        otherQualifications: '',
        olYear: '',
        olIndex: '',
        alYear: '',
        alIndex: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    React.useEffect(() => {
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                setFormData(prev => ({
                    ...prev,
                    displayName: user.display_name || prev.displayName,
                    email: user.email || prev.email,
                    nic: user.nic || prev.nic,
                    mobilePhone: user.phone || prev.mobilePhone,
                    address: user.address || prev.address,
                    district: user.district || prev.district,
                    dob: user.dob || prev.dob,
                    sex: user.sex || prev.sex,
                    civilStatus: user.civil_status || prev.civilStatus,
                    employmentTitle: user.employment_title || prev.employmentTitle,
                    officialAddress: user.official_address || prev.officialAddress,
                    whatsapp: user.whatsapp || prev.whatsapp,
                    homePhone: user.home_phone || prev.homePhone,
                    guardianPhone: user.guardian_phone || prev.guardianPhone,
                    olYear: user.ol_year || prev.olYear,
                    olIndex: user.ol_index || prev.olIndex,
                    alYear: user.al_year || prev.alYear,
                    alIndex: user.al_index || prev.alIndex
                }));
                if (user.ol_subjects && Array.isArray(user.ol_subjects)) {
                    setOlSubjects(user.ol_subjects);
                }
                if (user.al_subjects && Array.isArray(user.al_subjects)) {
                    setAlSubjects(user.al_subjects);
                }
            } catch (err) {
                console.error('Failed to parse user from sessionStorage:', err);
            }
        }
    }, []);

    React.useEffect(() => {
        const fetchCourses = async () => {
            try {
                const data = await courseService.getPublicCourses();
                const mapped = data.map((c: any) => ({
                    id: c.id.toString(),
                    title: c.title,
                    level: c.level,
                    department: c.department || 'General',
                    duration: c.duration || '1 Year',
                    intakeStatus: c.intake_status || 'Open',
                    batches: c.batches || []
                }));
                setRealCourses(mapped);
            } catch (err) {
                console.error('Failed to fetch real courses:', err);
            }
        };
        fetchCourses();
    }, []);

    React.useEffect(() => {
        const fetchMyApplications = async () => {
            try {
                const apps = await courseApplicationService.getMyApplications();
                setMyApplications(apps || []);
            } catch (err) {
                console.error("Failed to fetch my applications:", err);
            }
        };
        fetchMyApplications();
    }, []);

    const [olSubjects, setOlSubjects] = useState<any[]>([]);
    const addOlSubject = () => { if (olSubjects.length < 10) setOlSubjects([...olSubjects, { subject: '', grade: '' }]) };
    const removeOlSubject = (index: number) => { const newS = [...olSubjects]; newS.splice(index, 1); setOlSubjects(newS); };

    const [alSubjects, setAlSubjects] = useState<any[]>([]);
    const addAlSubject = () => { if (alSubjects.length < 4) setAlSubjects([...alSubjects, { subject: '', grade: '' }]) };
    const removeAlSubject = (index: number) => { const newS = [...alSubjects]; newS.splice(index, 1); setAlSubjects(newS); };

    const availablePrograms: Course[] = [];

    const filters = ['All', 'Degree', 'Diploma', 'Certificate'];

    const allAvailablePrograms = [...availablePrograms, ...realCourses];

    const filteredPrograms = allAvailablePrograms.filter(prog => {
        const matchesSearch = prog.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = activeFilter === 'All' || prog.level === activeFilter;
        const hasAvailableBatches = prog.batches && prog.batches.length > 0;
        return matchesSearch && matchesFilter && hasAvailableBatches;
    });

    const getStatusStyle = (status: string) => {
        if (status === 'Open') return 'status-open';
        return 'status-closed';
    };

    const handleCourseSelect = (prog: Course) => {
        const cannotApply = isStudentLayout
            ? hasAppliedForCourse(prog.id)
            : hasGlobalApplication;
        if (cannotApply) return;
        setSelectedCourse(prog);
        if (prog.batches && prog.batches.length > 0) {
            setSelectedBatch(prog.batches[0]);
        }
        setSubmitError(null);
    };

    const handleSubmitApplication = async (e: React.FormEvent) => {
        e.preventDefault();

        const cannotApply = isStudentLayout
            ? hasAppliedForCourse(selectedCourse?.id || '')
            : hasGlobalApplication;

        if (cannotApply) {
            setSubmitError("You cannot submit this application because you already have an active application.");
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const payload = {
                applicant_name: formData.fullName,
                display_name: formData.displayName,
                applicant_email: formData.email,
                applicant_nic: formData.nic,
                course_id: selectedCourse?.id,
                batch_id: selectedBatch?.id,
                phone: formData.mobilePhone,
                whatsapp: formData.whatsapp,
                home_phone: formData.homePhone,
                guardian_phone: formData.guardianPhone,
                district: formData.district,
                dob: formData.dob,
                sex: formData.sex,
                civil_status: formData.civilStatus,
                address: formData.address,
                employment_title: formData.employmentTitle,
                official_address: formData.officialAddress,
                ol_subjects: olSubjects,
                ol_year: formData.olYear,
                ol_index: formData.olIndex,
                al_subjects: alSubjects,
                al_year: formData.alYear,
                al_index: formData.alIndex,
                other_qualifications: formData.otherQualifications
            };

            await courseApplicationService.create(payload);
            toast.success("Application submitted successfully!");

            // Refresh parent state to indicate application exists
            if (outletContext && typeof outletContext.fetchApplications === 'function') {
                await outletContext.fetchApplications();
            }

            if (window.location.pathname.includes('/applicant-dashboard')) {
                navigate('/applicant-dashboard/track-status');
            } else {
                navigate('/dashboard');
            }
        } catch (error: any) {
            console.error("Submission failed:", error);
            if (error.response && error.response.data) {
                const data = error.response.data;
                if (data.errors) {
                    const messages = Object.values(data.errors).flat().join(' | ');
                    setSubmitError(`Validation Error: ${messages}`);
                } else if (data.message) {
                    setSubmitError(data.message);
                } else {
                    setSubmitError("Validation error. Please check your inputs.");
                }
            } else {
                setSubmitError("An error occurred while submitting your application. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (selectedCourse) {
        return (
            <div className="new-prog-container">
                <button className="back-btn" onClick={() => setSelectedCourse(null)} style={{ marginBottom: '24px' }}>
                    <ArrowLeft size={18} /> Back to Courses
                </button>

                <div className="prog-details-header">
                    <span className="prog-level-badge">{selectedCourse.level}</span>
                    <h1 className="prog-title">{selectedCourse.title}</h1>
                    <div className="prog-meta-row">
                        <span>{selectedCourse.department}</span>
                        <span className="dot-separator">•</span>
                        <span>{selectedCourse.duration}</span>
                    </div>
                </div>

                {isSubmitted ? (
                    <div className="success-message-card">
                        <CheckCircle2 size={80} className="success-icon" />
                        <h2>Application Submitted!</h2>
                        <p className="success-desc">
                            Your application for <strong>{selectedCourse.title}</strong> has been received by the CODL system.
                        </p>

                        <div className="success-docs-list">
                            <h4 style={{ marginBottom: '16px', color: 'var(--text-dark)' }}>Next Steps:</h4>
                            <p style={{ marginBottom: '16px', fontSize: '14px' }}>Please bring the originals and copies of the following documents on your scheduled registration date:</p>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                    <ShieldCheck size={18} color="var(--success)" /> National Identity Card
                                </li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                    <ShieldCheck size={18} color="var(--success)" /> Birth Certificate
                                </li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                    <ShieldCheck size={18} color="var(--success)" /> O/L and A/L Certificates
                                </li>
                            </ul>
                        </div>

                        <button
                            className="btn-primary track-status-btn"
                            onClick={() => {
                                if (window.location.pathname.includes('/applicant-dashboard')) {
                                    navigate('/applicant-dashboard/track-status');
                                } else {
                                    navigate('/dashboard');
                                }
                            }}
                        >
                            {window.location.pathname.includes('/applicant-dashboard') ? 'Track My Application' : 'Go to Dashboard'}
                        </button>
                    </div>
                ) : (
                    <div className="registration-form-card">
                        <h3 className="form-section-head">Course Registration Form</h3>

                        {submitError && (
                            <div style={{ backgroundColor: '#FEE2E2', color: '#DC2626', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #FECDD3', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ShieldCheck size={20} />
                                {submitError}
                            </div>
                        )}

                        <form onSubmit={handleSubmitApplication} className="attractive-registration-form">

                            <div className="form-section-panel">
                                <h4 className="panel-heading"><BookOpen size={20} style={{ marginRight: '8px', color: '#7C3AED', verticalAlign: 'text-bottom' }} /> 1. Course Selection</h4>
                                <div className="form-grid" style={{ marginBottom: 0, marginTop: 0 }}>
                                    <div className="form-group full-width">
                                        <label>Course Type</label>
                                        <div className="radio-group form-radio-group">
                                            <label><input type="radio" checked={selectedCourse.level === 'Degree'} readOnly disabled /> Degree</label>
                                            <label><input type="radio" checked={selectedCourse.level === 'Diploma'} readOnly disabled /> Diploma</label>
                                            <label><input type="radio" checked={selectedCourse.level === 'Certificate'} readOnly disabled /> Certificate</label>
                                        </div>
                                    </div>

                                    <div className="form-group full-width">
                                        <label>Course Title</label>
                                        <input type="text" value={selectedCourse.title} readOnly className="readonly-input" />
                                    </div>

                                    {selectedCourse.batches && selectedCourse.batches.length > 0 && (
                                        <div className="form-group full-width" style={{ marginTop: '16px' }}>
                                            <label>Select Batch/Intake</label>
                                            <select
                                                value={selectedBatch?.id || ''}
                                                onChange={(e) => {
                                                    const batch = selectedCourse.batches?.find(b => b.id.toString() === e.target.value);
                                                    setSelectedBatch(batch || null);
                                                }}
                                                required
                                            >
                                                {selectedCourse.batches.map(batch => (
                                                    <option key={batch.id} value={batch.id}>
                                                        {batch.name} (Starts: {batch.start_date || 'TBD'})
                                                        {batch.registration_deadline ? ` - Closes: ${batch.registration_deadline}` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="form-section-panel">
                                <h4 className="panel-heading"><User size={20} style={{ marginRight: '12px', color: 'var(--primary-color)' }} /> 2. Personal Information</h4>
                                <div className="form-grid">
                                    <div className="form-group full-width">
                                        <label>Full Name (In BLOCK LETTERS) <span style={{ color: 'var(--danger)' }}>*</span></label>
                                        <input type="text" name="fullName" style={{ textTransform: 'uppercase' }} value={formData.fullName} onChange={handleInputChange} required placeholder="e.g. JOHN DOE" />
                                    </div>

                                    <div className="form-group full-width">
                                        <label>Display Name (Needs to display in the system) <span style={{ color: 'var(--danger)' }}>*</span></label>
                                        <input type="text" name="displayName" value={formData.displayName} onChange={handleInputChange} required placeholder="e.g. John Doe" />
                                    </div>

                                    <div className="form-group full-width">
                                        <label>Permanent Address <span style={{ color: 'var(--danger)' }}>*</span></label>
                                        <textarea name="address" rows={3} required value={formData.address} onChange={handleInputChange} placeholder="Enter your full permanent address"></textarea>
                                    </div>

                                    <div className="form-group">
                                        <label>Date of Birth <span style={{ color: 'var(--danger)' }}>*</span></label>
                                        <input type="date" name="dob" required value={formData.dob} onChange={handleInputChange} />
                                    </div>

                                    <div className="form-group">
                                        <label>National Identity Number <span style={{ color: 'var(--danger)' }}>*</span></label>
                                        <input type="text" name="nic" required value={formData.nic} onChange={handleInputChange} placeholder="e.g. 199912345678" />
                                    </div>

                                    <div className="form-group">
                                        <label>Sex <span style={{ color: 'var(--danger)' }}>*</span></label>
                                        <div className="form-radio-group">
                                            <label><input type="radio" name="sex" value="Male" checked={formData.sex === 'Male'} onChange={handleInputChange} required /> Male</label>
                                            <label><input type="radio" name="sex" value="Female" checked={formData.sex === 'Female'} onChange={handleInputChange} required /> Female</label>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Civil Status <span style={{ color: 'var(--danger)' }}>*</span></label>
                                        <div className="form-radio-group">
                                            <label><input type="radio" name="civilStatus" value="Married" checked={formData.civilStatus === 'Married'} onChange={handleInputChange} required /> Married</label>
                                            <label><input type="radio" name="civilStatus" value="Unmarried" checked={formData.civilStatus === 'Unmarried'} onChange={handleInputChange} required /> Unmarried</label>
                                        </div>
                                    </div>

                                    <div className="form-group full-width">
                                        <label>District of Residence <span style={{ color: 'var(--danger)' }}>*</span></label>
                                        <select name="district" required className="district-select" value={formData.district} onChange={handleInputChange}>
                                            <option value="">Select your district...</option>
                                            {['Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara', 'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar', 'Matale', 'Matara', 'Moneragala', 'Mullaitivu', 'Nuwara Eliya', 'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya'].sort().map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="form-section-panel">
                                <h4 className="panel-heading"><Phone size={20} style={{ marginRight: '12px', color: 'var(--primary-color)' }} /> 3. Employment & Contact Information</h4>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Current Employment</label>
                                        <input type="text" name="employmentTitle" value={formData.employmentTitle} onChange={handleInputChange} placeholder="e.g. Software Engineer" />
                                    </div>

                                    <div className="form-group">
                                        <label>Official Work Address</label>
                                        <input type="text" name="officialAddress" value={formData.officialAddress} onChange={handleInputChange} placeholder="Workplace Address (Optional)" />
                                    </div>

                                    <div className="form-group">
                                        <label>Mobile Number <span style={{ color: 'var(--danger)' }}>*</span></label>
                                        <input type="tel" name="mobilePhone" value={formData.mobilePhone} onChange={handleInputChange} required placeholder="07XXXXXXXX" />
                                    </div>
                                    <div className="form-group">
                                        <label>Home Telephone</label>
                                        <input type="tel" name="homePhone" value={formData.homePhone} onChange={handleInputChange} placeholder="0XXXXXXXXX" />
                                    </div>
                                    <div className="form-group">
                                        <label>WhatsApp Number</label>
                                        <input type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} placeholder="07XXXXXXXX" />
                                    </div>
                                    <div className="form-group">
                                        <label>Emergency Contact (Guardian)</label>
                                        <input type="tel" name="guardianPhone" value={formData.guardianPhone} onChange={handleInputChange} placeholder="07XXXXXXXX" />
                                    </div>

                                    <div className="form-group full-width">
                                        <label>Primary E-mail Address <span style={{ color: 'var(--danger)' }}>*</span></label>
                                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="email@example.com" />
                                    </div>
                                </div>
                            </div>

                            <div className="qualifications-section form-section-panel">
                                <h4 className="panel-heading"><GraduationCap size={20} style={{ marginRight: '12px', color: 'var(--primary-color)' }} /> 4. Educational Qualifications</h4>

                                <div className="qual-block">
                                    <h5>(a) G.C.E. O/L</h5>
                                    <div className="qual-meta">
                                        <div className="form-group inline-group">
                                            <label>Year:</label>
                                            <input type="text" name="olYear" value={formData.olYear} onChange={handleInputChange} style={{ width: '120px' }} placeholder="YYYY" />
                                        </div>
                                        <div className="form-group inline-group">
                                            <label>Index No:</label>
                                            <input type="text" name="olIndex" value={formData.olIndex} onChange={handleInputChange} style={{ width: '180px' }} placeholder="Index" />
                                        </div>
                                    </div>
                                    <table className="qual-table">
                                        <thead><tr><th>Subject Name</th><th>Grade</th><th></th></tr></thead>
                                        <tbody>
                                            {olSubjects.map((sub, i) => (
                                                <tr key={i}>
                                                    <td><input type="text" placeholder="e.g. Mathematics" value={sub.subject} onChange={(e) => { const newS = [...olSubjects]; newS[i].subject = e.target.value; setOlSubjects(newS); }} /></td>
                                                    <td>
                                                        <select value={sub.grade} onChange={(e) => { const newS = [...olSubjects]; newS[i].grade = e.target.value; setOlSubjects(newS); }}>
                                                            <option value="" disabled>-</option>
                                                            <option value="A">A</option>
                                                            <option value="B">B</option>
                                                            <option value="C">C</option>
                                                            <option value="S">S</option>
                                                            <option value="F">F</option>
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <button type="button" className="btn-remove-row" onClick={() => removeOlSubject(i)}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {olSubjects.length < 10 && <button type="button" className="btn-add-row" onClick={addOlSubject}>+ Add O/L Subject</button>}
                                </div>

                                <div className="qual-block">
                                    <h5>(b) G.C.E. A/L</h5>
                                    <div className="qual-meta">
                                        <div className="form-group inline-group">
                                            <label>Year:</label>
                                            <input type="text" name="alYear" value={formData.alYear} onChange={handleInputChange} style={{ width: '120px' }} placeholder="YYYY" />
                                        </div>
                                        <div className="form-group inline-group">
                                            <label>Index No:</label>
                                            <input type="text" name="alIndex" value={formData.alIndex} onChange={handleInputChange} style={{ width: '180px' }} placeholder="Index" />
                                        </div>
                                    </div>
                                    <table className="qual-table">
                                        <thead><tr><th>Subject Name</th><th>Grade</th><th></th></tr></thead>
                                        <tbody>
                                            {alSubjects.map((sub, i) => (
                                                <tr key={i}>
                                                    <td><input type="text" placeholder="e.g. Physics" value={sub.subject} onChange={(e) => { const newS = [...alSubjects]; newS[i].subject = e.target.value; setAlSubjects(newS); }} /></td>
                                                    <td>
                                                        <select value={sub.grade} onChange={(e) => { const newS = [...alSubjects]; newS[i].grade = e.target.value; setAlSubjects(newS); }}>
                                                            <option value="" disabled>-</option>
                                                            <option value="A">A</option>
                                                            <option value="B">B</option>
                                                            <option value="C">C</option>
                                                            <option value="S">S</option>
                                                            <option value="F">F</option>
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <button type="button" className="btn-remove-row" onClick={() => removeAlSubject(i)}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {alSubjects.length < 4 && <button type="button" className="btn-add-row" onClick={addAlSubject}>+ Add A/L Subject</button>}
                                </div>

                                <div className="form-group full-width" style={{ marginTop: '24px' }}>
                                    <label>Other Qualifications / Certifications</label>
                                    <textarea name="otherQualifications" value={formData.otherQualifications} onChange={handleInputChange} rows={4} placeholder="Please list any other relevant qualifications, degrees, or certificates..."></textarea>
                                </div>
                            </div>

                            <div className="certification-box form-section-panel" style={{ padding: '32px 40px' }}>
                                <h4 className="panel-heading" style={{ color: 'var(--primary-dark)', borderBottomColor: 'var(--border-light)' }}><ShieldCheck size={20} style={{ marginRight: '12px', color: 'var(--primary-color)' }} /> 5. Certification & Agreement</h4>
                                <p>I certify that the above particulars furnished by me are true and correct to the best of my knowledge. In case, if any of the particulars is found incorrect/false, I understand that the University has the sole authority to cancel my registration.</p>
                                <p>I affirm that I will adhere to the both rules and regulations those currently effective and those amended from time to time with regard to students of the University.</p>
                                <p>The Unit has decided that your course/registration/lecture fee is not re-fundable or not transferable to any other course or any another person. Further the course fee is only applicable for the batch to which it levied.</p>

                                <label className="checkbox-label">
                                    <input type="checkbox" required />
                                    <span>I agree to the above terms and conditions</span>
                                </label>
                            </div>

                            <div className="form-actions-bottom" style={{ marginTop: '0', paddingTop: '16px', borderTop: 'none' }}>
                                <button type="button" className="btn-secondary" onClick={() => setSelectedCourse(null)} disabled={isSubmitting}>Cancel Application</button>
                                <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 32px', fontSize: '16px' }}>
                                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                                    <Send size={18} />
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="new-prog-container">
            <button className="back-btn" onClick={() => navigate('/applicant-dashboard')} style={{ marginBottom: '24px' }}>
                <ArrowLeft size={18} /> Back
            </button>
            <div style={{ marginBottom: '32px' }}>
                <DashboardHeader title="Available Courses" />
            </div>

            {!isStudentLayout && hasGlobalApplication && (
                <div style={{
                    backgroundColor: '#FEF3C7',
                    color: '#D97706',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '24px',
                    border: '1px solid #FDE68A',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontWeight: 500,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                }}>
                    <ShieldCheck size={20} />
                    <span>You have already submitted an active course application. You cannot apply for another program at this time.</span>
                </div>
            )}

            <p className="page-subtitle" style={{ marginBottom: '24px' }}>
                Browse and apply for newly opened degree, diploma, and certificate programs.
            </p>

            <div className="filters-container">
                <div className="search-bar">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Search for programs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="pills-container">
                    {filters.map(filter => (
                        <button
                            key={filter}
                            className={`filter-pill ${activeFilter === filter ? 'active' : ''}`}
                            onClick={() => setActiveFilter(filter)}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            <div className="programs-grid">
                {filteredPrograms.length > 0 ? (
                    filteredPrograms.map(prog => (
                        <div className="course-card" key={prog.id}>
                            <div className="card-top-row">
                                <span className={`intake-status ${getStatusStyle(prog.intakeStatus)}`}>
                                    {prog.intakeStatus}
                                </span>
                                <span className="prog-level">{prog.level}</span>
                            </div>

                            <h3 className="prog-card-title">{prog.title}</h3>

                            <div className="prog-card-details">
                                <p className="detail-row">
                                    <span className="detail-label" style={{ textTransform: 'uppercase' }}>Department:</span> {prog.department}
                                </p>
                                <p className="detail-row">
                                    <span className="detail-label" style={{ textTransform: 'uppercase' }}>Duration:</span> {prog.duration}
                                </p>
                                <p className="detail-row">
                                    <span className="detail-label" style={{ textTransform: 'uppercase' }}>Batch:</span> {
                                        prog.batches && prog.batches.length > 0
                                            ? prog.batches[0].name
                                            : 'TBD'
                                    }
                                </p>
                                <p className="detail-row">
                                    <span className="detail-label" style={{ textTransform: 'uppercase' }}>Deadline:</span> {
                                        prog.batches && prog.batches.length > 0 && prog.batches[0].registration_deadline
                                            ? new Date(prog.batches[0].registration_deadline).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
                                            : 'TBD'
                                    }
                                </p>
                            </div>

                            <button
                                className="apply-btn-full"
                                onClick={() => {
                                    const canApply = isStudentLayout
                                        ? !hasAppliedForCourse(prog.id)
                                        : !hasGlobalApplication;
                                    if (canApply) handleCourseSelect(prog);
                                }}
                                disabled={isStudentLayout ? hasAppliedForCourse(prog.id) : hasGlobalApplication}
                                style={{
                                    opacity: (isStudentLayout ? hasAppliedForCourse(prog.id) : hasGlobalApplication) ? 0.6 : 1,
                                    cursor: (isStudentLayout ? hasAppliedForCourse(prog.id) : hasGlobalApplication) ? 'not-allowed' : 'pointer',
                                    backgroundColor: (isStudentLayout ? hasAppliedForCourse(prog.id) : hasGlobalApplication) ? '#94A3B8' : undefined
                                }}
                            >
                                {isStudentLayout
                                    ? (hasAppliedForCourse(prog.id) ? 'Already Applied' : 'Apply Now')
                                    : (hasGlobalApplication ? 'Already Applied' : 'Apply Now')
                                }
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="no-programs-alert">
                        <p>No available programs match your search criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
