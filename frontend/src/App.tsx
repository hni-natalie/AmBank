import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { GuidedChat } from './components/GuidedChat';
import { Dashboard } from './components/Dashboard';
import { DecisionTable } from './components/DecisionTable';
import { DashboardPage } from './pages/DashboardPage';

interface Decision {
  decision: string;
  confidence: number;
  reasoning: string[];
}

/**
 * Main App component with routing.
 */
function App() {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleCardClick = () => {
    setShowForm(true);
  };

  const handlePreferencesSubmit = async (preferences: {
    time_horizon: string;
    risk_level: string;
    sectors: string[];
    bank_statement?: File;
  }) => {
    setLoading(true);
    setError(null);
    setHasSubmitted(true);

    try {
      const formData = new FormData();
      formData.append('time_horizon', preferences.time_horizon);
      formData.append('risk_level', preferences.risk_level);
      formData.append('sectors', JSON.stringify(preferences.sectors));
      if (preferences.bank_statement) {
        formData.append('bank_statement', preferences.bank_statement);
      }

      const response = await fetch('/api/decision', {
        method: 'POST',
        body: formData,
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
    <BrowserRouter>
      <Routes>
        {/* Dashboard route */}
        <Route path="/dashboard" element={<DashboardPage />} />
        
        {/* Main app route */}
        <Route
          path="/"
          element={
            <div style={{ 
              minHeight: '100vh', 
              backgroundColor: '#ffffff',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {!showForm ? (
                // Landing page with cards
                <LandingPage onCardClick={handleCardClick} />
              ) : !hasSubmitted ? (
                // Form page - show GuidedChat
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
                      color: '#64748b'
                    }}>
                      <div style={{
                        display: 'inline-block',
                        width: '40px',
                        height: '40px',
                        border: '3px solid #cbd5e1',
                        borderTopColor: '#1e3a8a',
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
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
