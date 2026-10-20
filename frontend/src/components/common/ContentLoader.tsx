import React from 'react';

interface ContentLoaderProps {
    text?: string;
}

export const ContentLoader: React.FC<ContentLoaderProps> = ({ text = 'Loading...' }) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            height: '100%',
            width: '100%',
            backgroundColor: '#F8FAFC',
            gap: '16px',
            fontFamily: "'Poppins', sans-serif",
            minHeight: '400px'
        }}>
            <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: '3px solid #E2E8F0',
                borderTopColor: '#7C3AED',
                animation: 'spin 1s linear infinite'
            }} />
            <div style={{
                color: '#64748B',
                fontSize: '13px',
                fontWeight: 500
            }}>{text}</div>
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};
