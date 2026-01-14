import { Citation } from '../../mock/resultJob';
import styles from './EvidenceDrawer.module.css';

interface EvidenceDrawerProps {
  citation: Citation | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EvidenceDrawer({ citation, isOpen, onClose }: EvidenceDrawerProps) {
  if (!isOpen || !citation) {
    return null;
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'NEWS':
        return '#3b82f6';
      case 'BURSA':
        return '#10b981';
      case 'AR':
        return '#f59e0b';
      default:
        return '#64748b';
    }
  };

  const formatDate = (dateISO?: string) => {
    if (!dateISO) return 'N/A';
    const date = new Date(dateISO);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.drawer}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <span
              className={styles.typeBadge}
              style={{ backgroundColor: getTypeColor(citation.type) }}
            >
              {citation.type}
            </span>
            <h3 className={styles.title}>{citation.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.meta}>
            {citation.dateISO && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Date:</span>
                <span className={styles.metaValue}>{formatDate(citation.dateISO)}</span>
              </div>
            )}
            {citation.source && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Source:</span>
                <span className={styles.metaValue}>{citation.source}</span>
              </div>
            )}
            {citation.page && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Page:</span>
                <span className={styles.metaValue}>{citation.page}</span>
              </div>
            )}
          </div>

          <div className={styles.snippet}>
            <p className={styles.snippetText}>{citation.snippet}</p>
          </div>

          <a
            href={citation.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.openButton}
          >
            Open Evidence →
          </a>
        </div>
      </div>
    </>
  );
}
