import { FinalCompany } from '../../mock/finalList';
import styles from './CompanyScoreBreakdown.module.css';

interface CompanyScoreBreakdownProps {
  company: FinalCompany;
}

export function CompanyScoreBreakdown({ company }: CompanyScoreBreakdownProps) {
  const { fundamentals, news, riskPenalty } = company.breakdown;

  // Calculate percentages for visualization (assuming max score is 100)
  const fundamentalsPercent = (fundamentals / 100) * 100;
  const newsPercent = (news / 100) * 100;
  const riskPercent = Math.abs((riskPenalty / 100) * 100);

  return (
    <div className={styles.container}>
      <div className={styles.barContainer}>
        <div className={styles.bar}>
          <div
            className={styles.segment}
            style={{
              width: `${fundamentalsPercent}%`,
              backgroundColor: '#10b981'
            }}
            title={`Fundamentals: ${fundamentals}`}
          />
          <div
            className={styles.segment}
            style={{
              width: `${newsPercent}%`,
              backgroundColor: '#3b82f6'
            }}
            title={`News: ${news}`}
          />
          {riskPenalty < 0 && (
            <div
              className={styles.segment}
              style={{
                width: `${riskPercent}%`,
                backgroundColor: '#ef4444'
              }}
              title={`Risk Penalty: ${riskPenalty}`}
            />
          )}
        </div>
      </div>
      <div className={styles.labels}>
        <div className={styles.labelItem}>
          <span className={styles.labelDot} style={{ backgroundColor: '#10b981' }} />
          <span className={styles.labelText}>Fundamentals: {fundamentals}</span>
        </div>
        <div className={styles.labelItem}>
          <span className={styles.labelDot} style={{ backgroundColor: '#3b82f6' }} />
          <span className={styles.labelText}>News: {news}</span>
        </div>
        {riskPenalty < 0 && (
          <div className={styles.labelItem}>
            <span className={styles.labelDot} style={{ backgroundColor: '#ef4444' }} />
            <span className={styles.labelText}>Risk: {riskPenalty}</span>
          </div>
        )}
      </div>
    </div>
  );
}
