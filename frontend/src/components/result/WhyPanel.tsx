import { ReasonItem } from '../../mock/resultJob';
import styles from './WhyPanel.module.css';

interface WhyPanelProps {
  reasonsYes: ReasonItem[];
  reasonsNo: ReasonItem[];
  onCitationClick: (citationId: string) => void;
}

export function WhyPanel({
  reasonsYes,
  reasonsNo,
  onCitationClick
}: WhyPanelProps) {
  const handleCitationClick = (citationId: string) => {
    onCitationClick(citationId);
  };

  const renderCitations = (citations: Array<{ id: string; label: string }>) => {
    if (citations.length === 0) return null;

    // Show max 2 chips inline, then "+N" if more
    const visibleCitations = citations.slice(0, 2);
    const remainingCount = citations.length - 2;

    return (
      <div className={styles.citations}>
        {visibleCitations.map((citation) => (
          <button
            key={citation.id}
            type="button"
            onClick={() => handleCitationClick(citation.id)}
            className={styles.citationChip}
          >
            {citation.label}
          </button>
        ))}
        {remainingCount > 0 && (
          <button
            type="button"
            onClick={() => handleCitationClick(citations[2].id)}
            className={styles.citationChip}
            title={`${remainingCount} more citation${remainingCount > 1 ? 's' : ''}`}
          >
            +{remainingCount}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h3 className={styles.title}>Why Connect</h3>
        <ul className={styles.list}>
          {reasonsYes.map((reason, index) => (
            <li key={index} className={styles.listItem}>
              <span className={styles.reasonText}>{reason.text}</span>
              {renderCitations(reason.citations)}
            </li>
          ))}
        </ul>
      </div>

      <div className={`${styles.card} ${styles.cardCaution}`}>
        <h3 className={styles.title}>Why Caution</h3>
        {reasonsNo.length > 0 ? (
          <ul className={styles.list}>
            {reasonsNo.map((reason, index) => (
              <li key={index} className={styles.listItem}>
                <span className={styles.reasonText}>{reason.text}</span>
                {renderCitations(reason.citations)}
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyText}>No major concerns identified.</p>
        )}
      </div>
    </div>
  );
}
