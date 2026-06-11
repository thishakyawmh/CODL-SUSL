import React, { useState, useEffect } from 'react';
import './WelcomeBanner.css';

export const WelcomeBanner: React.FC = () => {
    const [greeting, setGreeting] = useState('');
    const [currentDate, setCurrentDate] = useState('');

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good Morning');
        else if (hour < 18) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');

        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        setCurrentDate(new Date().toLocaleDateString('en-US', options));
    }, []);

    const getStudentName = () => {
        if (typeof window !== 'undefined') {
            const userStr = sessionStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    const displayName = user.display_name || user.displayName;
                    if (displayName) {
                        return displayName.split(' ')[0];
                    }
                    const fullName = user.full_name || user.fullName || '';
                    if (fullName) {
                        return fullName.split(' ')[0];
                    }
                } catch (e) {
                    console.error("Failed to parse stored user in WelcomeBanner", e);
                }
            }
        }
        return 'Haleema';
    };

    const studentName = getStudentName();

    return (
        <div className="banner-container">
            <div className="banner-content">
                <div className="banner-top-info">
                    <span className="banner-greeting">{greeting}</span>
                    <span className="banner-dot">•</span>
                    <span className="banner-date">{currentDate}</span>
                </div>
                <h1 className="banner-title">
                    Welcome back, <span className="highlight-name">{studentName}!</span>
                </h1>
                <p className="banner-text">
                    Your journey to excellence starts here.
                </p>
            </div>
            <div className="banner-image-container">
                <img src="/images/banner.png" alt="Student 3D" className="banner-image" />
            </div>
        </div>
    );
};
