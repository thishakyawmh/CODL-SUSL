import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Trash2, Calendar, Bell, MessageSquare, Info, Sparkles } from 'lucide-react';
import { announcementService } from '../../services/apiService';
import './AdminAnnouncements.css';

interface Announcement {
    id: string;
    title: string;
    desc: string;
    type: 'Important' | 'Update' | 'General';
    date: string;
}

export const AdminAnnouncements: React.FC = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [showPublishForm, setShowPublishForm] = useState(false);


    const [annTitle, setAnnTitle] = useState('');
    const [annType, setAnnType] = useState<'Important' | 'Update' | 'General'>('General');
    const [annDesc, setAnnDesc] = useState('');
    const [showSuccessToast, setShowSuccessToast] = useState(false);


    const loadAnnouncements = async () => {
        try {
            const data = await announcementService.getAll();
            const globalOnly = data.filter((ann: any) => !ann.course_id).map((ann: any) => ({
                id: String(ann.id),
                title: ann.title,
                desc: ann.desc,
                type: ann.type || 'General',
                date: new Date(ann.created_at || new Date()).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                })
            }));
            setAnnouncements(globalOnly);
        } catch (err) {
            console.error("Failed to load global announcements:", err);
        }
    };

    useEffect(() => {
        loadAnnouncements();
    }, []);


    const handlePublish = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!annTitle.trim() || !annDesc.trim()) return;

        try {
            await announcementService.create({
                title: annTitle,
                desc: annDesc,
                type: annType,
                course_id: null,
                batch: null
            });


            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 3000);


            setAnnTitle('');
            setAnnDesc('');
            setShowPublishForm(false);


            loadAnnouncements();
        } catch (err) {
            console.error("Failed to publish announcement:", err);
        }
    };


    const handleDelete = async (annId: string) => {
        try {
            await announcementService.delete(annId);
            setAnnouncements(prev => prev.filter(a => a.id !== annId));
        } catch (err) {
            console.error("Failed to delete announcement:", err);
        }
    };

    const getIconColor = (type: string) => {
        if (type === 'Important') return '#EF4444';
        if (type === 'Update') return '#3B82F6';
        return '#10B981';
    };

    const getIcon = (type: string) => {
        if (type === 'Important') return <Bell size={16} />;
        if (type === 'Update') return <MessageSquare size={16} />;
        return <Info size={16} />;
    };

    return (
        <div className="admin-announcements-container">

            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Global Announcements</h1>
                    <p className="admin-page-subtitle">
                        Publish main announcements and updates shown to all registered CODL students on their dashboard slider.
                    </p>
                </div>
                <div className="admin-header-actions">
                    <button className="admin-btn-primary" onClick={() => setShowPublishForm(!showPublishForm)}>
                        <Plus size={16} /> {showPublishForm ? 'Close Editor' : 'Publish'}
                    </button>
                </div>
            </div>


            {showSuccessToast && (
                <div className="admin-success-toast">
                    <Megaphone size={18} />
                    <span>Announcement published globally to student dashboards!</span>
                </div>
            )}


            {showPublishForm && (
                <div className="publish-form-card">
                    <div className="form-card-header">
                        <Sparkles size={18} className="sparkle-icon" />
                        <h2>Compose Student Broadcast</h2>
                    </div>
                    <form onSubmit={handlePublish} className="ann-editor-form">
                        <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                            <div className="form-group">
                                <label>Announcement Category</label>
                                <div className="type-selector-pills">
                                    {[
                                        { type: 'Important', label: 'Important Notice', color: '#EF4444', icon: <Bell size={14} /> },
                                        { type: 'Update', label: 'General Update', color: '#3B82F6', icon: <MessageSquare size={14} /> },
                                        { type: 'General', label: 'Schedule / Info', color: '#10B981', icon: <Info size={14} /> }
                                    ].map(item => (
                                        <button
                                            key={item.type}
                                            type="button"
                                            className={`type-pill ${annType === item.type ? 'active' : ''}`}
                                            style={{
                                                '--active-color': item.color,
                                                borderColor: annType === item.type ? item.color : '#E2E8F0'
                                            } as React.CSSProperties}
                                            onClick={() => setAnnType(item.type as any)}
                                        >
                                            {item.icon}
                                            <span>{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="form-group full-width">
                            <label>Announcement Headline / Title</label>
                            <input
                                type="text"
                                placeholder="Enter headlines (e.g. Semester 2 Examination Schedule Released)"
                                value={annTitle}
                                onChange={(e) => setAnnTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group full-width">
                            <label>Detailed Announcement Content</label>
                            <textarea
                                rows={4}
                                placeholder="Write the complete announcement text or instructions..."
                                value={annDesc}
                                onChange={(e) => setAnnDesc(e.target.value)}
                                required
                            ></textarea>
                        </div>

                        <div className="form-actions-row">
                            <button type="button" className="btn-cancel" onClick={() => setShowPublishForm(false)}>
                                Cancel
                            </button>
                            <button type="submit" className="btn-submit-publish">
                                <Megaphone size={16} /> Publish
                            </button>
                        </div>
                    </form>
                </div>
            )}


            <div className="announcements-dashboard-section" style={{ marginTop: '8px' }}>
                {announcements.length > 0 ? (
                    <div className="admin-announcements-grid">
                        {announcements.map((ann) => {
                            const iconColor = getIconColor(ann.type);
                            return (
                                <div className="admin-announcement-card" key={ann.id}>
                                    <div className="card-top-row">
                                        <span
                                            className="badge-tag"
                                            style={{ color: iconColor, backgroundColor: `${iconColor}12` }}
                                        >
                                            {getIcon(ann.type)}
                                            <span style={{ marginLeft: '6px' }}>{ann.type}</span>
                                        </span>
                                        <button
                                            className="delete-ann-btn"
                                            onClick={() => {
                                                if (confirm('Are you sure you want to delete this announcement? This will remove it from all student portal dashboards.')) {
                                                    handleDelete(ann.id);
                                                }
                                            }}
                                            title="Delete Announcement"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="card-body-content">
                                        <h3 className="card-headline">{ann.title}</h3>
                                        <span className="card-publish-date" style={{ marginBottom: '8px' }}>
                                            <Calendar size={13} style={{ marginRight: '4px' }} />
                                            {ann.date}
                                        </span>
                                        <p className="card-description">{ann.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="admin-announcements-empty">
                        <Megaphone size={48} style={{ color: '#94A3B8' }} />
                        <h3>No Active Announcements</h3>
                        <p>There are no global announcements currently active. Click "Publish Announcement" to send a broadcast.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
