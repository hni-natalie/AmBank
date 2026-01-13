import { Company } from '../../mock/companies';
import styles from './ShortlistTray.module.css';

interface ShortlistTrayProps {
  companies: Company[];
  onRemove: (ticker: string) => void;
  onGenerateFinalList: () => void;
}

export function ShortlistTray({ companies, onRemove, onGenerateFinalList }: ShortlistTrayProps) {
  if (companies.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Final List</h3>
        <div className={styles.emptyState}>
          <p>No companies selected yet.</p>
          <p className={styles.emptyHint}>Add companies to build your final list.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Final List ({companies.length})</h3>
      <div className={styles.list}>
        {companies.map((company) => (
          <div key={company.ticker} className={styles.card}>
            <div className={styles.cardContent}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTicker}>{company.ticker}</span>
                <button
                  onClick={() => onRemove(company.ticker)}
                  className={styles.removeButton}
                  aria-label="Remove"
                >
                  ×
                </button>
              </div>
              <div className={styles.cardName}>{company.name}</div>
              <div className={styles.cardRating}>Rating: N/A</div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={onGenerateFinalList} className={styles.generateButton}>
        Generate Final List
      </button>
    </div>
  );
}
