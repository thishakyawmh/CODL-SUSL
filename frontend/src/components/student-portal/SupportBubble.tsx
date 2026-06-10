import React, { useState } from 'react';
import { MessageCircle, Phone, Mail, X } from 'lucide-react';
import './SupportBubble.css';

export const SupportBubble: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="support-bubble-container">
            {isOpen && (
                <div className="support-menu">
                    <div className="support-header">
                        <h4>Need Support?</h4>
                        <button onClick={() => setIsOpen(false)} className="close-support">
                            <X size={16} />
                        </button>
                    </div>
                    <div className="support-options">
                        <a href="tel:+94112345678" className="support-option">
                            <span className="support-icon phone-icon"><Phone size={18} /></span>
                            <div className="support-text">
                                <strong>Call Us</strong>
                                <span>+94 11 234 5678</span>
                            </div>
                        </a>
                        <a href="mailto:support@codl.lk" className="support-option">
                            <span className="support-icon mail-icon"><Mail size={18} /></span>
                            <div className="support-text">
                                <strong>Email Us</strong>
                                <span>support@codl.lk</span>
                            </div>
                        </a>
                    </div>
                </div>
            )}

            <button
                className={`support-fab ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Support and Help"
            >
                {isOpen ? <X size={26} /> : <MessageCircle size={26} />}
            </button>
        </div>
    );
};
