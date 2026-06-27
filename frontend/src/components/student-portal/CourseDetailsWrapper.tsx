import React, { useState, useEffect } from 'react';
import { useParams, Outlet } from 'react-router-dom';
import { type Course } from './CourseDetails';
import { courseService } from '../../services/apiService';


export const CourseDetailsWrapper: React.FC = () => {
    const { id } = useParams();
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const data = await courseService.getById(id!);
                const mapped: Course = {
                    id: data.id.toString(),
                    title: data.title,
                    code: data.code,
                    type: data.level === 'Certificate' || data.level === 'Advanced Certificate' ? 'Certification' : data.level,
                    startDate: data.created_at ? new Date(data.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Jan 15, 2026',
                    endDate: data.duration || '3 Years',
                    semesters: data.semesters,
                    subjects: data.subjects
                };
                setCourse(mapped);
            } catch (err) {
                console.error('Failed to fetch course details from backend:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();
    }, [id]);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                <div style={{ textAlign: 'center', color: '#64748B' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid #E2E8F0', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                    <p style={{ fontWeight: 600 }}>Loading course details...</p>
                </div>
            </div>
        );
    }

    if (!course) {
        return <div style={{ padding: '40px', textAlign: 'center', color: '#EF4444', fontWeight: 600 }}>Course not found</div>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            <Outlet context={{ course }} />
        </div>
    );
};
