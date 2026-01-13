import { AssessCompanyCard } from './AssessCompanyCard';
import { MonitorWatchlistCard } from './MonitorWatchlistCard';
import styles from './FeatureCards.module.css';

export function FeatureCards() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <AssessCompanyCard />
      </div>
      <div className={styles.card}>
        <MonitorWatchlistCard />
      </div>
    </div>
  );
}
