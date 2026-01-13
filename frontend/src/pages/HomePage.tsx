import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SectorSelector } from '../components/home/SectorSelector';
import { WatchlistPanel } from '../components/home/WatchlistPanel';
import { ActionCards } from '../components/home/ActionCards';
import { loadWatchlist, saveWatchlist, removeFromWatchlist, WatchlistItem } from '../utils/watchlist';
import styles from './HomePage.module.css';

export function HomePage() {
  const location = useLocation();
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Load watchlist from localStorage on mount and when location changes (user navigates back)
  useEffect(() => {
    setWatchlist(loadWatchlist());
  }, [location]);

  const handleSectorChange = (sector: string) => {
    setSelectedSector(sector);
  };

  const handleRemoveFromWatchlist = (ticker: string) => {
    const updated = removeFromWatchlist(ticker, watchlist);
    setWatchlist(updated);
    saveWatchlist(updated);
    setToastMessage(`Removed ${ticker} from watchlist`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleNoSectorClick = () => {
    setToastMessage('Please select a sector first');
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.productName}>Investment Decision System</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.userRole}>Analyst</span>
          <button className={styles.settingsButton} aria-label="Settings">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16.25 10C16.25 10.4167 16.25 10.8333 16.25 11.25C16.25 11.6667 16.25 12.0833 16.25 12.5C16.25 12.9167 16.25 13.3333 16.25 13.75C16.25 14.1667 16.25 14.5833 16.25 15C16.25 15.4167 16.25 15.8333 16.25 16.25C16.25 16.6667 16.25 17.0833 16.25 17.5C16.25 17.9167 16.25 18.3333 16.25 18.75C16.25 19.1667 16.25 19.5833 16.25 20"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3.75 10C3.75 10.4167 3.75 10.8333 3.75 11.25C3.75 11.6667 3.75 12.0833 3.75 12.5C3.75 12.9167 3.75 13.3333 3.75 13.75C3.75 14.1667 3.75 14.5833 3.75 15C3.75 15.4167 3.75 15.8333 3.75 16.25C3.75 16.6667 3.75 17.0833 3.75 17.5C3.75 17.9167 3.75 18.3333 3.75 18.75C3.75 19.1667 3.75 19.5833 3.75 20"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10 3.75C10 3.33333 10 2.91667 10 2.5C10 2.08333 10 1.66667 10 1.25C10 0.833333 10 0.416667 10 0"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10 20C10 19.5833 10 19.1667 10 18.75C10 18.3333 10 17.9167 10 17.5C10 17.0833 10 16.6667 10 16.25C10 15.8333 10 15.4167 10 15C10 14.5833 10 14.1667 10 13.75C10 13.3333 10 12.9167 10 12.5C10 12.0833 10 11.6667 10 11.25C10 10.8333 10 10.4167 10 10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.content}>
          <h1 className={styles.title}>Qualitative Market Intelligence</h1>
          <p className={styles.subtitle}>
            Pick a sector to explore news signals and top-performing companies
          </p>

          <SectorSelector
            selectedSector={selectedSector}
            onSectorChange={handleSectorChange}
          />

          <ActionCards
            selectedSector={selectedSector}
            onNoSectorClick={handleNoSectorClick}
          />

          <WatchlistPanel
            watchlist={watchlist}
            onRemove={handleRemoveFromWatchlist}
          />
        </div>
      </main>

      {toastMessage && (
        <div className={styles.toast}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
