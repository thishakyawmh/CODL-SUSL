import React from 'react';
import { AlertTriangle, Mail, Phone, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MaintenancePageProps {
    settings: {
        institution_name?: string;
        university_name?: string;
        contact_email?: string;
        contact_phone?: string;
        logo?: string;
        maintenance_message?: string;
    } | null;
}

export const MaintenancePage: React.FC<MaintenancePageProps> = ({ settings }) => {
    const defaultMessage = 'The system is currently undergoing scheduled maintenance. Please check back later.';
    const message = settings?.maintenance_message || defaultMessage;
    const university = settings?.university_name || 'Sabaragamuwa University of Sri Lanka';
    const institution = settings?.institution_name || 'Centre for Open & Distance Learning';
    const logoUrl = settings?.logo || '/images/logo.png';

    return (
        <div className="maintenance-wrapper">
            <style>{`
                .maintenance-wrapper {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
                    color: #f8fafc;
                    font-family: 'Outfit', 'Inter', sans-serif;
                    padding: 24px;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }

                .maintenance-wrapper::before {
                    content: '';
                    position: absolute;
                    width: 300px;
                    height: 300px;
                    background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
                    top: 10%;
                    left: 10%;
                    border-radius: 50%;
                }

                .maintenance-wrapper::after {
                    content: '';
                    position: absolute;
                    width: 400px;
                    height: 400px;
                    background: radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%);
                    bottom: 10%;
                    right: 10%;
                    border-radius: 50%;
                }

                .m-container {
                    position: relative;
                    z-index: 10;
                    max-width: 600px;
                    width: 100%;
                    background: rgba(30, 41, 59, 0.7);
                    backdrop-filter: blur(16px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 24px;
                    padding: 48px 32px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    animation: m-fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }

                @keyframes m-fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .m-logo-section {
                    margin-bottom: 32px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .m-logo {
                    max-height: 80px;
                    object-fit: contain;
                    margin-bottom: 16px;
                    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2));
                }

                .m-university {
                    font-size: 13px;
                    font-weight: 700;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    color: #a78bfa;
                    margin: 0;
                }

                .m-institution {
                    font-size: 20px;
                    font-weight: 800;
                    color: #ffffff;
                    margin: 4px 0 0;
                }

                .m-icon-wrapper {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: rgba(245, 158, 11, 0.1);
                    border: 1px solid rgba(245, 158, 11, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 24px;
                    color: #f59e0b;
                    box-shadow: 0 0 20px rgba(245, 158, 11, 0.15);
                    animation: pulse 2s infinite ease-in-out;
                }

                @keyframes pulse {
                    0%, 100% {
                        transform: scale(1);
                        box-shadow: 0 0 20px rgba(245, 158, 11, 0.15);
                    }
                    50% {
                        transform: scale(1.05);
                        box-shadow: 0 0 30px rgba(245, 158, 11, 0.3);
                    }
                }

                .m-title {
                    font-size: 28px;
                    font-weight: 800;
                    margin-bottom: 16px;
                    color: #ffffff;
                    letter-spacing: -0.02em;
                }

                .m-desc {
                    font-size: 16px;
                    line-height: 1.6;
                    color: #94a3b8;
                    margin-bottom: 32px;
                    padding: 0 16px;
                }

                .m-divider {
                    height: 1px;
                    background: rgba(255, 255, 255, 0.08);
                    width: 100%;
                    margin-bottom: 24px;
                }

                .m-contact-title {
                    font-size: 12px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #64748b;
                    margin-bottom: 12px;
                }

                .m-contact-grid {
                    display: flex;
                    justify-content: center;
                    gap: 24px;
                    flex-wrap: wrap;
                }

                .m-contact-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                    color: #cbd5e1;
                    text-decoration: none;
                    transition: color 0.2s;
                }

                .m-contact-item:hover {
                    color: #a78bfa;
                }

                .m-contact-item svg {
                    color: #a78bfa;
                }

                .m-bypass-link {
                    position: absolute;
                    bottom: 24px;
                    right: 24px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #475569;
                    text-decoration: none;
                    padding: 8px 16px;
                    border-radius: 12px;
                    background: rgba(15, 23, 42, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.03);
                    transition: all 0.2s ease;
                    z-index: 20;
                }

                .m-bypass-link:hover {
                    color: #cbd5e1;
                    background: rgba(30, 41, 59, 0.5);
                    border-color: rgba(255, 255, 255, 0.08);
                }
            `}</style>

            <div className="m-container">
                <div className="m-logo-section">
                    <img src={logoUrl} alt="Logo" className="m-logo" onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/logo.png';
                    }} />
                    <p className="m-university">{university}</p>
                    <h1 className="m-institution">{institution}</h1>
                </div>

                <div className="m-icon-wrapper">
                    <AlertTriangle size={36} />
                </div>

                <h2 className="m-title">System Under Maintenance</h2>
                <p className="m-desc">{message}</p>

                <div className="m-divider"></div>

                <h3 className="m-contact-title">Need Urgent Assistance?</h3>
                <div className="m-contact-grid">
                    {settings?.contact_email && (
                        <a href={`mailto:${settings.contact_email}`} className="m-contact-item">
                            <Mail size={16} />
                            <span>{settings.contact_email}</span>
                        </a>
                    )}
                    {settings?.contact_phone && (
                        <a href={`tel:${settings.contact_phone}`} className="m-contact-item">
                            <Phone size={16} />
                            <span>{settings.contact_phone}</span>
                        </a>
                    )}
                </div>
            </div>

            <Link to="/staff/login" className="m-bypass-link">
                <Lock size={14} />
                <span>Staff Portal</span>
            </Link>
        </div>
    );
};
