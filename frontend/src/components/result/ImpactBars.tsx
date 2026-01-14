import styles from './ImpactBars.module.css';

interface ImpactBarsProps {
  scores: {
    fundamentals: number;
    news: number;
    riskPenalty: number;
  };
}

export function ImpactBars({ scores }: ImpactBarsProps) {
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Signal Impact Analysis</h3>
      
      <div className={styles.barGroup}>
        {/* Fundamentals */}
        <div className={styles.barRow}>
          <span className={styles.label}>Fundamentals</span>
          <div className={styles.barTrack}>
            <div 
              className={styles.barFill} 
              style={{ width: `${scores.fundamentals}%`, backgroundColor: '#3b82f6' }} 
            />
          </div>
          <span className={styles.score}>{scores.fundamentals}</span>
        </div>

        {/* News Sentiment */}
        <div className={styles.barRow}>
          <span className={styles.label}>News Sentiment</span>
          <div className={styles.barTrack}>
            <div 
              className={styles.barFill} 
              style={{ width: `${scores.news}%`, backgroundColor: '#10b981' }} 
            />
          </div>
          <span className={styles.score}>{scores.news}</span>
        </div>

        {/* Risk Penalty (Negative) */}
        <div className={styles.barRow}>
          <span className={styles.label}>Risk Penalty</span>
          <div className={styles.barTrack}>
             {/* Render "negative" bar by coloring it red and maybe different alignment? 
                 or just absolute width for simplicity since visual "impact" is magnitude.
             */}
            <div 
              className={styles.barFill} 
              style={{ width: `${Math.abs(scores.riskPenalty)}%`, backgroundColor: '#ef4444' }} 
            />
          </div>
          <span className={`${styles.score} ${styles.redText}`}>{scores.riskPenalty}</span>
        </div>
      </div>
    </div>
  );
}
