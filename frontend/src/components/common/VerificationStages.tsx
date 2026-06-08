import React from 'react';

interface Stage {
    label?: string; // 'S', 'C', 'D'
    name?: string;  // 'Secretary', 'Coordinator', 'Director'
    role?: string;  // Alternative to name (e.g. from Applications.tsx)
    status: 'approved' | 'rejected' | 'pending' | string;
}

interface VerificationStagesProps {
    stages?: Stage[];
    secretaryStatus?: string;
    coordinatorStatus?: string;
    directorStatus?: string;
}

export const VerificationStages: React.FC<VerificationStagesProps> = ({
    stages,
    secretaryStatus,
    coordinatorStatus,
    directorStatus
}) => {
    const computedStages: Stage[] = stages || [
        { label: 'S', name: 'Secretary', status: secretaryStatus || 'pending' },
        { label: 'C', name: 'Coordinator', status: coordinatorStatus || 'pending' },
        { label: 'D', name: 'Director', status: directorStatus || 'pending' }
    ];

    return (
        <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
            {computedStages.map((st, idx) => {
                const name = st.name || st.role || '';
                const label = st.label || (name ? name.charAt(0).toUpperCase() : '');
                const statusLower = (st.status || 'pending').toLowerCase();
                const isApproved = statusLower === 'approved';
                const isRejected = statusLower === 'rejected';
                
                return (
                    <div
                        key={idx}
                        title={`${name}: ${statusLower.toUpperCase()}`}
                        style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: isApproved ? '#10B981' : (isRejected ? '#FEF2F2' : '#F1F5F9'),
                            border: isApproved ? 'none' : `1.5px solid ${isRejected ? '#EF4444' : '#94A3B8'}`,
                            color: isApproved ? '#FFFFFF' : (isRejected ? '#EF4444' : '#94A3B8'),
                            fontSize: '11px',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'help'
                        }}
                    >
                        {label}
                    </div>
                );
            })}
        </div>
    );
};

