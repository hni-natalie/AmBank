import { FinalListData, MacroStance } from '../../mock/finalList';
import styles from './FinalSummaryHeader.module.css';

interface FinalSummaryHeaderProps {
  data: FinalListData;
}

export function FinalSummaryHeader({ data }: FinalSummaryHeaderProps) {
  const stanceMap: Record<MacroStance, { label: string; color: string }> = {
    NEUTRAL: { label: 'Neutral', color: '#64748b' },
    POSITIVE: { label: 'Positive', color: '#10b981' },
    CAUTIOUS: { label: 'Cautious', color: '#f59e0b' }
  };

  const stance = stanceMap[data.macroStance];

  const sentimentLabel = data.sectorSentimentScore >= 70 ? 'Positive' : 
                         data.sectorSentimentScore >= 50 ? 'Neutral' : 'Adverse';
  const sentimentColor = data.sectorSentimentScore >= 70 ? '#10b981' : 
                          data.sectorSentimentScore >= 50 ? '#64748b' : '#ef4444';

  return (
    <div className={styles.container}>
      <div className={styles.cards}>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Macro Stance</div>
          <div className={styles.cardValue} style={{ color: stance.color }}>
            {stance.label}
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Sector Sentiment</div>
          <div className={styles.cardValue} style={{ color: sentimentColor }}>
            {sentimentLabel} ({data.sectorSentimentScore})
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Companies Analyzed</div>
          <div className={styles.cardValue}>{data.analyzedCount}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Final Picks</div>
          <div className={styles.cardValue}>{data.finalCount}</div>
        </div>
      </div>

      <div className={styles.insights}>
        <h3 className={styles.insightsTitle}>Key Insights</h3>
        <ul className={styles.insightsList}>
          {data.insights.map((insight, index) => (
            <li key={index} className={styles.insightItem}>
              {insight}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
