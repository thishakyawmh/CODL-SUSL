import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Phone, Mail, X, HelpCircle } from 'lucide-react';
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
                        <a href="tel:0452280179" className="support-option">
                            <span className="support-icon phone-icon"><Phone size={18} /></span>
                            <div className="support-text">
                                <strong>Call Us</strong>
                                <span>045-2280179</span>
                            </div>
                        </a>
                        <a href="mailto:info@codl.sab.ac.lk" className="support-option">
                            <span className="support-icon mail-icon"><Mail size={18} /></span>
                            <div className="support-text">
                                <strong>Email Us</strong>
                                <span>info@codl.sab.ac.lk</span>
                            </div>
                        </a>
                        <Link to="/help-center" className="support-option" onClick={() => setIsOpen(false)}>
                            <span className="support-icon help-icon"><HelpCircle size={18} /></span>
                            <div className="support-text">
                                <strong>Help Center</strong>
                                <span>Guides & Support</span>
                            </div>
                        </Link>
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
