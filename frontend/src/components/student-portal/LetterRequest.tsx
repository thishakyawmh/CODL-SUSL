import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, Send, FilePlus, Calendar, ArrowLeft, BookOpen, MessageSquare, AlertTriangle } from 'lucide-react';
import { DashboardHeader } from './DashboardHeader';
import { courseService, batchService, letterRequestService } from '../../services/apiService';
import { toast } from '../../utils/toast';
import './LetterRequest.css';
import { History } from 'lucide-react';

export const LetterRequest: React.FC = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');

    const [letterType, setLetterType] = useState<string>('');
    const [selectedCourseId, setSelectedCourseId] = useState<number | ''>('');
    const [reason, setReason] = useState('');
    const [agreed, setAgreed] = useState(false);

    // Profile fields
    const [nameWithInitials, setNameWithInitials] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [nic, setNic] = useState('');
    const [year, setYear] = useState('');
    const [batch, setBatch] = useState('');
    const [registrationNumber, setRegistrationNumber] = useState('');
    const [statusPrefix, setStatusPrefix] = useState('');

    const [registeredCourses, setRegisteredCourses] = useState<any[]>([]);
    const [requestsHistory, setRequestsHistory] = useState<any[]>([]);


    const [profileData] = useState(() => {
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                return {
                    studentNumber: user.student_number || 'ST00256',
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

    useEffect(() => {

        setAddress(profileData.address || '');
        setPhone(profileData.mobilePhone || '');
        setNic(profileData.nic || '');
        setRegistrationNumber(profileData.studentNumber || '');

        if (profileData.sex === 'Male') setStatusPrefix('Mr');
        else if (profileData.sex === 'Female') setStatusPrefix('Ms');

        const loadData = async () => {
            try {
                const courses = await courseService.getStudentCourses();
                setRegisteredCourses(courses);
                const history = await letterRequestService.getAll();
                setRequestsHistory(history);
            } catch (err) {
                console.error("Failed to load initial data", err);
            }
        };
        loadData();
    }, [profileData]);

    const fetchHistory = async () => {
        try {
            const history = await letterRequestService.getAll();
            setRequestsHistory(history);
        } catch (err) {
            console.error("Failed to fetch letter requests history", err);
        }
    };

    const handleCourseChange = async (courseIdStr: string) => {
        if (!courseIdStr) {
            setSelectedCourseId('');
            setBatch('');
            setYear('');
            return;
        }
        const courseId = Number(courseIdStr);
        setSelectedCourseId(courseId);

        const course = registeredCourses.find(c => c.id === courseId);
        if (course) {
            const batchName = (course.pivot && course.pivot.batch) || '';
            setBatch(batchName);

            try {
                const batches = await batchService.getByCourse(courseId.toString());
                const matchingBatch = batches.find((b: any) => b.name === batchName);
                if (matchingBatch && matchingBatch.start_date) {
                    const startYear = new Date(matchingBatch.start_date).getFullYear().toString();
                    setYear(startYear);
                } else if (batches.length > 0 && batches[0].start_date) {
                    const startYear = new Date(batches[0].start_date).getFullYear().toString();
                    setYear(startYear);
                } else {
                    setYear(new Date().getFullYear().toString());
                }
            } catch (err) {
                console.error("Failed to load course batches", err);
                setYear(new Date().getFullYear().toString());
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!letterType || !selectedCourseId || !reason || !agreed || !nameWithInitials) {
            toast.error("Please fill in all required fields.");
            return;
        }

        setIsSubmitting(true);
        try {
            await letterRequestService.create({
                course_id: selectedCourseId,
                letter_type: letterType,
                reason,
                name_with_initials: nameWithInitials,
                address,
                phone,
                nic,
                year,
                batch,
                registration_number: registrationNumber
            });

            toast.success("Letter request submitted successfully!");


            setLetterType('');
            setSelectedCourseId('');
            setReason('');
            setAgreed(false);
            setNameWithInitials('');
            setBatch('');
            setYear('');

            await fetchHistory();

            setActiveTab('history');
        } catch (err: any) {
            console.error("Submit request failed", err);
            const msg = err.response?.data?.message || "Failed to submit request. Please try again.";
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusStyle = (status: string) => {
        const normalized = status ? status.toLowerCase() : 'pending';
        switch (normalized) {
            case 'approved': return { bg: '#DCFCE7', text: '#16A34A', icon: <CheckCircle2 size={14} /> };
            case 'pending': return { bg: '#FEF9C3', text: '#CA8A04', icon: <Clock size={14} /> };
            case 'rejected': return { bg: '#FEE2E2', text: '#DC2626', icon: <XCircle size={14} /> };
            default: return { bg: '#F1F5F9', text: '#475569', icon: null };
        }
    };

    const getStepStyle = (stepNum: number, req: any) => {
        const level = req.approval_level;
        const status = req.status.toLowerCase();

        // Step 1: Secretary
        if (stepNum === 1) {
            if (level >= 1) return { bg: '#EAFDF3', border: '#22C55E', color: '#16A34A', text: '✓' };
            if (status === 'rejected' && level === 0) return { bg: '#FEE2E2', border: '#EF4444', color: '#DC2626', text: '✗' };
            return { bg: '#FFFBEB', border: '#F59E0B', color: '#D97706', text: '1' }; // Pending
        }
        // Step 2: Coordinator
        if (stepNum === 2) {
            if (level >= 2) return { bg: '#EAFDF3', border: '#22C55E', color: '#16A34A', text: '✓' };
            if (status === 'rejected' && level === 1) return { bg: '#FEE2E2', border: '#EF4444', color: '#DC2626', text: '✗' };
            if (status === 'pending' && level === 1) return { bg: '#FFFBEB', border: '#F59E0B', color: '#D97706', text: '2' }; // Pending
            return { bg: '#F1F5F9', border: '#CBD5E1', color: '#94A3B8', text: '2' }; // Waiting
        }
        // Step 3: Director
        if (stepNum === 3) {
            if (status === 'approved') return { bg: '#EAFDF3', border: '#22C55E', color: '#16A34A', text: '✓' };
            if (status === 'rejected' && level === 2) return { bg: '#FEE2E2', border: '#EF4444', color: '#DC2626', text: '✗' };
            if (status === 'pending' && level === 2) return { bg: '#FFFBEB', border: '#F59E0B', color: '#D97706', text: '3' }; // Pending
            return { bg: '#F1F5F9', border: '#CBD5E1', color: '#94A3B8', text: '3' };
        }
        return { bg: '#F1F5F9', border: '#CBD5E1', color: '#94A3B8', text: '' };
    };

    const getStepStatusText = (stepNum: number, req: any) => {
        const level = req.approval_level;
        const status = req.status.toLowerCase();

        if (stepNum === 1) {
            if (level >= 1) return { text: 'Approved', color: '#16A34A' };
            if (status === 'rejected' && level === 0) return { text: 'Rejected', color: '#DC2626' };
            return { text: 'Pending Review', color: '#D97706' };
        }
        if (stepNum === 2) {
            if (level >= 2) return { text: 'Approved', color: '#16A34A' };
            if (status === 'rejected' && level === 1) return { text: 'Rejected', color: '#DC2626' };
            if (status === 'pending' && level === 1) return { text: 'Pending Review', color: '#D97706' };
            return { text: 'Waiting', color: '#94A3B8' };
        }
        if (stepNum === 3) {
            if (status === 'approved') return { text: 'Approved', color: '#16A34A' };
            if (status === 'rejected' && level === 2) return { text: 'Rejected', color: '#DC2626' };
            if (status === 'pending' && level === 2) return { text: 'Pending Review', color: '#D97706' };
            return { text: 'Waiting', color: '#94A3B8' };
        }
        return { text: '', color: '#94A3B8' };
    };

    return (
        <div className="letter-request-container">
            {activeTab === 'form' ? (
                <div className="header-container" style={{ marginBottom: '32px' }}>
                    <h2 className="header-title">Letter Requests</h2>
                    <button
                        onClick={() => setActiveTab('history')}
                        className="lr-btn-primary"
                        style={{
                            background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.15)',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            color: '#FFFFFF',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            margin: 0
                        }}
                    >
                        <History />Request History
                    </button>
                </div>
            ) : (
                <div className="header-container" style={{ marginBottom: '32px' }}>
                    <button
                        onClick={() => setActiveTab('form')}
                        className="back-btn"
                        style={{ margin: 0 }}
                    >
                        <ArrowLeft size={18} /> Back
                    </button>
                </div>
            )}

            <div className="letter-request-wrapper" style={{ width: '100%' }}>
                {activeTab === 'form' ? (
                    <div className="lr-main-form" style={{ width: '100%', margin: '0 auto' }}>
                        <div className="lr-card">
                            <div className="lr-card-header">
                                <div className="lr-card-icon"><FilePlus size={24} /></div>
                                <h2 className="lr-card-title">New Letter Request Application</h2>
                            </div>

                            <form className="lr-form" onSubmit={handleSubmit}>
                                <div className="lr-section">
                                    <h3>1. Type of Letter Required</h3>
                                    <div className="checkbox-group" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <label className="lr-checkbox" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="radio"
                                                name="letterType"
                                                checked={letterType === 'Following'}
                                                onChange={() => setLetterType('Following')}
                                            />
                                            <span>To confirm that you are following the course</span>
                                        </label>
                                        <label className="lr-checkbox" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="radio"
                                                name="letterType"
                                                checked={letterType === 'Pending Results'}
                                                onChange={() => setLetterType('Pending Results')}
                                            />
                                            <span>To confirm the pending results of the course</span>
                                        </label>
                                        <label className="lr-checkbox" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="radio"
                                                name="letterType"
                                                checked={letterType === 'Completion'}
                                                onChange={() => setLetterType('Completion')}
                                            />
                                            <span>To confirm the successful completion of the course</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="lr-section">
                                    <h3>2. Applicant Details</h3>
                                    <div className="lr-form-grid">
                                        <div className="lr-input-group">
                                            <label>Status</label>
                                            <select
                                                required
                                                value={statusPrefix}
                                                onChange={(e) => setStatusPrefix(e.target.value)}
                                                className="lr-input"
                                            >
                                                <option value="">Select...</option>
                                                <option value="Mr">Mr.</option>
                                                <option value="Mrs">Mrs.</option>
                                                <option value="Ms">Ms.</option>
                                                <option value="Rev">Rev.</option>
                                            </select>
                                        </div>
                                        <div className="lr-input-group lr-span-2">
                                            <label>Name with Initials</label>
                                            <input
                                                type="text"
                                                className="lr-input"
                                                value={nameWithInitials}
                                                onChange={(e) => setNameWithInitials(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="lr-input-group lr-span-2">
                                            <label>Address</label>
                                            <textarea
                                                className="lr-input"
                                                rows={2}
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                required
                                            ></textarea>
                                        </div>
                                        <div className="lr-input-group">
                                            <label>Mobile Phone Number</label>
                                            <input
                                                type="tel"
                                                className="lr-input"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="lr-input-group">
                                            <label>National Identity Card Number</label>
                                            <input
                                                type="text"
                                                className="lr-input"
                                                value={nic}
                                                onChange={(e) => setNic(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="lr-section">
                                    <h3>3. Course Details</h3>
                                    <div className="lr-form-grid">
                                        <div className="lr-input-group lr-span-2">
                                            <label>Course Offered</label>
                                            <select
                                                className="lr-input"
                                                value={selectedCourseId}
                                                onChange={(e) => handleCourseChange(e.target.value)}
                                                required
                                            >
                                                <option value="">Select a registered course...</option>
                                                {registeredCourses.map(c => (
                                                    <option key={c.id} value={c.id}>{c.title} ({c.code})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="lr-input-group">
                                            <label>Year</label>
                                            <input
                                                type="text"
                                                className="lr-input"
                                                placeholder="e.g. 2024"
                                                value={year}
                                                onChange={(e) => setYear(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="lr-input-group">
                                            <label>Batch</label>
                                            <input
                                                type="text"
                                                className="lr-input"
                                                placeholder="e.g. Batch 05"
                                                value={batch}
                                                onChange={(e) => setBatch(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="lr-input-group lr-span-2">
                                            <label>Registration Number</label>
                                            <input
                                                type="text"
                                                className="lr-input"
                                                value={registrationNumber}
                                                onChange={(e) => setRegistrationNumber(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="lr-input-group lr-span-2">
                                            <label>Reason for the requirement of a letter</label>
                                            <textarea
                                                className="lr-input"
                                                rows={3}
                                                value={reason}
                                                onChange={(e) => setReason(e.target.value)}
                                                placeholder="Please specify why you need this letter..."
                                                required
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>

                                <div className="lr-section" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                                    <label className="lr-checkbox lr-agreement">
                                        <input
                                            type="checkbox"
                                            checked={agreed}
                                            onChange={(e) => setAgreed(e.target.checked)}
                                            required
                                        />
                                        <span>I declare that all the information provided above is true and correct to the best of my knowledge. I understand that processing this request may take up to 3-5 working days.</span>
                                    </label>
                                </div>

                                <div className="lr-form-actions">
                                    <button type="button" className="lr-btn-secondary" onClick={() => {
                                        setLetterType('');
                                        setSelectedCourseId('');
                                        setReason('');
                                        setAgreed(false);
                                        setNameWithInitials('');
                                        setBatch('');
                                        setYear('');
                                    }}>Clear Form</button>
                                    <button
                                        type="submit"
                                        className="lr-btn-primary"
                                        disabled={!letterType || !selectedCourseId || !reason || !agreed || isSubmitting}
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Submit Request'} <Send size={16} />
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="lr-info-card" style={{ marginTop: '24px' }}>
                            <h3>Instructions</h3>
                            <ul>
                                <li>Please allow 3-5 working days for processing.</li>
                                <li>You will be notified via email once the letter is ready for collection.</li>
                                <li>Incomplete applications will be rejected.</li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="lr-history-panel" style={{ width: '100%', margin: '0 auto' }}>
                        <div style={{ marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1E293B', margin: 0, letterSpacing: '-0.02em' }}>Request History</h2>
                            <p style={{ fontSize: '14px', color: '#64748B', margin: '6px 0 0 0' }}>Track the status of your submitted letter requests.</p>
                        </div>

                        <div className="lr-history-list" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {requestsHistory.map(req => {
                                const statusStyle = getStatusStyle(req.status);
                                const statusClass = `lr-history-card lr-status-${req.status.toLowerCase()}`;
                                return (
                                    <div className={statusClass} key={req.id}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                                    <span style={{
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        color: '#7C3AED',
                                                        backgroundColor: '#F5F3FF',
                                                        padding: '4px 10px',
                                                        borderRadius: '6px',
                                                        letterSpacing: '0.05em',
                                                        textTransform: 'uppercase',
                                                        border: '1px solid #DDD6FE'
                                                    }}>
                                                        Ref ID: LR-{req.id}
                                                    </span>
                                                    <span style={{ fontSize: '12px', color: '#64748B', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                        <Calendar size={14} style={{ color: '#94A3B8' }} /> Submitted on {new Date(req.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>

                                                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1E293B', margin: 0, letterSpacing: '-0.02em' }}>
                                                    {(() => {
                                                        switch (req.letter_type) {
                                                            case 'Following':
                                                                return 'To confirm that you are following the course';
                                                            case 'Pending Results':
                                                                return 'To confirm the pending results of the course';
                                                            case 'Completion':
                                                                return 'To confirm the successful completion of the course';
                                                            default:
                                                                return req.letter_type;
                                                        }
                                                    })()}
                                                </h3>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '13px', marginTop: '4px', flexWrap: 'wrap' }}>
                                                    <BookOpen size={16} style={{ color: '#7C3AED', flexShrink: 0 }} />
                                                    <span><strong>Course Offered:</strong> {req.course ? req.course.title : 'Course'}</span>
                                                    <span style={{ color: '#CBD5E1' }}>•</span>
                                                    <span style={{ backgroundColor: '#F1F5F9', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, color: '#475569' }}>
                                                        {req.batch}
                                                    </span>
                                                </div>
                                            </div>

                                            <div>
                                                <span className="lr-hi-badge" style={{ backgroundColor: statusStyle.bg, color: statusStyle.text, display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, padding: '6px 14px', borderRadius: '100px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                                    {statusStyle.icon} {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                                </span>
                                            </div>
                                        </div>

                                        <div style={{
                                            marginTop: '20px',
                                            background: '#F8FAFC',
                                            padding: '16px 20px',
                                            borderRadius: '12px',
                                            borderLeft: '4px solid #CBD5E1',
                                            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.01)'
                                        }}>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                                <MessageSquare size={14} style={{ color: '#64748B' }} /> Reason for Request:
                                            </span>
                                            <p style={{ fontSize: '13px', color: '#334155', margin: 0, fontStyle: 'italic', lineHeight: '1.5' }}>
                                                "{req.reason}"
                                            </p>
                                        </div>


                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px', background: '#F8FAFC', padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0', maxWidth: '800px' }}>
                                            {/* Step 1: Secretary */}
                                            {(() => {
                                                const s = getStepStyle(1, req);
                                                const stepStatus = getStepStatusText(1, req);
                                                return (
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                                        <div style={{
                                                            width: '32px',
                                                            height: '32px',
                                                            borderRadius: '50%',
                                                            background: s.bg,
                                                            color: s.color,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '13px',
                                                            fontWeight: 700,
                                                            border: `2px solid ${s.border}`,
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                                        }}>
                                                            {s.text}
                                                        </div>
                                                        <span style={{ fontSize: '13px', fontWeight: 600, marginTop: '8px', color: '#1E293B' }}>
                                                            Secretary
                                                        </span>
                                                        <span style={{ fontSize: '11px', fontWeight: 600, color: stepStatus.color, marginTop: '2px' }}>
                                                            {stepStatus.text}
                                                        </span>
                                                        {(req.approval_level >= 1 || (req.status.toLowerCase() === 'rejected' && req.approved_by_secretary)) && req.secretary_user && (
                                                            <span style={{ fontSize: '10px', color: '#64748B', marginTop: '2px', textAlign: 'center', maxWidth: '100px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={req.secretary_user.full_name}>
                                                                by {req.secretary_user.display_name || req.secretary_user.full_name}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })()}

                                            {/* Connector 1 */}
                                            <div style={{ flex: 0.5, height: '3px', background: req.approval_level >= 1 ? '#10B981' : '#E2E8F0', borderRadius: '2px', marginTop: '-24px' }}></div>

                                            {/* Step 2: Coordinator */}
                                            {(() => {
                                                const s = getStepStyle(2, req);
                                                const stepStatus = getStepStatusText(2, req);
                                                return (
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                                        <div style={{
                                                            width: '32px',
                                                            height: '32px',
                                                            borderRadius: '50%',
                                                            background: s.bg,
                                                            color: s.color,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '13px',
                                                            fontWeight: 700,
                                                            border: `2px solid ${s.border}`,
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                                        }}>
                                                            {s.text}
                                                        </div>
                                                        <span style={{ fontSize: '13px', fontWeight: 600, marginTop: '8px', color: '#1E293B' }}>
                                                            Coordinator
                                                        </span>
                                                        <span style={{ fontSize: '11px', fontWeight: 600, color: stepStatus.color, marginTop: '2px' }}>
                                                            {stepStatus.text}
                                                        </span>
                                                        {(req.approval_level >= 2 || (req.status.toLowerCase() === 'rejected' && req.approved_by_coordinator)) && req.coordinator_user && (
                                                            <span style={{ fontSize: '10px', color: '#64748B', marginTop: '2px', textAlign: 'center', maxWidth: '100px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={req.coordinator_user.full_name}>
                                                                by {req.coordinator_user.display_name || req.coordinator_user.full_name}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })()}


                                            <div style={{ flex: 0.5, height: '3px', background: req.approval_level >= 2 ? '#10B981' : '#E2E8F0', borderRadius: '2px', marginTop: '-24px' }}></div>

                                            {/* Step 3: Director */}
                                            {(() => {
                                                const s = getStepStyle(3, req);
                                                const stepStatus = getStepStatusText(3, req);
                                                return (
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                                        <div style={{
                                                            width: '32px',
                                                            height: '32px',
                                                            borderRadius: '50%',
                                                            background: s.bg,
                                                            color: s.color,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '13px',
                                                            fontWeight: 700,
                                                            border: `2px solid ${s.border}`,
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                                        }}>
                                                            {s.text}
                                                        </div>
                                                        <span style={{ fontSize: '13px', fontWeight: 600, marginTop: '8px', color: '#1E293B' }}>
                                                            Director
                                                        </span>
                                                        <span style={{ fontSize: '11px', fontWeight: 600, color: stepStatus.color, marginTop: '2px' }}>
                                                            {stepStatus.text}
                                                        </span>
                                                        {(req.approval_level >= 3 || (req.status.toLowerCase() === 'rejected' && req.approved_by_director)) && req.director_user && (
                                                            <span style={{ fontSize: '10px', color: '#64748B', marginTop: '2px', textAlign: 'center', maxWidth: '100px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={req.director_user.full_name}>
                                                                by {req.director_user.display_name || req.director_user.full_name}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>


                                        {(req.secretary_comment || req.coordinator_comment || req.director_comment) && (
                                            <div style={{
                                                marginTop: '20px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '12px',
                                                maxWidth: '800px'
                                            }}>
                                                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#475569', margin: '0 0 2px 0' }}>Approval Stage Remarks & Comments:</h4>

                                                {req.secretary_comment && (
                                                    <div style={{
                                                        color: '#1E293B',
                                                        fontSize: '13px',
                                                        background: '#F8FAFC',
                                                        padding: '12px 16px',
                                                        borderRadius: '10px',
                                                        border: '1px solid #E2E8F0',
                                                        borderLeft: '4px solid #0891B2',
                                                        display: 'flex',
                                                        gap: '10px',
                                                        alignItems: 'flex-start'
                                                    }}>
                                                        <MessageSquare size={16} style={{ color: '#0891B2', flexShrink: 0, marginTop: '2px' }} />
                                                        <div>
                                                            <strong style={{ display: 'block', marginBottom: '2px', color: '#0891B2' }}>
                                                                Course Secretary {req.secretary_user ? `(${req.secretary_user.display_name || req.secretary_user.full_name})` : ''}
                                                            </strong>
                                                            <span style={{ lineHeight: '1.5' }}>"{req.secretary_comment}"</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {req.coordinator_comment && (
                                                    <div style={{
                                                        color: '#1E293B',
                                                        fontSize: '13px',
                                                        background: '#F8FAFC',
                                                        padding: '12px 16px',
                                                        borderRadius: '10px',
                                                        border: '1px solid #E2E8F0',
                                                        borderLeft: '4px solid #2563EB',
                                                        display: 'flex',
                                                        gap: '10px',
                                                        alignItems: 'flex-start'
                                                    }}>
                                                        <MessageSquare size={16} style={{ color: '#2563EB', flexShrink: 0, marginTop: '2px' }} />
                                                        <div>
                                                            <strong style={{ display: 'block', marginBottom: '2px', color: '#2563EB' }}>
                                                                Course Coordinator {req.coordinator_user ? `(${req.coordinator_user.display_name || req.coordinator_user.full_name})` : ''}
                                                            </strong>
                                                            <span style={{ lineHeight: '1.5' }}>"{req.coordinator_comment}"</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {req.director_comment && (
                                                    <div style={{
                                                        color: req.status === 'rejected' ? '#C2410C' : '#1E293B',
                                                        fontSize: '13px',
                                                        background: req.status === 'rejected' ? '#FFF7ED' : '#F0F9FF',
                                                        padding: '12px 16px',
                                                        borderRadius: '10px',
                                                        border: req.status === 'rejected' ? '1px solid #FFEDD5' : '1px solid #E0F2FE',
                                                        borderLeft: '4px solid ' + (req.status === 'rejected' ? '#EF4444' : '#9333EA'),
                                                        display: 'flex',
                                                        gap: '10px',
                                                        alignItems: 'flex-start'
                                                    }}>
                                                        {req.status === 'rejected' ? (
                                                            <AlertTriangle size={16} style={{ color: '#EF4444', flexShrink: 0, marginTop: '2px' }} />
                                                        ) : (
                                                            <MessageSquare size={16} style={{ color: '#9333EA', flexShrink: 0, marginTop: '2px' }} />
                                                        )}
                                                        <div>
                                                            <strong style={{ display: 'block', marginBottom: '2px', color: req.status === 'rejected' ? '#EA580C' : '#7C3AED' }}>
                                                                {req.status === 'rejected' ? 'Director Rejection Reason' : 'Director'} {req.director_user ? `(${req.director_user.display_name || req.director_user.full_name})` : ''}
                                                            </strong>
                                                            <span style={{ lineHeight: '1.5' }}>"{req.director_comment}"</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {requestsHistory.length === 0 && (
                                <div className="lr-card" style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', border: '1px solid #E2E8F0', borderRadius: '16px' }}>
                                    <Clock size={40} style={{ opacity: 0.2, marginBottom: '12px' }} />
                                    <p style={{ fontSize: '14px', margin: 0 }}>No previous requests found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
