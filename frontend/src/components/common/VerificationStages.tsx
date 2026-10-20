import React from 'react';

interface Stage {
    label?: string; 
    name?: string;  
    role?: string;  
    status: 'approved' | 'rejected' | 'pending' | string;
    approvedBy?: string | null;
    approvedAt?: string | null;
    comment?: string | null;
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

    // Find the first step that is pending to highlight it as active
    const activePendingIndex = computedStages.findIndex(s => s.status.toLowerCase() === 'pending');

    return (
        <div style={{ display: 'inline-flex', alignItems: 'center', position: 'relative' }}>
            <style>{`
                .vs-stepper-container {
                    display: flex;
                    align-items: center;
                    gap: 0;
                    position: relative;
                }
                .vs-step-wrapper {
                    display: flex;
                    align-items: center;
                    position: relative;
                }
                .vs-step-circle-container {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    cursor: pointer;
                }
                .vs-step-circle {
                    width: 26px;
                    height: 26px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 11px;
                    font-weight: 800;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    z-index: 2;
                }
                .vs-step-circle:hover {
                    transform: scale(1.2);
                    box-shadow: 0 4px 12px rgba(124, 58, 237, 0.15);
                }
                .vs-step-connector {
                    height: 2.5px;
                    width: 14px;
                    background: #E2E8F0;
                    margin: 0 -0.5px;
                    position: relative;
                    z-index: 1;
                    transition: background 0.3s ease;
                }
                .vs-step-connector.completed {
                    background: #10B981;
                }
                .vs-step-connector.failed {
                    background: #EF4444;
                }
                .vs-stepper-tooltip {
                    visibility: hidden;
                    opacity: 0;
                    position: absolute;
                    bottom: 140%;
                    left: 50%;
                    transform: translateX(-50%) translateY(8px);
                    width: 240px;
                    background: #FFFFFF;
                    border: 1px solid #E2E8F0;
                    border-radius: 12px;
                    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05);
                    padding: 12px;
                    z-index: 999;
                    transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.2s;
                    pointer-events: none;
                    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
                    color: #1E293B;
                    text-align: left;
                    line-height: 1.4;
                }
                .vs-stepper-tooltip::after {
                    content: '';
                    position: absolute;
                    top: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    border-width: 6px;
                    border-style: solid;
                    border-color: #FFFFFF transparent transparent transparent;
                }
                .vs-step-circle-container:hover .vs-stepper-tooltip {
                    visibility: visible;
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
                .vs-pulse-active {
                    animation: vs-pulse-ring 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes vs-pulse-ring {
                    0% {
                        box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.45);
                    }
                    70% {
                        box-shadow: 0 0 0 8px rgba(124, 58, 237, 0);
                    }
                    100% {
                        box-shadow: 0 0 0 0 rgba(124, 58, 237, 0);
                    }
                }
            `}</style>

            <div className="vs-stepper-container">
                {computedStages.map((st, idx) => {
                    const name = st.name || st.role || '';
                    const label = st.label || (name ? name.charAt(0).toUpperCase() : '');
                    const statusLower = (st.status || 'pending').toLowerCase();
                    const isApproved = statusLower === 'approved';
                    const isRejected = statusLower === 'rejected';
                    const isActivePending = idx === activePendingIndex;

                    // Connector to next step
                    const showConnector = idx < computedStages.length - 1;
                    const nextStep = computedStages[idx + 1];
                    const isNextApproved = nextStep && nextStep.status.toLowerCase() === 'approved';
                    const isNextRejected = nextStep && nextStep.status.toLowerCase() === 'rejected';

                    let connectorClass = '';
                    if (isApproved) {
                        connectorClass = isNextRejected ? 'failed' : 'completed';
                    }

                    // Circle styling
                    let bg = '#F1F5F9';
                    let border = '1.5px solid #94A3B8';
                    let color = '#64748B';

                    if (isApproved) {
                        bg = '#10B981';
                        border = 'none';
                        color = '#FFFFFF';
                    } else if (isRejected) {
                        bg = '#FEF2F2';
                        border = '1.5px solid #EF4444';
                        color = '#EF4444';
                    } else if (isActivePending) {
                        bg = '#F5F3FF';
                        border = '1.5px solid #7C3AED';
                        color = '#7C3AED';
                    }

                    return (
                        <div key={idx} className="vs-step-wrapper">
                            <div className="vs-step-circle-container">
                                <div
                                    className={`vs-step-circle ${isActivePending ? 'vs-pulse-active' : ''}`}
                                    style={{
                                        background: bg,
                                        border: border,
                                        color: color,
                                    }}
                                >
                                    {label}
                                </div>

                                {/* Rich Hover Popover Card */}
                                <div className="vs-stepper-tooltip">
                                    <div style={{ fontWeight: 700, fontSize: '12px', color: '#1E293B', marginBottom: '4px' }}>
                                        {name} Verification
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                        <span style={{
                                            fontSize: '10px',
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            padding: '2px 6px',
                                            borderRadius: '100px',
                                            background: isApproved ? '#DCFCE7' : (isRejected ? '#FEE2E2' : '#F1F5F9'),
                                            color: isApproved ? '#15803D' : (isRejected ? '#B91C1C' : '#475569')
                                        }}>
                                            {statusLower}
                                        </span>
                                        {st.approvedAt && (
                                            <span style={{ fontSize: '10px', color: '#94A3B8' }}>
                                                {st.approvedAt}
                                            </span>
                                        )}
                                    </div>
                                    
                                    {st.approvedBy && (
                                        <div style={{ fontSize: '11px', color: '#475569', marginBottom: '4px' }}>
                                            <strong>By:</strong> {st.approvedBy}
                                        </div>
                                    )}

                                    {st.comment && (
                                        <div style={{ 
                                            fontSize: '11.5px', 
                                            color: '#64748B', 
                                            fontStyle: 'italic',
                                            background: '#F8FAFC',
                                            padding: '6px 8px',
                                            borderRadius: '6px',
                                            borderLeft: '2.5px solid #CBD5E1',
                                            marginTop: '4px',
                                            wordBreak: 'break-word'
                                        }}>
                                            "{st.comment}"
                                        </div>
                                    )}
                                </div>
                            </div>
                            {showConnector && (
                                <div className={`vs-step-connector ${connectorClass}`} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
