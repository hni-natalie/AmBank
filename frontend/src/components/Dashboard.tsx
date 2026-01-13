import React, { useState, useEffect } from 'react';

interface Company {
  name: string;
  code: string;
  sector: string;
  last_done?: number;
  change_points?: number;
  change_percent?: number;
  annual_revenue?: number;
  annual_net?: number;
  annual_eps?: number;
  financial_year?: string;
  watchlist?: boolean;
}

interface DashboardProps {
  decision: {
    decision: string;
    confidence: number;
    reasoning: string[];
  } | null;
}

/**
 * Dashboard component - displays decision overview and watchlist.
 * ChatGPT-style dark mode.
 */
export const Dashboard: React.FC<DashboardProps> = ({ decision }) => {
  const [watchlistCompanies, setWatchlistCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/company/watchlist');
      if (response.ok) {
        const data = await response.json();
        setWatchlistCompanies(data.companies || []);
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num?: number | null): string => {
    if (num === null || num === undefined) return '-';
    return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  const formatPercent = (num?: number | null): string => {
    if (num === null || num === undefined) return '-';
    return `${num.toFixed(2)}%`;
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

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
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '24px 20px',
      backgroundColor: '#343541',
      minHeight: '100vh'
    }}>
      {/* Watchlist Section */}
      <div style={{
        marginBottom: '40px',
        backgroundColor: '#444654',
        borderRadius: '8px',
        padding: '24px',
        border: '1px solid #565869'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <span style={{ fontSize: '24px', color: '#FFD700' }}>⭐</span>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#ececf1',
            margin: 0
          }}>
            My Watchlist
          </h2>
          <span style={{
            fontSize: '14px',
            color: '#8e8ea0',
            backgroundColor: '#565869',
            padding: '4px 12px',
            borderRadius: '12px'
          }}>
            {watchlistCompanies.length} {watchlistCompanies.length === 1 ? 'company' : 'companies'}
          </span>
        </div>

        {loading && watchlistCompanies.length === 0 ? (
          <div style={{ color: '#8e8ea0', textAlign: 'center', padding: '20px' }}>
            Loading watchlist...
          </div>
        ) : watchlistCompanies.length === 0 ? (
          <div style={{ color: '#8e8ea0', textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>☆</div>
            <div style={{ fontSize: '16px', marginBottom: '8px' }}>No companies in watchlist</div>
            <div style={{ fontSize: '14px', opacity: 0.7 }}>Click the star icon on any company to add it to your watchlist</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #565869' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#8e8ea0', fontWeight: '600' }}>Company</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#8e8ea0', fontWeight: '600' }}>Code</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#8e8ea0', fontWeight: '600' }}>Sector</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#8e8ea0', fontWeight: '600' }}>Last Done</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#8e8ea0', fontWeight: '600' }}>Change</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#8e8ea0', fontWeight: '600' }}>FY</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#8e8ea0', fontWeight: '600' }}>Revenue ('000)</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#8e8ea0', fontWeight: '600' }}>Net ('000)</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#8e8ea0', fontWeight: '600' }}>EPS</th>
                </tr>
              </thead>
              <tbody>
                {watchlistCompanies.map((company, index) => (
                  <tr 
                    key={company.code}
                    style={{
                      borderBottom: '1px solid #565869',
                      backgroundColor: index % 2 === 0 ? '#444654' : '#3e3f4b'
                    }}
                  >
                    <td style={{ padding: '12px', color: '#ececf1', fontWeight: '500' }}>
                      <span style={{ color: '#FFD700', marginRight: '8px' }}>⭐</span>
                      {company.name}
                    </td>
                    <td style={{ padding: '12px', color: '#ececf1' }}>{company.code}</td>
                    <td style={{ padding: '12px', color: '#8e8ea0', fontSize: '13px' }}>{company.sector}</td>
                    <td style={{ padding: '12px', color: '#ececf1', textAlign: 'right' }}>{formatNumber(company.last_done)}</td>
                    <td style={{
                      padding: '12px',
                      textAlign: 'right',
                      color: (company.change_points ?? 0) >= 0 ? '#10a37f' : '#ef4444',
                      fontWeight: '500'
                    }}>
                      {company.change_points !== null && company.change_points !== undefined ? (
                        <>
                          {company.change_points >= 0 ? '+' : ''}{formatNumber(company.change_points)}
                          {' '}({formatPercent(company.change_percent)})
                        </>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '12px', color: '#8e8ea0', textAlign: 'right', fontSize: '13px' }}>
                      {company.financial_year || '-'}
                    </td>
                    <td style={{ padding: '12px', color: '#ececf1', textAlign: 'right' }}>{formatNumber(company.annual_revenue)}</td>
                    <td style={{ padding: '12px', color: '#ececf1', textAlign: 'right' }}>{formatNumber(company.annual_net)}</td>
                    <td style={{ padding: '12px', color: '#ececf1', textAlign: 'right' }}>{formatNumber(company.annual_eps)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Decision Section */}
      {decision && (
        <div style={{
          backgroundColor: '#444654',
          borderRadius: '8px',
          padding: '24px',
          border: '1px solid #565869'
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
      )}
    </div>
  );
};

