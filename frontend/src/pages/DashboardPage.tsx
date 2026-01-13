import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { analyzeUserInput, searchCompany, DashboardResponse, CompanySnapshot } from '../api/dashboard';
import QuickSnapshot from '../components/dashboard/QuickSnapshot';
import { SignalCard } from '../components/SignalCard';
import { NotionAI } from '../components/NotionAI';
import { FloatingAIButton } from '../components/FloatingAIButton';


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
  details?: any[];
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
  const navigate = useNavigate();
  const storeInput = useAppStore((state) => state.userInput);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data States
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [snapshotData, setSnapshotData] = useState<CompanySnapshot | null>(null);
  
  // UI States
  const [marketSignalsOpen, setMarketSignalsOpen] = useState(true);

  const ticker = storeInput?.ticker;
  const rawInputName = storeInput?.companyName; // Fallback if needed

  // New state for ticker-based analysis
  const [userInput, setUserInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [analysis, setAnalysis] = useState<AggregatedAnalysis | null>(null);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [loadingComparison, setLoadingComparison] = useState(false);

  // Notion AI state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiContext, setAiContext] = useState<{
    ticker: string;
    signal: string;
    signalType: string;
    details?: any[];
    analysis?: any;
    company_name?: string;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      console.log('[Dashboard] Ticker from store:', ticker);

      if (!ticker) {
        // No ticker, don't auto-fetch.
        return;
      }

      setLoading(true);
      setError(null);
      setDashboardData(null);
      setSnapshotData(null);

      try {
        // Parallel Fetch: Analysis (Left) + Snapshot (Right)
        const [analysisRes, snapshotRes] = await Promise.all([
          analyzeUserInput(ticker),
          searchCompany(ticker)
        ]);

        console.log('[Dashboard] Analysis:', analysisRes);
        console.log('[Dashboard] Snapshot:', snapshotRes);

        setDashboardData(analysisRes);
        setSnapshotData(snapshotRes);
        
        if (analysisRes.error) {
          setError(analysisRes.error);
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
  const analysis = dashboardData?.analysis;
  const companyInfo = dashboardData?.companyInfo;

  // Empty State / Redirect Prompt
  if (!ticker && !loading && !dashboardData) {
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

  // --- Helper Logic ---

  const getSentimentScore = (stance: string, confidence: number = 0.5): number => {
    // Map stance to rough score 0-100
    const stanceLower = stance.toLowerCase();
    let baseScore = 50;
    
    if (stanceLower.includes('positive') || stanceLower.includes('risk_on')) {
      baseScore = 75 + (confidence * 20); // 75-95
    } else if (stanceLower.includes('negative') || stanceLower.includes('risk_off') || stanceLower.includes('adverse')) {
      baseScore = 25 - (confidence * 15); // 10-25
    } else {
      baseScore = 50; // Neutral
    }
    
    return Math.round(baseScore);
  };

  const getTrendColor = (isPositive: boolean, isNegative: boolean) => {
    if (isPositive && !isNegative) return '#10b981'; // Green
    if (isNegative && !isPositive) return '#ef4444'; // Red
    return '#f59e0b'; // Yellow/Neutral
  };

  // Safe values with defaults
  const overallStance = analysis?.overallStance ?? 'neutral';
  // Use weightedConfidence from analysis (if exists) or default. 
  // Note: dashboard.ts type def might need update if we want exact confidence, 
  // but let's assume valid mock logic or field existence.
  const sentimentScore = getSentimentScore(overallStance, (analysis as any)?.weightedConfidence ?? 0.5);
  
  const positiveSignals = analysis?.positiveSignals ?? { count: 0, signals: [] };
  const adverseSignals = analysis?.adverseSignals ?? { count: 0, signals: [] };
  const sector = companyInfo?.sector || 'Sector';
  const companyNameDisplay = companyInfo?.companyName || rawInputName || ticker || 'Company';
  const tickerDisplay = companyInfo?.ticker || ticker || 'N/A';

  // Computed gauge color
  let gaugeColor = '#f59e0b'; // yellow
  if (sentimentScore >= 70) gaugeColor = '#10b981'; // green
  if (sentimentScore <= 39) gaugeColor = '#ef4444'; // red

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
        {/* Header / Hero */}
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
              {companyNameDisplay}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                fontSize: '16px',
                color: '#4b5563',
                backgroundColor: '#f3f4f6',
                padding: '4px 12px',
                borderRadius: '6px',
                fontWeight: '600'
              }}>
                {tickerDisplay}
              </span>
              <span style={{ fontSize: '16px', color: '#6b7280' }}>
                {sector}
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Link
              to="/"
              style={{
                display: 'inline-block',
                padding: '8px 16px',
                backgroundColor: '#f3f4f6',
                color: '#111827',
                textDecoration: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                border: '1px solid #d1d5db',
                fontWeight: '500'
              }}
            >
              ← Back to Search
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

        {/* Main Content Grid (2 Columns: 75% left, 25% right) */}
        {dashboardData && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '3fr 1fr', // 75% left, 25% right
            gap: '40px',
            alignItems: 'start'
          }}>
            
            {/* LEFT COLUMN: Analysis Insights */}
            <div>
              {/* Speed Meter / Overall Sentiment */}
              {analysis && (
                <div style={{
                  marginBottom: '48px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'column'
                }}>
                  <div style={{ position: 'relative', width: '300px', height: '160px', overflow: 'hidden' }}>
                    {/* Gauge Background */}
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '300px',
                      height: '150px',
                      borderRadius: '150px 150px 0 0',
                      backgroundColor: '#e5e7eb'
                    }} />
                    {/* Gauge Fill */}
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: '50%',
                      transformOrigin: 'bottom center',
                      transform: `translateX(-50%) rotate(${(sentimentScore / 100) * 180 - 180}deg)`,
                      width: '300px',
                      height: '150px',
                      borderRadius: '150px 150px 0 0',
                      backgroundColor: gaugeColor,
                      transition: 'transform 1s ease-out, background-color 0.5s'
                    }} />
                    
                    {/* Center Value */}
                    <div style={{
                      position: 'absolute',
                      bottom: '0',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      textAlign: 'center',
                      zIndex: 10
                    }}>
                      <div style={{
                        fontSize: '48px',
                        fontWeight: '800',
                        color: '#111827',
                        lineHeight: '1'
                      }}>
                        {sentimentScore}%
                      </div>
                    </div>
                  </div>
                  {/* Label below gauge */}
                  <div style={{
                    marginTop: '16px',
                    fontSize: '18px',
                    fontWeight: '700',
                    color: gaugeColor,
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    {overallStance.replace('_', ' ')}
                  </div>
                </div>
              )}

              {/* Market Signals (Toggle) */}
              {analysis && (
                <div style={{
                  marginBottom: '40px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}>
                  <div 
                    onClick={() => setMarketSignalsOpen(!marketSignalsOpen)}
                    style={{
                      backgroundColor: '#f9fafb',
                      padding: '20px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>⚡</span>
                        <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#111827' }}>
                          Market Signals
                        </h2>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{
                          backgroundColor: '#dcfce7',
                          color: '#15803d',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '14px',
                          fontWeight: '700'
                        }}>
                          + {positiveSignals.count}
                        </span>
                        <span style={{
                          backgroundColor: '#fee2e2',
                          color: '#b91c1c',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '14px',
                          fontWeight: '700'
                        }}>
                          - {adverseSignals.count}
                        </span>
                      </div>
                    </div>
                    <div style={{
                      transform: marketSignalsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                      color: '#6b7280'
                    }}>
                      ▼
                    </div>
                  </div>

                  {marketSignalsOpen && (
                    <div style={{ padding: '24px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {/* Positive Column */}
                      <div>
                        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#15803d', marginBottom: '8px', textTransform: 'uppercase' }}>
                          Positive Signals
                        </h3>
                        {positiveSignals.signals.length === 0 && (
                          <div style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '14px' }}>None detected</div>
                        )}
                        <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {positiveSignals.signals.map((signal, idx) => (
                            <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                              <span style={{ color: '#10b981', marginTop: '4px' }}>●</span>
                              <span style={{ fontSize: '14px', color: '#374151', lineHeight: '1.5' }}>{signal}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Negative Column */}
                      <div>
                        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#b91c1c', marginBottom: '8px', textTransform: 'uppercase' }}>
                          Negative Signals
                        </h3>
                        {adverseSignals.signals.length === 0 && (
                          <div style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '14px' }}>None detected</div>
                        )}
                        <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {adverseSignals.signals.map((signal, idx) => (
                            <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                              <span style={{ color: '#ef4444', marginTop: '4px' }}>●</span>
                              <span style={{ fontSize: '14px', color: '#374151', lineHeight: '1.5' }}>{signal}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Industry Trends & Macro Context */}
              {analysis && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '32px'
                }}>
                  {/* Industry Trends */}
                  <div style={{ backgroundColor: '#f9fafb', padding: '24px', borderRadius: '12px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '20px'
                    }}>
                      <span style={{ fontSize: '18px' }}>📈</span>
                      <h2 style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        margin: 0,
                        color: '#111827'
                      }}>
                        Industry Trends
                      </h2>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* Sector Growth */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: '#4b5563', fontWeight: '500' }}>Sector Growth</span>
                        <div style={{
                          width: '32px',
                          height: '12px',
                          borderRadius: '6px',
                          backgroundColor: getTrendColor(positiveSignals.count > adverseSignals.count, adverseSignals.count > positiveSignals.count)
                        }} />
                      </div>
                      {/* Competition */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: '#4b5563', fontWeight: '500' }}>Competition</span>
                        <div style={{
                          width: '32px',
                          height: '12px',
                          borderRadius: '6px',
                          backgroundColor: getTrendColor(false, adverseSignals.count > 0) // Assume competition risk if adverse signals exist
                        }} />
                      </div>
                      {/* Market Conditions */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: '#4b5563', fontWeight: '500' }}>Market Conditions</span>
                        <div style={{
                          width: '32px',
                          height: '12px',
                          borderRadius: '6px',
                          backgroundColor: sentimentScore >= 60 ? '#10b981' : sentimentScore <= 40 ? '#ef4444' : '#f59e0b'
                        }} />
                      </div>
                    </div>
                  </div>

                  {/* Macro Context */}
                  <div style={{ backgroundColor: '#f9fafb', padding: '24px', borderRadius: '12px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '20px'
                    }}>
                      <span style={{ fontSize: '18px' }}>🌍</span>
                      <h2 style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        margin: 0,
                        color: '#111827'
                      }}>
                        Macro Context
                      </h2>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* Interest Rates */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: '#4b5563', fontWeight: '500' }}>Interest Rates</span>
                        <div style={{
                          width: '32px',
                          height: '12px',
                          borderRadius: '6px',
                          backgroundColor: '#f59e0b' // Neutral as default for now
                        }} />
                      </div>
                      {/* Economic Conditions */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: '#4b5563', fontWeight: '500' }}>Economic Conditions</span>
                        <div style={{
                          width: '32px',
                          height: '12px',
                          borderRadius: '6px',
                          backgroundColor: analysis.macroAnalysis?.summary?.toLowerCase().includes('positive') ? '#10b981' : '#f59e0b'
                        }} />
                      </div>
                      {/* Market Sentiment */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: '#4b5563', fontWeight: '500' }}>Market Sentiment</span>
                        <div style={{
                          width: '32px',
                          height: '12px',
                          borderRadius: '6px',
                          backgroundColor: gaugeColor
                        }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Quick Snapshot */}
            <div style={{
              position: 'sticky',
              top: '16px'
            }}>
              {snapshotData ? (
                <QuickSnapshot data={snapshotData} />
              ) : (
                <div style={{ 
                  backgroundColor: '#f9fafb', 
                  borderRadius: '12px', 
                  padding: '40px', 
                  textAlign: 'center',
                  border: '1px dashed #e5e7eb'
                }}>
                   <p style={{ color: '#6b7280' }}>Loading financial data...</p>
                </div>
              )}
            </div>
          
          </div>
        )}

        {/* Peer Comparison Button */}
        {analysis && !comparison && !loadingComparison && companyInfo && companyInfo.peers && companyInfo.peers.length > 0 && (
          <div style={{
            marginTop: '40px',
            textAlign: 'center'
          }}>
            <button
              onClick={() => {
                if (companyInfo) {
                  setLoadingComparison(true);
                  fetchPeerComparison(
                    companyInfo.company_name || '',
                    companyInfo.ticker || '',
                    companyInfo.peers
                  );
                }
              }}
              style={{
                padding: '12px 24px',
                backgroundColor: '#111827',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#374151';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#111827';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }}
            >
              📊 Compare with Peers
            </button>
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

        {/* Floating AI Button */}
        <FloatingAIButton onClick={handleOpenAI} />

        {/* Notion AI Panel */}
        <NotionAI
          isOpen={aiOpen}
          onClose={() => setAiOpen(false)}
          context={aiContext}
        />
      </div>

      {/* Media Queries for Mobile Responsiveness */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns: 3fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
