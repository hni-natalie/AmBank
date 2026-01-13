import { useNavigate } from 'react-router-dom';
import styles from './ActionCards.module.css';

interface ActionCardsProps {
  selectedSector: string;
  onNoSectorClick: () => void;
}

export function ActionCards({ selectedSector, onNoSectorClick }: ActionCardsProps) {
  const navigate = useNavigate();

  const handleNewsClick = () => {
    if (!selectedSector) {
      onNoSectorClick();
      return;
    }
    navigate(`/news?sector=${encodeURIComponent(selectedSector)}`);
  };

  const handleCompaniesClick = () => {
    if (!selectedSector) {
      onNoSectorClick();
      return;
    }
    navigate(`/companies?sector=${encodeURIComponent(selectedSector)}`);
  };

  return (
    <div className={styles.container}>
      <div
        className={`${styles.card} ${!selectedSector ? styles.disabled : ''}`}
        onClick={handleNewsClick}
      >
        <h3 className={styles.cardTitle}>Sector News & Signals</h3>
        <p className={styles.cardDescription}>
          Macro + micro news, sentiment analysis, rationale, and citations
        </p>
      </div>
      <div
        className={`${styles.card} ${!selectedSector ? styles.disabled : ''}`}
        onClick={handleCompaniesClick}
      >
        <h3 className={styles.cardTitle}>Top Companies (Fundamentals)</h3>
        <p className={styles.cardDescription}>
          Annual report parsing, financial ratios, and trend analysis
        </p>
      </div>
    </div>
  );
}
