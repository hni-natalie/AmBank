import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadWatchlist, WatchlistItem } from '../../utils/watchlist';
import styles from './MonitorWatchlistCard.module.css';

export function MonitorWatchlistCard() {
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

  useEffect(() => {
    setWatchlist(loadWatchlist());
  }, []);

  const handleGoToMonitor = () => {
    navigate('/monitor');
  };

  const previewItems = watchlist.slice(0, 3);

  return (
    <div className={styles.container}>
      <div className={styles.icon}>
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h3 className={styles.title}>Monitor Watchlist</h3>
      <p className={styles.description}>
        Track watchlisted companies and receive alerts on major events and sentiment changes.
      </p>

      <div className={styles.watchlistPreview}>
        {watchlist.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>
              No companies watchlisted yet. Add from Compare page.
            </p>
          </div>
        ) : (
          <div className={styles.previewList}>
            {previewItems.map((item) => (
              <div key={item.ticker || item.name} className={styles.previewItem}>
                <div className={styles.itemContent}>
                  <div className={styles.itemHeader}>
                    {item.ticker && (
                      <span className={styles.ticker}>{item.ticker}</span>
                    )}
                    <span className={styles.statusBadge}>Active</span>
                  </div>
                  <div className={styles.itemName}>{item.name}</div>
                  {item.sector && (
                    <div className={styles.itemSector}>{item.sector}</div>
                  )}
                </div>
              </div>
            ))}
            {watchlist.length > 3 && (
              <div className={styles.moreItems}>
                +{watchlist.length - 3} more companies
              </div>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleGoToMonitor}
        className={styles.primaryButton}
      >
        Go to Monitor
      </button>
    </div>
  );
}
