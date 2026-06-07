import React, { useState } from 'react';
import { Lock, Globe, Shield, CheckCircle2 } from 'lucide-react';
import { DashboardHeader } from './DashboardHeader';
import { toast } from '../../utils/toast';
import { userService } from '../../services/apiService';
import './Settings.css';

export const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState('general');



    // Password state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [settingsSuccess, setSettingsSuccess] = useState(false);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("New passwords do not match.");
            return;
        }

        if (passwordData.newPassword.length < 8) {
            toast.error("New password must be at least 8 characters.");
            return;
        }

        try {
            await userService.changePassword({
                current_password: passwordData.currentPassword,
                password: passwordData.newPassword,
                password_confirmation: passwordData.confirmPassword
            });
            
            setPasswordSuccess(true);
            setTimeout(() => setPasswordSuccess(false), 4000);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            toast.success("Password changed successfully!");
        } catch (err: any) {
            console.error("Failed to change password:", err);
            toast.error(err.response?.data?.message || "Failed to update password. Please check your current password.");
        }
    };



    const saveGeneralSettings = () => {
        setSettingsSuccess(true);
        setTimeout(() => setSettingsSuccess(false), 3000);
    };

    return (
        <div className="settings-container">
            <div className="settings-header-wrapper">
                <DashboardHeader title="Account Settings" />
            </div>

            <div className="settings-layout">
                {/* Settings Sidebar */}
                <div className="settings-sidebar">
                    <button
                        className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
                        onClick={() => setActiveTab('general')}
                    >
                        <Globe size={15} />
                        <span>General Preferences</span>
                    </button>

                    <button
                        className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
                        onClick={() => setActiveTab('security')}
                    >
                        <Lock size={15} />
                        <span>Security & Password</span>
                    </button>
                    
                    <button
                        className={`settings-tab ${activeTab === 'privacy' ? 'active' : ''}`}
                        onClick={() => setActiveTab('privacy')}
                    >
                        <Shield size={15} />
                        <span>Privacy</span>
                    </button>
                </div>

                {/* Settings Content */}
                <div className="settings-content">
                    {activeTab === 'security' && (
                        <div className="settings-panel">
                            <h2 className="panel-title"><Lock size={18} /> Change Password</h2>
                            <p className="panel-description">Ensure your account is using a long, random password to stay secure.</p>

                            {passwordSuccess && (
                                <div className="success-alert">
                                    <CheckCircle2 size={16} /> Password updated successfully!
                                </div>
                            )}

                            <form className="settings-form" onSubmit={handlePasswordChange}>
                                <div className="form-group full-width">
                                    <label>Current Password</label>
                                    <input
                                        type="password"
                                        className="settings-input"
                                        placeholder="Enter current password"
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-divider"></div>

                                <div className="settings-form-grid">
                                    <div className="form-group">
                                        <label>New Password</label>
                                        <input
                                            type="password"
                                            className="settings-input"
                                            placeholder="Min. 8 characters"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            required
                                        />
                                        <span className="input-hint">Minimum 8 characters.</span>
                                    </div>
                                    <div className="form-group">
                                        <label>Confirm New Password</label>
                                        <input
                                            type="password"
                                            className="settings-input"
                                            placeholder="Confirm new password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button type="submit" className="btn-save">
                                        Update Password
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'general' && (
                        <div className="settings-panel">
                            <h2 className="panel-title"><Globe size={18} /> General Preferences</h2>
                            <p className="panel-description">Manage your regional and display settings.</p>

                            {settingsSuccess && (
                                <div className="success-alert">
                                    <CheckCircle2 size={16} /> Settings saved successfully!
                                </div>
                            )}

                            <div className="settings-form">
                                <div className="settings-form-grid">
                                    <div className="form-group">
                                        <label>Language</label>
                                        <select className="settings-input">
                                            <option value="en">English</option>
                                            <option value="si">Sinhala</option>
                                            <option value="ta">Tamil</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Timezone</label>
                                        <select className="settings-input" defaultValue="Asia/Colombo">
                                            <option value="Asia/Colombo">(GMT+05:30) Sri Jayawardenepura</option>
                                            <option value="Asia/Kolkata">(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group full-width">
                                    <label>Theme</label>
                                    <div className="theme-info-box">
                                        Your theme automatically matches your device's system settings (Light/Dark mode) for the best viewing experience.
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button type="button" className="btn-save" onClick={saveGeneralSettings}>
                                        Save Settings
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'privacy' && (
                        <div className="settings-panel">
                            <h2 className="panel-title"><Shield size={18} /> Data & Privacy</h2>
                            <p className="panel-description">Manage how your data is used across the portal.</p>

                            <div className="info-alert">
                                Your personal and educational data are strictly used for university administrative purposes as per the University Grants Commission guidelines.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
