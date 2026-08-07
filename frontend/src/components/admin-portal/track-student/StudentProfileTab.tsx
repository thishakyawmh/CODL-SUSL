import React from 'react';
import { User, Phone, MapPin, Award, BookOpen, Calendar, ShieldCheck, Heart, GraduationCap } from 'lucide-react';

interface StudentProfileTabProps {
    student: any;
    profile: any;
}

export const StudentProfileTab: React.FC<StudentProfileTabProps> = ({ student, profile }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Personal Details Card */}
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
                        <span style={{ fontWeight: 600, color: '#0F172A', textAlign: 'right', maxWidth: '200px' }}>{profile.address || 'N/A'}</span>
                    </div>
                </div>
            </div>

            {/* Ordinary Level (O/L) Qualifications Card */}
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
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
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
                    <p style={{ color: '#94A3B8', fontSize: '14px' }}>No Ordinary Level results recorded.</p>
                )}
            </div>

            {/* Advanced Level (A/L) Qualifications Card */}
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
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
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
                    <p style={{ color: '#94A3B8', fontSize: '14px' }}>No Advanced Level results recorded.</p>
                )}
            </div>

            {/* Other Qualifications Card */}
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
