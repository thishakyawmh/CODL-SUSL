import React from 'react';
import { Plus, Users, Calendar, Upload, Layers } from 'lucide-react';

interface BatchesTabProps {
    batches: any[];
    onOpenCreateBatch: () => void;
    onUploadMaterial: (batchId: number) => void;
}

export const BatchesTab: React.FC<BatchesTabProps> = ({
    batches,
    onOpenCreateBatch,
    onUploadMaterial,
}) => {
    return (
        <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={20} color="#2563EB" /> Academic Batches ({batches.length})
                </h3>
                <button
                    onClick={onOpenCreateBatch}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        background: '#2563EB',
                        color: '#FFFFFF',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    <Plus size={18} /> Add New Batch
                </button>
            </div>

            {batches.length === 0 ? (
                <p style={{ color: '#94A3B8', textAlign: 'center', padding: '32px' }}>No batches configured for this course yet.</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {batches.map((batch, index) => (
                        <div key={batch.id || index} style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px', background: '#F8FAFC' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>{batch.name}</h4>
                                <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '12px', background: batch.status === 'Active' ? '#DCFCE7' : '#FEF3C7', color: batch.status === 'Active' ? '#166534' : '#92400E' }}>
                                    {batch.status}
                                </span>
                            </div>
                            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>{batch.subtitle}</p>
                            <div style={{ marginTop: '12px', fontSize: '13px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Calendar size={14} /> Start Date: {batch.startDate}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Users size={14} /> Max Enrollments: {batch.maxEnrollments}
                                </span>
                            </div>
                            <button
                                onClick={() => batch.id && onUploadMaterial(batch.id)}
                                style={{
                                    marginTop: '14px',
                                    width: '100%',
                                    display: 'inline-flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid #CBD5E1',
                                    background: '#FFFFFF',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: '#2563EB',
                                    cursor: 'pointer'
                                }}
                            >
                                <Upload size={14} /> Upload Materials
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
