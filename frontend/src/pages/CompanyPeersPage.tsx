import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { PeerComparisonResponse } from '../api/dashboard';

/**
 * Peers Comparison Page - Shows comparison between company and peer companies
 */
export const CompanyPeersPage: React.FC = () => {
  const navigate = useNavigate();
  const storeInput = useAppStore((state) => state.userInput);
  const [comparison, setComparison] = useState<PeerComparisonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [peers, setPeers] = useState<string[]>([]);

  const ticker = storeInput?.ticker;
  const companyName = storeInput?.companyName;

  // Log peers for debugging
  console.log('[CompanyPeersPage] Fetched peers:', peers);

  useEffect(() => {
    const fetchComparison = async () => {
      if (!ticker) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // First, fetch peers list from company search endpoint
        const searchUrl = `/api/company/search?company_name=${encodeURIComponent(ticker)}`;
        const searchResponse = await fetch(searchUrl);
        
        if (!searchResponse.ok) {
          throw new Error('Failed to fetch company information');
        }
        
        const searchData = await searchResponse.json();
        // Backend returns peers at top level, or within company object
        const peersList = searchData.peers || searchData.company?.peers || [];
        console.log('[CompanyPeersPage] Fetched peersList:', peersList);
        setPeers(peersList);

        // If no peers found, show message
        if (!peersList || peersList.length === 0) {
          setError('No peer companies found for this ticker');
          setLoading(false);
          return;
        }

        // Then fetch peer comparison data from backend
        const response = await fetch('/api/dashboard/compare-peers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ticker: ticker,
            company_name: companyName || ticker, // Default to ticker if company_name is empty
            peers: peersList.slice(0, 3) // 3 peers
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch peer comparison');
        }

        const data: PeerComparisonResponse = await response.json();
        setComparison(data);
      } catch (err: any) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error('[Peers] Error:', msg);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [ticker, companyName]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #e5e7eb',
          borderTopColor: '#10a37f',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
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
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px' }}>📊</div>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937' }}>
          No Company Selected
        </h2>
        <p style={{ color: '#6b7280', maxWidth: '400px' }}>
          Please return to the dashboard to select a company first.
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#10a37f',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (error) {
    const isNoPeersError = error.includes('No peer') || error.includes('not found');
    
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
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px' }}>
          {isNoPeersError ? '🔍' : '⚠️'}
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937' }}>
          {isNoPeersError ? 'No Peer Companies Found' : 'Error Loading Comparison'}
        </h2>
        <p style={{ color: '#6b7280', maxWidth: '400px' }}>
          {isNoPeersError 
            ? `No peer companies are available for ${ticker || 'this company'}. Peer comparison requires at least one peer company in the same sector.`
            : error}
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
            cursor: 'pointer'
          }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      padding: '32px 24px',
      color: '#1f2937'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '40px',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '24px'
        }}>
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              margin: '0 0 8px 0',
              color: '#111827'
            }}>
              Peer Comparison
            </h1>
			
            <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>
              Compare {comparison?.base?.company_name || ticker} with peer companies
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              color: '#111827',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              border: '1px solid #d1d5db',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Comparison Cards */}
        {comparison && comparison.peers && comparison.peers.length > 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {/* Base Company Card */}
            {comparison.base && (
              <div style={{
                backgroundColor: '#f9fafb',
                borderRadius: '12px',
                padding: '24px',
                border: '2px solid #3b82f6',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <h2 style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    margin: 0,
                    color: '#111827'
                  }}>
                    {comparison.base.company_name} ({comparison.base.ticker})
                  </h2>
                  <span style={{
                    padding: '8px 16px',
                    borderRadius: '12px',
                    backgroundColor: '#d1fae5',
                    color: '#065f46',
                    fontSize: '13px',
                    fontWeight: '700'
                  }}>
                    BASE
                  </span>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '20px'
                }}>
                  {/* Positive Signals */}
                  <div>
                    <div style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      marginBottom: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      ✅ Positive ({comparison.base.signals.positive.length})
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#1f2937',
                      lineHeight: '1.6'
                    }}>
                      {comparison.base.signals.positive.length > 0 ? (
                        <ul style={{ margin: '0', paddingLeft: '20px' }}>
                          {comparison.base.signals.positive.map((signal, i) => (
                            <li key={i} style={{ marginBottom: '6px' }}>
                              {signal}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>No signals</span>
                      )}
                    </div>
                  </div>

                  {/* Adverse Signals */}
                  <div>
                    <div style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      marginBottom: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      ⚠️ Adverse ({comparison.base.signals.adverse.length})
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#1f2937',
                      lineHeight: '1.6'
                    }}>
                      {comparison.base.signals.adverse.length > 0 ? (
                        <ul style={{ margin: '0', paddingLeft: '20px' }}>
                          {comparison.base.signals.adverse.map((signal, i) => (
                            <li key={i} style={{ marginBottom: '6px' }}>
                              {signal}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>No signals</span>
                      )}
                    </div>
                  </div>

                  {/* Trend Signals */}
                  <div>
                    <div style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      marginBottom: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      📈 Trend ({comparison.base.signals.trend.length})
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#1f2937',
                      lineHeight: '1.6'
                    }}>
                      {comparison.base.signals.trend.length > 0 ? (
                        <ul style={{ margin: '0', paddingLeft: '20px' }}>
                          {comparison.base.signals.trend.map((signal, i) => (
                            <li key={i} style={{ marginBottom: '6px' }}>
                              {signal}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>No signals</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Peer Companies */}
            <div style={{ marginTop: '20px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                margin: '0 0 16px 0',
                color: '#111827'
              }}>
                Peer Companies ({comparison.peers.slice(0, 3).length})
              </h3>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                {comparison.peers.slice(0, 3).map((peer, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      padding: '20px',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px'
                    }}>
                      <h4 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        margin: 0,
                        color: '#111827'
                      }}>
                        {peer.company_name} ({peer.ticker})
                      </h4>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '6px',
                        backgroundColor: '#f3f4f6',
                        color: '#6b7280',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        PEER {idx + 1}
                      </span>
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: '16px'
                    }}>
                      {/* Positive Signals */}
                      <div>
                        <div style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          marginBottom: '10px',
                          fontWeight: '600',
                          textTransform: 'uppercase'
                        }}>
                          ✅ Positive ({peer.signals.positive.length})
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#1f2937',
                          lineHeight: '1.5'
                        }}>
                          {peer.signals.positive.length > 0 ? (
                            <ul style={{ margin: '0', paddingLeft: '18px' }}>
                              {peer.signals.positive.map((signal, i) => (
                                <li key={i} style={{ marginBottom: '4px' }}>
                                  {signal}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span style={{ color: '#9ca3af' }}>No signals</span>
                          )}
                        </div>
                      </div>

                      {/* Adverse Signals */}
                      <div>
                        <div style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          marginBottom: '10px',
                          fontWeight: '600',
                          textTransform: 'uppercase'
                        }}>
                          ⚠️ Adverse ({peer.signals.adverse.length})
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#1f2937',
                          lineHeight: '1.5'
                        }}>
                          {peer.signals.adverse.length > 0 ? (
                            <ul style={{ margin: '0', paddingLeft: '18px' }}>
                              {peer.signals.adverse.map((signal, i) => (
                                <li key={i} style={{ marginBottom: '4px' }}>
                                  {signal}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span style={{ color: '#9ca3af' }}>No signals</span>
                          )}
                        </div>
                      </div>

                      {/* Trend Signals */}
                      <div>
                        <div style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          marginBottom: '10px',
                          fontWeight: '600',
                          textTransform: 'uppercase'
                        }}>
                          📈 Trend ({peer.signals.trend.length})
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#1f2937',
                          lineHeight: '1.5'
                        }}>
                          {peer.signals.trend.length > 0 ? (
                            <ul style={{ margin: '0', paddingLeft: '18px' }}>
                              {peer.signals.trend.map((signal, i) => (
                                <li key={i} style={{ marginBottom: '4px' }}>
                                  {signal}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span style={{ color: '#9ca3af' }}>No signals</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
