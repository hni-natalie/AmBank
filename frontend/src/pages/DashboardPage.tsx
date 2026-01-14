import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { analyzeUserInput, searchCompany, DashboardResponse, CompanySnapshot } from '../api/dashboard';
import QuickSnapshot from '../components/dashboard/QuickSnapshot';
import { FloatingChatbot } from '../components/FloatingChatbot';

/**
 * Dashboard page showing macro and micro RAG signals.
 * Matches the existing dark mode ChatGPT-style UI.
 */
export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const storeInput = useAppStore((state) => state.userInput);
  const cachedDashboard = useAppStore((state) => state.cachedDashboard);
  const cachedSnapshot = useAppStore((state) => state.cachedSnapshot);
  const setCachedDashboard = useAppStore((state) => state.setCachedDashboard);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data States
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [snapshotData, setSnapshotData] = useState<CompanySnapshot | null>(null);

  // UI States
  const [marketSignalsOpen, setMarketSignalsOpen] = useState(false);

  const ticker = storeInput?.ticker;
  const rawInputName = storeInput?.companyName; // Fallback if needed

  useEffect(() => {
    const fetchData = async () => {
      console.log('[Dashboard] Ticker from store:', ticker);

      if (!ticker) {
        // No ticker, don't auto-fetch.
        return;
      }

      // Check if we have cached data for this ticker
      if (cachedDashboard && cachedDashboard.companyInfo.ticker === ticker) {
        console.log('[Dashboard] Using cached data');
        setDashboardData(cachedDashboard);
        setSnapshotData(cachedSnapshot);
        if (cachedDashboard.error) {
          setError(cachedDashboard.error);
        }
        return;
      }

      setLoading(true);
      setError(null);
      setDashboardData(null);
      setSnapshotData(null);

      try {
        console.log('[Dashboard] Starting fetch for ticker:', ticker);

        // Parallel Fetch: Analysis (Left) + Snapshot (Right)
        const [analysisRes, snapshotRes] = await Promise.all([
          analyzeUserInput(ticker),
          searchCompany(ticker)
        ]);

        console.log('[Dashboard] Analysis response:', analysisRes);
        console.log('[Dashboard] Snapshot response:', snapshotRes);

        // Extract peers from multiple possible locations
        const peersFromAnalysis = analysisRes?.companyInfo?.peers || [];
        const peersFromSnapshot = snapshotRes?.peers || [];
        const peers = peersFromAnalysis.length > 0 ? peersFromAnalysis : peersFromSnapshot;

        console.log('[Dashboard] Peers extracted - Analysis:', peersFromAnalysis, 'Snapshot:', peersFromSnapshot, 'Final:', peers);

        setDashboardData(analysisRes);
        setSnapshotData(snapshotRes);

        // Cache the results
        setCachedDashboard(analysisRes, snapshotRes);

        if (analysisRes.error) {
          console.log('[Dashboard] Error in analysis:', analysisRes.error);
          setError(analysisRes.error);
        }
      } catch (err: any) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error('[Dashboard] Caught error:', msg, err);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker]);

  // Safe extract analysis using the normalized shape
  const analysis = dashboardData?.analysis;
  const companyInfo = dashboardData?.companyInfo;

  // Calculate Company Score (40% Macro + 30% Micro + 30% Financial)
  const calculateCompanyScore = () => {
    if (!analysis && !snapshotData) return null;

    // Macro Score: Use macro_analysis confidence (0-100)
    const macroScore = analysis?.macroAnalysis?.confidence || null;

    // Micro Score: Use micro_analysis confidence (0-100)
    const microScore = analysis?.microAnalysis?.confidence || null;

    // Financial Score: Compute from ratios (normalize to 0-100)
    let financialScore: number | null = null;
    if (snapshotData) {
      const { pe_ratio, roe, dividend_yield } = snapshotData;
      let score = 50; // Start at neutral

      // PE Ratio: Lower is better (normalize: 0-30 range, inverted)
      if (pe_ratio !== null && pe_ratio > 0) {
        const peScore = Math.max(0, Math.min(100, 100 - (pe_ratio / 30) * 100));
        score += (peScore - 50) * 0.4;
      }

      // ROE: Higher is better (normalize: 0-30% range)
      if (roe !== null) {
        const roeScore = Math.max(0, Math.min(100, (roe / 30) * 100));
        score += (roeScore - 50) * 0.4;
      }

      // Dividend Yield: Higher is better (normalize: 0-10% range)
      if (dividend_yield !== null) {
        const divScore = Math.max(0, Math.min(100, (dividend_yield / 10) * 100));
        score += (divScore - 50) * 0.2;
      }

      financialScore = Math.max(0, Math.min(100, score));
    }

    // Calculate weighted score with dynamic weight adjustment
    const components = [
      { score: macroScore, weight: 0.4, name: 'Macro' },
      { score: microScore, weight: 0.3, name: 'Micro' },
      { score: financialScore, weight: 0.3, name: 'Financial' }
    ];

    const available = components.filter(c => c.score !== null);
    if (available.length === 0) return null;

    // Re-normalize weights
    const totalWeight = available.reduce((sum, c) => sum + c.weight, 0);
    const finalScore = available.reduce((sum, c) => {
      const normalizedWeight = c.weight / totalWeight;
      return sum + (c.score! * normalizedWeight);
    }, 0);

    return {
      finalScore: Math.round(finalScore * 10) / 10,
      macroScore,
      microScore,
      financialScore,
      componentsAvailable: available.length
    };
  };

  const companyScore = calculateCompanyScore();

  const handleOpenAI = () => {
    // Set context from current analysis if available
    if (analysis) {
      setAiContext({
        ticker: ticker || 'UNKNOWN',
        signal: 'General market analysis',
        signalType: 'general',
        analysis: dashboardData?.analysis,
        company_name: companyNameDisplay
      });
    }
    setAiOpen(true);
  };

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
                color: '#6b7280'
              }}>
                {tickerDisplay}
              </span>
              <span style={{ fontSize: '16px', color: '#6b7280' }}>
                {sector}
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
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
            {companyInfo && companyInfo.ticker && (
              <button
                onClick={async () => {
                  // For energy sector companies, use common peers
                  const defaultPeers = companyInfo.ticker === 'DAYANG.KL' ? 'WASCO,DELEUM' :
                    companyInfo.ticker === 'WASCO.KL' ? 'DAYANG,DELEUM' :
                      companyInfo.ticker === 'DELEUM.KL' ? 'DAYANG,WASCO' :
                        companyInfo.ticker === 'KEYFIELD.KL' ? 'DAYANG,WASCO' :
                          'DAYANG,WASCO'; // default

                  navigate(`/peer-comparison?ticker=${companyInfo.ticker}&company=${companyInfo.companyName || companyInfo.ticker}&peers=${defaultPeers}`);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#111827',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                📊 Compare with Peers
              </button>
            )}
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

        {/* Company Score Card */}
        {companyScore && (
          <div style={{
            marginBottom: '32px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            padding: '32px',
            color: 'white',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '16px',
              opacity: 0.9
            }}>
              Company Score
            </h2>

            {/* Final Score */}
            <div style={{
              fontSize: '72px',
              fontWeight: '800',
              lineHeight: '1',
              marginBottom: '8px'
            }}>
              {companyScore.finalScore}
            </div>

            {/* Caption */}
            <div style={{
              fontSize: '14px',
              opacity: 0.9,
              marginBottom: '24px'
            }}>
              40% Macro • 30% Micro • 30% Financial
            </div>

            {/* Component Scores */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              {companyScore.macroScore !== null && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '12px'
                }}>
                  <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>Macro</div>
                  <div style={{ fontSize: '24px', fontWeight: '700' }}>{companyScore.macroScore.toFixed(1)}</div>
                </div>
              )}
              {companyScore.microScore !== null && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '12px'
                }}>
                  <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>Micro</div>
                  <div style={{ fontSize: '24px', fontWeight: '700' }}>{companyScore.microScore.toFixed(1)}</div>
                </div>
              )}
              {companyScore.financialScore !== null && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '12px'
                }}>
                  <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>Financial</div>
                  <div style={{ fontSize: '24px', fontWeight: '700' }}>{companyScore.financialScore.toFixed(1)}</div>
                </div>
              )}
            </div>
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
      </div>

      {/* Media Queries for Mobile Responsiveness */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns: 3fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Floating Chatbot */}
      <FloatingChatbot />
    </div>
  );
};