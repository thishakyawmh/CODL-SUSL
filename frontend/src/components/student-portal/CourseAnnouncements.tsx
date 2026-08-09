import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowLeft, Bell, MessageSquare, Info } from 'lucide-react';
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
            try {
                const response = await courseService.getStudentCourses();
                const matched = response.find((c: any) => c.id.toString() === course.id.toString());
                if (matched && matched.pivot?.batch) {
                    activeBatch = matched.pivot.batch;
                }
            } catch (e) {
                console.error("Failed to fetch student batch for announcements:", e);
            }

            try {
                const data = await announcementService.getAll({ course_id: course.id, batch: activeBatch });
                const processed = data.map((ann: any) => {
                    const annType = ann.type || 'Notice';
                    const iconColor = annType === 'Important' ? '#EF4444' : (annType === 'Update' ? '#10B981' : '#3B82F6');
                    const bgColor = annType === 'Important' ? '#FEF2F2' : (annType === 'Update' ? '#F0FDF4' : '#EFF6FF');
                    
                    return {
                        id: ann.id,
                        title: ann.title,
                        desc: ann.desc,
                        type: annType,
                        date: new Date(ann.created_at || new Date()).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        }),
                        icon: annType === 'Important' ? <Bell size={18} /> : (annType === 'Update' ? <MessageSquare size={18} /> : <Info size={18} />),
                        bgColor,
                        iconColor
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
                                        <span className="ann-card-date">{ann.date}</span>
                                    </div>
                                    <h3 className="ann-card-title">{ann.title}</h3>
                                    <p className="ann-card-desc">{ann.desc}</p>
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
