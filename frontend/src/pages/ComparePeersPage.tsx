import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FloatingChatbot } from '../components/FloatingChatbot';

interface PeerData {
  ticker: string;
  positive_percentage: number;
  adverse_percentage: number;
  trend_percentage: number;
  overall_stance: string;
}

interface ComparisonData {
  main_company: PeerData & { company_name?: string };
  peers: PeerData[];
}

export function ComparePeersPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [data, setData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ticker = searchParams.get('ticker');
    const companyName = searchParams.get('company');
    const peersParam = searchParams.get('peers');

    if (!ticker || !companyName || !peersParam) {
      setError('Missing required parameters. Please navigate from the dashboard.');
      setLoading(false);
      return;
    }

    const peers = peersParam.split(',').slice(0, 2);
    fetchComparison(ticker, companyName, peers);
  }, [searchParams]);

  const fetchComparison = async (ticker: string, companyName: string, peers: string[]) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/peer-comparison/compare-peers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: ticker.includes('.KL') ? ticker : `${ticker}.KL`,
          company_name: companyName,
          peers: peers
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch comparison');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare');
    } finally {
      setLoading(false);
    }
  };

  const getStanceColor = (stance: string) => {
    switch (stance) {
      case 'positive': return '#10b981';
      case 'negative': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  const getStanceBg = (stance: string) => {
    switch (stance) {
      case 'positive': return '#d1fae5';
      case 'negative': return '#fee2e2';
      default: return '#fef3c7';
    }
  };

  // Mini line chart component
  const MiniLineChart: React.FC<{ company: PeerData }> = ({ company }) => {
    const width = 240;
    const height = 120;
    const padding = 20;

    const points = [
      { value: company.positive_percentage, color: '#10b981', label: 'Positive' },
      { value: company.adverse_percentage, color: '#ef4444', label: 'Adverse' },
      { value: company.trend_percentage, color: '#f59e0b', label: 'Trend' }
    ];

    const maxValue = 100;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    return (
      <svg width={width} height={height}>
        {/* Connecting line */}
        <polyline
          points={points.map((p, i) => {
            const x = padding + (i * chartWidth / 2);
            const y = height - padding - (p.value / maxValue * chartHeight);
            return `${x},${y}`;
          }).join(' ')}
          fill="none"
          stroke="#d1d5db"
          strokeWidth="2"
        />

        {/* Points */}
        {points.map((point, i) => {
          const x = padding + (i * chartWidth / 2);
          const y = height - padding - (point.value / maxValue * chartHeight);
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r="6"
                fill={point.color}
              />
              <text
                x={x}
                y={y - 12}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill={point.color}
              >
                {point.value}%
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  // Company Card Component
  const CompanyCard: React.FC<{
    company: PeerData & { company_name?: string };
    isMain?: boolean;
    position: 'left' | 'center' | 'right';
  }> = ({ company, isMain = false, position }) => {
    const isCenter = position === 'center';

    return (
      <div style={{
        background: 'white',
        borderRadius: isCenter ? '16px' : '12px',
        padding: isCenter ? '32px' : '24px',
        border: isCenter ? '2px solid #111827' : '1px solid #e5e7eb',
        boxShadow: isCenter ? '0 10px 25px -5px rgba(0, 0, 0, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        transform: isCenter ? 'scale(1.05)' : 'scale(1)',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        minHeight: isCenter ? '280px' : '240px',
        justifyContent: 'space-between'
      }}>
        {/* Company Name */}
        <div style={{ width: '100%' }}>
          <h3 style={{
            fontSize: isCenter ? '24px' : '18px',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '8px'
          }}>
            {company.company_name || company.ticker}
          </h3>
          {isMain && (
            <p style={{
              fontSize: '12px',
              color: '#6b7280',
              fontWeight: '500',
              marginBottom: '16px'
            }}>
              Main Company
            </p>
          )}
        </div>

        {/* Sentiment Badge */}
        <div style={{
          padding: isCenter ? '12px 24px' : '8px 16px',
          background: getStanceBg(company.overall_stance),
          color: getStanceColor(company.overall_stance),
          borderRadius: '8px',
          fontSize: isCenter ? '16px' : '14px',
          fontWeight: '700',
          textTransform: 'uppercase',
          marginBottom: '24px',
          letterSpacing: '0.5px'
        }}>
          {company.overall_stance}
        </div>

        {/* Mini Line Chart */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '16px'
        }}>
          <MiniLineChart company={company} />
        </div>

        {/* Legend */}
        <div style={{
          display: 'flex',
          gap: '12px',
          fontSize: '11px',
          color: '#6b7280',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
            <span>Positive</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
            <span>Adverse</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
            <span>Trend</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#111827',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading comparison...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '500px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '8px'
          }}>
            Error Loading Comparison
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            {error}
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '10px 20px',
              background: '#111827',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Arrange companies: left peer, main company (center), right peer
  const leftPeer = data.peers[0];
  const mainCompany = data.main_company;
  const rightPeer = data.peers[1];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f9fafb',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '48px'
        }}>
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '8px'
            }}>
              Peer Comparison
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#6b7280'
            }}>
              Compare sentiment and signal distribution
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '10px 20px',
              background: 'white',
              color: '#111827',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f9fafb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
            }}
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Three Cards Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.2fr 1fr',
          gap: '24px',
          alignItems: 'center',
          marginBottom: '48px'
        }}>
          {/* Left Peer */}
          {leftPeer && (
            <CompanyCard
              company={leftPeer}
              position="left"
            />
          )}

          {/* Main Company (Center - Larger) */}
          <CompanyCard
            company={mainCompany}
            isMain={true}
            position="center"
          />

          {/* Right Peer */}
          {rightPeer && (
            <CompanyCard
              company={rightPeer}
              position="right"
            />
          )}
        </div>

      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Floating Chatbot */}
      <FloatingChatbot />
    </div>
  );
}
