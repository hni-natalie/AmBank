import { NewsSignal } from '../../mock/resultJob';
import { getSentimentBadgeClass } from '../../utils/sentiment';
import styles from './SignalCard.module.css';

interface SignalCardProps {
  signal: NewsSignal;
  onCitationClick: (citationId: string) => void;
}

export function SignalCard({ signal, onCitationClick }: SignalCardProps) {
  const formatDate = (dateISO: string) => {
    const date = new Date(dateISO);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const sentimentMap: Record<string, string> = {
    POSITIVE: 'Positive',
    NEUTRAL: 'Neutral',
    ADVERSE: 'Adverse'
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h4 className={styles.title}>{signal.title}</h4>
        <span className={getSentimentBadgeClass(sentimentMap[signal.sentiment] as 'Positive' | 'Neutral' | 'Adverse')}>
          {sentimentMap[signal.sentiment]}
        </span>
      </div>
      <div className={styles.meta}>
        <span className={styles.date}>{formatDate(signal.dateISO)}</span>
        <span className={styles.source}>{signal.source}</span>
      </div>
      <div className={styles.topics}>
        {signal.topics.map((topic) => (
          <span key={topic} className={styles.topicChip}>
            {topic}
          </span>
        ))}
      </div>
      <p className={styles.rationale}>{signal.rationale}</p>
      {signal.entities.length > 0 && (
        <div className={styles.entities}>
          {signal.entities.map((entity) => (
            <span key={entity} className={styles.entityChip}>
              {entity}
            </span>
          ))}
        </div>
      )}
      {signal.citations.length > 0 && (
        <div className={styles.citations}>
          <span className={styles.citationsLabel}>Evidence:</span>
          {signal.citations.map((citation) => (
            <button
              key={citation.id}
              type="button"
              onClick={() => onCitationClick(citation.id)}
              className={styles.citationChip}
            >
              {citation.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
