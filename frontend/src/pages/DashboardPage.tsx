import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';


interface CompanyInfo {
  company_name: string | null;
  ticker: string | null;
  sector: string | null;
  peers: string[];
}

interface AggregatedAnalysis {
  ticker: string | null;
  company_name: string | null;
  sector: string | null;
  overall_stance: string;
  weighted_confidence: number;
  signal_strength: string;
  positive_signals: {
    count: number;
    signals: string[];
  };
  adverse_signals: {
    count: number;
    signals: string[];
  };
  trend_signals: {
    count: number;
    signals: string[];
  };
  macro_analysis: {
    stance: string;
    confidence: number;
    summary: string;
    articles_count: number;
  };
  micro_analysis: {
    stance: string;
    confidence: number;
    summary: string;
    articles_count: number;
  };
  total_articles_analyzed: number;
}

interface PeerComparison {
  ticker: string;
  company_name?: string;
  positive_percentage: number;
  adverse_percentage: number;
  trend_percentage: number;
  overall_stance: string;
}

interface ComparisonData {
  main_company: PeerComparison;
  peers: PeerComparison[];
}

/**
 * Dashboard page showing macro and micro RAG signals.
 * Matches the existing dark mode ChatGPT-style UI.
 */
export const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // New state for ticker-based analysis
  const [userInput, setUserInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [analysis, setAnalysis] = useState<AggregatedAnalysis | null>(null);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [loadingComparison, setLoadingComparison] = useState(false);

  useEffect(() => {
    // Don't auto-fetch on mount - let user input company first
  }, []);

  const handleAnalyzeCompany = async () => {
    if (!userInput.trim()) {
      setError('Please enter a company name or ticker');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setAnalysis(null);
    setCompanyInfo(null);

    try {
      const response = await fetch('/api/dashboard/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_input: userInput }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze company');
      }

      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        setCompanyInfo(data.company_info);
        return;
      }

      setCompanyInfo(data.company_info);
      setAnalysis(data.analysis);
      
      // Fetch peer comparison if peers are available
      if (data.company_info && data.company_info.peers && data.company_info.peers.length > 0) {
        fetchPeerComparison(data.company_info.ticker, data.company_info.company_name, data.company_info.peers);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setAnalyzing(false);
    }
  };

  const fetchPeerComparison = async (ticker: string | null, companyName: string | null, peers: string[]) => {
    if (!ticker || !peers || peers.length === 0) {
      return;
    }

    setLoadingComparison(true);
    try {
      const response = await fetch('/api/dashboard/compare-peers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticker: ticker,
          company_name: companyName,
          peers: peers.slice(0, 2) // Only 2 peers
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to compare with peers');
      }

      const data = await response.json();
      setComparison(data);
    } catch (err) {
      console.error('Error fetching peer comparison:', err);
      // Don't show error to user, just log it
    } finally {
      setLoadingComparison(false);
    }
  };

  const getStanceColor = (stance: string) => {
    const stanceLower = stance.toLowerCase();
    if (stanceLower.includes('risk_on') || stanceLower.includes('positive')) {
      return '#10a37f'; // Green
    } else if (stanceLower.includes('risk_off') || stanceLower.includes('negative')) {
      return '#ef4444'; // Red
    } else if (stanceLower.includes('neutral')) {
      return '#f59e0b'; // Yellow/Orange
    } else if (stanceLower.includes('error')) {
      return '#8e8ea0'; // Gray
    }
    return '#8e8ea0';
  };

  const getStanceLabel = (stance: string) => {
    const stanceLower = stance.toLowerCase();
    if (stanceLower.includes('risk_on') || stanceLower.includes('positive')) {
      return 'BUY';
    } else if (stanceLower.includes('risk_off') || stanceLower.includes('negative')) {
      return 'SELL';
    } else if (stanceLower.includes('neutral')) {
      return 'HOLD';
    } else if (stanceLower.includes('error')) {
      return 'ERROR';
    }
    return stance.toUpperCase();
  };

  if (loading || analyzing) {
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
          {analyzing ? 'Analyzing company...' : 'Loading dashboard data...'}
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

  const getSentimentPosition = (stance: string) => {
    // Convert stance to position on Bearish-Bullish scale (0-100%)
    const stanceLower = stance.toLowerCase();
    if (stanceLower.includes('risk_off') || stanceLower.includes('negative') || stanceLower.includes('adverse')) {
      return 20; // Bearish side
    } else if (stanceLower.includes('risk_on') || stanceLower.includes('positive')) {
      return 80; // Bullish side
    } else {
      return 50; // Neutral/Cautious
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      padding: '32px 24px',
      color: '#1f2937'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '40px'
        }}>
          <div>
            <h1 style={{
              fontSize: '36px',
              fontWeight: '700',
              margin: '0 0 8px 0',
              color: '#111827'
            }}>
              Market Signals Dashboard
            </h1>
            {analysis && (
              <p style={{
                fontSize: '18px',
                color: '#4b5563',
                margin: '0 0 16px 0'
              }}>
                {analysis.company_name || 'Company'} ({analysis.ticker || 'N/A'}) - Comprehensive Market Intelligence
              </p>
            )}
            {!analysis && (
              <p style={{
                fontSize: '18px',
                color: '#4b5563',
                margin: '0 0 16px 0'
              }}>
                Comprehensive Market Intelligence
              </p>
            )}
          </div>
          <div style={{
            textAlign: 'right'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
              color: '#6b7280',
              fontSize: '14px'
            }}>
              <span>🕐</span>
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
            {analysis && (
              <div style={{
                color: '#111827',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {analysis.positive_signals.count + analysis.adverse_signals.count + analysis.trend_signals.count} Active Signals
              </div>
            )}
            <Link
              to="/"
              style={{
                display: 'inline-block',
                marginTop: '12px',
                padding: '8px 16px',
                backgroundColor: '#f3f4f6',
                color: '#111827',
                textDecoration: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                border: '1px solid #d1d5db',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
            >
              ← Back
            </Link>
          </div>
        </div>

        {/* Company Input Section */}
        <div style={{
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            margin: '0 0 16px 0',
            color: '#111827'
          }}>
            Analyze Company
          </h2>
          <div style={{
            display: 'flex',
            gap: '12px'
          }}>
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAnalyzeCompany();
                }
              }}
              placeholder="Enter company name or ticker (e.g., 'WASCO', 'DELEUM', 'DAYANG', 'KEYFIELD')"
              style={{
                flex: 1,
                padding: '12px 16px',
                backgroundColor: '#ffffff',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                color: '#111827',
                fontSize: '15px',
                outline: 'none'
              }}
            />
            <button
              onClick={handleAnalyzeCompany}
              disabled={analyzing || !userInput.trim()}
              style={{
                padding: '12px 24px',
                backgroundColor: analyzing || !userInput.trim() ? '#d1d5db' : '#10a37f',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: analyzing || !userInput.trim() ? 'not-allowed' : 'pointer',
                fontSize: '15px',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
            >
              {analyzing ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '16px',
            backgroundColor: '#fee2e2',
            borderRadius: '8px',
            marginBottom: '24px',
            color: '#991b1b',
            border: '1px solid #fecaca'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Overall Sentiment Section */}
        {analysis && (
          <div style={{
            marginBottom: '40px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              margin: '0 0 16px 0',
              color: '#111827'
            }}>
              Overall Sentiment
            </h2>
            <div style={{
              position: 'relative',
              padding: '20px 0'
            }}>
              {/* Bearish-Bullish Bar */}
              <div style={{
                position: 'relative',
                height: '8px',
                backgroundColor: '#e5e7eb',
                borderRadius: '4px',
                marginBottom: '40px'
              }}>
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: '-6px',
                  fontSize: '12px',
                  color: '#6b7280',
                  fontWeight: '500'
                }}>
                  Bearish
                </div>
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '-6px',
                  fontSize: '12px',
                  color: '#6b7280',
                  fontWeight: '500'
                }}>
                  Bullish
                </div>
                
                {/* Sentiment Indicator */}
                <div style={{
                  position: 'absolute',
                  left: `${getSentimentPosition(analysis.overall_stance)}%`,
                  top: '-32px',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <div style={{
                    fontSize: '24px'
                  }}>
                    ⚠️
                  </div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#f59e0b',
                    whiteSpace: 'nowrap'
                  }}>
                    {analysis.signal_strength === 'positive' ? 'BULLISH' : 
                     analysis.signal_strength === 'adverse' ? 'BEARISH' : 'CAUTIOUS'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Latest Key Developments */}
        {analysis && (
          <div style={{
            marginBottom: '40px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px'
            }}>
              <span style={{ fontSize: '20px' }}>⚙️</span>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                margin: 0,
                color: '#111827'
              }}>
                Latest Key Developments
              </h2>
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {/* Adverse Signals as CRITICAL/WATCH */}
              {analysis.adverse_signals.signals.slice(0, 2).map((signal, idx) => {
                const severity = idx === 0 ? 'CRITICAL' : 'WATCH';
                const isCritical = severity === 'CRITICAL';
                return (
                  <div
                    key={`adverse-${idx}`}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      padding: '20px',
                      border: `1px solid ${isCritical ? '#fecaca' : '#fef3c7'}`,
                      display: 'flex',
                      gap: '16px',
                      alignItems: 'flex-start'
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '6px',
                      backgroundColor: isCritical ? '#fee2e2' : '#fef3c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isCritical ? (
                        <span style={{ fontSize: '20px' }}>📉</span>
                      ) : (
                        <span style={{ fontSize: '20px' }}>⚠️</span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '8px'
                      }}>
                        <h3 style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          margin: 0,
                          color: '#111827'
                        }}>
                          {signal.substring(0, 50)}...
                        </h3>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          backgroundColor: isCritical ? '#fee2e2' : '#fef3c7',
                          color: isCritical ? '#991b1b' : '#92400e',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {severity}
                        </span>
                      </div>
                      <p style={{
                        fontSize: '14px',
                        color: '#4b5563',
                        margin: '0 0 12px 0',
                        lineHeight: '1.5'
                      }}>
                        {signal}
                      </p>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        fontSize: '12px',
                        color: '#6b7280'
                      }}>
                        <div style={{
                          display: 'flex',
                          gap: '4px',
                          alignItems: 'center'
                        }}>
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: i < 4 ? '#111827' : '#e5e7eb'
                              }}
                            />
                          ))}
                        </div>
                        <span>Source: News Analysis</span>
                        <span>•</span>
                        <span>Recent</span>
                      </div>
                      <p style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        margin: '8px 0 0 0',
                        fontStyle: 'italic'
                      }}>
                        Direct impact on {analysis.sector || 'sector'} performance and competitive positioning
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Positive Signals as OPPORTUNITY */}
              {analysis.positive_signals.signals.slice(0, 1).map((signal, idx) => (
                <div
                  key={`positive-${idx}`}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    padding: '20px',
                    border: '1px solid #d1fae5',
                    display: 'flex',
                    gap: '16px',
                    alignItems: 'flex-start'
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '6px',
                    backgroundColor: '#d1fae5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <span style={{ fontSize: '20px' }}>✅</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        margin: 0,
                        color: '#111827'
                      }}>
                        {signal.substring(0, 50)}...
                      </h3>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        backgroundColor: '#d1fae5',
                        color: '#065f46',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        OPPORTUNITY
                      </span>
                    </div>
                    <p style={{
                      fontSize: '14px',
                      color: '#4b5563',
                      margin: '0 0 12px 0',
                      lineHeight: '1.5'
                    }}>
                      {signal}
                    </p>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      <div style={{
                        display: 'flex',
                        gap: '4px',
                        alignItems: 'center'
                      }}>
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: i < 3 ? '#111827' : '#e5e7eb'
                            }}
                          />
                        ))}
                      </div>
                      <span>Source: News Analysis</span>
                      <span>•</span>
                      <span>Recent</span>
                    </div>
                    <p style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      margin: '8px 0 0 0',
                      fontStyle: 'italic'
                    }}>
                      Could offset concerns and support growth in {analysis.sector || 'sector'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Industry Trends & Macro Context */}
        {analysis && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '32px',
            marginBottom: '40px'
          }}>
            {/* Industry Trends */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px'
              }}>
                <span style={{ fontSize: '18px' }}>📄</span>
                <h2 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  margin: 0,
                  color: '#111827'
                }}>
                  Industry Trends
                </h2>
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '4px',
                      backgroundColor: '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span>📈</span>
                    </div>
                    <span style={{
                      fontSize: '14px',
                      color: '#111827',
                      fontWeight: '500'
                    }}>
                      Sector Growth
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{
                      fontSize: '14px',
                      color: '#111827'
                    }}>
                      {analysis.positive_signals.count > analysis.adverse_signals.count ? 'Positive momentum' : 'Mixed signals'}
                    </span>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: analysis.positive_signals.count > analysis.adverse_signals.count ? '#10b981' : '#f59e0b'
                    }} />
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '4px',
                      backgroundColor: '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span>💼</span>
                    </div>
                    <span style={{
                      fontSize: '14px',
                      color: '#111827',
                      fontWeight: '500'
                    }}>
                      Competition
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{
                      fontSize: '14px',
                      color: '#111827'
                    }}>
                      {analysis.adverse_signals.count > 0 ? 'Intensifying' : 'Stable'}
                    </span>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: analysis.adverse_signals.count > 0 ? '#ef4444' : '#10b981'
                    }} />
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '4px',
                      backgroundColor: '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span>📊</span>
                    </div>
                    <span style={{
                      fontSize: '14px',
                      color: '#111827',
                      fontWeight: '500'
                    }}>
                      Market Conditions
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{
                      fontSize: '14px',
                      color: '#111827'
                    }}>
                      {analysis.signal_strength === 'positive' ? 'Favorable' : analysis.signal_strength === 'adverse' ? 'Challenging' : 'Neutral'}
                    </span>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: analysis.signal_strength === 'positive' ? '#10b981' : analysis.signal_strength === 'adverse' ? '#ef4444' : '#f59e0b'
                    }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Macro Context */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px'
              }}>
                <span style={{ fontSize: '18px' }}>🌍</span>
                <h2 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  margin: 0,
                  color: '#111827'
                }}>
                  Macro Context
                </h2>
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div style={{
                  padding: '12px 0',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginBottom: '4px'
                  }}>
                    Interest Rates
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#111827',
                    fontWeight: '500'
                  }}>
                    Neutral for {analysis.sector || 'sector'} investments
                  </div>
                </div>

                <div style={{
                  padding: '12px 0',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginBottom: '4px'
                  }}>
                    Economic Conditions
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#111827',
                    fontWeight: '500'
                  }}>
                    {analysis.macro_analysis.summary.substring(0, 60)}...
                  </div>
                </div>

                <div style={{
                  padding: '12px 0',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginBottom: '4px'
                  }}>
                    Market Sentiment
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#111827',
                    fontWeight: '500'
                  }}>
                    {analysis.signal_strength === 'positive' ? 'Bullish' : analysis.signal_strength === 'adverse' ? 'Bearish' : 'Cautious'}
                  </div>
                </div>

                <div style={{
                  padding: '12px 0'
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginBottom: '4px'
                  }}>
                    Policy Environment
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#111827',
                    fontWeight: '500'
                  }}>
                    {analysis.positive_signals.count > analysis.adverse_signals.count ? 'Supportive' : 'Mixed'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Peer Comparison Card */}
        {comparison && comparison.peers.length > 0 && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            marginTop: '40px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '24px'
            }}>
              <span style={{ fontSize: '20px' }}>📊</span>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                margin: 0,
                color: '#111827'
              }}>
                Peer Comparison
              </h2>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              {/* Main Company */}
              <div style={{
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    margin: 0,
                    color: '#111827'
                  }}>
                    {comparison.main_company.company_name || comparison.main_company.ticker}
                  </h3>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    backgroundColor: comparison.main_company.overall_stance === 'positive' ? '#d1fae5' : 
                                   comparison.main_company.overall_stance === 'negative' ? '#fee2e2' : '#fef3c7',
                    color: comparison.main_company.overall_stance === 'positive' ? '#065f46' : 
                           comparison.main_company.overall_stance === 'negative' ? '#991b1b' : '#92400e',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {comparison.main_company.overall_stance.toUpperCase()}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  gap: '24px'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      marginBottom: '4px'
                    }}>
                      Positive
                    </div>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      color: '#10b981'
                    }}>
                      {comparison.main_company.positive_percentage}%
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      marginBottom: '4px'
                    }}>
                      Adverse
                    </div>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      color: '#ef4444'
                    }}>
                      {comparison.main_company.adverse_percentage}%
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      marginBottom: '4px'
                    }}>
                      Trend
                    </div>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      color: '#f59e0b'
                    }}>
                      {comparison.main_company.trend_percentage}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Peer Companies */}
              {comparison.peers.map((peer, idx) => (
                <div key={idx} style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      margin: 0,
                      color: '#111827'
                    }}>
                      {peer.company_name || peer.ticker}
                    </h3>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      backgroundColor: peer.overall_stance === 'positive' ? '#d1fae5' : 
                                     peer.overall_stance === 'negative' ? '#fee2e2' : '#fef3c7',
                      color: peer.overall_stance === 'positive' ? '#065f46' : 
                             peer.overall_stance === 'negative' ? '#991b1b' : '#92400e',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {peer.overall_stance.toUpperCase()}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '24px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        marginBottom: '4px'
                      }}>
                        Positive
                      </div>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: '600',
                        color: '#10b981'
                      }}>
                        {peer.positive_percentage}%
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        marginBottom: '4px'
                      }}>
                        Adverse
                      </div>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: '600',
                        color: '#ef4444'
                      }}>
                        {peer.adverse_percentage}%
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        marginBottom: '4px'
                      }}>
                        Trend
                      </div>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: '600',
                        color: '#f59e0b'
                      }}>
                        {peer.trend_percentage}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loadingComparison && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            marginTop: '40px',
            border: '1px solid #e5e7eb',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            Comparing with peers...
          </div>
        )}
      </div>
    </div>
  );
};

