import React, { useState } from 'react';
import { GuidedChat } from './components/GuidedChat';
import { Dashboard } from './components/Dashboard';
import { DecisionTable } from './components/DecisionTable';

interface Decision {
  decision: string;
  confidence: number;
  reasoning: string[];
}

/**
 * Main App component - orchestrates the MVP flow.
 * 
 * Flow:
 * 1. User submits preferences via GuidedChat
 * 2. Send preferences to backend
 * 3. Receive decision JSON
 * 4. Display in Dashboard and DecisionTable (only after selection)
 */
function App() {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handlePreferencesSubmit = async (preferences: {
    time_horizon: string;
    risk_level: string;
    sectors: string[];
  }) => {
    setLoading(true);
    setError(null);
    setHasSubmitted(true);

    try {
      const response = await fetch('/api/decision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const decisionData: Decision = await response.json();
      setDecision(decisionData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#343541',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {!hasSubmitted ? (
        // Landing page - only show GuidedChat
        <GuidedChat onPreferencesSubmit={handlePreferencesSubmit} />
      ) : (
        // Results page - show decision results
        <>
          {loading && (
            <div style={{
              maxWidth: '768px',
              margin: '0 auto',
              padding: '24px 20px',
              textAlign: 'center',
              color: '#8e8ea0'
            }}>
              <div style={{
                display: 'inline-block',
                width: '40px',
                height: '40px',
                border: '3px solid #565869',
                borderTopColor: '#10a37f',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '16px'
              }} />
              <p style={{ fontSize: '16px' }}>Processing your investment decision...</p>
            </div>
          )}

          {error && (
            <div style={{
              maxWidth: '768px',
              margin: '24px auto',
              padding: '16px 20px',
              backgroundColor: '#ef4444',
              borderRadius: '8px',
              color: '#fff'
            }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {decision && !loading && (
            <>
              <Dashboard decision={decision} />
              <DecisionTable decision={decision} />
            </>
          )}
        </>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default App;

