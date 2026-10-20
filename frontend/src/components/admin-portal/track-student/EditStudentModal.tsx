import React from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface EditStudentModalProps {
    show: boolean;
    editForm: any;
    setEditForm: React.Dispatch<React.SetStateAction<any>>;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    onAddOLSubject: () => void;
    onRemoveOLSubject: (idx: number) => void;
    onOLSubjectChange: (idx: number, field: 'subject' | 'grade', value: string) => void;
    onAddALSubject: () => void;
    onRemoveALSubject: (idx: number) => void;
    onALSubjectChange: (idx: number, field: 'subject' | 'grade', value: string) => void;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
    show,
    editForm,
    setEditForm,
    onClose,
    onSubmit,
    onAddOLSubject,
    onRemoveOLSubject,
    onOLSubjectChange,
    onAddALSubject,
    onRemoveALSubject,
    onALSubjectChange,
}) => {
    if (!show) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#FFFFFF', width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', padding: '28px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>Edit Student Profile & Academic Record</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Student Registration Number</label>
                            <input
                                type="text"
                                value={editForm.studentNumber}
                                onChange={e => setEditForm({ ...editForm, studentNumber: e.target.value })}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', marginTop: '4px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Full Name</label>
                            <input
                                type="text"
                                value={editForm.fullName}
                                onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', marginTop: '4px' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Email Address</label>
                            <input
                                type="email"
                                value={editForm.email}
                                onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', marginTop: '4px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>NIC</label>
                            <input
                                type="text"
                                value={editForm.nic}
                                onChange={e => setEditForm({ ...editForm, nic: e.target.value })}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', marginTop: '4px' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', cursor: 'pointer', fontWeight: 600 }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#2563EB', color: '#FFFFFF', cursor: 'pointer', fontWeight: 700 }}
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
