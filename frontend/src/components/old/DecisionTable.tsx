import React from 'react';

interface DecisionTableProps {
  decision: {
    decision: string;
    confidence: number;
    reasoning: string[];
  } | null;
}

/**
 * DecisionTable component - displays detailed decision reasoning.
 * ChatGPT-style dark mode.
 */
export const DecisionTable: React.FC<DecisionTableProps> = ({ decision }) => {
  if (!decision) {
    return null;
  }

  return (
    <div style={{
      maxWidth: '768px',
      margin: '0 auto',
      padding: '24px 20px',
      backgroundColor: '#343541'
    }}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: '600',
        color: '#ececf1',
        marginBottom: '16px'
      }}>
        Reasoning
      </h3>
      <div style={{
        backgroundColor: '#444654',
        borderRadius: '8px',
        padding: '16px',
        border: '1px solid #565869'
      }}>
        <ul style={{
          listStyle: 'none',
          padding: 0,
          margin: 0
        }}>
          {decision.reasoning.map((reason, index) => (
            <li key={index} style={{
              padding: '12px 0',
              borderBottom: index < decision.reasoning.length - 1 ? '1px solid #565869' : 'none',
              color: '#ececf1',
              fontSize: '15px',
              lineHeight: '1.6'
            }}>
              <span style={{
                display: 'inline-block',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#10a37f',
                color: '#fff',
                textAlign: 'center',
                lineHeight: '24px',
                fontSize: '12px',
                fontWeight: '600',
                marginRight: '12px',
                verticalAlign: 'middle'
              }}>
                {index + 1}
              </span>
              {reason}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

