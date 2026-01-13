import { AssessmentResult } from '../../mock/resultJob';
import styles from './DashboardInsights.module.css';

interface DashboardInsightsProps {
  result: AssessmentResult;
}

export function DashboardInsights({ result }: DashboardInsightsProps) {
  // Debug: Log to ensure component is rendering
  console.log('DashboardInsights rendering with result:', result);
  console.log('DashboardInsights - reasonsYes:', result?.reasonsYes);
  console.log('DashboardInsights - reasonsNo:', result?.reasonsNo);
  
  if (!result) {
    console.error('DashboardInsights: No result provided!');
    return <div className={styles.container} style={{ padding: '20px', backgroundColor: '#fee2e2', color: '#991b1b' }}>ERROR: No result data available</div>;
  }

  const getSentimentPosition = (decision: string) => {
    const decisionLower = decision.toLowerCase();
    if (decisionLower === 'connect') {
      return 80; // Bullish side
    } else if (decisionLower === 'avoid') {
      return 20; // Bearish side
    } else {
      return 50; // Neutral/Cautious
    }
  };

  const getStanceColor = (decision: string) => {
    const decisionLower = decision.toLowerCase();
    if (decisionLower === 'connect') {
      return '#10b981'; // Green
    } else if (decisionLower === 'avoid') {
      return '#ef4444'; // Red
    } else {
      return '#f59e0b'; // Yellow/Orange
    }
  };

  const getSignalStrength = (decision: string) => {
    const decisionLower = decision.toLowerCase();
    if (decisionLower === 'connect') {
      return 'BULLISH';
    } else if (decisionLower === 'avoid') {
      return 'BEARISH';
    } else {
      return 'CAUTIOUS';
    }
  };

  // Extract adverse signals from reasonsNo
  const adverseSignals = result.reasonsNo?.map((r) => r.text) || [];
  // Extract positive signals from reasonsYes
  const positiveSignals = result.reasonsYes?.map((r) => r.text) || [];

  // If no data, show a message
  if (adverseSignals.length === 0 && positiveSignals.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.sentimentSection}>
          <h3 className={styles.sectionTitle}>Overall Sentiment</h3>
          <div className={styles.sentimentBarContainer}>
            <div className={styles.sentimentBar}>
              <div className={styles.barLabel}>Bearish</div>
              <div className={styles.barLabelRight}>Bullish</div>
              
              {/* Sentiment Indicator */}
              <div
                className={styles.sentimentIndicator}
                style={{ left: `${getSentimentPosition(result.decision)}%` }}
              >
                <div className={styles.indicatorIcon}>⚠️</div>
                <div
                  className={styles.indicatorLabel}
                  style={{ color: getStanceColor(result.decision) }}
                >
                  {getSignalStrength(result.decision)}
                </div>
              </div>
            </div>
          </div>
        </div>
        <p style={{ padding: '20px', color: '#64748b', fontSize: '14px' }}>
          No detailed insights available yet.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container} style={{ minHeight: '200px' }}>
      {/* Overall Sentiment Section */}
      <div className={styles.sentimentSection}>
        <h3 className={styles.sectionTitle}>Overall Sentiment</h3>
        <div className={styles.sentimentBarContainer}>
          <div className={styles.sentimentBar}>
            <div className={styles.barLabel}>Bearish</div>
            <div className={styles.barLabelRight}>Bullish</div>
            
            {/* Sentiment Indicator */}
            <div
              className={styles.sentimentIndicator}
              style={{ left: `${getSentimentPosition(result.decision)}%` }}
            >
              <div className={styles.indicatorIcon}>⚠️</div>
              <div
                className={styles.indicatorLabel}
                style={{ color: getStanceColor(result.decision) }}
              >
                {getSignalStrength(result.decision)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Market Signals (Detailed list - hidden by default, shown in accordion) */}
      <div className={styles.developmentsSection}>
         {/* We can reuse the existing card logic but just for the detailed view */}
         <div className={styles.developmentsList}>
           {/* Adverse Signals */}
           {adverseSignals.map((signal, idx) => (
              <div key={`adverse-${idx}`} className={`${styles.developmentCard} ${styles.watchCard}`}>
                 <div className={styles.cardIcon}>⚠️</div>
                 <div className={styles.cardContent}>
                    <div className={styles.cardHeader}>
                       <h4 className={styles.cardTitle}>{signal.substring(0, 50)}...</h4>
                       <span className={`${styles.severityBadge} ${styles.watchBadge}`}>NEGATIVE</span>
                    </div>
                    <p className={styles.cardText}>{signal}</p>
                 </div>
              </div>
           ))}

           {/* Positive Signals */}
           {positiveSignals.map((signal, idx) => (
              <div key={`positive-${idx}`} className={`${styles.developmentCard} ${styles.opportunityCard}`}>
                 <div className={styles.cardIcon}>✅</div>
                 <div className={styles.cardContent}>
                    <div className={styles.cardHeader}>
                       <h4 className={styles.cardTitle}>{signal.substring(0, 50)}...</h4>
                       <span className={`${styles.severityBadge} ${styles.opportunityBadge}`}>POSITIVE</span>
                    </div>
                    <p className={styles.cardText}>{signal}</p>
                 </div>
              </div>
           ))}
         </div>
      </div>

      {/* Industry Trends & Macro Context */}
      <div className={styles.contextGrid}>
        {/* Industry Trends */}
        <div className={styles.contextCard}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>📄</span>
            <h3 className={styles.sectionTitleSmall}>Industry Trends</h3>
          </div>
          <div className={styles.trendsList}>
            <div className={styles.trendItem}>
              <span className={styles.trendLabel}>Sector Growth</span>
              <div className={styles.trendDot} style={{ backgroundColor: positiveSignals.length > adverseSignals.length ? '#10b981' : '#f59e0b' }} />
            </div>

            <div className={styles.trendItem}>
              <span className={styles.trendLabel}>Competition</span>
              <div className={styles.trendDot} style={{ backgroundColor: adverseSignals.length > 0 ? '#ef4444' : '#10b981' }} />
            </div>

            <div className={styles.trendItem}>
              <span className={styles.trendLabel}>Market Conditions</span>
              <div className={styles.trendDot} style={{ backgroundColor: result.decision === 'CONNECT' ? '#10b981' : result.decision === 'AVOID' ? '#ef4444' : '#f59e0b' }} />
            </div>
          </div>
        </div>

        {/* Macro Context */}
        <div className={styles.contextCard}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>🌍</span>
            <h3 className={styles.sectionTitleSmall}>Macro Context</h3>
          </div>
          <div className={styles.macroList}>
            <div className={styles.macroItem}>
              <span className={styles.macroLabel}>Interest Rates</span>
              <div className={styles.trendDot} style={{ backgroundColor: '#f59e0b' }} /> {/* Neutral default */}
            </div>

            <div className={styles.macroItem}>
              <span className={styles.macroLabel}>Economic Conditions</span>
              <div className={styles.trendDot} style={{ backgroundColor: '#10b981' }} /> {/* Positive default */}
            </div>

            <div className={styles.macroItem}>
              <span className={styles.macroLabel}>Market Sentiment</span>
              <div className={styles.trendDot} style={{ backgroundColor: getStanceColor(result.decision) }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
