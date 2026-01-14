import { FeatureCards } from '../components/landing/FeatureCards';
import styles from './LandingPage.module.css';

export function LandingPage() {

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.content}>
          <div className={styles.headerSection}>
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
              Assess a company quickly, then monitor watchlisted companies for major events.
            </p>
          </div>

          <FeatureCards />
        </div>
      </main>
    </div>
  );
}
