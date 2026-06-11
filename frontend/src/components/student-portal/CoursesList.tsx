import React from 'react';
import { Search, Filter, Play } from 'lucide-react';
import './CoursesList.css';

interface Course {
    id: string;
    initial: string;
    title: string;
    code: string;
    progress: number;
    color: string;
}

const CoursesData: Course[] = [
    { id: '1', initial: 'E', title: 'English', code: 'BCS-4A', progress: 70, color: '#7C3AED' },
    { id: '2', initial: 'S', title: 'Science', code: 'BCS-4A', progress: 30, color: '#e53e3e' },
    { id: '3', initial: 'S', title: 'Social', code: 'BCS-4A', progress: 50, color: '#3182ce' },
    { id: '4', initial: 'P', title: 'Projects', code: 'BCS-4A', progress: 40, color: '#dd6b20' },
    { id: '5', initial: 'A', title: 'Arts', code: 'BCS-4A', progress: 100, color: '#38a169' },
];

export const CoursesList: React.FC = () => {
    return (
        <div className="card Courses-card">
            <div className="Courses-header">
                <h3 className="card-title">Your Courses</h3>
                <div className="Courses-actions">
                    <input type="text" placeholder="Search Course" className="Courses-search" />
                    <button className="icon-btn"><Search size={16} /></button>
                    <button className="icon-btn"><Filter size={16} /></button>
                </div>
            </div>

            <div className="Courses-list">
                {CoursesData.map((course) => (
                    <div className="course-item" key={course.id}>
                        <div className="course-icon" style={{ color: course.color }}>
                            {course.initial}
                        </div>
                        <div className="course-info">
                            <span className="course-title">{course.title}</span>
                        </div>
                        <div className="course-code">
                            {course.code}
                        </div>
                        <div className="course-progress" style={{ color: course.color }}>
                            {course.progress}%
                        </div>
                        <button className="course-view-btn">
                            View <Play size={12} fill="currentColor" className="play-icon" />
                        </button>
                    </div>
                ))}
            </div>

            <div className="Courses-footer">
                <button className="view-more-btn">View More</button>
                <button className="enroll-btn">Enroll Course</button>
            </div>
        </div>
    );
};
