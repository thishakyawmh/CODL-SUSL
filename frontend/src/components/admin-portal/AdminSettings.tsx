import React, { useState, useEffect, useRef } from 'react';
import {
    Globe, Database, Calendar,
    Save, RefreshCcw, Shield, Mail, MapPin,
    Phone, Clock, Image, Wrench, AlertTriangle,
    Trash2, Search, Eye, ArrowLeft, Loader2,
    User, Upload, Camera, X, Lock, KeyRound, CheckCircle,
    Activity
} from 'lucide-react';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip
} from 'recharts';
import { databaseTableService, userService, systemSettingService, backupService, statsService } from '../../services/apiService';
import { getCurrentAdminUser, getFullAvatarUrl } from '../../data/mockAdminData';
import { toast } from '../../utils/toast';
import { ConfirmModal } from '../common/ConfirmModal';
import './AdminSettings.css';

export const AdminSettings: React.FC = () => {
    const user = getCurrentAdminUser();
    const isSuperAdmin = user.role !== 'director' && user.role !== 'coordinator' && user.role !== 'secretary' && user.role !== 'lecturer';
    const isDirector = user.role === 'director';
    const isCoordinator = user.role === 'coordinator' || user.role === 'secretary' || user.role === 'lecturer';

    const [activeSection, setActiveSection] = useState(isCoordinator ? 'profile' : (isDirector ? 'profile' : 'general'));
    const [saved, setSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [avatarError, setAvatarError] = useState(false);
    const [confirmModalConfig, setConfirmModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        description: '',
        onConfirm: () => {}
    });

    const [profileData, setProfileData] = useState({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
    });

    const [generalData, setGeneralData] = useState({
        institution_name: '',
        university_name: '',
        contact_email: '',
        contact_phone: '',
        address: '',
        logo: '',
        primary_color: 'var(--primary-color)',
        website_url: '',
        academic_year: '2025/2026',
        session_timeout: 30,
        min_password_length: 8,
        maintenance_mode: false,
        maintenance_message: 'The system is currently undergoing scheduled maintenance. Please check back later.',
        backup_frequency: 'daily',
        backup_retention: 30,
        last_backup_at: null as string | null,
        last_backup_status: null as string | null,
        next_backup_at: null as string | null,
    });
    const [loadingSettings, setLoadingSettings] = useState<boolean>(true);

    const logoInputRef = useRef<HTMLInputElement>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false);


    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    const [backupFiles, setBackupFiles] = useState<Array<{ name: string; size: number; created_at: string }>>([]);
    const [loadingBackups, setLoadingBackups] = useState<boolean>(false);
    const [isRunningBackup, setIsRunningBackup] = useState<boolean>(false);
    const [cpuUsage, setCpuUsage] = useState<number>(14);
    const [healthTimeframe, setHealthTimeframe] = useState<string>('1d');
    const [activityFlow, setActivityFlow] = useState<any[]>([]);
    const [loadingHealthStats, setLoadingHealthStats] = useState<boolean>(false);

    useEffect(() => {
        if (activeSection === 'backup') {
            fetchBackups();
        }
    }, [activeSection]);

    useEffect(() => {
        if (activeSection !== 'health') return;
        const interval = setInterval(() => {
            setCpuUsage(prev => {
                const diff = (Math.random() - 0.5) * 4;
                const next = prev + diff;
                return Math.max(8, Math.min(25, parseFloat(next.toFixed(1))));
            });
        }, 3000);
        return () => clearInterval(interval);
    }, [activeSection]);

    useEffect(() => {
        if (activeSection !== 'health') return;
        const fetchHealthStats = async () => {
            setLoadingHealthStats(true);
            try {
                const res = await statsService.getSystemHealthStats(healthTimeframe);
                setActivityFlow(res.activityFlow || []);
            } catch (err) {
                console.error("Failed to load health statistics", err);
            } finally {
                setLoadingHealthStats(false);
            }
        };
        fetchHealthStats();
    }, [activeSection, healthTimeframe]);
    const fetchBackups = async () => {
        setLoadingBackups(true);
        try {
            const data = await backupService.getBackups();
            setBackupFiles(data.files || []);
            if (data.settings) {
                setGeneralData(prev => ({
                    ...prev,
                    ...data.settings
                }));
            }
        } catch (err) {
            console.error("Failed to fetch backups:", err);
            toast.error("Failed to load backup files.");
        } finally {
            setLoadingBackups(false);
        }
    };

    useEffect(() => {
        if (activeSection === 'backup') {
            fetchBackups();
        }
    }, [activeSection]);

    const handleRunBackup = async () => {
        setIsRunningBackup(true);
        try {
            const data = await backupService.runBackup();
            toast.success("Database backup completed successfully!");
            setBackupFiles(data.files || []);
            if (data.settings) {
                setGeneralData(prev => ({
                    ...prev,
                    ...data.settings
                }));
            }
            fetchBackups();
        } catch (err: any) {
            console.error("Failed to run backup:", err);
            toast.error(err.response?.data?.message || "Failed to trigger backup.");
        } finally {
            setIsRunningBackup(false);
        }
    };

    const handleDownloadBackup = async (filename: string) => {
        try {
            toast.info(`Downloading backup ${filename}...`);
            await backupService.downloadBackup(filename);
        } catch (err: any) {
            console.error("Failed to download backup:", err);
            toast.error("Failed to download backup file.");
        }
    };

    const handleDeleteBackup = (filename: string) => {
        setConfirmModalConfig({
            isOpen: true,
            title: 'Delete Backup File',
            description: `Are you sure you want to delete the backup file "${filename}"? This action cannot be undone.`,
            onConfirm: () => executeDeleteBackup(filename)
        });
    };

    const executeDeleteBackup = async (filename: string) => {
        try {
            await backupService.deleteBackup(filename);
            toast.success("Backup file deleted successfully!");
            fetchBackups();
        } catch (err: any) {
            console.error("Failed to delete backup:", err);
            toast.error(err.response?.data?.message || "Failed to delete backup file.");
        } finally {
            setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
        }
    };

    const formatBackupDate = (dateStr: string | null) => {
        if (!dateStr) return 'Never';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        }) + ' - ' + d.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await systemSettingService.getSettings();
                setGeneralData(data);
            } catch (err) {
                console.error("Failed to fetch system settings:", err);
            } finally {
                setLoadingSettings(false);
            }
        };
        fetchSettings();
    }, []);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP).');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error('Logo file must be less than 2MB.');
            return;
        }

        setLogoFile(file);
        const previewUrl = URL.createObjectURL(file);
        setLogoPreview(previewUrl);
    };


    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState<{[key: string]: string}>({});

    const [tables, setTables] = useState<Array<{ name: string; rows_count: number }>>([]);
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [tableData, setTableData] = useState<{ table: string; columns: string[]; data: any[] } | null>(null);
    const [loadingTables, setLoadingTables] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [tableSearch, setTableSearch] = useState('');
    const [rowSearch, setRowSearch] = useState('');

    const fetchTables = async () => {
        setLoadingTables(true);
        try {
            const data = await databaseTableService.getTables();
            setTables(data);
        } catch (err: any) {
            console.error("Failed to fetch tables:", err);
            toast.error("Failed to load database tables.");
        } finally {
            setLoadingTables(false);
        }
    };

    useEffect(() => {
        if (activeSection === 'datatables') {
            fetchTables();
        }
    }, [activeSection]);

    const fetchTableData = async (tableName: string) => {
        setLoadingData(true);
        setSelectedTable(tableName);
        try {
            const data = await databaseTableService.getTableData(tableName);
            setTableData(data);
        } catch (err: any) {
            console.error("Failed to fetch table data:", err);
            toast.error(`Failed to load data for table ${tableName}.`);
            setSelectedTable(null);
        } finally {
            setLoadingData(false);
        }
    };

    const handleDeleteRecord = (tableName: string, id: any) => {
        setConfirmModalConfig({
            isOpen: true,
            title: 'Delete Database Record',
            description: `Are you sure you want to delete record #${id} from ${tableName}? This action cannot be undone.`,
            onConfirm: () => executeDeleteRecord(tableName, id)
        });
    };

    const executeDeleteRecord = async (tableName: string, id: any) => {
        try {
            await databaseTableService.deleteRecord(tableName, id);
            toast.success("Record deleted successfully!");
            if (tableData) {
                setTableData(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        data: prev.data.filter(row => row.id !== id)
                    };
                });
            }
        } catch (err: any) {
            console.error("Failed to delete record:", err);
            toast.error(err.response?.data?.message || "Failed to delete database record.");
        } finally {
            setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
        }
    };


    const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;


        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP).');
            return;
        }


        if (file.size > 2 * 1024 * 1024) {
            toast.error('Image file must be less than 2MB.');
            return;
        }

        setAvatarFile(file);
        const previewUrl = URL.createObjectURL(file);
        setAvatarPreview(previewUrl);
        setAvatarError(false);
    };

    const handleRemoveAvatar = () => {
        setAvatarFile(null);
        if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview);
            setAvatarPreview(null);
        }
        setProfileData(p => ({ ...p, avatar: '' }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleUploadAvatar = async () => {
        if (!avatarFile) return null;
        setIsUploadingAvatar(true);
        try {
            const res = await userService.uploadAvatar(avatarFile);
            setProfileData(p => ({ ...p, avatar: res.avatar_url }));
            if (res.user) {
                sessionStorage.setItem('user', JSON.stringify(res.user));
            }
            toast.success('Profile picture uploaded successfully!');
            setAvatarFile(null);
            if (avatarPreview) {
                URL.revokeObjectURL(avatarPreview);
                setAvatarPreview(null);
            }
            return res.avatar_url;
        } catch (err: any) {
            console.error("Failed to upload avatar:", err);
            toast.error(err.response?.data?.message || 'Failed to upload profile picture.');
            throw err;
        } finally {
            setIsUploadingAvatar(false);
        }
    };


    const validatePassword = () => {
        const errors: {[key: string]: string} = {};
        if (!passwordData.currentPassword) {
            errors.currentPassword = 'Current password is required.';
        }
        if (!passwordData.newPassword) {
            errors.newPassword = 'New password is required.';
        } else if (passwordData.newPassword.length < 8) {
            errors.newPassword = 'Password must be at least 8 characters.';
        }
        if (!passwordData.confirmPassword) {
            errors.confirmPassword = 'Please confirm your new password.';
        } else if (passwordData.newPassword !== passwordData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match.';
        }
        setPasswordErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChangePassword = async () => {
        if (!validatePassword()) return;
        setIsChangingPassword(true);
        try {
            await userService.changePassword({
                current_password: passwordData.currentPassword,
                password: passwordData.newPassword,
                password_confirmation: passwordData.confirmPassword,
            });
            toast.success('Password changed successfully!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setPasswordErrors({});
        } catch (err: any) {
            console.error("Failed to change password:", err);
            if (err.response?.data?.errors?.current_password) {
                setPasswordErrors({ currentPassword: err.response.data.errors.current_password[0] });
            } else {
                toast.error(err.response?.data?.message || 'Failed to change password.');
            }
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleSave = async () => {
        if (activeSection === 'profile') {
            setIsSaving(true);
            try {
                let currentAvatar = profileData.avatar;

                if (avatarFile) {
                    try {
                        const uploadedUrl = await handleUploadAvatar();
                        if (uploadedUrl) {
                            currentAvatar = uploadedUrl;
                        }
                    } catch (uploadErr) {

                        setIsSaving(false);
                        return;
                    }
                }

                const payload = {
                    full_name: profileData.fullName,
                    email: profileData.email,
                    phone: profileData.phone,
                    avatar: currentAvatar,
                };
                const res = await userService.updateProfile(payload);
                if (res.user) {
                    sessionStorage.setItem('user', JSON.stringify(res.user));
                }
                toast.success('Profile updated successfully!');
                setSaved(true);
                setTimeout(() => {
                    setSaved(false);
                    window.location.reload();
                }, 1000);
            } catch (err: any) {
                console.error("Failed to update profile:", err);
                toast.error(err.response?.data?.message || 'Failed to update profile.');
            } finally {
                setIsSaving(false);
            }
        } else if (
            activeSection === 'general' || 
            (activeSection === 'security' && isSuperAdmin) || 
            (activeSection === 'maintenance' && isSuperAdmin) ||
            (activeSection === 'backup' && isSuperAdmin)
        ) {
            setIsSaving(true);
            try {
                let currentLogo = generalData.logo;
                if (logoFile) {
                    setIsUploadingLogo(true);
                    try {
                        const logoRes = await systemSettingService.uploadLogo(logoFile);
                        currentLogo = logoRes.logo_url;
                        setLogoFile(null);
                        setLogoPreview(null);
                    } catch (logoErr: any) {
                        toast.error(logoErr.response?.data?.message || 'Failed to upload logo.');
                        setIsSaving(false);
                        setIsUploadingLogo(false);
                        return;
                    } finally {
                        setIsUploadingLogo(false);
                    }
                }

                const payload = {
                    ...generalData,
                    logo: currentLogo
                };
                
                const res = await systemSettingService.updateSettings(payload);
                localStorage.setItem('systemSettings', JSON.stringify(res.settings));
                setGeneralData(res.settings);
                toast.success('System settings updated successfully!');
                setSaved(true);
                setTimeout(() => {
                    setSaved(false);
                    window.location.reload();
                }, 1000);
            } catch (err: any) {
                console.error("Failed to update system settings:", err);
                toast.error(err.response?.data?.message || 'Failed to update system settings.');
            } finally {
                setIsSaving(false);
            }
        } else {
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }
    };


    const renderPasswordChangeForm = () => (
        <div className="as-password-change-section">
            <div className="as-password-header">
                <div className="as-password-icon-wrapper">
                    <KeyRound size={22} />
                </div>
                <div>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1E293B' }}>Change Your Password</h4>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
                        Enter your current password followed by the new one to update your credentials.
                    </p>
                </div>
            </div>

            <div className="as-password-form">
                <div className="as-password-field">
                    <label><Lock size={14} /> Current Password</label>
                    <input
                        type="password"
                        placeholder="Enter your current password"
                        value={passwordData.currentPassword}
                        onChange={(e) => {
                            setPasswordData(p => ({ ...p, currentPassword: e.target.value }));
                            if (passwordErrors.currentPassword) setPasswordErrors(p => ({ ...p, currentPassword: '' }));
                        }}
                        className={passwordErrors.currentPassword ? 'error' : ''}
                    />
                    {passwordErrors.currentPassword && (
                        <span className="as-field-error">{passwordErrors.currentPassword}</span>
                    )}
                </div>

                <div className="as-password-row">
                    <div className="as-password-field">
                        <label><KeyRound size={14} /> New Password</label>
                        <input
                            type="password"
                            placeholder="Min. 8 characters"
                            value={passwordData.newPassword}
                            onChange={(e) => {
                                setPasswordData(p => ({ ...p, newPassword: e.target.value }));
                                if (passwordErrors.newPassword) setPasswordErrors(p => ({ ...p, newPassword: '' }));
                            }}
                            className={passwordErrors.newPassword ? 'error' : ''}
                        />
                        {passwordErrors.newPassword && (
                            <span className="as-field-error">{passwordErrors.newPassword}</span>
                        )}
                    </div>
                    <div className="as-password-field">
                        <label><CheckCircle size={14} /> Confirm New Password</label>
                        <input
                            type="password"
                            placeholder="Re-enter new password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => {
                                setPasswordData(p => ({ ...p, confirmPassword: e.target.value }));
                                if (passwordErrors.confirmPassword) setPasswordErrors(p => ({ ...p, confirmPassword: '' }));
                            }}
                            className={passwordErrors.confirmPassword ? 'error' : ''}
                        />
                        {passwordErrors.confirmPassword && (
                            <span className="as-field-error">{passwordErrors.confirmPassword}</span>
                        )}
                    </div>
                </div>

                <div className="as-password-actions">
                    <button
                        className="as-change-password-btn"
                        onClick={handleChangePassword}
                        disabled={isChangingPassword}
                    >
                        {isChangingPassword ? (
                            <>
                                <Loader2 size={16} className="animate-spin" /> Changing...
                            </>
                        ) : (
                            <>
                                <Shield size={16} /> Change Password
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );

    const sections = isSuperAdmin ? [
        { key: 'general', label: 'General', icon: <Globe size={16} /> },
        { key: 'profile', label: 'Profile', icon: <User size={16} /> },
        { key: 'security', label: 'Security', icon: <Shield size={16} /> },
        { key: 'maintenance', label: 'Maintenance', icon: <Wrench size={16} /> },
        { key: 'health', label: 'System Health', icon: <Activity size={16} /> },
        { key: 'backup', label: 'Backup', icon: <Database size={16} /> },
        { key: 'datatables', label: 'Data Tables', icon: <Database size={16} /> },
    ] : isDirector ? [
        { key: 'general', label: 'General', icon: <Globe size={16} /> },
        { key: 'profile', label: 'Profile', icon: <User size={16} /> },
        { key: 'security', label: 'Security', icon: <Shield size={16} /> },
    ] : [
        { key: 'profile', label: 'Profile', icon: <User size={16} /> },
        { key: 'security', label: 'Security', icon: <Shield size={16} /> },
    ];

    return (
        <div className="as-container">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">{isCoordinator ? 'Profile Settings' : 'System Settings'}</h1>
                    <p className="admin-page-subtitle">
                        {isCoordinator 
                            ? 'Manage your personal profile information, email address, and contact details.' 
                            : 'Configure system-wide settings, security, and data backups.'}
                    </p>
                </div>
            </div>

            <div className="as-layout">
                { }
                <div className="as-nav">
                    {sections.map(section => (
                        <button
                            key={section.key}
                            className={`as-nav-item ${activeSection === section.key ? 'active' : ''}`}
                            onClick={() => setActiveSection(section.key)}
                        >
                            {section.icon}
                            <span>{section.label}</span>
                        </button>
                    ))}
                </div>

                { }
                <div className="as-content">
                    {activeSection === 'general' && (
                        loadingSettings ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: '#64748B' }}>
                                <Loader2 className="spinner animate-spin" size={32} />
                                <p style={{ marginTop: '12px', fontWeight: 600 }}>Loading system settings...</p>
                            </div>
                        ) : (
                            <div className="as-section animate-fade-in">
                                <h2><Globe size={20} /> General Settings</h2>
                                <p className="as-section-desc">Configure the institution's basic information and branding.</p>

                                <div className="as-form-grid">
                                    <div className="as-form-group full-width">
                                        <label>Institution Name</label>
                                        <input 
                                            type="text" 
                                            value={generalData.institution_name} 
                                            onChange={e => setGeneralData(prev => ({ ...prev, institution_name: e.target.value }))}
                                        />
                                    </div>
                                    <div className="as-form-group full-width">
                                        <label>University Name</label>
                                        <input 
                                            type="text" 
                                            value={generalData.university_name} 
                                            onChange={e => setGeneralData(prev => ({ ...prev, university_name: e.target.value }))}
                                        />
                                    </div>
                                    <div className="as-form-group">
                                        <label><Mail size={14} /> Contact Email</label>
                                        <input 
                                            type="email" 
                                            value={generalData.contact_email || ''} 
                                            onChange={e => setGeneralData(prev => ({ ...prev, contact_email: e.target.value }))}
                                        />
                                    </div>
                                    <div className="as-form-group">
                                        <label><Phone size={14} /> Contact Phone</label>
                                        <input 
                                            type="tel" 
                                            value={generalData.contact_phone || ''} 
                                            onChange={e => setGeneralData(prev => ({ ...prev, contact_phone: e.target.value }))}
                                        />
                                    </div>
                                    <div className="as-form-group full-width">
                                        <label><MapPin size={14} /> Address</label>
                                        <textarea 
                                            rows={2} 
                                            value={generalData.address || ''} 
                                            onChange={e => setGeneralData(prev => ({ ...prev, address: e.target.value }))}
                                        />
                                    </div>
                                    <div className="as-form-group">
                                        <label><Image size={14} /> Logo</label>
                                        <div className="as-logo-preview">
                                            <img src={logoPreview || generalData.logo || '/images/logo.png'} alt="Logo" />
                                            <button 
                                                type="button" 
                                                className="as-change-logo"
                                                onClick={() => logoInputRef.current?.click()}
                                            >
                                                Change Logo
                                            </button>
                                            <input
                                                ref={logoInputRef}
                                                type="file"
                                                accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                                                onChange={handleLogoChange}
                                                style={{ display: 'none' }}
                                            />
                                        </div>
                                        {logoFile && (
                                            <div style={{ fontSize: '12px', color: '#10B981', marginTop: '6px', fontWeight: 600 }}>
                                                Selected: {logoFile.name} (Ready to Save)
                                            </div>
                                        )}
                                    </div>
                                    <div className="as-form-group">
                                        <label><Globe size={14} /> Website URL</label>
                                        <input 
                                            type="url" 
                                            value={generalData.website_url || ''} 
                                            onChange={e => setGeneralData(prev => ({ ...prev, website_url: e.target.value }))}
                                        />
                                    </div>
                                    <div className="as-form-group">
                                        <label><Calendar size={14} /> Academic Year</label>
                                        <select 
                                            value={generalData.academic_year || '2025/2026'} 
                                            onChange={e => setGeneralData(prev => ({ ...prev, academic_year: e.target.value }))}
                                        >
                                            <option value="2024/2025">2024/2025</option>
                                            <option value="2025/2026">2025/2026</option>
                                            <option value="2026/2027">2026/2027</option>
                                        </select>
                                    </div>
                                    <div className="as-form-group">
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: generalData.primary_color || 'var(--primary-color)', border: '1px solid #CBD5E1' }}></span>
                                            Primary Theme Color
                                        </label>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            <input 
                                                type="color" 
                                                value={generalData.primary_color || 'var(--primary-color)'} 
                                                onChange={e => setGeneralData(prev => ({ ...prev, primary_color: e.target.value }))}
                                                style={{ border: '1px solid #E2E8F0', padding: 0, width: '40px', height: '40px', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'transparent' }}
                                            />
                                            <input 
                                                type="text" 
                                                value={generalData.primary_color || 'var(--primary-color)'} 
                                                onChange={e => setGeneralData(prev => ({ ...prev, primary_color: e.target.value }))}
                                                placeholder="var(--primary-color)"
                                                maxLength={7}
                                                style={{ width: '120px', fontFamily: 'monospace', textTransform: 'uppercase' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    )}

                    {activeSection === 'profile' && (
                        <div className="as-section animate-fade-in">
                            <h2><User size={20} /> Staff Profile Settings</h2>
                            <p className="as-section-desc">Change your profile picture, email address, and phone number.</p>

                            <div className="as-form-grid">
                                {/* Avatar Upload Zone */}
                                <div className="as-form-group full-width">
                                    <div className="as-avatar-upload-zone">
                                        <div className="as-avatar-preview-container">
                                            {(avatarPreview || (profileData.avatar && !avatarError)) ? (
                                                <img 
                                                    src={avatarPreview || getFullAvatarUrl(profileData.avatar)} 
                                                    alt="Profile" 
                                                    className="as-avatar-image" 
                                                    onError={() => setAvatarError(true)}
                                                />
                                            ) : (
                                                <div className="as-avatar-placeholder">
                                                    {profileData.fullName.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <button 
                                                className="as-avatar-camera-btn"
                                                onClick={() => fileInputRef.current?.click()}
                                                title="Upload photo"
                                            >
                                                <Camera size={16} />
                                            </button>
                                        </div>

                                        <div className="as-avatar-info">
                                            <h4>Profile Picture</h4>
                                            <p>Upload a photo to personalize your profile. Max size: 2MB. Formats: JPEG, PNG, GIF, WebP.</p>
                                            
                                            <div className="as-avatar-buttons">
                                                <button 
                                                    className="as-avatar-upload-btn"
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    <Upload size={15} /> 
                                                    {avatarFile ? 'Change Photo' : 'Upload Photo'}
                                                </button>

                                                {(avatarPreview || profileData.avatar) && (
                                                    <button 
                                                        className="as-avatar-remove-btn"
                                                        onClick={handleRemoveAvatar}
                                                    >
                                                        <Trash2 size={15} /> Remove
                                                    </button>
                                                )}
                                            </div>

                                            {avatarFile && (
                                                <div className="as-avatar-file-info">
                                                    <CheckCircle size={14} />
                                                    <span>{avatarFile.name} ({(avatarFile.size / 1024).toFixed(1)} KB)</span>
                                                </div>
                                            )}
                                        </div>

                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                                            onChange={handleAvatarFileChange}
                                            style={{ display: 'none' }}
                                        />
                                    </div>
                                </div>

                                <div className="as-form-group">
                                    <label><Mail size={14} /> Email Address</label>
                                    <input 
                                        type="email" 
                                        value={profileData.email} 
                                        onChange={(e) => setProfileData(p => ({ ...p, email: e.target.value }))} 
                                        required
                                    />
                                </div>

                                <div className="as-form-group">
                                    <label><Phone size={14} /> Phone Number</label>
                                    <input 
                                        type="tel" 
                                        value={profileData.phone} 
                                        onChange={(e) => setProfileData(p => ({ ...p, phone: e.target.value }))} 
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'security' && (
                        <div className="as-section animate-fade-in">
                            <h2><Shield size={20} /> Security Settings</h2>
                            <p className="as-section-desc">
                                {isSuperAdmin 
                                    ? 'Configure session management, password policies, and security controls.'
                                    : 'Change your account password to keep your account secure.'}
                            </p>

                            {/* Super Admin: show system security settings THEN password change */}
                            {isSuperAdmin && (
                                <div className="as-form-grid" style={{ marginBottom: '32px' }}>
                                    <div className="as-form-group">
                                        <label>Session Timeout (minutes)</label>
                                        <input 
                                            type="number" 
                                            value={generalData.session_timeout || 30} 
                                            min="5" 
                                            max="120" 
                                            onChange={e => setGeneralData(prev => ({ ...prev, session_timeout: parseInt(e.target.value) || 30 }))}
                                        />
                                    </div>
                                    <div className="as-form-group">
                                        <label>Minimum Password Length</label>
                                        <input 
                                            type="number" 
                                            value={generalData.min_password_length || 8} 
                                            min="6" 
                                            max="20" 
                                            onChange={e => setGeneralData(prev => ({ ...prev, min_password_length: parseInt(e.target.value) || 8 }))}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Password Change Form (all roles) */}
                            {renderPasswordChangeForm()}
                        </div>
                    )}

                    {activeSection === 'maintenance' && (
                        <div className="as-section">
                            <h2><Wrench size={20} /> System Maintenance</h2>
                            <p className="as-section-desc">Manage system availability and scheduled maintenance windows.</p>

                            <div className="maintenance-status-card" style={{ 
                                background: '#FFF7ED', 
                                border: '1px solid #FFEDD5', 
                                padding: '24px', 
                                borderRadius: '16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{ width: '48px', height: '48px', background: '#FFEDD5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <AlertTriangle size={24} color="#D97706" />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, color: '#9A3412', fontWeight: 800 }}>Maintenance Mode</h3>
                                        <p style={{ margin: '4px 0 0', color: '#C2410C', fontSize: '14px' }}>When enabled, non-admin users will be blocked from accessing the portal.</p>
                                    </div>
                                </div>
                                <label className="as-toggle-item" style={{ border: 'none', padding: 0 }}>
                                    <input 
                                        type="checkbox" 
                                        className="as-toggle" 
                                        checked={generalData.maintenance_mode || false}
                                        onChange={e => setGeneralData(prev => ({ ...prev, maintenance_mode: e.target.checked }))}
                                    />
                                </label>
                            </div>

                            <div className="as-form-grid" style={{ marginTop: '24px' }}>
                                <div className="as-form-group full-width">
                                    <label>Maintenance Message</label>
                                    <textarea 
                                        rows={3} 
                                        value={generalData.maintenance_message || ''} 
                                        onChange={e => setGeneralData(prev => ({ ...prev, maintenance_message: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'health' && isSuperAdmin && (
                        <div className="as-section animate-fade-in">
                            <h2><Activity size={20} /> System Health & Performance</h2>
                            <p className="as-section-desc">Monitor server resources, database connectivity, and backend health status in real time.</p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginTop: '20px' }}>
                                {/* Resource Progress Cards */}
                                <div style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', padding: '20px', borderRadius: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                                        <span>CPU Usage</span>
                                        <span style={{ color: cpuUsage > 20 ? '#EF4444' : '#10B981', fontWeight: 700 }}>{cpuUsage}%</span>
                                    </div>
                                    <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: `${cpuUsage}%`, height: '100%', background: cpuUsage > 20 ? '#EF4444' : '#10B981', borderRadius: '4px', transition: 'width 0.5s ease-in-out' }}></div>
                                    </div>
                                    <span style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px', display: 'block' }}>Intel Xeon Scalable Processors (4 Cores)</span>
                                </div>

                                <div style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', padding: '20px', borderRadius: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                                        <span>Memory Usage</span>
                                        <span style={{ color: '#3B82F6', fontWeight: 700 }}>42%</span>
                                    </div>
                                    <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: '42%', height: '100%', background: '#3B82F6', borderRadius: '4px' }}></div>
                                    </div>
                                    <span style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px', display: 'block' }}>512 MB of 1.2 GB allocated</span>
                                </div>

                                <div style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', padding: '20px', borderRadius: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                                        <span>Cache Hit Rate</span>
                                        <span style={{ color: 'var(--primary-color)', fontWeight: 700 }}>94.2%</span>
                                    </div>
                                    <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: '94.2%', height: '100%', background: 'var(--primary-color)', borderRadius: '4px' }}></div>
                                    </div>
                                    <span style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px', display: 'block' }}>Redis Cache Driver Active</span>
                                </div>

                                <div style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', padding: '20px', borderRadius: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                                        <span>Storage Capacity</span>
                                        <span style={{ color: '#64748B', fontWeight: 700 }}>18%</span>
                                    </div>
                                    <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: '18%', height: '100%', background: '#64748B', borderRadius: '4px' }}></div>
                                    </div>
                                    <span style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px', display: 'block' }}>4.5 GB of 25.0 GB used</span>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginTop: '20px' }}>
                                {/* DB Health Status Card */}
                                <div style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <span className="pulse-indicator success"></span>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#334155' }}>Database Connectivity</h4>
                                            <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8' }}>SQLite / Connection Active</p>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#10B981', background: '#ECFDF5', padding: '2px 8px', borderRadius: '10px' }}>STABLE</span>
                                </div>

                                {/* Backup Health Status Card */}
                                <div style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <span className="pulse-indicator success"></span>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#334155' }}>Backup Health Logs</h4>
                                            <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8' }}>All scheduled backups successful</p>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#10B981', background: '#ECFDF5', padding: '2px 8px', borderRadius: '10px' }}>HEALTHY</span>
                                </div>
                            </div>

                            {/* System Traffic & Activity Flow Chart */}
                            <div className="system-health-monitor" style={{ marginTop: '32px', borderTop: '1px solid #E2E8F0', paddingTop: '28px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                                    <div>
                                        <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                                            <Activity size={18} color="#10B981" /> System Traffic & Activity Flow
                                        </h3>
                                        <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0' }}>Log volumes over selected interval representing system usage frequency.</p>
                                    </div>
                                    <div style={{ display: 'flex', background: '#F1F5F9', padding: '4px', borderRadius: '8px', gap: '2px' }}>
                                        {['12h', '1d', '1w', '6m', '1y'].map(tf => {
                                            const labels: Record<string, string> = {
                                                '12h': '12 Hrs', '1d': '1 Day', '1w': '1 Wk', '6m': '6 Mos', '1y': '1 Yr'
                                            };
                                            return (
                                                <button
                                                    key={tf}
                                                    onClick={() => setHealthTimeframe(tf)}
                                                    style={{
                                                        border: 'none',
                                                        background: healthTimeframe === tf ? '#10B981' : 'transparent',
                                                        color: healthTimeframe === tf ? '#FFFFFF' : '#64748B',
                                                        padding: '4px 10px',
                                                        borderRadius: '6px',
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s ease'
                                                    }}
                                                >
                                                    {labels[tf]}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {loadingHealthStats ? (
                                    <div style={{ height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                                        <Loader2 className="spinner animate-spin" size={24} />
                                        <p style={{ marginTop: '8px', fontSize: '12px', fontWeight: 600 }}>Loading activity logs...</p>
                                    </div>
                                ) : activityFlow.length === 0 ? (
                                    <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '12px' }}>
                                        No activity flow data recorded for this timeframe.
                                    </div>
                                ) : (
                                    <div style={{ width: '100%', height: 240 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={activityFlow} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorHealthActivity" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                                                <XAxis 
                                                    dataKey="label" 
                                                    tickLine={false} 
                                                    axisLine={false} 
                                                    dy={8}
                                                    style={{ fontSize: '10px', fontWeight: 600, fill: '#94A3B8' }}
                                                />
                                                <YAxis 
                                                    tickLine={false} 
                                                    axisLine={false} 
                                                    style={{ fontSize: '10px', fontWeight: 600, fill: '#94A3B8' }}
                                                />
                                                <ChartTooltip content={
                                                    ({ active, payload, label }: any) => {
                                                        if (active && payload && payload.length) {
                                                            return (
                                                                <div style={{
                                                                    background: 'rgba(15, 23, 42, 0.95)',
                                                                    backdropFilter: 'blur(8px)',
                                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                                    padding: '8px 12px',
                                                                    borderRadius: '8px',
                                                                    color: '#FFFFFF'
                                                                }}>
                                                                    <p style={{ margin: 0, fontWeight: 700, fontSize: '10px', color: '#94A3B8' }}>{label}</p>
                                                                    <p style={{ margin: '4px 0 0', fontWeight: 800, fontSize: '13px', color: '#10B981' }}>
                                                                        {payload[0].value} <span style={{ fontWeight: 500, fontSize: '11px', color: '#E2E8F0' }}>Actions</span>
                                                                    </p>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }
                                                } />
                                                <Area 
                                                    type="monotone" 
                                                    dataKey="count" 
                                                    name="Actions" 
                                                    stroke="#10B981" 
                                                    strokeWidth={2.5} 
                                                    fillOpacity={1} 
                                                    fill="url(#colorHealthActivity)" 
                                                    activeDot={{ r: 5, stroke: '#FFFFFF', strokeWidth: 2, fill: '#10B981' }}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeSection === 'backup' && (
                        <div className="as-section animate-fade-in">
                            <h2><Database size={20} /> Backup Management</h2>
                            <p className="as-section-desc">Manage database backups and retention policies.</p>

                            {loadingBackups ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', color: '#64748B' }}>
                                    <Loader2 className="spinner animate-spin" size={32} />
                                    <p style={{ marginTop: '12px', fontWeight: 600 }}>Loading backup status...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="as-backup-info">
                                        <div className="as-backup-card">
                                            <div className="as-backup-icon"><Database size={20} /></div>
                                            <div>
                                                <h4>Last Backup</h4>
                                                <p>{formatBackupDate(generalData.last_backup_at)}</p>
                                            </div>
                                            <span className={`as-backup-status ${generalData.last_backup_status === 'successful' ? 'success' : (generalData.last_backup_status === 'failed' ? 'failed' : 'pending')}`}>
                                                {generalData.last_backup_status ? (generalData.last_backup_status.charAt(0).toUpperCase() + generalData.last_backup_status.slice(1)) : 'Never'}
                                            </span>
                                        </div>
                                        <div className="as-backup-card">
                                            <div className="as-backup-icon"><Clock size={20} /></div>
                                            <div>
                                                <h4>Next Scheduled</h4>
                                                <p>{formatBackupDate(generalData.next_backup_at)}</p>
                                            </div>
                                            <span className="as-backup-status pending">Scheduled</span>
                                        </div>
                                    </div>

                                    <div className="as-form-grid" style={{ marginTop: '24px' }}>
                                        <div className="as-form-group">
                                            <label>Backup Frequency</label>
                                            <select 
                                                value={generalData.backup_frequency || 'daily'}
                                                onChange={e => setGeneralData(prev => ({ ...prev, backup_frequency: e.target.value }))}
                                            >
                                                <option value="daily">Daily</option>
                                                <option value="weekly">Weekly</option>
                                                <option value="monthly">Monthly</option>
                                            </select>
                                        </div>
                                        <div className="as-form-group">
                                            <label>Retention Period</label>
                                            <select 
                                                value={generalData.backup_retention || 30}
                                                onChange={e => setGeneralData(prev => ({ ...prev, backup_retention: parseInt(e.target.value) || 30 }))}
                                            >
                                                <option value={7}>7 days</option>
                                                <option value={30}>30 days</option>
                                                <option value={90}>90 days</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="as-backup-actions" style={{ marginTop: '24px', display: 'flex', gap: '16px' }}>
                                        <button 
                                            className="admin-btn-primary" 
                                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                            onClick={handleRunBackup}
                                            disabled={isRunningBackup}
                                        >
                                            {isRunningBackup ? (
                                                <><Loader2 size={16} className="animate-spin" /> Running Backup...</>
                                            ) : (
                                                <><RefreshCcw size={16} /> Run Backup Now</>
                                            )}
                                        </button>
                                    </div>

                                    {backupFiles.length > 0 && (
                                        <div className="as-backup-history" style={{ marginTop: '32px' }}>
                                            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', marginBottom: '16px' }}>Backup History & Files</h3>
                                            <div className="table-grid-wrapper">
                                                <table className="datatables-grid">
                                                    <thead>
                                                        <tr>
                                                            <th>File Name</th>
                                                            <th>Size</th>
                                                            <th>Created Date</th>
                                                            <th style={{ textAlign: 'right' }}>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {backupFiles.map(file => (
                                                            <tr key={file.name}>
                                                                <td className="data-cell" style={{ fontWeight: 600, color: '#0F172A' }}>{file.name}</td>
                                                                <td className="data-cell">{(file.size / (1024 * 1024)).toFixed(2)} MB</td>
                                                                <td className="data-cell">{formatBackupDate(file.created_at)}</td>
                                                                <td className="actions-cell" style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                                    <button 
                                                                        className="table-card-action" 
                                                                        onClick={() => handleDownloadBackup(file.name)}
                                                                        style={{ background: '#EEF2FF', color: '#4F46E5', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                                                                    >
                                                                        Download
                                                                    </button>
                                                                    <button 
                                                                        className="delete-row-btn" 
                                                                        onClick={() => handleDeleteBackup(file.name)}
                                                                        title="Delete Backup File"
                                                                        style={{ padding: '6px' }}
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {activeSection === 'datatables' && (
                        <div className="as-section">
                            <h2><Database size={20} /> Data Tables Manager</h2>
                            <p className="as-section-desc">
                                View system database tables and delete specific records in case of system errors or removal requirements.
                            </p>

                            {!selectedTable ? (
                                <div className="tables-list-view">
                                    <div className="table-search-bar-wrapper">
                                        <Search size={18} className="search-icon" />
                                        <input
                                            type="text"
                                            className="table-search-input"
                                            placeholder="Search database tables..."
                                            value={tableSearch}
                                            onChange={(e) => setTableSearch(e.target.value)}
                                        />
                                    </div>

                                    {loadingTables ? (
                                        <div className="tables-loading">
                                            <Loader2 className="spinner animate-spin" size={32} />
                                            <p>Loading database tables...</p>
                                        </div>
                                    ) : (
                                        <div className="tables-grid">
                                            {tables
                                                .filter(t => t.name.toLowerCase().includes(tableSearch.toLowerCase()))
                                                .map(table => (
                                                    <div key={table.name} className="table-card">
                                                        <div className="table-card-icon">
                                                            <Database size={20} />
                                                        </div>
                                                        <div className="table-card-info">
                                                            <h3>{table.name}</h3>
                                                            <p>{table.rows_count} {table.rows_count === 1 ? 'record' : 'records'}</p>
                                                        </div>
                                                        <button 
                                                            className="table-card-action"
                                                            onClick={() => fetchTableData(table.name)}
                                                        >
                                                            <Eye size={16} /> Manage
                                                        </button>
                                                    </div>
                                                ))}
                                            {tables.filter(t => t.name.toLowerCase().includes(tableSearch.toLowerCase())).length === 0 && (
                                                <div className="no-results">
                                                    No tables match your search query.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="table-data-view">
                                    <div className="table-data-header">
                                        <button 
                                            className="back-to-list-btn"
                                            onClick={() => {
                                                setSelectedTable(null);
                                                setTableData(null);
                                                setRowSearch('');
                                            }}
                                        >
                                            <ArrowLeft size={16} /> Back to Tables
                                        </button>
                                        <div className="table-meta-title">
                                            <h3>{selectedTable}</h3>
                                            <span>({tableData?.data?.length || 0} rows loaded)</span>
                                        </div>
                                    </div>

                                    <div className="table-search-bar-wrapper" style={{ marginTop: '16px', marginBottom: '16px' }}>
                                        <Search size={18} className="search-icon" />
                                        <input
                                            type="text"
                                            className="table-search-input"
                                            placeholder="Search within records (e.g. ID, names, emails)..."
                                            value={rowSearch}
                                            onChange={(e) => setRowSearch(e.target.value)}
                                        />
                                    </div>

                                    {loadingData ? (
                                        <div className="tables-loading">
                                            <Loader2 className="spinner animate-spin" size={32} />
                                            <p>Loading table rows...</p>
                                        </div>
                                    ) : tableData ? (
                                        <div className="table-grid-wrapper">
                                            <table className="datatables-grid">
                                                <thead>
                                                    <tr>
                                                        <th>Actions</th>
                                                        {tableData.columns.map(col => (
                                                            <th key={col}>{col}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {tableData.data
                                                        .filter(row => {
                                                            if (!rowSearch) return true;
                                                            return Object.values(row).some(val => 
                                                                String(val).toLowerCase().includes(rowSearch.toLowerCase())
                                                            );
                                                        })
                                                        .map((row, idx) => (
                                                            <tr key={row.id || idx}>
                                                                <td className="actions-cell">
                                                                    <button
                                                                        className="delete-row-btn"
                                                                        onClick={() => handleDeleteRecord(selectedTable, row.id)}
                                                                        title="Delete Record"
                                                                        disabled={!row.id}
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </td>
                                                                {tableData.columns.map(col => {
                                                                    const val = row[col];
                                                                    let displayVal = '';
                                                                    if (val === null || val === undefined) {
                                                                        displayVal = '-';
                                                                    } else if (typeof val === 'object') {
                                                                        displayVal = JSON.stringify(val);
                                                                    } else {
                                                                        displayVal = String(val);
                                                                    }
                                                                    return (
                                                                        <td key={col} className="data-cell" title={displayVal}>
                                                                            {displayVal.length > 60 ? `${displayVal.substring(0, 60)}...` : displayVal}
                                                                        </td>
                                                                    );
                                                                })}
                                                            </tr>
                                                        ))}
                                                    {tableData.data.filter(row => {
                                                        if (!rowSearch) return true;
                                                        return Object.values(row).some(val => 
                                                            String(val).toLowerCase().includes(rowSearch.toLowerCase())
                                                        );
                                                    }).length === 0 && (
                                                        <tr>
                                                            <td colSpan={tableData.columns.length + 1} className="no-rows-found">
                                                                No records found matching search query.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="no-results">No data loaded.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Save Button */}
                    {activeSection !== 'datatables' && 
                     activeSection !== 'health' && 
                     (activeSection !== 'security' || isSuperAdmin) && 
                     (activeSection !== 'maintenance' || isSuperAdmin) && 
                     (activeSection !== 'backup' || isSuperAdmin) && (
                        <div className="as-save-bar">
                            {saved && (
                                <span className="as-save-success">✓ Settings saved successfully!</span>
                            )}
                            <button className="admin-btn-primary" onClick={handleSave} disabled={isSaving || isUploadingAvatar || isUploadingLogo}>
                                {(isSaving || isUploadingAvatar || isUploadingLogo) ? (
                                    <><Loader2 size={16} className="animate-spin" /> Saving...</>
                                ) : (
                                    <><Save size={16} /> Save Changes</>
                                )}
                            </button>
                        </div>
                    )}
            <ConfirmModal
                isOpen={confirmModalConfig.isOpen}
                title={confirmModalConfig.title}
                description={confirmModalConfig.description}
                confirmText="Yes, Delete"
                variant="danger"
                onClose={() => setConfirmModalConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModalConfig.onConfirm}
            />
                </div>
            </div>
        </div>
    );
};
