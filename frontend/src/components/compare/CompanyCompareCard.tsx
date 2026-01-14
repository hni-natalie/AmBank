import { CompanySummary } from '../../mock/peersJob';
import { WatchlistStarButton } from './WatchlistStarButton';
import styles from './CompanyCompareCard.module.css';

interface CompanyCompareCardProps {
  company: CompanySummary;
  isTarget?: boolean;
  onEvidenceClick: () => void;
  onWatchlistToggle?: (wasAdded: boolean, ticker: string) => void;
}

export function CompanyCompareCard({
  company,
  isTarget,
  onEvidenceClick,
  onWatchlistToggle
}: CompanyCompareCardProps) {
  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'CONNECT':
        return '#10b981';
      case 'CAUTION':
        return '#f59e0b';
      case 'AVOID':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  return (
    <div className={`${styles.container} ${isTarget ? styles.containerTarget : ''}`}>
      {isTarget && <div className={styles.targetBadge}>Target</div>}
      <div className={styles.header}>
        <div className={styles.companyInfo}>
          <h3 className={styles.companyName}>{company.name}</h3>
          <div className={styles.meta}>
            {company.ticker && <span className={styles.ticker}>{company.ticker}</span>}
            {company.sector && <span className={styles.sector}>{company.sector}</span>}
          </div>
        </div>
        <WatchlistStarButton
          ticker={company.ticker}
          name={company.name}
          sector={company.sector}
          onToggle={onWatchlistToggle}
        />
      </div>

      <div className={styles.decisionSection}>
        <span
          className={styles.decisionBadge}
          style={{ backgroundColor: getDecisionColor(company.decision) }}
        >
          {company.decision}
        </span>
        <div className={styles.confidenceScore}>
          <span className={styles.scoreValue}>{company.confidence}</span>
          <span className={styles.scoreMax}>/100</span>
        </div>
      </div>

      <div className={styles.kpis}>
        <div className={styles.kpiChip}>
          <span className={styles.kpiLabel}>ROE</span>
          <span className={styles.kpiValue}>{company.kpis.roe.toFixed(1)}%</span>
        </div>
        <div className={styles.kpiChip}>
          <span className={styles.kpiLabel}>D/E</span>
          <span className={styles.kpiValue}>{company.kpis.debtEquity.toFixed(2)}</span>
        </div>
        <div className={styles.kpiChip}>
          <span className={styles.kpiLabel}>PAT Margin</span>
          <span className={styles.kpiValue}>{company.kpis.patMargin.toFixed(1)}%</span>
        </div>
        <div className={styles.kpiChip}>
          <span className={styles.kpiLabel}>Sentiment</span>
          <span className={styles.kpiValue}>{company.kpis.sentiment30d}</span>
        </div>
      </div>

      {company.flags.length > 0 && (
        <div className={styles.flags}>
          {company.flags.map((flag) => (
            <span key={flag} className={styles.flagChip}>
              {flag}
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onEvidenceClick}
        className={styles.evidenceButton}
      >
        Evidence
      </button>
    </div>
  );
}
