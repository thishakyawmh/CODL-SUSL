import React from 'react';
import { HelpCircle, X } from 'lucide-react';
import './ConfirmModal.css';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary';
    onClose: () => void;
    onConfirm: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'primary',
    onClose,
    onConfirm
}) => {
    if (!isOpen) return null;

    return (
        <div className="confirm-modal-overlay" onClick={onClose}>
            <div className="confirm-modal-container" onClick={e => e.stopPropagation()}>
                <div className="confirm-modal-header">
                    <button className="confirm-close-btn" onClick={onClose} aria-label="Close modal">
                        <X size={20} />
                    </button>
                </div>

                <div className="confirm-modal-body">
                    <div className={`confirm-icon-container ${variant}`}>
                        <HelpCircle size={28} className="confirm-icon-inner" />
                    </div>

                    <h2 className="confirm-title">{title}</h2>
                    <p className="confirm-description">{description}</p>

                    <div className="confirm-actions">
                        <button className="confirm-cancel-btn" onClick={onClose}>
                            {cancelText}
                        </button>
                        <button 
                            className={`confirm-btn-submit ${variant}`} 
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
