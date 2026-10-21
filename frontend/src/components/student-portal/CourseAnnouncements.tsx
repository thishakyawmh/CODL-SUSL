import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowLeft, Bell, MessageSquare, Info, FileText, Download } from 'lucide-react';
import { type Course } from './CourseDetails';
import { courseService, announcementService } from '../../services/apiService';
import './CourseAnnouncements.css';

export const CourseAnnouncements: React.FC = () => {
    const navigate = useNavigate();
    const { course } = useOutletContext<{ course: Course }>();
    const [announcements, setAnnouncements] = React.useState<any[]>([]);

    React.useEffect(() => {
        const fetchStudentBatchAndAnnouncements = async () => {
            let activeBatch = 'Batch 01';
            let activeGroup: string | null = null;
            try {
                const response = await courseService.getStudentCourses();
                const matched = response.find((c: any) => c.id.toString() === course.id.toString());
                if (matched) {
                    if (matched.pivot?.batch) {
                        activeBatch = matched.pivot.batch;
                    }
                    if (matched.pivot?.group) {
                        activeGroup = matched.pivot.group;
                    }
                }
            } catch (e) {
                console.error("Failed to fetch student batch for announcements:", e);
            }

            try {
                const data = await announcementService.getAll({ 
                    course_id: course.id, 
                    batch: activeBatch, 
                    group: activeGroup || undefined 
                });
                const processed = data.map((ann: any) => {
                    const annType = ann.type || 'Notice';
                    const iconColor = annType === 'Important' ? '#EF4444' : (annType === 'Update' ? '#10B981' : '#3B82F6');
                    const bgColor = annType === 'Important' ? '#FEF2F2' : (annType === 'Update' ? '#F0FDF4' : '#EFF6FF');
                    
                    return {
                        id: ann.id,
                        title: ann.title,
                        desc: ann.desc,
                        type: annType,
                        group: ann.group,
                        date: new Date(ann.created_at || new Date()).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        }),
                        icon: annType === 'Important' ? <Bell size={18} /> : (annType === 'Update' ? <MessageSquare size={18} /> : <Info size={18} />),
                        bgColor,
                        iconColor,
                        attachment_url: ann.attachment_url,
                        attachment_name: ann.attachment_name,
                        attachment_size: ann.attachment_size
                    };
                });
                setAnnouncements(processed);
            } catch (err) {
                console.error("Failed to load course announcements:", err);
            }
        };

        fetchStudentBatchAndAnnouncements();
    }, [course.id]);

    return (
        <div className="course-announcements-page">
            <button className="back-btn" onClick={() => navigate(`/course/${course.id}`)}>
                <ArrowLeft size={18} /> Back
            </button>

            <div className="announcements-page-header">
                <div>
                    <span className="course-code-badge">{course.title}</span>
                    <h1 className="announcements-page-title">Course Announcements</h1>
                    <p className="announcements-page-subtitle">
                        Stay updated with the latest news, notices, and semester schedules for
                    </p>
                </div>
            </div>

            <div className="announcements-list-wrapper">
                {announcements.length > 0 ? (
                    <div className="announcements-vertical-list">
                        {announcements.map((ann, idx) => (
                            <div className="announcement-page-card" key={idx}>
                                <div className="ann-card-icon-box" style={{ backgroundColor: ann.bgColor, color: ann.iconColor }}>
                                    {ann.icon}
                                </div>
                                <div className="ann-card-main">
                                    <div className="ann-card-meta-row">
                                        <span className="ann-card-tag" style={{ color: ann.iconColor, backgroundColor: `${ann.iconColor}10` }}>
                                            {ann.type}
                                        </span>
                                        {ann.group && (
                                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: '#EDE9FE', color: '#6D28D9', border: '1px solid #DDD6FE' }}>
                                                {ann.group}
                                            </span>
                                        )}
                                        <span className="ann-card-date">{ann.date}</span>
                                    </div>
                                    <h3 className="ann-card-title">{ann.title}</h3>
                                    <p className="ann-card-desc">{ann.desc}</p>

                                    {ann.attachment_url && (
                                        <div className="course-ann-attachment-box">
                                            <div className="doc-left">
                                                <FileText size={18} className="doc-file-icon" />
                                                <div className="doc-details">
                                                    <span className="doc-title">{ann.attachment_name || 'Download Notice Document'}</span>
                                                    {ann.attachment_size && <span className="doc-size">{ann.attachment_size}</span>}
                                                </div>
                                            </div>
                                            <a 
                                                href={ann.attachment_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="doc-open-btn"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Download size={14} /> Open
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-announcements-state">
                        <div className="empty-icon-circle">
                            <Info size={32} />
                        </div>
                        <h3>No Announcements Yet</h3>
                        <p>There are currently no active announcements or updates published for this course.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
