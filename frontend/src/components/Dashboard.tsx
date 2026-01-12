import React from 'react';

interface DashboardProps {
  decision: {
    decision: string;
    confidence: number;
    reasoning: string[];
  } | null;
}

/**
 * Dashboard component - displays decision overview.
 * ChatGPT-style dark mode.
 */
export const Dashboard: React.FC<DashboardProps> = ({ decision }) => {
  if (!decision) {
    return null;
  }

  const getDecisionColor = (decision: string) => {
    switch (decision.toLowerCase()) {
      case 'buy':
        return '#10a37f';
      case 'sell':
        return '#ef4444';
      case 'hold':
        return '#f59e0b';
      default:
        return '#8e8ea0';
    }
  };

  return (
    <div style={{
      maxWidth: '768px',
      margin: '0 auto',
      padding: '24px 20px',
      backgroundColor: '#444654',
      borderTop: '1px solid #565869',
      borderBottom: '1px solid #565869'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '16px'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: '#10a37f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <span style={{ color: '#fff', fontSize: '18px' }}>✓</span>
        </div>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: '#ececf1',
          margin: 0
        }}>
          Investment Decision
        </h2>
      </div>

      <div style={{
        display: 'flex',
        gap: '24px',
        flexWrap: 'wrap'
      }}>
        <div>
          <div style={{
            fontSize: '12px',
            color: '#8e8ea0',
            marginBottom: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Decision
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: '600',
            color: getDecisionColor(decision.decision),
            textTransform: 'capitalize'
          }}>
            {decision.decision}
          </div>
        </div>
        <div>
          <div style={{
            fontSize: '12px',
            color: '#8e8ea0',
            marginBottom: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Confidence
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#ececf1'
          }}>
            {(decision.confidence * 100).toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
};

