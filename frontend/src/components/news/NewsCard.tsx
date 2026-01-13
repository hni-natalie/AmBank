import { NewsItem, Sentiment } from '../../mock/news';
import { getSentimentBadgeClass } from '../../utils/sentiment';
import styles from './NewsCard.module.css';

interface NewsCardProps {
  news: NewsItem;
  onSave?: (id: string) => void;
  isSaved?: boolean;
}

export function NewsCard({ news, onSave, isSaved }: NewsCardProps) {
  const handleOpen = () => {
    window.open(news.url, '_blank', 'noopener,noreferrer');
  };

  const handleSave = () => {
    if (onSave && !isSaved) {
      onSave(news.id);
    }
  };

  const formatDate = (dateISO: string) => {
    const date = new Date(dateISO);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const sentimentMap: Record<Sentiment, string> = {
    POSITIVE: 'Positive',
    NEUTRAL: 'Neutral',
    ADVERSE: 'Adverse'
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title} onClick={handleOpen}>
          {news.title}
        </h3>
        <div className={styles.meta}>
          <span className={styles.source}>{news.source}</span>
          <span className={styles.separator}>•</span>
          <span className={styles.date}>{formatDate(news.dateISO)}</span>
        </div>
      </div>

      <div className={styles.badges}>
        <span className={getSentimentBadgeClass(sentimentMap[news.sentiment] as 'Positive' | 'Neutral' | 'Adverse')}>
          {sentimentMap[news.sentiment]}
        </span>
        {news.topics.slice(0, 3).map((topic) => (
          <span key={topic} className={styles.topicChip}>
            {topic}
          </span>
        ))}
      </div>

      <div className={styles.rationale}>
        {news.rationale}
      </div>

      {news.entities.length > 0 && (
        <div className={styles.entities}>
          <span className={styles.entitiesLabel}>Entities:</span>
          {news.entities.map((entity) => (
            <span key={entity} className={styles.entityChip}>
              {entity}
            </span>
          ))}
        </div>
      )}

      <div className={styles.evidence}>
        <span className={styles.evidenceLabel}>Evidence:</span>
        <a
          href={news.url}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.evidenceLink}
        >
          View Source
        </a>
      </div>

      <div className={styles.actions}>
        <button onClick={handleOpen} className={styles.openButton}>
          Open
        </button>
        <button
          onClick={handleSave}
          className={styles.saveButton}
          disabled={isSaved}
        >
          {isSaved ? 'Saved' : 'Save to watchlist'}
        </button>
      </div>
    </div>
  );
}
