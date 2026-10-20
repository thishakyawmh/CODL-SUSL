import React from 'react';
import { User, Phone, MapPin, Award, BookOpen, Calendar, ShieldCheck, Heart, GraduationCap, Plus, Trash2 } from 'lucide-react';

interface StudentProfileTabProps {
    student: any;
    profile: any;
    isEditing?: boolean;
    editForm?: any;
    setEditForm?: React.Dispatch<React.SetStateAction<any>>;
    onSave?: (e: React.FormEvent) => void;
    onCancel?: () => void;
    onAddOLSubject?: () => void;
    onRemoveOLSubject?: (idx: number) => void;
    onOLSubjectChange?: (idx: number, field: 'subject' | 'grade', value: string) => void;
    onAddALSubject?: () => void;
    onRemoveALSubject?: (idx: number) => void;
    onALSubjectChange?: (idx: number, field: 'subject' | 'grade', value: string) => void;
}

export const StudentProfileTab: React.FC<StudentProfileTabProps> = ({
    student,
    profile,
    isEditing = false,
    editForm,
    setEditForm,
    onSave,
    onCancel,
    onAddOLSubject,
    onRemoveOLSubject,
    onOLSubjectChange,
    onAddALSubject,
    onRemoveALSubject,
    onALSubjectChange,
}) => {

    const handleInputChange = (field: string, value: any) => {
        if (setEditForm) {
            setEditForm((prev: any) => ({
                ...prev,
                [field]: value
            }));
        }
    };

    if (isEditing && editForm) {
        return (
            <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Save & Cancel Notice Bar */}
                <div style={{
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    borderRadius: '12px',
                    padding: '16px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#1E40AF' }}>
                        Editing Mode Active - Make changes and save directly here.
                    </span>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            type="button"
                            onClick={onCancel}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: '1px solid #CBD5E1',
                                background: '#FFFFFF',
                                color: '#475569',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{
                                padding: '8px 20px',
                                borderRadius: '8px',
                                border: 'none',
                                background: '#2563EB',
                                color: '#FFFFFF',
                                fontSize: '14px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.2)'
                            }}
                        >
                            Save Changes
                        </button>
                    </div>
                </div>

                {/* Demographics & Contact Form */}
                <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <User size={18} color="#2563EB" /> Demographics & Contact Information
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Full Name</label>
                            <input
                                type="text"
                                value={editForm.fullName || ''}
                                onChange={e => handleInputChange('fullName', e.target.value)}
                                required
                                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Display Name</label>
                            <input
                                type="text"
                                value={editForm.displayName || ''}
                                onChange={e => handleInputChange('displayName', e.target.value)}
                                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>NIC</label>
                            <input
                                type="text"
                                value={editForm.nic || ''}
                                onChange={e => handleInputChange('nic', e.target.value)}
                                required
                                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Email Address</label>
                            <input
                                type="email"
                                value={editForm.email || ''}
                                onChange={e => handleInputChange('email', e.target.value)}
                                required
                                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Phone Number</label>
                            <input
                                type="text"
                                value={editForm.phone || ''}
                                onChange={e => handleInputChange('phone', e.target.value)}
                                required
                                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>WhatsApp Contact</label>
                            <input
                                type="text"
                                value={editForm.whatsapp || ''}
                                onChange={e => handleInputChange('whatsapp', e.target.value)}
                                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Date of Birth</label>
                            <input
                                type="date"
                                value={editForm.dob || ''}
                                onChange={e => handleInputChange('dob', e.target.value)}
                                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Gender</label>
                            <select
                                value={editForm.sex || ''}
                                onChange={e => handleInputChange('sex', e.target.value)}
                                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none', height: '42px', background: 'white' }}
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Civil Status</label>
                            <select
                                value={editForm.civilStatus || ''}
                                onChange={e => handleInputChange('civilStatus', e.target.value)}
                                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none', height: '42px', background: 'white' }}
                            >
                                <option value="">Select Civil Status</option>
                                <option value="Unmarried">Unmarried</option>
                                <option value="Married">Married</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Residential Address</label>
                            <textarea
                                value={editForm.address || ''}
                                onChange={e => handleInputChange('address', e.target.value)}
                                rows={1}
                                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none', resize: 'vertical', minHeight: '40px' }}
                            />
                        </div>
                    </div>
                </div>

                {/* G.C.E. O/L Results Form */}
                <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BookOpen size={18} color="#2563EB" /> G.C.E. O/L Academic Record
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>O/L Examination Year</label>
                            <input
                                type="text"
                                placeholder="e.g. 2019"
                                value={editForm.olYear || ''}
                                onChange={e => handleInputChange('olYear', e.target.value)}
                                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>O/L Index Number</label>
                            <input
                                type="text"
                                placeholder="e.g. 12345678"
                                value={editForm.olIndex || ''}
                                onChange={e => handleInputChange('olIndex', e.target.value)}
                                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }}
                            />
                        </div>
                    </div>

                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#475569', marginBottom: '12px' }}>Subjects & Grades</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                        {(editForm.olSubjects || []).map((sub: any, idx: number) => (
                            <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    placeholder="Subject name"
                                    value={sub.subject || ''}
                                    onChange={e => onOLSubjectChange && onOLSubjectChange(idx, 'subject', e.target.value)}
                                    required
                                    style={{ flex: 2, padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none' }}
                                />
                                <select
                                    value={sub.grade || 'A'}
                                    onChange={e => onOLSubjectChange && onOLSubjectChange(idx, 'grade', e.target.value)}
                                    style={{ width: '90px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none', background: 'white' }}
                                >
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                    <option value="C">C</option>
                                    <option value="S">S</option>
                                    <option value="W">W</option>
                                </select>
                                <button
                                    type="button"
                                    onClick={() => onRemoveOLSubject && onRemoveOLSubject(idx)}
                                    style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px' }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={onAddOLSubject}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                        <Plus size={16} /> Add Subject Row
                    </button>
                </div>

                {/* G.C.E. A/L Results Form */}
                <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Award size={18} color="#2563EB" /> G.C.E. A/L Academic Record
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>A/L Examination Year</label>
                            <input
                                type="text"
                                placeholder="e.g. 2022"
                                value={editForm.alYear || ''}
                                onChange={e => handleInputChange('alYear', e.target.value)}
                                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>A/L Index Number</label>
                            <input
                                type="text"
                                placeholder="e.g. 9876543"
                                value={editForm.alIndex || ''}
                                onChange={e => handleInputChange('alIndex', e.target.value)}
                                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }}
                            />
                        </div>
                    </div>

                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#475569', marginBottom: '12px' }}>Subjects & Grades</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                        {(editForm.alSubjects || []).map((sub: any, idx: number) => (
                            <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    placeholder="Subject name"
                                    value={sub.subject || ''}
                                    onChange={e => onALSubjectChange && onALSubjectChange(idx, 'subject', e.target.value)}
                                    required
                                    style={{ flex: 2, padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none' }}
                                />
                                <select
                                    value={sub.grade || 'A'}
                                    onChange={e => onALSubjectChange && onALSubjectChange(idx, 'grade', e.target.value)}
                                    style={{ width: '90px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none', background: 'white' }}
                                >
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                    <option value="C">C</option>
                                    <option value="S">S</option>
                                    <option value="F">F</option>
                                </select>
                                <button
                                    type="button"
                                    onClick={() => onRemoveALSubject && onRemoveALSubject(idx)}
                                    style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px' }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={onAddALSubject}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                        <Plus size={16} /> Add Subject Row
                    </button>
                </div>

                {/* Other Qualifications Form */}
                <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <GraduationCap size={18} color="#2563EB" /> Other Qualifications
                    </h3>
                    <textarea
                        value={editForm.otherQualifications || ''}
                        onChange={e => handleInputChange('otherQualifications', e.target.value)}
                        placeholder="e.g. Professional certifications, higher diplomas, etc."
                        rows={4}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none', resize: 'vertical' }}
                    />
                </div>

                {/* Form Actions Footer Row */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    background: '#FFFFFF',
                    padding: '16px 24px',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                    <button
                        type="button"
                        onClick={onCancel}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            background: '#FFFFFF',
                            color: '#475569',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        style={{
                            padding: '10px 24px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#2563EB',
                            color: '#FFFFFF',
                            fontSize: '14px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 4px 10px rgba(37, 99, 235, 0.2)'
                        }}
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Demographics & Contact Display */}
            <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={18} color="#2563EB" /> Demographics & Contact
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
                        <span style={{ color: '#64748B' }}>Full Name</span>
                        <span style={{ fontWeight: 600, color: '#0F172A' }}>{student.fullName || 'N/A'}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
                        <span style={{ color: '#64748B' }}>Display Name</span>
                        <span style={{ fontWeight: 600, color: '#0F172A' }}>{student.displayName || 'N/A'}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
                        <span style={{ color: '#64748B' }}>NIC</span>
                        <span style={{ fontWeight: 600, color: '#0F172A' }}>{student.nic || 'N/A'}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
                        <span style={{ color: '#64748B' }}>Email</span>
                        <span style={{ fontWeight: 600, color: '#0F172A' }}>{student.email || 'N/A'}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
                        <span style={{ color: '#64748B' }}>Phone Number</span>
                        <span style={{ fontWeight: 600, color: '#0F172A' }}>{student.phone || 'N/A'}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
                        <span style={{ color: '#64748B' }}>Date of Birth</span>
                        <span style={{ fontWeight: 600, color: '#0F172A' }}>{profile.dob || 'N/A'}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
                        <span style={{ color: '#64748B' }}>Gender</span>
                        <span style={{ fontWeight: 600, color: '#0F172A' }}>{profile.sex || 'N/A'}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
                        <span style={{ color: '#64748B' }}>Civil Status</span>
                        <span style={{ fontWeight: 600, color: '#0F172A' }}>{profile.civilStatus || 'N/A'}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
                        <span style={{ color: '#64748B' }}>WhatsApp Contact</span>
                        <span style={{ fontWeight: 600, color: '#0F172A' }}>{profile.whatsapp || student.phone || 'N/A'}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748B' }}>Residential Address</span>
                        <span style={{ fontWeight: 600, color: '#0F172A', textAlign: 'right', maxWidth: '300px' }}>{profile.address || 'N/A'}</span>
                    </div>
                </div>
            </div>

            {/* G.C.E. O/L Results Display */}
            <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BookOpen size={18} color="#2563EB" /> G.C.E. O/L Results
                    </h3>
                    {profile.olYear && (
                        <span style={{ fontSize: '12px', fontWeight: 600, background: '#F1F5F9', padding: '2px 8px', borderRadius: '10px', color: '#475569' }}>
                            Year: {profile.olYear} • Index: {profile.olIndex || 'N/A'}
                        </span>
                    )}
                </div>

                {profile.olSubjects && profile.olSubjects.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                        {profile.olSubjects.map((sub: any, idx: number) => (
                            <div key={idx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '8px 12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>{sub.subject}</span>
                                <span style={{ fontSize: '13px', fontWeight: 800, color: sub.grade === 'A' ? '#166534' : '#2563EB', background: sub.grade === 'A' ? '#DCFCE7' : '#EFF6FF', padding: '2px 8px', borderRadius: '6px' }}>
                                    {sub.grade}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: '#94A3B8', fontSize: '14px', margin: 0 }}>No Ordinary Level results recorded.</p>
                )}
            </div>

            {/* G.C.E. A/L Results Display */}
            <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Award size={18} color="#2563EB" /> G.C.E. A/L Results
                    </h3>
                    {profile.alYear && (
                        <span style={{ fontSize: '12px', fontWeight: 600, background: '#F1F5F9', padding: '2px 8px', borderRadius: '10px', color: '#475569' }}>
                            Year: {profile.alYear} • Index: {profile.alIndex || 'N/A'}
                        </span>
                    )}
                </div>

                {profile.alSubjects && profile.alSubjects.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                        {profile.alSubjects.map((sub: any, idx: number) => (
                            <div key={idx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '8px 12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>{sub.subject}</span>
                                <span style={{ fontSize: '13px', fontWeight: 800, color: sub.grade === 'A' ? '#166534' : '#2563EB', background: sub.grade === 'A' ? '#DCFCE7' : '#EFF6FF', padding: '2px 8px', borderRadius: '6px' }}>
                                    {sub.grade}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: '#94A3B8', fontSize: '14px', margin: 0 }}>No Advanced Level results recorded.</p>
                )}
            </div>

            {/* Other Qualifications Display */}
            {profile.otherQualifications && profile.otherQualifications.trim() !== '' && profile.otherQualifications.trim().toLowerCase() !== 'none' && (
                <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <GraduationCap size={18} color="#2563EB" /> Other Qualifications
                    </h3>
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '14px 18px', borderRadius: '8px', fontSize: '14px', color: '#334155', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                        {profile.otherQualifications}
                    </div>
                </div>
            )}
        </div>
    );
};
