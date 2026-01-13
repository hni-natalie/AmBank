import { useNavigate } from 'react-router-dom';
import { FinalCompany } from '../../mock/finalList';
import { CompanyScoreBreakdown } from './CompanyScoreBreakdown';
import styles from './FinalCompanyTable.module.css';

interface FinalCompanyTableProps {
  companies: FinalCompany[];
  onEvidenceClick: (company: FinalCompany) => void;
  onWatchlistToggle: (ticker: string) => void;
}

export function FinalCompanyTable({
  companies,
  onEvidenceClick,
  onWatchlistToggle
}: FinalCompanyTableProps) {
  const navigate = useNavigate();

  const handleCompanyClick = (ticker: string) => {
    navigate(`/company/${ticker}`);
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'BUY':
        return '#10b981';
      case 'WATCH':
        return '#f59e0b';
      case 'AVOID':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.headerCell}>Rank</th>
            <th className={styles.headerCell}>Ticker / Name</th>
            <th className={styles.headerCell}>Rating</th>
            <th className={styles.headerCell}>Score</th>
            <th className={styles.headerCell}>Score Breakdown</th>
            <th className={styles.headerCell}>Rationale</th>
            <th className={styles.headerCell}>Flags</th>
            <th className={styles.headerCell}>WATCHLIST</th>
            <th className={styles.headerCell}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company, index) => (
            <tr key={company.ticker} className={styles.row}>
              <td className={styles.rankCell}>
                <span className={styles.rankNumber}>{index + 1}</span>
              </td>
              <td className={styles.tickerCell}>
                <div className={styles.tickerName}>
                  <span
                    className={styles.ticker}
                    onClick={() => handleCompanyClick(company.ticker)}
                  >
                    {company.ticker}
                  </span>
                  <span className={styles.name}>{company.name}</span>
                </div>
              </td>
              <td className={styles.cell}>
                <span
                  className={styles.ratingBadge}
                  style={{ backgroundColor: getRatingColor(company.rating) }}
                >
                  {company.rating}
                </span>
              </td>
              <td className={styles.scoreCell}>
                <span className={styles.scoreValue}>{company.score}</span>
              </td>
              <td className={styles.breakdownCell}>
                <CompanyScoreBreakdown company={company} />
              </td>
              <td className={styles.rationaleCell}>
                <span className={styles.rationaleText}>{company.rationale}</span>
              </td>
              <td className={styles.flagsCell}>
                <div className={styles.flags}>
                  {company.flags.map((flag) => (
                    <span key={flag} className={styles.flagChip}>
                      {flag}
                    </span>
                  ))}
                </div>
              </td>
              <td className={styles.watchlistCell}>
                <button
                  onClick={() => onWatchlistToggle(company.ticker)}
                  className={`${styles.starButton} ${company.watchlisted ? styles.starButtonFilled : ''}`}
                  title={company.watchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
                  aria-label={company.watchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
                >
                  {company.watchlisted ? '★' : '☆'}
                </button>
              </td>
              <td className={styles.actionsCell}>
                <div className={styles.actions}>
                  <button
                    onClick={() => handleCompanyClick(company.ticker)}
                    className={styles.viewButton}
                  >
                    View Company 360
                  </button>
                  <button
                    onClick={() => onEvidenceClick(company)}
                    className={styles.evidenceButton}
                  >
                    Evidence
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
