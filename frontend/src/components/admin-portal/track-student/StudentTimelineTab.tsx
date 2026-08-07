import React from 'react';
import { Calendar, FileText, CheckCircle2, GraduationCap, ClipboardCheck, PauseCircle, RefreshCw } from 'lucide-react';

interface StudentTimelineTabProps {
    timeline: any[];
}

export const StudentTimelineTab: React.FC<StudentTimelineTabProps> = ({ timeline }) => {
    return (
        <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} color="#2563EB" /> Chronological Student Event Stream ({timeline.length})
            </h3>

            {timeline.length === 0 ? (
                <p style={{ color: '#94A3B8', fontSize: '14px' }}>No timeline events recorded.</p>
            ) : (
                <div style={{ position: 'relative', paddingLeft: '24px' }}>
                    <div style={{ position: 'absolute', left: '7px', top: '8px', bottom: '8px', width: '2px', background: '#E2E8F0' }}></div>

                    {timeline.map((event, idx) => (
                        <div key={idx} style={{ position: 'relative', marginBottom: '20px' }}>
                            <div style={{
                                position: 'absolute',
                                left: '-24px',
                                top: '2px',
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                background: event.status === 'approved' ? '#10B981' : '#3B82F6',
                                border: '3px solid #FFFFFF',
                                boxShadow: '0 0 0 1px #CBD5E1'
                            }}></div>

                            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px 16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#2563EB' }}>{event.course}</span>
                                    <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>{event.date}</span>
                                </div>
                                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{event.title}</h4>
                                <p style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>{event.detail}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
