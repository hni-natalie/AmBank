import { FinancialRatios } from '../../mock/resultJob';
import styles from './SnapshotCards.module.css';

interface SnapshotCardsProps {
  ratios: FinancialRatios;
  flags: string[];
}

export function SnapshotCards({ ratios, flags }: SnapshotCardsProps) {
  // Determine indicators based on values (simplified logic)
  const isRoeStrong = ratios.roe > 15;
  const isDeLow = ratios.debtEquity < 0.5;
  const isProfitable = ratios.patMargin > 10;
  
  return (
    <div className={styles.container}>
      {/* Financial Strength */}
      <div className={styles.card}>
        <div className={styles.label}>Financial Strength</div>
        <div className={styles.valueRow}>
          <span className={styles.value}>Strong</span>
          <span className={`${styles.indicator} ${styles.green}`}>●</span>
        </div>
        <div className={styles.subtext}>Based on Z-score</div>
      </div>

      {/* Leverage */}
      <div className={styles.card}>
        <div className={styles.label}>Leverage (D/E)</div>
        <div className={styles.valueRow}>
          <span className={styles.value}>{ratios.debtEquity.toFixed(2)}x</span>
          <span className={`${styles.badge} ${isDeLow ? styles.greenBadge : styles.amberBadge}`}>
             {isDeLow ? 'Low' : 'Medium'}
          </span>
        </div>
        <div className={styles.subtext}>Industry avg: 0.6x</div>
      </div>

      {/* Profitability */}
      <div className={styles.card}>
        <div className={styles.label}>Profitability (ROE)</div>
        <div className={styles.valueRow}>
          <span className={styles.value}>{ratios.roe.toFixed(1)}%</span>
          <span className={styles.trendIcon}>{isProfitable ? '↗' : '→'}</span>
        </div>
        <div className={styles.subtext}>{isRoeStrong ? 'Above peers' : 'In line'}</div>
      </div>

      {/* Red Flags */}
      <div className={styles.card}>
        <div className={styles.label}>Key Red Flags</div>
        <div className={styles.valueRow}>
          <span className={`${styles.value} ${flags.length > 0 ? styles.redText : styles.grayText}`}>
            {flags.length}
          </span>
          {flags.length > 0 && <span className={styles.alertIcon}>⚠️</span>}
        </div>
        <div className={styles.subtext}>{flags.length === 0 ? 'Clean record' : 'Requires attention'}</div>
      </div>
    </div>
  );
}
