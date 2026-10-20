import React, { useState, useEffect, useRef } from 'react';
import { 
    Megaphone, Plus, Trash2, Calendar, Bell, MessageSquare, 
    Info, Sparkles, Paperclip, FileText, Download, X, 
    UploadCloud, Globe, BookOpen, Filter, AlertCircle
} from 'lucide-react';
import { announcementService, courseService } from '../../services/apiService';
import { getCurrentAdminUser } from '../../data/mockAdminData';
import './AdminAnnouncements.css';

interface Announcement {
    id: string;
    title: string;
    desc: string;
    type: 'Important' | 'Update' | 'General' | 'Notice';
    date: string;
    attachment_url?: string | null;
    attachment_name?: string | null;
    attachment_size?: string | null;
    course_id?: number | null;
    batch?: string | null;
    course_title?: string | null;
    course_code?: string | null;
}

export const AdminAnnouncements: React.FC = () => {
    const currentUser = getCurrentAdminUser();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [showPublishForm, setShowPublishForm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form fields
    const [annTitle, setAnnTitle] = useState('');
    const [annType, setAnnType] = useState<'Important' | 'Update' | 'General' | 'Notice'>('General');
    const [annDesc, setAnnDesc] = useState('');
    const [targetScope, setTargetScope] = useState<'global' | 'course'>('global');
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [selectedBatch, setSelectedBatch] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Filtering
    const [filterScope, setFilterScope] = useState<'all' | 'global' | 'course'>('all');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [annData, courseData] = await Promise.all([
                announcementService.getAll(),
                courseService.getAll().catch(() => [])
            ]);

            setCourses(courseData || []);

            const courseMap = new Map();
            (courseData || []).forEach((c: any) => {
                courseMap.set(c.id, { title: c.title, code: c.code });
            });

            const formatted = (annData || []).map((ann: any) => {
                const cInfo = ann.course_id ? courseMap.get(ann.course_id) : null;
                return {
                    id: String(ann.id),
                    title: ann.title,
                    desc: ann.desc,
                    type: ann.type || 'General',
                    date: new Date(ann.created_at || new Date()).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    }),
                    attachment_url: ann.attachment_url,
                    attachment_name: ann.attachment_name,
                    attachment_size: ann.attachment_size,
                    course_id: ann.course_id,
                    batch: ann.batch,
                    course_title: cInfo?.title || (ann.course ? ann.course.title : null),
                    course_code: cInfo?.code || (ann.course ? ann.course.code : null)
                };
            });
            setAnnouncements(formatted);
        } catch (err) {
            console.error("Failed to load announcements data:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            validateAndSetFile(file);
        }
    };

    const validateAndSetFile = (file: File) => {
        setFileError(null);
        const maxSize = 20 * 1024 * 1024; // 20 MB
        if (file.size > maxSize) {
            setFileError('File size exceeds maximum allowed limit (20MB)');
            return;
        }
        setSelectedFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            validateAndSetFile(file);
        }
    };

    const handlePublish = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!annTitle.trim() || !annDesc.trim()) return;

        if (targetScope === 'course' && !selectedCourseId) {
            setFileError('Please select a course for course-specific announcements.');
            return;
        }

        setIsSubmitting(true);
        try {
            await announcementService.create({
                title: annTitle,
                desc: annDesc,
                type: annType,
                course_id: targetScope === 'course' && selectedCourseId ? Number(selectedCourseId) : null,
                batch: targetScope === 'course' && selectedBatch ? selectedBatch : null,
                file: selectedFile
            });

            setToastMessage(
                targetScope === 'global' 
                    ? 'Global announcement broadcasted successfully!' 
                    : 'Course announcement published successfully!'
            );
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 3500);

            // Reset form
            setAnnTitle('');
            setAnnDesc('');
            setSelectedFile(null);
            setFileError(null);
            setSelectedCourseId('');
            setSelectedBatch('');
            setTargetScope('global');
            setShowPublishForm(false);

            await loadData();
        } catch (err) {
            console.error("Failed to publish announcement:", err);
            setFileError('Failed to publish announcement. Please try again.');
        } finally {
            setIsSubmitting(false);
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
        if (type === 'Notice') return '#6366F1';
        return '#10B981';
    };

    const getIcon = (type: string) => {
        if (type === 'Important') return <Bell size={16} />;
        if (type === 'Update') return <MessageSquare size={16} />;
        if (type === 'Notice') return <AlertCircle size={16} />;
        return <Info size={16} />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const selectedCourseObj = courses.find(c => String(c.id) === String(selectedCourseId));
    const availableBatches: string[] = selectedCourseObj?.batches?.map((b: any) => b.name) || [];

    const filteredAnnouncements = announcements.filter(ann => {
        if (filterScope === 'global') return !ann.course_id;
        if (filterScope === 'course') return !!ann.course_id;
        return true;
    });

    return (
        <div className="admin-announcements-container">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Announcements & Notices</h1>
                    <p className="admin-page-subtitle">
                        Publish global announcements for student dashboards or course-specific notices with PDF documents.
                    </p>
                </div>
                <div className="admin-header-actions">
                    <button 
                        className="admin-btn-primary" 
                        onClick={() => setShowPublishForm(!showPublishForm)}
                    >
                        <Plus size={16} /> {showPublishForm ? 'Close Editor' : 'Compose Notice'}
                    </button>
                </div>
            </div>

            {showSuccessToast && (
                <div className="admin-success-toast">
                    <Megaphone size={18} />
                    <span>{toastMessage}</span>
                </div>
            )}

            {showPublishForm && (
                <div className="publish-form-card">
                    <div className="form-card-header">
                        <Sparkles size={18} className="sparkle-icon" />
                        <h2>Compose Student Broadcast</h2>
                    </div>
                    <form onSubmit={handlePublish} className="ann-editor-form">
                        
                        {/* Target Scope Selection */}
                        <div className="form-group full-width">
                            <label>Target Audience</label>
                            <div className="scope-selector-container">
                                <button
                                    type="button"
                                    className={`scope-pill ${targetScope === 'global' ? 'active' : ''}`}
                                    onClick={() => setTargetScope('global')}
                                >
                                    <Globe size={16} />
                                    <div className="scope-pill-text">
                                        <strong>Global Broadcast</strong>
                                        <span>Display to all registered students on their main dashboard</span>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    className={`scope-pill ${targetScope === 'course' ? 'active' : ''}`}
                                    onClick={() => setTargetScope('course')}
                                >
                                    <BookOpen size={16} />
                                    <div className="scope-pill-text">
                                        <strong>Course Specific Notice</strong>
                                        <span>Target students enrolled in a specific degree or batch</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* If Course scope chosen, show course & batch picker */}
                        {targetScope === 'course' && (
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Select Target Course <span style={{ color: '#EF4444' }}>*</span></label>
                                    <select
                                        value={selectedCourseId}
                                        onChange={(e) => {
                                            setSelectedCourseId(e.target.value);
                                            setSelectedBatch('');
                                        }}
                                        required
                                    >
                                        <option value="">-- Choose a Course --</option>
                                        {courses.map(course => (
                                            <option key={course.id} value={course.id}>
                                                {course.code} - {course.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Target Batch (Optional)</label>
                                    <select
                                        value={selectedBatch}
                                        onChange={(e) => setSelectedBatch(e.target.value)}
                                    >
                                        <option value="">All Batches in this Course</option>
                                        {availableBatches.map(batchName => (
                                            <option key={batchName} value={batchName}>
                                                {batchName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

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
                            <label>Announcement Headline / Title <span style={{ color: '#EF4444' }}>*</span></label>
                            <input
                                type="text"
                                placeholder="Enter headline (e.g. Semester 2 Examination Schedule Released)"
                                value={annTitle}
                                onChange={(e) => setAnnTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group full-width">
                            <label>Detailed Announcement Content <span style={{ color: '#EF4444' }}>*</span></label>
                            <textarea
                                rows={4}
                                placeholder="Write the complete announcement text, instructions, or timetable details..."
                                value={annDesc}
                                onChange={(e) => setAnnDesc(e.target.value)}
                                required
                            ></textarea>
                        </div>

                        {/* File / Document Attachment Upload */}
                        <div className="form-group full-width">
                            <label>Attach PDF or Document (Optional)</label>
                            
                            {!selectedFile ? (
                                <div 
                                    className={`file-dropzone ${isDragging ? 'dragover' : ''}`}
                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        style={{ display: 'none' }} 
                                        onChange={handleFileChange}
                                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg"
                                    />
                                    <div className="dropzone-inner">
                                        <div className="dropzone-icon-circle">
                                            <UploadCloud size={24} />
                                        </div>
                                        <div className="dropzone-text">
                                            <p className="primary-text">Click to browse or drag & drop document here</p>
                                            <p className="sub-text">Supported formats: PDF, DOC, DOCX, PPTX, XLS, Images (Max 20MB)</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="selected-attachment-preview">
                                    <div className="attachment-file-info">
                                        <div className="file-badge-icon">
                                            <FileText size={22} />
                                        </div>
                                        <div className="file-names-box">
                                            <strong className="file-name">{selectedFile.name}</strong>
                                            <span className="file-size">{formatFileSize(selectedFile.size)}</span>
                                        </div>
                                    </div>
                                    <button 
                                        type="button" 
                                        className="remove-file-btn"
                                        onClick={() => {
                                            setSelectedFile(null);
                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                        }}
                                        title="Remove file"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            )}

                            {fileError && (
                                <span className="attachment-error-msg">{fileError}</span>
                            )}
                        </div>

                        <div className="form-actions-row">
                            <button 
                                type="button" 
                                className="btn-cancel" 
                                onClick={() => setShowPublishForm(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="btn-submit-publish"
                                disabled={isSubmitting}
                            >
                                <Megaphone size={16} /> 
                                {isSubmitting ? 'Publishing...' : 'Publish Announcement'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filter Bar */}
            <div className="list-filters-bar">
                <div className="filter-group">
                    <Filter size={16} className="filter-icon" />
                    <label>Audience Filter:</label>
                    <select 
                        value={filterScope} 
                        onChange={(e) => setFilterScope(e.target.value as any)}
                    >
                        <option value="all">All Announcements ({announcements.length})</option>
                        <option value="global">Global Broadcasts Only ({announcements.filter(a => !a.course_id).length})</option>
                        <option value="course">Course Specific Notices ({announcements.filter(a => !!a.course_id).length})</option>
                    </select>
                </div>
                <span className="ann-stats-text">
                    Showing {filteredAnnouncements.length} announcement{filteredAnnouncements.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Announcements Grid */}
            <div className="announcements-dashboard-section" style={{ marginTop: '8px' }}>
                {filteredAnnouncements.length > 0 ? (
                    <div className="admin-announcements-grid">
                        {filteredAnnouncements.map((ann) => {
                            const iconColor = getIconColor(ann.type);
                            return (
                                <div className="admin-announcement-card" key={ann.id}>
                                    <div className="card-top-row">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            <span
                                                className="badge-tag"
                                                style={{ color: iconColor, backgroundColor: `${iconColor}15` }}
                                            >
                                                {getIcon(ann.type)}
                                                <span style={{ marginLeft: '6px' }}>{ann.type}</span>
                                            </span>

                                            {ann.course_title ? (
                                                <span className="course-identifier-badge" title={ann.course_title}>
                                                    <BookOpen size={12} style={{ marginRight: '4px' }} />
                                                    {ann.course_code || 'Course'} {ann.batch ? `• ${ann.batch}` : ''}
                                                </span>
                                            ) : (
                                                <span className="global-identifier-badge">
                                                    <Globe size={12} style={{ marginRight: '4px' }} /> Global
                                                </span>
                                            )}
                                        </div>

                                        <button
                                            className="delete-ann-btn"
                                            onClick={() => {
                                                if (confirm('Are you sure you want to delete this announcement? This action is permanent.')) {
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
                                        <span className="card-publish-date">
                                            <Calendar size={13} style={{ marginRight: '4px' }} />
                                            {ann.date}
                                        </span>
                                        <p className="card-description">{ann.desc}</p>

                                        {/* Downloadable / Viewable Attachment */}
                                        {ann.attachment_url && (
                                            <div className="card-attached-document">
                                                <div className="doc-icon-box">
                                                    <FileText size={18} />
                                                </div>
                                                <div className="doc-info-text">
                                                    <strong className="doc-title" title={ann.attachment_name || 'Document'}>
                                                        {ann.attachment_name || 'Attached Document'}
                                                    </strong>
                                                    {ann.attachment_size && (
                                                        <span className="doc-size">{ann.attachment_size}</span>
                                                    )}
                                                </div>
                                                <a
                                                    href={ann.attachment_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn-download-attached"
                                                    title="Open or download document in new tab"
                                                >
                                                    <Download size={14} /> Open
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="admin-announcements-empty">
                        <Megaphone size={48} style={{ color: '#94A3B8' }} />
                        <h3>No Active Announcements</h3>
                        <p>There are no announcements currently matching the selected filter. Click "Compose Notice" to send a broadcast.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
