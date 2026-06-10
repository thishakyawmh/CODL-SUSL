import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardHeader } from './DashboardHeader';
import { WelcomeBanner } from './WelcomeBanner';
import { Announcements } from './Announcements';
import { RegisteredCourses } from './RegisteredCourses';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="dashboard-container">
            <DashboardHeader title="Dashboard" />
            <WelcomeBanner />
            <Announcements />
            <RegisteredCourses onSelect={(prog) => navigate(`/course/${prog.id}`)} />
        </div>
    );
};
