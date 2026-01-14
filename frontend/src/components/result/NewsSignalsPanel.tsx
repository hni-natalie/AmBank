import { useState, useMemo } from 'react';
import { NewsSignal } from '../../mock/resultJob';
import { SignalCard } from './SignalCard';
import styles from './NewsSignalsPanel.module.css';

interface NewsSignalsPanelProps {
  signals: NewsSignal[];
  onCitationClick: (citationId: string) => void;
}

export function NewsSignalsPanel({ signals, onCitationClick }: NewsSignalsPanelProps) {
  const [filter, setFilter] = useState<'All' | 'Adverse' | 'Positive'>('All');

  const filteredSignals = useMemo(() => {
    if (filter === 'All') return signals;
    return signals.filter((s) => s.sentiment === filter.toUpperCase());
  }, [signals, filter]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>News Signals</h3>
        <div className={styles.filterToggle}>
          <button
            type="button"
            className={`${styles.filterButton} ${filter === 'All' ? styles.filterButtonActive : ''}`}
            onClick={() => setFilter('All')}
          >
            All
          </button>
          <button
            type="button"
            className={`${styles.filterButton} ${filter === 'Adverse' ? styles.filterButtonActive : ''}`}
            onClick={() => setFilter('Adverse')}
          >
            Adverse
          </button>
          <button
            type="button"
            className={`${styles.filterButton} ${filter === 'Positive' ? styles.filterButtonActive : ''}`}
            onClick={() => setFilter('Positive')}
          >
            Positive
          </button>
        </div>
      </div>
      <div className={styles.signalsList}>
        {filteredSignals.length > 0 ? (
          filteredSignals.map((signal) => (
            <SignalCard
              key={signal.id}
              signal={signal}
              onCitationClick={onCitationClick}
            />
          ))
        ) : (
          <div className={styles.emptyState}>
            <p>No {filter.toLowerCase()} signals found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
