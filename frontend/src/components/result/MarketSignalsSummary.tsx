import styles from './MarketSignalsSummary.module.css';

interface MarketSignalsSummaryProps {
  positiveCount: number;
  negativeCount: number;
}

export function MarketSignalsSummary({ positiveCount, negativeCount }: MarketSignalsSummaryProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.icon}>⚙️</span>
        <h3 className={styles.title}>Market Signals</h3>
      </div>
      
      <div className={styles.countsContainer}>
        <div className={styles.countRow}>
          <span className={styles.label}>Positive Signals</span>
          <span className={`${styles.value} ${styles.positive}`}>{positiveCount}</span>
        </div>
        
        <div className={styles.countRow}>
          <span className={styles.label}>Negative Signals</span>
          <span className={`${styles.value} ${styles.negative}`}>{negativeCount}</span>
        </div>
      </div>
    </div>
  );
}
