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
      <main className={styles.main}>
        <div className={styles.content}>
          {/* Logo */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '24px'
          }}>
            <img
              src="/amprism-logo.png"
              alt="AmPrism Logo"
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                objectFit: 'cover',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
            />
          </div>

          <h1 className={styles.title}>AmPrism</h1>
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
