import React, { type ReactNode } from 'react';
import './DashboardHeader.css';

interface DashboardHeaderProps {
    title?: string;
    breadcrumb?: ReactNode;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ title = "Dashboard", breadcrumb }) => {
    return (
        <div className="header-container">
            {breadcrumb ? (
                <div className="header-title-container" style={{ display: 'flex', alignItems: 'center' }}>
                    {breadcrumb}
                </div>
            ) : (
                <h2 className="header-title">{title}</h2>
            )}

            {/* Profile section has been moved to Sidebar */}
        </div>
    );
};
