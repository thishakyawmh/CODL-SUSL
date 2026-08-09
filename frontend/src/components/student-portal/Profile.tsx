import React, { useState } from 'react';
import { User, MapPin, Phone, GraduationCap, Briefcase, Mail, Edit3, Save, X, Trash2, Lock } from 'lucide-react';
import { DashboardHeader } from './DashboardHeader';
import { getInitials, getAvatarColor, getFullAvatarUrl } from '../../data/mockAdminData';
import { userService } from '../../services/apiService';
import { toast } from '../../utils/toast';
import './Profile.css';

export const Profile: React.FC = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Initial mock data simulating what is fetched from the backend (saved from previous applications)
    const [profileData, setProfileData] = useState(() => {
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                return {
                    studentNumber: user.student_number || '',
                    fullName: user.full_name || '',
                    displayName: user.display_name || '',
                    address: user.address || '',
                    dob: user.dob ? user.dob.split('T')[0] : '',
                    nic: user.nic || '',
                    sex: user.sex || '',
                    civilStatus: user.civil_status || '',
                    district: user.district || '',
                    employmentTitle: user.employment_title || '',
                    officialAddress: user.official_address || '',
                    mobilePhone: user.phone || '',
                    homePhone: user.home_phone || '',
                    whatsapp: user.whatsapp || '',
                    guardianPhone: user.guardian_phone || '',
                    email: user.email || '',
                    avatar: user.avatar || '',
                    olSubjects: Array.isArray(user.ol_subjects) ? user.ol_subjects : [],
                    alSubjects: Array.isArray(user.al_subjects) ? user.al_subjects : []
                };
            } catch (err) {
                console.error("Failed to parse user from session storage:", err);
            }
        }
        return {
            studentNumber: '',
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
            avatar: '',
            olSubjects: [],
            alSubjects: []
        };
    });

    const [tempData, setTempData] = useState({ ...profileData });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setTempData(prev => ({ ...prev, [name]: value }));
    };

    const addOlSubject = () => {
        if (tempData.olSubjects.length < 10) {
            setTempData(prev => ({
                ...prev,
                olSubjects: [...prev.olSubjects, { subject: '', grade: '' }]
            }));
        }
    };

    const removeOlSubject = (index: number) => {
        setTempData(prev => {
            const newSubjects = [...prev.olSubjects];
            newSubjects.splice(index, 1);
            return { ...prev, olSubjects: newSubjects };
        });
    };

    const handleOlSubjectChange = (index: number, field: 'subject' | 'grade', value: string) => {
        setTempData(prev => {
            const newSubjects = prev.olSubjects.map((sub: { subject: string; grade: string }, idx: number) => {
                if (idx === index) {
                    return { ...sub, [field]: value };
                }
                return sub;
            });
            return { ...prev, olSubjects: newSubjects };
        });
    };

    const addAlSubject = () => {
        if (tempData.alSubjects.length < 4) {
            setTempData(prev => ({
                ...prev,
                alSubjects: [...prev.alSubjects, { subject: '', grade: '' }]
            }));
        }
    };

    const removeAlSubject = (index: number) => {
        setTempData(prev => {
            const newSubjects = [...prev.alSubjects];
            newSubjects.splice(index, 1);
            return { ...prev, alSubjects: newSubjects };
        });
    };

    const handleAlSubjectChange = (index: number, field: 'subject' | 'grade', value: string) => {
        setTempData(prev => {
            const newSubjects = prev.alSubjects.map((sub: { subject: string; grade: string }, idx: number) => {
                if (idx === index) {
                    return { ...sub, [field]: value };
                }
                return sub;
            });
            return { ...prev, alSubjects: newSubjects };
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload = {
                full_name: tempData.fullName,
                email: tempData.email,
                display_name: tempData.displayName,
                phone: tempData.mobilePhone,
                dob: tempData.dob || null,
                sex: tempData.sex || null,
                civil_status: tempData.civilStatus || null,
                address: tempData.address || null,
                district: tempData.district || null,
                employment_title: tempData.employmentTitle || null,
                official_address: tempData.officialAddress || null,
                ol_subjects: tempData.olSubjects || [],
                al_subjects: tempData.alSubjects || [],
                whatsapp: tempData.whatsapp || null,
                home_phone: tempData.homePhone || null,
                guardian_phone: tempData.guardianPhone || null,
                avatar: tempData.avatar || null
            };

            if (avatarFile) {
                try {
                    const uploadRes = await userService.uploadAvatar(avatarFile);
                    payload.avatar = uploadRes.avatar_url;
                    setAvatarFile(null);
                } catch (uploadErr) {
                    console.error("Failed to upload avatar:", uploadErr);
                    toast.error("Failed to upload profile picture.");
                    setIsSaving(false);
                    return;
                }
            }

            const response = await userService.updateProfile(payload);
            const updatedUser = response.user;

            if (updatedUser) {
                sessionStorage.setItem('user', JSON.stringify(updatedUser));

                const mappedProfile = {
                    studentNumber: updatedUser.student_number || '',
                    fullName: updatedUser.full_name || '',
                    displayName: updatedUser.display_name || '',
                    address: updatedUser.address || '',
                    dob: updatedUser.dob ? updatedUser.dob.split('T')[0] : '',
                    nic: updatedUser.nic || '',
                    sex: updatedUser.sex || '',
                    civilStatus: updatedUser.civil_status || '',
                    district: updatedUser.district || '',
                    employmentTitle: updatedUser.employment_title || '',
                    officialAddress: updatedUser.official_address || '',
                    mobilePhone: updatedUser.phone || '',
                    homePhone: updatedUser.home_phone || '',
                    whatsapp: updatedUser.whatsapp || '',
                    guardianPhone: updatedUser.guardian_phone || '',
                    email: updatedUser.email || '',
                    avatar: updatedUser.avatar || '',
                    olSubjects: Array.isArray(updatedUser.ol_subjects) ? updatedUser.ol_subjects : [],
                    alSubjects: Array.isArray(updatedUser.al_subjects) ? updatedUser.al_subjects : []
                };

                setProfileData(mappedProfile);
                setTempData(mappedProfile);
                toast.success("Profile updated successfully!");
                setIsEditing(false);
            }
        } catch (err: any) {
            console.error("Failed to save profile:", err);
            toast.error(err.response?.data?.message || "An error occurred while saving profile changes.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setTempData({ ...profileData });
        setAvatarFile(null);
        setIsEditing(false);
    };

    return (
        <div className="profile-container">
            <div style={{ marginBottom: '20px' }}>
                <DashboardHeader title="My Profile" />
            </div>

            <p className="profile-page-subtitle">
                Manage your personal information, contact details, and qualifications. These details are used to auto-fill your course applications.
            </p>

            {isEditing && (
                <div className="profile-warning-banner">
                    <div className="warning-banner-content">
                        <Lock size={16} className="warning-icon" />
                        <span>Some profile details (such as Name, NIC, DOB, Gender, contact details, and Qualifications) have been verified and approved, and cannot be changed.</span>
                    </div>
                </div>
            )}

            <div className="profile-header-card">
                <div className="profile-avatar-wrapper">
                    {(isEditing ? tempData.avatar : profileData.avatar) ? (
                        <img
                            src={isEditing ? (tempData.avatar?.startsWith('blob:') ? tempData.avatar : getFullAvatarUrl(tempData.avatar)) : getFullAvatarUrl(profileData.avatar)}
                            alt="Profile"
                            className="profile-avatar"
                        />
                    ) : (
                        <div
                            className="profile-avatar-initials"
                            style={{ backgroundColor: getAvatarColor(profileData.fullName) }}
                        >
                            {getInitials(profileData.fullName)}
                        </div>
                    )}
                    {isEditing && (
                        <label className="avatar-upload-overlay">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setAvatarFile(file);
                                        const imageUrl = URL.createObjectURL(file);
                                        setTempData(prev => ({ ...prev, avatar: imageUrl }));
                                    }
                                }}
                                style={{ display: 'none' }}
                            />
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                <circle cx="12" cy="13" r="4"></circle>
                            </svg>
                        </label>
                    )}
                </div>
                <div className="profile-header-info">
                    <h1 className="profile-name">{profileData.displayName || profileData.fullName}</h1>
                    <div className="profile-student-id">
                        <User size={16} /> Reg: {profileData.studentNumber || 'ST00256'}
                    </div>
                    <div className="profile-badges">
                        <span className="profile-badge" style={{ background: 'rgba(16, 185, 129, 0.2)' }}>Active Student</span>
                    </div>
                </div>
                {!isEditing ? (
                    <div className="profile-quick-actions">
                        <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
                            <Edit3 size={18} /> Edit Profile
                        </button>
                    </div>
                ) : (
                    <div className="profile-quick-actions" style={{ display: 'flex', gap: '12px' }}>
                        <button className="cancel-btn top-action-btn" onClick={handleCancel} disabled={isSaving}>
                            <X size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} /> Cancel
                        </button>
                        <button className="save-btn top-action-btn" onClick={handleSave} disabled={isSaving}>
                            <Save size={18} /> {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                )}
            </div>

            <div className="profile-content-grid">

                {/* Personal Information */}
                <div className="profile-section-card">
                    <div className="profile-section-header">
                        <div className="profile-section-icon"><User size={24} /></div>
                        <h2 className="profile-section-title">Personal Information</h2>
                    </div>

                    <div className="profile-info-grid">
                        <div className="profile-info-item full-width">
                            <span className="profile-info-label">Full Name</span>
                            {isEditing ? (
                                <div className="profile-locked-field">
                                    <span className="profile-info-value">{tempData.fullName}</span>
                                    <span className="locked-badge"><Lock size={12} /> Locked</span>
                                </div>
                            ) : (
                                <span className="profile-info-value">{profileData.fullName}</span>
                            )}
                        </div>

                        <div className="profile-info-item full-width">
                            <span className="profile-info-label">Display Name</span>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="displayName"
                                    className="profile-input"
                                    value={tempData.displayName}
                                    onChange={handleChange}
                                    placeholder="Enter your display name"
                                />
                            ) : (
                                <span className="profile-info-value">{profileData.displayName || '-'}</span>
                            )}
                        </div>

                        <div className="profile-info-item">
                            <span className="profile-info-label">NIC Number</span>
                            {isEditing ? (
                                <div className="profile-locked-field">
                                    <span className="profile-info-value">{tempData.nic}</span>
                                    <span className="locked-badge"><Lock size={12} /> Locked</span>
                                </div>
                            ) : (
                                <span className="profile-info-value">{profileData.nic}</span>
                            )}
                        </div>

                        <div className="profile-info-item">
                            <span className="profile-info-label">Date of Birth</span>
                            {isEditing ? (
                                <div className="profile-locked-field">
                                    <span className="profile-info-value">{tempData.dob}</span>
                                    <span className="locked-badge"><Lock size={12} /> Locked</span>
                                </div>
                            ) : (
                                <span className="profile-info-value">{profileData.dob}</span>
                            )}
                        </div>

                        <div className="profile-info-item">
                            <span className="profile-info-label">Gender</span>
                            {isEditing ? (
                                <div className="profile-locked-field">
                                    <span className="profile-info-value">{tempData.sex}</span>
                                    <span className="locked-badge"><Lock size={12} /> Locked</span>
                                </div>
                            ) : (
                                <span className="profile-info-value">{profileData.sex}</span>
                            )}
                        </div>

                        <div className="profile-info-item">
                            <span className="profile-info-label">Civil Status</span>
                            {isEditing ? (
                                <div className="profile-locked-field">
                                    <span className="profile-info-value">{tempData.civilStatus}</span>
                                    <span className="locked-badge"><Lock size={12} /> Locked</span>
                                </div>
                            ) : (
                                <span className="profile-info-value">{profileData.civilStatus}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Contact & Address */}
                <div className="profile-section-card">
                    <div className="profile-section-header">
                        <div className="profile-section-icon"><MapPin size={24} /></div>
                        <h2 className="profile-section-title">Contact & Address</h2>
                    </div>

                    <div className="profile-info-grid">
                        <div className="profile-info-item full-width">
                            <span className="profile-info-label">Permanent Address</span>
                            {isEditing ? (
                                <div className="profile-locked-field" style={{ minHeight: '60px', alignItems: 'flex-start' }}>
                                    <span className="profile-info-value" style={{ whiteSpace: 'pre-wrap' }}>{tempData.address}</span>
                                    <span className="locked-badge" style={{ marginTop: '2px' }}><Lock size={12} /> Locked</span>
                                </div>
                            ) : (
                                <span className="profile-info-value" style={{ whiteSpace: 'pre-wrap' }}>{profileData.address}</span>
                            )}
                        </div>

                        <div className="profile-info-item">
                            <span className="profile-info-label">District</span>
                            {isEditing ? (
                                <div className="profile-locked-field">
                                    <span className="profile-info-value">{tempData.district}</span>
                                    <span className="locked-badge"><Lock size={12} /> Locked</span>
                                </div>
                            ) : (
                                <span className="profile-info-value">{profileData.district}</span>
                            )}
                        </div>

                        <div className="profile-info-item">
                            <span className="profile-info-label">Email Address</span>
                            {isEditing ? (
                                <div className="profile-locked-field">
                                    <span className="profile-info-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Mail size={16} color="#6b7280" /> {tempData.email}
                                    </span>
                                    <span className="locked-badge"><Lock size={12} /> Locked</span>
                                </div>
                            ) : (
                                <span className="profile-info-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Mail size={16} color="#6b7280" /> {profileData.email}
                                </span>
                            )}
                        </div>

                        <div className="profile-info-item">
                            <span className="profile-info-label">Mobile Phone</span>
                            {isEditing ? (
                                <input type="text" name="mobilePhone" value={tempData.mobilePhone} onChange={handleChange} className="profile-info-input" />
                            ) : (
                                <span className="profile-info-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Phone size={16} color="#6b7280" /> {profileData.mobilePhone}
                                </span>
                            )}
                        </div>

                        <div className="profile-info-item">
                            <span className="profile-info-label">WhatsApp Number</span>
                            {isEditing ? (
                                <input type="text" name="whatsapp" value={tempData.whatsapp} onChange={handleChange} className="profile-info-input" />
                            ) : (
                                <span className="profile-info-value">{profileData.whatsapp}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Employment Info */}
                <div className="profile-section-card full-width">
                    <div className="profile-section-header">
                        <div className="profile-section-icon"><Briefcase size={24} /></div>
                        <h2 className="profile-section-title">Employment Information</h2>
                    </div>

                    <div className="profile-info-grid">
                        <div className="profile-info-item">
                            <span className="profile-info-label">Job Title / Position</span>
                            {isEditing ? (
                                <input type="text" name="employmentTitle" value={tempData.employmentTitle} onChange={handleChange} className="profile-info-input" />
                            ) : (
                                <span className="profile-info-value">{profileData.employmentTitle || "- Not Provided -"}</span>
                            )}
                        </div>

                        <div className="profile-info-item">
                            <span className="profile-info-label">Official Address</span>
                            {isEditing ? (
                                <input type="text" name="officialAddress" value={tempData.officialAddress} onChange={handleChange} className="profile-info-input" />
                            ) : (
                                <span className="profile-info-value">{profileData.officialAddress || "- Not Provided -"}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Educational Qualifications */}
                <div className="profile-section-card full-width">
                    <div className="profile-section-header">
                        <div className="profile-section-icon"><GraduationCap size={24} /></div>
                        <h2 className="profile-section-title">Educational Qualifications</h2>
                        {isEditing && (
                            <span className="locked-section-badge" style={{ marginLeft: 'auto' }}>
                                <Lock size={14} /> Verified & Locked
                            </span>
                        )}
                    </div>

                    <div className="profile-info-grid">
                        <div className="profile-info-item full-width">
                            <h3 style={{ fontSize: '16px', fontWeight: 600, marginTop: 0, marginBottom: '16px' }}>G.C.E. O/L Examination</h3>
                            <div className="edu-table-container">
                                <table className="edu-table">
                                    <thead>
                                        <tr>
                                            <th>Subject</th>
                                            <th>Grade</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {profileData.olSubjects.map((sub: { subject: string; grade: string }, idx: number) => (
                                            <tr key={idx}>
                                                <td>{sub.subject}</td>
                                                <td><span className={`edu-badge ${sub.grade}`}>{sub.grade}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="profile-info-item full-width" style={{ marginTop: '16px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, marginTop: 0, marginBottom: '16px' }}>G.C.E. A/L Examination</h3>
                            <div className="edu-table-container">
                                <table className="edu-table">
                                    <thead>
                                        <tr>
                                            <th>Subject</th>
                                            <th>Grade</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {profileData.alSubjects.map((sub: { subject: string; grade: string }, idx: number) => (
                                            <tr key={idx}>
                                                <td>{sub.subject}</td>
                                                <td><span className={`edu-badge ${sub.grade}`}>{sub.grade}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>


            </div>
        </div>
    );
};
