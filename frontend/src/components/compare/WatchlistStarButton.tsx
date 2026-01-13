import { useState, useEffect } from 'react';
import { loadWatchlist, saveWatchlist, toggleWatchlist, WatchlistItem } from '../../utils/watchlist';
import styles from './WatchlistStarButton.module.css';

interface WatchlistStarButtonProps {
  ticker: string;
  name: string;
  sector?: string;
  onToggle?: (wasAdded: boolean, ticker: string) => void;
}

export function WatchlistStarButton({
  ticker,
  name,
  sector,
  onToggle
}: WatchlistStarButtonProps) {
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

  useEffect(() => {
    const currentWatchlist = loadWatchlist();
    setWatchlist(currentWatchlist);
    setIsWatchlisted(currentWatchlist.some((item) => item.ticker === ticker));
  }, [ticker]);

  const handleToggle = () => {
    const item: WatchlistItem = {
      ticker,
      name,
      sector: sector || ''
    };

    const { updated, wasAdded } = toggleWatchlist(item, watchlist);
    setWatchlist(updated);
    saveWatchlist(updated);
    setIsWatchlisted(wasAdded);

    if (onToggle) {
      onToggle(wasAdded, ticker);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`${styles.starButton} ${isWatchlisted ? styles.starButtonFilled : ''}`}
      title={isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
      aria-label={isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
    >
      {isWatchlisted ? '★' : '☆'}
    </button>
  );
}
