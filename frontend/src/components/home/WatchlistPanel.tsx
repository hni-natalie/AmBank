import { useNavigate } from 'react-router-dom';
import { WatchlistItem } from '../../utils/watchlist';
import styles from './WatchlistPanel.module.css';

interface WatchlistPanelProps {
  watchlist: WatchlistItem[];
  onRemove: (ticker: string) => void;
}

export function WatchlistPanel({ watchlist, onRemove }: WatchlistPanelProps) {
  const navigate = useNavigate();

  const handleView = (ticker: string) => {
    navigate(`/company/${ticker}`);
  };

  if (watchlist.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Watchlist</h3>
        <div className={styles.emptyState}>
          <p>No companies in watchlist yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Watchlist</h3>
      <div className={styles.list}>
        {watchlist.map((item) => (
          <div key={item.ticker} className={styles.item}>
            <div className={styles.itemContent}>
              <div className={styles.itemHeader}>
                <span className={styles.ticker}>{item.ticker}</span>
              </div>
              <div className={styles.itemDetails}>
                <span className={styles.name}>{item.name}</span>
                <span className={styles.sector}>{item.sector}</span>
              </div>
            </div>
            <div className={styles.actions}>
              <button
                onClick={() => handleView(item.ticker)}
                className={styles.viewButton}
              >
                View
              </button>
              <button
                onClick={() => onRemove(item.ticker)}
                className={styles.removeButton}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
