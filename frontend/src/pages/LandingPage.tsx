import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FeatureCards } from '../components/landing/FeatureCards';
import styles from './LandingPage.module.css';

export function LandingPage() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<'RM' | 'Analyst'>('RM');

  const handleGoToMonitor = () => {
    navigate('/monitor');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.productName}>Relationship Intelligence Copilot</span>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.roleToggle}>
            <button
              type="button"
              className={`${styles.roleButton} ${userRole === 'RM' ? styles.roleButtonActive : ''}`}
              onClick={() => setUserRole('RM')}
            >
              RM
            </button>
            <button
              type="button"
              className={`${styles.roleButton} ${userRole === 'Analyst' ? styles.roleButtonActive : ''}`}
              onClick={() => setUserRole('Analyst')}
            >
              Analyst
            </button>
          </div>
          <button
            type="button"
            onClick={handleGoToMonitor}
            className={styles.monitorButton}
          >
            Monitor
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.content}>
          <div className={styles.headerSection}>
            <h1 className={styles.title}>Relationship Decision & Monitoring</h1>
            <p className={styles.subtitle}>
              Assess a company quickly, then monitor watchlisted companies for major events.
            </p>
          </div>

          <FeatureCards />
        </div>
      </main>
    </div>
  );
}
