import React from 'react';
import { LogOut, X } from 'lucide-react';
import './SignOutModal.css';

interface SignOutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const SignOutModal: React.FC<SignOutModalProps> = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="signout-modal-overlay" onClick={onClose}>
            <div className="signout-modal-container" onClick={e => e.stopPropagation()}>

                <div className="signout-modal-header">
                    <button className="signout-close-btn" onClick={onClose} aria-label="Close modal">
                        <X size={20} />
                    </button>
                </div>

                <div className="signout-modal-body">
                    <div className="signout-icon-container">
                        <LogOut size={28} className="signout-icon-inner" />
                    </div>

                    <h2 className="signout-title">Sign Out</h2>
                    <p className="signout-description">
                        Are you sure you want to sign out of your account?
                    </p>

                    <div className="signout-actions">
                        <button className="signout-cancel-btn" onClick={onClose}>
                            Cancel
                        </button>
                        <button className="signout-confirm-btn" onClick={onConfirm}>
                            Yes, Sign Out
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
