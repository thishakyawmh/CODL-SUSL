import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, User, MapPin, FileText, CheckSquare, Trash2, Send } from 'lucide-react';
import { courseService, examService, examApplicationService } from '../../services/apiService';
import { toast } from '../../utils/toast';

import './ExamApplicationForm.css';

interface ExamApplicationFormProps {
    isEmbedded?: boolean;
    onSuccess?: () => void;
}

export const ExamApplicationForm: React.FC<ExamApplicationFormProps> = ({ isEmbedded, onSuccess }) => {
    const navigate = useNavigate();
    const { id, examId } = useParams();
    const [searchParams] = useSearchParams();
    const queryExamId = searchParams.get('examId');
    const activeExamId = queryExamId || examId || 'E1';

    const [profileData] = useState(() => {
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                return {
                    studentNumber: user.student_number || 'CODL/2404',
                    fullName: user.full_name || '',
                    address: user.address || '',
                    nic: user.nic || '',
                    sex: user.sex || '',
                    mobilePhone: user.phone || '',
                    email: user.email || ''
                };
            } catch (err) {
                console.error("Failed to parse user from session storage:", err);
            }
        }
        return {
            studentNumber: '',
            fullName: '',
            address: '',
            nic: '',
            sex: '',
            mobilePhone: '',
            email: ''
        };
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [subjects, setSubjects] = useState<{ code: string; name: string; taken: boolean; attempt: string }[]>([]);
    const [examTitle, setExamTitle] = useState(`Exam ${activeExamId}`);
    const [examSemester, setExamSemester] = useState('1');
    const [calculatedAttempt, setCalculatedAttempt] = useState('1');

    const [salutation, setSalutation] = useState(profileData.sex === 'Male' ? 'Mr' : (profileData.sex === 'Female' ? 'Ms' : 'Mr'));
    const [nameWithInitials, setNameWithInitials] = useState(profileData.fullName);
    const [nameDenotedByInitials, setNameDenotedByInitials] = useState('');
    const [contactNumber, setContactNumber] = useState(profileData.mobilePhone);
    const [permanentAddress, setPermanentAddress] = useState(profileData.address);
    const [addressDuringExam, setAddressDuringExam] = useState('');
    const [medium, setMedium] = useState('English');
    const [registrationDate, setRegistrationDate] = useState(new Date().toISOString().split('T')[0]);
    const [postponementDetails, setPostponementDetails] = useState('');
    const [feePaid, setFeePaid] = useState<number | string>('');
    const [paymentDate, setPaymentDate] = useState('');

    useEffect(() => {
        const fetchExamDetails = async () => {
            try {
                let studentBatch = 'Batch 01';
                try {
                    const studentData = await courseService.getStudentExaminationsData(id!);
                    if (studentData && studentData.student_batch) {
                        studentBatch = studentData.student_batch;
                    }
                } catch (e) {
                    console.error("Failed to load student batch for attempt calculation:", e);
                }

                const exams = await examService.getByCourse(id!);
                console.log("[ExamApplicationForm] Fetched exams:", exams);
                console.log("[ExamApplicationForm] Active exam ID:", activeExamId);
                const targetExam = exams.find((e: any) => e.id.toString() === activeExamId.toString());
                console.log("[ExamApplicationForm] Matched targetExam:", targetExam);
                if (targetExam) {
                    setExamTitle(targetExam.title);
                    setExamSemester(targetExam.semester || '1');
                    
                    const examBatch = targetExam.batch || targetExam.batch_name || 'Batch 01';
                    const getBatchNumber = (name: string): number => {
                        if (!name) return 1;
                        const m = name.match(/\d+/);
                        return m ? parseInt(m[0], 10) : 1;
                    };
                    const diff = getBatchNumber(examBatch) - getBatchNumber(studentBatch);
                    const calculated = Math.max(1, diff + 1).toString();
                    setCalculatedAttempt(calculated);

                    console.log("[ExamApplicationForm] targetExam.subjects:", targetExam.subjects);
                    if (targetExam.subjects && targetExam.subjects.length > 0) {
                        const mapped = targetExam.subjects.map((s: any) => ({
                            code: s.code || s.name?.slice(0, 5).toUpperCase() || '',
                            name: s.name,
                            taken: true,
                            attempt: calculated
                        }));
                        console.log("[ExamApplicationForm] Mapped subjects:", mapped);
                        setSubjects(mapped);
                    } else {
                        console.log("[ExamApplicationForm] No subjects found, clearing subjects list");
                        setSubjects([]);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch exam subjects:", err);
            }
        };
        fetchExamDetails();
    }, [id, activeExamId]);

    const addSubjectRow = () => {
        setSubjects([...subjects, { code: '', name: '', taken: false, attempt: calculatedAttempt }]);
    };

    const updateSubject = (index: number, field: string, value: string | boolean) => {
        const newSubjects = [...subjects];
        newSubjects[index] = { ...newSubjects[index], [field]: value };
        setSubjects(newSubjects);
    };

    const removeSubjectRow = (index: number) => {
        if (subjects.length > 1) {
            const newSubjects = subjects.filter((_: any, i: number) => i !== index);
            setSubjects(newSubjects);
        }
    };

    const handleBack = () => {
        if (isEmbedded) return;
        navigate(`/course/${id}/examinations`);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        
        try {
            const payload = {
                course_id: parseInt(id!),
                exam_id: isNaN(Number(activeExamId)) ? null : parseInt(activeExamId),
                exam_title: examTitle,
                semester: examSemester ? examSemester.toString() : '1',
                salutation,
                name_with_initials: nameWithInitials,
                name_denoted_by_initials: nameDenotedByInitials,
                contact_number: contactNumber,
                permanent_address: permanentAddress,
                address_during_exam: addressDuringExam,
                medium,
                registration_date: registrationDate || null,
                postponement_details: postponementDetails,
                fee_paid: feePaid ? parseFloat(feePaid.toString()) : 0.0,
                payment_date: paymentDate || null,
                subjects: subjects.filter(s => s.taken).map(s => ({
                    code: s.code,
                    name: s.name,
                    attempt: s.attempt
                })),
                status: 'pending'
            };

            await examApplicationService.create(payload);
            toast.success("Examination application submitted successfully!");

            if (onSuccess) {
                onSuccess();
            } else {
                navigate(`/course/${id}/examinations`, { state: { toastSuccess: true } });
            }
        } catch (err: any) {
            console.error("Failed to submit exam application:", err);
            if (err.response?.data) {
                console.error("Validation/Server response:", err.response.data);
                if (err.response.data.message) {
                    toast.error(`Error: ${err.response.data.message}`);
                    setIsSubmitting(false);
                    return;
                }
            }
            toast.error("Failed to submit exam application.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`exam-form-wrapper ${isEmbedded ? 'embedded' : ''}`}>
            {!isEmbedded && (
                <>
                    <button className="back-btn" onClick={handleBack}>
                        <ArrowLeft size={18} /> Back
                    </button>

                    <div className="exam-form-page-header">
                        <h1 className="course-details-title">Examination Application Form</h1>
                    </div>
                </>
            )}

            <form className="application-form" onSubmit={handleSubmit}>

                {/* Applicant Information Card */}
                <div className="form-section-card modern-shadow">
                    <div className="section-card-header-with-icon">
                        <div className="section-icon-container purple-gradient"><User size={20} color="white" /></div>
                        <h3 className="section-card-title no-border">Applicant Information</h3>
                    </div>
                    <div className="form-grid">
                        <div className="input-group">
                            <label className="input-label">Registration Number</label>
                            <input type="text" className="modern-input disabled" value={profileData.studentNumber} readOnly />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Status</label>
                            <div className="modern-radio-group">
                                <label className="modern-radio"><input type="radio" name="salutation" value="Mr" checked={salutation === 'Mr'} onChange={(e) => setSalutation(e.target.value)} /> <span>Mr.</span></label>
                                <label className="modern-radio"><input type="radio" name="salutation" value="Mrs" checked={salutation === 'Mrs'} onChange={(e) => setSalutation(e.target.value)} /> <span>Mrs.</span></label>
                                <label className="modern-radio"><input type="radio" name="salutation" value="Ms" checked={salutation === 'Ms'} onChange={(e) => setSalutation(e.target.value)} /> <span>Ms.</span></label>
                            </div>
                        </div>
                        <div className="input-group full-width">
                            <label className="input-label">Name With Initials</label>
                            <input type="text" className="modern-input" value={nameWithInitials} onChange={(e) => setNameWithInitials(e.target.value)} placeholder="e.g. A.B.C. Perera" />
                        </div>
                        <div className="input-group full-width">
                            <label className="input-label">Name Denoted By Initials</label>
                            <input type="text" className="modern-input" value={nameDenotedByInitials} onChange={(e) => setNameDenotedByInitials(e.target.value)} placeholder="e.g. Amarakoon Bandara Charles" />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Contact Number</label>
                            <input type="tel" className="modern-input" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="+94 7X XXX XXXX" />
                        </div>
                    </div>
                </div>

                {/* Address Details Card */}
                <div className="form-section-card modern-shadow">
                    <div className="section-card-header-with-icon">
                        <div className="section-icon-container green-gradient"><MapPin size={20} color="white" /></div>
                        <h3 className="section-card-title no-border">Address Details</h3>
                    </div>
                    <div className="form-grid">
                        <div className="input-group full-width">
                            <label className="input-label">Permanent Address</label>
                            <textarea className="modern-textarea" value={permanentAddress} onChange={(e) => setPermanentAddress(e.target.value)} placeholder="Your permanent home address" rows={3}></textarea>
                        </div>
                        <div className="input-group full-width">
                            <label className="input-label">Address During Examination Period</label>
                            <textarea className="modern-textarea" value={addressDuringExam} onChange={(e) => setAddressDuringExam(e.target.value)} placeholder="Where you will reside during exams" rows={3}></textarea>
                        </div>
                    </div>
                </div>

                {/* Examination & Fee Details Card */}
                <div className="form-section-card modern-shadow">
                    <div className="section-card-header-with-icon">
                        <div className="section-icon-container purple-gradient"><FileText size={20} color="white" /></div>
                        <h3 className="section-card-title no-border">Examination Details</h3>
                    </div>
                    <div className="form-grid">
                        <div className="input-group">
                            <label className="input-label">Medium of Examination</label>
                            <div className="modern-radio-group">
                                <label className="modern-radio"><input type="radio" name="medium" value="Sinhala" checked={medium === 'Sinhala'} onChange={(e) => setMedium(e.target.value)} /> <span>Sinhala</span></label>
                                <label className="modern-radio"><input type="radio" name="medium" value="English" checked={medium === 'English'} onChange={(e) => setMedium(e.target.value)} /> <span>English</span></label>
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Date of Registration</label>
                            <input type="date" className="modern-input" value={registrationDate} onChange={(e) => setRegistrationDate(e.target.value)} />
                        </div>

                        <div className="input-group full-width">
                            <label className="input-label">Have you previously postponed sitting this examination?</label>
                            <p className="input-hint">If supported by a medical certificate or other reason, provide details here.</p>
                            <textarea className="modern-textarea" value={postponementDetails} onChange={(e) => setPostponementDetails(e.target.value)} placeholder="No previous postponements" rows={3}></textarea>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Fee Amount Paid (LKR)</label>
                            <input type="number" className="modern-input" value={feePaid} onChange={(e) => setFeePaid(e.target.value)} placeholder="e.g. 5000" />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Date of Payment</label>
                            <input type="date" className="modern-input" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
                        </div>
                    </div>
                </div>

                {/* Subjects Selection Card */}
                {subjects.length > 0 && (
                    <div className="form-section-card modern-shadow">
                        <div className="section-card-header-with-icon">
                            <div className="section-icon-container orange-gradient"><CheckSquare size={20} color="white" /></div>
                            <h3 className="section-card-title no-border m-0">Applying Subjects</h3>
                        </div>

                        <div className="modern-subjects-list">
                            <div className="subjects-header" style={{ display: 'grid', gridTemplateColumns: '120px 1fr 150px 100px', gap: '20px', padding: '12px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', borderRadius: '12px 12px 0 0' }}>
                                <div className="sub-col code" style={{ fontWeight: 800, color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject Code</div>
                                <div className="sub-col name" style={{ fontWeight: 800, color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject Name</div>
                                <div className="sub-col attempt" style={{ fontWeight: 800, color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', justifyContent: 'center' }}>Attempt</div>
                                <div className="sub-col taken" style={{ fontWeight: 800, color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', justifyContent: 'center' }}>Taken</div>
                            </div>

                            {subjects.map((sub: any, index: number) => (
                                <div className="subject-row" key={index} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 150px 100px', gap: '20px', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #F1F5F9' }}>
                                    <div className="sub-col code">
                                        {sub.code !== undefined && sub.code !== '' ? (
                                            <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 600 }}>{sub.code}</span>
                                        ) : (
                                            <input 
                                                type="text" 
                                                placeholder="Code" 
                                                value={sub.code || ''} 
                                                onChange={(e) => updateSubject(index, 'code', e.target.value)} 
                                                style={{
                                                    width: '100%',
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #CBD5E1',
                                                    fontSize: '13px'
                                                }}
                                            />
                                        )}
                                    </div>
                                    <div className="sub-col name">
                                        <span style={{ fontSize: '15px', color: '#1E293B', fontWeight: 600 }}>{sub.name}</span>
                                    </div>
                                    <div className="sub-col attempt" style={{ display: 'flex', justifyContent: 'center' }}>
                                        <span style={{ 
                                            fontSize: '13px', 
                                            fontWeight: 700, 
                                            color: '#475569',
                                            background: '#F1F5F9',
                                            padding: '6px 14px',
                                            borderRadius: '8px',
                                            minWidth: '90px',
                                            textAlign: 'center',
                                            display: 'inline-block'
                                        }}>
                                            {sub.attempt === '1' ? '1st Attempt' : 
                                             sub.attempt === '2' ? '2nd Attempt' : 
                                             sub.attempt === '3' ? '3rd Attempt' : 
                                             `${sub.attempt}th Attempt`}
                                        </span>
                                    </div>
                                    <div className="sub-col taken" style={{ display: 'flex', justifyContent: 'center' }}>
                                        <label className="modern-checkbox-wrapper">
                                            <input type="checkbox" checked={sub.taken} onChange={(e) => updateSubject(index, 'taken', e.target.checked)} />
                                            <div className="checker"></div>
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Declaration Card */}
                <div className="form-section-card declaration-card">
                    <label className="modern-declaration">
                        <input type="checkbox" className="dec-checkbox" />
                        <span className="dec-text">
                            I certify that the above particulars furnished by me are true and correct to the best of my knowledge. I understand that the University is empowered to cancel my registration if any information is found to be incorrect or false.
                        </span>
                    </label>
                </div>

                <div className="form-actions-bottom">
                    {!isEmbedded && <button type="button" className="btn-secondary" onClick={handleBack} disabled={isSubmitting}>Cancel</button>}
                    <button type="submit" className="btn-primary with-icon" disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Submit Application'} <Send size={18} />
                    </button>
                </div>
            </form>
        </div>
    );
};
