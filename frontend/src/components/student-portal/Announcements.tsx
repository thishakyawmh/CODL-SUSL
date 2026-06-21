import React, { useState, useEffect } from 'react';
import { Bell, Info, ChevronLeft, ChevronRight, MessageSquare, Megaphone } from 'lucide-react';
import { announcementService } from '../../services/apiService';
import './Announcements.css';

interface GlobalAnn {
    id?: string | number;
    title: string;
    date: string;
    desc: string;
    type?: 'Important' | 'Update' | 'General';
}

export const Announcements: React.FC = () => {
    const [announcements, setAnnouncements] = useState<GlobalAnn[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchGlobalAnnouncements = async () => {
            try {
                const cacheKey = 'global_announcements_cache';
                const cachedData = sessionStorage.getItem(cacheKey);
                if (cachedData) {
                    const { data, timestamp } = JSON.parse(cachedData);
                    if (Date.now() - timestamp < 60000) {
                        const globalOnly = data.filter((ann: any) => !ann.course_id).map((ann: any) => ({
                            id: ann.id,
                            title: ann.title,
                            desc: ann.desc,
                            type: ann.type as any,
                            date: new Date(ann.created_at || ann.createdDate || new Date()).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            })
                        }));
                        setAnnouncements(globalOnly);
                        return;
                    }
                }

                const data = await announcementService.getAll();
                sessionStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
                const globalOnly = data.filter((ann: any) => !ann.course_id).map((ann: any) => ({
                    id: ann.id,
                    title: ann.title,
                    desc: ann.desc,
                    type: ann.type as any,
                    date: new Date(ann.created_at || ann.createdDate || new Date()).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    })
                }));
                setAnnouncements(globalOnly);
            } catch (err) {
                console.error("Failed to fetch global announcements:", err);
            }
        };
        fetchGlobalAnnouncements();
    }, []);

    const nextAnn = () => {
        if (announcements.length <= 1) return;
        setCurrentIndex((prev) => (prev + 1) % announcements.length);
    };

    const prevAnn = () => {
        if (announcements.length <= 1) return;
        setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
    };

    const activeAnn = announcements[currentIndex];
    const rawType = activeAnn?.type || 'General';
    const type = rawType;
    const typeClass = rawType === 'Notice' ? 'update' : (rawType === 'Update' ? 'general' : (rawType === 'Important' ? 'important' : 'general'));

    const getIcon = (annType?: string) => {
        if (annType === 'Important') return <Bell size={18} />;
        if (annType === 'Notice') return <Info size={18} />;
        if (annType === 'Update') return <MessageSquare size={18} />;
        return <Info size={18} />;
    };

    return (
        <div className={`card announcements-card theme-${typeClass}`}>
            <div className="glass-glow-orb"></div>
            <div className="announcements-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div className="ann-header-icon">
                        <Megaphone size={20} />
                    </div>
                    <h3 className="card-title" style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text-dark)' }}>
                        Latest Announcements
                    </h3>
                </div>
                {announcements.length > 1 && (
                    <div className="header-nav-btns" style={{ display: 'flex', gap: '8px' }}>
                        <button className="nav-btn" onClick={prevAnn}>
                            <ChevronLeft size={16} />
                        </button>
                        <button className="nav-btn" onClick={nextAnn}>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>

            {activeAnn ? (
                <div className="announcement-container">
                    <div className={`announcement-box type-${typeClass}`}>
                        <div className="announcement-inner">
                            <div className="announcement-info">
                                <div className="info-icon-badge">
                                    {getIcon(activeAnn.type)}
                                </div>
                                <div className="announcement-header-text">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <h4 className="announcement-item-title">
                                            {activeAnn.title}
                                        </h4>
                                        <span className={`category-tag tag-${typeClass}`}>
                                            {type}
                                        </span>
                                    </div>
                                    <span className="announcement-date">{activeAnn.date}</span>
                                </div>
                            </div>
                            <p className="announcement-desc">
                                {activeAnn.desc}
                            </p>
                        </div>
                    </div>

                    {announcements.length > 1 && (
                        <div className="carousel-indicators">
                            {announcements.map((_, idx) => (
                                <span 
                                    key={idx} 
                                    className={`dot ${idx === currentIndex ? 'active' : ''}`}
                                    onClick={() => setCurrentIndex(idx)}
                                ></span>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="announcement-container" style={{ padding: '24px', border: '1.5px dashed #CBD5E1', borderRadius: '12px', textAlign: 'center', color: '#94A3B8' }}>
                    <Info size={28} style={{ margin: '0 auto 8px', display: 'block' }} />
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>No active announcements published yet.</p>
                </div>
            )}
        </div>
    );
};
