import React from 'react';
import { ArrowRight, FileText, UserMinus } from 'lucide-react';
import './ActionCards.css';

export const ActionCards: React.FC = () => {
    return (
        <div className="action-cards-container">
            <div className="action-card">
                <div className="action-icon-bg">
                    <UserMinus size={20} className="action-icon" />
                </div>
                <div className="action-content">
                    <h4>Leave</h4>
                    <p>Want's to take a Leave?</p>
                </div>
                <ArrowRight size={20} className="action-arrow" />
            </div>

            <div className="action-card">
                <div className="action-icon-bg">
                    <FileText size={20} className="action-icon" />
                </div>
                <div className="action-content">
                    <h4>Complaint</h4>
                    <p>Want's to complaint against someone?</p>
                </div>
                <ArrowRight size={20} className="action-arrow" />
            </div>
        </div>
    );
};
