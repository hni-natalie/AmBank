import React from 'react';

interface SignalCardProps {
    signal: string;
    type: 'positive' | 'adverse' | 'trend';
    ticker: string;
    severity?: string;
    details?: any[];
}

export const SignalCard: React.FC<SignalCardProps> = ({
    signal,
    type,
    severity
}) => {
    const getBorderColor = () => {
        switch (type) {
            case 'adverse': return severity === 'ADVERSE' ? '#fecaca' : '#fef3c7';
            case 'positive': return '#d1fae5';
            default: return '#e5e7eb';
        }
    };

    const getBackgroundColor = () => {
        switch (type) {
            case 'adverse': return '#fee2e2';  // Red for all adverse
            case 'positive': return '#d1fae5';
            default: return '#f3f4f6';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'adverse': return severity === 'ADVERSE' ? '📉' : '⚠️';
            case 'positive': return '✅';
            case 'trend': return '📊';
            default: return '📄';
        }
    };

    const getBadgeLabel = () => {
        if (severity) return severity;
        if (type === 'positive') return 'POSITIVE';
        if (type === 'adverse') return 'ADVERSE';
        if (type === 'trend') return 'TREND';
        return '';
    };

    const getBadgeColor = () => {
        switch (type) {
            case 'adverse':
                return {
                    bg: '#fee2e2',  // Red for all adverse
                    text: '#991b1b'
                };
            case 'positive':
                return { bg: '#d1fae5', text: '#065f46' };
            case 'trend':
                return { bg: '#e0e7ff', text: '#3730a3' };
            default:
                return { bg: '#f3f4f6', text: '#374151' };
        }
    };

    const badgeColors = getBadgeColor();
    const badgeLabel = getBadgeLabel();

    return (
        <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '20px',
            border: `1px solid ${getBorderColor()}`,
            marginBottom: '16px',
            transition: 'all 0.2s',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                {/* Icon */}
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '6px',
                    backgroundColor: getBackgroundColor(),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '20px'
                }}>
                    {getIcon()}
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                    }}>
                        <h3 style={{
                            fontSize: '15px',
                            fontWeight: '500',
                            margin: 0,
                            color: '#111827',
                            lineHeight: '1.5',
                            flex: 1,
                            paddingRight: '12px'
                        }}>
                            {signal}
                        </h3>

                        {badgeLabel && (
                            <span style={{
                                padding: '3px 10px',
                                borderRadius: '12px',
                                backgroundColor: badgeColors.bg,
                                color: badgeColors.text,
                                fontSize: '11px',
                                fontWeight: '600',
                                whiteSpace: 'nowrap'
                            }}>
                                {badgeLabel}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
