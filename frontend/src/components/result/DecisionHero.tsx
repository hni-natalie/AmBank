import { AssessmentResult } from '../../mock/resultJob';
import styles from './DecisionHero.module.css';

interface DecisionHeroProps {
  result: AssessmentResult;
}

export function DecisionHero({ result }: DecisionHeroProps) {
  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'CONNECT':
        return '#10b981'; // green
      case 'CAUTION':
        return '#f59e0b'; // amber
      case 'AVOID':
        return '#ef4444'; // red
      default:
        return '#64748b';
    }
  };

  const formatDate = (dateISO?: string) => {
    if (!dateISO) return 'Just now';
    const date = new Date(dateISO);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className={styles.container}>
      <div className={styles.decisionBadge} style={{ backgroundColor: getDecisionColor(result.decision) }}>
        {result.decision}
      </div>
      <div className={styles.confidenceScore}>
        <span className={styles.scoreValue}>{result.confidence}</span>
        <span className={styles.scoreMax}>/100</span>
      </div>
      <p className={styles.summary}>{result.summary}</p>
      <div className={styles.metaChips}>
        {result.company.sector && (
          <span className={styles.chip}>{result.company.sector}</span>
        )}
        {result.company.ticker && (
          <span className={styles.chip}>{result.company.ticker}</span>
        )}
        <span className={styles.chip}>Updated: {formatDate()}</span>
      </div>
      <div className={styles.confidenceExplanation}>
        Based on source coverage + recency + extraction confidence.
      </div>
    </div>
  );
}
