import React, { useState } from 'react';

interface GuidedChatProps {
  onPreferencesSubmit: (preferences: {
    time_horizon: string;
    risk_level: string;
    sectors: string[];
  }) => void;
}

const timeHorizons = ['short', 'medium', 'long'];
const riskLevels = ['conservative', 'balanced', 'aggressive'];
const availableSectors = ['technology', 'finance', 'healthcare', 'energy', 'consumer', 'industrial'];

/**
 * GuidedChat component - collects user preferences with pill selections.
 * ChatGPT-style dark mode interface.
 */
export const GuidedChat: React.FC<GuidedChatProps> = ({ onPreferencesSubmit }) => {
  const [timeHorizon, setTimeHorizon] = useState<string>('');
  const [riskLevel, setRiskLevel] = useState<string>('');
  const [sectors, setSectors] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const toggleSector = (sector: string) => {
    if (sectors.includes(sector)) {
      setSectors(sectors.filter(s => s !== sector));
    } else {
      setSectors([...sectors, sector]);
    }
  };

  const handleSubmit = () => {
    if (!timeHorizon || !riskLevel || sectors.length === 0) {
      return;
    }

    const preferences = {
      time_horizon: timeHorizon,
      risk_level: riskLevel,
      sectors: sectors
    };
    
    onPreferencesSubmit(preferences);
    setSubmitted(true);
  };

  const canSubmit = timeHorizon && riskLevel && sectors.length > 0 && !submitted;

  return (
    <div style={{
      maxWidth: '768px',
      margin: '0 auto',
      padding: '20px',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{ width: '100%', maxWidth: '640px' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '600',
          marginBottom: '8px',
          textAlign: 'center',
          color: '#ececf1'
        }}>
          Investment Decision System
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#8e8ea0',
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          Select your investment preferences to get started
        </p>

        {/* Time Horizon Selection */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '12px',
            color: '#ececf1'
          }}>
            Time Horizon
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {timeHorizons.map((horizon) => (
              <button
                key={horizon}
                onClick={() => setTimeHorizon(horizon)}
                disabled={submitted}
                style={{
                  padding: '10px 16px',
                  borderRadius: '16px',
                  border: '1px solid',
                  borderColor: timeHorizon === horizon ? '#10a37f' : '#565869',
                  backgroundColor: timeHorizon === horizon ? '#10a37f' : 'transparent',
                  color: '#ececf1',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: submitted ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  textTransform: 'capitalize'
                }}
              >
                {horizon}
              </button>
            ))}
          </div>
        </div>

        {/* Risk Level Selection */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '12px',
            color: '#ececf1'
          }}>
            Risk Level
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {riskLevels.map((level) => (
              <button
                key={level}
                onClick={() => setRiskLevel(level)}
                disabled={submitted}
                style={{
                  padding: '10px 16px',
                  borderRadius: '16px',
                  border: '1px solid',
                  borderColor: riskLevel === level ? '#10a37f' : '#565869',
                  backgroundColor: riskLevel === level ? '#10a37f' : 'transparent',
                  color: '#ececf1',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: submitted ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  textTransform: 'capitalize'
                }}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Sectors Selection */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '12px',
            color: '#ececf1'
          }}>
            Sectors (select one or more)
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {availableSectors.map((sector) => (
              <button
                key={sector}
                onClick={() => toggleSector(sector)}
                disabled={submitted}
                style={{
                  padding: '10px 16px',
                  borderRadius: '16px',
                  border: '1px solid',
                  borderColor: sectors.includes(sector) ? '#10a37f' : '#565869',
                  backgroundColor: sectors.includes(sector) ? '#10a37f' : 'transparent',
                  color: '#ececf1',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: submitted ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  textTransform: 'capitalize'
                }}
              >
                {sector}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            width: '100%',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: canSubmit ? '#10a37f' : '#565869',
            color: '#fff',
            fontSize: '16px',
            fontWeight: '500',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            marginTop: '8px'
          }}
        >
          {submitted ? 'Processing...' : 'Get Investment Decision'}
        </button>
      </div>
    </div>
  );
};

