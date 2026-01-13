import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { analyzeUserInput, DashboardResponse } from '../api/dashboard';

/**
 * Dashboard page showing macro and micro RAG signals.
 * Matches the existing dark mode ChatGPT-style UI.
 */
export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const storeInput = useAppStore((state) => state.userInput);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardResponse | null>(null);

  const ticker = storeInput?.ticker;
  const rawInputName = storeInput?.companyName; // Fallback if needed

  useEffect(() => {
    const fetchData = async () => {
      console.log('[Dashboard] Ticker from store:', ticker);

      if (!ticker) {
        // No ticker, don't auto-fetch.
        return;
      }

      setLoading(true);
      setError(null);
      setData(null);

      try {
        // We pass the ticker as the user input for the backend to identify/analyze
        const response = await analyzeUserInput(ticker);
        console.log('[Dashboard] analyzeUserInput response:', response);
        setData(response);
        
        if (response.error) {
          setError(response.error);
        }
      } catch (err: any) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.log('[Dashboard] error:', msg);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ticker]);

  // Safe extract analysis using the normalized shape
  const analysis = data?.analysis;
  const companyInfo = data?.companyInfo;

  // Empty State / Redirect Prompt
  if (!ticker && !loading && !data) {
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
        <div style={{ fontSize: '48px' }}>🔍</div>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937' }}>
          No Ticker Selected
        </h2>
        <p style={{ color: '#6b7280', maxWidth: '400px' }}>
          Please go back to the home page and enter a valid Bursa Malaysia ticker (e.g., MAYBANK).
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
          Go to Home
        </button>
      </div>
    );
  }

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
          Analyzing {ticker}...
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

  // Safe values with defaults, just in case
  const overallStance = analysis?.overallStance ?? 'neutral';
  const signalStrength = analysis?.signalStrength ?? 'neutral';
  const positiveSignals = analysis?.positiveSignals ?? { count: 0, signals: [] };
  const adverseSignals = analysis?.adverseSignals ?? { count: 0, signals: [] };
  const trendSignals = analysis?.trendSignals ?? { count: 0, signals: [] };
  const sector = companyInfo?.sector || 'Sector';
  // Use companyName from API, or fallback to name from store, or ticker
  const companyNameDisplay = companyInfo?.companyName || rawInputName || ticker || 'Company';
  const tickerDisplay = companyInfo?.ticker || ticker || 'N/A';

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
                {companyNameDisplay} ({tickerDisplay}) - Comprehensive Market Intelligence
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
                {positiveSignals.count + adverseSignals.count + trendSignals.count} Active Signals
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
                  left: `${getSentimentPosition(overallStance)}%`,
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
                    {signalStrength === 'positive' ? 'BULLISH' : 
                     signalStrength === 'adverse' ? 'BEARISH' : 'CAUTIOUS'}
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
              {adverseSignals.signals.slice(0, 2).map((signal, idx) => {
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
                        Direct impact on {sector} performance and competitive positioning
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Positive Signals as OPPORTUNITY */}
              {positiveSignals.signals.slice(0, 1).map((signal, idx) => (
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
                      Could offset concerns and support growth in {sector}
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
                      {positiveSignals.count > adverseSignals.count ? 'Positive momentum' : 'Mixed signals'}
                    </span>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: positiveSignals.count > adverseSignals.count ? '#10b981' : '#f59e0b'
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
                      {adverseSignals.count > 0 ? 'Intensifying' : 'Stable'}
                    </span>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: adverseSignals.count > 0 ? '#ef4444' : '#10b981'
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
                      {signalStrength === 'positive' ? 'Favorable' : signalStrength === 'adverse' ? 'Challenging' : 'Neutral'}
                    </span>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: signalStrength === 'positive' ? '#10b981' : signalStrength === 'adverse' ? '#ef4444' : '#f59e0b'
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
                    Neutral for {sector} investments
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
                    {analysis.macroAnalysis.summary.substring(0, 60)}...
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
                    {signalStrength === 'positive' ? 'Bullish' : signalStrength === 'adverse' ? 'Bearish' : 'Cautious'}
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
                    {positiveSignals.count > adverseSignals.count ? 'Supportive' : 'Mixed'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Debug Viewer */}
        <div style={{
          marginTop: '60px',
          padding: '20px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <details>
            <summary style={{
              cursor: 'pointer',
              fontWeight: '500',
              color: '#4b5563'
            }}>
              Debug: Raw API Response & State
            </summary>
            <div style={{ marginTop: '16px' }}>
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Store State:</h4>
                <pre style={{
                  fontSize: '12px',
                  backgroundColor: '#1f2937',
                  color: '#f3f4f6',
                  padding: '12px',
                  borderRadius: '6px',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(storeInput, null, 2)}
                </pre>
              </div>
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>API Response:</h4>
                <pre style={{
                  fontSize: '12px',
                  backgroundColor: '#1f2937',
                  color: '#f3f4f6',
                  padding: '12px',
                  borderRadius: '6px',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};
