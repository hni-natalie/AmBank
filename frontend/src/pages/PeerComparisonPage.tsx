import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { PeerComparisonResponse, CompanySignals } from '../api/dashboard';

/**
 * PeerComparisonPage - Shows comparison of 1 base company + 2 peers with signal percentages
 * 
 * Backend returns signal ARRAYS (text strings), we compute percentages:
 * Positive % = (positive.length / (positive + adverse + trend)) * 100
 */
export const PeerComparisonPage: React.FC = () => {
  const navigate = useNavigate();
  const storeInput = useAppStore((state) => state.userInput);

  const [comparison, setComparison] = useState<PeerComparisonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ticker = storeInput?.ticker;
  const companyName = storeInput?.companyName;

  useEffect(() => {
    const fetchComparison = async () => {
      if (!ticker) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // First, fetch company info and peers list from search endpoint
        const searchUrl = `/api/company/search?company_name=${encodeURIComponent(ticker)}`;
        const searchResponse = await fetch(searchUrl);

        if (!searchResponse.ok) {
          throw new Error('Failed to fetch company information');
        }

        const searchData = await searchResponse.json();
        const peersList = searchData.peers || searchData.company?.peers || [];

        console.log('[PeerComparison] Fetched peers list:', peersList);

        if (!peersList || peersList.length === 0) {
          setError('No peer companies found for this ticker');
          setLoading(false);
          return;
        }

        // Slice to maximum 2 peers per requirement
        const peersToAnalyze = peersList.slice(0, 2);

        // Fetch peer comparison from backend
        const response = await fetch('/api/dashboard/compare-peers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ticker: ticker,
            company_name: companyName || ticker,
            peers: peersToAnalyze,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch peer comparison');
        }

        const data: PeerComparisonResponse = await response.json();
        setComparison(data);
      } catch (err: any) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error('[PeerComparison] Error:', msg);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [ticker, companyName]);

  // Helper: Calculate percentages from signal arrays
  const calculatePercentages = (signals: { positive: string[]; adverse: string[]; trend: string[] }) => {
    const total = (signals.positive?.length ?? 0) + (signals.adverse?.length ?? 0) + (signals.trend?.length ?? 0);
    
    if (total === 0) {
      return { positive: 0, adverse: 0, trend: 0 };
    }

    return {
      positive: Math.round(((signals.positive?.length ?? 0) / total) * 100),
      adverse: Math.round(((signals.adverse?.length ?? 0) / total) * 100),
      trend: Math.round(((signals.trend?.length ?? 0) / total) * 100),
    };
  };

  // Render loading state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '20px',
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #e5e7eb',
          borderTopColor: '#10a37f',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <p style={{ color: '#6b7280', fontSize: '16px' }}>
          Loading peer comparison...
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Render no ticker state
  if (!ticker) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '24px',
        padding: '20px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px' }}>📊</div>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937' }}>
          No Company Selected
        </h2>
        <p style={{ color: '#6b7280', maxWidth: '400px' }}>
          Please return to the dashboard to select a company first.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#10a37f',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '24px',
        padding: '20px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px' }}>🔍</div>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937' }}>
          No Peer Companies Found
        </h2>
        <p style={{ color: '#6b7280', maxWidth: '400px' }}>
          {error}. This company may not have peer data available.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#10a37f',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Render main content with comparison
  const allCompanies: Array<{ company: CompanySignals | null; label: string }> = [
    { company: comparison?.base || null, label: 'Base Company' },
    ...(comparison?.peers || []).map((peer, index) => ({
      company: peer,
      label: `Peer ${index + 1}`,
    })),
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      padding: '32px 24px',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '40px',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '24px',
        }}>
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              margin: '0 0 8px 0',
              color: '#111827',
            }}>
              Peer Comparison
            </h1>
            <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>
              {ticker} vs {comparison?.peers?.length || 0} competitor{(comparison?.peers?.length || 0) !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              color: '#111827',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Comparison Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '24px',
          marginBottom: '40px',
        }}>
          {allCompanies.map((item, index) => {
            if (!item.company) return null;

            const percentages = calculatePercentages(item.company.signals);
            const isBase = index === 0;

            return (
              <CompanyComparisonCard
                key={`${item.company.ticker}-${index}`}
                company={item.company}
                percentages={percentages}
                isBase={isBase}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * CompanyComparisonCard - Displays single company with 3 percentage metrics
 */
interface CompanyComparisonCardProps {
  company: CompanySignals;
  percentages: { positive: number; adverse: number; trend: number };
  isBase: boolean;
}

const CompanyComparisonCard: React.FC<CompanyComparisonCardProps> = ({
  company,
  percentages,
  isBase,
}) => {
  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: '#ffffff',
        border: isBase ? '2px solid #3b82f6' : '1px solid #e5e7eb',
        borderRadius: '12px',
        boxShadow: isBase ? '0 4px 12px rgba(59, 130, 246, 0.1)' : '0 2px 4px rgba(0, 0, 0, 0.05)',
        position: 'relative',
      }}
    >
      {/* Base Company Badge */}
      {isBase && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            backgroundColor: '#dbeafe',
            color: '#1e40af',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '600',
          }}
        >
          Base
        </div>
      )}

      {/* Company Name and Ticker */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: '#111827',
          margin: '0 0 4px 0',
        }}>
          {company.company_name}
        </h3>
        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          margin: 0,
          fontWeight: '500',
        }}>
          {company.ticker}
        </p>
      </div>

      {/* Percentage Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '16px',
      }}>
        {/* Positive Percentage */}
        <div
          style={{
            padding: '16px',
            backgroundColor: '#f0fdf4',
            borderRadius: '8px',
            border: '1px solid #dcfce7',
          }}
        >
          <div style={{
            fontSize: '12px',
            color: '#4b5563',
            fontWeight: '600',
            marginBottom: '8px',
          }}>
            ✅ Positive
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#10b981',
            margin: 0,
          }}>
            {percentages.positive}%
          </div>
        </div>

        {/* Adverse Percentage */}
        <div
          style={{
            padding: '16px',
            backgroundColor: '#fef2f2',
            borderRadius: '8px',
            border: '1px solid #fee2e2',
          }}
        >
          <div style={{
            fontSize: '12px',
            color: '#4b5563',
            fontWeight: '600',
            marginBottom: '8px',
          }}>
            ⚠️ Adverse
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#ef4444',
            margin: 0,
          }}>
            {percentages.adverse}%
          </div>
        </div>

        {/* Trend Percentage */}
        <div
          style={{
            padding: '16px',
            backgroundColor: '#fffbeb',
            borderRadius: '8px',
            border: '1px solid #fef3c7',
          }}
        >
          <div style={{
            fontSize: '12px',
            color: '#4b5563',
            fontWeight: '600',
            marginBottom: '8px',
          }}>
            📈 Trend
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#f59e0b',
            margin: 0,
          }}>
            {percentages.trend}%
          </div>
        </div>
      </div>

      {/* Signal Lists */}
      <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
        {/* Positive Signals */}
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{
            fontSize: '12px',
            fontWeight: '600',
            color: '#4b5563',
            margin: '0 0 8px 0',
            textTransform: 'uppercase',
          }}>
            ✅ Signals ({company.signals.positive.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {company.signals.positive.length > 0 ? (
              company.signals.positive.map((signal, idx) => (
                <div
                  key={idx}
                  style={{
                    fontSize: '13px',
                    color: '#10b981',
                    padding: '6px 8px',
                    backgroundColor: '#f0fdf4',
                    borderRadius: '4px',
                    borderLeft: '3px solid #10b981',
                  }}
                >
                  {signal}
                </div>
              ))
            ) : (
              <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>No signals</p>
            )}
          </div>
        </div>

        {/* Adverse Signals */}
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{
            fontSize: '12px',
            fontWeight: '600',
            color: '#4b5563',
            margin: '0 0 8px 0',
            textTransform: 'uppercase',
          }}>
            ⚠️ Signals ({company.signals.adverse.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {company.signals.adverse.length > 0 ? (
              company.signals.adverse.map((signal, idx) => (
                <div
                  key={idx}
                  style={{
                    fontSize: '13px',
                    color: '#ef4444',
                    padding: '6px 8px',
                    backgroundColor: '#fef2f2',
                    borderRadius: '4px',
                    borderLeft: '3px solid #ef4444',
                  }}
                >
                  {signal}
                </div>
              ))
            ) : (
              <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>No signals</p>
            )}
          </div>
        </div>

        {/* Trend Signals */}
        <div>
          <h4 style={{
            fontSize: '12px',
            fontWeight: '600',
            color: '#4b5563',
            margin: '0 0 8px 0',
            textTransform: 'uppercase',
          }}>
            📈 Signals ({company.signals.trend.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {company.signals.trend.length > 0 ? (
              company.signals.trend.map((signal, idx) => (
                <div
                  key={idx}
                  style={{
                    fontSize: '13px',
                    color: '#f59e0b',
                    padding: '6px 8px',
                    backgroundColor: '#fffbeb',
                    borderRadius: '4px',
                    borderLeft: '3px solid #f59e0b',
                  }}
                >
                  {signal}
                </div>
              ))
            ) : (
              <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>No signals</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeerComparisonPage;
